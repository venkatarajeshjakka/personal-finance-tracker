import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import { StorageService } from '../index';
import { 
  detectAndValidateJSONFormat, 
  normalizeCompanyData, 
  categorizeQuarter,
  normalizeQuarterKeys
} from '../utils';
// CompanyFinancials type is used in the tests but not directly imported as a value

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
};

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
});

describe('Company Data Import and Processing', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    localStorageMock.getItem.mockReturnValue(null);
  });

  afterEach(() => {
    vi.clearAllMocks();
  });

  describe('Quarter Categorization', () => {
    it('should categorize quarters correctly (Jun=Q1, Sep=Q2, Dec=Q3, Mar=Q4)', () => {
      expect(categorizeQuarter('Jun-2024')).toBe('Q1-2024');
      expect(categorizeQuarter('Sep-2024')).toBe('Q2-2024');
      expect(categorizeQuarter('Dec-2024')).toBe('Q3-2024');
      expect(categorizeQuarter('Mar-2024')).toBe('Q4-2024');
    });

    it('should handle different date formats', () => {
      expect(categorizeQuarter('Jun 2024')).toBe('Q1-2024');
      expect(categorizeQuarter('2024-Jun')).toBe('Q1-2024');
      expect(categorizeQuarter('June-2024')).toBe('Jun-2024'); // Should return original for full month names
    });

    it('should return original string for non-mapped months', () => {
      expect(categorizeQuarter('Jan-2024')).toBe('Jan-2024');
      expect(categorizeQuarter('Apr-2024')).toBe('Apr-2024');
      expect(categorizeQuarter('Q1-2024')).toBe('Q1-2024');
    });

    it('should handle missing year by using current year', () => {
      const currentYear = new Date().getFullYear().toString();
      expect(categorizeQuarter('Jun')).toBe(`Q1-${currentYear}`);
    });
  });

  describe('Quarter Keys Normalization', () => {
    it('should normalize quarter keys in financial data', () => {
      const quarters = {
        'Jun-2024': { sales: 1000, EBIDT: 200, net_profit: 150, EPS: '2.50' },
        'Sep-2024': { sales: 1100, EBIDT: 220, net_profit: 165, EPS: '2.75' },
        'Dec-2024': { sales: 1200, EBIDT: 240, net_profit: 180, EPS: '3.00' },
        'Mar-2025': { sales: 1300, EBIDT: 260, net_profit: 195, EPS: '3.25' }
      };

      const normalized = normalizeQuarterKeys(quarters);

      expect(normalized).toEqual({
        'Q1-2024': { sales: 1000, EBIDT: 200, net_profit: 150, EPS: '2.50' },
        'Q2-2024': { sales: 1100, EBIDT: 220, net_profit: 165, EPS: '2.75' },
        'Q3-2024': { sales: 1200, EBIDT: 240, net_profit: 180, EPS: '3.00' },
        'Q4-2025': { sales: 1300, EBIDT: 260, net_profit: 195, EPS: '3.25' }
      });
    });
  });

  describe('Single Company JSON Format Detection and Validation', () => {
    const validSingleCompanyJSON = {
      company: {
        name: 'Test Company',
        price: '$100.00',
        market_cap: '$1B',
        PE_ratio: '15.5',
        financials: {
          YOY: {
            sales_growth: '10%',
            EBIDT_growth: '12%',
            net_profit_growth: '8%',
            EPS_growth: '9%'
          },
          quarters: {
            'Jun-2024': { sales: 1000000, EBIDT: 200000, net_profit: 150000, EPS: '2.50' },
            'Sep-2024': { sales: 1100000, EBIDT: 220000, net_profit: 165000, EPS: '2.75' }
          }
        }
      }
    };

    it('should detect and validate single company format', () => {
      const result = detectAndValidateJSONFormat(validSingleCompanyJSON);
      
      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
      expect('company' in result.data!).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should normalize single company data correctly', () => {
      const validation = detectAndValidateJSONFormat(validSingleCompanyJSON);
      const normalized = normalizeCompanyData(validation.data!);
      
      expect(normalized).toHaveLength(1);
      expect(normalized[0].company).toBe('Test Company');
      expect(normalized[0].price).toBe('$100.00');
      expect(normalized[0].financials.quarters['Q1-2024']).toBeDefined();
      expect(normalized[0].financials.quarters['Q2-2024']).toBeDefined();
    });

    it('should reject invalid single company format', () => {
      const invalidJSON = {
        company: {
          // Missing required fields
          name: 'Test Company'
        }
      };

      const result = detectAndValidateJSONFormat(invalidJSON);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });
  });

  describe('Multiple Companies JSON Format Detection and Validation', () => {
    const validMultipleCompaniesJSON = {
      companies: [
        {
          name: 'Company A',
          price: '$50.00',
          market_cap: '$500M',
          PE_ratio: '12.0',
          financials: {
            YOY: {
              sales_growth: '15%',
              EBIDT_growth: '18%',
              net_profit_growth: '12%',
              EPS_growth: '14%'
            },
            quarters: {
              'Jun-2024': { sales: 500000, EBIDT: 100000, net_profit: 75000, EPS: '1.25' }
            }
          }
        },
        {
          name: 'Company B',
          price: '$75.00',
          market_cap: '$750M',
          PE_ratio: '18.5',
          financials: {
            YOY: {
              sales_growth: '8%',
              EBIDT_growth: '10%',
              net_profit_growth: '6%',
              EPS_growth: '7%'
            },
            quarters: {
              'Sep-2024': { sales: 800000, EBIDT: 160000, net_profit: 120000, EPS: '2.00' }
            }
          }
        }
      ]
    };

    it('should detect and validate multiple companies format', () => {
      const result = detectAndValidateJSONFormat(validMultipleCompaniesJSON);
      
      expect(result.isValid).toBe(true);
      expect(result.data).toBeDefined();
      expect('companies' in result.data!).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should normalize multiple companies data correctly', () => {
      const validation = detectAndValidateJSONFormat(validMultipleCompaniesJSON);
      const normalized = normalizeCompanyData(validation.data!);
      
      expect(normalized).toHaveLength(2);
      expect(normalized[0].company).toBe('Company A');
      expect(normalized[1].company).toBe('Company B');
      expect(normalized[0].financials.quarters['Q1-2024']).toBeDefined();
      expect(normalized[1].financials.quarters['Q2-2024']).toBeDefined();
    });

    it('should handle mixed valid and invalid companies', () => {
      const mixedJSON = {
        companies: [
          {
            name: 'Valid Company',
            price: '$50.00',
            market_cap: '$500M',
            PE_ratio: '12.0',
            financials: {
              YOY: {
                sales_growth: '15%',
                EBIDT_growth: '18%',
                net_profit_growth: '12%',
                EPS_growth: '14%'
              },
              quarters: {
                'Jun-2024': { sales: 500000, EBIDT: 100000, net_profit: 75000, EPS: '1.25' }
              }
            }
          },
          {
            // Invalid company - missing required fields
            name: 'Invalid Company'
          }
        ]
      };

      const result = detectAndValidateJSONFormat(mixedJSON);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(err => err.includes('Company 2'))).toBe(true);
    });
  });

  describe('Data Validation Edge Cases', () => {
    it('should handle numeric values as strings in quarter data', () => {
      const jsonWithStringNumbers = {
        company: {
          name: 'Test Company',
          price: '$100.00',
          market_cap: '$1B',
          PE_ratio: '15.5',
          financials: {
            YOY: {
              sales_growth: '10%',
              EBIDT_growth: '12%',
              net_profit_growth: '8%',
              EPS_growth: '9%'
            },
            quarters: {
              'Jun-2024': { 
                sales: '1000000',  // String number
                EBIDT: '200000',   // String number
                net_profit: '150000', // String number
                EPS: 2.50          // Number EPS
              }
            }
          }
        }
      };

      const result = detectAndValidateJSONFormat(jsonWithStringNumbers);
      expect(result.isValid).toBe(true);
      
      const normalized = normalizeCompanyData(result.data!);
      expect(normalized[0].financials.quarters['Q1-2024'].sales).toBe(1000000);
      expect(normalized[0].financials.quarters['Q1-2024'].EPS).toBe('2.5');
    });

    it('should reject completely invalid JSON structure', () => {
      const invalidStructures = [
        null,
        undefined,
        'string',
        123,
        [],
        {},
        { invalidKey: 'value' }
      ];

      invalidStructures.forEach(invalid => {
        const result = detectAndValidateJSONFormat(invalid);
        expect(result.isValid).toBe(false);
        expect(result.errors.length).toBeGreaterThan(0);
      });
    });

    it('should handle missing or invalid YOY data', () => {
      const jsonWithInvalidYOY = {
        company: {
          name: 'Test Company',
          price: '$100.00',
          market_cap: '$1B',
          PE_ratio: '15.5',
          financials: {
            YOY: {
              sales_growth: '10%',
              // Missing other required YOY fields
            },
            quarters: {
              'Jun-2024': { sales: 1000000, EBIDT: 200000, net_profit: 150000, EPS: '2.50' }
            }
          }
        }
      };

      const result = detectAndValidateJSONFormat(jsonWithInvalidYOY);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('YOY'))).toBe(true);
    });
  });

  describe('StorageService Integration', () => {
    beforeEach(() => {
      // Mock localStorage to return empty data initially
      localStorageMock.getItem.mockReturnValue('{}');
    });

    it('should import single company data successfully', () => {
      const singleCompanyJSON = JSON.stringify({
        company: {
          name: 'Integration Test Company',
          price: '$200.00',
          market_cap: '$2B',
          PE_ratio: '20.0',
          financials: {
            YOY: {
              sales_growth: '25%',
              EBIDT_growth: '30%',
              net_profit_growth: '20%',
              EPS_growth: '22%'
            },
            quarters: {
              'Jun-2024': { sales: 2000000, EBIDT: 400000, net_profit: 300000, EPS: '5.00' }
            }
          }
        }
      });

      const result = StorageService.importCompanyData(singleCompanyJSON);
      
      expect(result.isValid).toBe(true);
      expect(result.data).toHaveLength(1);
      expect(result.data![0].company).toBe('Integration Test Company');
      expect(result.data![0].financials.quarters['Q1-2024']).toBeDefined();
      expect(localStorageMock.setItem).toHaveBeenCalled();
    });

    it('should import multiple companies data successfully', () => {
      const multipleCompaniesJSON = JSON.stringify({
        companies: [
          {
            name: 'Company X',
            price: '$30.00',
            market_cap: '$300M',
            PE_ratio: '10.0',
            financials: {
              YOY: {
                sales_growth: '5%',
                EBIDT_growth: '7%',
                net_profit_growth: '3%',
                EPS_growth: '4%'
              },
              quarters: {
                'Sep-2024': { sales: 300000, EBIDT: 60000, net_profit: 45000, EPS: '0.75' }
              }
            }
          },
          {
            name: 'Company Y',
            price: '$40.00',
            market_cap: '$400M',
            PE_ratio: '14.0',
            financials: {
              YOY: {
                sales_growth: '12%',
                EBIDT_growth: '15%',
                net_profit_growth: '10%',
                EPS_growth: '11%'
              },
              quarters: {
                'Dec-2024': { sales: 400000, EBIDT: 80000, net_profit: 60000, EPS: '1.00' }
              }
            }
          }
        ]
      });

      const result = StorageService.importCompanyData(multipleCompaniesJSON);
      
      expect(result.isValid).toBe(true);
      expect(result.data).toHaveLength(2);
      expect(result.data![0].financials.quarters['Q2-2024']).toBeDefined();
      expect(result.data![1].financials.quarters['Q3-2024']).toBeDefined();
      expect(localStorageMock.setItem).toHaveBeenCalledTimes(2); // Once for each company
    });

    it('should handle invalid JSON gracefully', () => {
      const invalidJSON = 'invalid json string';
      
      const result = StorageService.importCompanyData(invalidJSON);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Invalid JSON format');
      expect(localStorageMock.setItem).not.toHaveBeenCalled();
    });

    it('should provide detailed error messages for validation failures', () => {
      const invalidDataJSON = JSON.stringify({
        company: {
          name: '', // Invalid empty name
          // Missing other required fields
        }
      });

      const result = StorageService.importCompanyData(invalidDataJSON);
      
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors.some(err => err.includes('name') || err.includes('price'))).toBe(true);
    });
  });

  describe('Error Handling and User Feedback', () => {
    it('should provide format-specific validation errors', () => {
      const invalidSingleFormat = {
        company: {
          name: 'Test',
          // Missing required fields
        }
      };

      const result = detectAndValidateJSONFormat(invalidSingleFormat);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Company:'))).toBe(true);
    });

    it('should provide company-specific errors for multiple companies format', () => {
      const invalidMultipleFormat = {
        companies: [
          {
            name: 'Valid Company',
            price: '$50.00',
            market_cap: '$500M',
            PE_ratio: '12.0',
            financials: {
              YOY: {
                sales_growth: '15%',
                EBIDT_growth: '18%',
                net_profit_growth: '12%',
                EPS_growth: '14%'
              },
              quarters: {
                'Jun-2024': { sales: 500000, EBIDT: 100000, net_profit: 75000, EPS: '1.25' }
              }
            }
          },
          {
            name: 'Invalid Company',
            // Missing required fields
          }
        ]
      };

      const result = detectAndValidateJSONFormat(invalidMultipleFormat);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('Company 2:'))).toBe(true);
    });

    it('should handle localStorage errors gracefully', () => {
      // Mock localStorage to throw an error
      localStorageMock.setItem.mockImplementation(() => {
        throw new Error('Storage quota exceeded');
      });

      const validJSON = JSON.stringify({
        company: {
          name: 'Test Company',
          price: '$100.00',
          market_cap: '$1B',
          PE_ratio: '15.5',
          financials: {
            YOY: {
              sales_growth: '10%',
              EBIDT_growth: '12%',
              net_profit_growth: '8%',
              EPS_growth: '9%'
            },
            quarters: {
              'Jun-2024': { sales: 1000000, EBIDT: 200000, net_profit: 150000, EPS: '2.50' }
            }
          }
        }
      });

      expect(() => {
        StorageService.importCompanyData(validJSON);
      }).toThrow();
    });
  });
});