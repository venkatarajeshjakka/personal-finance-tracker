import { Middleware } from '@reduxjs/toolkit';
import { RootState } from '@/types';
import { StorageService } from '@/lib/storage';
import {
  setTheme,
  addNotification,
  setSelectedQuarter as setCompaniesSelectedQuarter,
  setSelectedYear as setCompaniesSelectedYear,
  setQuarterFilter,
  setYearFilter,
  loadCompanies,
  loadPortfolios,
  loadWatchlists,
  loadNSECompanies
} from '../slices';

// Actions that should trigger localStorage sync
const SYNC_ACTIONS = [
  // Company actions
  'companies/saveCompany/fulfilled',
  'companies/deleteCompany/fulfilled',
  'companies/importCompanyData/fulfilled',
  'companies/importCompanyDataFromJSON/fulfilled',
  'companies/updateCompanyInState',

  // Portfolio actions
  'portfolios/savePortfolio/fulfilled',
  'portfolios/deletePortfolio/fulfilled',
  'portfolios/addTransaction/fulfilled',
  'portfolios/updatePortfolioInState',

  // Watchlist actions
  'watchlists/saveWatchlist/fulfilled',
  'watchlists/deleteWatchlist/fulfilled',
  'watchlists/addStockToWatchlist/fulfilled',
  'watchlists/removeStockFromWatchlist/fulfilled',
  'watchlists/updateStockPrices/fulfilled',
  'watchlists/updateWatchlistInState',

  // NSE Companies actions
  'nseCompanies/uploadCSV/fulfilled',
  'nseCompanies/clearNSECompanies/fulfilled',

  // UI preferences that should be persisted
  'ui/setTheme',
];

// Actions that should trigger user preferences sync
const PREFERENCES_SYNC_ACTIONS = [
  'ui/setTheme',
  'companies/setSelectedQuarter',
  'companies/setSelectedYear',
  'filters/setQuarterFilter',
  'filters/setYearFilter',
];

export const localStorageMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const result = next(action);

  // Skip if we're in SSR environment
  if (typeof window === 'undefined') {
    return result;
  }

  const state = store.getState();

  try {
    // Sync user preferences for specific actions
    if (typeof action === 'object' && action !== null && 'type' in action &&
      PREFERENCES_SYNC_ACTIONS.some(actionType => action.type === actionType)) {
      const preferences = {
        defaultQuarter: state.companies.selectedQuarter || state.filters.quarterFilter,
        defaultYear: state.companies.selectedYear || state.filters.yearFilter,
        theme: state.ui.theme,
        currency: 'USD' // Default for now, can be made configurable later
      };

      StorageService.saveUserPreferences(preferences);
    }

    // For data sync actions, the actual localStorage operations are handled
    // by the async thunks in the slices, so we don't need to duplicate them here.
    // This middleware is mainly for preference syncing and any additional
    // cross-cutting concerns.

    // Log sync actions in development
    if (process.env.NODE_ENV === 'development' && typeof action === 'object' && action !== null && 'type' in action &&
      SYNC_ACTIONS.some(actionType => action.type === actionType)) {
      console.log(`[LocalStorage Sync] Action: ${action.type}`);
    }

  } catch (error) {
    console.error('LocalStorage sync error:', error);

    // Dispatch a notification about the sync error
    store.dispatch(addNotification({
      type: 'error',
      title: 'Storage Error',
      message: 'Failed to save data to local storage. Your changes may not persist.'
    }));
  }

  return result;
};

// Function to initialize state from localStorage
export const initializeFromLocalStorage = (store: any) => {
  if (typeof window === 'undefined') return;

  try {
    // Load user preferences and apply them to the store
    const preferences = StorageService.getUserPreferences();

    // Apply theme preference
    if (preferences.theme) {
      store.dispatch(setTheme(preferences.theme));
    }

    // Apply default quarter and year
    if (preferences.defaultQuarter) {
      store.dispatch(setCompaniesSelectedQuarter(preferences.defaultQuarter));
      store.dispatch(setQuarterFilter(preferences.defaultQuarter));
    }

    if (preferences.defaultYear) {
      store.dispatch(setCompaniesSelectedYear(preferences.defaultYear));
      store.dispatch(setYearFilter(preferences.defaultYear));
    }

    // Load data from localStorage
    store.dispatch(loadCompanies());
    store.dispatch(loadPortfolios());
    store.dispatch(loadWatchlists());
    store.dispatch(loadNSECompanies());

  } catch (error) {
    console.error('Failed to load initial state from localStorage:', error);

    store.dispatch(addNotification({
      type: 'warning',
      title: 'Data Loading Warning',
      message: 'Some saved data could not be loaded. Starting with default settings.'
    }));
  }
};

// Debounced localStorage sync for high-frequency actions
let syncTimeout: NodeJS.Timeout | null = null;

export const debouncedLocalStorageMiddleware: Middleware<{}, RootState> = (store) => (next) => (action) => {
  const result = next(action);

  // Skip if we're in SSR environment
  if (typeof window === 'undefined') {
    return result;
  }

  // Debounce sync for filter actions that might fire rapidly
  const DEBOUNCED_ACTIONS = [
    'filters/setSearchTerm',
    'filters/setSortBy',
    'filters/setSortOrder',
  ];

  if (typeof action === 'object' && action !== null && 'type' in action &&
    DEBOUNCED_ACTIONS.some(actionType => action.type === actionType)) {
    if (syncTimeout) {
      clearTimeout(syncTimeout);
    }

    syncTimeout = setTimeout(() => {
      try {
        const state = store.getState();
        const preferences = {
          defaultQuarter: state.filters.quarterFilter,
          defaultYear: state.filters.yearFilter,
          theme: state.ui.theme,
          currency: 'USD'
        };

        StorageService.saveUserPreferences(preferences);
      } catch (error) {
        console.error('Debounced localStorage sync error:', error);
      }
    }, 500); // 500ms debounce
  }

  return result;
};