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
  symbols: string[];
  createdAt: Date;
  updatedAt: Date;
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