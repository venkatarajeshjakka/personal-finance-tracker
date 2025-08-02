import { createSelector } from '@reduxjs/toolkit';
import { RootState } from '@/types';

// Base selectors
export const selectCompaniesState = (state: RootState) => state.companies;
export const selectPortfoliosState = (state: RootState) => state.portfolios;
export const selectWatchlistsState = (state: RootState) => state.watchlists;
export const selectFiltersState = (state: RootState) => state.filters;
export const selectUIState = (state: RootState) => state.ui;

// Company selectors
export const selectAllCompanies = createSelector(
  [selectCompaniesState],
  (companiesState) => companiesState.data
);

export const selectCompaniesLoading = createSelector(
  [selectCompaniesState],
  (companiesState) => companiesState.loading
);

export const selectCompaniesError = createSelector(
  [selectCompaniesState],
  (companiesState) => companiesState.error
);

export const selectSelectedQuarter = createSelector(
  [selectCompaniesState],
  (companiesState) => companiesState.selectedQuarter
);

export const selectSelectedYear = createSelector(
  [selectCompaniesState],
  (companiesState) => companiesState.selectedYear
);

export const selectCompanyById = createSelector(
  [selectAllCompanies, (state: RootState, id: string) => id],
  (companies, id) => companies.find(company => company.id === id)
);

// Filtered and sorted companies selector
export const selectFilteredAndSortedCompanies = createSelector(
  [selectAllCompanies, selectFiltersState, selectSelectedQuarter, selectSelectedYear],
  (companies, filters, selectedQuarter, selectedYear) => {
    let filtered = companies;

    // Apply search filter
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      filtered = filtered.filter(company =>
        company.company.toLowerCase().includes(searchTerm)
      );
    }

    // Apply quarter/year filter
    const quarterKey = `${selectedYear}-${selectedQuarter}`;
    filtered = filtered.filter(company =>
      company.financials.quarters[quarterKey]
    );

    // Apply sorting
    filtered.sort((a, b) => {
      const aQuarter = a.financials.quarters[quarterKey];
      const bQuarter = b.financials.quarters[quarterKey];

      if (!aQuarter || !bQuarter) return 0;

      let aValue: number;
      let bValue: number;

      switch (filters.sortBy) {
        case 'sales':
          aValue = aQuarter.sales;
          bValue = bQuarter.sales;
          break;
        case 'EBIDT':
          aValue = aQuarter.EBIDT;
          bValue = bQuarter.EBIDT;
          break;
        case 'net_profit':
          aValue = aQuarter.net_profit;
          bValue = bQuarter.net_profit;
          break;
        case 'EPS':
          aValue = parseFloat(aQuarter.EPS);
          bValue = parseFloat(bQuarter.EPS);
          break;
        default:
          return 0;
      }

      if (filters.sortOrder === 'asc') {
        return aValue - bValue;
      } else {
        return bValue - aValue;
      }
    });

    return filtered;
  }
);

// Portfolio selectors
export const selectAllPortfolios = createSelector(
  [selectPortfoliosState],
  (portfoliosState) => portfoliosState.data
);

export const selectPortfoliosLoading = createSelector(
  [selectPortfoliosState],
  (portfoliosState) => portfoliosState.loading
);

export const selectPortfoliosError = createSelector(
  [selectPortfoliosState],
  (portfoliosState) => portfoliosState.error
);

export const selectSelectedPortfolioId = createSelector(
  [selectPortfoliosState],
  (portfoliosState) => portfoliosState.selectedPortfolio
);

export const selectSelectedPortfolio = createSelector(
  [selectAllPortfolios, selectSelectedPortfolioId],
  (portfolios, selectedId) => 
    selectedId ? portfolios.find(p => p.id === selectedId) : null
);

export const selectPortfolioById = createSelector(
  [selectAllPortfolios, (state: RootState, id: string) => id],
  (portfolios, id) => portfolios.find(portfolio => portfolio.id === id)
);

