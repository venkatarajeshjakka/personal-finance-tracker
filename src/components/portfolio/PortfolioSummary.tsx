'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { RefreshCw, TrendingUp, TrendingDown } from 'lucide-react';
import { Portfolio, calculateNetInvested, calculatePortfolioDayPL } from '@/types';
import { MobilePortfolioSummary } from './mobile/MobilePortfolioSummary';

interface PortfolioSummaryProps {
  portfolio: Portfolio;
  loading?: boolean;
  onRefresh?: () => void;
  refreshing?: boolean;
  lastUpdated?: Date;
  showDetailedMetrics?: boolean;
}

export function PortfolioSummary({ 
  portfolio, 
  loading = false, 
  onRefresh, 
  refreshing = false, 
  lastUpdated,
  showDetailedMetrics = true 
}: PortfolioSummaryProps) {
  const [isMobile, setIsMobile] = React.useState(false);

  // Check if mobile view should be used
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);
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
      second: '2-digit',
    }).format(date);
  };

  const netInvested = calculateNetInvested(portfolio.transactions);
  const dayPL = calculatePortfolioDayPL(portfolio);
  const dayPLPercent = netInvested > 0 ? (dayPL / netInvested) * 100 : 0;
  const totalPLPercent = netInvested > 0 ? (portfolio.totalReturn / netInvested) * 100 : 0;
  
  const isDayPositive = dayPL >= 0;
  const isTotalPositive = portfolio.totalReturn >= 0;

  // Show mobile view on small screens
  if (isMobile) {
    return (
      <MobilePortfolioSummary 
        portfolio={portfolio}
        loading={loading}
        onRefresh={onRefresh}
        refreshing={refreshing}
        lastUpdated={lastUpdated}
      />
    );
  }

  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="animate-pulse space-y-4">
            <div className="h-4 bg-muted rounded w-1/4"></div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="space-y-2">
                  <div className="h-3 bg-muted rounded w-3/4"></div>
                  <div className="h-6 bg-muted rounded w-full"></div>
                </div>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold">Portfolio Summary</CardTitle>
          <div className="flex items-center gap-2">
            {lastUpdated && (
              <span className="text-xs text-muted-foreground">
                Last updated: {formatTime(lastUpdated)}
              </span>
            )}
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
                className="h-8 px-2"
              >
                <RefreshCw className={`h-3 w-3 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {/* Total Investment */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total Investment
            </p>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(netInvested)}
            </p>
          </div>

          {/* Current Value */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Current Value
            </p>
            <p className="text-lg font-bold text-foreground">
              {formatCurrency(portfolio.currentValue)}
            </p>
          </div>

          {/* Day's P&L */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Day's P&L
            </p>
            <div className="flex items-center gap-1">
              {isDayPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <div className="flex flex-col">
                <span className={`text-lg font-bold ${isDayPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isDayPositive ? '+' : ''}{formatCurrency(dayPL)}
                </span>
                <span className={`text-xs ${isDayPositive ? 'text-green-600' : 'text-red-600'}`}>
                  ({formatPercentage(dayPLPercent)})
                </span>
              </div>
            </div>
          </div>

          {/* Total P&L */}
          <div className="space-y-1">
            <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
              Total P&L
            </p>
            <div className="flex items-center gap-1">
              {isTotalPositive ? (
                <TrendingUp className="h-4 w-4 text-green-600" />
              ) : (
                <TrendingDown className="h-4 w-4 text-red-600" />
              )}
              <div className="flex flex-col">
                <span className={`text-lg font-bold ${isTotalPositive ? 'text-green-600' : 'text-red-600'}`}>
                  {isTotalPositive ? '+' : ''}{formatCurrency(portfolio.totalReturn)}
                </span>
                <span className={`text-xs ${isTotalPositive ? 'text-green-600' : 'text-red-600'}`}>
                  ({formatPercentage(totalPLPercent)})
                </span>
              </div>
            </div>
          </div>
        </div>

        {showDetailedMetrics && (
          <div className="mt-4 pt-4 border-t border-border">
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
              {/* Holdings Count */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Holdings:</span>
                <span className="font-medium">{portfolio.holdings.length}</span>
              </div>

              {/* Transactions Count */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Transactions:</span>
                <span className="font-medium">{portfolio.transactions.length}</span>
              </div>

              {/* Portfolio Created */}
              <div className="flex justify-between">
                <span className="text-muted-foreground">Created:</span>
                <span className="font-medium">
                  {new Intl.DateTimeFormat('en-IN', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  }).format(new Date(portfolio.createdAt))}
                </span>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}