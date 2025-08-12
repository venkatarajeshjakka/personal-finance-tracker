'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  TrendingUp, 
  TrendingDown, 
  RefreshCw,
  ChevronRight,
  MoreVertical
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Holding } from '@/types';

interface MobileHoldingsViewProps {
  holdings: Holding[];
  onRefresh?: () => void;
  refreshing?: boolean;
}

export function MobileHoldingsView({ holdings, onRefresh, refreshing = false }: MobileHoldingsViewProps) {
  const [searchTerm, setSearchTerm] = useState('');

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const formatPrice = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    // If the value is already in percentage format (> 1 or < -1), use it directly
    // If it's in decimal format (between -1 and 1), multiply by 100
    const percentValue = Math.abs(value) > 1 ? value : value * 100;
    return `${percentValue >= 0 ? '+' : ''}${percentValue.toFixed(2)}%`;
  };

  const calculateInvestedAmount = (holding: Holding) => {
    return holding.quantity * holding.averagePrice;
  };

  const calculateNetChangePercent = (holding: Holding) => {
    if (holding.averagePrice === 0) return 0;
    return ((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100;
  };

  const filteredHoldings = holdings.filter(holding => 
    holding.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    (holding.sector && holding.sector.toLowerCase().includes(searchTerm.toLowerCase()))
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

  return (
    <div className="space-y-4">
      {/* Mobile Header */}
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Holdings ({filteredHoldings.length})</CardTitle>
            {onRefresh && (
              <Button
                variant="outline"
                size="sm"
                onClick={onRefresh}
                disabled={refreshing}
              >
                <RefreshCw className={`h-4 w-4 ${refreshing ? 'animate-spin' : ''}`} />
              </Button>
            )}
          </div>
          <div className="relative">
            <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search holdings..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
        </CardHeader>
      </Card>

      {/* Mobile Holdings Cards */}
      <div className="space-y-3">
        {filteredHoldings.map((holding) => {
          const investedAmount = calculateInvestedAmount(holding);
          const netChangePercent = calculateNetChangePercent(holding);
          const isNetPositive = holding.unrealizedGain >= 0;
          const isDayPositive = (holding.priceChange || 0) >= 0;

          return (
            <Card key={holding.id} className="overflow-hidden">
              <CardContent className="p-4">
                {/* Header Row */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-lg">{holding.symbol}</h3>
                      <Badge variant={isNetPositive ? "default" : "destructive"} className="text-xs">
                        {formatPercentage(netChangePercent)}
                      </Badge>
                    </div>
                    {holding.sector && (
                      <p className="text-xs text-muted-foreground">{holding.sector}</p>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="text-right">
                      <p className="font-semibold">{formatPrice(holding.currentPrice)}</p>
                      {holding.priceChange !== undefined && (
                        <p className={`text-xs ${isDayPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isDayPositive ? '+' : ''}{formatPrice(holding.priceChange)}
                        </p>
                      )}
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="sm" className="h-8 w-8 p-0">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Add Transaction</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>

                {/* Metrics Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-muted-foreground">Quantity</p>
                    <p className="font-medium">{holding.quantity.toLocaleString()}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Avg. Cost</p>
                    <p className="font-medium">{formatPrice(holding.averagePrice)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Invested</p>
                    <p className="font-medium">{formatCurrency(investedAmount)}</p>
                  </div>
                  <div>
                    <p className="text-muted-foreground">Current Value</p>
                    <p className="font-medium">{formatCurrency(holding.totalValue)}</p>
                  </div>
                </div>

                {/* P&L Section */}
                <div className="mt-4 pt-3 border-t border-border">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      {isNetPositive ? (
                        <TrendingUp className="h-4 w-4 text-green-600" />
                      ) : (
                        <TrendingDown className="h-4 w-4 text-red-600" />
                      )}
                      <span className="text-sm text-muted-foreground">P&L</span>
                    </div>
                    <div className="text-right">
                      <p className={`font-semibold ${isNetPositive ? 'text-green-600' : 'text-red-600'}`}>
                        {isNetPositive ? '+' : ''}{formatCurrency(holding.unrealizedGain)}
                      </p>
                      <p className={`text-xs ${isNetPositive ? 'text-green-600' : 'text-red-600'}`}>
                        ({formatPercentage(netChangePercent)})
                      </p>
                    </div>
                  </div>

                  {/* Day Change */}
                  {holding.dayGainLoss !== undefined && (
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">Day's P&L</span>
                      <div className="text-right">
                        <p className={`font-medium ${isDayPositive ? 'text-green-600' : 'text-red-600'}`}>
                          {isDayPositive ? '+' : ''}{formatCurrency(holding.dayGainLoss)}
                        </p>
                        {holding.priceChangePercent !== undefined && (
                          <p className={`text-xs ${isDayPositive ? 'text-green-600' : 'text-red-600'}`}>
                            ({formatPercentage(holding.priceChangePercent)})
                          </p>
                        )}
                      </div>
                    </div>
                  )}
                </div>

                {/* Tap indicator */}
                <div className="flex items-center justify-center mt-3 pt-2 border-t border-border">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <span>Tap for details</span>
                    <ChevronRight className="h-3 w-3" />
                  </div>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}