'use client';

import { useState, useEffect } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
    Brain,
    RefreshCw,
    AlertTriangle,
    TrendingUp,
    TrendingDown,
    Target,
    Shield,
    CheckCircle,
    XCircle,
    Sparkles,
    BarChart3,
    Zap,
    Eye,
    Settings,
    Download,
    Share
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
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 rounded-xl" />
                <Card className="relative border-2 border-dashed border-blue-200 dark:border-blue-800 bg-transparent">
                    <CardContent className="p-8 text-center">
                        <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center mb-4">
                            <Brain className="w-8 h-8 text-white" />
                        </div>
                        <h3 className="text-xl font-semibold mb-2">AI Analysis Not Configured</h3>
                        <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                            Unlock powerful AI-driven technical analysis by configuring your Gemini AI API key.
                            Get professional insights, pattern recognition, and trading recommendations.
                        </p>
                        <Button className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700">
                            <Settings className="w-4 h-4 mr-2" />
                            Configure AI Settings
                        </Button>
                    </CardContent>
                </Card>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {/* Enhanced Analysis Trigger */}
            <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-r from-blue-500/10 to-purple-500/10 rounded-xl blur-xl" />
                <Card className="relative border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50/50 to-purple-50/50 dark:from-blue-950/20 dark:to-purple-950/20">
                    <CardHeader>
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl flex items-center justify-center">
                                    <Brain className="w-6 h-6 text-white" />
                                </div>
                                <div>
                                    <CardTitle className="text-xl bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                                        AI Technical Analysis
                                    </CardTitle>
                                    <CardDescription className="text-sm">
                                        Powered by Gemini AI • Professional insights in seconds
                                    </CardDescription>
                                </div>
                            </div>
                            <div className="flex items-center gap-2">
                                {analysis && (
                                    <>
                                        <Button variant="outline" size="sm">
                                            <Download className="w-4 h-4 mr-2" />
                                            Export
                                        </Button>
                                        <Button variant="outline" size="sm">
                                            <Share className="w-4 h-4 mr-2" />
                                            Share
                                        </Button>
                                    </>
                                )}
                                <Button
                                    onClick={handleAnalyzeChart}
                                    disabled={loading || isCapturing}
                                    className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 min-w-[140px]"
                                >
                                    {loading || isCapturing ? (
                                        <>
                                            <RefreshCw className="w-4 h-4 mr-2 animate-spin" />
                                            {isCapturing ? 'Capturing...' : 'Analyzing...'}
                                        </>
                                    ) : (
                                        <>
                                            <Sparkles className="w-4 h-4 mr-2" />
                                            {analysis ? 'Re-analyze' : 'Analyze Chart'}
                                        </>
                                    )}
                                </Button>
                            </div>
                        </div>

                        {/* Analysis Status Bar */}
                        {(loading || isCapturing) && (
                            <div className="mt-4">
                                <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                                    <span>{isCapturing ? 'Capturing chart image...' : 'AI analyzing patterns...'}</span>
                                    <span>{isCapturing ? '1/2' : '2/2'}</span>
                                </div>
                                <Progress value={isCapturing ? 50 : 90} className="h-2" />
                            </div>
                        )}

                        {error && (
                            <Alert variant="destructive" className="mt-4">
                                <AlertTriangle className="h-4 w-4" />
                                <AlertDescription className="flex items-center justify-between">
                                    <span>{error.message}</span>
                                    <Button variant="outline" size="sm" onClick={handleAnalyzeChart}>
                                        <RefreshCw className="w-4 h-4 mr-2" />
                                        Retry
                                    </Button>
                                </AlertDescription>
                            </Alert>
                        )}
                    </CardHeader>
                </Card>
            </div>

            {/* Enhanced Analysis Results */}
            {analysis && (
                <div className="space-y-6">
                    {/* Quick Insights Dashboard */}
                    <Card className="border-green-200 dark:border-green-800 bg-gradient-to-r from-green-50/50 to-emerald-50/50 dark:from-green-950/20 dark:to-emerald-950/20">
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center">
                                        <Eye className="w-5 h-5 text-white" />
                                    </div>
                                    <div>
                                        <CardTitle className="text-lg">Quick Insights</CardTitle>
                                        <CardDescription>
                                            Generated {new Date(analysis.generatedAt).toLocaleString()}
                                        </CardDescription>
                                    </div>
                                </div>
                                <Badge variant="secondary" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200">
                                    {Math.round(analysis.confidence * 100)}% Confidence
                                </Badge>
                            </div>
                        </CardHeader>
                        <CardContent>
                            <QuickInsightsDashboard analysis={analysis} />
                        </CardContent>
                    </Card>

                    {/* Tabbed Analysis Sections */}
                    <Card>
                        <Tabs defaultValue="overview" className="w-full">
                            <CardHeader className="pb-3">
                                <TabsList className="grid w-full grid-cols-6 bg-muted/50">
                                    <TabsTrigger value="overview" className="flex items-center gap-2">
                                        <BarChart3 className="w-4 h-4" />
                                        Overview
                                    </TabsTrigger>
                                    <TabsTrigger value="stage" className="flex items-center gap-2">
                                        <Target className="w-4 h-4" />
                                        Stage
                                    </TabsTrigger>
                                   
                                    <TabsTrigger value="patterns" className="flex items-center gap-2">
                                        <Zap className="w-4 h-4" />
                                        Patterns
                                    </TabsTrigger>
                                    <TabsTrigger value="trading" className="flex items-center gap-2">
                                        <CheckCircle className="w-4 h-4" />
                                        Trading
                                    </TabsTrigger>
                                    <TabsTrigger value="risk" className="flex items-center gap-2">
                                        <Shield className="w-4 h-4" />
                                        Risk
                                    </TabsTrigger>
                                </TabsList>
                            </CardHeader>

                            <CardContent>
                                <ScrollArea className="h-[600px] pr-4">
                                    <TabsContent value="overview" className="mt-0">
                                        <AnalysisOverview analysis={analysis} />
                                    </TabsContent>

                                    <TabsContent value="stage" className="mt-0">
                                        <StageAnalysisDisplay analysis={analysis.analysis} />
                                    </TabsContent>                                    

                                    <TabsContent value="patterns" className="mt-0">
                                        <TechnicalInsights analysis={analysis.analysis} />
                                        <div className="mt-6">
                                            <TimeProjectionsDisplay analysis={analysis.analysis} />
                                        </div>
                                    </TabsContent>

                                    <TabsContent value="trading" className="mt-0">
                                        <TradingRecommendations analysis={analysis.analysis} />
                                    </TabsContent>

                                    <TabsContent value="risk" className="mt-0">
                                        <RiskAssessment analysis={analysis.analysis} />
                                        <div className="mt-6">
                                            <DisclaimerCard disclaimer={analysis.disclaimer} />
                                        </div>
                                    </TabsContent>
                                </ScrollArea>
                            </CardContent>
                        </Tabs>
                    </Card>
                </div>
            )}
        </div>
    );
}

