'use client';

import React, { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, Minus, RefreshCw, AlertCircle } from 'lucide-react';
import { cn } from '@/lib/utils';
import PriceUpdateService from '@/lib/services/priceUpdateService';

interface StockPriceProps {
  symbol: string;
  companyName?: string;
  className?: string;
  showChange?: boolean;
  showRefresh?: boolean;
  autoRefresh?: boolean;
  refreshInterval?: number; // in milliseconds
  size?: 'sm' | 'md' | 'lg';
  onPriceUpdate?: (price: number, change: number, changePercent: number) => void;
  onError?: (error: string) => void;
}

interface PriceData {
  price: number;
  change: number;
  changePercent: number;
  cached: boolean;
}

const StockPrice: React.FC<StockPriceProps> = ({
  symbol,
  companyName: _companyName,
  className,
  showChange = true,
  showRefresh = false,
  autoRefresh = false,
  refreshInterval = 60000, // 1 minute default
  size = 'md',
  onPriceUpdate,
  onError
}) => {
  const [priceData, setPriceData] = useState<PriceData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);

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
        : await PriceUpdateService.getStockPrice(symbol);

      if (result.success && result.price !== undefined) {
        const newPriceData = {
          price: result.price,
          change: result.change || 0,
          changePercent: result.changePercent || 0,
          cached: result.cached || false
        };

        setPriceData(newPriceData);
        setLastUpdated(new Date());
        
        if (onPriceUpdate) {
          onPriceUpdate(newPriceData.price, newPriceData.change, newPriceData.changePercent);
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

  // Auto refresh
  useEffect(() => {
    if (!autoRefresh || !symbol) return;

    const interval = setInterval(fetchPrice, refreshInterval);
    return () => clearInterval(interval);
  }, [autoRefresh, symbol, refreshInterval]);

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
    if (change > 0) return 'text-green-600';
    if (change < 0) return 'text-red-600';
    return 'text-gray-500';
  };

  const sizeClasses = {
    sm: 'text-sm',
    md: 'text-base',
    lg: 'text-lg'
  };

  if (error) {
    return (
      <div className={cn('flex items-center gap-2 text-red-600', sizeClasses[size], className)}>
        <AlertCircle className="w-4 h-4" />
        <span>Error: {error}</span>
        {showRefresh && (
          <button
            onClick={() => fetchPrice(true)}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
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
      <div className={cn('flex items-center gap-2 text-gray-500', sizeClasses[size], className)}>
        <RefreshCw className="w-4 h-4 animate-spin" />
        <span>Loading price...</span>
      </div>
    );
  }

  if (!priceData) {
    return (
      <div className={cn('flex items-center gap-2 text-gray-500', sizeClasses[size], className)}>
        <span>No price data</span>
        {showRefresh && (
          <button
            onClick={() => fetchPrice(true)}
            disabled={loading}
            className="p-1 hover:bg-gray-100 rounded transition-colors"
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
          <span className="font-semibold">
            {formatPrice(priceData.price)}
          </span>
          {priceData.cached && (
            <span className="text-xs text-gray-400 bg-gray-100 px-1 rounded">
              cached
            </span>
          )}
          {showRefresh && (
            <button
              onClick={() => fetchPrice(true)}
              disabled={loading}
              className="p-1 hover:bg-gray-100 rounded transition-colors"
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

      {lastUpdated && (
        <div className="text-xs text-gray-400 ml-auto">
          {lastUpdated.toLocaleTimeString()}
        </div>
      )}
    </div>
  );
};

export default StockPrice;