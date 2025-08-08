// Gemini AI integration types for technical analysis

export interface GeminiAIConfig {
  apiKey: string;
  model: string;
  maxTokens: number;
  temperature: number;
}

export interface ChartAnalysisRequest {
  symbol: string;
  chartImageData: string; // Base64 encoded image
  timeframe: string;
  additionalContext?: {
    currentPrice?: number;
    marketCap?: number;
    volume?: number;
    sector?: string;
    industry?: string;
  };
}

export interface ChartAnalysisResponse {
  id: string;
  symbol: string;
  analysis: TechnicalAnalysis;
  generatedAt: Date;
  confidence: number;
  disclaimer: string;
}

export interface ChartOverview {
  timeframe: string;
  assetClass: string;
  currentPriceContext: string;
  marketCondition: string;
}

export interface StageAnalysis {
  currentStage: 1 | 2 | 3 | 4;
  stageDescription: string;
  stageCharacteristics: string[];
  nextStageIndicators: string[];
  stageConfidence: number;
}

export interface TrendAnalysis {
  primaryTrend: {
    direction: 'bullish' | 'bearish' | 'neutral' | 'sideways';
    strength: 'strong' | 'moderate' | 'weak';
    duration: string;
  };
  secondaryTrend: {
    direction: 'bullish' | 'bearish' | 'neutral' | 'sideways';
    strength: 'strong' | 'moderate' | 'weak';
    duration: string;
  };
  supportLevels: PriceLevel[];
  resistanceLevels: PriceLevel[];
}

export interface PriceLevel {
  price: number;
  strength: 'strong' | 'moderate' | 'weak';
  type: 'historical' | 'psychological' | 'fibonacci' | 'pivot';
  description: string;
}



export interface KeyPriceLevels {
  criticalSupport: PriceLevel[];
  criticalResistance: PriceLevel[];
  pivotPoints: PriceLevel[];
  fibonacciLevels?: PriceLevel[];
  psychologicalLevels: PriceLevel[];
}

export interface TradingOpportunities {
  entrySetups: TradingSetup[];
  riskRewardAnalysis: {
    bestSetup: string;
    riskRewardRatio: number;
    probabilityOfSuccess: number;
  };
  stopLossLevels: PriceLevel[];
  takeProfitLevels: PriceLevel[];
}

export interface TradingSetup {
  name: string;
  type: 'long' | 'short';
  entryPrice: number;
  stopLoss: number;
  takeProfit: number[];
  riskReward: number;
  probability: number;
  reasoning: string;
}

export interface TimeProjections {
  patternCompletionTime: string;
  nextSignificantMove: {
    direction: 'up' | 'down' | 'sideways';
    timeframe: string;
    catalysts: string[];
  };
  keyDates: string[];
  seasonalFactors?: string;
}

export interface TechnicalAnalysis {
  chartOverview: ChartOverview;
  stageAnalysis: StageAnalysis;
  trendAnalysis: TrendAnalysis;
  keyPatterns: ChartPattern[];
  technicalIndicators: IndicatorAnalysis;
  keyPriceLevels: KeyPriceLevels;
  tradingOpportunities: TradingOpportunities;
  timeProjections: TimeProjections;
  // Legacy fields for backward compatibility
  overallTrend: 'bullish' | 'bearish' | 'neutral' | 'sideways';
  trendStrength: 'strong' | 'moderate' | 'weak';
  primaryTrend: {
    direction: 'bullish' | 'bearish' | 'neutral' | 'sideways';
    strength: 'strong' | 'moderate' | 'weak';
    duration: string;
    description: string;
  };
  secondaryTrend: {
    direction: 'bullish' | 'bearish' | 'neutral' | 'sideways';
    strength: 'strong' | 'moderate' | 'weak';
    duration: string;
    description: string;
  };
  keyLevels: {
    support: number[];
    resistance: number[];
  };
  chartPatterns: ChartPattern[];
  priceTargets: PriceTarget[];
  riskAssessment: RiskAssessment;
  tradingRecommendation: TradingRecommendation;
  timeHorizon: 'short-term' | 'medium-term' | 'long-term';
}

export interface ChartPattern {
  name: string;
  type: 'bullish' | 'bearish' | 'neutral';
  category: 'reversal' | 'continuation' | 'bilateral';
  confidence: number;
  description: string;
  implications: string;
  completionTarget?: number;
  patternMeasurement?: {
    height: number;
    width: string;
    projectedMove: number;
  };
  entryPoint?: number;
  stopLoss?: number;
  invalidationLevel?: number;
}

export interface IndicatorAnalysis {
  movingAverages: {
    shortTerm: 'above' | 'below' | 'crossing';
    longTerm: 'above' | 'below' | 'crossing';
    signal: 'bullish' | 'bearish' | 'neutral';
  };
  momentum: {
    rsi: {
      value: number;
      signal: 'overbought' | 'oversold' | 'neutral';
    };
    macd: {
      signal: 'bullish' | 'bearish' | 'neutral';
      divergence: boolean;
    };
  };
}

export interface PriceTarget {
  type: 'upside' | 'downside';
  price: number;
  probability: number;
  reasoning: string;
  method: 'pattern' | 'fibonacci' | 'resistance' | 'support' | 'technical';
}

export interface RiskAssessment {
  riskLevel: 'low' | 'medium' | 'high' | 'very-high';
  volatility: 'low' | 'medium' | 'high';
  keyRisks: string[];
  stopLossLevel?: number;
  positionSizing: string;
}

export interface TradingRecommendation {
  action: 'strong-buy' | 'buy' | 'hold' | 'sell' | 'strong-sell';
  confidence: number;
  reasoning: string;
  entryPoints: number[];
  stopLoss: number[];
  exitPoints: number[];
  timeframe: string;
  riskReward: number;
}

export interface AIAnalysisCache {
  [key: string]: {
    analysis: ChartAnalysisResponse;
    expiresAt: Date;
    chartConfigHash: string;
  };
}

export interface AIAnalysisError {
  code: 'API_KEY_INVALID' | 'RATE_LIMIT' | 'NETWORK_ERROR' | 'PARSING_ERROR' | 'VALIDATION_ERROR' | 'UNKNOWN_ERROR';
  message: string;
  retryable: boolean;
  retryAfter?: number;
}

export interface AIAnalysisHistory {
  id: string;
  symbol: string;
  analysis: ChartAnalysisResponse;
  chartConfig: any; // Chart configuration used
  createdAt: Date;
}

// Redux state interface for AI analysis
export interface AIAnalysisState {
  analyses: Record<string, ChartAnalysisResponse>; // keyed by symbol
  loading: Record<string, boolean>; // loading state per symbol
  error: Record<string, AIAnalysisError | null>; // error state per symbol
  history: AIAnalysisHistory[];
  cache: AIAnalysisCache;
  config: GeminiAIConfig;
  isConfigured: boolean;
}

// API request/response interfaces
export interface GenerateAnalysisRequest {
  symbol: string;
  chartImageData: string;
  timeframe: string;
  additionalContext?: ChartAnalysisRequest['additionalContext'];
}

export interface GenerateAnalysisResponse {
  success: boolean;
  data?: ChartAnalysisResponse;
  error?: AIAnalysisError;
}

export interface ValidateAPIKeyRequest {
  apiKey: string;
}

export interface ValidateAPIKeyResponse {
  success: boolean;
  valid: boolean;
  error?: string;
}