import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { GeminiAIService } from '@/lib/services/geminiAIService';
import type {
  AIAnalysisState,
  ChartAnalysisRequest,
  ChartAnalysisResponse,
  AIAnalysisError,
  AIAnalysisHistory,
  GeminiAIConfig
} from '@/types/gemini';

// Default configuration
const DEFAULT_CONFIG: Omit<GeminiAIConfig, 'apiKey'> = {
  model: 'gemini-2.0-flash',
  maxTokens: 4000,
  temperature: 0.3
};

// Initial state
const initialState: AIAnalysisState = {
  analyses: {},
  loading: {},
  error: {},
  history: [],
  cache: {},
  config: {
    ...DEFAULT_CONFIG,
    apiKey: ''
  },
  isConfigured: false
};

// Async thunks

/**
 * Load AI configuration from localStorage
 */
export const loadAIConfig = createAsyncThunk(
  'aiAnalysis/loadConfig',
  async () => {
    if (typeof window === 'undefined') {
      return { ...DEFAULT_CONFIG, apiKey: '' };
    }

    try {
      const savedConfig = localStorage.getItem('geminiAIConfig');
      if (savedConfig) {
        const config = JSON.parse(savedConfig) as GeminiAIConfig;

        // Initialize the service if API key is present
        if (config.apiKey) {
          GeminiAIService.initialize(config.apiKey);
        }

        return config;
      }
    } catch (error) {
      console.error('Failed to load AI config:', error);
    }

    return { ...DEFAULT_CONFIG, apiKey: '' };
  }
);

/**
 * Save AI configuration to localStorage
 */
export const saveAIConfig = createAsyncThunk(
  'aiAnalysis/saveConfig',
  async (config: GeminiAIConfig, { rejectWithValue }) => {
    try {
      // Validate API key if provided
      if (config.apiKey) {
        const isValid = await GeminiAIService.validateAPIKey(config.apiKey);
        if (!isValid) {
          throw new Error('Invalid API key');
        }

        // Initialize the service
        GeminiAIService.initialize(config.apiKey);
      }

      // Save to localStorage
      if (typeof window !== 'undefined') {
        localStorage.setItem('geminiAIConfig', JSON.stringify(config));
      }

      return config;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to save AI configuration');
    }
  }
);

/**
 * Validate API key
 */
export const validateAPIKey = createAsyncThunk(
  'aiAnalysis/validateAPIKey',
  async (apiKey: string, { rejectWithValue }) => {
    try {
      const isValid = await GeminiAIService.validateAPIKey(apiKey);
      return { apiKey, isValid };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to validate API key');
    }
  }
);

/**
 * Generate chart analysis
 */
export const generateChartAnalysis = createAsyncThunk(
  'aiAnalysis/generateAnalysis',
  async (request: ChartAnalysisRequest, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { aiAnalysis: AIAnalysisState };

      // Check if API is configured
      if (!state.aiAnalysis.isConfigured || !state.aiAnalysis.config.apiKey) {
        throw new Error('Gemini AI is not configured. Please add your API key in settings.');
      }

      // Generate cache key
      const chartConfigHash = btoa(JSON.stringify({
        symbol: request.symbol,
        timeframe: request.timeframe,
        timestamp: Math.floor(Date.now() / (1000 * 60 * 30)) // 30-minute cache buckets
      }));

      const cacheKey = GeminiAIService.createCacheKey(request.symbol, chartConfigHash);

      // Check cache first
      const cachedAnalysis = state.aiAnalysis.cache[cacheKey];
      if (cachedAnalysis && GeminiAIService.isCacheValid(cachedAnalysis)) {
        return cachedAnalysis.analysis;
      }

      // Generate new analysis
      const analysis = await GeminiAIService.analyzeChart(request);

      return { analysis, cacheKey, chartConfigHash };
    } catch (error) {
      console.error('Chart analysis failed:', error);
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to generate analysis');
    }
  }
);

/**
 * Load analysis history from localStorage
 */
export const loadAnalysisHistory = createAsyncThunk(
  'aiAnalysis/loadHistory',
  async () => {
    if (typeof window === 'undefined') {
      return [];
    }

    try {
      const savedHistory = localStorage.getItem('aiAnalysisHistory');
      if (savedHistory) {
        const history = JSON.parse(savedHistory) as AIAnalysisHistory[];
        // Sort by creation date, newest first
        return history.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
      }
    } catch (error) {
      console.error('Failed to load analysis history:', error);
    }

    return [];
  }
);

/**
 * Save analysis to history
 */
export const saveAnalysisToHistory = createAsyncThunk(
  'aiAnalysis/saveToHistory',
  async (params: { analysis: ChartAnalysisResponse; chartConfig: any }, { getState }) => {
    const { analysis, chartConfig } = params;

    const historyItem: AIAnalysisHistory = {
      id: analysis.id,
      symbol: analysis.symbol,
      analysis,
      chartConfig,
      createdAt: new Date()
    };

    // Get current history
    const state = getState() as { aiAnalysis: AIAnalysisState };
    const currentHistory = [...state.aiAnalysis.history];

    // Add new item to the beginning
    currentHistory.unshift(historyItem);

    // Keep only the last 50 analyses
    const trimmedHistory = currentHistory.slice(0, 50);

    // Save to localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('aiAnalysisHistory', JSON.stringify(trimmedHistory));
    }

    return trimmedHistory;
  }
);

/**
 * Clear analysis history
 */
export const clearAnalysisHistory = createAsyncThunk(
  'aiAnalysis/clearHistory',
  async () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('aiAnalysisHistory');
    }
    return [];
  }
);

