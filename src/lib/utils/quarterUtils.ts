/**
 * Utility functions for quarter detection and financial data processing
 */

export interface QuarterInfo {
  quarter: string;
  year: number;
  displayName: string;
}

/**
 * Get current quarter based on the current date
 * Quarter mapping: Jun=Q1, Sep=Q2, Dec=Q3, Mar=Q4
 */
export function getCurrentQuarter(): QuarterInfo {
  const now = new Date();
  const month = now.getMonth() + 1; // getMonth() returns 0-11
  const year = now.getFullYear();

  let quarter: string;
  let fiscalYear: number;

  if (month >= 4 && month <= 6) {
    // April-June = Q1
    quarter = 'Q1';
    fiscalYear = year;
  } else if (month >= 7 && month <= 9) {
    // July-September = Q2
    quarter = 'Q2';
    fiscalYear = year;
  } else if (month >= 10 && month <= 12) {
    // October-December = Q3
    quarter = 'Q3';
    fiscalYear = year;
  } else {
    // January-March = Q4 of previous fiscal year
    quarter = 'Q4';
    fiscalYear = year - 1;
  }

  return {
    quarter,
    year: fiscalYear,
    displayName: `${quarter} ${fiscalYear}`
  };
}

/**
 * Get quarter info from a date
 */
export function getQuarterFromDate(date: Date): QuarterInfo {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  let quarter: string;
  let fiscalYear: number;

  if (month >= 4 && month <= 6) {
    quarter = 'Q1';
    fiscalYear = year;
  } else if (month >= 7 && month <= 9) {
    quarter = 'Q2';
    fiscalYear = year;
  } else if (month >= 10 && month <= 12) {
    quarter = 'Q3';
    fiscalYear = year;
  } else {
    quarter = 'Q4';
    fiscalYear = year - 1;
  }

  return {
    quarter,
    year: fiscalYear,
    displayName: `${quarter} ${fiscalYear}`
  };
}

/**
 * Get all available quarters from company data
 */
export function getAvailableQuarters(companies: any[]): QuarterInfo[] {
  const quarterSet = new Set<string>();

  companies.forEach(company => {
    if (company.financials?.quarters) {
      Object.keys(company.financials.quarters).forEach(quarterKey => {
        quarterSet.add(quarterKey);
      });
    }
  });

  // Convert quarter keys to QuarterInfo objects and sort
  const quarters = Array.from(quarterSet).map(quarterKey => {
    // Assuming quarter keys are in format like "Q1 2024"
    const [quarter, yearStr] = quarterKey.split(' ');
    const year = parseInt(yearStr);

    return {
      quarter,
      year,
      displayName: quarterKey
    };
  }).sort((a, b) => {
    if (a.year !== b.year) {
      return b.year - a.year; // Sort by year descending
    }
    // Sort by quarter (Q4, Q3, Q2, Q1)
    const quarterOrder = { 'Q4': 4, 'Q3': 3, 'Q2': 2, 'Q1': 1 };
    return (quarterOrder[b.quarter as keyof typeof quarterOrder] || 0) -
      (quarterOrder[a.quarter as keyof typeof quarterOrder] || 0);
  });

  return quarters;
}

/**
 * Parse currency string to number
 */
export function parseCurrencyString(value: string): number {
  if (!value || typeof value !== 'string') return 0;

  // Remove currency symbols and spaces
  let cleanValue = value.replace(/[₹$,\s]/g, '');

  // Handle Indian numbering suffixes
  if (cleanValue.includes('Cr')) {
    const numValue = parseFloat(cleanValue.replace('Cr', ''));
    return numValue * 10000000; // Convert crores to actual number
  } else if (cleanValue.includes('L')) {
    const numValue = parseFloat(cleanValue.replace('L', ''));
    return numValue * 100000; // Convert lakhs to actual number
  } else if (cleanValue.includes('K')) {
    const numValue = parseFloat(cleanValue.replace('K', ''));
    return numValue * 1000; // Convert thousands to actual number
  } else {
    return parseFloat(cleanValue) || 0;
  }
}

/**
 * Format currency values
 */
