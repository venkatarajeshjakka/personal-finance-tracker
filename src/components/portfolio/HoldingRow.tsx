'use client';

import React, { memo } from 'react';
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
import { formatters, ColorFormatter } from '@/lib/utils/formatters';
import { useHoldingCalculations } from '@/lib/hooks/usePortfolioCalculations';

interface HoldingRowProps {
    holding: Holding;
    index: number;
    isSelected: boolean;
    onSelect: (holdingId: string, checked: boolean) => void;
}

const HoldingRowComponent = ({ holding, index, isSelected, onSelect }: HoldingRowProps) => {
    // Use optimized calculations hook
    const calculations = useHoldingCalculations(holding);

    const isNetPositive = calculations.netChange >= 0;
    const isDayPositive = (holding.priceChange || 0) >= 0;

    return (
        <TooltipProvider>
            <div
                className={`
                    grid gap-0 border-b
                    grid-cols-[40px_3fr_55px_65px_65px_75px_75px_85px_85px_75px_40px] lg:grid-cols-[48px_3fr_65px_80px_80px_95px_95px_105px_105px_95px_48px] xl:grid-cols-[60px_3fr_85px_105px_105px_125px_125px_135px_135px_125px_60px]
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
                                            <p><strong>Market Cap:</strong> {formatters.marketCap(holding.marketCap)}</p>
                                            {holding.trailingPE && <p><strong>P/E Ratio:</strong> {formatters.decimal(holding.trailingPE, 2)}</p>}
                                            {holding.beta && <p><strong>Beta:</strong> {formatters.decimal(holding.beta, 2)}</p>}
                                            {holding.dividendYield && <p><strong>Dividend Yield:</strong> {formatters.percentage(holding.dividendYield)}</p>}
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
                    <span className="font-medium">{formatters.integer(holding.quantity)}</span>
                </div>

                {/* Average Cost */}
                <div className="p-3 text-right flex items-center justify-end">
                    <span className="font-medium">{formatters.price(holding.averagePrice)}</span>
                </div>

                {/* LTP (Last Traded Price) */}
                <div className="p-3 text-right flex items-center justify-end">
                    <div className="flex flex-col items-end">
                        <span className="font-medium">{formatters.price(holding.currentPrice)}</span>
                        {holding.dayHigh && holding.dayLow && (
                            <Tooltip>
                                <TooltipTrigger asChild>
                                    <span className="text-xs text-muted-foreground cursor-help">
                                        {formatters.price(holding.dayLow)} - {formatters.price(holding.dayHigh)}
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
                    <span className="font-medium">{formatters.currency(calculations.investedAmount)}</span>
                </div>

                {/* Current Value */}
                <div className="p-3 text-right flex items-center justify-end">
                    <span className="font-medium">{formatters.currency(holding.totalValue)}</span>
                </div>

                {/* P&L (Profit & Loss) */}
                <div className="p-3 text-right flex items-center justify-end">
                    <div className="flex flex-col items-end">
                        <span className={`font-semibold ${ColorFormatter.getValueColorClass(holding.unrealizedGain)}`}>
                            {formatters.compactCurrency(holding.unrealizedGain, { showSign: true })}
                        </span>
                        <span className={`text-xs ${ColorFormatter.getValueColorClass(calculations.unrealizedGainPercent)}`}>
                            ({formatters.percentage(calculations.unrealizedGainPercent)})
                        </span>
                    </div>
                </div>

                {/* Daily Gain */}
                <div className="p-3 text-right flex items-center justify-end">
                    {holding.dayGainLoss !== undefined ? (
                        <span className={`font-semibold ${ColorFormatter.getValueColorClass(holding.dayGainLoss)}`}>
                            {formatters.compactCurrency(holding.dayGainLoss, { showSign: true })}
                        </span>
                    ) : (
                        <span className="text-muted-foreground text-sm">-</span>
                    )}
                </div>

                {/* Day Change */}
                <div className="p-3 text-right flex items-center justify-end">
                    {holding.priceChange !== undefined && holding.priceChangePercent !== undefined ? (
                        <div className="flex flex-col items-end">
                            <span className={`font-medium ${ColorFormatter.getValueColorClass(holding.priceChange)}`}>
                                {holding.priceChange >= 0 ? '+' : ''}{formatters.price(Math.abs(holding.priceChange))}
                            </span>
                            <span className={`text-xs ${ColorFormatter.getValueColorClass(holding.priceChangePercent)}`}>
                                ({formatters.percentage(holding.priceChangePercent)})
                            </span>
                            {holding.volume && (
                                <Tooltip>
                                    <TooltipTrigger asChild>
                                        <span className="text-xs text-muted-foreground cursor-help">
                                            Vol: {formatters.compactNumber(holding.volume)}
                                        </span>
                                    </TooltipTrigger>
                                    <TooltipContent>
                                        <div className="space-y-1 text-xs">
                                            <p><strong>Volume:</strong> {formatters.integer(holding.volume)}</p>
                                            {holding.averageVolume && (
                                                <p><strong>Avg Volume:</strong> {formatters.integer(holding.averageVolume)}</p>
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
};

// Memoize the component to prevent unnecessary re-renders
export const HoldingRow = memo(HoldingRowComponent, (prevProps, nextProps) => {
    // Custom comparison function for better performance
    return (
        prevProps.holding.id === nextProps.holding.id &&
        prevProps.holding.currentPrice === nextProps.holding.currentPrice &&
        prevProps.holding.totalValue === nextProps.holding.totalValue &&
        prevProps.holding.unrealizedGain === nextProps.holding.unrealizedGain &&
        prevProps.holding.priceChange === nextProps.holding.priceChange &&
        prevProps.holding.priceChangePercent === nextProps.holding.priceChangePercent &&
        prevProps.holding.dayGainLoss === nextProps.holding.dayGainLoss &&
        prevProps.isSelected === nextProps.isSelected &&
        prevProps.index === nextProps.index
    );
});