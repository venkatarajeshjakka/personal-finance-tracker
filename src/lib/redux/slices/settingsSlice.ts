import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MarketCapThresholds, DEFAULT_MARKET_CAP_THRESHOLDS } from '@/lib/utils/quarterUtils';

interface SettingsState {
  marketCapThresholds: MarketCapThresholds;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  marketCapThresholds: DEFAULT_MARKET_CAP_THRESHOLDS,
  loading: false,
  error: null
};

// Async thunks
export const loadMarketCapThresholds = createAsyncThunk(
  'settings/loadMarketCapThresholds',
  async () => {
    if (typeof window === 'undefined') {
      return DEFAULT_MARKET_CAP_THRESHOLDS;
    }
    
    try {
      const saved = localStorage.getItem('marketCapThresholds');
      if (saved) {
        return JSON.parse(saved) as MarketCapThresholds;
      }
    } catch (error) {
      console.error('Failed to load market cap thresholds:', error);
    }
    
    return DEFAULT_MARKET_CAP_THRESHOLDS;
  }
);

export const saveMarketCapThresholds = createAsyncThunk(
  'settings/saveMarketCapThresholds',
  async (thresholds: MarketCapThresholds, { rejectWithValue }) => {
    try {
      // Validate thresholds
      if (thresholds.smallCap <= thresholds.microCap) {
        throw new Error('Small Cap threshold must be greater than Micro Cap');
      }
      if (thresholds.midCap <= thresholds.smallCap) {
        throw new Error('Mid Cap threshold must be greater than Small Cap');
      }
      if (thresholds.largeCap <= thresholds.midCap) {
        throw new Error('Large Cap threshold must be greater than Mid Cap');
      }

      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 500));

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('marketCapThresholds', JSON.stringify(thresholds));
        
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('marketCapThresholdsChanged', { 
          detail: thresholds 
        }));
      }

      return thresholds;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save settings');
    }
  }
);

export const resetMarketCapThresholds = createAsyncThunk(
  'settings/resetMarketCapThresholds',
  async () => {
    // Save defaults to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('marketCapThresholds', JSON.stringify(DEFAULT_MARKET_CAP_THRESHOLDS));
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('marketCapThresholdsChanged', { 
        detail: DEFAULT_MARKET_CAP_THRESHOLDS 
      }));
    }

    return DEFAULT_MARKET_CAP_THRESHOLDS;
  }
);

const settingsSlice = createSlice({
  name: 'settings',
  initialState,
  reducers: {
    updateMarketCapThresholds: (state, action: PayloadAction<MarketCapThresholds>) => {
      state.marketCapThresholds = action.payload;
      state.error = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    builder
      // Load thresholds
      .addCase(loadMarketCapThresholds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadMarketCapThresholds.fulfilled, (state, action) => {
        state.loading = false;
        state.marketCapThresholds = action.payload;
        state.error = null;
      })
      .addCase(loadMarketCapThresholds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load settings';
      })
      
      // Save thresholds
      .addCase(saveMarketCapThresholds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveMarketCapThresholds.fulfilled, (state, action) => {
        state.loading = false;
        state.marketCapThresholds = action.payload;
        state.error = null;
      })
      .addCase(saveMarketCapThresholds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Reset thresholds
      .addCase(resetMarketCapThresholds.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetMarketCapThresholds.fulfilled, (state, action) => {
        state.loading = false;
        state.marketCapThresholds = action.payload;
        state.error = null;
      })
      .addCase(resetMarketCapThresholds.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to reset settings';
      });
  }
});

export const { updateMarketCapThresholds, clearError } = settingsSlice.actions;
export default settingsSlice.reducer;