'use client';

import React, { useMemo } from 'react';
import { Portfolio, Transaction } from '@/types';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { calculateNetInvested } from '@/types';

interface PerformanceChartProps {
  portfolio: Portfolio;
  timeframe: '1M' | '3M' | '6M' | '1Y' | 'ALL';
  onTimeframeChange: (timeframe: '1M' | '3M' | '6M' | '1Y' | 'ALL') => void;
}

interface PerformanceDataPoint {
  date: string;
  portfolioValue: number;
  invested: number;
  return: number;
  returnPercent: number;
}

export function PerformanceChart({ portfolio, timeframe, onTimeframeChange }: PerformanceChartProps) {
  // Generate performance data based on transactions
  const performanceData = useMemo(() => {
    const data: PerformanceDataPoint[] = [];
    const sortedTransactions = [...portfolio.transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (sortedTransactions.length === 0) {
      return [];
    }

    // Calculate portfolio value at each transaction point
    let runningInvested = 0;
    let holdings = new Map<string, { quantity: number; avgPrice: number }>();

    sortedTransactions.forEach((transaction, index) => {
      const transactionDate = new Date(transaction.date);
      
      // Update holdings
      const existing = holdings.get(transaction.symbol) || { quantity: 0, avgPrice: 0 };
      
      if (transaction.type === 'buy') {
        const totalQuantity = existing.quantity + transaction.quantity;
        const totalCost = (existing.quantity * existing.avgPrice) + (transaction.quantity * transaction.price);
        const newAvgPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
        
        holdings.set(transaction.symbol, {
          quantity: totalQuantity,
          avgPrice: newAvgPrice
        });
        runningInvested += transaction.totalAmount;
      } else if (transaction.type === 'sell') {
        const newQuantity = Math.max(0, existing.quantity - transaction.quantity);
        holdings.set(transaction.symbol, {
          quantity: newQuantity,
          avgPrice: existing.avgPrice
        });
        runningInvested -= transaction.totalAmount;
      }

      // Calculate current portfolio value (using current prices for simplicity)
      let portfolioValue = 0;
      holdings.forEach((holding, symbol) => {
        const currentHolding = portfolio.holdings.find(h => h.symbol === symbol);
        const currentPrice = currentHolding?.currentPrice || holding.avgPrice;
        portfolioValue += holding.quantity * currentPrice;
      });

      const returnValue = portfolioValue - runningInvested;
      const returnPercent = runningInvested > 0 ? (returnValue / runningInvested) * 100 : 0;

      data.push({
        date: transactionDate.toISOString().split('T')[0],
        portfolioValue,
        invested: runningInvested,
        return: returnValue,
        returnPercent
      });
    });

    // Add current data point
    const currentInvested = calculateNetInvested(portfolio.transactions);
    const currentReturn = portfolio.currentValue - currentInvested;
    const currentReturnPercent = currentInvested > 0 ? (currentReturn / currentInvested) * 100 : 0;

    data.push({
      date: new Date().toISOString().split('T')[0],
      portfolioValue: portfolio.currentValue,
      invested: currentInvested,
      return: currentReturn,
      returnPercent: currentReturnPercent
    });

    // Filter data based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'ALL':
        startDate = new Date(0); // Include all data
        break;
    }

    return data.filter(point => new Date(point.date) >= startDate);
  }, [portfolio, timeframe]);

  const formatCurrency = (value: number) => {
    return `₹${(value / 1000).toFixed(0)}K`;
  };

  const formatPercent = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const CustomTooltip = ({ active, payload, label }: any) => {
    if (active && payload && payload.length) {
      const data = payload[0].payload;
      return (
        <Card className="p-3 shadow-lg">
          <CardContent className="p-0 space-y-1">
            <p className="font-medium">{new Date(label).toLocaleDateString()}</p>
            <p className="text-sm">
              <span className="text-blue-600">Portfolio Value: </span>
              ₹{data.portfolioValue.toLocaleString()}
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Invested: </span>
              ₹{data.invested.toLocaleString()}
            </p>
            <p className="text-sm">
              <span className={data.return >= 0 ? 'text-green-600' : 'text-red-600'}>
                Return: 
              </span>
              {' '}₹{data.return.toLocaleString()} ({data.returnPercent.toFixed(2)}%)
            </p>
          </CardContent>
        </Card>
      );
    }
    return null;
  };

  return (
    <div className="space-y-4">
      {/* Timeframe Selector */}
      <div className="flex flex-wrap gap-2">
        {(['1M', '3M', '6M', '1Y', 'ALL'] as const).map((period) => (
          <Button
            key={period}
            variant={timeframe === period ? 'default' : 'outline'}
            size="sm"
            onClick={() => onTimeframeChange(period)}
          >
            {period}
          </Button>
        ))}
      </div>

      {/* Performance Chart */}
      <div className="h-80">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={performanceData}>
            <defs>
              <linearGradient id="portfolioGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
              </linearGradient>
              <linearGradient id="investedGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#6b7280" stopOpacity={0.3}/>
                <stop offset="95%" stopColor="#6b7280" stopOpacity={0}/>
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatCurrency}
            />
            <Tooltip content={<CustomTooltip />} />
            <Area
              type="monotone"
              dataKey="invested"
              stroke="#6b7280"
              strokeWidth={2}
              fill="url(#investedGradient)"
              name="Invested"
            />
            <Area
              type="monotone"
              dataKey="portfolioValue"
              stroke="#3b82f6"
              strokeWidth={2}
              fill="url(#portfolioGradient)"
              name="Portfolio Value"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>

      {/* Return Chart */}
      <div className="h-64">
        <h4 className="text-sm font-medium mb-2">Return Percentage Over Time</h4>
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={performanceData}>
            <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
            <XAxis 
              dataKey="date" 
              tick={{ fontSize: 12 }}
              tickFormatter={(value) => new Date(value).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            />
            <YAxis 
              tick={{ fontSize: 12 }}
              tickFormatter={formatPercent}
            />
            <Tooltip 
              formatter={(value: number) => [`${value.toFixed(2)}%`, 'Return %']}
              labelFormatter={(label) => new Date(label).toLocaleDateString()}
            />
            <Line
              type="monotone"
              dataKey="returnPercent"
              stroke="#10b981"
              strokeWidth={2}
              dot={{ fill: '#10b981', strokeWidth: 2, r: 3 }}
              activeDot={{ r: 5 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}