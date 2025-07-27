import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');

    if (!query || query.trim().length === 0) {
      return NextResponse.json(
        { error: 'Query parameter "q" is required' },
        { status: 400 }
      );
    }

    if (query.length < 2) {
      return NextResponse.json(
        { error: 'Query must be at least 2 characters long' },
        { status: 400 }
      );
    }

    // Search with retry logic
    let retryCount = 0;
    const maxRetries = 2;
    let lastError: Error | null = null;

    while (retryCount < maxRetries) {
      try {
        const searchResults = await yahooFinance.search(query, {
          quotesCount: 20,
          newsCount: 0,
          enableFuzzyQuery: true
        });

        if (!searchResults || !searchResults.quotes) {
          throw new Error('No search results received');
        }

        // Filter and transform results to focus on Indian stocks
        const transformedResults = searchResults.quotes
          .filter((quote: any) => {
            // Prioritize NSE (.NS) and BSE (.BO) stocks
            return quote.symbol?.includes('.NS') || 
                   quote.symbol?.includes('.BO') || 
                   quote.exchange === 'NSI' || 
                   quote.exchange === 'BSE' ||
                   (!quote.symbol?.includes('.') && quote.typeDisp === 'Equity'); // Indian stocks without suffix
          })
          .map((quote: any) => ({
            symbol: quote.symbol || '',
            name: quote.shortname || quote.longname || '',
            type: quote.typeDisp || 'Equity',
            exchange: quote.exchange || '',
            sector: quote.sector || '',
            industry: quote.industry || ''
          }))
          .slice(0, 15); // Limit results

        return NextResponse.json({
          query,
          results: transformedResults,
          totalResults: transformedResults.length
        });

      } catch (error) {
        lastError = error as Error;
        retryCount++;
        
        if (retryCount < maxRetries) {
          // Short delay before retry
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    }

    // If all retries failed, return error
    console.error(`Failed to search stocks for "${query}" after ${maxRetries} retries:`, lastError);
    
    return NextResponse.json(
      { 
        error: 'Failed to search stocks',
        details: lastError?.message || 'Unknown error',
        query
      },
      { status: 500 }
    );

  } catch (error) {
    console.error('Error in stock search API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}