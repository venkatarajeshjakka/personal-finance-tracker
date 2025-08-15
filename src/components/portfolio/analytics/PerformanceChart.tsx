'use client';

import React, { memo } from 'react';
import { Portfolio, Transaction } from '@/types';
import { LineChart as RechartsLineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Area, AreaChart } from 'recharts';
import { LineChart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { calculateNetInvested } from '@/types';
import { formatters, ColorFormatter } from '@/lib/utils/formatters';
import { usePortfolioPerformance } from '@/lib/hooks/usePortfolioCalculations';
import { ChartLoadingState } from '@/components/ui/loading-states';
import { EmptyState } from '@/components/ui/error-states';

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

const PerformanceChartComponent = ({ portfolio, timeframe, onTimeframeChange }: PerformanceChartProps) => {
  // Use optimized performance data hook
  const performanceData = usePortfolioPerformance(portfolio, timeframe);

  if (performanceData.length === 0) {
    return (
      <EmptyState
        title="No Performance Data"
        message="Add transactions to see portfolio performance over time."
        icon={() => <LineChart className="h-12 w-12" />}
      />
    );
  }

  const formatCurrency = (value: number) => {
    return formatters.compactCurrency(value);
  };

  const formatPercent = (value: number) => {
    return formatters.percentage(value, { maximumFractionDigits: 1 });
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
              {formatters.currency(data.portfolioValue)}
            </p>
            <p className="text-sm">
              <span className="text-gray-600">Invested: </span>
              {formatters.currency(data.invested)}
            </p>
            <p className="text-sm">
              <span className={ColorFormatter.getValueColorClass(data.return)}>
                Return: 
              </span>
              {' '}{formatters.compactCurrency(data.return, { showSign: true })} ({formatters.percentage(data.returnPercent)})
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
          <RechartsLineChart data={performanceData}>
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
          </RechartsLineChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const PerformanceChart = memo(PerformanceChartComponent, (prevProps, nextProps) => {
  return (
    prevProps.portfolio.id === nextProps.portfolio.id &&
    prevProps.portfolio.currentValue === nextProps.portfolio.currentValue &&
    prevProps.portfolio.transactions.length === nextProps.portfolio.transactions.length &&
    prevProps.timeframe === nextProps.timeframe
  );
});