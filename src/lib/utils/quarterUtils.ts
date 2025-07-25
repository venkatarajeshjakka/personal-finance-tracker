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
 * Format currency values
 */
export function formatCurrency(value: number | string, currency = '₹'): string {
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  if (isNaN(numValue)) return 'N/A';
  
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