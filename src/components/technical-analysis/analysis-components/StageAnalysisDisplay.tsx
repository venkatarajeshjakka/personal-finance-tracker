'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import type { TechnicalAnalysis } from '@/types/gemini';

interface StageAnalysisDisplayProps {
    analysis: TechnicalAnalysis;
}

export function StageAnalysisDisplay({ analysis }: StageAnalysisDisplayProps) {
    if (!analysis.stageAnalysis) return null;

    const getStageColor = (stage: number) => {
        switch (stage) {
            case 1: return 'text-blue-600';
            case 2: return 'text-green-600';
            case 3: return 'text-orange-600';
            case 4: return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    const getStageBackground = (stage: number) => {
        switch (stage) {
            case 1: return 'bg-blue-100 dark:bg-blue-900/30';
            case 2: return 'bg-green-100 dark:bg-green-900/30';
            case 3: return 'bg-orange-100 dark:bg-orange-900/30';
            case 4: return 'bg-red-100 dark:bg-red-900/30';
            default: return 'bg-gray-100 dark:bg-gray-900/30';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Market Stage Analysis</CardTitle>
                <CardDescription>
                    Weinstein Stage Analysis - Current market phase identification
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <div className={`px-4 py-2 rounded-lg ${getStageBackground(analysis.stageAnalysis.currentStage)}`}>
                            <div className={`text-2xl font-bold ${getStageColor(analysis.stageAnalysis.currentStage)}`}>
                                Stage {analysis.stageAnalysis.currentStage}
                            </div>
                        </div>
                        <div>
                            <div className="font-medium">{analysis.stageAnalysis.stageDescription}</div>
                            <div className="flex items-center gap-2 mt-1">
                                <span className="text-sm text-muted-foreground">Confidence:</span>
                                <Progress value={analysis.stageAnalysis.stageConfidence * 100} className="w-20 h-2" />
                                <span className="text-sm font-medium">{Math.round(analysis.stageAnalysis.stageConfidence * 100)}%</span>
                            </div>
                        </div>
                    </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Stage Characteristics</h4>
                        <ul className="space-y-1">
                            {analysis.stageAnalysis.stageCharacteristics.map((characteristic, index) => (
                                <li key={index} className="text-sm flex items-start gap-2">
                                    <span className="text-green-500 mt-1">•</span>
                                    <span>{characteristic}</span>
                                </li>
                            ))}
                        </ul>
                    </div>

                    <div className="space-y-2">
                        <h4 className="font-medium text-sm">Next Stage Indicators</h4>
                        <ul className="space-y-1">
                            {analysis.stageAnalysis.nextStageIndicators.map((indicator, index) => (
                                <li key={index} className="text-sm flex items-start gap-2">
                                    <span className="text-blue-500 mt-1">•</span>
                                    <span>{indicator}</span>
                                </li>
                            ))}
                        </ul>
                    </div>
                </div>
            </CardContent>
        </Card>
    );
}