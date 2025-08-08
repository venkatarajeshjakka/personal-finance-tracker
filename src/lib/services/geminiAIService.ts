import { GoogleGenerativeAI } from '@google/generative-ai';
import type {
    GeminiAIConfig,
    ChartAnalysisRequest,
    ChartAnalysisResponse,
    TechnicalAnalysis,
    AIAnalysisError,
    IndicatorAnalysis,
    RiskAssessment,
    TradingRecommendation
} from '@/types/gemini';

export class GeminiAIService {
    private static readonly DEFAULT_CONFIG: Omit<GeminiAIConfig, 'apiKey'> = {
        model: 'gemini-2.0-flash',
        maxTokens: 4000,
        temperature: 0.3
    };

    private static readonly ANALYSIS_PROMPT = `
You are an expert technical analyst with extensive experience in chart pattern recognition, indicator analysis, and market forecasting. I am providing you with a price chart for analysis.

Your task is to perform a detailed technical analysis of this chart, identifying key patterns, trends, and potential trading opportunities. Please structure your analysis as follows:

1. Chart Overview (Timeframe, asset class, current price action context)
2. Stage Analysis (Identify current market stage: Stage 1-4 based on Weinstein methodology)
3. Trend Analysis (Primary and secondary trends, support/resistance levels with specific price points)
4. Key Pattern Identification (Chart patterns like head and shoulders, triangles, flags with completion targets)
5. Technical Indicator Insights (Analysis of visible indicators such as RSI, MACD, Bollinger Bands, etc.)
6. Key Price Levels (Critical support/resistance zones, pivot points, with specific numerical values)
7. Trading Opportunities (Potential entry points, stop-loss levels, and price targets with risk/reward ratios)
8. Time Projections (When significant moves might occur based on pattern completion)

Base your analysis strictly on what you can observe in the provided chart. Include specific price levels, indicator readings, and pattern measurements whenever possible.

Please provide your analysis in the following JSON format:

{
  "chartOverview": {
    "timeframe": "daily/weekly/hourly",
    "assetClass": "equity/forex/crypto",
    "currentPriceContext": "description of current price action",
    "marketCondition": "trending/ranging/volatile"
  },
  "stageAnalysis": {
    "currentStage": 1|2|3|4,
    "stageDescription": "Stage 1: Accumulation/Stage 2: Advancing/Stage 3: Distribution/Stage 4: Declining",
    "stageCharacteristics": ["characteristic 1", "characteristic 2"],
    "nextStageIndicators": ["indicator 1", "indicator 2"],
    "stageConfidence": 0.8
  },
  "overallTrend": "bullish|bearish|neutral|sideways",
  "trendStrength": "strong|moderate|weak",
  "primaryTrend": {
    "direction": "bullish|bearish|neutral|sideways",
    "strength": "strong|moderate|weak",
    "duration": "short/medium/long term",
    "description": "detailed description of primary trend"
  },
  "secondaryTrend": {
    "direction": "bullish|bearish|neutral|sideways", 
    "strength": "strong|moderate|weak",
    "duration": "short/medium/long term",
    "description": "detailed description of secondary trend"
  },
  "keyLevels": {
    "support": [number, number],
    "resistance": [number, number]
  },
  "chartPatterns": [
    {
      "name": "Head and Shoulders|Inverse Head and Shoulders|Triangle (Ascending/Descending/Symmetrical)|Flag|Pennant|Double Top|Double Bottom|Cup and Handle|Wedge|Rectangle|Channel",
      "type": "bullish|bearish|neutral",
      "category": "reversal|continuation|bilateral",
      "confidence": 0.8,
      "description": "detailed description of the pattern formation",
      "implications": "what this means for price action",
      "completionTarget": 150.00,
      "patternMeasurement": {
        "height": 10.00,
        "width": "5 days",
        "projectedMove": 12.00
      },
      "entryPoint": 145.00,
      "stopLoss": 140.00,
      "invalidationLevel": 138.00
    }
  ],
  "technicalIndicators": {
    "movingAverages": {
      "shortTerm": "above|below|crossing",
      "longTerm": "above|below|crossing", 
      "signal": "bullish|bearish|neutral"
    },
    "momentum": {
      "rsi": {
        "value": 65,
        "signal": "overbought|oversold|neutral"
      },
      "macd": {
        "signal": "bullish|bearish|neutral",
        "divergence": true|false
      }
    }
  },
  "priceTargets": [
    {
      "type": "upside|downside",
      "price": 150.00,
      "probability": 0.7,
      "reasoning": "based on resistance level",
      "method": "pattern|fibonacci|resistance|support|technical"
    }
  ],
  "riskAssessment": {
    "riskLevel": "low|medium|high|very-high",
    "volatility": "low|medium|high",
    "keyRisks": ["risk 1", "risk 2"],
    "stopLossLevel": 140.00,
    "positionSizing": "conservative|moderate|aggressive"
  },
  "tradingRecommendation": {
    "action": "strong-buy|buy|hold|sell|strong-sell",
    "confidence": 0.75,
    "reasoning": "detailed reasoning for the recommendation",
    "entryPoints": [145.00, 142.00],
    "stopLoss": [138.00, 135.00],
    "exitPoints": [155.00, 160.00],
    "timeframe": "short-term|medium-term|long-term",
    "riskReward": 2.5
  }
}

Focus on:
1. Clear trend identification and strength assessment
2. Key support and resistance levels visible on the chart
3. Chart patterns (triangles, flags, head and shoulders, etc.)
4. Technical indicator signals if visible
5. Volume analysis and confirmation
6. Realistic price targets with probability estimates
7. Risk assessment and position sizing recommendations
8. Actionable trading recommendations with entry/exit points

Provide specific price levels where possible and explain your reasoning. Be conservative in your confidence levels and always include appropriate risk warnings.
`;

