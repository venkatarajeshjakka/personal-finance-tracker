import { describe, it, expect } from 'vitest';
import { getCurrentQuarter, getAvailableQuarters, formatCurrency, formatPercentage, getGrowthColorClass } from '@/lib/utils/quarterUtils';

describe('Dashboard Utilities', () => {
  it('should get current quarter', () => {
    const quarter = getCurrentQuarter();
    expect(quarter).toHaveProperty('quarter');
    expect(quarter).toHaveProperty('year');
    expect(quarter).toHaveProperty('displayName');
    expect(['Q1', 'Q2', 'Q3', 'Q4']).toContain(quarter.quarter);
  });

  it('should format currency correctly', () => {
    expect(formatCurrency(1000000000)).toBe('₹100.00Cr');
    expect(formatCurrency(100000)).toBe('₹1.00L');
    expect(formatCurrency(1000)).toBe('₹1.00K');
    expect(formatCurrency(100)).toBe('₹100.00');
    expect(formatCurrency('invalid')).toBe('N/A');
  });

  it('should format percentage correctly', () => {
    expect(formatPercentage(12.5)).toBe('+12.50%');
    expect(formatPercentage(-5.2)).toBe('-5.20%');
    expect(formatPercentage('15.3%')).toBe('+15.30%');
    expect(formatPercentage('invalid')).toBe('N/A');
  });

  it('should get growth color class correctly', () => {
    expect(getGrowthColorClass(10)).toBe('text-green-600');
    expect(getGrowthColorClass(-5)).toBe('text-red-600');
    expect(getGrowthColorClass(0)).toBe('text-muted-foreground');
    expect(getGrowthColorClass('invalid')).toBe('text-muted-foreground');
  });

  it('should get available quarters from companies', () => {
    const mockCompanies = [
      {
        financials: {
          quarters: {
            'Q1 2024': { sales: 1000 },
            'Q2 2024': { sales: 2000 }
          }
        }
      }
    ];
    
    const quarters = getAvailableQuarters(mockCompanies);
    expect(quarters).toHaveLength(2);
    expect(quarters[0].quarter).toBe('Q2');
    expect(quarters[1].quarter).toBe('Q1');
    expect(quarters[0].year).toBe(2024);
  });

  it('should handle empty companies array', () => {
    const quarters = getAvailableQuarters([]);
    expect(quarters).toHaveLength(0);
  });

  it('should handle companies without financial data', () => {
    const mockCompanies = [
      { financials: null },
      { financials: { quarters: {} } }
    ];
    
    const quarters = getAvailableQuarters(mockCompanies);
    expect(quarters).toHaveLength(0);
  });
});