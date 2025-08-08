'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Clock } from 'lucide-react';
import type { TechnicalAnalysis } from '@/types/gemini';

interface TimeProjectionsDisplayProps {
    analysis: TechnicalAnalysis;
}

export function TimeProjectionsDisplay({ analysis }: TimeProjectionsDisplayProps) {
    if (!analysis.timeProjections) return null;

    const projections = analysis.timeProjections;

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Clock className="w-5 h-5" />
                    Time Projections
                </CardTitle>
                <CardDescription>
                    Timing analysis and future move expectations
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Pattern Completion</div>
                        <div className="text-sm">{projections.patternCompletionTime}</div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Next Significant Move</div>
                        <div className="flex items-center gap-2">
                            <Badge variant={projections.nextSignificantMove.direction === 'up' ? 'default' : 
                                           projections.nextSignificantMove.direction === 'down' ? 'destructive' : 'secondary'}>
                                {projections.nextSignificantMove.direction}
                            </Badge>
                            <span className="text-sm">{projections.nextSignificantMove.timeframe}</span>
                        </div>
                    </div>
                </div>

                {projections.nextSignificantMove.catalysts?.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">Potential Catalysts</div>
                            <div className="space-y-1">
                                {projections.nextSignificantMove.catalysts.map((catalyst, index) => (
                                    <div key={index} className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                        {catalyst}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {projections.keyDates?.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">Key Dates</div>
                            <div className="space-y-1">
                                {projections.keyDates.map((date, index) => (
                                    <div key={index} className="text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                                        {date}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}

                {projections.seasonalFactors && projections.seasonalFactors !== 'No seasonal factors identified' && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">Seasonal Factors</div>
                            <p className="text-sm">{projections.seasonalFactors}</p>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}