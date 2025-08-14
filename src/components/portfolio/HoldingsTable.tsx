'use client';

import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {

  TableHead,

} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Search,
  Download,
  RefreshCw,

} from 'lucide-react';
import { Holding } from '@/types';
import { MobileHoldingsView } from './mobile/MobileHoldingsView';
import { HoldingRow } from './HoldingRow';

type SortColumn = 'symbol' | 'quantity' | 'averagePrice' | 'currentPrice' | 'invested' | 'currentValue' | 'unrealizedGain' | 'dailyGain' | 'dayChange';
type SortDirection = 'asc' | 'desc';

interface HoldingsTableProps {
  holdings: Holding[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function HoldingsTable({ holdings, onRefresh, refreshing = false }: HoldingsTableProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [sortColumn, setSortColumn] = useState<SortColumn>('symbol');
  const [sortDirection, setSortDirection] = useState<SortDirection>('asc');
  const [selectedHoldings, setSelectedHoldings] = useState<Set<string>>(new Set());
  const [isMobile, setIsMobile] = useState(false);

  // Check if mobile view should be used
  React.useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);


  const calculateInvestedAmount = (holding: Holding) => {
    return holding.quantity * holding.averagePrice;
  };

  const calculateNetChange = (holding: Holding) => {
    return holding.currentPrice - holding.averagePrice;
  };

  const calculateNetChangePercent = (holding: Holding) => {
    if (holding.averagePrice === 0) return 0;
    return ((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100;
  };

  // Filtering and sorting logic
  const filteredAndSortedHoldings = useMemo(() => {
    let filtered = holdings.filter(holding =>
      holding.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (holding.sector && holding.sector.toLowerCase().includes(searchTerm.toLowerCase()))
    );

    // Sort holdings
    filtered.sort((a, b) => {
      let aValue: number | string;
      let bValue: number | string;

      switch (sortColumn) {
        case 'symbol':
          aValue = a.symbol;
          bValue = b.symbol;
          break;
        case 'quantity':
          aValue = a.quantity;
          bValue = b.quantity;
          break;
        case 'averagePrice':
          aValue = a.averagePrice;
          bValue = b.averagePrice;
          break;
        case 'currentPrice':
          aValue = a.currentPrice;
          bValue = b.currentPrice;
          break;
        case 'invested':
          aValue = calculateInvestedAmount(a);
          bValue = calculateInvestedAmount(b);
          break;
        case 'currentValue':
          aValue = a.totalValue;
          bValue = b.totalValue;
          break;
        case 'unrealizedGain':
          aValue = a.unrealizedGain;
          bValue = b.unrealizedGain;
          break;
        case 'dailyGain':
          aValue = a.dayGainLoss || 0;
          bValue = b.dayGainLoss || 0;
          break;
        case 'dayChange':
          aValue = a.priceChange || 0;
          bValue = b.priceChange || 0;
          break;
        default:
          aValue = a.symbol;
          bValue = b.symbol;
      }

      if (typeof aValue === 'string' && typeof bValue === 'string') {
        return sortDirection === 'asc'
          ? aValue.localeCompare(bValue)
          : bValue.localeCompare(aValue);
      }

      return sortDirection === 'asc'
        ? (aValue as number) - (bValue as number)
        : (bValue as number) - (aValue as number);
    });

    return filtered;
  }, [holdings, searchTerm, sortColumn, sortDirection]);

  const handleSort = (column: SortColumn) => {
    if (sortColumn === column) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortColumn(column);
      setSortDirection('asc');
    }
  };

  const handleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedHoldings(new Set(filteredAndSortedHoldings.map(h => h.id)));
    } else {
      setSelectedHoldings(new Set());
    }
  };

  const handleSelectHolding = (holdingId: string, checked: boolean) => {
    const newSelected = new Set(selectedHoldings);
    if (checked) {
      newSelected.add(holdingId);
    } else {
      newSelected.delete(holdingId);
    }
    setSelectedHoldings(newSelected);
  };

