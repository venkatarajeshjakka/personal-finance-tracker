import { configureStore } from '@reduxjs/toolkit';
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux';
import type { RootState } from '@/types';

// Import reducers
import {
  companiesReducer,
  portfoliosReducer,
  watchlistsReducer,
  filtersReducer,
  uiReducer
} from './slices';

// Import API
import { financeApi } from './api/financeApi';

// Import middleware
import {
  localStorageMiddleware,
  debouncedLocalStorageMiddleware,
  initializeFromLocalStorage
} from './middleware/localStorageMiddleware';

export const store = configureStore({
  reducer: {
    companies: companiesReducer,
    portfolios: portfoliosReducer,
    watchlists: watchlistsReducer,
    filters: filtersReducer,
    ui: uiReducer,
    [financeApi.reducerPath]: financeApi.reducer,
  },
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: [
          'persist/PERSIST',
          'persist/REHYDRATE',
          // Ignore RTK Query actions
          'financeApi/executeQuery/pending',
          'financeApi/executeQuery/fulfilled',
          'financeApi/executeQuery/rejected',
          'financeApi/executeMutation/pending',
          'financeApi/executeMutation/fulfilled',
          'financeApi/executeMutation/rejected',
        ],
        ignoredActionsPaths: ['meta.arg', 'payload.timestamp'],
        ignoredPaths: ['items.dates'],
      },
    })
      .concat(financeApi.middleware)
      .concat(localStorageMiddleware)
      .concat(debouncedLocalStorageMiddleware),
});

// Initialize state from localStorage after store creation
if (typeof window !== 'undefined') {
  initializeFromLocalStorage(store);
}

export type AppDispatch = typeof store.dispatch;
export const useAppDispatch = () => useDispatch<AppDispatch>();
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;