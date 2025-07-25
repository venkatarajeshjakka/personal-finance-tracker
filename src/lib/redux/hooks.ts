import { useCallback } from 'react';
import { useAppDispatch, useAppSelector } from './store';

// Re-export the hooks for easier importing
export { useAppDispatch, useAppSelector };
import {
  loadCompanies,
  saveCompany,
  deleteCompany,
  importCompanyData,
  setSelectedQuarter,
  setSelectedYear,
  loadPortfolios,
  savePortfolio,
  deletePortfolio,
  addTransaction,
  setSelectedPortfolio,
  loadWatchlists,
  saveWatchlist,
  deleteWatchlist,
  addSymbolToWatchlist,
  removeSymbolFromWatchlist,
  setSelectedWatchlist,
  setSortBy,
  setSortOrder,
  setQuarterFilter,
  setYearFilter,
  setSearchTerm,
  resetFilters,
  toggleSidebar,
  setTheme,
  addNotification,
  markNotificationAsRead,
  clearNotifications
} from './slices';
import {
  selectAllCompanies,
  selectFilteredAndSortedCompanies,
  selectCompaniesLoading,
  selectAllPortfolios,
  selectSelectedPortfolio,
  selectPortfoliosLoading,
  selectAllWatchlists,
  selectSelectedWatchlist,
  selectWatchlistsLoading,
  selectCurrentFilters,
  selectSidebarOpen,
  selectTheme,
  selectUnreadNotificationCount,
  selectDashboardData
} from './selectors';
import type { CompanyFinancials, Portfolio, Watchlist, Transaction } from '@/types';

// Companies hooks
export const useCompanies = () => {
  const dispatch = useAppDispatch();
  const companies = useAppSelector(selectAllCompanies);
  const filteredCompanies = useAppSelector(selectFilteredAndSortedCompanies);
  const loading = useAppSelector(selectCompaniesLoading);
  const selectedQuarter = useAppSelector(state => state.companies.selectedQuarter);
  const selectedYear = useAppSelector(state => state.companies.selectedYear);

  const actions = {
    loadCompanies: useCallback(() => dispatch(loadCompanies()), [dispatch]),
    saveCompany: useCallback((company: CompanyFinancials) => dispatch(saveCompany(company)), [dispatch]),
    deleteCompany: useCallback((id: string) => dispatch(deleteCompany(id)), [dispatch]),
    importCompanyData: useCallback((jsonData: string) => dispatch(importCompanyData(jsonData)), [dispatch]),
    setSelectedQuarter: useCallback((quarter: string) => dispatch(setSelectedQuarter(quarter)), [dispatch]),
    setSelectedYear: useCallback((year: number) => dispatch(setSelectedYear(year)), [dispatch]),
  };

  return {
    companies,
    filteredCompanies,
    loading,
    selectedQuarter,
    selectedYear,
    ...actions
  };
};

// Portfolios hooks
export const usePortfolios = () => {
  const dispatch = useAppDispatch();
  const portfolios = useAppSelector(selectAllPortfolios);
  const selectedPortfolio = useAppSelector(selectSelectedPortfolio);
  const loading = useAppSelector(selectPortfoliosLoading);

  const actions = {
    loadPortfolios: useCallback(() => dispatch(loadPortfolios()), [dispatch]),
    savePortfolio: useCallback((portfolio: Portfolio) => dispatch(savePortfolio(portfolio)), [dispatch]),
    deletePortfolio: useCallback((id: string) => dispatch(deletePortfolio(id)), [dispatch]),
    addTransaction: useCallback((portfolioId: string, transaction: Transaction) =>
      dispatch(addTransaction({ portfolioId, transaction })), [dispatch]),
    setSelectedPortfolio: useCallback((id: string | null) => dispatch(setSelectedPortfolio(id)), [dispatch]),
  };

  return {
    portfolios,
    selectedPortfolio,
    loading,
    ...actions
  };
};

// Watchlists hooks
export const useWatchlists = () => {
  const dispatch = useAppDispatch();
  const watchlists = useAppSelector(selectAllWatchlists);
  const selectedWatchlist = useAppSelector(selectSelectedWatchlist);
  const loading = useAppSelector(selectWatchlistsLoading);

  const actions = {
    loadWatchlists: useCallback(() => dispatch(loadWatchlists()), [dispatch]),
    saveWatchlist: useCallback((watchlist: Watchlist) => dispatch(saveWatchlist(watchlist)), [dispatch]),
    deleteWatchlist: useCallback((id: string) => dispatch(deleteWatchlist(id)), [dispatch]),
    addSymbolToWatchlist: useCallback((watchlistId: string, symbol: string) =>
      dispatch(addSymbolToWatchlist({ watchlistId, symbol })), [dispatch]),
    removeSymbolFromWatchlist: useCallback((watchlistId: string, symbol: string) =>
      dispatch(removeSymbolFromWatchlist({ watchlistId, symbol })), [dispatch]),
    setSelectedWatchlist: useCallback((id: string | null) => dispatch(setSelectedWatchlist(id)), [dispatch]),
  };

  return {
    watchlists,
    selectedWatchlist,
    loading,
    ...actions
  };
};

// Filters hooks
export const useFilters = () => {
  const dispatch = useAppDispatch();
  const filters = useAppSelector(selectCurrentFilters);

  const actions = {
    setSortBy: useCallback((sortBy: 'sales' | 'EBIDT' | 'net_profit' | 'EPS') =>
      dispatch(setSortBy(sortBy)), [dispatch]),
    setSortOrder: useCallback((sortOrder: 'asc' | 'desc') => dispatch(setSortOrder(sortOrder)), [dispatch]),
    setQuarterFilter: useCallback((quarter: string) => dispatch(setQuarterFilter(quarter)), [dispatch]),
    setYearFilter: useCallback((year: number) => dispatch(setYearFilter(year)), [dispatch]),
    setSearchTerm: useCallback((term: string) => dispatch(setSearchTerm(term)), [dispatch]),
    resetFilters: useCallback(() => dispatch(resetFilters()), [dispatch]),
  };

  return {
    filters,
    ...actions
  };
};

// UI hooks
export const useUI = () => {
  const dispatch = useAppDispatch();
  const sidebarOpen = useAppSelector(selectSidebarOpen);
  const theme = useAppSelector(selectTheme);
  const unreadNotificationCount = useAppSelector(selectUnreadNotificationCount);

  const actions = {
    toggleSidebar: useCallback(() => dispatch(toggleSidebar()), [dispatch]),
    setTheme: useCallback((theme: 'light' | 'dark') => dispatch(setTheme(theme)), [dispatch]),
    addNotification: useCallback((notification: { type: 'success' | 'error' | 'warning' | 'info'; title: string; message: string }) =>
      dispatch(addNotification(notification)), [dispatch]),
    markNotificationAsRead: useCallback((id: string) => dispatch(markNotificationAsRead(id)), [dispatch]),
    clearNotifications: useCallback(() => dispatch(clearNotifications()), [dispatch]),
  };

  return {
    sidebarOpen,
    theme,
    unreadNotificationCount,
    ...actions
  };
};

// Dashboard hook
export const useDashboard = () => {
  const dashboardData = useAppSelector(selectDashboardData);
  return dashboardData;
};