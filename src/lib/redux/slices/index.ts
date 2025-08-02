// Export all slice reducers
export { default as companiesReducer } from './companiesSlice';
export { default as portfoliosReducer } from './portfoliosSlice';
export { default as watchlistsReducer } from './watchlistsSlice';
export { default as nseCompaniesReducer } from './nseCompaniesSlice';
export { default as filtersReducer } from './filtersSlice';
export { default as uiReducer } from './uiSlice';
export { default as settingsReducer } from './settingsSlice';

// Export actions with prefixes to avoid naming conflicts
export {
  loadCompanies,
  saveCompany,
  deleteCompany,
  importCompanyData,
  importCompanyDataFromJSON,
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
  addStockToWatchlist,
  removeStockFromWatchlist,
  updateStockPrices,
  setSelectedWatchlist,
  clearError as clearWatchlistsError,
  updateWatchlistInState,
  // Legacy exports for backward compatibility
  addStockToWatchlist as addSymbolToWatchlist,
  removeStockFromWatchlist as removeSymbolFromWatchlist
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
  uploadNSECompaniesCSV,
  loadNSECompanies,
  searchNSECompanies,
  clearNSECompanies,
  findCompanyMatch,
  setSearchTerm as setNSESearchTerm,
  setUploadProgress,
  resetUploadProgress,
  setDuplicates,
  clearDuplicates,
  clearError as clearNSECompaniesError
} from './nseCompaniesSlice';

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

export {
  loadMarketCapThresholds,
  saveMarketCapThresholds,
  resetMarketCapThresholds,
  updateMarketCapThresholds,
  loadPriceUpdateSettings,
  savePriceUpdateSettings,
  resetPriceUpdateSettings,
  updatePriceUpdateSettings,
  clearError as clearSettingsError
} from './settingsSlice';