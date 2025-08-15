'use client';

import React, { memo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PieChart, BarChart3, TrendingUp } from 'lucide-react';
import { Portfolio } from '@/types';
import { getMarketCapCategory } from '@/lib/utils/quarterUtils';
import { AllocationChart } from './analytics/AllocationChart';
import { formatters, ColorFormatter } from '@/lib/utils/formatters';
import { usePortfolioAllocation } from '@/lib/hooks/usePortfolioCalculations';
import { EmptyState } from '@/components/ui/error-states';

interface PortfolioAllocationProps {
  portfolio: Portfolio;
}

const PortfolioAllocationComponent = ({ portfolio }: PortfolioAllocationProps) => {
  // Use optimized allocation calculations hook
  const allocationData = usePortfolioAllocation(portfolio);
  
  const totalValue = portfolio.currentValue;

  // Calculate market cap allocation based on Yahoo Finance API data stored in holdings
  const marketCapMap = new Map<string, number>();
  portfolio.holdings.forEach(holding => {
    const marketCapValue = holding.marketCap || 0;
    const category = getMarketCapCategory(marketCapValue);
    marketCapMap.set(category.label, (marketCapMap.get(category.label) || 0) + holding.totalValue);
  });

  const marketCapAllocations = Array.from(marketCapMap.entries())
    .map(([category, value]) => ({
      category,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
    }))
    .filter(item => item.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

  const getColorForIndex = (index: number) => {
    const colors = [
      'bg-blue-500',
      'bg-green-500',
      'bg-yellow-500',
      'bg-purple-500',
      'bg-red-500',
      'bg-indigo-500',
      'bg-pink-500',
      'bg-gray-500'
    ];
    return colors[index % colors.length];
  };

  if (portfolio.holdings.length === 0) {
    return (
      <EmptyState
        title="No Holdings Available"
        message="Add transactions to see your portfolio composition and allocation breakdown."
        icon={PieChart}
      />
    );
  }

  return (
    <div className="space-y-6">
      {/* Allocation Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/20 dark:to-blue-900/20 border-blue-200 dark:border-blue-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-blue-800 dark:text-blue-200 flex items-center gap-2">
              <PieChart className="h-4 w-4" />
              Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-900 dark:text-blue-100">
              {allocationData.holdings.length}
            </div>
            <p className="text-xs text-blue-600 dark:text-blue-300">
              Total stocks
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950/20 dark:to-green-900/20 border-green-200 dark:border-green-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-green-800 dark:text-green-200 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Sectors
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-900 dark:text-green-100">
              {allocationData.sectors.length}
            </div>
            <p className="text-xs text-green-600 dark:text-green-300">
              Different sectors
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/20 dark:to-purple-900/20 border-purple-200 dark:border-purple-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-purple-800 dark:text-purple-200 flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Industries
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-purple-900 dark:text-purple-100">
              {allocationData.industries.length}
            </div>
            <p className="text-xs text-purple-600 dark:text-purple-300">
              Different industries
            </p>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950/20 dark:to-orange-900/20 border-orange-200 dark:border-orange-800">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-orange-800 dark:text-orange-200 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Market Caps
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-900 dark:text-orange-100">
              {marketCapAllocations.filter(m => m.percentage > 0).length}
            </div>
            <p className="text-xs text-orange-600 dark:text-orange-300">
              Cap categories
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Interactive Charts Section */}
      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-blue-600" />
              Sector Allocation
            </CardTitle>
            <CardDescription>
              Distribution of investments across sectors
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allocationData.sectors.length > 0 ? (
              <AllocationChart
                data={allocationData.sectors.map(sector => ({
                  sector: sector.sector,
                  value: sector.value,
                  percentage: sector.percentage
                }))}
                type="sector"
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <PieChart className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">No sector data available. Refresh prices to fetch sector information.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <BarChart3 className="h-5 w-5 text-purple-600" />
              Industry Allocation
            </CardTitle>
            <CardDescription>
              Distribution of investments across industries
            </CardDescription>
          </CardHeader>
          <CardContent>
            {allocationData.industries.length > 0 ? (
              <AllocationChart
                data={allocationData.industries.map(industry => ({
                  industry: industry.industry,
                  value: industry.value,
                  percentage: industry.percentage
                }))}
                type="industry"
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <BarChart3 className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">No industry data available. Refresh prices to fetch industry information.</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-orange-600" />
              Market Cap Allocation
            </CardTitle>
            <CardDescription>
              Distribution by company market capitalization
            </CardDescription>
          </CardHeader>
          <CardContent>
            {marketCapAllocations.length > 0 ? (
              <AllocationChart
                data={marketCapAllocations.map(cap => ({
                  category: cap.category,
                  value: cap.value,
                  percentage: cap.percentage
                }))}
                type="marketCap"
              />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <TrendingUp className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p className="text-sm">No market cap data available. Refresh prices to fetch market cap information.</p>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <PieChart className="h-5 w-5 text-green-600" />
              Holdings Distribution
            </CardTitle>
            <CardDescription>
              Individual stock allocation by value
            </CardDescription>
          </CardHeader>
          <CardContent>
            <AllocationChart
              data={allocationData.holdings.map(holding => ({
                name: holding.symbol,
                value: holding.value,
                percentage: holding.percentage
              }))}
              type="holdings"
            />
          </CardContent>
        </Card>
      </div>

      {/* Detailed Breakdown Tables */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Holdings Allocation */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <PieChart className="mr-2 h-5 w-5" />
              Detailed Holdings
            </CardTitle>
          </CardHeader>
          <CardContent>

            <div className="space-y-3 max-h-80 overflow-y-auto">
              {allocationData.holdings.map((holding, index) => (
                <div key={holding.symbol} className="flex items-center justify-between p-3 rounded-lg bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-800">
                  <div className="flex items-center gap-3">
                    <div className={`w-3 h-3 rounded-full ${getColorForIndex(index)}`}></div>
                    <div>
                      <div className="font-medium">{holding.symbol}</div>
                      <div className="text-xs text-muted-foreground">{formatters.integer(holding.quantity)} shares</div>
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatters.currency(holding.value)}</div>
                    <div className="text-sm text-muted-foreground">{formatters.percentage(holding.percentage, { maximumFractionDigits: 1 })}</div>
                    <div className={`text-xs ${ColorFormatter.getValueColorClass(holding.unrealizedGain)}`}>
                      {formatters.compactCurrency(holding.unrealizedGain, { showSign: true })}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sector Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <BarChart3 className="mr-2 h-5 w-5" />
              Allocation Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {/* Top Sectors */}
              <div>
                <h4 className="font-medium text-sm text-green-800 dark:text-green-200 mb-2">Top Sectors</h4>
                <div className="space-y-2">
                  {allocationData.sectors.slice(0, 3).map((sector, index) => (
                    <div key={sector.sector} className="flex items-center justify-between p-2 rounded-lg bg-green-50 dark:bg-green-950/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-green-600" />
                        <span className="text-sm font-medium truncate max-w-24">{sector.sector}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{formatters.percentage(sector.percentage, { maximumFractionDigits: 1 })}</div>
                        <div className="text-xs text-muted-foreground">{formatters.compactCurrency(sector.value)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Top Industries */}
              <div>
                <h4 className="font-medium text-sm text-purple-800 dark:text-purple-200 mb-2">Top Industries</h4>
                <div className="space-y-2">
                  {allocationData.industries.slice(0, 3).map((industry, index) => (
                    <div key={industry.industry} className="flex items-center justify-between p-2 rounded-lg bg-purple-50 dark:bg-purple-950/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-purple-600" />
                        <span className="text-sm font-medium truncate max-w-24">{industry.industry}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{formatters.percentage(industry.percentage, { maximumFractionDigits: 1 })}</div>
                        <div className="text-xs text-muted-foreground">{formatters.compactCurrency(industry.value)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Market Cap Mix */}
              <div>
                <h4 className="font-medium text-sm text-orange-800 dark:text-orange-200 mb-2">Market Cap Mix</h4>
                <div className="space-y-2">
                  {marketCapAllocations.filter(m => m.percentage > 0).map((marketCap, index) => (
                    <div key={marketCap.category} className="flex items-center justify-between p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                      <div className="flex items-center gap-2">
                        <div className="w-2 h-2 rounded-full bg-orange-600" />
                        <span className="text-sm font-medium truncate max-w-24">{marketCap.category.split(' ')[0]} {marketCap.category.split(' ')[1]}</span>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-bold">{formatters.percentage(marketCap.percentage, { maximumFractionDigits: 1 })}</div>
                        <div className="text-xs text-muted-foreground">{formatters.compactCurrency(marketCap.value)}</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>


    </div>
  );
};

// Memoize the component to prevent unnecessary re-renders
export const PortfolioAllocation = memo(PortfolioAllocationComponent, (prevProps, nextProps) => {
  // Custom comparison function for better performance
  return (
    prevProps.portfolio.id === nextProps.portfolio.id &&
    prevProps.portfolio.currentValue === nextProps.portfolio.currentValue &&
    prevProps.portfolio.holdings.length === nextProps.portfolio.holdings.length &&
    JSON.stringify(prevProps.portfolio.holdings.map(h => ({ 
      id: h.id, 
      totalValue: h.totalValue, 
      sector: h.sector, 
      industry: h.industry 
    }))) === JSON.stringify(nextProps.portfolio.holdings.map(h => ({ 
      id: h.id, 
      totalValue: h.totalValue, 
      sector: h.sector, 
      industry: h.industry 
    })))
  );
});