'use client';

import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Portfolio, calculateNetInvested, calculatePortfolioDayPL } from '@/types';

interface MobilePortfolioSummaryProps {
    portfolio: Portfolio;
    loading?: boolean;
    onRefresh?: () => void;
    refreshing?: boolean;
    lastUpdated?: Date;
}

export function MobilePortfolioSummary({
    portfolio,
    loading = false,
    onRefresh,
    refreshing = false,
    lastUpdated
}: MobilePortfolioSummaryProps) {
    const formatCurrency = (amount: number) => {
        return new Intl.NumberFormat('en-IN', {
            style: 'currency',
            currency: 'INR',
            minimumFractionDigits: 0,
            maximumFractionDigits: 0,
        }).format(amount);
    };

    const formatPercentage = (value: number) => {
        // If the value is already in percentage format (> 1 or < -1), use it directly
        // If it's in decimal format (between -1 and 1), multiply by 100
        const percentValue = Math.abs(value) > 1 ? value : value * 100;
        return `${percentValue >= 0 ? '+' : ''}${percentValue.toFixed(2)}%`;
    };

    const formatTime = (date: Date) => {
        return new Intl.DateTimeFormat('en-IN', {
            hour: '2-digit',
            minute: '2-digit',
        }).format(date);
    };

    const netInvested = calculateNetInvested(portfolio.transactions);
    const dayPL = calculatePortfolioDayPL(portfolio);
    const dayPLPercent = netInvested > 0 ? (dayPL / netInvested) * 100 : 0;
    const totalPLPercent = netInvested > 0 ? (portfolio.totalReturn / netInvested) * 100 : 0;

    const isDayPositive = dayPL >= 0;
    const isTotalPositive = portfolio.totalReturn >= 0;

    if (loading) {
        return (
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <Card key={i}>
                        <CardContent className="p-4">
                            <div className="animate-pulse space-y-2">
                                <div className="h-3 bg-muted rounded w-1/3"></div>
                                <div className="h-6 bg-muted rounded w-2/3"></div>
                            </div>
                        </CardContent>
                    </Card>
                ))}
            </div>
        );
    }

    return (
        <div className="space-y-3">
            {/* Header Card */}
            <Card>
                <CardContent className="p-4">
                    <div className="flex items-center justify-between">
                        <div>
                            <h2 className="text-lg font-semibold">{portfolio.name}</h2>
                            {lastUpdated && (
                                <p className="text-xs text-muted-foreground">
                                    Updated: {formatTime(lastUpdated)}
                                </p>
                            )}
                        </div>
                        {onRefresh && (
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={onRefresh}
                                disabled={refreshing}
                            >
                                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
                            </Button>
                        )}
                    </div>
                </CardContent>
            </Card>

            {/* Current Value Card */}
            <Card>
                <CardContent className="p-4">
                    <div className="text-center">
                        <p className="text-sm text-muted-foreground mb-1">Current Value</p>
                        <p className="text-2xl font-bold">{formatCurrency(portfolio.currentValue)}</p>
                    </div>
                </CardContent>
            </Card>

            {/* P&L Cards */}
            <div className="grid grid-cols-2 gap-3">
                {/* Day's P&L */}
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                {isDayPositive ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                                <p className="text-xs text-muted-foreground">Day's P&L</p>
                            </div>
                            <p className={`text-lg font-bold ${isDayPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isDayPositive ? '+' : ''}{formatCurrency(dayPL)}
                            </p>
                            <p className={`text-xs ${isDayPositive ? 'text-green-600' : 'text-red-600'}`}>
                                ({formatPercentage(dayPLPercent)})
                            </p>
                        </div>
                    </CardContent>
                </Card>

                {/* Total P&L */}
                <Card>
                    <CardContent className="p-4">
                        <div className="text-center">
                            <div className="flex items-center justify-center gap-1 mb-1">
                                {isTotalPositive ? (
                                    <TrendingUp className="h-4 w-4 text-green-600" />
                                ) : (
                                    <TrendingDown className="h-4 w-4 text-red-600" />
                                )}
                                <p className="text-xs text-muted-foreground">Total P&L</p>
                            </div>
                            <p className={`text-lg font-bold ${isTotalPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isTotalPositive ? '+' : ''}{formatCurrency(portfolio.totalReturn)}
                            </p>
                            <p className={`text-xs ${isTotalPositive ? 'text-green-600' : 'text-red-600'}`}>
                                ({formatPercentage(totalPLPercent)})
                            </p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Investment Details */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                            <p className="text-muted-foreground mb-1">Invested</p>
                            <p className="font-semibold">{formatCurrency(netInvested)}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-muted-foreground mb-1">Holdings</p>
                            <p className="font-semibold">{portfolio.holdings.length}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            {/* Additional Stats */}
            <Card>
                <CardContent className="p-4">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                        <div className="text-center">
                            <p className="text-muted-foreground mb-1">Transactions</p>
                            <p className="font-semibold">{portfolio.transactions.length}</p>
                        </div>
                        <div className="text-center">
                            <p className="text-muted-foreground mb-1">Created</p>
                            <p className="font-semibold">
                                {new Intl.DateTimeFormat('en-IN', {
                                    day: '2-digit',
                                    month: 'short',
                                }).format(new Date(portfolio.createdAt))}
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>
        </div>
    );
}