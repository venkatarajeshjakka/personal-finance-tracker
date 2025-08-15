/**
 * Shared Formatting Functions
 * Provides consistent formatting across all components
 */

export interface FormatOptions {
  minimumFractionDigits?: number;
  maximumFractionDigits?: number;
  showSign?: boolean;
  compact?: boolean;
  locale?: string;
}

/**
 * Currency Formatting Service
 * Provides consistent currency formatting across the application
 */
export class CurrencyFormatter {
  private static readonly DEFAULT_LOCALE = 'en-IN';
  private static readonly DEFAULT_CURRENCY = 'INR';

  /**
   * Format currency with full precision
   */
  static formatCurrency(amount: number, options: FormatOptions = {}): string {
    const {
      minimumFractionDigits = 0,
      maximumFractionDigits = 0,
      locale = CurrencyFormatter.DEFAULT_LOCALE
    } = options;

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: CurrencyFormatter.DEFAULT_CURRENCY,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  }

  /**
   * Format currency with price precision (2 decimal places)
   */
  static formatPrice(amount: number, options: FormatOptions = {}): string {
    const {
      minimumFractionDigits = 2,
      maximumFractionDigits = 2,
      locale = CurrencyFormatter.DEFAULT_LOCALE
    } = options;

    return new Intl.NumberFormat(locale, {
      style: 'currency',
      currency: CurrencyFormatter.DEFAULT_CURRENCY,
      minimumFractionDigits,
      maximumFractionDigits,
    }).format(amount);
  }

  /**
   * Format currency in compact form (K, L, Cr, T)
   */
  static formatCompactCurrency(amount: number, options: FormatOptions = {}): string {
    const { showSign = false } = options;
    const sign = showSign && amount > 0 ? '+' : '';

    if (Math.abs(amount) >= 1e12) {
      return `${sign}₹${(amount / 1e12).toFixed(2)}T`;
    } else if (Math.abs(amount) >= 1e9) {
      return `${sign}₹${(amount / 1e9).toFixed(2)}B`;
    } else if (Math.abs(amount) >= 1e7) {
      return `${sign}₹${(amount / 1e7).toFixed(2)}Cr`;
    } else if (Math.abs(amount) >= 1e5) {
      return `${sign}₹${(amount / 1e5).toFixed(2)}L`;
    } else if (Math.abs(amount) >= 1e3) {
      return `${sign}₹${(amount / 1e3).toFixed(2)}K`;
    }
    return `${sign}${CurrencyFormatter.formatCurrency(amount)}`;
  }

  /**
   * Format market cap with appropriate scale
   */
  static formatMarketCap(marketCap: number): string {
    if (marketCap >= 1e12) {
      return `₹${(marketCap / 1e12).toFixed(2)}T`;
    } else if (marketCap >= 1e9) {
      return `₹${(marketCap / 1e9).toFixed(2)}B`;
    } else if (marketCap >= 1e7) {
      return `₹${(marketCap / 1e7).toFixed(2)}Cr`;
    } else if (marketCap >= 1e5) {
      return `₹${(marketCap / 1e5).toFixed(2)}L`;
    }
    return CurrencyFormatter.formatCurrency(marketCap);
  }
}

/**
 * Number Formatting Service
 * Provides consistent number formatting
 */
export class NumberFormatter {
  private static readonly DEFAULT_LOCALE = 'en-IN';

  /**
   * Format number with locale-specific formatting
   */
  static formatNumber(value: number, options: FormatOptions = {}): string {
    const {
      minimumFractionDigits = 0,
      maximumFractionDigits = 2,
      locale = NumberFormatter.DEFAULT_LOCALE
    } = options;

    return new Intl.NumberFormat(locale, {
      minimumFractionDigits,
      maximumFractionDigits
    }).format(value);
  }

  /**
   * Format integer with thousands separators
   */
  static formatInteger(value: number, options: FormatOptions = {}): string {
    const { locale = NumberFormatter.DEFAULT_LOCALE } = options;
    return new Intl.NumberFormat(locale).format(Math.round(value));
  }

  /**
   * Format decimal with specified precision
   */
  static formatDecimal(value: number, decimalPlaces: number = 2, options: FormatOptions = {}): string {
    const { locale = NumberFormatter.DEFAULT_LOCALE } = options;
    return new Intl.NumberFormat(locale, {
      minimumFractionDigits: decimalPlaces,
      maximumFractionDigits: decimalPlaces
    }).format(value);
  }