// Quick Insights Dashboard Component
function QuickInsightsDashboard({ analysis }: { analysis: ChartAnalysisResponse }) {
    const getTrendColor = (trend: string) => {
        switch (trend) {
            case 'bullish': return 'text-green-600 bg-green-100 dark:bg-green-900/30';
            case 'bearish': return 'text-red-600 bg-red-100 dark:bg-red-900/30';
            default: return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
        }
    };

    const getTrendIcon = (trend: string) => {
        switch (trend) {
            case 'bullish': return <TrendingUp className="w-4 h-4" />;
            case 'bearish': return <TrendingDown className="w-4 h-4" />;
            default: return <Target className="w-4 h-4" />;
        }
    };

    const getStageColor = (stage: number) => {
        switch (stage) {
            case 1: return 'text-blue-600 bg-blue-100 dark:bg-blue-900/30';
            case 2: return 'text-green-600 bg-green-100 dark:bg-green-900/30';
            case 3: return 'text-orange-600 bg-orange-100 dark:bg-orange-900/30';
            case 4: return 'text-red-600 bg-red-100 dark:bg-red-900/30';
            default: return 'text-gray-600 bg-gray-100 dark:bg-gray-900/30';
        }
    };

    const getActionColor = (action: string) => {
        switch (action) {
            case 'strong-buy':
            case 'buy':
                return 'text-green-600 bg-green-100 dark:bg-green-900/30';
            case 'strong-sell':
            case 'sell':
                return 'text-red-600 bg-red-100 dark:bg-red-900/30';
            default:
                return 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30';
        }
    };

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Overall Trend */}
            <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Overall Trend</span>
                    <div className={`p-1 rounded-full ${getTrendColor(analysis.analysis.overallTrend)}`}>
                        {getTrendIcon(analysis.analysis.overallTrend)}
                    </div>
                </div>
                <div className="text-lg font-semibold capitalize">{analysis.analysis.overallTrend}</div>
                <div className="text-xs text-muted-foreground capitalize">{analysis.analysis.trendStrength} strength</div>
            </div>

            {/* Market Stage */}
            <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Market Stage</span>
                    <div className={`px-2 py-1 rounded-full text-xs font-medium ${getStageColor(analysis.analysis.stageAnalysis?.currentStage || 2)}`}>
                        Stage {analysis.analysis.stageAnalysis?.currentStage || 2}
                    </div>
                </div>
                <div className="text-lg font-semibold">
                    {analysis.analysis.stageAnalysis?.stageDescription?.split(':')[1]?.trim() || 'Analysis'}
                </div>
                <div className="text-xs text-muted-foreground">
                    {Math.round((analysis.analysis.stageAnalysis?.stageConfidence || 0.7) * 100)}% confidence
                </div>
            </div>

            {/* Trading Recommendation */}
            <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Recommendation</span>
                    <div className={`p-1 rounded-full ${getActionColor(analysis.analysis.tradingRecommendation.action)}`}>
                        {analysis.analysis.tradingRecommendation.action === 'buy' || analysis.analysis.tradingRecommendation.action === 'strong-buy' ?
                            <CheckCircle className="w-4 h-4" /> :
                            analysis.analysis.tradingRecommendation.action === 'sell' || analysis.analysis.tradingRecommendation.action === 'strong-sell' ?
                                <XCircle className="w-4 h-4" /> :
                                <Target className="w-4 h-4" />
                        }
                    </div>
                </div>
                <div className="text-lg font-semibold capitalize">
                    {analysis.analysis.tradingRecommendation.action.replace('-', ' ')}
                </div>
                <div className="text-xs text-muted-foreground">
                    {Math.round(analysis.analysis.tradingRecommendation.confidence * 100)}% confidence
                </div>
            </div>

            {/* Risk Level */}
            <div className="p-4 rounded-lg border bg-card">
                <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Risk Level</span>
                    <Shield className={`w-4 h-4 ${analysis.analysis.riskAssessment.riskLevel === 'low' ? 'text-green-600' :
                            analysis.analysis.riskAssessment.riskLevel === 'medium' ? 'text-yellow-600' :
                                'text-red-600'
                        }`} />
                </div>
                <div className="text-lg font-semibold capitalize">{analysis.analysis.riskAssessment.riskLevel}</div>
                <div className="text-xs text-muted-foreground capitalize">
                    {analysis.analysis.riskAssessment.volatility} volatility
                </div>
            </div>
        </div>
    );
}

