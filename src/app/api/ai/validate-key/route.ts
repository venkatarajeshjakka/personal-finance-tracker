import { NextRequest, NextResponse } from 'next/server';
import { GeminiAIService } from '@/lib/services/geminiAIService';
import type { ValidateAPIKeyRequest, ValidateAPIKeyResponse } from '@/types/gemini';

export async function POST(request: NextRequest) {
  try {
    const body: ValidateAPIKeyRequest = await request.json();
    
    // Validate required fields
    if (!body.apiKey) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: 'API key is required'
      } as ValidateAPIKeyResponse, { status: 400 });
    }

    // Validate the API key
    const isValid = await GeminiAIService.validateAPIKey(body.apiKey);

    return NextResponse.json({
      success: true,
      valid: isValid
    } as ValidateAPIKeyResponse);

  } catch (error) {
    console.error('API key validation error:', error);

    return NextResponse.json({
      success: false,
      valid: false,
      error: error instanceof Error ? error.message : 'Failed to validate API key'
    } as ValidateAPIKeyResponse, { status: 500 });
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