  /**
   * Format compact number (K, M, B, T)
   */
  static formatCompactNumber(value: number, options: FormatOptions = {}): string {
    if (Math.abs(value) >= 1e12) {
      return `${(value / 1e12).toFixed(1)}T`;
    } else if (Math.abs(value) >= 1e9) {
      return `${(value / 1e9).toFixed(1)}B`;
    } else if (Math.abs(value) >= 1e6) {
      return `${(value / 1e6).toFixed(1)}M`;
    } else if (Math.abs(value) >= 1e3) {
      return `${(value / 1e3).toFixed(1)}K`;
    }
    return NumberFormatter.formatNumber(value, { ...options, maximumFractionDigits: 0 });
  }
}

/**
 * Percentage Formatting Service
 * Provides consistent percentage formatting
 */
export class PercentageFormatter {
  /**
   * Format percentage with sign and precision
   */
  static formatPercentage(value: number, options: FormatOptions = {}): string {
    const {
      maximumFractionDigits = 2,
      showSign = true
    } = options;

    // Handle the case where value might already be in percentage format
    const percentValue = Math.abs(value) > 1 ? value : value * 100;
    const sign = showSign && percentValue > 0 ? '+' : '';

    return `${sign}${percentValue.toFixed(maximumFractionDigits)}%`;
  }

  /**
   * Format percentage with automatic precision
   */
  static formatPercentageAuto(value: number, options: FormatOptions = {}): string {
    const { showSign = true } = options;
    const percentValue = Math.abs(value) > 1 ? value : value * 100;
    const sign = showSign && percentValue > 0 ? '+' : '';

    // Use more precision for small values
    const precision = Math.abs(percentValue) < 1 ? 3 :
      Math.abs(percentValue) < 10 ? 2 : 1;

    return `${sign}${percentValue.toFixed(precision)}%`;
  }

  /**
   * Format basis points (1/100th of a percent)
   */
  static formatBasisPoints(value: number): string {
    return `${value.toFixed(0)} bps`;
  }
}

/**
 * Date Formatting Service
 * Provides consistent date formatting to prevent hydration issues
 */
export class DateFormatter {
  /**
   * Format date in consistent format
   */
  static formatDate(date: Date | string): string {
    const d = new Date(date);

    // Use a consistent format that works the same on server and client
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');

    return `${month}/${day}/${year}`;
  }

  /**
   * Format date and time in consistent format
   */
  static formatDateTime(date: Date | string): string {
    const d = new Date(date);

    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');

    return `${month}/${day}/${year}, ${hours}:${minutes}`;
  }

  /**
   * Format relative time (e.g., "2 hours ago")
   */
  static formatRelativeTime(date: Date | string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMinutes = Math.floor(diffMs / (1000 * 60));
    const diffHours = Math.floor(diffMinutes / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return DateFormatter.formatDate(date);
  }

  /**
   * Format time only
   */
  static formatTime(date: Date | string): string {
    const d = new Date(date);
    const hours = String(d.getHours()).padStart(2, '0');
    const minutes = String(d.getMinutes()).padStart(2, '0');
    return `${hours}:${minutes}`;
  }

  /**
   * Format date for chart labels
   */
  static formatChartDate(date: Date | string, timeframe: '1D' | '1W' | '1M' | '3M' | '6M' | '1Y' | 'ALL'): string {
    const d = new Date(date);

    switch (timeframe) {
      case '1D':
        return DateFormatter.formatTime(d);
      case '1W':
      case '1M':
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '3M':
      case '6M':
        return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
      case '1Y':
      case 'ALL':
        return d.toLocaleDateString('en-US', { month: 'short', year: '2-digit' });
      default:
        return DateFormatter.formatDate(d);
    }
  }
}

/**
 * Color Utility Service
 * Provides consistent color classes for financial data
 */
export class ColorFormatter {
  /**
   * Get color class for positive/negative values
   */
  static getValueColorClass(value: number): string {
    if (value > 0) return 'text-green-600 dark:text-green-400';
    if (value < 0) return 'text-red-600 dark:text-red-400';
    return 'text-muted-foreground';
  }

