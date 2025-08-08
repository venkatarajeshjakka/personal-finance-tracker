'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import {
    Brain,
    RefreshCw,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Target,
    Shield,
    Info,
    CheckCircle,
    XCircle
} from 'lucide-react';
import { toast } from 'sonner';

import {
    generateChartAnalysis,
    selectAIAnalysis,
    selectAIAnalysisLoading,
    selectAIAnalysisError,
    selectIsAIConfigured,
    saveAnalysisToHistory
} from '@/lib/redux/slices/aiAnalysisSlice';
import { captureChartImage } from '@/lib/utils/chartCapture';
import type { AppDispatch, RootState } from '@/types';
import type { ChartAnalysisResponse, TechnicalAnalysis } from '@/types/gemini';

// Import analysis components
import {
    StageAnalysisDisplay,
    TrendAnalysisDisplay,
    TimeProjectionsDisplay
} from './analysis-components';

interface AIAnalysisDisplayProps {
    symbol: string;
    chartElementRef: React.RefObject<HTMLElement | null>;
    timeframe: string;
    additionalContext?: {
        currentPrice?: number;
        marketCap?: number;
        volume?: number;
        sector?: string;
        industry?: string;
    };
}

export function AIAnalysisDisplay({
    symbol,
    chartElementRef,
    timeframe,
    additionalContext
}: AIAnalysisDisplayProps) {
    const dispatch = useDispatch<AppDispatch>();

    // Redux state
    const analysis = useSelector((state: RootState) => selectAIAnalysis(state, symbol));
    const loading = useSelector((state: RootState) => selectAIAnalysisLoading(state, symbol));
    const error = useSelector((state: RootState) => selectAIAnalysisError(state, symbol));
    const isConfigured = useSelector(selectIsAIConfigured);

    // Local state
    const [isCapturing, setIsCapturing] = useState(false);

    // Log the analysis data for debugging
    useEffect(() => {
        if (analysis) {
            console.log('=== AI ANALYSIS DISPLAY DATA ===');
            console.log('Symbol:', symbol);
            console.log('Has analysis:', !!analysis);
            console.log('Has stageAnalysis:', !!analysis.analysis?.stageAnalysis);
            console.log('StageAnalysis content:', analysis.analysis?.stageAnalysis);
            console.log('Full analysis:', analysis);
            console.log('=== END DISPLAY DATA ===');
        }
    }, [analysis, symbol]);

    // Save analysis to history when it's available
    useEffect(() => {
        if (analysis && !loading) {
            dispatch(saveAnalysisToHistory({
                analysis,
                chartConfig: { timeframe, additionalContext }
            }));
        }
    }, [analysis, loading, dispatch, timeframe, additionalContext]);

    const handleAnalyzeChart = async () => {
        if (!isConfigured) {
            toast.error('Please configure your Gemini AI API key in settings first');
            return;
        }

        if (!chartElementRef.current) {
            toast.error('Chart not found. Please wait for the chart to load.');
            return;
        }

        setIsCapturing(true);

        try {
            // Capture chart image
            const captureResult = await captureChartImage(chartElementRef.current, {
                quality: 0.9,
                format: 'png',
                backgroundColor: '#ffffff'
            });

            if (!captureResult.success || !captureResult.imageData) {
                throw new Error(captureResult.error || 'Failed to capture chart image');
            }

            // Generate analysis - the Redux slice handles storing the result
            await dispatch(generateChartAnalysis({
                symbol,
                chartImageData: captureResult.imageData,
                timeframe,
                additionalContext
            })).unwrap();

            toast.success('Chart analysis completed successfully');

        } catch (error) {
            console.error('Analysis failed:', error);
            toast.error(error instanceof Error ? error.message : 'Failed to analyze chart');
        } finally {
            setIsCapturing(false);
        }
    };

    if (!isConfigured) {
        return (
            <Card>
                <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                        <Brain className="w-5 h-5" />
                        AI Chart Analysis
                    </CardTitle>
                    <CardDescription>
                        Get professional technical analysis insights powered by Gemini AI
                    </CardDescription>
                </CardHeader>
                <CardContent>
                    <Alert>
                        <Info className="h-4 w-4" />
                        <AlertDescription>
                            AI analysis is not configured. Please add your Gemini AI API key in the settings to enable this feature.
                        </AlertDescription>
                    </Alert>
                </CardContent>
            </Card>
        );
    }

    return (
        <div className="space-y-6">
            {/* Analysis Trigger */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <div>
                            <CardTitle className="flex items-center gap-2">
                                <Brain className="w-5 h-5" />
                                AI Chart Analysis
                            </CardTitle>
                            <CardDescription>
                                Get professional technical analysis insights powered by Gemini AI
                            </CardDescription>
                        </div>
                        <Button
                            onClick={handleAnalyzeChart}
                            disabled={loading || isCapturing}
                            className="min-w-[140px]"
                        >
                            {loading || isCapturing ? (
                                <>
                                    <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                    {isCapturing ? 'Capturing...' : 'Analyzing...'}
                                </>
                            ) : (
                                <>
                                    <Brain className="w-4 h-4 mr-2" />
                                    Analyze Chart
                                </>
                            )}
                        </Button>
                    </div>
                </CardHeader>

                {error && (
                    <CardContent>
                        <Alert variant="destructive">
                            <AlertTriangle className="h-4 w-4" />
                            <AlertDescription>{error.message}</AlertDescription>
                        </Alert>
                    </CardContent>
                )}
            </Card>

            {/* Analysis Results */}
            {analysis && (
                <div className="space-y-6">
                    <AnalysisOverview analysis={analysis} />
                    <StageAnalysisDisplay analysis={analysis.analysis} />
                    <TrendAnalysisDisplay analysis={analysis.analysis} />
                    <TechnicalInsights analysis={analysis.analysis} />
                    <TradingRecommendations analysis={analysis.analysis} />
                    <TimeProjectionsDisplay analysis={analysis.analysis} />
                    <RiskAssessment analysis={analysis.analysis} />
                    <DisclaimerCard disclaimer={analysis.disclaimer} />
                </div>
            )}
        </div>
    );
}

// Analysis Overview Component
function AnalysisOverview({ analysis }: { analysis: ChartAnalysisResponse }) {
    const getTrendColor = (trend: string) => {
        switch (trend) {
            case 'bullish': return 'text-green-600';
            case 'bearish': return 'text-red-600';
            default: return 'text-yellow-600';
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'bullish': return <TrendingUp className="w-4 h-4" />;
            case 'bearish': return <TrendingDown className="w-4 h-4" />;
            default: return <Target className="w-4 h-4" />;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Analysis Overview</CardTitle>
                <CardDescription>
                    Generated on {new Date(analysis.generatedAt).toLocaleString()}
                </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Overall Trend and Confidence */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Overall Trend</div>
                        <div className={`flex items-center gap-2 font-medium ${getTrendColor(analysis.analysis.overallTrend)}`}>
                            {getTrendIcon(analysis.analysis.overallTrend)}
                            <span className="capitalize">{analysis.analysis.overallTrend}</span>
                        </div>
                    </div>

                    <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Trend Strength</div>
                        <Badge variant={analysis.analysis.trendStrength === 'strong' ? 'default' : 'secondary'}>
                            {analysis.analysis.trendStrength}
                        </Badge>
                    </div>

                    <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Confidence</div>
                        <div className="flex items-center gap-2">
                            <Progress value={analysis.confidence * 100} className="flex-1" />
                            <span className="text-sm font-medium">{Math.round(analysis.confidence * 100)}%</span>
                        </div>
                    </div>
                </div>

                {/* Primary and Secondary Trends */}
                {(analysis.analysis.primaryTrend || analysis.analysis.secondaryTrend) && (
                    <>
                        <Separator />
                        <div className="space-y-4">
                            <h4 className="font-medium">Detailed Trend Analysis</h4>
                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Primary Trend */}
                                {analysis.analysis.primaryTrend && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-medium text-muted-foreground">Primary Trend</div>
                                            <Badge variant="outline" className="text-xs">
                                                {analysis.analysis.primaryTrend.duration}
                                            </Badge>
                                        </div>
                                        <div className={`flex items-center gap-2 font-medium ${getTrendColor(analysis.analysis.primaryTrend.direction)}`}>
                                            {getTrendIcon(analysis.analysis.primaryTrend.direction)}
                                            <span className="capitalize">{analysis.analysis.primaryTrend.direction}</span>
                                            <Badge variant={analysis.analysis.primaryTrend.strength === 'strong' ? 'default' : 'secondary'} className="ml-2">
                                                {analysis.analysis.primaryTrend.strength}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {analysis.analysis.primaryTrend.description}
                                        </p>
                                    </div>
                                )}

                                {/* Secondary Trend */}
                                {analysis.analysis.secondaryTrend && (
                                    <div className="space-y-3">
                                        <div className="flex items-center gap-2">
                                            <div className="text-sm font-medium text-muted-foreground">Secondary Trend</div>
                                            <Badge variant="outline" className="text-xs">
                                                {analysis.analysis.secondaryTrend.duration}
                                            </Badge>
                                        </div>
                                        <div className={`flex items-center gap-2 font-medium ${getTrendColor(analysis.analysis.secondaryTrend.direction)}`}>
                                            {getTrendIcon(analysis.analysis.secondaryTrend.direction)}
                                            <span className="capitalize">{analysis.analysis.secondaryTrend.direction}</span>
                                            <Badge variant={analysis.analysis.secondaryTrend.strength === 'strong' ? 'default' : 'secondary'} className="ml-2">
                                                {analysis.analysis.secondaryTrend.strength}
                                            </Badge>
                                        </div>
                                        <p className="text-sm text-muted-foreground">
                                            {analysis.analysis.secondaryTrend.description}
                                        </p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// Technical Insights Component
function TechnicalInsights({ analysis }: { analysis: TechnicalAnalysis }) {
    return (
        <Card>
            <CardHeader>
                <CardTitle>Technical Insights</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                {/* Key Levels */}
                <div className="space-y-3">
                    <h4 className="font-medium">Key Levels</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-green-600">Support Levels</div>
                            <div className="space-y-1">
                                {analysis.keyLevels.support.length > 0 ? (
                                    analysis.keyLevels.support.map((level, index) => (
                                        <div key={index} className="text-sm bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 px-2 py-1 rounded">
                                            ₹{level.toFixed(2)}
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
                                {analysis.keyLevels.resistance.length > 0 ? (
                                    analysis.keyLevels.resistance.map((level, index) => (
                                        <div key={index} className="text-sm bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                                            ₹{level.toFixed(2)}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground">No resistance levels identified</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                {/* Chart Patterns */}
                {analysis.chartPatterns.length > 0 && (
                    <div className="space-y-3">
                        <h4 className="font-medium">Chart Patterns</h4>
                        <div className="space-y-3">
                            {analysis.chartPatterns.map((pattern, index) => (
                                <div key={index} className="border rounded-lg p-4 space-y-3">
                                    <div className="flex items-center justify-between flex-wrap gap-2">
                                        <div className="font-medium">{pattern.name}</div>
                                        <div className="flex items-center gap-2">
                                            <Badge variant={pattern.type === 'bullish' ? 'default' : pattern.type === 'bearish' ? 'destructive' : 'secondary'}>
                                                {pattern.type}
                                            </Badge>
                                            {pattern.category && (
                                                <Badge variant="outline" className="text-xs">
                                                    {pattern.category}
                                                </Badge>
                                            )}
                                        </div>
                                    </div>

                                    <div className="text-sm text-muted-foreground">{pattern.description}</div>
                                    <div className="text-sm">{pattern.implications}</div>

                                    {/* Pattern Details */}
                                    {(pattern.entryPoint || pattern.stopLoss || pattern.completionTarget) && (
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-3 pt-2 border-t">
                                            {pattern.entryPoint && (
                                                <div className="text-center">
                                                    <div className="text-xs text-muted-foreground">Entry</div>
                                                    <div className="text-sm font-medium text-blue-600">₹{pattern.entryPoint.toFixed(2)}</div>
                                                </div>
                                            )}
                                            {pattern.stopLoss && (
                                                <div className="text-center">
                                                    <div className="text-xs text-muted-foreground">Stop Loss</div>
                                                    <div className="text-sm font-medium text-red-600">₹{pattern.stopLoss.toFixed(2)}</div>
                                                </div>
                                            )}
                                            {pattern.completionTarget && (
                                                <div className="text-center">
                                                    <div className="text-xs text-muted-foreground">Target</div>
                                                    <div className="text-sm font-medium text-green-600">₹{pattern.completionTarget.toFixed(2)}</div>
                                                </div>
                                            )}
                                        </div>
                                    )}

                                    <div className="flex items-center gap-2">
                                        <span className="text-xs text-muted-foreground">Confidence:</span>
                                        <Progress value={pattern.confidence * 100} className="flex-1 h-2" />
                                        <span className="text-xs">{Math.round(pattern.confidence * 100)}%</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                )}
            </CardContent>
        </Card>
    );
}

// Trading Recommendations Component
function TradingRecommendations({ analysis }: { analysis: TechnicalAnalysis }) {
    const getActionColor = (action: string) => {
        switch (action) {
            case 'strong-buy':
            case 'buy':
                return 'text-green-600';
            case 'strong-sell':
            case 'sell':
                return 'text-red-600';
            default:
                return 'text-yellow-600';
        }
    };

    const getActionIcon = (action: string) => {
        switch (action) {
            case 'strong-buy':
            case 'buy':
                return <CheckCircle className="w-4 h-4" />;
            case 'strong-sell':
            case 'sell':
                return <XCircle className="w-4 h-4" />;
            default:
                return <Target className="w-4 h-4" />;
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle>Trading Recommendations</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">Recommendation</div>
                            <div className={`flex items-center gap-2 font-medium ${getActionColor(analysis.tradingRecommendation.action)}`}>
                                {getActionIcon(analysis.tradingRecommendation.action)}
                                <span className="capitalize">{analysis.tradingRecommendation.action.replace('-', ' ')}</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">Confidence</div>
                            <div className="flex items-center gap-2">
                                <Progress value={analysis.tradingRecommendation.confidence * 100} className="flex-1" />
                                <span className="text-sm font-medium">{Math.round(analysis.tradingRecommendation.confidence * 100)}%</span>
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">Risk/Reward Ratio</div>
                            <div className="text-lg font-medium">{analysis.tradingRecommendation.riskReward.toFixed(1)}:1</div>
                        </div>
                    </div>

                    <div className="space-y-4">
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">Entry Points</div>
                            <div className="space-y-1">
                                {analysis.tradingRecommendation.entryPoints.length > 0 ? (
                                    analysis.tradingRecommendation.entryPoints.map((price, index) => (
                                        <div key={index} className="text-sm bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200 px-2 py-1 rounded">
                                            ₹{price.toFixed(2)}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground">No specific entry points</div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">Stop Loss</div>
                            <div className="space-y-1">
                                {analysis.tradingRecommendation.stopLoss && analysis.tradingRecommendation.stopLoss.length > 0 ? (
                                    analysis.tradingRecommendation.stopLoss.map((price, index) => (
                                        <div key={index} className="text-sm bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 px-2 py-1 rounded">
                                            ₹{price.toFixed(2)}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground">No specific stop loss levels</div>
                                )}
                            </div>
                        </div>

                        <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">Exit Points</div>
                            <div className="space-y-1">
                                {analysis.tradingRecommendation.exitPoints.length > 0 ? (
                                    analysis.tradingRecommendation.exitPoints.map((price, index) => (
                                        <div key={index} className="text-sm bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-200 px-2 py-1 rounded">
                                            ₹{price.toFixed(2)}
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-sm text-muted-foreground">No specific exit points</div>
                                )}
                            </div>
                        </div>
                    </div>
                </div>

                <Separator />

                <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Reasoning</div>
                    <div className="text-sm">{analysis.tradingRecommendation.reasoning}</div>
                </div>

                {/* Price Targets */}
                {analysis.priceTargets.length > 0 && (
                    <>
                        <Separator />
                        <div className="space-y-3">
                            <h4 className="font-medium">Price Targets</h4>
                            <div className="space-y-2">
                                {analysis.priceTargets.map((target, index) => (
                                    <div key={index} className="flex items-center justify-between p-2 border rounded">
                                        <div className="space-y-1">
                                            <div className="flex items-center gap-2">
                                                <span className="font-medium">₹{target.price.toFixed(2)}</span>
                                                <Badge variant={target.type === 'upside' ? 'default' : 'destructive'}>
                                                    {target.type}
                                                </Badge>
                                            </div>
                                            <div className="text-xs text-muted-foreground">{target.reasoning}</div>
                                        </div>
                                        <div className="text-right">
                                            <div className="text-sm font-medium">{Math.round(target.probability * 100)}%</div>
                                            <div className="text-xs text-muted-foreground capitalize">{target.method || 'technical'}</div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// Risk Assessment Component
function RiskAssessment({ analysis }: { analysis: TechnicalAnalysis }) {
    const getRiskColor = (level: string) => {
        switch (level) {
            case 'low': return 'text-green-600';
            case 'medium': return 'text-yellow-600';
            case 'high': return 'text-orange-600';
            case 'very-high': return 'text-red-600';
            default: return 'text-gray-600';
        }
    };

    return (
        <Card>
            <CardHeader>
                <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Risk Assessment
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Risk Level</div>
                        <div className={`font-medium capitalize ${getRiskColor(analysis.riskAssessment.riskLevel)}`}>
                            {analysis.riskAssessment.riskLevel}
                        </div>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Volatility</div>
                        <Badge variant={analysis.riskAssessment.volatility === 'high' ? 'destructive' : 'secondary'} className="capitalize">
                            {analysis.riskAssessment.volatility}
                        </Badge>
                    </div>
                    <div className="space-y-2">
                        <div className="text-sm font-medium text-muted-foreground">Position Sizing</div>
                        <Badge variant="outline" className="capitalize">
                            {analysis.riskAssessment.positionSizing}
                        </Badge>
                    </div>
                </div>

                <Separator />

                <div className="space-y-2">
                    <div className="text-sm font-medium text-muted-foreground">Key Risks</div>
                    <div className="space-y-1">
                        {analysis.riskAssessment.keyRisks.map((risk, index) => (
                            <div key={index} className="text-sm bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-200 px-2 py-1 rounded">
                                {risk}
                            </div>
                        ))}
                    </div>
                </div>

                {analysis.riskAssessment.stopLossLevel && (
                    <>
                        <Separator />
                        <div className="space-y-2">
                            <div className="text-sm font-medium text-muted-foreground">Recommended Stop Loss</div>
                            <div className="text-lg font-medium text-red-600">₹{analysis.riskAssessment.stopLossLevel.toFixed(2)}</div>
                        </div>
                    </>
                )}
            </CardContent>
        </Card>
    );
}

// Disclaimer Component
function DisclaimerCard({ disclaimer }: { disclaimer: string }) {
    return (
        <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
                <strong>Important Disclaimer:</strong> {disclaimer}
            </AlertDescription>
        </Alert>
    );
}