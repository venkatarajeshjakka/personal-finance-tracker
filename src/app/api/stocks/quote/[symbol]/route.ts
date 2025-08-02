import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ symbol: string }> }
) {
  try {
    const { symbol } = await params;

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

        const quote = await yahooFinance.quoteSummary(formattedSymbol, { modules: ["price", "summaryDetail", "defaultKeyStatistics", "summaryProfile"] })

        if (!quote) {
          throw new Error('No quote data received');
        }

        // Transform the response to match our interface
        const transformedQuote = {
          symbol: quote.price?.symbol || formattedSymbol,
          regularMarketPrice: quote.price?.regularMarketPrice || 0,
          regularMarketChange: quote.price?.regularMarketChange || 0,
          regularMarketChangePercent: quote.price?.regularMarketChangePercent || 0,
          regularMarketTime: quote.price?.regularMarketTime || Date.now() / 1000,
          marketState: quote.price?.marketState || 'UNKNOWN',
          regularMarketPreviousClose: quote.price?.regularMarketPreviousClose || 0,
          regularMarketOpen: quote.price?.regularMarketOpen || 0,
          regularMarketDayHigh: quote.price?.regularMarketDayHigh || 0,
          regularMarketDayLow: quote.price?.regularMarketDayLow || 0,
          regularMarketVolume: quote.price?.regularMarketVolume || 0,
          currency: quote.price?.currency || 'INR',
          shortName: quote.price?.shortName || '',
          longName: quote.price?.longName || '',
          // Financial metrics
          marketCap: quote.price?.marketCap || null,
          trailingPE: quote.summaryDetail?.trailingPE || null,
          forwardPE: quote.summaryDetail?.forwardPE || null,
          priceToBook: quote.defaultKeyStatistics?.priceToBook || null,
          sharesOutstanding: quote.defaultKeyStatistics?.sharesOutstanding || null,
          bookValue: quote.defaultKeyStatistics?.bookValue || null,
          epsTrailingTwelveMonths: quote.defaultKeyStatistics?.trailingEps || null,
          trailingAnnualDividendYield: null,
          beta: quote.summaryDetail?.beta || null,
          // 52-week range from summaryDetail
          fiftyTwoWeekHigh: quote.summaryDetail?.fiftyTwoWeekHigh || null,
          fiftyTwoWeekLow: quote.summaryDetail?.fiftyTwoWeekLow || null,
          //Company Profile
          industry: quote.summaryProfile?.industry,
          sector: quote.summaryProfile?.sector
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