// Slice definition
const aiAnalysisSlice = createSlice({
  name: 'aiAnalysis',
  initialState,
  reducers: {
    // Clear analysis for a specific symbol
    clearAnalysis: (state, action: PayloadAction<string>) => {
      const symbol = action.payload;
      delete state.analyses[symbol];
      delete state.loading[symbol];
      delete state.error[symbol];
    },

    // Clear all analyses
    clearAllAnalyses: (state) => {
      state.analyses = {};
      state.loading = {};
      state.error = {};
    },

    // Clear error for a specific symbol
    clearError: (state, action: PayloadAction<string>) => {
      const symbol = action.payload;
      delete state.error[symbol];
    },

    // Clear all errors
    clearAllErrors: (state) => {
      state.error = {};
    },

    // Update configuration without saving
    updateConfig: (state, action: PayloadAction<Partial<GeminiAIConfig>>) => {
      state.config = { ...state.config, ...action.payload };
      state.isConfigured = !!state.config.apiKey;
    },

    // Clear cache
    clearCache: (state) => {
      state.cache = {};
    },

    // Remove expired cache entries
    cleanupCache: (state) => {
      const now = new Date();
      Object.keys(state.cache).forEach(key => {
        const entry = state.cache[key];
        if (!GeminiAIService.isCacheValid(entry)) {
          delete state.cache[key];
        }
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // Load config
      .addCase(loadAIConfig.fulfilled, (state, action) => {
        state.config = action.payload;
        state.isConfigured = !!action.payload.apiKey;
      })

      // Save config
      .addCase(saveAIConfig.pending, (state) => {
        state.loading.config = true;
      })
      .addCase(saveAIConfig.fulfilled, (state, action) => {
        state.loading.config = false;
        state.config = action.payload;
        state.isConfigured = !!action.payload.apiKey;
        delete state.error.config;
      })
      .addCase(saveAIConfig.rejected, (state, action) => {
        state.loading.config = false;
        state.error.config = {
          code: 'API_KEY_INVALID',
          message: action.payload as string,
          retryable: false
        };
      })

      // Validate API key
      .addCase(validateAPIKey.pending, (state) => {
        state.loading.validation = true;
      })
      .addCase(validateAPIKey.fulfilled, (state, action) => {
        state.loading.validation = false;
        if (action.payload.isValid) {
          state.config.apiKey = action.payload.apiKey;
          state.isConfigured = true;
          delete state.error.validation;
        } else {
          state.error.validation = {
            code: 'API_KEY_INVALID',
            message: 'Invalid API key',
            retryable: false
          };
        }
      })
      .addCase(validateAPIKey.rejected, (state, action) => {
        state.loading.validation = false;
        state.error.validation = {
          code: 'API_KEY_INVALID',
          message: action.payload as string,
          retryable: false
        };
      })

      // Generate analysis
      .addCase(generateChartAnalysis.pending, (state, action) => {
        const symbol = action.meta.arg.symbol;
        state.loading[symbol] = true;
        delete state.error[symbol];
      })
      .addCase(generateChartAnalysis.fulfilled, (state, action) => {
        const payload = action.payload;

        if ('analysis' in payload) {
          // New analysis generated
          const { analysis, cacheKey, chartConfigHash } = payload as {
            analysis: ChartAnalysisResponse;
            cacheKey: string;
            chartConfigHash: string;
          };         

          state.analyses[analysis.symbol] = analysis;
          state.loading[analysis.symbol] = false;
          delete state.error[analysis.symbol];

          // Update cache
          state.cache[cacheKey] = {
            analysis,
            expiresAt: new Date(Date.now() + 30 * 60 * 1000), // 30 minutes
            chartConfigHash
          };
        } else {
          // Cached analysis returned
          const analysis = payload as ChartAnalysisResponse;
               
          
          state.analyses[analysis.symbol] = analysis;
          state.loading[analysis.symbol] = false;
          delete state.error[analysis.symbol];
        }
      })
      .addCase(generateChartAnalysis.rejected, (state, action) => {
        const symbol = action.meta.arg.symbol;
        state.loading[symbol] = false;
        state.error[symbol] = {
          code: 'UNKNOWN_ERROR',
          message: action.payload as string,
          retryable: true
        };
      })

      // Load history
      .addCase(loadAnalysisHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })

      // Save to history
      .addCase(saveAnalysisToHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      })

      // Clear history
      .addCase(clearAnalysisHistory.fulfilled, (state, action) => {
        state.history = action.payload;
      });
  }
});

export const {
  clearAnalysis,
  clearAllAnalyses,
  clearError,
  clearAllErrors,
  updateConfig,
  clearCache,
  cleanupCache
} = aiAnalysisSlice.actions;

export default aiAnalysisSlice.reducer;

// Selectors
export const selectAIAnalysis = (state: { aiAnalysis: AIAnalysisState }, symbol: string) =>
  state.aiAnalysis.analyses[symbol];

export const selectAIAnalysisLoading = (state: { aiAnalysis: AIAnalysisState }, symbol: string) =>
  state.aiAnalysis.loading[symbol] || false;

export const selectAIAnalysisError = (state: { aiAnalysis: AIAnalysisState }, symbol: string) =>
  state.aiAnalysis.error[symbol];

export const selectAIConfig = (state: { aiAnalysis: AIAnalysisState }) =>
  state.aiAnalysis.config;

export const selectIsAIConfigured = (state: { aiAnalysis: AIAnalysisState }) =>
  state.aiAnalysis.isConfigured;

export const selectAnalysisHistory = (state: { aiAnalysis: AIAnalysisState }) =>
  state.aiAnalysis.history;

export const selectAnalysisHistoryBySymbol = (state: { aiAnalysis: AIAnalysisState }, symbol: string) =>
  state.aiAnalysis.history.filter(item => item.symbol === symbol);