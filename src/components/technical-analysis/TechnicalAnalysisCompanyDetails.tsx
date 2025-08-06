"use client";

import { useSelector } from 'react-redux';
import { selectAllWatchlists } from '@/lib/redux/slices/watchlistsSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  Building2, 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  BarChart3
} from 'lucide-react';
import type { CompanyFinancials, WatchlistStock } from '@/types';

interface TechnicalAnalysisCompanyDetailsProps {
  symbol: string;
  companyData?: CompanyFinancials;
}

export function TechnicalAnalysisCompanyDetails({
  symbol,
  companyData,
}: TechnicalAnalysisCompanyDetailsProps) {
  // Get stock data from watchlists (similar to watchlist approach)
  const watchlists = useSelector(selectAllWatchlists);
  
  // Find the stock in any watchlist to get current price data
  const stockData = watchlists
    .flatMap(watchlist => watchlist.stocks)
    .find(stock => stock.symbol === symbol) as WatchlistStock | undefined;

  // Utility functions (same as watchlist)
  const formatCurrency = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(value);
  };

  const formatNumber = (value: number | undefined | null, decimals: number = 2) => {
    if (value === undefined || value === null) return 'N/A';
    return new Intl.NumberFormat('en-US', {
      minimumFractionDigits: decimals,
      maximumFractionDigits: decimals,
    }).format(value);
  };

  const formatMarketCap = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    
    // Convert to crores for Indian market display (same as watchlist)
    const crores = value / 10000000; // 1 crore = 10 million
    return `₹${formatNumber(crores)}Cr`;
  };

  const formatVolume = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    
    if (value >= 1e9) {
      return `${(value / 1e9).toFixed(2)}B`;
    } else if (value >= 1e6) {
      return `${(value / 1e6).toFixed(2)}M`;
    } else if (value >= 1e3) {
      return `${(value / 1e3).toFixed(2)}K`;
    } else {
      return formatNumber(value, 0);
    }
  };

  const formatPercentage = (value: number | undefined | null) => {
    if (value === undefined || value === null) return 'N/A';
    // Convert decimal to percentage if needed
    const percentage = value > 1 || value < -1 ? value : value * 100;
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const getPriceChangeColor = (change: number | undefined | null) => {
    if (change === undefined || change === null) return 'text-muted-foreground';
    return change >= 0 ? 'text-green-600' : 'text-red-600';
  };

  const getPriceChangeIcon = (change: number | undefined | null) => {
    if (change === undefined || change === null) return null;
    return change >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />;
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Company Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Building2 className="h-5 w-5" />
            Company Info
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Symbol</span>
              <Badge variant="outline" className="font-mono">
                {symbol}
              </Badge>
            </div>
            
            <div className="flex justify-between items-start">
              <span className="text-sm text-muted-foreground">Company</span>
              <span className="text-sm font-medium text-right max-w-[200px]">
                {stockData?.companyName || companyData?.company || 'N/A'}
              </span>
            </div>

            {companyData?.industry && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Industry</span>
                <Badge variant="secondary" className="text-xs">
                  {companyData.industry}
                </Badge>
              </div>
            )}

            {companyData?.sector && (
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">Sector</span>
                <Badge variant="secondary" className="text-xs">
                  {companyData.sector}
                </Badge>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Price Information */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <DollarSign className="h-5 w-5" />
            Price Data
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Current Price</span>
              <span className="text-sm font-bold">
                {formatCurrency(stockData?.currentPrice)}
              </span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Day Change</span>
              <div className={`flex items-center gap-1 text-sm font-medium ${getPriceChangeColor(stockData?.priceChange)}`}>
                {getPriceChangeIcon(stockData?.priceChange)}
                <span>
                  {formatCurrency(stockData?.priceChange)} ({formatPercentage(stockData?.priceChangePercent)})
                </span>
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Added Price</span>
              <span className="text-sm">
                {formatCurrency(stockData?.addedPrice)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">52W Range</span>
              <span className="text-sm">
                {formatCurrency(stockData?.fiftyTwoWeekLow)} - {formatCurrency(stockData?.fiftyTwoWeekHigh)}
              </span>
            </div>
          </div>

          {stockData?.lastUpdated && (
            <div className="pt-2 border-t">
              <p className="text-xs text-muted-foreground">
                Last updated: {new Date(stockData.lastUpdated).toLocaleString()}
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Financial Metrics */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Key Metrics
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">Market Cap</span>
              <span className="text-sm font-medium">
                {formatMarketCap(stockData?.marketCap)}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">P/E Ratio</span>
              <span className="text-sm">
                {stockData?.peRatio ? formatNumber(stockData.peRatio) : 'N/A'}
              </span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm text-muted-foreground">P/B Ratio</span>
              <span className="text-sm">
                {stockData?.priceToBook ? formatNumber(stockData.priceToBook) : 'N/A'}
              </span>
            </div>

            {/* Show company financial data if available */}
            {companyData && (
              <>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Company P/E</span>
                  <span className="text-sm">
                    {companyData.PE_ratio}
                  </span>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Company Price</span>
                  <span className="text-sm">
                    {companyData.price}
                  </span>
                </div>
              </>
            )}
          </div>

          {!stockData && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                Add {symbol} to a watchlist to see live price data
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}