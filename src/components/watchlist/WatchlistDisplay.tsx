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
  ArrowDown,
  Settings,
  Eye,
  EyeOff
} from 'lucide-react';
import { toast } from 'sonner';
import { getMarketStatus } from '@/lib/utils/marketHours';
import PriceUpdateService from '@/lib/services/priceUpdateService';
import { formatDate, formatDateTime, formatNumber } from '@/lib/utils/dateUtils';

type SortField = 'name' | 'currentPrice' | 'priceChange' | 'peRatio' | 'marketCap' | 'priceToBook' | 'fiftyTwoWeekHighDistance' | 'volume' | 'dayRange' | 'beta';
type SortDirection = 'asc' | 'desc';

// Column configuration interface
interface ColumnConfig {
  key: SortField;
  label: string;
  subLabel?: string;
  width?: string;
  align?: 'left' | 'center' | 'right';
  sortable?: boolean;
  visible?: boolean;
  render: (stock: WatchlistStock) => React.ReactNode;
  getValue?: (stock: WatchlistStock) => any; // For sorting
}

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
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    name: true,
    currentPrice: true,
    priceChange: true,
    peRatio: true,
    marketCap: true,
    priceToBook: true,
    fiftyTwoWeekHighDistance: true,
    volume: false, // Enable volume by default to show wider table
    dayRange: false,
    beta: false // Enable beta by default to show wider table
  });

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
              fiftyTwoWeekHigh: priceResult.fiftyTwoWeekHigh || null,
              fiftyTwoWeekLow: priceResult.fiftyTwoWeekLow || null,
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
            fiftyTwoWeekHigh: stock.fiftyTwoWeekHigh,
            fiftyTwoWeekLow: stock.fiftyTwoWeekLow,
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
                fiftyTwoWeekHigh: priceResult.fiftyTwoWeekHigh || null,
                fiftyTwoWeekLow: priceResult.fiftyTwoWeekLow || null,
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
              fiftyTwoWeekHigh: stock.fiftyTwoWeekHigh,
              fiftyTwoWeekLow: stock.fiftyTwoWeekLow,
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

  const calculateFiftyTwoWeekHighDistance = (currentPrice: number, fiftyTwoWeekHigh: number) => {
    if (!currentPrice || !fiftyTwoWeekHigh) return null;
    const distance = ((currentPrice - fiftyTwoWeekHigh) / fiftyTwoWeekHigh) * 100;
    return distance;
  };

  const formatFiftyTwoWeekHighDistance = (distance: number | null) => {
    if (distance === null) return '-';
    const isNegative = distance < 0;
    const absDistance = Math.abs(distance);
    return `${isNegative ? '-' : '+'}${absDistance.toFixed(1)}%`;
  };

  const formatVolume = (volume: number) => {
    if (volume >= 10000000) {
      return `${(volume / 10000000).toFixed(1)}Cr`;
    } else if (volume >= 100000) {
      return `${(volume / 100000).toFixed(1)}L`;
    } else if (volume >= 1000) {
      return `${(volume / 1000).toFixed(1)}K`;
    }
    return volume.toString();
  };

  // Column configurations - easily extendable
  const columnConfigs: ColumnConfig[] = [
    {
      key: 'name',
      label: 'Stock',
      align: 'left',
      sortable: true,
      render: (stock) => (
        <div>
          <div className="font-medium">{stock.companyName}</div>
          <div className="text-sm text-muted-foreground">{stock.symbol}</div>
          <div className="text-xs text-muted-foreground mt-1">
            Added: {formatDate(stock.addedAt)}
            {stock.addedPrice && (
              <span className="ml-2">@ {formatCurrency(stock.addedPrice)}</span>
            )}
          </div>
        </div>
      ),
      getValue: (stock) => stock.companyName.toLowerCase()
    },
    {
      key: 'currentPrice',
      label: 'Price',
      subLabel: '& 52W Range',
      align: 'right',
      sortable: true,
      render: (stock) => (
        stock.currentPrice ? (
          <div>
            <div className="font-medium">{formatCurrency(stock.currentPrice)}</div>
            {stock.fiftyTwoWeekHigh && (
              <div className="text-xs text-muted-foreground mt-1">
                52W: {formatCurrency(stock.fiftyTwoWeekLow || 0)} - {formatCurrency(stock.fiftyTwoWeekHigh)}
              </div>
            )}
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
      getValue: (stock) => stock.currentPrice || 0
    },
    {
      key: 'priceChange',
      label: 'Change',
      subLabel: '₹ & %',
      align: 'right',
      sortable: true,
      render: (stock) => (
        stock.priceChange !== undefined && stock.priceChangePercent !== undefined ? (
          <div className={`${stock.priceChange >= 0 ? 'text-green-600' : 'text-red-600'}`}>
            <div className="flex items-center justify-end gap-1">
              {stock.priceChange >= 0 ? (
                <TrendingUp className="h-3 w-3" />
              ) : (
                <TrendingDown className="h-3 w-3" />
              )}
              <span className="text-sm font-medium">
                {formatCurrency(Math.abs(stock.priceChange))}
              </span>
            </div>
            <div className="text-xs mt-1">
              {formatPercentage(stock.priceChangePercent)}
            </div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
      getValue: (stock) => stock.priceChange || 0
    },
    {
      key: 'peRatio',
      label: 'P/E',
      align: 'right',
      sortable: true,
      render: (stock) => (
        stock.peRatio !== null && stock.peRatio !== undefined && !isNaN(stock.peRatio) ? (
          <div className="text-sm">{stock.peRatio.toFixed(2)}</div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
      getValue: (stock) => stock.peRatio || 0
    },
    {
      key: 'marketCap',
      label: 'Market Cap',
      align: 'right',
      sortable: true,
      render: (stock) => (
        stock.marketCap !== null && stock.marketCap !== undefined && !isNaN(stock.marketCap) ? (
          <div className="text-sm">{formatMarketCap(stock.marketCap)}</div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
      getValue: (stock) => stock.marketCap || 0
    },
    {
      key: 'priceToBook',
      label: 'P/B',
      align: 'right',
      sortable: true,
      render: (stock) => (
        stock.priceToBook !== null && stock.priceToBook !== undefined && !isNaN(stock.priceToBook) ? (
          <div className="text-sm">{stock.priceToBook.toFixed(2)}</div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
      getValue: (stock) => stock.priceToBook || 0
    },
    {
      key: 'fiftyTwoWeekHighDistance',
      label: 'Distance',
      subLabel: 'from 52W High',
      align: 'right',
      sortable: true,
      render: (stock) => (
        stock.currentPrice && stock.fiftyTwoWeekHigh ? (
          <div>
            <div className={`text-sm font-medium ${calculateFiftyTwoWeekHighDistance(stock.currentPrice, stock.fiftyTwoWeekHigh)! < 0
              ? 'text-red-600'
              : 'text-green-600'
              }`}>
              {formatFiftyTwoWeekHighDistance(
                calculateFiftyTwoWeekHighDistance(stock.currentPrice, stock.fiftyTwoWeekHigh)
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-1">from high</div>
          </div>
        ) : (
          <span className="text-muted-foreground">-</span>
        )
      ),
      getValue: (stock) => calculateFiftyTwoWeekHighDistance(stock.currentPrice || 0, stock.fiftyTwoWeekHigh || 0) || -999
    },
    // Additional columns that can be easily enabled/disabled
    {
      key: 'volume',
      label: 'Volume',
      align: 'right',
      sortable: true,
      render: (stock) => (
        <div className="text-sm">
          {/* Volume data would come from API - placeholder for now */}
          <span className="text-muted-foreground">-</span>
        </div>
      ),
      getValue: (stock) => 0 // Placeholder
    },
    {
      key: 'dayRange',
      label: 'Day Range',
      subLabel: 'Low - High',
      align: 'right',
      sortable: false,
      render: (stock) => (
        <div className="text-xs">
          {/* Day range data would come from API - placeholder for now */}
          <span className="text-muted-foreground">-</span>
        </div>
      )
    },
    {
      key: 'beta',
      label: 'Beta',
      align: 'right',
      sortable: true,
      render: (stock) => (
        <div className="text-sm">
          {/* Beta data would come from API - placeholder for now */}
          <span className="text-muted-foreground">-</span>
        </div>
      ),
      getValue: (stock) => 0 // Placeholder
    }
  ];

  // Filter visible columns based on state
  const visibleColumns = columnConfigs.filter(col => columnVisibility[col.key]);

  const toggleColumnVisibility = (columnKey: string) => {
    setColumnVisibility(prev => ({
      ...prev,
      [columnKey]: !prev[columnKey]
    }));
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
    const column = columnConfigs.find(col => col.key === sortField);

    if (!column || !column.getValue) return stocks;

    return stocks.sort((a, b) => {
      const aValue = column.getValue!(a);
      const bValue = column.getValue!(b);

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
  }, [watchlist.stocks, sortField, sortDirection, columnConfigs]);

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
      <Card className="mb-6">
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
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="sm">
                    <Settings className="h-4 w-4 mr-2" />
                    Columns
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-48">
                  <div className="px-2 py-1.5 text-sm font-medium text-muted-foreground">
                    Show/Hide Columns
                  </div>
                  {columnConfigs.map((column) => (
                    <DropdownMenuItem
                      key={column.key}
                      onClick={() => toggleColumnVisibility(column.key)}
                      className="flex items-center justify-between"
                    >
                      <span>{column.label}</span>
                      {columnVisibility[column.key] ? (
                        <Eye className="h-4 w-4" />
                      ) : (
                        <EyeOff className="h-4 w-4" />
                      )}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>
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

        <CardContent className="p-0">
          {watchlist.stocks.length === 0 ? (
            <div className="text-center py-8 px-6">
              <p className="text-muted-foreground mb-4">
                No stocks in this watchlist yet
              </p>
              <Button onClick={() => setShowAddStockDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Stock
              </Button>
            </div>
          ) : (
            <div className="px-6">
              <div className="rounded-md border overflow-x-auto">
                <Table className="min-w-full">
                  <TableHeader>
                    <TableRow>
                      {visibleColumns.map((column) => (
                        <TableHead
                          key={column.key}
                          className={`${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''} ${column.width || ''}`}
                        >
                          {column.sortable ? (
                            <button
                              className={`flex items-center hover:text-foreground transition-colors ${column.align === 'right' ? 'ml-auto' : column.align === 'center' ? 'mx-auto' : ''
                                }`}
                              onClick={() => handleSort(column.key)}
                            >
                              {column.subLabel ? (
                                <div className={column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}>
                                  <div>{column.label}</div>
                                  <div className="text-xs font-normal text-muted-foreground">{column.subLabel}</div>
                                </div>
                              ) : (
                                column.label
                              )}
                              {renderSortIcon(column.key)}
                            </button>
                          ) : (
                            <div className={column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}>
                              {column.subLabel ? (
                                <>
                                  <div>{column.label}</div>
                                  <div className="text-xs font-normal text-muted-foreground">{column.subLabel}</div>
                                </>
                              ) : (
                                column.label
                              )}
                            </div>
                          )}
                        </TableHead>
                      ))}
                      <TableHead className="w-[50px]"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sortedStocks.map((stock) => (
                      <TableRow key={stock.id}>
                        {visibleColumns.map((column) => (
                          <TableCell
                            key={column.key}
                            className={`${column.align === 'right' ? 'text-right' : column.align === 'center' ? 'text-center' : ''}`}
                          >
                            {column.render(stock)}
                          </TableCell>
                        ))}
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
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {watchlist.stocks.length > 0 && (
            <div className="mt-4 px-6 space-y-2">
              <div className="flex items-center justify-between text-sm text-muted-foreground pb-4">
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