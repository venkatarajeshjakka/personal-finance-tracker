// localStorage keys
export const STORAGE_KEYS = {
  COMPANIES: 'finance_tracker_companies',
  PORTFOLIOS: 'finance_tracker_portfolios',
  WATCHLISTS: 'finance_tracker_watchlists',
  NSE_COMPANIES: 'finance_tracker_nse_companies',
  USER_PREFERENCES: 'finance_tracker_preferences'
} as const;

// Default values
export const DEFAULT_PREFERENCES = {
  defaultQuarter: 'Q4',
  defaultYear: new Date().getFullYear(),
  theme: 'light' as const,
  currency: 'USD'
};