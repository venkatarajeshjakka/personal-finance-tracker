import { describe, it, expect } from 'vitest';
import { CompanyNameMatcher } from '@/lib/utils/company-matcher';
import { NSECompany } from '@/types';

describe('CompanyNameMatcher', () => {
  const mockNSECompanies: NSECompany[] = [
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
      symbol: 'INFY',
      companyName: 'Infosys Limited',
      series: 'EQ',
      dateOfListing: '08-Feb-1993',
      paidUpValue: 4239.08,
      marketLot: 1,
      isinNumber: 'INE009A01021',
      faceValue: 5,
      createdAt: new Date()
    },
    {
      id: '4',
      symbol: 'HDFCBANK',
      companyName: 'HDFC Bank Limited',
      series: 'EQ',
      dateOfListing: '08-Nov-1995',
      paidUpValue: 7620.86,
      marketLot: 1,
      isinNumber: 'INE040A01034',
      faceValue: 1,
      createdAt: new Date()
    }
  ];

  describe('normalizeCompanyName', () => {
    it('should normalize company names correctly', () => {
      expect(CompanyNameMatcher.normalizeCompanyName('Reliance Industries Limited'))
        .toBe('reliance industries');
      
      expect(CompanyNameMatcher.normalizeCompanyName('Tata Consultancy Services Ltd.'))
        .toBe('tata consultancy services');
      
      expect(CompanyNameMatcher.normalizeCompanyName('HDFC Bank Ltd'))
        .toBe('hdfc bank');
      
      expect(CompanyNameMatcher.normalizeCompanyName('Infosys Limited (Pvt)'))
        .toBe('infosys');
    });

    it('should handle special characters and multiple spaces', () => {
      expect(CompanyNameMatcher.normalizeCompanyName('Company  Name  &  Co.  Ltd.'))
        .toBe('company name co');
      
      expect(CompanyNameMatcher.normalizeCompanyName('ABC-XYZ Corporation Inc.'))
        .toBe('abcxyz');
    });

    it('should handle empty and whitespace strings', () => {
      expect(CompanyNameMatcher.normalizeCompanyName('')).toBe('');
      expect(CompanyNameMatcher.normalizeCompanyName('   ')).toBe('');
    });
  });

  describe('calculateSimilarity', () => {
    it('should return 1.0 for identical strings', () => {
      const similarity = CompanyNameMatcher.calculateSimilarity('Reliance Industries', 'Reliance Industries');
      expect(similarity).toBe(1.0);
    });

    it('should return high similarity for case differences', () => {
      const similarity = CompanyNameMatcher.calculateSimilarity('Reliance Industries', 'reliance industries');
      expect(similarity).toBe(0.95);
    });

    it('should return high similarity for substring matches', () => {
      const similarity = CompanyNameMatcher.calculateSimilarity('Reliance', 'Reliance Industries Limited');
      expect(similarity).toBeGreaterThan(0.7);
    });

    it('should return low similarity for completely different strings', () => {
      const similarity = CompanyNameMatcher.calculateSimilarity('Reliance Industries', 'Microsoft Corporation');
      expect(similarity).toBeLessThan(0.3);
    });

    it('should handle empty strings', () => {
      const similarity = CompanyNameMatcher.calculateSimilarity('', 'Reliance');
      expect(similarity).toBe(0);
      
      const similarity2 = CompanyNameMatcher.calculateSimilarity('Reliance', '');
      expect(similarity2).toBe(0);
    });
  });

  describe('findBestMatch', () => {
    it('should find exact match with high confidence', () => {
      const result = CompanyNameMatcher.findBestMatch('Reliance Industries Limited', mockNSECompanies);
      
      expect(result.match).not.toBeNull();
      expect(result.match?.symbol).toBe('RELIANCE');
      expect(result.confidence).toBeGreaterThan(0.9);
    });

    it('should find partial match with medium confidence', () => {
      const result = CompanyNameMatcher.findBestMatch('Reliance Industries', mockNSECompanies);
      
      expect(result.match).not.toBeNull();
      expect(result.match?.symbol).toBe('RELIANCE');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should find match for abbreviated name', () => {
      const result = CompanyNameMatcher.findBestMatch('TCS', mockNSECompanies);
      
      expect(result.suggestions.length).toBeGreaterThan(0);
      // TCS might not be a high confidence match due to abbreviation
    });

    it('should return null match for low confidence', () => {
      const result = CompanyNameMatcher.findBestMatch('Unknown Company Name', mockNSECompanies);
      
      expect(result.match).toBeNull();
      expect(result.confidence).toBeLessThan(0.7);
    });

    it('should provide suggestions even when no high confidence match', () => {
      const result = CompanyNameMatcher.findBestMatch('Reliance Corp', mockNSECompanies);
      
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0].symbol).toBe('RELIANCE');
    });

    it('should handle empty input', () => {
      const result = CompanyNameMatcher.findBestMatch('', mockNSECompanies);
      
      expect(result.match).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.suggestions).toHaveLength(0);
    });

    it('should handle empty NSE companies list', () => {
      const result = CompanyNameMatcher.findBestMatch('Reliance Industries', []);
      
      expect(result.match).toBeNull();
      expect(result.confidence).toBe(0);
      expect(result.suggestions).toHaveLength(0);
    });
  });

  describe('suggestCorrections', () => {
    it('should suggest corrections for misspelled names', () => {
      const suggestions = CompanyNameMatcher.suggestCorrections('Reliance Industires', mockNSECompanies);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions[0].symbol).toBe('RELIANCE');
    });

    it('should suggest corrections for partial names', () => {
      const suggestions = CompanyNameMatcher.suggestCorrections('HDFC Bank', mockNSECompanies);
      
      expect(suggestions.length).toBeGreaterThan(0);
      expect(suggestions.some(s => s.symbol === 'HDFCBANK')).toBe(true);
    });

    it('should return empty array for no matches', () => {
      const suggestions = CompanyNameMatcher.suggestCorrections('Completely Unknown Company', mockNSECompanies);
      
      expect(suggestions).toHaveLength(0);
    });
  });

  describe('validateAndCorrectCompanyName', () => {
    it('should return corrected name and symbol for high confidence match', () => {
      const result = CompanyNameMatcher.validateAndCorrectCompanyName('Reliance Industries Limited', mockNSECompanies);
      
      expect(result.correctedName).toBe('Reliance Industries Limited');
      expect(result.symbol).toBe('RELIANCE');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should return original name for low confidence match', () => {
      const result = CompanyNameMatcher.validateAndCorrectCompanyName('Unknown Company', mockNSECompanies);
      
      expect(result.correctedName).toBe('Unknown Company');
      expect(result.symbol).toBeUndefined();
      expect(result.confidence).toBe(0);
    });

    it('should handle case variations', () => {
      const result = CompanyNameMatcher.validateAndCorrectCompanyName('reliance industries limited', mockNSECompanies);
      
      expect(result.correctedName).toBe('Reliance Industries Limited');
      expect(result.symbol).toBe('RELIANCE');
      expect(result.confidence).toBeGreaterThan(0.7);
    });

    it('should handle partial matches', () => {
      const result = CompanyNameMatcher.validateAndCorrectCompanyName('Infosys', mockNSECompanies);
      
      expect(result.correctedName).toBe('Infosys Limited');
      expect(result.symbol).toBe('INFY');
      expect(result.confidence).toBeGreaterThan(0.7);
    });
  });

  describe('edge cases', () => {
    it('should handle companies with similar names', () => {
      const companiesWithSimilarNames: NSECompany[] = [
        {
          id: '1',
          symbol: 'HDFC',
          companyName: 'Housing Development Finance Corporation Limited',
          series: 'EQ',
          dateOfListing: '08-Nov-1995',
          paidUpValue: 7620.86,
          marketLot: 1,
          isinNumber: 'INE001A01036',
          faceValue: 2,
          createdAt: new Date()
        },
        {
          id: '2',
          symbol: 'HDFCBANK',
          companyName: 'HDFC Bank Limited',
          series: 'EQ',
          dateOfListing: '08-Nov-1995',
          paidUpValue: 7620.86,
          marketLot: 1,
          isinNumber: 'INE040A01034',
          faceValue: 1,
          createdAt: new Date()
        }
      ];

      const result = CompanyNameMatcher.findBestMatch('HDFC Bank', companiesWithSimilarNames);
      
      expect(result.match?.symbol).toBe('HDFCBANK');
      expect(result.suggestions.length).toBeGreaterThan(0);
    });

    it('should handle very long company names', () => {
      const longName = 'A'.repeat(200);
      const result = CompanyNameMatcher.findBestMatch(longName, mockNSECompanies);
      
      expect(result.match).toBeNull();
      expect(result.confidence).toBeLessThan(0.7);
    });

    it('should handle special characters in company names', () => {
      const result = CompanyNameMatcher.findBestMatch('Reliance Industries Ltd. & Co.', mockNSECompanies);
      
      expect(result.suggestions.length).toBeGreaterThan(0);
      expect(result.suggestions[0].symbol).toBe('RELIANCE');
    });
  });
});