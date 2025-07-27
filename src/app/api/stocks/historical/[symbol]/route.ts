import { NextRequest, NextResponse } from 'next/server';
import yahooFinance from 'yahoo-finance2';

export async function GET(
  request: NextRequest,
  { params }: { params: { symbol: string } }
) {
  try {
    const { symbol } = params;
    const { searchParams } = new URL(request.url);
    
    const period = searchParams.get('period') || '1y';
    const interval = searchParams.get('interval') || '1d';

    if (!symbol) {
      return NextResponse.json(
        { error: 'Symbol parameter is required' },
        { status: 400 }
      );
    }

    // Validate period and interval parameters
    const validPeriods = ['1d', '5d', '1mo', '3mo', '6mo', '1y', '2y', '5y', '10y', 'ytd', 'max'];
    const validIntervals = ['1m', '2m', '5m', '15m', '30m', '60m', '90m', '1h', '1d', '5d', '1wk', '1mo', '3mo'];

    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: `Invalid period. Valid periods: ${validPeriods.join(', ')}` },
        { status: 400 }
      );
    }

    if (!validIntervals.includes(interval)) {
      return NextResponse.json(
        { error: `Invalid interval. Valid intervals: ${validIntervals.join(', ')}` },
        { status: 400 }
      );
    }

    // Add .NS suffix for NSE symbols if not already present
    const formattedSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;

    // Fetch historical data with retry logic
    let retryCount = 0;
    const maxRetries = 3;
    let lastError: Error | null = null;

    while (retryCount < maxRetries) {
      try {
        const historicalData = await yahooFinance.historical(formattedSymbol, {
          period1: getPeriodStartDate(period),
          period2: new Date(),
          interval: interval as any,
          includeAdjustedClose: true
        });

        if (!historicalData || historicalData.length === 0) {
          throw new Error('No historical data received');
        }

        // Transform the response
        const transformedData = historicalData.map(item => ({
          date: item.date.toISOString().split('T')[0], // Format as YYYY-MM-DD
          open: item.open || 0,
          high: item.high || 0,
          low: item.low || 0,
          close: item.close || 0,
          volume: item.volume || 0,
          adjClose: item.adjClose || item.close || 0
        }));

        return NextResponse.json({
          symbol: formattedSymbol,
          period,
          interval,
          data: transformedData,
          totalPoints: transformedData.length
        });

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
    console.error(`Failed to fetch historical data for ${formattedSymbol} after ${maxRetries} retries:`, lastError);
    
    return NextResponse.json(
      { 
        error: 'Failed to fetch historical data',
        details: lastError?.message || 'Unknown error',
        symbol: formattedSymbol
      },
      { status: 500 }
    );

  } catch (error) {
    console.error('Error in historical data API:', error);
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

function getPeriodStartDate(period: string): Date {
  const now = new Date();
  const startDate = new Date(now);

  switch (period) {
    case '1d':
      startDate.setDate(now.getDate() - 1);
      break;
    case '5d':
      startDate.setDate(now.getDate() - 5);
      break;
    case '1mo':
      startDate.setMonth(now.getMonth() - 1);
      break;
    case '3mo':
      startDate.setMonth(now.getMonth() - 3);
      break;
    case '6mo':
      startDate.setMonth(now.getMonth() - 6);
      break;
    case '1y':
      startDate.setFullYear(now.getFullYear() - 1);
      break;
    case '2y':
      startDate.setFullYear(now.getFullYear() - 2);
      break;
    case '5y':
      startDate.setFullYear(now.getFullYear() - 5);
      break;
    case '10y':
      startDate.setFullYear(now.getFullYear() - 10);
      break;
    case 'ytd':
      startDate.setMonth(0, 1); // January 1st of current year
      break;
    case 'max':
      startDate.setFullYear(1970, 0, 1); // Unix epoch
      break;
    default:
      startDate.setFullYear(now.getFullYear() - 1); // Default to 1 year
  }

  return startDate;
}