  const exportToCSV = () => {
    const headers = [
      'Symbol', 'Quantity', 'Avg Cost', 'LTP', 'Invested', 'Current Value',
      'P&L', 'P&L %', 'Net Change', 'Net Change %', 'Day Change', 'Day Change %'
    ];

    const csvData = filteredAndSortedHoldings.map(holding => [
      holding.symbol,
      holding.quantity,
      holding.averagePrice,
      holding.currentPrice,
      calculateInvestedAmount(holding),
      holding.totalValue,
      holding.unrealizedGain,
      calculateNetChangePercent(holding),
      calculateNetChange(holding),
      calculateNetChangePercent(holding),
      holding.priceChange || 0,
      holding.priceChangePercent || 0
    ]);

    const csvContent = [headers, ...csvData]
      .map(row => row.map(cell => `"${cell}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `portfolio-holdings-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const getSortIcon = (column: SortColumn) => {
    if (sortColumn !== column) {
      return <ArrowUpDown className="h-4 w-4" />;
    }
    return sortDirection === 'asc'
      ? <ArrowUp className="h-4 w-4" />
      : <ArrowDown className="h-4 w-4" />;
  };

  const SortableHeader = ({ column, children, className = "" }: {
    column: SortColumn;
    children: React.ReactNode;
    className?: string;
  }) => (
    <TableHead
      className={`font-semibold text-foreground cursor-pointer hover:bg-muted/50 ${className}`}
      onClick={() => handleSort(column)}
    >
      <div className="flex items-center gap-1">
        {children}
        {getSortIcon(column)}
      </div>
    </TableHead>
  );

  if (holdings.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="text-center text-muted-foreground">
            <p>No holdings yet. Add your first transaction to get started.</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  // Show mobile view on small screens
  if (isMobile) {
    return (
      <MobileHoldingsView
        holdings={holdings}
        onRefresh={onRefresh}
        refreshing={refreshing}
      />
    );
  }

  const allSelected = selectedHoldings.size === filteredAndSortedHoldings.length && filteredAndSortedHoldings.length > 0;
  const someSelected = selectedHoldings.size > 0 && selectedHoldings.size < filteredAndSortedHoldings.length;

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>Holdings ({filteredAndSortedHoldings.length})</CardTitle>
          <div className="flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search holdings..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8 w-64"
              />
            </div>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
                Refresh
              </Button>
            )}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Download className="h-4 w-4 mr-2" />
                  Export
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent>
                <DropdownMenuItem onClick={exportToCSV}>
                  Export as CSV
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
        {selectedHoldings.size > 0 && (
          <div className="flex items-center gap-2 mt-2 p-2 bg-muted/50 rounded-md">
            <span className="text-sm text-muted-foreground">
              {selectedHoldings.size} holding{selectedHoldings.size > 1 ? 's' : ''} selected
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setSelectedHoldings(new Set())}
            >
              Clear selection
            </Button>
          </div>
        )}
      </CardHeader>
      <CardContent className="p-0">
        <div className="overflow-x-auto">
          <div className="min-w-[1200px]">
            {/* Header */}
            <div className="grid gap-0 bg-muted/50 border-b
              grid-cols-[40px_3fr_55px_65px_65px_75px_75px_85px_85px_75px_40px] lg:grid-cols-[48px_3fr_65px_80px_80px_95px_95px_105px_105px_95px_48px] xl:grid-cols-[60px_3fr_85px_105px_105px_125px_125px_135px_135px_125px_60px]">
              <div className="p-3 flex items-center justify-center">
                <Checkbox
                  checked={allSelected}
                  onCheckedChange={handleSelectAll}
                  ref={(el) => {
                    if (el) {
                      const input = el.querySelector('input[type="checkbox"]') as HTMLInputElement;
                      if (input) {
                        input.indeterminate = someSelected;
                      }
                    }
                  }}
                />
              </div>
              <div
                className="p-3 font-semibold text-foreground cursor-pointer hover:bg-muted/50 flex items-center gap-1"
                onClick={() => handleSort('symbol')}
              >
                Instrument
                {getSortIcon('symbol')}
              </div>
              <div
                className="p-3 font-semibold text-foreground cursor-pointer hover:bg-muted/50 flex items-center justify-end gap-1"
                onClick={() => handleSort('quantity')}
              >
                Qty.
                {getSortIcon('quantity')}
              </div>
              <div
                className="p-3 font-semibold text-foreground cursor-pointer hover:bg-muted/50 flex items-center justify-end gap-1"
                onClick={() => handleSort('averagePrice')}
              >
                Avg.cost
                {getSortIcon('averagePrice')}
              </div>
              <div
                className="p-3 font-semibold text-foreground cursor-pointer hover:bg-muted/50 flex items-center justify-end gap-1"
                onClick={() => handleSort('currentPrice')}
              >
                LTP
                {getSortIcon('currentPrice')}
              </div>
              <div
                className="p-3 font-semibold text-foreground cursor-pointer hover:bg-muted/50 flex items-center justify-end gap-1"
                onClick={() => handleSort('invested')}
              >
                Invested
                {getSortIcon('invested')}
              </div>
              <div
                className="p-3 font-semibold text-foreground cursor-pointer hover:bg-muted/50 flex items-center justify-end gap-1"
                onClick={() => handleSort('currentValue')}
              >
                Cur. val
                {getSortIcon('currentValue')}
              </div>
              <div
                className="p-3 font-semibold text-foreground cursor-pointer hover:bg-muted/50 flex items-center justify-end gap-1"
                onClick={() => handleSort('unrealizedGain')}
              >
                P&L
                {getSortIcon('unrealizedGain')}
              </div>
              <div
                className="p-3 font-semibold text-foreground cursor-pointer hover:bg-muted/50 flex items-center justify-end gap-1"
                onClick={() => handleSort('dailyGain')}
              >
                Daily Gain
                {getSortIcon('dailyGain')}
              </div>
              <div
                className="p-3 font-semibold text-foreground cursor-pointer hover:bg-muted/50 flex items-center justify-end gap-1"
                onClick={() => handleSort('dayChange')}
              >
                Day chg.
                {getSortIcon('dayChange')}
              </div>
              <div className="p-3"></div>
            </div>

            {/* Rows */}
            <div>
              {filteredAndSortedHoldings.map((holding, index) => (
                <HoldingRow
                  key={holding.id}
                  holding={holding}
                  index={index}
                  isSelected={selectedHoldings.has(holding.id)}
                  onSelect={handleSelectHolding}
                />
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}