export function formatCurrency(value: number | string, currency = '₹'): string {
  let numValue: number;

  if (typeof value === 'string') {
    // Handle special cases
    if (value === '0' || value === '' || value.toLowerCase() === 'n/a') {
      return 'N/A';
    }

    // Try to parse formatted currency string first
    numValue = parseCurrencyString(value);
    // If that fails, try simple parseFloat
    if (numValue === 0) {
      numValue = parseFloat(value) || 0;
    }
  } else {
    numValue = value;
  }

  if (isNaN(numValue) || numValue === 0) return 'N/A';

  // Format in Indian numbering system (crores, lakhs)
  if (numValue >= 10000000) {
    return `${currency}${(numValue / 10000000).toFixed(2)}Cr`;
  } else if (numValue >= 100000) {
    return `${currency}${(numValue / 100000).toFixed(2)}L`;
  } else if (numValue >= 1000) {
    return `${currency}${(numValue / 1000).toFixed(2)}K`;
  } else {
    return `${currency}${numValue.toFixed(2)}`;
  }
}

/**
 * Format percentage values
 */
export function formatPercentage(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;

  if (isNaN(numValue)) return 'N/A';

  return `${numValue > 0 ? '+' : ''}${numValue.toFixed(2)}%`;
}

/**
 * Get growth indicator color class
 */
export function getGrowthColorClass(value: number | string): string {
  const numValue = typeof value === 'string' ? parseFloat(value.replace('%', '')) : value;

  if (isNaN(numValue)) return 'text-muted-foreground';

  if (numValue > 0) return 'text-green-600';
  if (numValue < 0) return 'text-red-600';
  return 'text-muted-foreground';
}

/**
 * Parse growth value from string
 */
export function parseGrowthValue(value: string): number {
  if (!value) return 0;
  return parseFloat(value.replace('%', '').replace('+', ''));
}

/**
 * Market cap categories and their thresholds (in crores)
 */
export interface MarketCapCategory {
  label: string;
  color: string;
  bgColor: string;
  threshold: number;
}

export interface MarketCapThresholds {
  microCap: number;
  smallCap: number;
  midCap: number;
  largeCap: number;
}

export const DEFAULT_MARKET_CAP_THRESHOLDS: MarketCapThresholds = {
  microCap: 0,
  smallCap: 500,
  midCap: 5000,
  largeCap: 20000
};

/**
 * Get market cap category based on market cap value using Redux store thresholds
 */
export function getMarketCapCategory(marketCapValue: string | number): MarketCapCategory {
  let numValue: number;

  if (typeof marketCapValue === 'string') {
    numValue = parseCurrencyString(marketCapValue);
    if (numValue === 0) {
      numValue = parseFloat(marketCapValue) || 0;
    }
  } else {
    numValue = marketCapValue;
  }

  // Convert to crores for comparison
  const valueInCrores = numValue / 10000000;

  // Get current thresholds from localStorage (fallback to defaults)
  let thresholds = DEFAULT_MARKET_CAP_THRESHOLDS;
  if (typeof window !== 'undefined') {
    try {
      const saved = localStorage.getItem('marketCapThresholds');
      if (saved) {
        thresholds = JSON.parse(saved);
      }
    } catch (error) {
      console.error('Failed to load market cap thresholds:', error);
    }
  }

  // Create categories with current thresholds
  const categories: MarketCapCategory[] = [
    { label: 'Micro Cap', color: 'text-purple-700', bgColor: 'bg-purple-100', threshold: thresholds.microCap },
    { label: 'Small Cap', color: 'text-blue-700', bgColor: 'bg-blue-100', threshold: thresholds.smallCap },
    { label: 'Mid Cap', color: 'text-orange-700', bgColor: 'bg-orange-100', threshold: thresholds.midCap },
    { label: 'Large Cap', color: 'text-green-700', bgColor: 'bg-green-100', threshold: thresholds.largeCap }
  ];

  // Find the appropriate category (reverse order to get the highest matching threshold)
  for (let i = categories.length - 1; i >= 0; i--) {
    if (valueInCrores >= categories[i].threshold) {
      return categories[i];
    }
  }

  // Default to Micro Cap if no threshold is met
  return categories[0];
}