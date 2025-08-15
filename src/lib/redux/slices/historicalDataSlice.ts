import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';

export interface HistoricalDataPoint {
  date: string;
  close: number;
}

export interface CachedHistoricalData {
  symbol: string;
  data: HistoricalDataPoint[];
  volatility: number;
  lastUpdated: number;
  period: string;
  interval: string;
}

export interface HistoricalDataState {
  cache: Record<string, CachedHistoricalData>;
  loading: Record<string, boolean>;
  errors: Record<string, string | null>;
}

const initialState: HistoricalDataState = {
  cache: {},
  loading: {},
  errors: {},
};

// Request deduplication - track ongoing requests to prevent duplicates
const ongoingRequests = new Map<string, Promise<{ results: CachedHistoricalData[]; errors: { symbol: string; error: string }[] }>>();

// Async thunk to fetch historical data for a single symbol
export const fetchHistoricalData = createAsyncThunk(
  'historicalData/fetchHistoricalData',
  async ({ 
    symbol, 
    period = '1y', 
    interval = '1d' 
  }: { 
    symbol: string; 
    period?: string; 
    interval?: string; 
  }) => {
    const formattedSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
    const response = await fetch(`/api/stocks/historical/${formattedSymbol}?period=${period}&interval=${interval}`);
    
    if (!response.ok) {
      throw new Error(`Failed to fetch historical data for ${symbol}`);
    }
    
    const data = await response.json();
    
    if (!data.data || data.data.length === 0) {
      throw new Error(`No historical data available for ${symbol}`);
    }
    
    // Calculate volatility from the data
    const volatility = calculateVolatilityFromData(data.data);
    
    return {
      symbol,
      data: data.data,
      volatility,
      period,
      interval,
      lastUpdated: Date.now(),
    };
  }
);

// Async thunk to batch fetch historical data for multiple symbols
export const fetchBatchHistoricalData = createAsyncThunk(
  'historicalData/fetchBatchHistoricalData',
  async ({ 
    symbols, 
    period = '1y', 
    interval = '1d' 
  }: { 
    symbols: string[]; 
    period?: string; 
    interval?: string; 
  }) => {
    // Create a unique key for this batch request
    const batchKey = `batch-${symbols.sort().join(',')}-${period}-${interval}`;
    
    // Check if this exact batch request is already in progress
    if (ongoingRequests.has(batchKey)) {
      return await ongoingRequests.get(batchKey)!;
    }
    
    // Create the request promise
    const requestPromise = (async () => {
      try {
        const results: CachedHistoricalData[] = [];
        const errors: { symbol: string; error: string }[] = [];
        
        // Process symbols in parallel but limit concurrency to avoid overwhelming the API
        const batchSize = 3;
        for (let i = 0; i < symbols.length; i += batchSize) {
          const batch = symbols.slice(i, i + batchSize);
          
          const batchPromises = batch.map(async (symbol) => {
            try {
              const formattedSymbol = symbol.includes('.') ? symbol : `${symbol}.NS`;
              const response = await fetch(`/api/stocks/historical/${formattedSymbol}?period=${period}&interval=${interval}`);
              
              if (!response.ok) {
                throw new Error(`Failed to fetch historical data for ${symbol}`);
              }
              
              const data = await response.json();
              
              if (!data.data || data.data.length === 0) {
                throw new Error(`No historical data available for ${symbol}`);
              }
              
              // Calculate volatility from the data
              const volatility = calculateVolatilityFromData(data.data);
              
              return {
                symbol,
                data: data.data,
                volatility,
                period,
                interval,
                lastUpdated: Date.now(),
              };
            } catch (error) {
              errors.push({ 
                symbol, 
                error: error instanceof Error ? error.message : 'Unknown error' 
              });
              return null;
            }
          });
          
          const batchResults = await Promise.all(batchPromises);
          results.push(...batchResults.filter((result): result is CachedHistoricalData => result !== null));
          
          // Small delay between batches to be respectful to the API
          if (i + batchSize < symbols.length) {
            await new Promise(resolve => setTimeout(resolve, 100));
          }
        }
        
        return { results, errors };
      } finally {
        // Clean up the ongoing request
        ongoingRequests.delete(batchKey);
      }
    })();
    
    // Store the promise to prevent duplicate requests
    ongoingRequests.set(batchKey, requestPromise);
    
    return await requestPromise;
  }
);

