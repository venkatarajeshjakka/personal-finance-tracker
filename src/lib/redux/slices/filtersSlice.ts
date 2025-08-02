import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { FiltersState } from '@/types';

const initialState: FiltersState = {
  sortBy: 'sales',
  sortOrder: 'desc',
  quarterFilter: 'Q4',
  yearFilter: new Date().getFullYear(),
  searchTerm: ''
};

const filtersSlice = createSlice({
  name: 'filters',
  initialState,
  reducers: {
    setSortBy: (state, action: PayloadAction<'sales' | 'EBIDT' | 'net_profit' | 'EPS'>) => {
      state.sortBy = action.payload;
    },
    setSortOrder: (state, action: PayloadAction<'asc' | 'desc'>) => {
      state.sortOrder = action.payload;
    },
    toggleSortOrder: (state) => {
      state.sortOrder = state.sortOrder === 'asc' ? 'desc' : 'asc';
    },
    setQuarterFilter: (state, action: PayloadAction<string>) => {
      state.quarterFilter = action.payload;
    },
    setYearFilter: (state, action: PayloadAction<number>) => {
      state.yearFilter = action.payload;
    },
    setSearchTerm: (state, action: PayloadAction<string>) => {
      state.searchTerm = action.payload;
    },
    clearSearchTerm: (state) => {
      state.searchTerm = '';
    },
    resetFilters: (state) => {
      state.sortBy = 'sales';
      state.sortOrder = 'desc';
      state.quarterFilter = 'Q4';
      state.yearFilter = new Date().getFullYear();
      state.searchTerm = '';
    },
    setSortCriteria: (state, action: PayloadAction<{ 
      sortBy: 'sales' | 'EBIDT' | 'net_profit' | 'EPS'; 
      sortOrder: 'asc' | 'desc' 
    }>) => {
      state.sortBy = action.payload.sortBy;
      state.sortOrder = action.payload.sortOrder;
    },
    setTimeFilter: (state, action: PayloadAction<{ 
      quarter: string; 
      year: number 
    }>) => {
      state.quarterFilter = action.payload.quarter;
      state.yearFilter = action.payload.year;
    }
  }
});

export const {
  setSortBy,
  setSortOrder,
  toggleSortOrder,
  setQuarterFilter,
  setYearFilter,
  setSearchTerm,
  clearSearchTerm,
  resetFilters,
  setSortCriteria,
  setTimeFilter
} = filtersSlice.actions;

export default filtersSlice.reducer;