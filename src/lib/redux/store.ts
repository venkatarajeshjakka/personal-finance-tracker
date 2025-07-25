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
        // Ignore all serializable checks for Date objects
        isSerializable: (value: any) => {
          // Allow Date objects to pass through
          if (value instanceof Date) {
            return true;
          }
          // Use default serializable check for other values
          return typeof value !== 'object' || value === null || Array.isArray(value) || 
                 Object.prototype.toString.call(value) === '[object Object]';
        },
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