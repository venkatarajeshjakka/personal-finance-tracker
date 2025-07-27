import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(
  _request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Add .NS suffix for NSE symbols if not already present
    const formattedSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;

    // Fetch quote with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    let lastError: Error | null = null;

    while (retryCount < maxRetries) {
      try {
        const quote = await yahooFinance.quote(formattedSymbol, {
          fields: [
            'symbol',
            'regularMarketPrice',
            'regularMarketChange',
            'regularMarketChangePercent',
            'regularMarketTime',
            'marketState',
            'regularMarketPreviousClose',
            'regularMarketOpen',
            'regularMarketDayHigh',
            'regularMarketDayLow',
            'regularMarketVolume',
            'currency',
            'shortName',
            'longName'
          ]
        });

        if (!quote) {
          throw new Error('No quote data received');
        }

        // Transform the response to match our interface
        const transformedQuote = {
          symbol: quote.symbol || formattedSymbol,
          regularMarketPrice: quote.regularMarketPrice || 0,
          regularMarketChange: quote.regularMarketChange || 0,
          regularMarketChangePercent: quote.regularMarketChangePercent || 0,
          regularMarketTime: quote.regularMarketTime || Date.now() / 1000,
          marketState: quote.marketState || 'UNKNOWN',
          regularMarketPreviousClose: quote.regularMarketPreviousClose || 0,
          regularMarketOpen: quote.regularMarketOpen || 0,
          regularMarketDayHigh: quote.regularMarketDayHigh || 0,
          regularMarketDayLow: quote.regularMarketDayLow || 0,
          regularMarketVolume: quote.regularMarketVolume || 0,
          currency: quote.currency || 'INR',
          shortName: quote.shortName || '',
          longName: quote.longName || ''
        };

        return NextResponse.json(transformedQuote);
      } catch (error) {
        lastError = error as Error;
        retryCount++;
        
        if (retryCount < maxRetries) {
          // Wait before retrying (exponential backoff)
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, retryCount) * 1000));
        }
      }
    }

    // If all retries failed, return error
    console.error(`Failed to fetch quote for ${formattedSymbol} after ${maxRetries} retries:`, lastError);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch stock quote',
        details: lastError?.message || 'Unknown error',
        symbol: formattedSymbol
      },
      { status: 500 }
    );

  } catch (error) {
    console.error('Error in stock quote API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}