// Export all slice reducers
export { default as companiesReducer } from './companiesSlice';
export { default as portfoliosReducer } from './portfoliosSlice';
export { default as watchlistsReducer } from './watchlistsSlice';
export { default as filtersReducer } from './filtersSlice';
export { default as uiReducer } from './uiSlice';

// Export actions with prefixes to avoid naming conflicts
export {
  loadCompanies,
  saveCompany,
  deleteCompany,
  importCompanyData,
  setSelectedQuarter,
  setSelectedYear,
  clearError as clearCompaniesError,
  updateCompanyInState
} from './companiesSlice';

export {
  loadPortfolios,
  savePortfolio,
  deletePortfolio,
  addTransaction,
  setSelectedPortfolio,
  clearError as clearPortfoliosError,
  updatePortfolioInState,
  updateHoldingPrices
} from './portfoliosSlice';

export {
  loadWatchlists,
  saveWatchlist,
  deleteWatchlist,
  addSymbolToWatchlist,
  removeSymbolFromWatchlist,
  setSelectedWatchlist,
  clearError as clearWatchlistsError,
  updateWatchlistInState
} from './watchlistsSlice';

export {
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
} from './filtersSlice';

export {
  toggleSidebar,
  setSidebarOpen,
  setTheme,
  toggleTheme,
  addNotification,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  removeNotification,
  clearNotifications,
  clearReadNotifications
} from './uiSlice';