  /**
   * Get background color class for positive/negative values
   */
  static getValueBgColorClass(value: number, opacity: 'light' | 'medium' | 'dark' = 'light'): string {
    const opacityMap = {
      light: { positive: 'bg-green-50 dark:bg-green-950/20', negative: 'bg-red-50 dark:bg-red-950/20' },
      medium: { positive: 'bg-green-100 dark:bg-green-900/30', negative: 'bg-red-100 dark:bg-red-900/30' },
      dark: { positive: 'bg-green-200 dark:bg-green-800/40', negative: 'bg-red-200 dark:bg-red-800/40' }
    };

    if (value > 0) return opacityMap[opacity].positive;
    if (value < 0) return opacityMap[opacity].negative;
    return 'bg-muted/20';
  }

  /**
   * Get border color class for positive/negative values
   */
  static getValueBorderColorClass(value: number): string {
    if (value > 0) return 'border-green-200 dark:border-green-800';
    if (value < 0) return 'border-red-200 dark:border-red-800';
    return 'border-muted';
  }

  /**
   * Get risk level color class
   */
  static getRiskColorClass(level: 'Low' | 'Medium' | 'High' | 'Very High'): string {
    switch (level) {
      case 'Low': return 'text-green-600 dark:text-green-400';
      case 'Medium': return 'text-yellow-600 dark:text-yellow-400';
      case 'High': return 'text-orange-600 dark:text-orange-400';
      case 'Very High': return 'text-red-600 dark:text-red-400';
      default: return 'text-muted-foreground';
    }
  }
}

/**
 * Validation Utility Service
 * Provides input validation and sanitization
 */
export class ValidationFormatter {
  /**
   * Validate and format currency input
   */
  static validateCurrencyInput(input: string): { isValid: boolean; value: number; formatted: string } {
    // Remove currency symbols and spaces
    const cleaned = input.replace(/[₹$,\s]/g, '');
    const value = parseFloat(cleaned);

    const isValid = !isNaN(value) && value >= 0;
    const formatted = isValid ? CurrencyFormatter.formatPrice(value) : '';

    return { isValid, value: isValid ? value : 0, formatted };
  }

  /**
   * Validate and format percentage input
   */
  static validatePercentageInput(input: string): { isValid: boolean; value: number; formatted: string } {
    const cleaned = input.replace(/[%\s]/g, '');
    const value = parseFloat(cleaned);

    const isValid = !isNaN(value) && value >= -100 && value <= 1000;
    const formatted = isValid ? PercentageFormatter.formatPercentage(value) : '';

    return { isValid, value: isValid ? value : 0, formatted };
  }

  /**
   * Validate and format number input
   */
  static validateNumberInput(input: string, min?: number, max?: number): { isValid: boolean; value: number; formatted: string } {
    const cleaned = input.replace(/[,\s]/g, '');
    const value = parseFloat(cleaned);

    let isValid = !isNaN(value);
    if (isValid && min !== undefined) isValid = value >= min;
    if (isValid && max !== undefined) isValid = value <= max;

    const formatted = isValid ? NumberFormatter.formatNumber(value) : '';

    return { isValid, value: isValid ? value : 0, formatted };
  }
}

/**
 * Convenience functions for common formatting operations
 */
export const formatters = {
  // Currency
  currency: CurrencyFormatter.formatCurrency,
  price: CurrencyFormatter.formatPrice,
  compactCurrency: CurrencyFormatter.formatCompactCurrency,
  marketCap: CurrencyFormatter.formatMarketCap,

  // Numbers
  number: NumberFormatter.formatNumber,
  integer: NumberFormatter.formatInteger,
  decimal: NumberFormatter.formatDecimal,
  compactNumber: NumberFormatter.formatCompactNumber,

  // Percentages
  percentage: PercentageFormatter.formatPercentage,
  percentageAuto: PercentageFormatter.formatPercentageAuto,
  basisPoints: PercentageFormatter.formatBasisPoints,

  // Dates
  date: DateFormatter.formatDate,
  dateTime: DateFormatter.formatDateTime,
  relativeTime: DateFormatter.formatRelativeTime,
  time: DateFormatter.formatTime,
  chartDate: DateFormatter.formatChartDate,

  // Colors
  valueColor: ColorFormatter.getValueColorClass,
  valueBgColor: ColorFormatter.getValueBgColorClass,
  valueBorderColor: ColorFormatter.getValueBorderColorClass,
  riskColor: ColorFormatter.getRiskColorClass,

  // Validation
  validateCurrency: ValidationFormatter.validateCurrencyInput,
  validatePercentage: ValidationFormatter.validatePercentageInput,
  validateNumber: ValidationFormatter.validateNumberInput
};

// Individual formatters are already exported above as classes