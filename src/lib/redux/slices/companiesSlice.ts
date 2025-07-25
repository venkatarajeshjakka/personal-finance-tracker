import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { CompanyFinancials, CompaniesState } from '@/types';
import { StorageService } from '@/lib/storage';

// Async thunks for company operations
export const loadCompanies = createAsyncThunk(
  'companies/loadCompanies',
  async () => {
    const companies = StorageService.getAllCompanies();
    // Ensure dates are properly handled
    return companies.map(company => ({
      ...company,
      createdAt: typeof company.createdAt === 'string' ? new Date(company.createdAt) : company.createdAt,
      updatedAt: typeof company.updatedAt === 'string' ? new Date(company.updatedAt) : company.updatedAt
    }));
  }
);

export const saveCompany = createAsyncThunk(
  'companies/saveCompany',
  async (company: CompanyFinancials) => {
    const companyToSave = {
      ...company,
      updatedAt: new Date()
    };
    StorageService.saveCompany(companyToSave);
    return companyToSave;
  }
);

export const deleteCompany = createAsyncThunk(
  'companies/deleteCompany',
  async (id: string) => {
    StorageService.deleteCompany(id);
    return id;
  }
);

export const bulkDeleteCompanies = createAsyncThunk(
  'companies/bulkDeleteCompanies',
  async (ids: string[]) => {
    for (const id of ids) {
      StorageService.deleteCompany(id);
    }
    return ids;
  }
);

export const updateCompany = createAsyncThunk(
  'companies/updateCompany',
  async (company: CompanyFinancials) => {
    const updatedCompany = {
      ...company,
      updatedAt: new Date()
    };
    StorageService.saveCompany(updatedCompany);
    return updatedCompany;
  }
);

export const detectDuplicateCompanies = createAsyncThunk(
  'companies/detectDuplicateCompanies',
  async (_, { getState }) => {
    const state = getState() as { companies: CompaniesState };
    const companies = state.companies.data;
    
    const duplicates: { [key: string]: CompanyFinancials[] } = {};
    
    // Group companies by normalized name
    companies.forEach(company => {
      const normalizedName = company.company.toLowerCase().trim().replace(/\s+/g, ' ');
      if (!duplicates[normalizedName]) {
        duplicates[normalizedName] = [];
      }
      duplicates[normalizedName].push(company);
    });
    
    // Filter out groups with only one company
    const actualDuplicates: { [key: string]: CompanyFinancials[] } = {};
    Object.entries(duplicates).forEach(([name, companies]) => {
      if (companies.length > 1) {
        actualDuplicates[name] = companies;
      }
    });
    
    return actualDuplicates;
  }
);

export const mergeCompanies = createAsyncThunk(
  'companies/mergeCompanies',
  async ({ primaryId, duplicateIds }: { primaryId: string; duplicateIds: string[] }) => {
    // Delete duplicate companies
    for (const id of duplicateIds) {
      StorageService.deleteCompany(id);
    }
    return { primaryId, duplicateIds };
  }
);

export const importCompanyData = createAsyncThunk(
  'companies/importCompanyData',
  async (company: CompanyFinancials, { rejectWithValue }) => {
    try {
      const companyToSave = {
        ...company,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      StorageService.saveCompany(companyToSave);
      return companyToSave;
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to import company');
    }
  }
);

const initialState: CompaniesState = {
  data: [],
  loading: false,
  error: null,
  selectedQuarter: 'Q4',
  selectedYear: new Date().getFullYear(),
  duplicates: {}
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
    },
    clearDuplicates: (state) => {
      state.duplicates = {};
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
        const company = action.payload;
        const existingIndex = state.data.findIndex(c => c.id === company.id);
        
        if (existingIndex !== -1) {
          // Update existing company
          state.data[existingIndex] = company;
        } else {
          // Add new company
          state.data.push(company);
        }
      })
      .addCase(importCompanyData.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to import company data';
      })
      // Bulk delete companies
      .addCase(bulkDeleteCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkDeleteCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter(c => !action.payload.includes(c.id));
      })
      .addCase(bulkDeleteCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete companies';
      })
      // Update company
      .addCase(updateCompany.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateCompany.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(c => c.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(updateCompany.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update company';
      })
      // Detect duplicates
      .addCase(detectDuplicateCompanies.fulfilled, (state, action) => {
        state.duplicates = action.payload;
      })
      // Merge companies
      .addCase(mergeCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(mergeCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter(c => !action.payload.duplicateIds.includes(c.id));
      })
      .addCase(mergeCompanies.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to merge companies';
      });
  }
});

export const { 
  setSelectedQuarter, 
  setSelectedYear, 
  clearError, 
  updateCompanyInState,
  clearDuplicates
} = companiesSlice.actions;

export default companiesSlice.reducer;