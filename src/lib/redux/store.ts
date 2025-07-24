import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/types';

// Placeholder reducers - will be implemented in subsequent tasks
const companiesSlice = {
  name: 'companies',
  initialState: {
    data: [],
    loading: false,
    error: null,
    selectedQuarter: 'Q4',
    selectedYear: new Date().getFullYear()
  },
  reducers: {}
};

const portfoliosSlice = {
  name: 'portfolios',
  initialState: {
    data: [],
    loading: false,
    error: null,
    selectedPortfolio: null
  },
  reducers: {}
};

const watchlistsSlice = {
  name: 'watchlists',
  initialState: {
    data: [],
    loading: false,
    error: null,
    selectedWatchlist: null
  },
  reducers: {}
};

const filtersSlice = {
  name: 'filters',
  initialState: {
    sortBy: 'sales' as const,
    sortOrder: 'desc' as const,
    quarterFilter: 'Q4',
    yearFilter: new Date().getFullYear(),
    searchTerm: ''
  },
  reducers: {}
};

const uiSlice = {
  name: 'ui',
  initialState: {
    sidebarOpen: true,
    theme: 'light' as const,
    notifications: []
  },
  reducers: {}
};

export const store = configureStore({
  reducer: {
    companies: () => companiesSlice.initialState,
    portfolios: () => portfoliosSlice.initialState,
    watchlists: () => watchlistsSlice.initialState,
    filters: () => filtersSlice.initialState,
    ui: () => uiSlice.initialState,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ['persist/PERSIST'],
      },
    }),
});

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;