// Enhanced Analysis Overview Component
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
            case 'bullish': return <TrendingUp className="w-5 h-5" />;
            case 'bearish': return <TrendingDown className="w-5 h-5" />;
            default: return <Target className="w-5 h-5" />;
        }
    };

    const getTrendBg = (trend: string) => {
        switch (trend) {
            case 'bullish': return 'bg-green-100 dark:bg-green-900/30';
            case 'bearish': return 'bg-red-100 dark:bg-red-900/30';
            default: return 'bg-yellow-100 dark:bg-yellow-900/30';
        }
    };

    return (
        <div className="space-y-6">
            {/* Hero Section */}
            <div className="text-center space-y-4">
                <div className={`inline-flex items-center gap-3 px-6 py-3 rounded-full ${getTrendBg(analysis.analysis.overallTrend)}`}>
                    {getTrendIcon(analysis.analysis.overallTrend)}
                    <span className={`text-lg font-semibold capitalize ${getTrendColor(analysis.analysis.overallTrend)}`}>
                        {analysis.analysis.overallTrend} Trend
                    </span>
                </div>
                <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
                    <span>Strength: {analysis.analysis.trendStrength}</span>
                    <span>•</span>
                    <span>Confidence: {Math.round(analysis.confidence * 100)}%</span>
                    <span>•</span>
                    <span>{new Date(analysis.generatedAt).toLocaleDateString()}</span>
                </div>
            </div>

            {/* Confidence Meter */}
            <div className="space-y-3">
                <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Analysis Confidence</span>
                    <span className="text-sm font-semibold">{Math.round(analysis.confidence * 100)}%</span>
                </div>
                <div className="relative">
                    <Progress value={analysis.confidence * 100} className="h-3" />
                    <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-xs font-medium text-white mix-blend-difference">
                            {analysis.confidence >= 0.8 ? 'High' : analysis.confidence >= 0.6 ? 'Medium' : 'Low'} Confidence
                        </span>
                    </div>
                </div>
            </div>

            {/* Detailed Trends */}
            {(analysis.analysis.primaryTrend || analysis.analysis.secondaryTrend) && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Primary Trend */}
                    {analysis.analysis.primaryTrend && (
                        <div className="p-4 rounded-lg border bg-card space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Primary Trend</h4>
                                <Badge variant="outline" className="text-xs">
                                    {analysis.analysis.primaryTrend.duration}
                                </Badge>
                            </div>
                            <div className={`flex items-center gap-3 p-3 rounded-lg ${getTrendBg(analysis.analysis.primaryTrend.direction)}`}>
                                {getTrendIcon(analysis.analysis.primaryTrend.direction)}
                                <div>
                                    <div className={`font-medium capitalize ${getTrendColor(analysis.analysis.primaryTrend.direction)}`}>
                                        {analysis.analysis.primaryTrend.direction}
                                    </div>
                                    <div className="text-xs text-muted-foreground capitalize">
                                        {analysis.analysis.primaryTrend.strength} strength
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {analysis.analysis.primaryTrend.description}
                            </p>
                        </div>
                    )}

                    {/* Secondary Trend */}
                    {analysis.analysis.secondaryTrend && (
                        <div className="p-4 rounded-lg border bg-card space-y-3">
                            <div className="flex items-center justify-between">
                                <h4 className="font-medium">Secondary Trend</h4>
                                <Badge variant="outline" className="text-xs">
                                    {analysis.analysis.secondaryTrend.duration}
                                </Badge>
                            </div>
                            <div className={`flex items-center gap-3 p-3 rounded-lg ${getTrendBg(analysis.analysis.secondaryTrend.direction)}`}>
                                {getTrendIcon(analysis.analysis.secondaryTrend.direction)}
                                <div>
                                    <div className={`font-medium capitalize ${getTrendColor(analysis.analysis.secondaryTrend.direction)}`}>
                                        {analysis.analysis.secondaryTrend.direction}
                                    </div>
                                    <div className="text-xs text-muted-foreground capitalize">
                                        {analysis.analysis.secondaryTrend.strength} strength
                                    </div>
                                </div>
                            </div>
                            <p className="text-sm text-muted-foreground">
                                {analysis.analysis.secondaryTrend.description}
                            </p>
                        </div>
                    )}
                </div>
            )}
        </div>
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