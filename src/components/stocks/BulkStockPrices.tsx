'use client';

import React, { useState, useEffect } from 'react';
import { RefreshCw, TrendingUp, TrendingDown, Minus, AlertCircle, Clock } from 'lucide-react';
import { cn } from '@/lib/utils';
import PriceUpdateService from '@/lib/services/priceUpdateService';
import { CompanyFinancials } from '@/types';
import { useAppSelector } from '@/lib/redux/store';

interface BulkStockPricesProps {
  companies: CompanyFinancials[];
  className?: string;
  showRefresh?: boolean;
  onPricesUpdate?: (updatedCompanies: CompanyFinancials[]) => void;
  onError?: (error: string) => void;
}

interface CompanyPriceData extends CompanyFinancials {
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  priceError?: string;
  priceCached?: boolean;
  priceTimestamp?: Date;
}

const BulkStockPrices: React.FC<BulkStockPricesProps> = ({
  companies,
  className,
  showRefresh = true,
  onPricesUpdate,
  onError
}) => {
  const { priceUpdateSettings } = useAppSelector(state => state.settings);
  const [companiesWithPrices, setCompaniesWithPrices] = useState<CompanyPriceData[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastUpdated, setLastUpdated] = useState<Date | null>(null);
  const [stats, setStats] = useState({
    total: 0,
    success: 0,
    errors: 0,
    cached: 0
  });
  const [marketStatus, setMarketStatus] = useState(PriceUpdateService.getMarketStatus());

  const fetchPrices = async (forceRefresh: boolean = false) => {
    const companiesWithSymbols = companies.filter(company => 
      company.symbol && company.symbol.trim() !== ''
    );

    if (companiesWithSymbols.length === 0) {
      setCompaniesWithPrices(companies.map(company => ({ ...company })));
      return;
    }

    setLoading(true);

    try {
      const result = await PriceUpdateService.updateCompanyPrices(companies, {
        marketHoursOnly: forceRefresh ? false : priceUpdateSettings.marketHoursOnly,
        checkHolidays: forceRefresh ? false : priceUpdateSettings.checkMarketHolidays
      });
      
      const updatedCompaniesWithPrices: CompanyPriceData[] = result.updatedCompanies.map(company => {
        const priceResult = result.priceResults.find(r => 
          r.symbol === company.symbol?.toUpperCase()
        );

        if (priceResult && priceResult.success) {
          return {
            ...company,
            currentPrice: priceResult.price,
            priceChange: priceResult.change,
            priceChangePercent: priceResult.changePercent,
            priceCached: priceResult.cached,
            priceTimestamp: priceResult.timestamp ? new Date(priceResult.timestamp) : new Date()
          };
        } else if (priceResult && !priceResult.success) {
          return {
            ...company,
            priceError: priceResult.error
          };
        }

        return { ...company };
      });

      setCompaniesWithPrices(updatedCompaniesWithPrices);
      
      // Set last updated to the most recent timestamp from the results
      const timestamps = result.priceResults
        .filter(r => r.success && r.timestamp)
        .map(r => r.timestamp!);
      
      if (timestamps.length > 0) {
        const mostRecentTimestamp = Math.max(...timestamps);
        setLastUpdated(new Date(mostRecentTimestamp));
      } else {
        setLastUpdated(new Date());
      }
      
      setStats({
        total: result.priceResults.length,
        success: result.priceResults.filter(r => r.success).length,
        errors: result.priceResults.filter(r => !r.success).length,
        cached: result.priceResults.filter(r => r.cached).length
      });

      if (onPricesUpdate) {
        onPricesUpdate(result.updatedCompanies);
      }

    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : 'Failed to fetch prices';
      if (onError) {
        onError(errorMsg);
      }
      console.error('Error fetching bulk prices:', error);
    } finally {
      setLoading(false);
    }
  };

  // Initial fetch
  useEffect(() => {
    if (companies.length > 0) {
      fetchPrices();
    }
  }, [companies]);

  // Auto refresh based on settings
  useEffect(() => {
    if (!priceUpdateSettings.autoRefreshEnabled || companies.length === 0) return;

    const interval = setInterval(() => {
      setMarketStatus(PriceUpdateService.getMarketStatus());
      fetchPrices();
    }, priceUpdateSettings.refreshInterval);
    
    return () => clearInterval(interval);
  }, [priceUpdateSettings.autoRefreshEnabled, priceUpdateSettings.refreshInterval, companies]);

  // Update market status periodically
  useEffect(() => {
    const statusInterval = setInterval(() => {
      setMarketStatus(PriceUpdateService.getMarketStatus());
    }, 60000); // Update every minute

    return () => clearInterval(statusInterval);
  }, []);

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
    if (change > 0) return 'text-green-600 dark:text-green-400';
    if (change < 0) return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  };

  const getMarketStatusDisplay = () => {
    const statusConfig = {
      OPEN: { 
        color: 'text-green-600 dark:text-green-400', 
        bg: 'bg-green-50 dark:bg-green-950/50', 
        text: 'Market Open' 
      },
      CLOSED: { 
        color: 'text-gray-600 dark:text-gray-400', 
        bg: 'bg-gray-50 dark:bg-gray-800/50', 
        text: 'Market Closed' 
      },
      PRE_MARKET: { 
        color: 'text-blue-600 dark:text-blue-400', 
        bg: 'bg-blue-50 dark:bg-blue-950/50', 
        text: 'Pre-Market' 
      },
      POST_MARKET: { 
        color: 'text-orange-600 dark:text-orange-400', 
        bg: 'bg-orange-50 dark:bg-orange-950/50', 
        text: 'Post-Market' 
      },
      HOLIDAY: { 
        color: 'text-red-600 dark:text-red-400', 
        bg: 'bg-red-50 dark:bg-red-950/50', 
        text: 'Market Holiday' 
      }
    };

    const config = statusConfig[marketStatus.marketState];
    return (
      <div className={`flex items-center gap-1 px-2 py-1 rounded text-xs ${config.bg} ${config.color}`}>
        <Clock className="w-3 h-3" />
        {config.text}
      </div>
    );
  };

  return (
    <div className={cn('space-y-4', className)}>
      {/* Header with refresh button and stats */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <h3 className="text-lg font-semibold">Stock Prices</h3>
          {getMarketStatusDisplay()}
          {showRefresh && (
            <button
              onClick={() => fetchPrices(true)}
              disabled={loading}
              className="flex items-center gap-2 px-3 py-1 text-sm bg-blue-50 hover:bg-blue-100 dark:bg-blue-950/50 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-400 rounded-md transition-colors disabled:opacity-50"
              title="Force refresh prices (ignores market hours restrictions)"
            >
              <RefreshCw className={cn('w-4 h-4', loading && 'animate-spin')} />
              Refresh Prices
            </button>
          )}
        </div>

        {stats.total > 0 && (
          <div className="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
            <span>Total: {stats.total}</span>
            <span className="text-green-600 dark:text-green-400">Success: {stats.success}</span>
            {stats.errors > 0 && (
              <span className="text-red-600 dark:text-red-400">Errors: {stats.errors}</span>
            )}
            {stats.cached > 0 && (
              <span className="text-blue-600 dark:text-blue-400">Cached: {stats.cached}</span>
            )}
          </div>
        )}
      </div>

      {lastUpdated && (
        <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
          <span>Last updated: {lastUpdated.toLocaleString()}</span>
          {priceUpdateSettings.autoRefreshEnabled && (
            <span className="text-xs">
              Auto-refresh: {priceUpdateSettings.refreshInterval / 60000}min
            </span>
          )}
        </div>
      )}

      {/* Companies list with prices */}
      <div className="space-y-2">
        {companiesWithPrices.map((company) => (
          <div
            key={company.id}
            className="flex items-center justify-between p-3 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg hover:shadow-sm dark:hover:shadow-gray-900/20 transition-shadow"
          >
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <h4 className="font-medium text-gray-900 dark:text-gray-100">{company.company}</h4>
                {company.symbol && (
                  <span className="text-sm text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">
                    {company.symbol}
                  </span>
                )}
              </div>
            </div>

            <div className="flex items-center gap-4">
              {/* Original price from data */}
              <div className="text-right">
                <div className="text-sm text-gray-500 dark:text-gray-400">Original</div>
                <div className="font-medium text-gray-900 dark:text-gray-100">
                  ₹{parseFloat(company.price || '0').toFixed(2)}
                </div>
              </div>

              {/* Current price */}
              <div className="text-right min-w-[120px]">
                {company.priceError ? (
                  <div className="flex items-center gap-1 text-red-600 dark:text-red-400">
                    <AlertCircle className="w-4 h-4" />
                    <span className="text-sm">Error</span>
                  </div>
                ) : company.currentPrice !== undefined ? (
                  <div>
                    <div className="flex items-center gap-1">
                      <span className="font-semibold text-gray-900 dark:text-gray-100">
                        {formatPrice(company.currentPrice)}
                      </span>
                      {company.priceCached && (
                        <span 
                          className="text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/50 px-1 rounded"
                          title={company.priceTimestamp ? `Cached at: ${company.priceTimestamp.toLocaleString()}` : 'Cached data'}
                        >
                          cached
                        </span>
                      )}
                    </div>
                    {company.priceChange !== undefined && (
                      <div className={cn('flex items-center gap-1 text-sm', getTrendColor(company.priceChange))}>
                        {getTrendIcon(company.priceChange)}
                        <span>{formatChange(company.priceChange)}</span>
                        {company.priceChangePercent !== undefined && (
                          <span>({formatChangePercent(company.priceChangePercent)})</span>
                        )}
                      </div>
                    )}
                    {company.priceTimestamp && (
                      <div className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                        {company.priceTimestamp.toLocaleTimeString()}
                      </div>
                    )}
                  </div>
                ) : !company.symbol ? (
                  <div className="text-sm text-gray-400 dark:text-gray-500">No symbol</div>
                ) : loading ? (
                  <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    <span className="text-sm">Loading...</span>
                  </div>
                ) : (
                  <div className="text-sm text-gray-400 dark:text-gray-500">No data</div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {companiesWithPrices.length === 0 && !loading && (
        <div className="text-center py-8 text-gray-500 dark:text-gray-400">
          No companies to display
        </div>
      )}
    </div>
  );
};

export default BulkStockPrices;