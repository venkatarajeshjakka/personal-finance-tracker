import { describe, it, expect } from 'vitest';
import { CSVParserService } from '@/lib/utils/csv-parser';
import { NSECompanyCSVRow } from '@/types';

describe('CSVParserService', () => {
  const validCSVContent = `SYMBOL,NAME OF COMPANY,SERIES,DATE OF LISTING,PAID UP VALUE,MARKET LOT,ISIN NUMBER,FACE VALUE
RELIANCE,Reliance Industries Limited,EQ,29-Nov-1977,6765.69,1,INE002A01018,10
TCS,Tata Consultancy Services Limited,EQ,25-Aug-2004,9618.17,1,INE467B01029,1
INFY,Infosys Limited,EQ,08-Feb-1993,4239.08,1,INE009A01021,5`;

  const invalidCSVContent = `SYMBOL,NAME OF COMPANY,SERIES
RELIANCE,Reliance Industries Limited,EQ`;

  describe('validateCSVHeaders', () => {
    it('should validate correct headers', () => {
      const headers = [
        'SYMBOL',
        'NAME OF COMPANY',
        'SERIES',
        'DATE OF LISTING',
        'PAID UP VALUE',
        'MARKET LOT',
        'ISIN NUMBER',
        'FACE VALUE'
      ];
      
      const result = CSVParserService.validateCSVHeaders(headers);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject missing headers', () => {
      const headers = ['SYMBOL', 'NAME OF COMPANY'];
      
      const result = CSVParserService.validateCSVHeaders(headers);
      expect(result.isValid).toBe(false);
      expect(result.errors.length).toBeGreaterThan(0);
      expect(result.errors[0]).toContain('Missing required header');
    });

    it('should handle case insensitive headers', () => {
      const headers = [
        'symbol',
        'name of company',
        'series',
        'date of listing',
        'paid up value',
        'market lot',
        'isin number',
        'face value'
      ];
      
      const result = CSVParserService.validateCSVHeaders(headers);
      expect(result.isValid).toBe(true);
    });
  });

  describe('validateCSVRow', () => {
    const validRow: NSECompanyCSVRow = {
      SYMBOL: 'RELIANCE',
      'NAME OF COMPANY': 'Reliance Industries Limited',
      SERIES: 'EQ',
      'DATE OF LISTING': '29-Nov-1977',
      'PAID UP VALUE': '6765.69',
      'MARKET LOT': '1',
      'ISIN NUMBER': 'INE002A01018',
      'FACE VALUE': '10'
    };

    it('should validate correct row', () => {
      const result = CSVParserService.validateCSVRow(validRow, 1);
      expect(result.isValid).toBe(true);
      expect(result.errors).toHaveLength(0);
    });

    it('should reject row with missing symbol', () => {
      const invalidRow = { ...validRow, SYMBOL: '' };
      const result = CSVParserService.validateCSVRow(invalidRow, 1);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'SYMBOL')).toBe(true);
    });

    it('should reject row with invalid paid up value', () => {
      const invalidRow = { ...validRow, 'PAID UP VALUE': 'invalid' };
      const result = CSVParserService.validateCSVRow(invalidRow, 1);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'PAID UP VALUE')).toBe(true);
    });

    it('should reject row with invalid market lot', () => {
      const invalidRow = { ...validRow, 'MARKET LOT': 'invalid' };
      const result = CSVParserService.validateCSVRow(invalidRow, 1);
      expect(result.isValid).toBe(false);
      expect(result.errors.some(e => e.field === 'MARKET LOT')).toBe(true);
    });

    it('should warn about unusual ISIN format', () => {
      const invalidRow = { ...validRow, 'ISIN NUMBER': 'INVALID123' };
      const result = CSVParserService.validateCSVRow(invalidRow, 1);
      expect(result.warnings.some(w => w.field === 'ISIN NUMBER')).toBe(true);
    });
  });

  describe('convertCSVRowToNSECompany', () => {
    it('should convert valid CSV row to NSECompany', () => {
      const row: NSECompanyCSVRow = {
        SYMBOL: 'RELIANCE',
        'NAME OF COMPANY': 'Reliance Industries Limited',
        SERIES: 'EQ',
        'DATE OF LISTING': '29-Nov-1977',
        'PAID UP VALUE': '6765.69',
        'MARKET LOT': '1',
        'ISIN NUMBER': 'INE002A01018',
        'FACE VALUE': '10'
      };

      const company = CSVParserService.convertCSVRowToNSECompany(row);
      
      expect(company.symbol).toBe('RELIANCE');
      expect(company.companyName).toBe('Reliance Industries Limited');
      expect(company.series).toBe('EQ');
      expect(company.dateOfListing).toBe('29-Nov-1977');
      expect(company.paidUpValue).toBe(6765.69);
      expect(company.marketLot).toBe(1);
      expect(company.isinNumber).toBe('INE002A01018');
      expect(company.faceValue).toBe(10);
      expect(company.id).toContain('nse_RELIANCE_');
      expect(company.createdAt).toBeInstanceOf(Date);
    });

    it('should handle missing numeric values gracefully', () => {
      const row: NSECompanyCSVRow = {
        SYMBOL: 'TEST',
        'NAME OF COMPANY': 'Test Company',
        SERIES: 'EQ',
        'DATE OF LISTING': '01-Jan-2000',
        'PAID UP VALUE': '',
        'MARKET LOT': '',
        'ISIN NUMBER': 'INE000000000',
        'FACE VALUE': ''
      };

      const company = CSVParserService.convertCSVRowToNSECompany(row);
      
      expect(company.paidUpValue).toBe(0);
      expect(company.marketLot).toBe(1);
      expect(company.faceValue).toBe(0);
    });
  });

  describe('detectDuplicates', () => {
    it('should detect duplicate symbols', () => {
      const companies = [
        {
          id: '1',
          symbol: 'RELIANCE',
          companyName: 'Reliance Industries Limited',
          series: 'EQ',
          dateOfListing: '29-Nov-1977',
          paidUpValue: 6765.69,
          marketLot: 1,
          isinNumber: 'INE002A01018',
          faceValue: 10,
          createdAt: new Date()
        },
        {
          id: '2',
          symbol: 'TCS',
          companyName: 'Tata Consultancy Services Limited',
          series: 'EQ',
          dateOfListing: '25-Aug-2004',
          paidUpValue: 9618.17,
          marketLot: 1,
          isinNumber: 'INE467B01029',
          faceValue: 1,
          createdAt: new Date()
        },
        {
          id: '3',
          symbol: 'RELIANCE',
          companyName: 'Reliance Industries Limited (Duplicate)',
          series: 'EQ',
          dateOfListing: '29-Nov-1977',
          paidUpValue: 6765.69,
          marketLot: 1,
          isinNumber: 'INE002A01018',
          faceValue: 10,
          createdAt: new Date()
        }
      ];

      const report = CSVParserService.detectDuplicates(companies);
      
      expect(report.totalDuplicates).toBe(1);
      expect(report.duplicates).toHaveLength(1);
      expect(report.duplicates[0].symbol).toBe('RELIANCE');
      expect(report.duplicates[0].indices).toEqual([0, 2]);
      expect(report.duplicates[0].companyNames).toContain('Reliance Industries Limited');
      expect(report.duplicates[0].companyNames).toContain('Reliance Industries Limited (Duplicate)');
    });

    it('should handle case insensitive duplicates', () => {
      const companies = [
        {
          id: '1',
          symbol: 'RELIANCE',
          companyName: 'Reliance Industries Limited',
          series: 'EQ',
          dateOfListing: '29-Nov-1977',
          paidUpValue: 6765.69,
          marketLot: 1,
          isinNumber: 'INE002A01018',
          faceValue: 10,
          createdAt: new Date()
        },
        {
          id: '2',
          symbol: 'reliance',
          companyName: 'Reliance Industries Limited (lowercase)',
          series: 'EQ',
          dateOfListing: '29-Nov-1977',
          paidUpValue: 6765.69,
          marketLot: 1,
          isinNumber: 'INE002A01018',
          faceValue: 10,
          createdAt: new Date()
        }
      ];

      const report = CSVParserService.detectDuplicates(companies);
      
      expect(report.totalDuplicates).toBe(1);
      expect(report.duplicates[0].symbol).toBe('RELIANCE');
    });

    it('should return empty report for no duplicates', () => {
      const companies = [
        {
          id: '1',
          symbol: 'RELIANCE',
          companyName: 'Reliance Industries Limited',
          series: 'EQ',
          dateOfListing: '29-Nov-1977',
          paidUpValue: 6765.69,
          marketLot: 1,
          isinNumber: 'INE002A01018',
          faceValue: 10,
          createdAt: new Date()
        },
        {
          id: '2',
          symbol: 'TCS',
          companyName: 'Tata Consultancy Services Limited',
          series: 'EQ',
          dateOfListing: '25-Aug-2004',
          paidUpValue: 9618.17,
          marketLot: 1,
          isinNumber: 'INE467B01029',
          faceValue: 1,
          createdAt: new Date()
        }
      ];

      const report = CSVParserService.detectDuplicates(companies);
      
      expect(report.totalDuplicates).toBe(0);
      expect(report.duplicates).toHaveLength(0);
    });
  });

  describe('removeDuplicates', () => {
    it('should remove duplicate companies keeping first occurrence', () => {
      const companies = [
        {
          id: '1',
          symbol: 'RELIANCE',
          companyName: 'Reliance Industries Limited',
          series: 'EQ',
          dateOfListing: '29-Nov-1977',
          paidUpValue: 6765.69,
          marketLot: 1,
          isinNumber: 'INE002A01018',
          faceValue: 10,
          createdAt: new Date()
        },
        {
          id: '2',
          symbol: 'TCS',
          companyName: 'Tata Consultancy Services Limited',
          series: 'EQ',
          dateOfListing: '25-Aug-2004',
          paidUpValue: 9618.17,
          marketLot: 1,
          isinNumber: 'INE467B01029',
          faceValue: 1,
          createdAt: new Date()
        },
        {
          id: '3',
          symbol: 'RELIANCE',
          companyName: 'Reliance Industries Limited (Duplicate)',
          series: 'EQ',
          dateOfListing: '29-Nov-1977',
          paidUpValue: 6765.69,
          marketLot: 1,
          isinNumber: 'INE002A01018',
          faceValue: 10,
          createdAt: new Date()
        }
      ];

      const unique = CSVParserService.removeDuplicates(companies);
      
      expect(unique).toHaveLength(2);
      expect(unique[0].symbol).toBe('RELIANCE');
      expect(unique[0].companyName).toBe('Reliance Industries Limited'); // First occurrence
      expect(unique[1].symbol).toBe('TCS');
    });
  });

  describe('parseNSECompanyCSV', () => {
    it('should parse valid CSV content', async () => {
      const companies = await CSVParserService.parseNSECompanyCSV(validCSVContent);
      
      expect(companies).toHaveLength(3);
      expect(companies[0].symbol).toBe('RELIANCE');
      expect(companies[1].symbol).toBe('TCS');
      expect(companies[2].symbol).toBe('INFY');
    });

    it('should reject CSV with missing headers', async () => {
      await expect(CSVParserService.parseNSECompanyCSV(invalidCSVContent))
        .rejects.toThrow('Invalid CSV headers');
    });

    it('should reject empty CSV', async () => {
      await expect(CSVParserService.parseNSECompanyCSV(''))
        .rejects.toThrow('must contain at least a header row');
    });

    it('should handle CSV with quoted values', async () => {
      const csvWithQuotes = `SYMBOL,NAME OF COMPANY,SERIES,DATE OF LISTING,PAID UP VALUE,MARKET LOT,ISIN NUMBER,FACE VALUE
"RELIANCE","Reliance Industries Limited, Mumbai",EQ,29-Nov-1977,6765.69,1,INE002A01018,10`;

      const companies = await CSVParserService.parseNSECompanyCSV(csvWithQuotes);
      
      expect(companies).toHaveLength(1);
      expect(companies[0].companyName).toBe('Reliance Industries Limited, Mumbai');
    });

    it('should skip empty lines', async () => {
      const csvWithEmptyLines = `SYMBOL,NAME OF COMPANY,SERIES,DATE OF LISTING,PAID UP VALUE,MARKET LOT,ISIN NUMBER,FACE VALUE
RELIANCE,Reliance Industries Limited,EQ,29-Nov-1977,6765.69,1,INE002A01018,10

TCS,Tata Consultancy Services Limited,EQ,25-Aug-2004,9618.17,1,INE467B01029,1`;

      const companies = await CSVParserService.parseNSECompanyCSV(csvWithEmptyLines);
      
      expect(companies).toHaveLength(2);
    });
  });
});