import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CompanyFinancials, CompaniesState, ValidationResult } from '@/types';
import { StorageService } from '@/lib/storage';

// Async thunks for company operations
export const loadCompanies = createAsyncThunk(
  'companies/loadCompanies',
  async () => {
    return StorageService.getAllCompanies();
  }
);

export const saveCompany = createAsyncThunk(
  'companies/saveCompany',
  async (company: CompanyFinancials) => {
    StorageService.saveCompany(company);
    return company;
  }
);

export const deleteCompany = createAsyncThunk(
  'companies/deleteCompany',
  async (id: string) => {
    StorageService.deleteCompany(id);
    return id;
  }
);

export const importCompanyData = createAsyncThunk(
  'companies/importCompanyData',
  async (jsonData: string, { rejectWithValue }) => {
    const result = StorageService.importCompanyData(jsonData);
    if (!result.isValid) {
      return rejectWithValue(result.errors.join(', '));
    }
    return result.data!;
  }
);

const initialState: CompaniesState = {
  data: [],
  loading: false,
  error: null,
  selectedQuarter: 'Q4',
  selectedYear: new Date().getFullYear()
};

const companiesSlice = createSlice({
  name: 'companies',
  initialState,
  reducers: {
    setSelectedQuarter: (state, action: PayloadAction<string>) => {
      state.selectedQuarter = action.payload;
    },
    setSelectedYear: (state, action: PayloadAction<number>) => {
      state.selectedYear = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateCompanyInState: (state, action: PayloadAction<CompanyFinancials>) => {
      const index = state.data.findIndex(c => c.id === action.payload.id);
      if (index !== -1) {
        state.data[index] = action.payload;
      } else {
        state.data.push(action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Load companies
      .addCase(loadCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(loadCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load companies';
      })
      // Save company
      .addCase(saveCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveCompany.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        } else {
          state.data.push(action.payload);
        }
      })
      .addCase(saveCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save company';
      })
      // Delete company
      .addCase(deleteCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteCompany.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter(c => c.id !== action.payload);
      })
      .addCase(deleteCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete company';
      })
      // Import company data
      .addCase(importCompanyData.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(importCompanyData.fulfilled, (state, action) => {
        state.loading = false;
        // Merge imported companies with existing ones
        const existingIds = new Set(state.data.map(c => c.id));
        const newCompanies = action.payload.filter(c => !existingIds.has(c.id));
        const updatedCompanies = action.payload.filter(c => existingIds.has(c.id));
        
        // Update existing companies
        updatedCompanies.forEach(updatedCompany => {
          const index = state.data.findIndex(c => c.id === updatedCompany.id);
          if (index !== -1) {
            state.data[index] = updatedCompany;
          }
        });
        
        // Add new companies
        state.data.push(...newCompanies);
      })
      .addCase(importCompanyData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to import company data';
      });
  }
});

export const { 
  setSelectedQuarter, 
  setSelectedYear, 
  clearError, 
  updateCompanyInState 
} = companiesSlice.actions;

export default companiesSlice.reducer;