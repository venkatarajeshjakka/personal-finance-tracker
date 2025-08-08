'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { TrendingUp, TrendingDown, Target } from 'lucide-react';
import type { TechnicalAnalysis } from '@/types/gemini';

interface TrendAnalysisDisplayProps {
    analysis: TechnicalAnalysis;
}

export function TrendAnalysisDisplay({ analysis }: TrendAnalysisDisplayProps) {
    if (!analysis.trendAnalysis) return null;

    const trend = analysis.trendAnalysis;

    const getTrendColor = (direction: string) => {
        switch (direction) {
            case 'bullish': return 'text-green-600';
            case 'bearish': return 'text-red-600';
            default: return 'text-yellow-600';
        }
    };

    const getTrendIcon = (direction: string) => {
        switch (direction) {
            case 'bullish': return <TrendingUp className="w-4 h-4" />;
            case 'bearish': return <TrendingDown className="w-4 h-4" />;
            default: return <Target className="w-4 h-4" />;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Trend Analysis</CardTitle>
                <CardDescription>
                    Primary and secondary trend identification
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {/* Primary Trend */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-muted-foreground">Primary Trend</div>
                            <Badge variant="outline" className="text-xs">
                                {trend.primaryTrend.duration}
                            </Badge>
                        </div>
                        <div className={`flex items-center gap-2 font-medium ${getTrendColor(trend.primaryTrend.direction)}`}>
                            {getTrendIcon(trend.primaryTrend.direction)}
                            <span className="capitalize">{trend.primaryTrend.direction}</span>
                            <Badge variant={trend.primaryTrend.strength === 'strong' ? 'default' : 'secondary'} className="ml-2">
                                {trend.primaryTrend.strength}
                            </Badge>
                        </div>
                    </div>

                    {/* Secondary Trend */}
                    <div className="space-y-3">
                        <div className="flex items-center gap-2">
                            <div className="text-sm font-medium text-muted-foreground">Secondary Trend</div>
                            <Badge variant="outline" className="text-xs">
                                {trend.secondaryTrend.duration}
                            </Badge>
                        </div>
                        <div className={`flex items-center gap-2 font-medium ${getTrendColor(trend.secondaryTrend.direction)}`}>
                            {getTrendIcon(trend.secondaryTrend.direction)}
                            <span className="capitalize">{trend.secondaryTrend.direction}</span>
                            <Badge variant={trend.secondaryTrend.strength === 'strong' ? 'default' : 'secondary'} className="ml-2">
                                {trend.secondaryTrend.strength}
                            </Badge>
                        </div>
                    </div>
                </div>

                {/* Support and Resistance Levels */}
                {(trend.supportLevels?.length > 0 || trend.resistanceLevels?.length > 0) && (
                    <>
                        <Separator />
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                                <div className="text-sm font-medium text-green-600">Support Levels</div>
                                <div className="space-y-1">
                                    {trend.supportLevels?.length > 0 ? (
                                        trend.supportLevels.map((level: any, index: number) => (
                                            <div key={index} className="text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                                ₹{level.price?.toFixed(2) || level}
                                                {level.strength && (
                                                    <Badge variant="outline" className="ml-2 text-xs">
                                                        {level.strength}
                                                    </Badge>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-muted-foreground">No support levels identified</div>
                                    )}
                                </div>
                            </div>

                            <div className="space-y-2">
                                <div className="text-sm font-medium text-red-600">Resistance Levels</div>
                                <div className="space-y-1">
                                    {trend.resistanceLevels?.length > 0 ? (
                                        trend.resistanceLevels.map((level: any, index: number) => (
                                            <div key={index} className="text-sm bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                                                ₹{level.price?.toFixed(2) || level}
                                                {level.strength && (
                                                    <Badge variant="outline" className="ml-2 text-xs">
                                                        {level.strength}
                                                    </Badge>
                                                )}
                                            </div>
                                        ))
                                    ) : (
                                        <div className="text-sm text-muted-foreground">No resistance levels identified</div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}