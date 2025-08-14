// Core data interfaces
export interface CompanyFinancials {
  id: string;
  company: string;
  symbol?: string; // NSE symbol for Yahoo Finance API integration
  price: string;
  market_cap: string;
  PE_ratio: string;
  // Company Profile
  industry?: string;
  sector?: string;
  financials: {
    YOY: {
      sales_growth: string;
      EBIDT_growth: string;
      net_profit_growth: string;
      EPS_growth: string;
    };
    quarters: Record<string, QuarterData>;
  };
  createdAt: Date;
  updatedAt: Date;
}

export interface QuarterData {
  sales: number;
  EBIDT: number;
  net_profit: number;
  EPS: string;
}

export interface Portfolio {
  id: string;
  name: string;
  description?: string;
  userId: string;
  initialCapital: number;
  currentValue: number;
  totalReturn: number;
  holdings: Holding[];
  transactions: Transaction[];
  createdAt: Date;
  updatedAt: Date;
}

export interface Holding {
  id: string;
  symbol: string;
  quantity: number;
  averagePrice: number;
  currentPrice: number;
  totalValue: number;
  unrealizedGain: number;
  // Daily change information
  priceChange?: number; // Daily price change in currency
  priceChangePercent?: number; // Daily price change in percentage
  dayGainLoss?: number; // Daily gain/loss for this holding (quantity × priceChange)
  previousClose?: number; // Previous day's closing price from Yahoo Finance
  // Financial metrics from Yahoo Finance API
  marketCap?: number | null;
  sector?: string;
  industry?: string;
  trailingPE?: number | null;
  forwardPE?: number | null;
  priceToBook?: number | null;
  // Additional Yahoo Finance metrics
  lastTradePrice?: number;
  dayHigh?: number;
  dayLow?: number;
  volume?: number;
  averageVolume?: number;
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
  beta?: number | null;
  dividendYield?: number | null;
  earningsPerShare?: number | null;
  priceToSales?: number | null;
  // Company profile information
  companyName?: string;
  website?: string;
  businessSummary?: string;
  fullTimeEmployees?: number | null;
}

export interface Transaction {
  id: string;
  portfolioId: string;
  symbol: string;
  type: 'buy' | 'sell';
  quantity: number;
  price: number;
  totalAmount: number;
  date: Date;
  fees?: number;
}

export interface Watchlist {
  id: string;
  name: string;
  description?: string;
  userId: string;
  stocks: WatchlistStock[];
  createdAt: Date;
  updatedAt: Date;
}

export interface WatchlistStock {
  id: string;
  symbol: string;
  companyName: string;
  addedAt: Date;
  addedPrice?: number; // Price when added to watchlist
  currentPrice?: number;
  priceChange?: number;
  priceChangePercent?: number;
  lastUpdated?: Date;
  // Additional financial metrics
  peRatio?: number | null;
  marketCap?: number | null;
  priceToBook?: number | null;
  // 52-week range
  fiftyTwoWeekHigh?: number | null;
  fiftyTwoWeekLow?: number | null;
}

// NSE Company interfaces
export interface NSECompany {
  id: string;
  symbol: string;
  companyName: string;
  series: string;
  dateOfListing: string;
  paidUpValue: number;
  marketLot: number;
  isinNumber: string;
  faceValue: number;
  createdAt: Date;
}

export interface NSECompanyCSVRow {
  SYMBOL: string;
  'NAME OF COMPANY': string;
  SERIES: string;
  'DATE OF LISTING': string;
  'PAID UP VALUE': string;
  'MARKET LOT': string;
  'ISIN NUMBER': string;
  'FACE VALUE': string;
}

// Storage interfaces
export interface StoredCompanies {
  [companyId: string]: CompanyFinancials;
}

export interface StoredPortfolios {
  [portfolioId: string]: Portfolio;
}

export interface StoredWatchlists {
  [watchlistId: string]: Watchlist;
}

export interface StoredNSECompanies {
  [symbol: string]: NSECompany;
}

export interface UserPreferences {
  defaultQuarter: string;
  defaultYear: number;
  theme: 'light' | 'dark';
  currency: string;
}

// Redux state interfaces
export interface RootState {
  companies: CompaniesState;
  portfolios: PortfoliosState;
  watchlists: WatchlistsState;
  nseCompanies: NSECompaniesState;
  filters: FiltersState;
  ui: UIState;
  settings: SettingsState;
  aiAnalysis: import('@/types/gemini').AIAnalysisState;
}

export interface CompaniesState {
  data: CompanyFinancials[];
  loading: boolean;
  error: string | null;
  selectedQuarter: string;
  selectedYear: number;
  duplicates: { [key: string]: CompanyFinancials[] };
}

export interface PortfoliosState {
  data: Portfolio[];
  loading: boolean;
  error: string | null;
  selectedPortfolio: string | null;
}

export interface WatchlistsState {
  data: Watchlist[];
  loading: boolean;
  error: string | null;
  selectedWatchlist: string | null;
}