    private static genAI: GoogleGenerativeAI | null = null;

    /**
     * Initialize the Gemini AI client with API key
     */
    static initialize(apiKey: string): void {
        if (!apiKey) {
            throw new Error('API key is required to initialize Gemini AI');
        }
        this.genAI = new GoogleGenerativeAI(apiKey);
    }

    /**
     * Validate API key by making a test request
     */
    static async validateAPIKey(apiKey: string): Promise<boolean> {
        try {
            const testGenAI = new GoogleGenerativeAI(apiKey);
            const model = testGenAI.getGenerativeModel({ model: this.DEFAULT_CONFIG.model });

            // Make a simple test request
            const result = await model.generateContent('Test connection');
            return !!result.response;
        } catch (error) {
            console.error('API key validation failed:', error);
            return false;
        }
    }

    /**
     * Generate technical analysis from chart image
     */
    static async analyzeChart(request: ChartAnalysisRequest): Promise<ChartAnalysisResponse> {
        if (!this.genAI) {
            throw this.createError('API_KEY_INVALID', 'Gemini AI not initialized. Please configure API key.');
        }

        try {
            const model = this.genAI.getGenerativeModel({
                model: this.DEFAULT_CONFIG.model,
                generationConfig: {
                    maxOutputTokens: this.DEFAULT_CONFIG.maxTokens,
                    temperature: this.DEFAULT_CONFIG.temperature,
                }
            });

            // Prepare the prompt with additional context
            let contextualPrompt = this.ANALYSIS_PROMPT;

            if (request.additionalContext) {
                const context = request.additionalContext;
                contextualPrompt += `\n\nAdditional Context:`;
                if (context.currentPrice) contextualPrompt += `\nCurrent Price: $${context.currentPrice}`;
                if (context.marketCap) contextualPrompt += `\nMarket Cap: $${context.marketCap}`;
                if (context.volume) contextualPrompt += `\nVolume: ${context.volume}`;
                if (context.sector) contextualPrompt += `\nSector: ${context.sector}`;
                if (context.industry) contextualPrompt += `\nIndustry: ${context.industry}`;
            }

            contextualPrompt += `\n\nStock Symbol: ${request.symbol}`;
            contextualPrompt += `\nTimeframe: ${request.timeframe}`;

            // Convert base64 image data to the format expected by Gemini
            const imagePart = {
                inlineData: {
                    data: request.chartImageData.replace(/^data:image\/[a-z]+;base64,/, ''),
                    mimeType: 'image/png'
                }
            };

            // Generate analysis
            const result = await model.generateContent([contextualPrompt, imagePart]);
            const response = result.response;
            const text = response.text();
           
            // Parse the JSON response
            const analysis = this.parseAnalysisResponse(text);

            return {
                id: this.generateAnalysisId(),
                symbol: request.symbol,
                analysis,
                generatedAt: new Date(),
                confidence: this.calculateOverallConfidence(analysis),
                disclaimer: this.getDisclaimer()
            };

        } catch (error) {
            console.error('Chart analysis failed:', error);
            throw this.handleAPIError(error);
        }
    }

