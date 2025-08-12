'use client';

import React from 'react';
import { Checkbox } from '@/components/ui/checkbox';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
    Tooltip,
    TooltipContent,
    TooltipProvider,
    TooltipTrigger,
} from '@/components/ui/tooltip';
import { MoreHorizontal, Info } from 'lucide-react';
import { Holding } from '@/types';

interface HoldingRowProps {
    holding: Holding;
    index: number;
    isSelected: boolean;
    onSelect: (holdingId: string, checked: boolean) => void;
}

export function HoldingRow({ holding, index, isSelected, onSelect }: HoldingRowProps) {
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

    const formatNumber = (value: number) => {
        return value.toLocaleString('en-IN');
    };

    const formatPercentage = (value: number) => {
        // If the value is already in percentage format (> 1 or < -1), use it directly
        // If it's in decimal format (between -1 and 1), multiply by 100
        const percentValue = Math.abs(value) > 1 ? value : value * 100;
        return `${percentValue >= 0 ? '+' : ''}${percentValue.toFixed(2)}%`;
    };

    const formatMarketCap = (marketCap: number) => {
        if (marketCap >= 1e12) {
            return `₹${(marketCap / 1e12).toFixed(2)}T`;
        } else if (marketCap >= 1e9) {
            return `₹${(marketCap / 1e9).toFixed(2)}B`;
        } else if (marketCap >= 1e7) {
            return `₹${(marketCap / 1e7).toFixed(2)}Cr`;
        } else if (marketCap >= 1e5) {
            return `₹${(marketCap / 1e5).toFixed(2)}L`;
        }
        return formatCurrency(marketCap);
    };

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

    const investedAmount = calculateInvestedAmount(holding);
    const netChange = calculateNetChange(holding);
    const netChangePercent = calculateNetChangePercent(holding);
    const isNetPositive = netChange >= 0;
    const isDayPositive = (holding.priceChange || 0) >= 0;

    return (
        <TooltipProvider>
            <div
                className={`
                    grid gap-0 border-b
                    grid-cols-[40px_3fr_55px_65px_65px_75px_75px_85px_75px_75px_40px] lg:grid-cols-[48px_3fr_65px_80px_80px_95px_95px_105px_95px_95px_48px] xl:grid-cols-[60px_3fr_85px_105px_105px_125px_125px_135px_125px_125px_60px]
                    ${index % 2 === 0 ? 'bg-background' : 'bg-muted/20'}
                    hover:bg-muted/40 transition-colors
                    ${isSelected ? 'bg-blue-50 dark:bg-blue-950/20' : ''}
                `}
            >
                {/* Selection Checkbox */}
                <div className="p-3 flex items-center justify-center">
                    <Checkbox
                        checked={isSelected}
                        onCheckedChange={(checked) => onSelect(holding.id, checked as boolean)}
                    />
                </div>

                {/* Instrument */}
                <div className="p-3 font-medium text-foreground">
                    <div className="flex flex-col space-y-1">
                        <div className="flex items-center gap-2">
                            <span className="font-semibold">{holding.symbol}</span>
                            {holding.marketCap && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <Info className="h-3 w-3 text-muted-foreground cursor-help flex-shrink-0" />
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="space-y-1 text-xs">
                                            <p><strong>Market Cap:</strong> {formatMarketCap(holding.marketCap)}</p>
                                            {holding.trailingPE && <p><strong>P/E Ratio:</strong> {holding.trailingPE.toFixed(2)}</p>}
                                            {holding.beta && <p><strong>Beta:</strong> {holding.beta.toFixed(2)}</p>}
                                            {holding.dividendYield && <p><strong>Dividend Yield:</strong> {formatPercentage(holding.dividendYield)}</p>}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                        <div className="flex flex-wrap items-center gap-1">
                            {holding.sector && (
                                <Badge variant="outline" className="text-xs whitespace-nowrap">
                                    {holding.sector}
                                </Badge>
                            )}
                            {holding.industry && (
                                <span className="text-xs text-muted-foreground">
                                    {holding.industry}
                                </span>
                            )}
                        </div>
                    </div>
                </div>

                {/* Quantity */}
                <div className="p-3 text-right flex items-center justify-end">
                    <span className="font-medium">{formatNumber(holding.quantity)}</span>
                </div>

                {/* Average Cost */}
                <div className="p-3 text-right flex items-center justify-end">
                    <span className="font-medium">{formatPrice(holding.averagePrice)}</span>
                </div>

                {/* LTP (Last Traded Price) */}
                <div className="p-3 text-right flex items-center justify-end">
                    <div className="flex flex-col items-end">
                        <span className="font-medium">{formatPrice(holding.currentPrice)}</span>
                        {holding.dayHigh && holding.dayLow && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-xs text-muted-foreground cursor-help">
                                        {formatPrice(holding.dayLow)} - {formatPrice(holding.dayHigh)}
                                    </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                    <p>Day's Range</p>
                                </TooltipContent>
                            </Tooltip>
                        )}
                    </div>
                </div>

                {/* Invested Amount */}
                <div className="p-3 text-right flex items-center justify-end">
                    <span className="font-medium">{formatCurrency(investedAmount)}</span>
                </div>

                {/* Current Value */}
                <div className="p-3 text-right flex items-center justify-end">
                    <span className="font-medium">{formatCurrency(holding.totalValue)}</span>
                </div>

                {/* P&L (Profit & Loss) */}
                <div className="p-3 text-right flex items-center justify-end">
                    <div className="flex flex-col items-end">
                        <span className={`font-semibold ${isNetPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isNetPositive ? '+' : ''}{formatCurrency(holding.unrealizedGain)}
                        </span>
                        <span className={`text-xs ${isNetPositive ? 'text-green-600' : 'text-red-600'}`}>
                            ({formatPercentage(netChangePercent)})
                        </span>
                    </div>
                </div>

                {/* Net Change */}
                <div className="p-3 text-right flex items-center justify-end">
                    <div className="flex flex-col items-end">
                        <span className={`font-medium ${isNetPositive ? 'text-green-600' : 'text-red-600'}`}>
                            {isNetPositive ? '+' : ''}{formatPrice(netChange)}
                        </span>
                        <span className={`text-xs ${isNetPositive ? 'text-green-600' : 'text-red-600'}`}>
                            ({formatPercentage(netChangePercent)})
                        </span>
                    </div>
                </div>

                {/* Day Change */}
                <div className="p-3 text-right flex items-center justify-end">
                    {holding.priceChange !== undefined && holding.priceChangePercent !== undefined ? (
                        <div className="flex flex-col items-end">
                            <span className={`font-medium ${isDayPositive ? 'text-green-600' : 'text-red-600'}`}>
                                {isDayPositive ? '+' : ''}{formatPrice(holding.priceChange)}
                            </span>
                            <span className={`text-xs ${isDayPositive ? 'text-green-600' : 'text-red-600'}`}>
                                ({formatPercentage(holding.priceChangePercent)})
                            </span>
                            {holding.volume && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="text-xs text-muted-foreground cursor-help">
                                            Vol: {formatNumber(holding.volume)}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="space-y-1 text-xs">
                                            <p><strong>Volume:</strong> {formatNumber(holding.volume)}</p>
                                            {holding.averageVolume && (
                                                <p><strong>Avg Volume:</strong> {formatNumber(holding.averageVolume)}</p>
                                            )}
                                        </div>
                                    </TooltipContent>
                                </Tooltip>
                            )}
                        </div>
                    ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                    )}
                </div>

                {/* Actions */}
                <div className="p-3 flex items-center justify-center">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                                <MoreHorizontal className="h-4 w-4" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuItem>
                                View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem>
                                Add Transaction
                            </DropdownMenuItem>
                            {holding.website && (
                                <DropdownMenuItem asChild>
                                    <a href={holding.website} target="_blank" rel="noopener noreferrer">
                                        Company Website
                                    </a>
                                </DropdownMenuItem>
                            )}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>
        </TooltipProvider>
    );
}