export const selectTotalPortfolioValue = createSelector(
  [selectAllPortfolios],
  (portfolios) => portfolios.reduce((total, portfolio) => total + portfolio.currentValue, 0)
);

export const selectTotalPortfolioReturn = createSelector(
  [selectAllPortfolios],
  (portfolios) => portfolios.reduce((total, portfolio) => total + portfolio.totalReturn, 0)
);

// Watchlist selectors
export const selectAllWatchlists = createSelector(
  [selectWatchlistsState],
  (watchlistsState) => watchlistsState.data
);

export const selectWatchlistsLoading = createSelector(
  [selectWatchlistsState],
  (watchlistsState) => watchlistsState.loading
);

export const selectWatchlistsError = createSelector(
  [selectWatchlistsState],
  (watchlistsState) => watchlistsState.error
);

export const selectSelectedWatchlistId = createSelector(
  [selectWatchlistsState],
  (watchlistsState) => watchlistsState.selectedWatchlist
);

export const selectSelectedWatchlist = createSelector(
  [selectAllWatchlists, selectSelectedWatchlistId],
  (watchlists, selectedId) => 
    selectedId ? watchlists.find(w => w.id === selectedId) : null
);

export const selectWatchlistById = createSelector(
  [selectAllWatchlists, (state: RootState, id: string) => id],
  (watchlists, id) => watchlists.find(watchlist => watchlist.id === id)
);

// UI selectors
export const selectSidebarOpen = createSelector(
  [selectUIState],
  (uiState) => uiState.sidebarOpen
);

export const selectTheme = createSelector(
  [selectUIState],
  (uiState) => uiState.theme
);

export const selectNotifications = createSelector(
  [selectUIState],
  (uiState) => uiState.notifications
);

export const selectUnreadNotifications = createSelector(
  [selectNotifications],
  (notifications) => notifications.filter(n => !n.read)
);

export const selectUnreadNotificationCount = createSelector(
  [selectUnreadNotifications],
  (unreadNotifications) => unreadNotifications.length
);

// Filter selectors
export const selectCurrentFilters = createSelector(
  [selectFiltersState],
  (filtersState) => ({
    sortBy: filtersState.sortBy,
    sortOrder: filtersState.sortOrder,
    quarterFilter: filtersState.quarterFilter,
    yearFilter: filtersState.yearFilter,
    searchTerm: filtersState.searchTerm
  })
);

// Combined selectors for dashboard
export const selectDashboardData = createSelector(
  [
    selectFilteredAndSortedCompanies,
    selectAllPortfolios,
    selectAllWatchlists,
    selectCurrentFilters
  ],
  (companies, portfolios, watchlists, filters) => ({
    companies,
    portfolios,
    watchlists,
    filters,
    totalCompanies: companies.length,
    totalPortfolios: portfolios.length,
    totalWatchlists: watchlists.length
  })
);

// Performance selectors
export const selectTopPerformingCompanies = createSelector(
  [selectFilteredAndSortedCompanies, selectSelectedQuarter, selectSelectedYear],
  (companies, quarter, year) => {
    const quarterKey = `${year}-${quarter}`;
    
    return companies
      .filter(company => company.financials.quarters[quarterKey])
      .sort((a, b) => {
        const aGrowth = parseFloat(a.financials.YOY.sales_growth);
        const bGrowth = parseFloat(b.financials.YOY.sales_growth);
        return bGrowth - aGrowth;
      })
      .slice(0, 5);
  }
);

export const selectPortfolioPerformanceMetrics = createSelector(
  [selectAllPortfolios],
  (portfolios) => {
    const totalValue = portfolios.reduce((sum, p) => sum + p.currentValue, 0);
    const totalInitial = portfolios.reduce((sum, p) => sum + p.initialCapital, 0);
    const totalReturn = totalValue - totalInitial;
    const returnPercentage = totalInitial > 0 ? (totalReturn / totalInitial) * 100 : 0;

    return {
      totalValue,
      totalInitial,
      totalReturn,
      returnPercentage,
      portfolioCount: portfolios.length
    };
  }
);