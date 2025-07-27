import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

interface StockQuoteRequest {
  symbols: string[];
}

export async function POST(request: NextRequest) {
  try {
    const body: StockQuoteRequest = await request.json();
    const { symbols } = body;

    if (!symbols || !Array.isArray(symbols) || symbols.length === 0) {
      return NextResponse.json(
        { error: 'Symbols array is required and must not be empty' },
        { status: 400 }
      );
    }

    // Limit the number of symbols to prevent abuse
    if (symbols.length > 50) {
      return NextResponse.json(
        { error: 'Maximum 50 symbols allowed per request' },
        { status: 400 }
      );
    }

    // Format symbols with .NS suffix for NSE
    const formattedSymbols = symbols.map(symbol => 
      symbol.includes('.') ? symbol : `${symbol}.NS`
    );

    const quotes: any[] = [];
    const errors: Array<{ symbol: string; error: string }> = [];

    // Process symbols in batches to avoid rate limiting
    const batchSize = 10;
    for (let i = 0; i < formattedSymbols.length; i += batchSize) {
      const batch = formattedSymbols.slice(i, i + batchSize);
      
      // Process each symbol in the batch with retry logic
      const batchPromises = batch.map(async (symbol) => {
        let retryCount = 0;
        const maxRetries = 2; // Reduced retries for batch processing
        
        while (retryCount < maxRetries) {
          try {
            const quote = await yahooFinance.quote(symbol, {
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

            return {
              symbol: quote.symbol || symbol,
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
          } catch (error) {
            retryCount++;
            if (retryCount >= maxRetries) {
              errors.push({
                symbol,
                error: error instanceof Error ? error.message : 'Unknown error'
              });
              return null;
            }
            // Short delay before retry
            await new Promise(resolve => setTimeout(resolve, 500));
          }
        }
        return null;
      });

      const batchResults = await Promise.all(batchPromises);
      quotes.push(...batchResults.filter(quote => quote !== null));

      // Add delay between batches to respect rate limits
      if (i + batchSize < formattedSymbols.length) {
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }

    return NextResponse.json({
      quotes,
      errors: errors.length > 0 ? errors : undefined,
      totalRequested: symbols.length,
      totalRetrieved: quotes.length,
      totalErrors: errors.length
    });

  } catch (error) {
    console.error('Error in bulk stock quotes API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}