    /**
     * Parse the AI response and validate the structure
     */
    private static parseAnalysisResponse(responseText: string): TechnicalAnalysis {
        try {
            // Extract JSON from the response (in case there's additional text)
            const jsonMatch = responseText.match(/\{[\s\S]*\}/);
            if (!jsonMatch) {
                throw new Error('No valid JSON found in response');
            }

            const parsed = JSON.parse(jsonMatch[0]);           

            // Validate and structure the enhanced analysis
            return {
                // New enhanced structure
                chartOverview: this.validateChartOverview(parsed.chartOverview),
                stageAnalysis: this.validateStageAnalysis(parsed.stageAnalysis),
                trendAnalysis: this.validateTrendAnalysis(parsed.trendAnalysis),
                keyPatterns: Array.isArray(parsed.keyPatterns) ? parsed.keyPatterns : [],
                technicalIndicators: this.validateIndicatorAnalysis(parsed.technicalIndicators),
                keyPriceLevels: this.validateKeyPriceLevels(parsed.keyPriceLevels),
                tradingOpportunities: this.validateTradingOpportunities(parsed.tradingOpportunities),
                timeProjections: this.validateTimeProjections(parsed.timeProjections),

                // Legacy fields for backward compatibility
                overallTrend: parsed.overallTrend || parsed.trendAnalysis?.primaryTrend?.direction || 'neutral',
                trendStrength: parsed.trendStrength || parsed.trendAnalysis?.primaryTrend?.strength || 'moderate',
                primaryTrend: parsed.primaryTrend || parsed.trendAnalysis?.primaryTrend || {
                    direction: 'neutral',
                    strength: 'moderate',
                    duration: 'medium term',
                    description: 'Primary trend analysis'
                },
                secondaryTrend: parsed.secondaryTrend || parsed.trendAnalysis?.secondaryTrend || {
                    direction: 'neutral',
                    strength: 'moderate',
                    duration: 'short term',
                    description: 'Secondary trend analysis'
                },
                keyLevels: {
                    support: Array.isArray(parsed.keyLevels?.support) ? parsed.keyLevels.support :
                        (parsed.trendAnalysis?.supportLevels?.map((l: any) => l.price) || []),
                    resistance: Array.isArray(parsed.keyLevels?.resistance) ? parsed.keyLevels.resistance :
                        (parsed.trendAnalysis?.resistanceLevels?.map((l: any) => l.price) || [])
                },
                chartPatterns: Array.isArray(parsed.chartPatterns) ? parsed.chartPatterns :
                    (Array.isArray(parsed.keyPatterns) ? parsed.keyPatterns : []),
                priceTargets: Array.isArray(parsed.priceTargets) ? parsed.priceTargets : [],
                riskAssessment: this.validateRiskAssessment(parsed.riskAssessment),
                tradingRecommendation: this.validateTradingRecommendation(parsed.tradingRecommendation),
                timeHorizon: parsed.timeHorizon || 'medium-term'
            };
        } catch (error) {
            console.error('Failed to parse analysis response:', error);
            throw this.createError('PARSING_ERROR', 'Failed to parse AI analysis response');
        }
    }

    /**
     * Validate and provide defaults for indicator analysis
     */
    private static validateIndicatorAnalysis(indicators: any): IndicatorAnalysis {
        return {
            movingAverages: {
                shortTerm: indicators?.movingAverages?.shortTerm || 'neutral',
                longTerm: indicators?.movingAverages?.longTerm || 'neutral',
                signal: indicators?.movingAverages?.signal || 'neutral'
            },
            momentum: {
                rsi: {
                    value: indicators?.momentum?.rsi?.value || 50,
                    signal: indicators?.momentum?.rsi?.signal || 'neutral'
                },
                macd: {
                    signal: indicators?.momentum?.macd?.signal || 'neutral',
                    divergence: indicators?.momentum?.macd?.divergence || false
                }
            }
        };
    }

