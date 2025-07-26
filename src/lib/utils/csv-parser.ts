import { NSECompany, NSECompanyCSVRow, DuplicateReport, CSVValidationResult, ValidationError } from '@/types';

export class CSVParserService {
  private static readonly REQUIRED_HEADERS = [
    'SYMBOL',
    'NAME OF COMPANY',
    'SERIES',
    'DATE OF LISTING',
    'PAID UP VALUE',
    'MARKET LOT',
    'ISIN NUMBER',
    'FACE VALUE'
  ];

  /**
   * Parse NSE company CSV content and convert to NSECompany array
   */
  static async parseNSECompanyCSV(csvContent: string): Promise<NSECompany[]> {
    try {
      const lines = csvContent.trim().split('\n');
      if (lines.length < 2) {
        throw new ValidationError('CSV file must contain at least a header row and one data row');
      }

      const headers = this.parseCSVLine(lines[0]);
      const validationResult = this.validateCSVHeaders(headers);
      
      if (!validationResult.isValid) {
        throw new ValidationError(`Invalid CSV headers: ${validationResult.errors.join(', ')}`);
      }

      const companies: NSECompany[] = [];
      const errors: Array<{ row: number; message: string }> = [];

      for (let i = 1; i < lines.length; i++) {
        try {
          const values = this.parseCSVLine(lines[i]);
          if (values.length === 0 || values.every(v => !v || !v.trim())) {
            continue; // Skip empty lines
          }

          const rowData = this.createRowObject(headers, values);
          const rowValidation = this.validateCSVRow(rowData, i + 1);
          
          if (rowValidation.isValid) {
            const company = this.convertCSVRowToNSECompany(rowData);
            companies.push(company);
          } else {
            errors.push({
              row: i + 1,
              message: rowValidation.errors.map(e => e.message).join('; ')
            });
          }
        } catch (error) {
          errors.push({
            row: i + 1,
            message: error instanceof Error ? error.message : 'Unknown parsing error'
          });
        }
      }

      if (errors.length > 0 && companies.length === 0) {
        throw new ValidationError(`Failed to parse any valid companies. Errors: ${errors.map(e => `Row ${e.row}: ${e.message}`).join('; ')}`);
      }

      return companies;
    } catch (error) {
      if (error instanceof ValidationError) {
        throw error;
      }
      throw new ValidationError(`CSV parsing failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Parse a single CSV line handling quoted values and commas
   */
  private static parseCSVLine(line: string): string[] {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add the last field
    result.push(current.trim());
    return result;
  }

  /**
   * Create row object from headers and values
   */
  private static createRowObject(headers: string[], values: string[]): NSECompanyCSVRow {
    const row: any = {};
    headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });
    return row as NSECompanyCSVRow;
  }

  /**
   * Validate CSV headers contain all required fields
   */
  static validateCSVHeaders(headers: string[]): { isValid: boolean; errors: string[] } {
    const errors: string[] = [];
    const normalizedHeaders = headers.map(h => (h || '').trim().toUpperCase());
    
    for (const requiredHeader of this.REQUIRED_HEADERS) {
      if (!normalizedHeaders.includes(requiredHeader.toUpperCase())) {
        errors.push(`Missing required header: ${requiredHeader}`);
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  /**
   * Validate a single CSV row
   */
  static validateCSVRow(row: NSECompanyCSVRow, rowIndex: number): CSVValidationResult {
    const errors: Array<{ row: number; field: string; message: string }> = [];
    const warnings: Array<{ row: number; field: string; message: string }> = [];

    // Validate SYMBOL
    if (!row.SYMBOL || typeof row.SYMBOL !== 'string' || !row.SYMBOL.trim()) {
      errors.push({ row: rowIndex, field: 'SYMBOL', message: 'Symbol is required' });
    } else if (row.SYMBOL.length > 20) {
      warnings.push({ row: rowIndex, field: 'SYMBOL', message: 'Symbol is unusually long' });
    }

    // Validate NAME OF COMPANY
    if (!row['NAME OF COMPANY'] || typeof row['NAME OF COMPANY'] !== 'string' || !row['NAME OF COMPANY'].trim()) {
      errors.push({ row: rowIndex, field: 'NAME OF COMPANY', message: 'Company name is required' });
    }

    // Validate SERIES
    if (!row.SERIES || typeof row.SERIES !== 'string' || !row.SERIES.trim()) {
      errors.push({ row: rowIndex, field: 'SERIES', message: 'Series is required' });
    }

    // Validate DATE OF LISTING
    if (!row['DATE OF LISTING'] || typeof row['DATE OF LISTING'] !== 'string' || !row['DATE OF LISTING'].trim()) {
      errors.push({ row: rowIndex, field: 'DATE OF LISTING', message: 'Date of listing is required' });
    } else {
      const datePattern = /^\d{2}-\w{3}-\d{4}$/; // DD-MMM-YYYY format
      if (!datePattern.test(row['DATE OF LISTING'])) {
        warnings.push({ row: rowIndex, field: 'DATE OF LISTING', message: 'Date format should be DD-MMM-YYYY' });
      }
    }

    // Validate PAID UP VALUE
    if (!row['PAID UP VALUE'] || typeof row['PAID UP VALUE'] !== 'string' || !row['PAID UP VALUE'].trim()) {
      errors.push({ row: rowIndex, field: 'PAID UP VALUE', message: 'Paid up value is required' });
    } else {
      const paidUpValue = parseFloat(row['PAID UP VALUE']);
      if (isNaN(paidUpValue) || paidUpValue < 0) {
        errors.push({ row: rowIndex, field: 'PAID UP VALUE', message: 'Paid up value must be a valid positive number' });
      }
    }

    // Validate MARKET LOT
    if (!row['MARKET LOT'] || typeof row['MARKET LOT'] !== 'string' || !row['MARKET LOT'].trim()) {
      errors.push({ row: rowIndex, field: 'MARKET LOT', message: 'Market lot is required' });
    } else {
      const marketLot = parseInt(row['MARKET LOT']);
      if (isNaN(marketLot) || marketLot <= 0) {
        errors.push({ row: rowIndex, field: 'MARKET LOT', message: 'Market lot must be a valid positive integer' });
      }
    }

    // Validate ISIN NUMBER
    if (!row['ISIN NUMBER'] || typeof row['ISIN NUMBER'] !== 'string' || !row['ISIN NUMBER'].trim()) {
      errors.push({ row: rowIndex, field: 'ISIN NUMBER', message: 'ISIN number is required' });
    } else {
      const isinPattern = /^[A-Z]{2}[A-Z0-9]{10}$/;
      if (!isinPattern.test(row['ISIN NUMBER'])) {
        warnings.push({ row: rowIndex, field: 'ISIN NUMBER', message: 'ISIN format should be 12 characters (2 letters + 10 alphanumeric)' });
      }
    }

    // Validate FACE VALUE
    if (!row['FACE VALUE'] || typeof row['FACE VALUE'] !== 'string' || !row['FACE VALUE'].trim()) {
      errors.push({ row: rowIndex, field: 'FACE VALUE', message: 'Face value is required' });
    } else {
      const faceValue = parseFloat(row['FACE VALUE']);
      if (isNaN(faceValue) || faceValue < 0) {
        errors.push({ row: rowIndex, field: 'FACE VALUE', message: 'Face value must be a valid positive number' });
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      processedCount: 1,
      duplicateCount: 0
    };
  }

  /**
   * Convert CSV row to NSECompany object
   */
  static convertCSVRowToNSECompany(row: NSECompanyCSVRow): NSECompany {
    return {
      id: `nse_${row.SYMBOL}_${Date.now()}`,
      symbol: (row.SYMBOL || '').trim(),
      companyName: (row['NAME OF COMPANY'] || '').trim(),
      series: (row.SERIES || '').trim(),
      dateOfListing: (row['DATE OF LISTING'] || '').trim(),
      paidUpValue: parseFloat(row['PAID UP VALUE']) || 0,
      marketLot: parseInt(row['MARKET LOT']) || 1,
      isinNumber: (row['ISIN NUMBER'] || '').trim(),
      faceValue: parseFloat(row['FACE VALUE']) || 0,
      createdAt: new Date()
    };
  }

  /**
   * Detect duplicate companies in the array
   */
  static detectDuplicates(companies: NSECompany[]): DuplicateReport {
    const symbolMap = new Map<string, { indices: number[]; companyNames: string[] }>();
    
    companies.forEach((company, index) => {
      const symbol = company.symbol.toUpperCase();
      if (symbolMap.has(symbol)) {
        const existing = symbolMap.get(symbol)!;
        existing.indices.push(index);
        if (!existing.companyNames.includes(company.companyName)) {
          existing.companyNames.push(company.companyName);
        }
      } else {
        symbolMap.set(symbol, {
          indices: [index],
          companyNames: [company.companyName]
        });
      }
    });

    const duplicates = Array.from(symbolMap.entries())
      .filter(([_, data]) => data.indices.length > 1)
      .map(([symbol, data]) => ({
        symbol,
        indices: data.indices,
        companyNames: data.companyNames
      }));

    return {
      duplicates,
      totalDuplicates: duplicates.reduce((sum, dup) => sum + dup.indices.length - 1, 0)
    };
  }

  /**
   * Remove duplicates keeping the first occurrence
   */
  static removeDuplicates(companies: NSECompany[]): NSECompany[] {
    const seen = new Set<string>();
    return companies.filter(company => {
      const symbol = company.symbol.toUpperCase();
      if (seen.has(symbol)) {
        return false;
      }
      seen.add(symbol);
      return true;
    });
  }
}