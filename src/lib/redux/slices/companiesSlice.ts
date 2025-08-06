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
  async (id: string, { getState, rejectWithValue }) => {
    try {
      const state = getState() as { companies: CompaniesState };
      const company = state.companies.data.find(c => c.id === id);
      const companyName = company?.company || 'Unknown Company';

      StorageService.deleteCompany(id);

      return { id, companyName };
    } catch (error) {
      console.error('Error deleting company:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete company';
      return rejectWithValue(errorMessage);
    }
  }
);

export const bulkDeleteCompanies = createAsyncThunk(
  'companies/bulkDeleteCompanies',
  async (ids: string[], { getState, rejectWithValue }) => {
    try {
      const state = getState() as { companies: CompaniesState };
      const companies = state.companies.data.filter(c => ids.includes(c.id));
      const companyNames = companies.map(c => c.company);

      let deletedCount = 0;
      const deletedCompanies: string[] = [];

      for (const id of ids) {
        try {
          StorageService.deleteCompany(id);
          deletedCount++;
          const company = companies.find(c => c.id === id);
          if (company) {
            deletedCompanies.push(company.company);
          }
        } catch (error) {
          console.error(`Failed to delete company with id ${id}:`, error);
        }
      }

      return { ids, deletedCount, deletedCompanies, totalRequested: ids.length };
    } catch (error) {
      console.error('Error in bulk delete:', error);
      const errorMessage = error instanceof Error ? error.message : 'Failed to delete companies';
      return rejectWithValue(errorMessage);
    }
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
      const normalizedName = (company.company || '').toLowerCase().trim().replace(/\s+/g, ' ');
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

export const importCompanyDataFromJSON = createAsyncThunk(
  'companies/importCompanyDataFromJSON',
  async (jsonData: string, { rejectWithValue }) => {
    try {
      const result = await StorageService.importCompanyData(jsonData);
      if (!result.isValid) {
        return rejectWithValue(result.errors.join(', '));
      }
      return result.data || [];
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to import company data from JSON');
    }
  }
);

export const importCompaniesWithProcessing = createAsyncThunk(
  'companies/importCompaniesWithProcessing',
  async (
    { companies, options }: {
      companies: CompanyFinancials[];
      options?: { showNotifications?: boolean; autoCorrect?: boolean }
    },
    { rejectWithValue }
  ) => {
    try {
      const { ImportProcessor } = await import('@/lib/utils/import-processor');

      // Process companies with NSE name correction and symbol addition
      const result = await ImportProcessor.processCompanyImport(companies, options);

      // Save all processed companies
      for (const company of result.processedCompanies) {
        const companyToSave = {
          ...company,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        StorageService.saveCompany(companyToSave);
      }

      return {
        companies: result.processedCompanies,
        corrections: result.corrections,
        warnings: result.warnings,
        errors: result.errors
      };
    } catch (error) {
      return rejectWithValue(error instanceof Error ? error.message : 'Failed to import companies with processing');
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
        state.data = state.data.filter(c => c.id !== action.payload.id);
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
      // Import company data from JSON
      .addCase(importCompanyDataFromJSON.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(importCompanyDataFromJSON.fulfilled, (state, action) => {
        state.loading = false;
        const companies = action.payload;
        
        // Add or update companies in state
        companies.forEach(company => {
          const existingIndex = state.data.findIndex(c => c.id === company.id);
          if (existingIndex !== -1) {
            state.data[existingIndex] = company;
          } else {
            state.data.push(company);
          }
        });
      })
      .addCase(importCompanyDataFromJSON.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to import company data from JSON';
      })
      // Bulk delete companies
      .addCase(bulkDeleteCompanies.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(bulkDeleteCompanies.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter(c => !action.payload.ids.includes(c.id));
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
      })
      // Import companies with processing
      .addCase(importCompaniesWithProcessing.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(importCompaniesWithProcessing.fulfilled, (state, action) => {
        state.loading = false;
        const { companies } = action.payload;

        // Add or update companies in state
        companies.forEach(company => {
          const existingIndex = state.data.findIndex(c => c.id === company.id);
          if (existingIndex !== -1) {
            state.data[existingIndex] = company;
          } else {
            state.data.push(company);
          }
        });
      })
      .addCase(importCompaniesWithProcessing.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string || 'Failed to import companies with processing';
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

// Selectors
export const selectCompanyBySymbol = (state: { companies: CompaniesState }, symbol: string) =>
  state.companies.data.find(company => company.symbol === symbol);

export const selectAllCompanies = (state: { companies: CompaniesState }) =>
  state.companies.data;

export const selectCompaniesLoading = (state: { companies: CompaniesState }) =>
  state.companies.loading;

export const selectCompaniesError = (state: { companies: CompaniesState }) =>
  state.companies.error;

export default companiesSlice.reducer;