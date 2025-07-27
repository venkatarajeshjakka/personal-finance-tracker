'use client';

import React, { useState, useEffect } from 'react';
import { AppLayout } from '@/components/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppDispatch, useAppSelector } from '@/lib/redux/store';
import { loadCompanies } from '@/lib/redux/slices/companiesSlice';

import BulkStockPrices from '@/components/stocks/BulkStockPrices';
import PriceUpdateService from '@/lib/services/priceUpdateService';
import { 
  TrendingUp, 
  BarChart3, 
  AlertCircle,
  Info,
  Clock
} from 'lucide-react';

export default function StocksPage() {
  const dispatch = useAppDispatch();
  const { data: companies, loading } = useAppSelector(state => state.companies);
  const [mounted, setMounted] = useState(false);

  const [cacheStats, setCacheStats] = useState({
    totalCached: 0,
    validCached: 0,
    expiredCached: 0
  });

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load companies on mount
  useEffect(() => {
    if (mounted) {
      dispatch(loadCompanies());
    }
  }, [dispatch, mounted]);

  // Update cache stats periodically
  useEffect(() => {
    if (!mounted) return;

    const updateStats = () => {
      setCacheStats(PriceUpdateService.getCacheStats());
    };

    updateStats();
    const interval = setInterval(updateStats, 5000); // Update every 5 seconds

    return () => clearInterval(interval);
  }, [mounted]);

  const handleClearCache = () => {
    PriceUpdateService.clearCache();
    setCacheStats(PriceUpdateService.getCacheStats());
  };

  const handleCleanExpiredCache = () => {
    const cleanedCount = PriceUpdateService.cleanExpiredCache();
    setCacheStats(PriceUpdateService.getCacheStats());
    console.log(`Cleaned ${cleanedCount} expired cache entries`);
  };

  const companiesWithSymbols = companies.filter(company => 
    company.symbol && company.symbol.trim() !== ''
  );

  const companiesWithoutSymbols = companies.filter(company => 
    !company.symbol || company.symbol.trim() === ''
  );

  if (!mounted) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <TrendingUp className="h-8 w-8" />
              Stock Prices
            </h1>
            <p className="text-muted-foreground">
              Real-time stock prices powered by Yahoo Finance API
            </p>
          </div>

          {/* Cache Stats */}
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Cache: {cacheStats.validCached} valid, {cacheStats.expiredCached} expired</span>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCleanExpiredCache}
              className="text-xs"
            >
              Clean Cache
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={handleClearCache}
              className="text-xs"
            >
              Clear All Cache
            </Button>
          </div>
        </div>

        {/* API Information */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            Stock prices are fetched from Yahoo Finance API with automatic NSE (.NS) suffix for Indian stocks. 
            Prices are cached for 1 minute to optimize performance and respect rate limits.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="bulk" className="space-y-6">
          <TabsList>
            <TabsTrigger value="bulk">Bulk Price Updates</TabsTrigger>
            <TabsTrigger value="companies">Company Integration</TabsTrigger>
          </TabsList>

          {/* Bulk Price Updates Tab */}
          <TabsContent value="bulk" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Bulk Stock Price Updates
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-muted-foreground">
                        Companies with symbols: {companiesWithSymbols.length}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Companies without symbols: {companiesWithoutSymbols.length}
                      </p>
                    </div>
                    <Badge variant="outline">
                      {companiesWithSymbols.length} trackable stocks
                    </Badge>
                  </div>

                  {companiesWithSymbols.length > 0 ? (
                    <BulkStockPrices
                      companies={companiesWithSymbols}
                      showRefresh={true}
                    />
                  ) : (
                    <div className="text-center py-8 text-muted-foreground">
                      <AlertCircle className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No companies with stock symbols found.</p>
                      <p className="text-sm">Import NSE company data to add symbols to your companies.</p>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>



          {/* Company Integration Tab */}
          <TabsContent value="companies" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              {/* Companies with Symbols */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">Companies with Stock Symbols</CardTitle>
                </CardHeader>
                <CardContent>
                  {companiesWithSymbols.length > 0 ? (
                    <div className="space-y-3">
                      {companiesWithSymbols.slice(0, 10).map((company) => (
                        <div key={company.id} className="flex items-center justify-between p-2 border rounded">
                          <div>
                            <div className="font-medium">{company.company}</div>
                            <div className="text-sm text-muted-foreground">{company.symbol}</div>
                          </div>
                          <div className="text-right">
                            <div className="text-sm text-muted-foreground">Data Price</div>
                            <div className="font-medium">₹{parseFloat(company.price || '0').toFixed(2)}</div>
                          </div>
                        </div>
                      ))}
                      {companiesWithSymbols.length > 10 && (
                        <p className="text-sm text-muted-foreground text-center">
                          ... and {companiesWithSymbols.length - 10} more companies
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>No companies with symbols</p>
                    </div>
                  )}
                </CardContent>
              </Card>

              {/* Companies without Symbols */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-orange-600">Companies without Stock Symbols</CardTitle>
                </CardHeader>
                <CardContent>
                  {companiesWithoutSymbols.length > 0 ? (
                    <div className="space-y-2">
                      {companiesWithoutSymbols.slice(0, 10).map((company) => (
                        <div key={company.id} className="p-2 border rounded">
                          <div className="font-medium">{company.company}</div>
                          <div className="text-sm text-muted-foreground">
                            Data Price: ₹{parseFloat(company.price || '0').toFixed(2)}
                          </div>
                        </div>
                      ))}
                      {companiesWithoutSymbols.length > 10 && (
                        <p className="text-sm text-muted-foreground text-center">
                          ... and {companiesWithoutSymbols.length - 10} more companies
                        </p>
                      )}
                      <Alert>
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription>
                          Upload NSE company data in Settings to automatically add stock symbols to these companies.
                        </AlertDescription>
                      </Alert>
                    </div>
                  ) : (
                    <div className="text-center py-4 text-muted-foreground">
                      <p>All companies have symbols!</p>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}