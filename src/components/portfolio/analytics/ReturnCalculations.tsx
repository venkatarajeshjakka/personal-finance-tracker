'use client';

import React, { useMemo } from 'react';
import { Portfolio, Transaction } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Calculator, Calendar, DollarSign, BarChart3 } from 'lucide-react';
import { calculateNetInvested } from '@/types';

interface ReturnCalculationsProps {
  portfolio: Portfolio;
}

interface ReturnMetrics {
  simpleReturn: number;
  simpleReturnPercent: number;
  timeWeightedReturn: number;
  xirr: number;
  annualizedReturn: number;
  totalDays: number;
  averageHoldingPeriod: number;
  realizedProfit: number;
  realizedProfitPercent: number;
  unrealizedProfit: number;
  unrealizedProfitPercent: number;
  totalProfit: number;
  bestPerformingStock: {
    symbol: string;
    return: number;
    returnPercent: number;
  } | null;
  worstPerformingStock: {
    symbol: string;
    return: number;
    returnPercent: number;
  } | null;
}

export function ReturnCalculations({ portfolio }: ReturnCalculationsProps) {
  const returnMetrics = useMemo((): ReturnMetrics => {
    const netInvested = calculateNetInvested(portfolio.transactions);
    const currentValue = portfolio.currentValue;
    const simpleReturn = currentValue - netInvested;
    const simpleReturnPercent = netInvested > 0 ? (simpleReturn / netInvested) * 100 : 0;

    // Calculate time-weighted return (TWR)
    // This measures the compound rate of growth of the portfolio
    const timeWeightedReturn = calculateTimeWeightedReturn(portfolio);

    // Calculate XIRR (Extended Internal Rate of Return)
    const xirr = calculateXIRR(portfolio);

    // Calculate annualized return
    const firstTransaction = portfolio.transactions.reduce((earliest, tx) =>
      new Date(tx.date) < new Date(earliest.date) ? tx : earliest
    );
    const daysSinceFirst = firstTransaction ?
      (Date.now() - new Date(firstTransaction.date).getTime()) / (1000 * 60 * 60 * 24) : 0;
    const years = daysSinceFirst / 365.25;
    const annualizedReturn = years > 0 && netInvested > 0 ?
      (Math.pow(currentValue / netInvested, 1 / years) - 1) * 100 : 0;

    // Calculate realized and unrealized profits
    const unrealizedProfit = portfolio.holdings.reduce((sum, holding) => sum + holding.unrealizedGain, 0);

    // Calculate realized profit from sell transactions
    const realizedProfit = portfolio.transactions
      .filter(tx => tx.type === 'sell')
      .reduce((sum, sellTx) => {
        // Find corresponding buy transactions for this symbol
        const buyTransactions = portfolio.transactions
          .filter(tx => tx.type === 'buy' && tx.symbol === sellTx.symbol)
          .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()); // FIFO

        let remainingQuantity = sellTx.quantity;
        let totalCost = 0;

        for (const buyTx of buyTransactions) {
          if (remainingQuantity <= 0) break;
          const quantityToUse = Math.min(remainingQuantity, buyTx.quantity);
          totalCost += quantityToUse * buyTx.price;
          remainingQuantity -= quantityToUse;
        }

        const realizedGain = sellTx.totalAmount - totalCost;
        return sum + realizedGain;
      }, 0);

    const totalProfit = realizedProfit + unrealizedProfit;
    const realizedProfitPercent = netInvested > 0 ? (realizedProfit / netInvested) * 100 : 0;
    const unrealizedProfitPercent = netInvested > 0 ? (unrealizedProfit / netInvested) * 100 : 0;

    // Calculate average holding period
    const averageHoldingPeriod = calculateAverageHoldingPeriod(portfolio);

    // Find best and worst performing stocks
    const stockPerformance = portfolio.holdings.map(holding => ({
      symbol: holding.symbol,
      return: holding.unrealizedGain,
      returnPercent: holding.averagePrice > 0 ?
        ((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100 : 0
    }));

    const bestPerformingStock = stockPerformance.length > 0 ?
      stockPerformance.reduce((best, current) =>
        current.returnPercent > best.returnPercent ? current : best
      ) : null;

    const worstPerformingStock = stockPerformance.length > 0 ?
      stockPerformance.reduce((worst, current) =>
        current.returnPercent < worst.returnPercent ? current : worst
      ) : null;

    // Only show worst performer if it's actually negative
    const actualWorstPerformer = worstPerformingStock && worstPerformingStock.returnPercent < 0 ? worstPerformingStock : null;

    return {
      simpleReturn,
      simpleReturnPercent,
      timeWeightedReturn,
      xirr,
      annualizedReturn,
      totalDays: daysSinceFirst,
      averageHoldingPeriod,
      realizedProfit,
      realizedProfitPercent,
      unrealizedProfit,
      unrealizedProfitPercent,
      totalProfit,
      bestPerformingStock,
      worstPerformingStock: actualWorstPerformer
    };
  }, [portfolio]);

  return (
    <div className="space-y-6">
      {/* Return Metrics Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Simple Return</CardTitle>
            <Calculator className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${returnMetrics.simpleReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{returnMetrics.simpleReturn.toLocaleString()}
            </div>
            <p className={`text-xs ${returnMetrics.simpleReturnPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {returnMetrics.simpleReturnPercent >= 0 ? '+' : ''}{returnMetrics.simpleReturnPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time-Weighted Return</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${returnMetrics.timeWeightedReturn >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {returnMetrics.timeWeightedReturn >= 0 ? '+' : ''}{returnMetrics.timeWeightedReturn.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Portfolio performance
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">XIRR</CardTitle>
            <div className="flex items-center gap-2">
              {returnMetrics.totalDays < 90 && (
                <Badge variant="outline" className="text-xs">
                  {returnMetrics.totalDays < 30 ? 'Early' : 'Short-term'}
                </Badge>
              )}
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${returnMetrics.xirr >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {returnMetrics.xirr >= 0 ? '+' : ''}{returnMetrics.xirr.toFixed(2)}%
            </div>
            <p className="text-xs text-muted-foreground">
              {returnMetrics.totalDays < 30 ? 'XIRR (Early estimate - less reliable)' :
                returnMetrics.totalDays < 90 ? 'XIRR (Short-term - use with caution)' :
                  'XIRR (Recommended for 90+ days)'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Realized Profit</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${returnMetrics.realizedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{returnMetrics.realizedProfit.toLocaleString()}
            </div>
            <p className={`text-xs ${returnMetrics.realizedProfitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {returnMetrics.realizedProfitPercent >= 0 ? '+' : ''}{returnMetrics.realizedProfitPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Unrealized Profit</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${returnMetrics.unrealizedProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              ₹{returnMetrics.unrealizedProfit.toLocaleString()}
            </div>
            <p className={`text-xs ${returnMetrics.unrealizedProfitPercent >= 0 ? 'text-green-600' : 'text-red-600'}`}>
              {returnMetrics.unrealizedProfitPercent >= 0 ? '+' : ''}{returnMetrics.unrealizedProfitPercent.toFixed(2)}%
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Return Analysis</CardTitle>
            <CardDescription>
              Comprehensive breakdown of portfolio returns
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Annualized Return</span>
              <Badge variant={returnMetrics.annualizedReturn >= 0 ? 'default' : 'destructive'}>
                {returnMetrics.annualizedReturn >= 0 ? '+' : ''}{returnMetrics.annualizedReturn.toFixed(2)}%
              </Badge>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Total Investment Period</span>
              <span className="text-sm text-muted-foreground">
                {Math.floor(returnMetrics.totalDays)} days ({(returnMetrics.totalDays / 365.25).toFixed(1)} years)
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Average Holding Period</span>
              <span className="text-sm text-muted-foreground">
                {Math.floor(returnMetrics.averageHoldingPeriod)} days
              </span>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Return Calculation Methods</h4>
              <div className="space-y-2 text-xs text-muted-foreground">
                <p>
                  <strong>Simple Return:</strong> Basic calculation of gains/losses
                </p>
                <p>
                  <strong>Time-Weighted Return:</strong> Measures portfolio performance independent of cash flows
                </p>
                <p>
                  <strong>XIRR (Extended IRR):</strong> Annualized return considering exact dates and irregular cash flows
                </p>
                {returnMetrics.totalDays < 90 && (
                  <div className="mt-3 p-2 bg-amber-50 dark:bg-amber-950/20 border border-amber-200 dark:border-amber-800 rounded">
                    <p className="text-amber-800 dark:text-amber-200">
                      <strong>Note:</strong> XIRR calculations are most reliable with 90+ days of investment history.
                      Current period: {Math.floor(returnMetrics.totalDays)} days.
                    </p>
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Stock Performance</CardTitle>
            <CardDescription>
              Best and worst performing holdings
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {returnMetrics.bestPerformingStock && (
              <div className="p-3 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-green-800 dark:text-green-200">
                    Best Performer
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="font-medium">{returnMetrics.bestPerformingStock.symbol}</div>
                  <div className="text-sm text-green-600">
                    ₹{returnMetrics.bestPerformingStock.return.toLocaleString()}
                    ({returnMetrics.bestPerformingStock.returnPercent >= 0 ? '+' : ''}
                    {returnMetrics.bestPerformingStock.returnPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            )}

            {returnMetrics.worstPerformingStock && (
              <div className="p-3 rounded-lg bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingDown className="h-4 w-4 text-red-600" />
                  <span className="text-sm font-medium text-red-800 dark:text-red-200">
                    Worst Performer
                  </span>
                </div>
                <div className="space-y-1">
                  <div className="font-medium">{returnMetrics.worstPerformingStock.symbol}</div>
                  <div className="text-sm text-red-600">
                    ₹{returnMetrics.worstPerformingStock.return.toLocaleString()}
                    ({returnMetrics.worstPerformingStock.returnPercent >= 0 ? '+' : ''}
                    {returnMetrics.worstPerformingStock.returnPercent.toFixed(2)}%)
                  </div>
                </div>
              </div>
            )}

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Performance Distribution</h4>
              <div className="space-y-2">
                {portfolio.holdings.map(holding => {
                  const returnPercent = holding.averagePrice > 0 ?
                    ((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100 : 0;

                  return (
                    <div key={holding.id} className="flex justify-between items-center text-sm">
                      <span className="truncate max-w-20">{holding.symbol}</span>
                      <span className={returnPercent >= 0 ? 'text-green-600' : 'text-red-600'}>
                        {returnPercent >= 0 ? '+' : ''}{returnPercent.toFixed(1)}%
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

// Helper function to calculate time-weighted return
function calculateTimeWeightedReturn(portfolio: Portfolio): number {
  // Simplified TWR calculation
  // In a real implementation, this would require historical portfolio values
  const netInvested = calculateNetInvested(portfolio.transactions);
  if (netInvested <= 0) return 0;

  return ((portfolio.currentValue / netInvested) - 1) * 100;
}

// Helper function to calculate XIRR (Extended Internal Rate of Return) using Newton-Raphson method
function calculateXIRR(portfolio: Portfolio): number {
  // Prepare cash flows: negative for investments, positive for returns
  const cashFlows: { date: Date; amount: number }[] = [];

  // Add all transactions as cash flows
  portfolio.transactions.forEach(tx => {
    const amount = tx.type === 'buy' ? -tx.totalAmount : tx.totalAmount;
    cashFlows.push({ date: new Date(tx.date), amount });
  });

  // Add current portfolio value as final cash flow
  cashFlows.push({ date: new Date(), amount: portfolio.currentValue });

  if (cashFlows.length < 2) return 0;

  // Check minimum time period for meaningful XIRR calculation
  const firstDate = new Date(Math.min(...cashFlows.map(cf => cf.date.getTime())));
  const lastDate = new Date(Math.max(...cashFlows.map(cf => cf.date.getTime())));
  const daysDifference = (lastDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24);

  // If less than 7 days, return simple return instead of XIRR
  if (daysDifference < 7) {
    const totalInvested = Math.abs(cashFlows.filter(cf => cf.amount < 0).reduce((sum, cf) => sum + cf.amount, 0));
    const currentValue = portfolio.currentValue;
    return totalInvested > 0 ? ((currentValue - totalInvested) / totalInvested) * 100 : 0;
  }

  // Sort cash flows by date
  cashFlows.sort((a, b) => a.date.getTime() - b.date.getTime());

  // Calculate time periods in years from the first cash flow
  const firstDateTimestamp = cashFlows[0].date.getTime();
  const periods = cashFlows.map(cf =>
    (cf.date.getTime() - firstDateTimestamp) / (1000 * 60 * 60 * 24 * 365.25)
  );

  // Newton-Raphson method to find IRR
  let rate = 0.1; // Initial guess: 10%
  const maxIterations = 100;
  const tolerance = 1e-6;

  for (let i = 0; i < maxIterations; i++) {
    let npv = 0;
    let dnpv = 0;

    // Calculate NPV and its derivative
    for (let j = 0; j < cashFlows.length; j++) {
      const cf = cashFlows[j].amount;
      const t = periods[j];
      const discountFactor = Math.pow(1 + rate, -t);

      npv += cf * discountFactor;
      dnpv -= cf * t * discountFactor / (1 + rate);
    }

    // Check for convergence
    if (Math.abs(npv) < tolerance) {
      return rate * 100; // Convert to percentage
    }

    // Newton-Raphson iteration
    if (Math.abs(dnpv) < tolerance) {
      break; // Avoid division by zero
    }

    const newRate = rate - npv / dnpv;

    // Prevent extreme values
    if (newRate < -0.99) {
      rate = -0.99;
    } else if (newRate > 10) {
      rate = 10;
    } else {
      rate = newRate;
    }
  }

  // If Newton-Raphson fails, fall back to simple approximation
  const totalInvested = Math.abs(cashFlows.filter(cf => cf.amount < 0).reduce((sum, cf) => sum + cf.amount, 0));
  const totalReturned = cashFlows.filter(cf => cf.amount > 0).reduce((sum, cf) => sum + cf.amount, 0);

  if (totalInvested <= 0) return 0;

  const totalYears = periods[periods.length - 1];
  if (totalYears <= 0) return 0;

  return (Math.pow(totalReturned / totalInvested, 1 / totalYears) - 1) * 100;
}

// Helper function to calculate average holding period
function calculateAverageHoldingPeriod(portfolio: Portfolio): number {
  if (portfolio.transactions.length === 0) return 0;

  const holdingPeriods: number[] = [];
  const now = new Date();

  // Group transactions by symbol
  const symbolTransactions = new Map<string, Transaction[]>();
  portfolio.transactions.forEach(tx => {
    if (!symbolTransactions.has(tx.symbol)) {
      symbolTransactions.set(tx.symbol, []);
    }
    symbolTransactions.get(tx.symbol)!.push(tx);
  });

  // Calculate holding period for each symbol
  symbolTransactions.forEach((transactions, symbol) => {
    const buyTransactions = transactions.filter(tx => tx.type === 'buy');
    if (buyTransactions.length > 0) {
      const firstBuy = buyTransactions.reduce((earliest, tx) =>
        new Date(tx.date) < new Date(earliest.date) ? tx : earliest
      );
      const daysSinceFirstBuy = (now.getTime() - new Date(firstBuy.date).getTime()) / (1000 * 60 * 60 * 24);
      holdingPeriods.push(daysSinceFirstBuy);
    }
  });

  return holdingPeriods.length > 0 ?
    holdingPeriods.reduce((sum, period) => sum + period, 0) / holdingPeriods.length : 0;
}