'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/store';
import { updateStockPrices, removeStockFromWatchlist } from '@/lib/redux/slices/watchlistsSlice';
import { loadPriceUpdateSettings } from '@/lib/redux/slices/settingsSlice';
import { Watchlist, WatchlistStock } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AddStockDialog } from './AddStockDialog';
import { MoveStockDialog } from './MoveStockDialog';
import {
  Plus,
  RefreshCw,
  MoreVertical,
  Trash2,
  TrendingUp,
  TrendingDown,
  ArrowRightLeft,
  ArrowUpDown,
  ArrowUp,
  ArrowDown
} from 'lucide-react';
import { toast } from 'sonner';
import { getMarketStatus } from '@/lib/utils/marketHours';
import PriceUpdateService from '@/lib/services/priceUpdateService';
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils/dateUtils';

type SortField = 'name' | 'currentPrice' | 'priceChange' | 'peRatio' | 'marketCap' | 'priceToBook';
type SortDirection = 'asc' | 'desc';

interface WatchlistDisplayProps {
  watchlist: Watchlist;
}

export function WatchlistDisplay({ watchlist }: WatchlistDisplayProps) {
  const dispatch = useAppDispatch();
  const { priceUpdateSettings, loading: settingsLoading } = useAppSelector(state => state.settings);
  const [showAddStockDialog, setShowAddStockDialog] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [stockToDelete, setStockToDelete] = useState<WatchlistStock | null>(null);
  const [moveDialogOpen, setMoveDialogOpen] = useState(false);
  const [stockToMove, setStockToMove] = useState<WatchlistStock | null>(null);
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');

  // Use refs to store current values without causing re-renders
  const settingsRef = useRef(priceUpdateSettings);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const watchlistRef = useRef(watchlist);

  // Update refs when values change
  useEffect(() => {
    settingsRef.current = priceUpdateSettings;
  }, [priceUpdateSettings]);

  useEffect(() => {
    watchlistRef.current = watchlist;
  }, [watchlist]);

  const handleRefreshPrices = useCallback(async (forceRefresh = false, showToast = true) => {
    if (watchlist.stocks.length === 0) return;

    setRefreshing(true);
    try {
      const symbols = watchlist.stocks.map(stock => stock.symbol);
      const currentSettings = settingsRef.current;

      // Use PriceUpdateService instead of direct API call (same as dashboard)
      const bulkResult = forceRefresh
        ? await PriceUpdateService.forceFetchBulkStockPrices(symbols)
        : await PriceUpdateService.getBulkStockPrices(symbols, {
          marketHoursOnly: currentSettings?.marketHoursOnly ?? true,
          checkHolidays: currentSettings?.checkMarketHolidays ?? true
        });

      if (bulkResult.results && bulkResult.results.length > 0) {
        const priceUpdates = watchlist.stocks.map(stock => {
          const formattedSymbol = stock.symbol.includes('.') ? stock.symbol : `${stock.symbol}.NS`;
          const priceResult = bulkResult.results.find(result =>
            result.symbol === formattedSymbol && result.success
          );

          if (priceResult && priceResult.price !== undefined) {
            return {
              stockId: stock.id,
              currentPrice: priceResult.price,
              priceChange: priceResult.change || 0,
              priceChangePercent: priceResult.changePercent || 0,
              peRatio: priceResult.trailingPE || priceResult.forwardPE || null,
              marketCap: priceResult.marketCap || null,
              priceToBook: priceResult.priceToBook || null,
            };
          }

          return {
            stockId: stock.id,
            currentPrice: stock.currentPrice || 0,
            priceChange: stock.priceChange || 0,
            priceChangePercent: stock.priceChangePercent || 0,
            peRatio: stock.peRatio,
            marketCap: stock.marketCap,
            priceToBook: stock.priceToBook,
          };
        });

        await dispatch(updateStockPrices({
          watchlistId: watchlist.id,
          priceUpdates,
        })).unwrap();

        const successCount = bulkResult.totalSuccess;
        const cachedCount = bulkResult.totalCached;

        // Only show toast for manual refresh or when there are actual updates
        if (showToast && (forceRefresh || successCount > 0)) {
          if (successCount > 0) {
            toast.success(
              `Stock prices updated (${successCount} stocks${cachedCount > 0 ? `, ${cachedCount} from cache` : ''})`
            );
          } else if (forceRefresh) {
            toast.warning('No stock prices were updated');
          }
        }
      }
    } catch (error) {
      if (showToast) {
        toast.error('Failed to refresh stock prices');
      }
      console.error('Price refresh error:', error);
    } finally {
      setRefreshing(false);
    }
  }, [dispatch, watchlist.id, watchlist.stocks]);

  // Auto-refresh function using refs to avoid dependencies
  const autoRefreshPricesRef = useRef<(() => Promise<void>) | null>(null);

  // Update the ref function whenever dispatch changes
  useEffect(() => {
    autoRefreshPricesRef.current = async () => {
      const currentWatchlist = watchlistRef.current;
      if (currentWatchlist.stocks.length === 0) return;

      try {
        const symbols = currentWatchlist.stocks.map(stock => stock.symbol);
        const currentSettings = settingsRef.current;

        const bulkResult = await PriceUpdateService.getBulkStockPrices(symbols, {
          marketHoursOnly: currentSettings?.marketHoursOnly ?? true,
          checkHolidays: currentSettings?.checkMarketHolidays ?? true
        });

        if (bulkResult.results && bulkResult.results.length > 0) {
          const priceUpdates = currentWatchlist.stocks.map(stock => {
            const formattedSymbol = stock.symbol.includes('.') ? stock.symbol : `${stock.symbol}.NS`;
            const priceResult = bulkResult.results.find(result =>
              result.symbol === formattedSymbol && result.success
            );

            if (priceResult && priceResult.price !== undefined) {
              return {
                stockId: stock.id,
                currentPrice: priceResult.price,
                priceChange: priceResult.change || 0,
                priceChangePercent: priceResult.changePercent || 0,
                peRatio: priceResult.trailingPE || priceResult.forwardPE || null,
                marketCap: priceResult.marketCap || null,
                priceToBook: priceResult.priceToBook || null,
              };
            }

            return {
              stockId: stock.id,
              currentPrice: stock.currentPrice || 0,
              priceChange: stock.priceChange || 0,
              priceChangePercent: stock.priceChangePercent || 0,
              peRatio: stock.peRatio,
              marketCap: stock.marketCap,
              priceToBook: stock.priceToBook,
            };
          });

          await dispatch(updateStockPrices({
            watchlistId: currentWatchlist.id,
            priceUpdates,
          })).unwrap();
        }
      } catch (error) {
        console.error('Auto-refresh error:', error);
      }
    };
  }, [dispatch]);

  // Auto-refresh prices based on settings
  useEffect(() => {
    // Clear existing interval
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    // Wait for settings to load and ensure auto-refresh is enabled
    if (settingsLoading ||
      !priceUpdateSettings ||
      !priceUpdateSettings.autoRefreshEnabled ||
      watchlist.stocks.length === 0) {
      return;
    }

    // Initial refresh when component mounts (silent)
    autoRefreshPricesRef.current?.();

    // Set up interval for auto-refresh
    intervalRef.current = setInterval(() => {
      // Always try to refresh, let the service handle market hours logic (silent auto-refresh)
      console.log('Auto-refreshing watchlist prices...');
      autoRefreshPricesRef.current?.();
    }, priceUpdateSettings.refreshInterval);

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [
    watchlist.stocks.length,
    settingsLoading,
    priceUpdateSettings?.autoRefreshEnabled,
    priceUpdateSettings?.refreshInterval
  ]);

  const handleRemoveStock = async (stock: WatchlistStock) => {
    try {
      await dispatch(removeStockFromWatchlist({
        watchlistId: watchlist.id,
        stockId: stock.id,
      })).unwrap();

      toast.success(`${stock.companyName} removed from watchlist`);
      setDeleteDialogOpen(false);
      setStockToDelete(null);
    } catch (error) {
      toast.error('Failed to remove stock from watchlist');
    }
  };

  const openDeleteDialog = (stock: WatchlistStock) => {
    setStockToDelete(stock);
    setDeleteDialogOpen(true);
  };

  const openMoveDialog = (stock: WatchlistStock) => {
    setStockToMove(stock);
    setMoveDialogOpen(true);
  };

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(value);
  };

  const formatPercentage = (value: number) => {
    // Convert decimal to percentage (e.g., 0.0196 -> 1.96%)
    const percentage = value * 100;
    return `${percentage >= 0 ? '+' : ''}${percentage.toFixed(2)}%`;
  };

  const formatMarketCap = (value: number) => {
    // Convert to crores for Indian market display (same as dashboard)
    const crores = value / 10000000; // 1 crore = 10 million
    return `₹${formatNumber(crores)}Cr`;
  };

  const getRefreshIntervalLabel = (interval: number) => {
    const minutes = interval / (1000 * 60);
    if (minutes < 60) {
      return `${minutes} min`;
    }
    const hours = minutes / 60;
    return `${hours} hr`;
  };

  const marketStatus = getMarketStatus();

  // Handle sorting
  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Sort stocks based on current sort field and direction
  const sortedStocks = useMemo(() => {
    const stocks = [...watchlist.stocks];

    return stocks.sort((a, b) => {
      let aValue: any;
      let bValue: any;

      switch (sortField) {
        case 'name':
          aValue = a.companyName.toLowerCase();
          bValue = b.companyName.toLowerCase();
          break;
        case 'currentPrice':
          aValue = a.currentPrice || 0;
          bValue = b.currentPrice || 0;
          break;
        case 'priceChange':
          aValue = a.priceChange || 0;
          bValue = b.priceChange || 0;
          break;
        case 'peRatio':
          aValue = a.peRatio || 0;
          bValue = b.peRatio || 0;
          break;
        case 'marketCap':
          aValue = a.marketCap || 0;
          bValue = b.marketCap || 0;
          break;
        case 'priceToBook':
          aValue = a.priceToBook || 0;
          bValue = b.priceToBook || 0;
          break;
        default:
          return 0;
      }

      if (sortField === 'name') {
        // String comparison
        if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1;
        return 0;
      } else {
        // Numeric comparison
        const result = aValue - bValue;
        return sortDirection === 'asc' ? result : -result;
      }
    });
  }, [watchlist.stocks, sortField, sortDirection]);

  // Render sort icon
  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="h-3 w-3 ml-1 opacity-50" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-3 w-3 ml-1" />
      : <ArrowDown className="h-3 w-3 ml-1" />;
  };

  // Load price update settings on mount
  useEffect(() => {
    dispatch(loadPriceUpdateSettings());
  }, [dispatch]);

  // Listen for settings changes
  useEffect(() => {
    const handleSettingsChange = () => {
      dispatch(loadPriceUpdateSettings());
    };

    window.addEventListener('priceUpdateSettingsChanged', handleSettingsChange);
    return () => {
      window.removeEventListener('priceUpdateSettingsChanged', handleSettingsChange);
    };
  }, [dispatch]);

  // Cleanup interval on unmount
  useEffect(() => {
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, []);



  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>{watchlist.name}</CardTitle>
              {watchlist.description && (
                <p className="text-sm text-muted-foreground mt-1">
                  {watchlist.description}
                </p>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => handleRefreshPrices(true)}
                disabled={refreshing || watchlist.stocks.length === 0}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
              <Button onClick={() => setShowAddStockDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Stock
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          {watchlist.stocks.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground mb-4">
                No stocks in this watchlist yet
              </p>
              <Button onClick={() => setShowAddStockDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Stock
              </Button>
            </div>
          ) : (
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>
                      <button
                        className="flex items-center hover:text-foreground transition-colors"
                        onClick={() => handleSort('name')}
                      >
                        Stock
                        {renderSortIcon('name')}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        className="flex items-center ml-auto hover:text-foreground transition-colors"
                        onClick={() => handleSort('currentPrice')}
                      >
                        Current Price
                        {renderSortIcon('currentPrice')}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        className="flex items-center ml-auto hover:text-foreground transition-colors"
                        onClick={() => handleSort('priceChange')}
                      >
                        Change
                        {renderSortIcon('priceChange')}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        className="flex items-center ml-auto hover:text-foreground transition-colors"
                        onClick={() => handleSort('peRatio')}
                      >
                        P/E
                        {renderSortIcon('peRatio')}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        className="flex items-center ml-auto hover:text-foreground transition-colors"
                        onClick={() => handleSort('marketCap')}
                      >
                        Market Cap
                        {renderSortIcon('marketCap')}
                      </button>
                    </TableHead>
                    <TableHead className="text-right">
                      <button
                        className="flex items-center ml-auto hover:text-foreground transition-colors"
                        onClick={() => handleSort('priceToBook')}
                      >
                        P/B
                        {renderSortIcon('priceToBook')}
                      </button>
                    </TableHead>
                    <TableHead className="w-[50px]"></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedStocks.map((stock) => {
                    return (
                      <TableRow key={stock.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{stock.companyName}</div>
                            <div className="text-sm text-muted-foreground">
                              {stock.symbol}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1">
                              Added: {formatDate(stock.addedAt)}
                              {stock.addedPrice && (
                                <span className="ml-2">
                                  @ {formatCurrency(stock.addedPrice)}
                                </span>
                              )}
                            </div>
                          </div>
                        </TableCell>

                        <TableCell className="text-right">
                          {stock.currentPrice ? (
                            <div className="font-medium">
                              {formatCurrency(stock.currentPrice)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {stock.priceChange !== undefined && stock.priceChangePercent !== undefined ? (
                            <div className={`flex items-center justify-end gap-1 ${stock.priceChange >= 0 ? 'text-green-600' : 'text-red-600'
                              }`}>
                              {stock.priceChange >= 0 ? (
                                <TrendingUp className="h-3 w-3" />
                              ) : (
                                <TrendingDown className="h-3 w-3" />
                              )}
                              <div className="text-sm">
                                <div>{formatCurrency(Math.abs(stock.priceChange))}</div>
                                <div>{formatPercentage(stock.priceChangePercent)}</div>
                              </div>
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {stock.peRatio !== null && stock.peRatio !== undefined && !isNaN(stock.peRatio) ? (
                            <div className="text-sm">
                              {stock.peRatio.toFixed(2)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {stock.marketCap !== null && stock.marketCap !== undefined && !isNaN(stock.marketCap) ? (
                            <div className="text-sm">
                              {formatMarketCap(stock.marketCap)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell className="text-right">
                          {stock.priceToBook !== null && stock.priceToBook !== undefined && !isNaN(stock.priceToBook) ? (
                            <div className="text-sm">
                              {stock.priceToBook.toFixed(2)}
                            </div>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>

                        <TableCell>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => openMoveDialog(stock)}>
                                <ArrowRightLeft className="h-4 w-4 mr-2" />
                                Move to Another Watchlist
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => openDeleteDialog(stock)}
                                className="text-destructive"
                              >
                                <Trash2 className="h-4 w-4 mr-2" />
                                Remove
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}

          {watchlist.stocks.length > 0 && (
            <div className="mt-4 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground">
                <div className="flex items-center gap-4">
                  <span>
                    Last updated: {watchlist.stocks.some(s => s.lastUpdated)
                      ? formatDateTime(new Date(Math.max(...watchlist.stocks
                        .filter(s => s.lastUpdated)
                        .map(s => new Date(s.lastUpdated!).getTime())
                      )))
                      : 'Never'
                    }
                  </span>
                  <span className="flex items-center gap-1">
                    Market:
                    <span className={`font-medium ${marketStatus.isOpen
                      ? 'text-green-600'
                      : marketStatus.isHoliday
                        ? 'text-orange-600'
                        : 'text-red-600'
                      }`}>
                      {marketStatus.marketState}
                    </span>
                  </span>
                </div>
                <div className="flex items-center gap-4">
                  <span className="flex items-center gap-1">
                    Auto-refresh:
                    <span className={`ml-1 font-medium flex items-center gap-1 ${priceUpdateSettings?.autoRefreshEnabled
                      ? 'text-green-600'
                      : 'text-red-600'
                      }`}>
                      {priceUpdateSettings?.autoRefreshEnabled ? (
                        <>
                          <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                          {getRefreshIntervalLabel(priceUpdateSettings.refreshInterval || 3600000)}
                        </>
                      ) : (
                        'Off'
                      )}
                    </span>
                  </span>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <AddStockDialog
        open={showAddStockDialog}
        onOpenChange={setShowAddStockDialog}
        watchlistId={watchlist.id}
      />

      <MoveStockDialog
        open={moveDialogOpen}
        onOpenChange={setMoveDialogOpen}
        stock={stockToMove}
        currentWatchlistId={watchlist.id}
      />

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Remove Stock</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to remove {stockToDelete?.companyName} from this watchlist?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => stockToDelete && handleRemoveStock(stockToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}