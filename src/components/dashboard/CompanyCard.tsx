'use client';

import React, { useState } from 'react';
import { TrendingUp, TrendingDown, Building2, Calendar } from 'lucide-react';
import { CompanyFinancials } from '@/types';
import { cn } from '@/lib/utils';
import StockPrice from '@/components/stocks/StockPrice';

interface CompanyCardProps {
  company: CompanyFinancials;
  selectedQuarter: string;
  selectedYear: number;
  className?: string;
  showRealTimePrice?: boolean;
}

const CompanyCard: React.FC<CompanyCardProps> = ({
  company,
  selectedQuarter,
  selectedYear,
  className,
  showRealTimePrice = true
}) => {
  const quarterKey = `${selectedQuarter}_${selectedYear}`;
  const quarterData = company.financials.quarters[quarterKey];

  // State to track live financial metrics
  const [liveMetrics, setLiveMetrics] = useState<{
    marketCap?: number | null;
    trailingPE?: number | null;
    forwardPE?: number | null;
    priceToBook?: number | null;
  } | null>(null);

  // Handle price and financial metrics updates from StockPrice component
  const handlePriceUpdate = (_price: number, _change: number, _changePercent: number, financialMetrics?: {
    marketCap?: number | null;
    trailingPE?: number | null;
    forwardPE?: number | null;
    priceToBook?: number | null;
  }) => {
    if (financialMetrics) {
      setLiveMetrics(financialMetrics);
    }
  };

  const formatCurrency = (value: number | string): string => {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    if (isNaN(numValue)) return '₹0';

    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(numValue);
  };

  const formatPercentage = (value: string): string => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return '0%';

    const sign = numValue >= 0 ? '+' : '';
    return `${sign}${numValue.toFixed(1)}%`;
  };

  const getGrowthColor = (value: string): string => {
    const numValue = parseFloat(value);
    if (isNaN(numValue)) return 'text-gray-500';
    return numValue >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getGrowthIcon = (value: string) => {
    const numValue = parseFloat(value);
    if (isNaN(numValue) || numValue === 0) return null;
    return numValue > 0 ? <TrendingUp className="w-4 h-4" /> : <TrendingDown className="w-4 h-4" />;
  };

  // Format market cap for display
  const formatMarketCap = (marketCap?: number | null): string => {
    if (!marketCap || marketCap === 0) {
      return company.market_cap || 'N/A';
    }

    // Convert to crores for Indian market display
    const crores = marketCap / 10000000; // 1 crore = 10 million
    return `₹${crores.toFixed(2)}Cr`;
  };

  // Format P/E ratio for display
  const formatPE = (pe?: number | null): string => {
    if (!pe || pe === 0) {
      return company.PE_ratio || 'N/A';
    }

    return pe.toFixed(1);
  };

  return (
    <div className={cn(
      'bg-white rounded-lg border border-gray-200 p-6 hover:shadow-md transition-shadow',
      className
    )}>
      {/* Header */}
      <div className="flex items-start justify-between mb-4">
        <div className="flex items-start gap-3">
          <div className="p-2 bg-blue-50 rounded-lg">
            <Building2 className="w-5 h-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-lg text-gray-900 mb-1">
              {company.company}
            </h3>
            <div className="flex items-center gap-2 text-sm text-gray-500">
              {company.symbol && (
                <span className="bg-gray-100 px-2 py-1 rounded text-xs font-medium">
                  {company.symbol}
                </span>
              )}
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                <span>{selectedQuarter} {selectedYear}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Real-time Price Section */}
      {showRealTimePrice && company.symbol && (
        <div className="mb-4 p-3 bg-gray-50 rounded-lg">
          <div className="text-sm text-gray-600 mb-1">Current Stock Price</div>
          <StockPrice
            symbol={company.symbol}
            companyName={company.company}
            showChange={true}
            showRefresh={true}
            size="md"
            className="font-medium"
            onPriceUpdate={handlePriceUpdate}
          />
        </div>
      )}

      {/* Original Price from Data */}
      <div className="mb-4 p-3 bg-blue-50 rounded-lg">
        <div className="text-sm text-blue-600 mb-1">Data Price</div>
        <div className="text-lg font-semibold text-blue-900">
          ₹{parseFloat(company.price || '0').toFixed(2)}
        </div>
        <div className="text-sm text-blue-700">
          Market Cap: {formatMarketCap(liveMetrics?.marketCap)} | PE: {formatPE(liveMetrics?.trailingPE)}
          {liveMetrics && (
            <span className="ml-2 text-xs bg-green-100 text-green-700 px-1 rounded">
              Live
            </span>
          )}
        </div>
      </div>

      {/* Quarter Data */}
      {quarterData ? (
        <div className="space-y-3">
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Sales</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(quarterData.sales)}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">EBIDT</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(quarterData.EBIDT)}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">Net Profit</div>
              <div className="font-semibold text-gray-900">
                {formatCurrency(quarterData.net_profit)}
              </div>
            </div>
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="text-sm text-gray-600 mb-1">EPS</div>
              <div className="font-semibold text-gray-900">
                ₹{quarterData.EPS}
              </div>
            </div>
          </div>

          {/* YOY Growth */}
          <div className="border-t pt-3">
            <div className="text-sm font-medium text-gray-700 mb-2">Year-over-Year Growth</div>
            <div className="grid grid-cols-2 gap-3">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Sales</span>
                <div className={cn('flex items-center gap-1 text-sm font-medium', getGrowthColor(company.financials.YOY.sales_growth))}>
                  {getGrowthIcon(company.financials.YOY.sales_growth)}
                  <span>{formatPercentage(company.financials.YOY.sales_growth)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">EBIDT</span>
                <div className={cn('flex items-center gap-1 text-sm font-medium', getGrowthColor(company.financials.YOY.EBIDT_growth))}>
                  {getGrowthIcon(company.financials.YOY.EBIDT_growth)}
                  <span>{formatPercentage(company.financials.YOY.EBIDT_growth)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">Net Profit</span>
                <div className={cn('flex items-center gap-1 text-sm font-medium', getGrowthColor(company.financials.YOY.net_profit_growth))}>
                  {getGrowthIcon(company.financials.YOY.net_profit_growth)}
                  <span>{formatPercentage(company.financials.YOY.net_profit_growth)}</span>
                </div>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-600">EPS</span>
                <div className={cn('flex items-center gap-1 text-sm font-medium', getGrowthColor(company.financials.YOY.EPS_growth))}>
                  {getGrowthIcon(company.financials.YOY.EPS_growth)}
                  <span>{formatPercentage(company.financials.YOY.EPS_growth)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="text-center py-6 text-gray-500">
          <div className="text-sm">No data available for {selectedQuarter} {selectedYear}</div>
        </div>
      )}

      {/* Last Updated */}
      <div className="mt-4 pt-3 border-t text-xs text-gray-400">
        Last updated: {company.updatedAt.toLocaleString()}
      </div>
    </div>
  );
};

export default CompanyCard;