    /**
     * Validate and provide defaults for risk assessment
     */
    private static validateRiskAssessment(risk: any): RiskAssessment {
        return {
            riskLevel: risk?.riskLevel || 'medium',
            volatility: risk?.volatility || 'medium',
            keyRisks: Array.isArray(risk?.keyRisks) ? risk.keyRisks : ['Market volatility'],
            stopLossLevel: risk?.stopLossLevel,
            positionSizing: risk?.positionSizing || 'moderate'
        };
    }

    /**
     * Validate and provide defaults for trading recommendation
     */
    private static validateTradingRecommendation(recommendation: any): TradingRecommendation {
        return {
            action: recommendation?.action || 'hold',
            confidence: recommendation?.confidence || 0.5,
            reasoning: recommendation?.reasoning || 'Analysis based on current chart patterns',
            entryPoints: Array.isArray(recommendation?.entryPoints) ? recommendation.entryPoints : [],
            stopLoss: Array.isArray(recommendation?.stopLoss) ? recommendation.stopLoss : [],
            exitPoints: Array.isArray(recommendation?.exitPoints) ? recommendation.exitPoints : [],
            timeframe: recommendation?.timeframe || 'medium-term',
            riskReward: recommendation?.riskReward || 1.0
        };
    }

    /**
     * Calculate overall confidence based on analysis components
     */
    private static calculateOverallConfidence(analysis: TechnicalAnalysis): number {
        let totalConfidence = 0;
        let components = 0;

        // Factor in pattern confidence
        if (analysis.chartPatterns.length > 0) {
            const avgPatternConfidence = analysis.chartPatterns.reduce((sum, pattern) =>
                sum + (pattern.confidence || 0.5), 0) / analysis.chartPatterns.length;
            totalConfidence += avgPatternConfidence;
            components++;
        }

        // Factor in trading recommendation confidence
        if (analysis.tradingRecommendation.confidence) {
            totalConfidence += analysis.tradingRecommendation.confidence;
            components++;
        }

        // Default confidence if no components
        if (components === 0) return 0.5;

        return Math.round((totalConfidence / components) * 100) / 100;
    }

