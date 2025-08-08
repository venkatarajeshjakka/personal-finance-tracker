import { NextRequest, NextResponse } from 'next/server';
import { GeminiAIService } from '@/lib/services/geminiAIService';
import type { 
  GenerateAnalysisRequest, 
  GenerateAnalysisResponse,
  ChartAnalysisRequest 
} from '@/types/gemini';

export async function POST(request: NextRequest) {
  try {
    const body: GenerateAnalysisRequest = await request.json();
    
    // Validate required fields
    if (!body.symbol || !body.chartImageData || !body.timeframe) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Missing required fields: symbol, chartImageData, and timeframe are required',
          retryable: false
        }
      } as GenerateAnalysisResponse, { status: 400 });
    }

    // Validate image data format
    if (!body.chartImageData.startsWith('data:image/')) {
      return NextResponse.json({
        success: false,
        error: {
          code: 'VALIDATION_ERROR',
          message: 'Invalid image data format. Expected base64 encoded image.',
          retryable: false
        }
      } as GenerateAnalysisResponse, { status: 400 });
    }

    // Prepare analysis request
    const analysisRequest: ChartAnalysisRequest = {
      symbol: body.symbol,
      chartImageData: body.chartImageData,
      timeframe: body.timeframe,
      additionalContext: body.additionalContext
    };

    // Generate analysis
    const analysis = await GeminiAIService.analyzeChart(analysisRequest);

    return NextResponse.json({
      success: true,
      data: analysis
    } as GenerateAnalysisResponse);

  } catch (error) {
    console.error('Chart analysis API error:', error);

    // Handle specific error types
    if (error instanceof Error) {
      if (error.message.includes('API key')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'API_KEY_INVALID',
            message: 'Invalid or missing API key. Please configure your Gemini AI API key in settings.',
            retryable: false
          }
        } as GenerateAnalysisResponse, { status: 401 });
      }

      if (error.message.includes('quota') || error.message.includes('rate limit')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'RATE_LIMIT',
            message: 'API rate limit exceeded. Please try again later.',
            retryable: true,
            retryAfter: 60
          }
        } as GenerateAnalysisResponse, { status: 429 });
      }

      if (error.message.includes('network')) {
        return NextResponse.json({
          success: false,
          error: {
            code: 'NETWORK_ERROR',
            message: 'Network error occurred. Please check your connection and try again.',
            retryable: true
          }
        } as GenerateAnalysisResponse, { status: 503 });
      }
    }

    // Generic error response
    return NextResponse.json({
      success: false,
      error: {
        code: 'UNKNOWN_ERROR',
        message: error instanceof Error ? error.message : 'An unexpected error occurred',
        retryable: true
      }
    } as GenerateAnalysisResponse, { status: 500 });
  }
}

// Handle OPTIONS request for CORS
export async function OPTIONS() {
  return new NextResponse(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    },
  });
}