export interface FiltersState {
  sortBy: 'sales' | 'EBIDT' | 'net_profit' | 'EPS';
  sortOrder: 'asc' | 'desc';
  quarterFilter: string;
  yearFilter: number;
  searchTerm: string;
}

export interface NSECompaniesState {
  data: NSECompany[];
  loading: boolean;
  error: string | null;
  searchTerm: string;
  uploadProgress: number;
  duplicates: DuplicateReport | null;
}

export interface UIState {
  sidebarOpen: boolean;
  theme: 'light' | 'dark';
  notifications: Notification[];
}

export interface SettingsState {
  marketCapThresholds: {
    microCap: number;
    smallCap: number;
    midCap: number;
    largeCap: number;
  };
  priceUpdateSettings: {
    refreshInterval: number;
    marketHoursOnly: boolean;
    checkMarketHolidays: boolean;
    autoRefreshEnabled: boolean;
  };
  loading: boolean;
  error: string | null;
}

export interface Notification {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  timestamp: Date;
  read: boolean;
}

// JSON input format interfaces for company data import
export interface SingleCompanyJSONFormat {
  company: {
    name: string;
    price: string;
    market_cap: string;
    PE_ratio: string;
    financials: {
      YOY: {
        sales_growth: string;
        EBIDT_growth: string;
        net_profit_growth: string;
        EPS_growth: string;
      };
      quarters: Record<string, QuarterData>;
    };
  };
}

export interface MultipleCompaniesJSONFormat {
  companies: Array<{
    name: string;
    price: string;
    market_cap: string;
    PE_ratio: string;
    financials: {
      YOY: {
        sales_growth: string;
        EBIDT_growth: string;
        net_profit_growth: string;
        EPS_growth: string;
      };
      quarters: Record<string, QuarterData>;
    };
  }>;
}

// Union type for any valid JSON input format
export type CompanyJSONInput = SingleCompanyJSONFormat | MultipleCompaniesJSONFormat;

// Validation result interface
export interface ValidationResult<T> {
  isValid: boolean;
  data?: T;
  errors: string[];
}

// API response interfaces
export interface APIResponse<T> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

// Error types
export class ValidationError extends Error {
  constructor(message: string, public field?: string) {
    super(message);
    this.name = 'ValidationError';
  }
}

export class APIError extends Error {
  constructor(message: string, public statusCode?: number) {
    super(message);
    this.name = 'APIError';
  }
}

export class AuthenticationError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'AuthenticationError';
  }
}

export class DataError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'DataError';
  }
}

// CSV Processing interfaces
export interface DuplicateReport {
  duplicates: Array<{
    symbol: string;
    indices: number[];
    companyNames: string[];
  }>;
  totalDuplicates: number;
}

export interface MatchResult {
  match: NSECompany | null;
  confidence: number;
  suggestions: NSECompany[];
}

export interface CSVValidationResult {
  isValid: boolean;
  errors: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  warnings: Array<{
    row: number;
    field: string;
    message: string;
  }>;
  processedCount: number;
  duplicateCount: number;
}

// Redux types
export type { AppDispatch } from '@/lib/redux/store';

// Portfolio calculation utilities
export const calculateNetInvested = (transactions: Transaction[]): number => {
  let totalInvested = 0;
  let totalReceived = 0;

  transactions.forEach(tx => {
    if (tx.type === 'buy') {
      totalInvested += tx.totalAmount; // Includes fees for buy transactions
    } else if (tx.type === 'sell') {
      totalReceived += tx.totalAmount; // Excludes fees for sell transactions
    }
  });

  return totalInvested - totalReceived;
};

export const calculatePortfolioReturnPercentage = (portfolio: Portfolio): number => {
  const netInvested = calculateNetInvested(portfolio.transactions);
  if (netInvested === 0) return 0;
  return ((portfolio.currentValue - netInvested) / netInvested) * 100;
};

export const calculatePortfolioDayPL = (portfolio: Portfolio): number => {
  return portfolio.holdings.reduce((sum, holding) => {
    return sum + (holding.dayGainLoss || 0);
  }, 0);
};

export const calculatePortfolioDayPLPercent = (portfolio: Portfolio): number => {
  // Calculate previous day's portfolio value by using previous day's closing prices
  let previousDayValue = 0;
  let currentDayValue = 0;

  portfolio.holdings.forEach(holding => {
    // Current day value for this holding
    const currentHoldingValue = holding.quantity * holding.currentPrice;
    currentDayValue += currentHoldingValue;

    // Previous day's closing price = current price - daily price change
    const previousDayPrice = holding.currentPrice - (holding.priceChange || 0);
    const previousHoldingValue = holding.quantity * previousDayPrice;
    previousDayValue += previousHoldingValue;
  });

  // Calculate day P&L percentage based on previous day's value
  if (previousDayValue === 0) return 0;

  const dayPL = currentDayValue - previousDayValue;
  const dayPLPercent = (dayPL / previousDayValue) * 100; 

  return dayPLPercent;
};



