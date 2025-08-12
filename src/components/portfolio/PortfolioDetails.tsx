'use client';

import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/hooks';
import { addTransaction, loadPortfolios, updatePortfolioHoldingPrices } from '@/lib/redux/slices/portfoliosSlice';
import { loadPriceUpdateSettings } from '@/lib/redux/slices/settingsSlice';
import PriceUpdateService from '@/lib/services/priceUpdateService';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    ArrowLeft,
    Plus,
    RefreshCw
} from 'lucide-react';
import { Transaction } from '@/types';
import { AddTransactionDialog } from "@/components/portfolio/AddTransactionDialog";
import { TransactionHistory } from '@/components/portfolio/TransactionHistory';
import { PortfolioAllocation } from '@/components/portfolio/PortfolioAllocation';
import { HoldingsTable } from './HoldingsTable';
import { PortfolioSummary } from './PortfolioSummary';
import { toast } from 'sonner';

interface PortfolioDetailsProps {
    portfolioId: string;
    onBack: () => void;
}

export function PortfolioDetails({ portfolioId, onBack }: PortfolioDetailsProps) {
    const dispatch = useAppDispatch();
    const { data: portfolios } = useAppSelector(state => state.portfolios);
    const { priceUpdateSettings, loading: settingsLoading } = useAppSelector(state => state.settings);
    const [showAddTransaction, setShowAddTransaction] = useState(false);
    const [refreshingPrices, setRefreshingPrices] = useState(false);

    // Get the current portfolio from Redux state
    const portfolio = portfolios.find(p => p.id === portfolioId);

    // Use refs to store current values without causing re-renders
    const settingsRef = useRef(priceUpdateSettings);
    const intervalRef = useRef<NodeJS.Timeout | null>(null);
    const portfolioRef = useRef(portfolio);

    // Update refs when values change
    useEffect(() => {
        settingsRef.current = priceUpdateSettings;
    }, [priceUpdateSettings]);

    useEffect(() => {
        portfolioRef.current = portfolio;
    }, [portfolio]);

    // Reload portfolios when component mounts to ensure we have latest data
    useEffect(() => {
        dispatch(loadPortfolios());
        dispatch(loadPriceUpdateSettings());
    }, [dispatch]);

    if (!portfolio) {
        return (
            <div className="flex items-center justify-center h-64">
                <p className="text-muted-foreground">Portfolio not found</p>
            </div>
        );
    }



    const handleAddTransaction = async (transaction: Omit<Transaction, 'id'>) => {
        try {
            const newTransaction: Transaction = {
                ...transaction,
                id: `tx_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
            };

            await dispatch(addTransaction({
                portfolioId: portfolioId,
                transaction: newTransaction
            })).unwrap();

            // Reload portfolios to get the updated data
            await dispatch(loadPortfolios());

            setShowAddTransaction(false);
        } catch (error) {
            console.error('Failed to add transaction:', error);
        }
    };

    // Handle price refresh for portfolio holdings
    const handleRefreshPrices = useCallback(async (forceRefresh = false, showToast = true) => {
        if (!portfolio || portfolio.holdings.length === 0) return;

        setRefreshingPrices(true);
        try {
            const symbols = portfolio.holdings.map(holding => holding.symbol);
            const currentSettings = settingsRef.current;

            // Use PriceUpdateService to fetch bulk prices
            const bulkResult = forceRefresh
                ? await PriceUpdateService.forceFetchBulkStockPrices(symbols)
                : await PriceUpdateService.getBulkStockPrices(symbols, {
                    marketHoursOnly: currentSettings?.marketHoursOnly ?? true,
                    checkHolidays: currentSettings?.checkMarketHolidays ?? true
                });

            if (bulkResult.results && bulkResult.results.length > 0) {
                const priceUpdates = portfolio.holdings.map(holding => {
                    const formattedSymbol = holding.symbol.includes('.') ? holding.symbol : `${holding.symbol}.NS`;
                    const priceResult = bulkResult.results.find(result =>
                        result.symbol === formattedSymbol && result.success
                    );

                    if (priceResult && priceResult.price !== undefined) {
                        return {
                            symbol: holding.symbol,
                            currentPrice: priceResult.price,
                            priceChange: priceResult.change || 0,
                            priceChangePercent: priceResult.changePercent || 0,
                            // Include financial metrics from Yahoo Finance API
                            marketCap: priceResult.marketCap,
                            sector: priceResult.sector,
                            industry: priceResult.industry,
                            trailingPE: priceResult.trailingPE,
                            forwardPE: priceResult.forwardPE,
                            priceToBook: priceResult.priceToBook,
                        };
                    }

                    return {
                        symbol: holding.symbol,
                        currentPrice: holding.currentPrice,
                        priceChange: 0,
                        priceChangePercent: 0,
                    };
                }).filter(update => update.currentPrice > 0);

                if (priceUpdates.length > 0) {
                    await dispatch(updatePortfolioHoldingPrices({
                        portfolioId: portfolio.id,
                        priceUpdates,
                    })).unwrap();

                    if (showToast) {
                        const successCount = bulkResult.totalSuccess;
                        const cachedCount = bulkResult.totalCached;

                        if (successCount > 0) {
                            toast.success(
                                `Portfolio prices updated (${successCount} stocks${cachedCount > 0 ? `, ${cachedCount} from cache` : ''})`
                            );
                        } else if (forceRefresh) {
                            toast.warning('No portfolio prices were updated');
                        }
                    }
                }
            }
        } catch (error) {
            if (showToast) {
                toast.error('Failed to refresh portfolio prices');
            }
            console.error('Portfolio price refresh error:', error);
        } finally {
            setRefreshingPrices(false);
        }
    }, [dispatch, portfolio]);

    // Auto-refresh function using refs to avoid dependencies
    const autoRefreshPricesRef = useRef<(() => Promise<void>) | null>(null);

    // Update the ref function whenever dispatch changes
    useEffect(() => {
        autoRefreshPricesRef.current = async () => {
            const currentPortfolio = portfolioRef.current;
            if (!currentPortfolio || currentPortfolio.holdings.length === 0) return;

            try {
                const symbols = currentPortfolio.holdings.map(holding => holding.symbol);
                const currentSettings = settingsRef.current;

                const bulkResult = await PriceUpdateService.getBulkStockPrices(symbols, {
                    marketHoursOnly: currentSettings?.marketHoursOnly ?? true,
                    checkHolidays: currentSettings?.checkMarketHolidays ?? true
                });

                if (bulkResult.results && bulkResult.results.length > 0) {
                    const priceUpdates = currentPortfolio.holdings.map(holding => {
                        const formattedSymbol = holding.symbol.includes('.') ? holding.symbol : `${holding.symbol}.NS`;
                        const priceResult = bulkResult.results.find(result =>
                            result.symbol === formattedSymbol && result.success
                        );

                        if (priceResult && priceResult.price !== undefined) {
                            return {
                                symbol: holding.symbol,
                                currentPrice: priceResult.price,
                                priceChange: priceResult.change || 0,
                                priceChangePercent: priceResult.changePercent || 0,
                                // Include financial metrics from Yahoo Finance API
                                marketCap: priceResult.marketCap,
                                sector: priceResult.sector,
                                industry: priceResult.industry,
                                trailingPE: priceResult.trailingPE,
                                forwardPE: priceResult.forwardPE,
                                priceToBook: priceResult.priceToBook,
                            };
                        }

                        return {
                            symbol: holding.symbol,
                            currentPrice: holding.currentPrice,
                            priceChange: 0,
                            priceChangePercent: 0,
                        };
                    }).filter(update => update.currentPrice > 0);

                    if (priceUpdates.length > 0) {
                        await dispatch(updatePortfolioHoldingPrices({
                            portfolioId: currentPortfolio.id,
                            priceUpdates,
                        })).unwrap();
                    }
                }
            } catch (error) {
                console.error('Auto-refresh portfolio prices error:', error);
            }
        };
    }, [dispatch]);

    // Auto-refresh prices based on settings
    useEffect(() => {
        // Clear existing interval
        if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
        }

        // Wait for settings to load and ensure auto-refresh is enabled
        if (settingsLoading ||
            !priceUpdateSettings ||
            !priceUpdateSettings.autoRefreshEnabled ||
            !portfolio ||
            portfolio.holdings.length === 0) {
            return;
        }

        // Initial refresh when component mounts (silent)
        autoRefreshPricesRef.current?.();

        // Set up interval for auto-refresh
        intervalRef.current = setInterval(() => {
            console.log('Auto-refreshing portfolio prices...');
            autoRefreshPricesRef.current?.();
        }, priceUpdateSettings.refreshInterval);

        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, [
        portfolio?.holdings.length,
        settingsLoading,
        priceUpdateSettings?.autoRefreshEnabled,
        priceUpdateSettings?.refreshInterval
    ]);

    // Cleanup interval on unmount
    useEffect(() => {
        return () => {
            if (intervalRef.current) {
                clearInterval(intervalRef.current);
                intervalRef.current = null;
            }
        };
    }, []);



    return (
        <div className="space-y-6">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                    <Button variant="ghost" size="sm" onClick={onBack}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Back to Portfolios
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">{portfolio.name}</h1>
                        {portfolio.description && (
                            <p className="text-muted-foreground mt-1">{portfolio.description}</p>
                        )}
                    </div>
                </div>
                <div className="flex items-center gap-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRefreshPrices(true)}
                        disabled={refreshingPrices || !portfolio || portfolio.holdings.length === 0}
                    >
                        <RefreshCw className={`h-4 w-4 mr-2 ${refreshingPrices ? 'animate-spin' : ''}`} />
                        Refresh Prices
                    </Button>
                    <Button onClick={() => setShowAddTransaction(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Add Transaction
                    </Button>
                </div>
            </div>

            {/* Portfolio Summary */}
            <PortfolioSummary 
                portfolio={portfolio}
                onRefresh={() => handleRefreshPrices(true)}
                refreshing={refreshingPrices}
                lastUpdated={new Date()}
            />

            {/* Detailed Views */}
            <Tabs defaultValue="holdings" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="holdings">Holdings</TabsTrigger>
                    <TabsTrigger value="transactions">Transactions</TabsTrigger>
                    <TabsTrigger value="allocation">Allocation</TabsTrigger>
                </TabsList>

                <TabsContent value="holdings" className="space-y-4">
                    <HoldingsTable 
                        holdings={portfolio.holdings} 
                        onRefresh={() => handleRefreshPrices(true)}
                        refreshing={refreshingPrices}
                    />
                </TabsContent>

                <TabsContent value="transactions" className="space-y-4">
                    <TransactionHistory transactions={portfolio.transactions} />
                </TabsContent>

                <TabsContent value="allocation" className="space-y-4">
                    <PortfolioAllocation portfolio={portfolio} />
                </TabsContent>
            </Tabs>

            {/* Add Transaction Dialog */}
            <AddTransactionDialog
                open={showAddTransaction}
                onOpenChange={setShowAddTransaction}
                portfolioId={portfolioId}
                onSuccess={handleAddTransaction}
            />
        </div>
    );
}