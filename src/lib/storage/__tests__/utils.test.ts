import { describe, it, expect, vi } from 'vitest';
import {
  generateId,
  categorizeQuarter,
  normalizeQuarterKeys,
  validateQuarterData,
  detectAndValidateJSONFormat,
  normalizeCompanyData,
  safeSerialize,
  safeDeserialize,
  validateLocalStorageAvailability
} from '../utils';
// QuarterData type is used in the tests but not directly imported as a value

describe('Storage Utils', () => {
  describe('generateId', () => {
    it('should generate unique IDs', () => {
      const id1 = generateId();
      const id2 = generateId();
      
      expect(id1).not.toBe(id2);
      expect(typeof id1).toBe('string');
      expect(id1.length).toBeGreaterThan(10);
    });

    it('should generate IDs with timestamp and random components', () => {
      const id = generateId();
      const parts = id.split('-');
      
      expect(parts).toHaveLength(2);
      expect(parseInt(parts[0])).toBeGreaterThan(0); // Timestamp part
      expect(parts[1].length).toBeGreaterThan(5); // Random part
    });
  });

  describe('categorizeQuarter', () => {
    it('should map months to correct quarters', () => {
      const testCases = [
        { input: 'Jun-2024', expected: 'Q1-2024' },
        { input: 'Sep-2024', expected: 'Q2-2024' },
        { input: 'Dec-2024', expected: 'Q3-2024' },
        { input: 'Mar-2024', expected: 'Q4-2024' }
      ];

      testCases.forEach(({ input, expected }) => {
        expect(categorizeQuarter(input)).toBe(expected);
      });
    });

    it('should handle different date formats', () => {
      expect(categorizeQuarter('Jun 2024')).toBe('Q1-2024');
      expect(categorizeQuarter('2024-Jun')).toBe('Q1-2024');
      expect(categorizeQuarter('Jun-24')).toBe('Q1-24');
    });

    it('should handle case insensitive month names', () => {
      expect(categorizeQuarter('jun-2024')).toBe('Q1-2024');
      expect(categorizeQuarter('JUN-2024')).toBe('Q1-2024');
      expect(categorizeQuarter('Jun-2024')).toBe('Q1-2024');
    });

    it('should return original string for unmapped months', () => {
      expect(categorizeQuarter('Jan-2024')).toBe('Jan-2024');
      expect(categorizeQuarter('Apr-2024')).toBe('Apr-2024');
      expect(categorizeQuarter('Jul-2024')).toBe('Jul-2024');
      expect(categorizeQuarter('Oct-2024')).toBe('Oct-2024');
    });

    it('should handle missing year', () => {
      const currentYear = new Date().getFullYear().toString();
      expect(categorizeQuarter('Jun')).toBe(`Q1-${currentYear}`);
      expect(categorizeQuarter('Sep')).toBe(`Q2-${currentYear}`);
    });

    it('should handle invalid input gracefully', () => {
      expect(categorizeQuarter('')).toBe('');
      expect(categorizeQuarter('invalid')).toBe('invalid');
      expect(categorizeQuarter('123')).toBe('123');
    });
  });

  describe('normalizeQuarterKeys', () => {
    it('should normalize all quarter keys', () => {
      const input = {
        'Jun-2024': { sales: 1000, EBIDT: 200, net_profit: 150, EPS: '2.50' },
        'Sep-2024': { sales: 1100, EBIDT: 220, net_profit: 165, EPS: '2.75' },
        'Dec-2024': { sales: 1200, EBIDT: 240, net_profit: 180, EPS: '3.00' },
        'Mar-2025': { sales: 1300, EBIDT: 260, net_profit: 195, EPS: '3.25' }
      };

      const result = normalizeQuarterKeys(input);

      expect(result).toEqual({
        'Q1-2024': { sales: 1000, EBIDT: 200, net_profit: 150, EPS: '2.50' },
        'Q2-2024': { sales: 1100, EBIDT: 220, net_profit: 165, EPS: '2.75' },
        'Q3-2024': { sales: 1200, EBIDT: 240, net_profit: 180, EPS: '3.00' },
        'Q4-2025': { sales: 1300, EBIDT: 260, net_profit: 195, EPS: '3.25' }
      });
    });

    it('should preserve already normalized keys', () => {
      const input = {
        'Q1-2024': { sales: 1000, EBIDT: 200, net_profit: 150, EPS: '2.50' },
        'Q2-2024': { sales: 1100, EBIDT: 220, net_profit: 165, EPS: '2.75' }
      };

      const result = normalizeQuarterKeys(input);
      expect(result).toEqual(input);
    });

    it('should handle mixed normalized and non-normalized keys', () => {
      const input = {
        'Q1-2024': { sales: 1000, EBIDT: 200, net_profit: 150, EPS: '2.50' },
        'Sep-2024': { sales: 1100, EBIDT: 220, net_profit: 165, EPS: '2.75' }
      };

      const result = normalizeQuarterKeys(input);

      expect(result).toEqual({
        'Q1-2024': { sales: 1000, EBIDT: 200, net_profit: 150, EPS: '2.50' },
        'Q2-2024': { sales: 1100, EBIDT: 220, net_profit: 165, EPS: '2.75' }
      });
    });

    it('should handle empty input', () => {
      expect(normalizeQuarterKeys({})).toEqual({});
    });
  });

  describe('validateQuarterData', () => {
    it('should validate correct quarter data', () => {
      const validData = {
        'Q1-2024': {
          sales: 1000000,
          EBIDT: 200000,
          net_profit: 150000,
          EPS: '2.50'
        }
      };

      const result = validateQuarterData(validData);
      expect(result.isValid).toBe(true);
      expect(result.data).toEqual(validData);
      expect(result.errors).toHaveLength(0);
    });

    it('should convert string numbers to numbers', () => {
      const dataWithStrings = {
        'Q1-2024': {
          sales: '1000000',
          EBIDT: '200000',
          net_profit: '150000',
          EPS: 2.50
        }
      };

      const result = validateQuarterData(dataWithStrings);
      expect(result.isValid).toBe(true);
      expect(result.data!['Q1-2024'].sales).toBe(1000000);
      expect(result.data!['Q1-2024'].EPS).toBe('2.5');
    });

    it('should reject invalid data types', () => {
      const invalidData = {
        'Q1-2024': {
          sales: 'invalid',
          EBIDT: null,
          net_profit: undefined,
          EPS: {}
        }
      };

      const result = validateQuarterData(invalidData);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
    });

    it('should handle missing fields', () => {
      const incompleteData = {
        'Q1-2024': {
          sales: 1000000
          // Missing other required fields
        }
      };

      const result = validateQuarterData(incompleteData);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(err => err.includes('EBIDT'))).toBe(true);
    });

    it('should validate multiple quarters', () => {
      const multipleQuarters = {
        'Q1-2024': {
          sales: 1000000,
          EBIDT: 200000,
          net_profit: 150000,
          EPS: '2.50'
        },
        'Q2-2024': {
          sales: 1100000,
          EBIDT: 220000,
          net_profit: 165000,
          EPS: '2.75'
        }
      };

      const result = validateQuarterData(multipleQuarters);
      expect(result.isValid).toBe(true);
      expect(Object.keys(result.data!)).toHaveLength(2);
    });
  });

  describe('safeSerialize and safeDeserialize', () => {
    it('should serialize and deserialize data correctly', () => {
      const testData = {
        string: 'test',
        number: 123,
        boolean: true,
        date: new Date('2024-01-01'),
        nested: {
          array: [1, 2, 3],
          object: { key: 'value' }
        }
      };

      const serialized = safeSerialize(testData);
      const deserialized = safeDeserialize<typeof testData>(serialized);

      expect(deserialized.string).toBe(testData.string);
      expect(deserialized.number).toBe(testData.number);
      expect(deserialized.boolean).toBe(testData.boolean);
      expect(deserialized.date).toEqual(testData.date);
      expect(deserialized.nested).toEqual(testData.nested);
    });

    it('should handle Date objects in serialization', () => {
      const dataWithDate = {
        createdAt: new Date('2024-01-01T10:00:00Z'),
        updatedAt: new Date('2024-01-02T15:30:00Z')
      };

      const serialized = safeSerialize(dataWithDate);
      expect(serialized).toContain('2024-01-01T10:00:00.000Z');
      
      const deserialized = safeDeserialize<typeof dataWithDate>(serialized);
      expect(deserialized.createdAt).toBeInstanceOf(Date);
      expect(deserialized.createdAt.getTime()).toBe(dataWithDate.createdAt.getTime());
    });

    it('should throw DataError for invalid serialization', () => {
      const circularRef: any = {};
      circularRef.self = circularRef;

      expect(() => safeSerialize(circularRef)).toThrow();
    });

    it('should throw DataError for invalid JSON', () => {
      expect(() => safeDeserialize('invalid json')).toThrow();
    });
  });

  describe('validateLocalStorageAvailability', () => {
    it('should validate localStorage availability in browser environment', () => {
      // Mock window and localStorage
      const mockLocalStorage = {
        setItem: vi.fn(),
        getItem: vi.fn().mockReturnValue('test'),
        removeItem: vi.fn()
      };

      Object.defineProperty(window, 'localStorage', {
        value: mockLocalStorage,
        writable: true
      });

      const result = validateLocalStorageAvailability();
      expect(result.isValid).toBe(true);
      expect(mockLocalStorage.setItem).toHaveBeenCalled();
      expect(mockLocalStorage.getItem).toHaveBeenCalled();
      expect(mockLocalStorage.removeItem).toHaveBeenCalled();
    });
  });

  describe('Integration Tests', () => {
    it('should handle complete data flow from JSON to normalized companies', () => {
      const inputJSON = {
        companies: [
          {
            name: 'Tech Corp',
            price: '$150.00',
            market_cap: '$15B',
            PE_ratio: '25.0',
            financials: {
              YOY: {
                sales_growth: '20%',
                EBIDT_growth: '25%',
                net_profit_growth: '18%',
                EPS_growth: '22%'
              },
              quarters: {
                'Jun-2024': { sales: 5000000, EBIDT: 1000000, net_profit: 750000, EPS: '12.50' },
                'Sep-2024': { sales: 5500000, EBIDT: 1100000, net_profit: 825000, EPS: '13.75' }
              }
            }
          }
        ]
      };

      // Validate JSON format
      const validation = detectAndValidateJSONFormat(inputJSON);
      expect(validation.isValid).toBe(true);

      // Normalize to internal format
      const normalized = normalizeCompanyData(validation.data!);
      expect(normalized).toHaveLength(1);

      const company = normalized[0];
      expect(company.company).toBe('Tech Corp');
      expect(company.id).toBeDefined();
      expect(company.createdAt).toBeInstanceOf(Date);
      expect(company.updatedAt).toBeInstanceOf(Date);

      // Check quarter normalization
      expect(company.financials.quarters['Q1-2024']).toBeDefined();
      expect(company.financials.quarters['Q2-2024']).toBeDefined();
      expect(company.financials.quarters['Q1-2024'].sales).toBe(5000000);
      expect(company.financials.quarters['Q2-2024'].sales).toBe(5500000);
    });

    it('should preserve data integrity through serialization cycle', () => {
      const originalData = {
        id: 'test-123',
        company: 'Test Company',
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
            'Q1-2024': { sales: 1000000, EBIDT: 200000, net_profit: 150000, EPS: '2.50' }
          }
        },
        createdAt: new Date('2024-01-01'),
        updatedAt: new Date('2024-01-02')
      };

      const serialized = safeSerialize(originalData);
      const deserialized = safeDeserialize<typeof originalData>(serialized);

      expect(deserialized).toEqual(originalData);
      expect(deserialized.createdAt).toBeInstanceOf(Date);
      expect(deserialized.updatedAt).toBeInstanceOf(Date);
    });
  });
});