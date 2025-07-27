import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { MarketCapThresholds, DEFAULT_MARKET_CAP_THRESHOLDS } from '@/lib/utils/quarterUtils';

export interface PriceUpdateSettings {
  refreshInterval: number; // in milliseconds
  marketHoursOnly: boolean;
  checkMarketHolidays: boolean;
  autoRefreshEnabled: boolean;
}

export const DEFAULT_PRICE_UPDATE_SETTINGS: PriceUpdateSettings = {
  refreshInterval: 3600000, // 1 hour in milliseconds
  marketHoursOnly: true,
  checkMarketHolidays: true,
  autoRefreshEnabled: true
};

interface SettingsState {
  marketCapThresholds: MarketCapThresholds;
  priceUpdateSettings: PriceUpdateSettings;
  loading: boolean;
  error: string | null;
}

const initialState: SettingsState = {
  marketCapThresholds: DEFAULT_MARKET_CAP_THRESHOLDS,
  priceUpdateSettings: DEFAULT_PRICE_UPDATE_SETTINGS,
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

// Price Update Settings Async Thunks
export const loadPriceUpdateSettings = createAsyncThunk(
  'settings/loadPriceUpdateSettings',
  async () => {
    if (typeof window === 'undefined') {
      return DEFAULT_PRICE_UPDATE_SETTINGS;
    }
    
    try {
      const saved = localStorage.getItem('priceUpdateSettings');
      if (saved) {
        return JSON.parse(saved) as PriceUpdateSettings;
      }
    } catch (error) {
      console.error('Failed to load price update settings:', error);
    }
    
    return DEFAULT_PRICE_UPDATE_SETTINGS;
  }
);

export const savePriceUpdateSettings = createAsyncThunk(
  'settings/savePriceUpdateSettings',
  async (settings: PriceUpdateSettings, { rejectWithValue }) => {
    try {
      // Validate settings
      if (settings.refreshInterval < 60000) { // Minimum 1 minute
        throw new Error('Refresh interval must be at least 1 minute');
      }

      // Simulate a brief delay for better UX
      await new Promise(resolve => setTimeout(resolve, 200));

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('priceUpdateSettings', JSON.stringify(settings));
        
        // Trigger a custom event to notify other components
        window.dispatchEvent(new CustomEvent('priceUpdateSettingsChanged', { 
          detail: settings 
        }));
      }

      return settings;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save price update settings');
    }
  }
);

export const resetPriceUpdateSettings = createAsyncThunk(
  'settings/resetPriceUpdateSettings',
  async () => {
    // Save defaults to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('priceUpdateSettings', JSON.stringify(DEFAULT_PRICE_UPDATE_SETTINGS));
      
      // Trigger a custom event to notify other components
      window.dispatchEvent(new CustomEvent('priceUpdateSettingsChanged', { 
        detail: DEFAULT_PRICE_UPDATE_SETTINGS 
      }));
    }

    return DEFAULT_PRICE_UPDATE_SETTINGS;
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
    updatePriceUpdateSettings: (state, action: PayloadAction<Partial<PriceUpdateSettings>>) => {
      state.priceUpdateSettings = { ...state.priceUpdateSettings, ...action.payload };
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
      })
      
      // Load price update settings
      .addCase(loadPriceUpdateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPriceUpdateSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.priceUpdateSettings = action.payload;
        state.error = null;
      })
      .addCase(loadPriceUpdateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load price update settings';
      })
      
      // Save price update settings
      .addCase(savePriceUpdateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(savePriceUpdateSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.priceUpdateSettings = action.payload;
        state.error = null;
      })
      .addCase(savePriceUpdateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      
      // Reset price update settings
      .addCase(resetPriceUpdateSettings.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(resetPriceUpdateSettings.fulfilled, (state, action) => {
        state.loading = false;
        state.priceUpdateSettings = action.payload;
        state.error = null;
      })
      .addCase(resetPriceUpdateSettings.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to reset price update settings';
      });
  }
});

export const { updateMarketCapThresholds, updatePriceUpdateSettings, clearError } = settingsSlice.actions;
export default settingsSlice.reducer;