// Helper function to calculate volatility
function calculateVolatilityFromData(historicalData: HistoricalDataPoint[]): number {
  if (historicalData.length < 2) return 0;

  // Calculate daily returns
  const dailyReturns: number[] = [];
  for (let i = 1; i < historicalData.length; i++) {
    const prevClose = historicalData[i - 1].close;
    const currentClose = historicalData[i].close;
    
    if (prevClose > 0) {
      const dailyReturn = (currentClose - prevClose) / prevClose;
      dailyReturns.push(dailyReturn);
    }
  }

  if (dailyReturns.length < 2) return 0;

  // Calculate standard deviation of daily returns
  const mean = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
  const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (dailyReturns.length - 1);
  const dailyVolatility = Math.sqrt(variance);

  // Annualize volatility (multiply by sqrt of trading days per year)
  const annualizedVolatility = dailyVolatility * Math.sqrt(252) * 100; // Convert to percentage

  return annualizedVolatility;
}

const historicalDataSlice = createSlice({
  name: 'historicalData',
  initialState,
  reducers: {
    clearCache: (state) => {
      state.cache = {};
      state.loading = {};
      state.errors = {};
    },
    clearSymbolCache: (state, action: PayloadAction<string>) => {
      const symbol = action.payload;
      delete state.cache[symbol];
      delete state.loading[symbol];
      delete state.errors[symbol];
    },
    clearExpiredCache: (state) => {
      const now = Date.now();
      const maxAge = 5 * 60 * 1000; // 5 minutes
      
      Object.keys(state.cache).forEach(symbol => {
        if (now - state.cache[symbol].lastUpdated > maxAge) {
          delete state.cache[symbol];
          delete state.loading[symbol];
          delete state.errors[symbol];
        }
      });
    },
    clearOngoingRequests: (state) => {
      // Clear the ongoing requests map
      ongoingRequests.clear();
    },
  },
  extraReducers: (builder) => {
    builder
      // Single symbol fetch
      .addCase(fetchHistoricalData.pending, (state, action) => {
        const symbol = action.meta.arg.symbol;
        state.loading[symbol] = true;
        state.errors[symbol] = null;
      })
      .addCase(fetchHistoricalData.fulfilled, (state, action) => {
        const { symbol } = action.payload;
        state.loading[symbol] = false;
        state.cache[symbol] = action.payload;
        state.errors[symbol] = null;
      })
      .addCase(fetchHistoricalData.rejected, (state, action) => {
        const symbol = action.meta.arg.symbol;
        state.loading[symbol] = false;
        state.errors[symbol] = action.error.message || 'Failed to fetch historical data';
      })
      // Batch fetch
      .addCase(fetchBatchHistoricalData.pending, (state, action) => {
        const symbols = action.meta.arg.symbols;
        symbols.forEach(symbol => {
          state.loading[symbol] = true;
          state.errors[symbol] = null;
        });
      })
      .addCase(fetchBatchHistoricalData.fulfilled, (state, action) => {
        const { results, errors } = action.payload;
        const symbols = action.meta.arg.symbols;
        
        // Update successful results
        results.forEach((result: CachedHistoricalData) => {
          state.loading[result.symbol] = false;
          state.cache[result.symbol] = result;
          state.errors[result.symbol] = null;
        });
        
        // Update errors
        errors.forEach(({ symbol, error }: { symbol: string; error: string }) => {
          state.loading[symbol] = false;
          state.errors[symbol] = error;
        });
        
        // Mark any remaining symbols as not loading
        symbols.forEach(symbol => {
          if (state.loading[symbol] !== false) {
            state.loading[symbol] = false;
          }
        });
      })
      .addCase(fetchBatchHistoricalData.rejected, (state, action) => {
        const symbols = action.meta.arg.symbols;
        symbols.forEach(symbol => {
          state.loading[symbol] = false;
          state.errors[symbol] = action.error.message || 'Failed to fetch batch historical data';
        });
      });
  },
});

export const { clearCache, clearSymbolCache, clearExpiredCache, clearOngoingRequests } = historicalDataSlice.actions;
export default historicalDataSlice.reducer;