    /**
     * Generate unique analysis ID
     */
    private static generateAnalysisId(): string {
        return `analysis_${Date.now()}_${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Get standard disclaimer text
     */
    private static getDisclaimer(): string {
        return `This analysis is generated by AI and is for informational purposes only. It should not be considered as financial advice. Always conduct your own research and consult with qualified financial advisors before making investment decisions. Past performance does not guarantee future results. Trading involves substantial risk of loss.`;
    }

    /**
     * Validate chart overview
     */
    private static validateChartOverview(overview: any): any {
        return {
            timeframe: overview?.timeframe || 'daily',
            assetClass: overview?.assetClass || 'equity',
            currentPriceContext: overview?.currentPriceContext || 'Price action analysis',
            marketCondition: overview?.marketCondition || 'trending'
        };
    }

    /**
     * Validate stage analysis
     */
    private static validateStageAnalysis(stage: any): any {
        return {
            currentStage: stage?.currentStage || 2,
            stageDescription: stage?.stageDescription || 'Stage 2: Advancing phase',
            stageCharacteristics: Array.isArray(stage?.stageCharacteristics) ? stage.stageCharacteristics : ['Price trending higher', 'Volume confirmation'],
            nextStageIndicators: Array.isArray(stage?.nextStageIndicators) ? stage.nextStageIndicators : ['Watch for distribution signs'],
            stageConfidence: stage?.stageConfidence || 0.7
        };
    }

    /**
     * Validate trend analysis
     */
    private static validateTrendAnalysis(trend: any): any {
        return {
            primaryTrend: {
                direction: trend?.primaryTrend?.direction || 'neutral',
                strength: trend?.primaryTrend?.strength || 'moderate',
                duration: trend?.primaryTrend?.duration || 'medium term'
            },
            secondaryTrend: {
                direction: trend?.secondaryTrend?.direction || 'neutral',
                strength: trend?.secondaryTrend?.strength || 'moderate',
                duration: trend?.secondaryTrend?.duration || 'short term'
            },
            supportLevels: Array.isArray(trend?.supportLevels) ? trend.supportLevels : [],
            resistanceLevels: Array.isArray(trend?.resistanceLevels) ? trend.resistanceLevels : []
        };
    }

    /**
     * Validate key price levels
     */
    private static validateKeyPriceLevels(levels: any): any {
        return {
            criticalSupport: Array.isArray(levels?.criticalSupport) ? levels.criticalSupport : [],
            criticalResistance: Array.isArray(levels?.criticalResistance) ? levels.criticalResistance : [],
            pivotPoints: Array.isArray(levels?.pivotPoints) ? levels.pivotPoints : [],
            fibonacciLevels: Array.isArray(levels?.fibonacciLevels) ? levels.fibonacciLevels : [],
            psychologicalLevels: Array.isArray(levels?.psychologicalLevels) ? levels.psychologicalLevels : []
        };
    }

    /**
     * Validate trading opportunities
     */
    private static validateTradingOpportunities(opportunities: any): any {
        return {
            entrySetups: Array.isArray(opportunities?.entrySetups) ? opportunities.entrySetups : [],
            riskRewardAnalysis: {
                bestSetup: opportunities?.riskRewardAnalysis?.bestSetup || 'No setup identified',
                riskRewardRatio: opportunities?.riskRewardAnalysis?.riskRewardRatio || 1.0,
                probabilityOfSuccess: opportunities?.riskRewardAnalysis?.probabilityOfSuccess || 0.5
            },
            stopLossLevels: Array.isArray(opportunities?.stopLossLevels) ? opportunities.stopLossLevels : [],
            takeProfitLevels: Array.isArray(opportunities?.takeProfitLevels) ? opportunities.takeProfitLevels : []
        };
    }

    /**
     * Validate time projections
     */
    private static validateTimeProjections(projections: any): any {
        return {
            patternCompletionTime: projections?.patternCompletionTime || 'Not specified',
            nextSignificantMove: {
                direction: projections?.nextSignificantMove?.direction || 'sideways',
                timeframe: projections?.nextSignificantMove?.timeframe || 'medium term',
                catalysts: Array.isArray(projections?.nextSignificantMove?.catalysts) ?
                    projections.nextSignificantMove.catalysts : []
            },
            keyDates: Array.isArray(projections?.keyDates) ? projections.keyDates : [],
            seasonalFactors: projections?.seasonalFactors || 'No seasonal factors identified'
        };
    }

    /**
     * Handle API errors and convert to standardized format
     */
    private static handleAPIError(error: any): AIAnalysisError {
        if (error.message?.includes('API key')) {
            return this.createError('API_KEY_INVALID', 'Invalid or expired API key');
        }

        if (error.message?.includes('quota') || error.message?.includes('rate limit')) {
            return this.createError('RATE_LIMIT', 'API rate limit exceeded. Please try again later.');
        }

        if (error.message?.includes('network') || error.code === 'NETWORK_ERROR') {
            return this.createError('NETWORK_ERROR', 'Network error. Please check your connection.');
        }

        return this.createError('UNKNOWN_ERROR', error.message || 'An unexpected error occurred');
    }

    /**
     * Create standardized error object
     */
    private static createError(code: AIAnalysisError['code'], message: string): AIAnalysisError {
        return {
            code,
            message,
            retryable: code === 'NETWORK_ERROR' || code === 'RATE_LIMIT',
            retryAfter: code === 'RATE_LIMIT' ? 60 : undefined
        };
    }

    /**
     * Create cache key for analysis
     */
    static createCacheKey(symbol: string, chartConfigHash: string): string {
        return `${symbol}_${chartConfigHash}`;
    }

    /**
     * Check if cached analysis is still valid
     */
    static isCacheValid(cacheEntry: any, maxAgeMinutes: number = 30): boolean {
        if (!cacheEntry || !cacheEntry.expiresAt) return false;

        // Calculate expiration based on maxAgeMinutes
        const expirationTime = new Date(cacheEntry.createdAt || Date.now() - (maxAgeMinutes * 60 * 1000));
        const now = new Date();

        // Use the provided expiresAt or calculate based on maxAgeMinutes
        const expiresAt = cacheEntry.expiresAt ? new Date(cacheEntry.expiresAt) : expirationTime;

        return now < expiresAt;
    }
}