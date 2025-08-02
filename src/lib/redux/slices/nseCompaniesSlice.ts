import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { NSECompany, NSECompaniesState, DuplicateReport, CSVValidationResult } from '@/types';
import { StorageService } from '@/lib/storage';
import { CSVParserService } from '@/lib/utils/csv-parser';
import { CompanyNameMatcher } from '@/lib/utils/company-matcher';

// Initial state
const initialState: NSECompaniesState = {
  data: [],
  loading: false,
  error: null,
  searchTerm: '',
  uploadProgress: 0,
  duplicates: null
};

// Async thunks
export const uploadNSECompaniesCSV = createAsyncThunk(
  'nseCompanies/uploadCSV',
  async (csvContent: string, { rejectWithValue, dispatch }) => {
    try {
      dispatch(setUploadProgress(10));
      
      // Parse CSV
      const companies = await CSVParserService.parseNSECompanyCSV(csvContent);
      dispatch(setUploadProgress(50));
      
      // Detect duplicates
      const duplicateReport = CSVParserService.detectDuplicates(companies);
      dispatch(setDuplicates(duplicateReport));
      dispatch(setUploadProgress(70));
      
      // Remove duplicates
      const uniqueCompanies = CSVParserService.removeDuplicates(companies);
      dispatch(setUploadProgress(90));
      
      // Save to storage
      StorageService.saveNSECompanies(uniqueCompanies);
      dispatch(setUploadProgress(100));
      
      return uniqueCompanies;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to upload CSV');
    }
  }
);

export const loadNSECompanies = createAsyncThunk(
  'nseCompanies/load',
  async (_, { rejectWithValue }) => {
    try {
      const companies = StorageService.getAllNSECompanies();
      return companies;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to load NSE companies');
    }
  }
);

export const searchNSECompanies = createAsyncThunk(
  'nseCompanies/search',
  async (searchTerm: string, { rejectWithValue }) => {
    try {
      const companies = StorageService.searchNSECompanies(searchTerm);
      return { companies, searchTerm };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to search NSE companies');
    }
  }
);

export const clearNSECompanies = createAsyncThunk(
  'nseCompanies/clear',
  async (_, { rejectWithValue }) => {
    try {
      StorageService.clearNSECompanies();
      return [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to clear NSE companies');
    }
  }
);

export const findCompanyMatch = createAsyncThunk(
  'nseCompanies/findMatch',
  async (companyName: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { nseCompanies: NSECompaniesState };
      const nseCompanies = state.nseCompanies.data;
      
      const match = CompanyNameMatcher.findBestMatch(companyName, nseCompanies);
      return match;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to find company match');
    }
  }
);

// Slice
const nseCompaniesSlice = createSlice({
  name: 'nseCompanies',
  initialState,
  reducers: {
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    setUploadProgress: (state, action: PayloadAction<number>) => {
      state.uploadProgress = action.payload;
    },
    resetUploadProgress: (state) => {
      state.uploadProgress = 0;
    },
    setDuplicates: (state, action: PayloadAction<DuplicateReport>) => {
      state.duplicates = action.payload;
    },
    clearDuplicates: (state) => {
      state.duplicates = null;
    },
    clearError: (state) => {
      state.error = null;
    }
  },
  extraReducers: (builder) => {
    // Upload CSV
    builder
      .addCase(uploadNSECompaniesCSV.pending, (state) => {
        state.loading = true;
        state.error = null;
        state.uploadProgress = 0;
      })
      .addCase(uploadNSECompaniesCSV.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.uploadProgress = 100;
        state.error = null;
      })
      .addCase(uploadNSECompaniesCSV.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
        state.uploadProgress = 0;
      });

    // Load companies
    builder
      .addCase(loadNSECompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadNSECompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
        state.error = null;
      })
      .addCase(loadNSECompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Search companies
    builder
      .addCase(searchNSECompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(searchNSECompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload.companies;
        state.searchTerm = action.payload.searchTerm;
        state.error = null;
      })
      .addCase(searchNSECompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });

    // Clear companies
    builder
      .addCase(clearNSECompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(clearNSECompanies.fulfilled, (state) => {
        state.loading = false;
        state.data = [];
        state.duplicates = null;
        state.searchTerm = '';
        state.error = null;
      })
      .addCase(clearNSECompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  }
});

// Actions
export const {
  setSearchTerm,
  setUploadProgress,
  resetUploadProgress,
  setDuplicates,
  clearDuplicates,
  clearError
} = nseCompaniesSlice.actions;

// Selectors
export const selectNSECompanies = (state: { nseCompanies: NSECompaniesState }) => state.nseCompanies.data;
export const selectNSECompaniesLoading = (state: { nseCompanies: NSECompaniesState }) => state.nseCompanies.loading;
export const selectNSECompaniesError = (state: { nseCompanies: NSECompaniesState }) => state.nseCompanies.error;
export const selectNSECompaniesSearchTerm = (state: { nseCompanies: NSECompaniesState }) => state.nseCompanies.searchTerm;
export const selectNSECompaniesUploadProgress = (state: { nseCompanies: NSECompaniesState }) => state.nseCompanies.uploadProgress;
export const selectNSECompaniesDuplicates = (state: { nseCompanies: NSECompaniesState }) => state.nseCompanies.duplicates;

export default nseCompaniesSlice.reducer;