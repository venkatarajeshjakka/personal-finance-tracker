'use client';

import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { PieChart, BarChart3, TrendingUp } from 'lucide-react';
import { Portfolio } from '@/types';
import { getMarketCapCategory } from '@/lib/utils/quarterUtils';

interface PortfolioAllocationProps {
  portfolio: Portfolio;
}

export function PortfolioAllocation({ portfolio }: PortfolioAllocationProps) {

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value.toFixed(1)}%`;
  };

  const totalValue = portfolio.holdings.reduce((sum, holding) => sum + holding.totalValue, 0);

  // Calculate allocation by holdings
  const holdingAllocations = portfolio.holdings
    .map(holding => ({
      symbol: holding.symbol,
      value: holding.totalValue,
      percentage: totalValue > 0 ? (holding.totalValue / totalValue) * 100 : 0,
      unrealizedGain: holding.unrealizedGain,
      quantity: holding.quantity
    }))
    .sort((a, b) => b.percentage - a.percentage);

  // Calculate sector allocation based on Yahoo Finance API data stored in holdings
  const sectorMap = new Map<string, number>();
  portfolio.holdings.forEach(holding => {
    const sector = holding.sector || 'Unknown';
    sectorMap.set(sector, (sectorMap.get(sector) || 0) + holding.totalValue);
  });

  const sectorAllocations = Array.from(sectorMap.entries())
    .map(([sector, value]) => ({
      sector,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
    }))
    .filter(item => item.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

  // Calculate industry allocation based on Yahoo Finance API data stored in holdings
  const industryMap = new Map<string, number>();
  portfolio.holdings.forEach(holding => {
    const industry = holding.industry || 'Unknown';
    industryMap.set(industry, (industryMap.get(industry) || 0) + holding.totalValue);
  });

  const industryAllocations = Array.from(industryMap.entries())
    .map(([industry, value]) => ({
      industry,
      value,
      percentage: totalValue > 0 ? (value / totalValue) * 100 : 0
    }))
    .filter(item => item.percentage > 0)
    .sort((a, b) => b.percentage - a.percentage);

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
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <PieChart className="mx-auto h-12 w-12 mb-4" />
            <p>No holdings to display allocation. Add transactions to see your portfolio composition.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      {/* Holdings Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <PieChart className="mr-2 h-5 w-5" />
            Holdings Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {holdingAllocations.map((holding, index) => (
              <div key={holding.symbol} className="space-y-2">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-2">
                    <div className={`w-3 h-3 rounded-full ${getColorForIndex(index)}`}></div>
                    <span className="font-medium">{holding.symbol}</span>
                    <Badge variant="outline" className="text-xs">
                      {holding.quantity} shares
                    </Badge>
                  </div>
                  <div className="text-right">
                    <div className="font-semibold">{formatCurrency(holding.value)}</div>
                    <div className="text-sm text-muted-foreground">{formatPercentage(holding.percentage)}</div>
                  </div>
                </div>
                <Progress value={holding.percentage} className="h-2" />
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Unrealized P&L:</span>
                  <span className={holding.unrealizedGain >= 0 ? 'text-green-600' : 'text-red-600'}>
                    {formatCurrency(holding.unrealizedGain)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Sector Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Sector Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {sectorAllocations.length > 0 ? (
            <div className="space-y-4">
              {sectorAllocations.map((sector, index) => (
                <div key={sector.sector} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getColorForIndex(index)}`}></div>
                      <span className="font-medium">{sector.sector}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(sector.value)}</div>
                      <div className="text-sm text-muted-foreground">{formatPercentage(sector.percentage)}</div>
                    </div>
                  </div>
                  <Progress value={sector.percentage} className="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">No sector data available. Refresh prices to fetch sector information from Yahoo Finance.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Industry Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <BarChart3 className="mr-2 h-5 w-5" />
            Industry Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {industryAllocations.length > 0 ? (
            <div className="space-y-4">
              {industryAllocations.map((industry, index) => (
                <div key={industry.industry} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getColorForIndex(index)}`}></div>
                      <span className="font-medium">{industry.industry}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(industry.value)}</div>
                      <div className="text-sm text-muted-foreground">{formatPercentage(industry.percentage)}</div>
                    </div>
                  </div>
                  <Progress value={industry.percentage} className="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">No industry data available. Refresh prices to fetch industry information from Yahoo Finance.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Market Cap Allocation */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <TrendingUp className="mr-2 h-5 w-5" />
            Market Cap Allocation
          </CardTitle>
        </CardHeader>
        <CardContent>
          {marketCapAllocations.length > 0 ? (
            <div className="space-y-4">
              {marketCapAllocations.map((cap, index) => (
                <div key={cap.category} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-2">
                      <div className={`w-3 h-3 rounded-full ${getColorForIndex(index)}`}></div>
                      <span className="font-medium">{cap.category}</span>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold">{formatCurrency(cap.value)}</div>
                      <div className="text-sm text-muted-foreground">{formatPercentage(cap.percentage)}</div>
                    </div>
                  </div>
                  <Progress value={cap.percentage} className="h-2" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 text-muted-foreground">
              <p className="text-sm">No market cap data available. Refresh prices to fetch market cap information from Yahoo Finance.</p>
            </div>
          )}
        </CardContent>
      </Card>


    </div>
  );
}