'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import PriceUpdateService from '@/lib/services/priceUpdateService';
import { useAppSelector } from '@/lib/redux/store';

interface StockPriceProps {
    symbol: string;
    companyName?: string;
    className?: string;
    showChange?: boolean;
    showRefresh?: boolean;
    autoRefresh?: boolean;
    size?: 'sm' | 'md' | 'lg';
    onPriceUpdate?: (price: number, change: number, changePercent: number, financialMetrics?: {
        marketCap?: number | null;
        trailingPE?: number | null;
        forwardPE?: number | null;
        priceToBook?: number | null;
    }) => void;
    onError?: (error: string) => void;
}

interface PriceData {
    price: number;
    change: number;
    changePercent: number;
    cached: boolean;
    timestamp: Date;
    // Financial metrics
    marketCap?: number | null;
    trailingPE?: number | null;
    forwardPE?: number | null;
    priceToBook?: number | null;
}

const StockPrice: React.FC<StockPriceProps> = ({
    symbol,
    companyName: _companyName,
    className,
    showChange = true,
    showRefresh = false,
    autoRefresh = false,
    size = 'md',
    onPriceUpdate,
    onError
}) => {
    const { priceUpdateSettings } = useAppSelector(state => state.settings);
    const [priceData, setPriceData] = useState<PriceData | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const fetchPrice = async (forceRefresh: boolean = false) => {
        if (!symbol || symbol.trim() === '') {
            setError('Invalid symbol');
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const result = forceRefresh
                ? await PriceUpdateService.forceFetchStockPrice(symbol)
                : await PriceUpdateService.getStockPrice(symbol, {
                    marketHoursOnly: priceUpdateSettings.marketHoursOnly,
                    checkHolidays: priceUpdateSettings.checkMarketHolidays
                });

            if (result.success && result.price !== undefined) {
                const newPriceData = {
                    price: result.price,
                    change: result.change || 0,
                    changePercent: result.changePercent || 0,
                    cached: result.cached || false,
                    timestamp: result.timestamp ? new Date(result.timestamp) : new Date(),
                    marketCap: result.marketCap,
                    trailingPE: result.trailingPE,
                    forwardPE: result.forwardPE,
                    priceToBook: result.priceToBook
                };

                setPriceData(newPriceData);

                if (onPriceUpdate) {
                    onPriceUpdate(newPriceData.price, newPriceData.change, newPriceData.changePercent, {
                        marketCap: newPriceData.marketCap,
                        trailingPE: newPriceData.trailingPE,
                        forwardPE: newPriceData.forwardPE,
                        priceToBook: newPriceData.priceToBook
                    });
                }
            } else {
                const errorMsg = result.error || 'Failed to fetch price';
                setError(errorMsg);
                if (onError) {
                    onError(errorMsg);
                }
            }
        } catch (err) {
            const errorMsg = err instanceof Error ? err.message : 'Unknown error';
            setError(errorMsg);
            if (onError) {
                onError(errorMsg);
            }
        } finally {
            setLoading(false);
        }
    };

    // Initial fetch
    useEffect(() => {
        if (symbol) {
            fetchPrice();
        }
    }, [symbol]);

    // Auto refresh using settings
    useEffect(() => {
        if (!autoRefresh || !symbol || !priceUpdateSettings.autoRefreshEnabled) return;

        const interval = setInterval(fetchPrice, priceUpdateSettings.refreshInterval);
        return () => clearInterval(interval);
    }, [autoRefresh, symbol, priceUpdateSettings.autoRefreshEnabled, priceUpdateSettings.refreshInterval]);

    const formatPrice = (price: number): string => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(price);
    };

    const formatChange = (change: number): string => {
        const sign = change >= 0 ? '+' : '';
        return `${sign}${change.toFixed(2)}`;
    };

    const formatChangePercent = (changePercent: number): string => {
        const sign = changePercent >= 0 ? '+' : '';
        return `${sign}${changePercent.toFixed(2)}%`;
    };

    const getTrendIcon = (change: number) => {
        if (change > 0) return <TrendingUp className="w-4 h-4" />;
        if (change < 0) return <TrendingDown className="w-4 h-4" />;
        return <Minus className="w-4 h-4" />;
    };

    const getTrendColor = (change: number) => {
        if (change > 0) return 'text-green-600 dark:text-green-400';
        if (change < 0) return 'text-red-600 dark:text-red-400';
        return 'text-gray-500 dark:text-gray-400';
    };

    const sizeClasses = {
        sm: 'text-sm',
        md: 'text-base',
        lg: 'text-lg'
    };

    if (error) {
        return (
            <div className={cn('flex items-center gap-2 text-red-600 dark:text-red-400', sizeClasses[size], className)}>
                <AlertCircle className="w-4 h-4" />
                <span>Error: {error}</span>
                {showRefresh && (
                    <button
                        onClick={() => fetchPrice(true)}
                        disabled={loading}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        title="Force retry (ignores market hours)"
                    >
                        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                    </button>
                )}
            </div>
        );
    }

    if (loading && !priceData) {
        return (
            <div className={cn('flex items-center gap-2 text-gray-500 dark:text-gray-400', sizeClasses[size], className)}>
                <RefreshCw className="w-4 h-4 animate-spin" />
                <span>Loading price...</span>
            </div>
        );
    }

    if (!priceData) {
        return (
            <div className={cn('flex items-center gap-2 text-gray-500 dark:text-gray-400', sizeClasses[size], className)}>
                <span>No price data</span>
                {showRefresh && (
                    <button
                        onClick={() => fetchPrice(true)}
                        disabled={loading}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                        title="Force fetch price (ignores market hours)"
                    >
                        <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
                    </button>
                )}
            </div>
        );
    }

    return (
        <div className={cn('flex items-center gap-2', sizeClasses[size], className)}>
            <div className="flex flex-col">
                <div className="flex items-center gap-2">
                    <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatPrice(priceData.price)}
                    </span>
                    {priceData.cached && (
                        <span className="text-xs text-gray-400 dark:text-gray-500 bg-gray-100 dark:bg-gray-800 px-1 rounded">
                            cached
                        </span>
                    )}
                    {showRefresh && (
                        <button
                            onClick={() => fetchPrice(true)}
                            disabled={loading}
                            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded transition-colors"
                            title="Force refresh price (ignores market hours)"
                        >
                            <RefreshCw className={cn('w-3 h-3', loading && 'animate-spin')} />
                        </button>
                    )}
                </div>

                {showChange && (
                    <div className={cn('flex items-center gap-1 text-sm', getTrendColor(priceData.change))}>
                        {getTrendIcon(priceData.change)}
                        <span>{formatChange(priceData.change)}</span>
                        <span>({formatChangePercent(priceData.changePercent)})</span>
                    </div>
                )}
            </div>

            {priceData.timestamp && (
                <div className="text-xs text-gray-400 dark:text-gray-500 ml-auto">
                    {priceData.timestamp.toLocaleTimeString()}
                </div>
            )}
        </div>
    );
};

export default StockPrice;