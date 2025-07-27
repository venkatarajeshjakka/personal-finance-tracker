import { CompanyFinancials, NSECompany } from '@/types';
import { CompanyNameMatcher } from './company-matcher';

export interface NameCorrectionValidation {
  isValid: boolean;
  confidence: number;
  originalName: string;
  suggestedName: string;
  symbol?: string;
  warnings: string[];
  errors: string[];
  requiresManualReview: boolean;
}

export interface SymbolValidation {
  isValid: boolean;
  symbol: string;
  warnings: string[];
  errors: string[];
}

export interface CompanyValidation {
  isValid: boolean;
  company: CompanyFinancials;
  nameValidation: NameCorrectionValidation;
  symbolValidation?: SymbolValidation;
  overallWarnings: string[];
  overallErrors: string[];
}

export class ValidationService {
  // Minimum confidence threshold for automatic corrections
  private static readonly AUTO_CORRECT_THRESHOLD = 0.8;
  private static readonly MANUAL_REVIEW_THRESHOLD = 0.5;

  /**
   * Validate name correction and symbol assignment for a company
   */
  static validateNameCorrection(
    originalName: string,
    nseCompanies: NSECompany[]
  ): NameCorrectionValidation {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Basic name validation
    if (!originalName || typeof originalName !== 'string') {
      errors.push('Company name is required and must be a string');
      return {
        isValid: false,
        confidence: 0,
        originalName: originalName || '',
        suggestedName: originalName || '',
        warnings,
        errors,
        requiresManualReview: true
      };
    }

    const trimmedName = originalName.trim();
    if (trimmedName.length === 0) {
      errors.push('Company name cannot be empty');
      return {
        isValid: false,
        confidence: 0,
        originalName,
        suggestedName: originalName,
        warnings,
        errors,
        requiresManualReview: true
      };
    }

    if (trimmedName.length < 2) {
      warnings.push('Company name is very short and may cause matching issues');
    }

    if (trimmedName.length > 100) {
      warnings.push('Company name is unusually long');
    }

    // Check for NSE companies availability
    if (nseCompanies.length === 0) {
      warnings.push('NSE company list is not available for name validation');
      return {
        isValid: true,
        confidence: 0,
        originalName,
        suggestedName: originalName,
        warnings,
        errors,
        requiresManualReview: false
      };
    }

    // Find best match using company matcher
    const matchResult = CompanyNameMatcher.findBestMatch(trimmedName, nseCompanies);

    let suggestedName = originalName;
    let symbol: string | undefined;
    let confidence = 0;
    let requiresManualReview = false;

    if (matchResult.match) {
      confidence = matchResult.confidence;
      suggestedName = matchResult.match.companyName;
      symbol = matchResult.match.symbol;

      if (confidence >= this.AUTO_CORRECT_THRESHOLD) {
        // High confidence - safe for automatic correction
        if (originalName !== suggestedName) {
          warnings.push(`High confidence name correction: "${originalName}" → "${suggestedName}"`);
        }
      } else if (confidence >= this.MANUAL_REVIEW_THRESHOLD) {
        // Medium confidence - requires manual review
        requiresManualReview = true;
        warnings.push(
          `Medium confidence match found (${Math.round(confidence * 100)}%). Manual review recommended.`
        );
        
        if (matchResult.suggestions.length > 0) {
          const suggestionNames = matchResult.suggestions.slice(0, 3).map(s => s.companyName);
          warnings.push(`Other suggestions: ${suggestionNames.join(', ')}`);
        }
      } else {
        // Low confidence - likely not a good match
        suggestedName = originalName; // Keep original name
        symbol = undefined;
        warnings.push(`Low confidence match (${Math.round(confidence * 100)}%). Using original name.`);
        
        if (matchResult.suggestions.length > 0) {
          const suggestionNames = matchResult.suggestions.slice(0, 3).map(s => s.companyName);
          warnings.push(`Possible matches for manual review: ${suggestionNames.join(', ')}`);
          requiresManualReview = true;
        }
      }
    } else {
      warnings.push('No matching NSE company found');
      requiresManualReview = true;
    }

    return {
      isValid: errors.length === 0,
      confidence,
      originalName,
      suggestedName,
      symbol,
      warnings,
      errors,
      requiresManualReview
    };
  }

  /**
   * Validate symbol format and uniqueness
   */
  static validateSymbol(symbol: string, existingSymbols: string[] = []): SymbolValidation {
    const warnings: string[] = [];
    const errors: string[] = [];

    if (!symbol || typeof symbol !== 'string') {
      errors.push('Symbol must be a non-empty string');
      return { isValid: false, symbol: symbol || '', warnings, errors };
    }

    const trimmedSymbol = symbol.trim().toUpperCase();

    // Format validation
    if (!/^[A-Z0-9]+$/.test(trimmedSymbol)) {
      errors.push('Symbol must contain only uppercase letters and numbers');
    }

    if (trimmedSymbol.length < 1) {
      errors.push('Symbol cannot be empty');
    }

    if (trimmedSymbol.length > 20) {
      errors.push('Symbol is too long (maximum 20 characters)');
    }

    if (trimmedSymbol.length < 2) {
      warnings.push('Symbol is very short');
    }

    // Uniqueness validation
    if (existingSymbols.includes(trimmedSymbol)) {
      errors.push(`Symbol "${trimmedSymbol}" is already in use`);
    }

    // Pattern validation
    if (/^\d+$/.test(trimmedSymbol)) {
      warnings.push('Symbol contains only numbers, which is unusual');
    }

    if (trimmedSymbol.includes('0') || trimmedSymbol.includes('1')) {
      warnings.push('Symbol contains numbers that might be confused with letters (0/O, 1/I)');
    }

    return {
      isValid: errors.length === 0,
      symbol: trimmedSymbol,
      warnings,
      errors
    };
  }

  /**
   * Comprehensive validation of a company with name correction and symbol validation
   */
  static validateCompany(
    company: CompanyFinancials,
    nseCompanies: NSECompany[],
    existingSymbols: string[] = []
  ): CompanyValidation {
    const overallWarnings: string[] = [];
    const overallErrors: string[] = [];

    // Validate name correction
    const nameValidation = this.validateNameCorrection(company.company, nseCompanies);

    // Validate symbol if present
    let symbolValidation: SymbolValidation | undefined;
    if (nameValidation.symbol || company.symbol) {
      const symbolToValidate = nameValidation.symbol || company.symbol!;
      symbolValidation = this.validateSymbol(symbolToValidate, existingSymbols);
    }

    // Additional company data validation
    if (!company.id || company.id.trim().length === 0) {
      overallErrors.push('Company ID is required');
    }

    if (!company.financials || !company.financials.quarters) {
      overallErrors.push('Financial quarters data is required');
    } else {
      const quarters = Object.keys(company.financials.quarters);
      if (quarters.length === 0) {
        overallErrors.push('At least one quarter of financial data is required');
      }

      // Validate financial data quality
      Object.entries(company.financials.quarters).forEach(([quarter, data]) => {
        if (typeof data.sales !== 'number' || data.sales < 0) {
          overallWarnings.push(`Invalid or negative sales value in ${quarter}`);
        }
        
        if (typeof data.EBIDT !== 'number') {
          overallWarnings.push(`Invalid EBIDT value in ${quarter}`);
        }
        
        if (typeof data.net_profit !== 'number') {
          overallWarnings.push(`Invalid net profit value in ${quarter}`);
        }
        
        if (data.net_profit < -data.sales * 2) {
          overallWarnings.push(`Unusually large loss in ${quarter} (exceeds 200% of sales)`);
        }
      });
    }

    // Validate other fields
    if (company.price && typeof company.price === 'string') {
      const priceNum = parseFloat(company.price.replace(/[^\d.-]/g, ''));
      if (isNaN(priceNum) || priceNum < 0) {
        overallWarnings.push('Invalid price format or negative price');
      }
    }

    if (company.PE_ratio && typeof company.PE_ratio === 'string') {
      const peNum = parseFloat(company.PE_ratio);
      if (isNaN(peNum) || peNum < 0) {
        overallWarnings.push('Invalid P/E ratio format or negative value');
      } else if (peNum > 1000) {
        overallWarnings.push('P/E ratio is unusually high');
      }
    }

    // Combine all validation results
    const isValid = nameValidation.isValid && 
                   (symbolValidation?.isValid ?? true) && 
                   overallErrors.length === 0;

    return {
      isValid,
      company,
      nameValidation,
      symbolValidation,
      overallWarnings,
      overallErrors
    };
  }

  /**
   * Batch validate multiple companies
   */
  static validateCompanies(
    companies: CompanyFinancials[],
    nseCompanies: NSECompany[]
  ): {
    validations: CompanyValidation[];
    summary: {
      total: number;
      valid: number;
      invalid: number;
      requiresManualReview: number;
      totalWarnings: number;
      totalErrors: number;
    };
  } {
    const existingSymbols: string[] = [];
    const validations: CompanyValidation[] = [];

    // First pass: collect existing symbols
    companies.forEach(company => {
      if (company.symbol) {
        existingSymbols.push(company.symbol.toUpperCase());
      }
    });

    // Second pass: validate each company
    companies.forEach(company => {
      const validation = this.validateCompany(company, nseCompanies, existingSymbols);
      validations.push(validation);

      // Add new symbol to existing symbols list for duplicate detection
      if (validation.nameValidation.symbol && 
          !existingSymbols.includes(validation.nameValidation.symbol)) {
        existingSymbols.push(validation.nameValidation.symbol);
      }
    });

    // Generate summary
    const valid = validations.filter(v => v.isValid).length;
    const invalid = validations.length - valid;
    const requiresManualReview = validations.filter(v => v.nameValidation.requiresManualReview).length;
    const totalWarnings = validations.reduce((sum, v) => 
      sum + v.nameValidation.warnings.length + 
      (v.symbolValidation?.warnings.length || 0) + 
      v.overallWarnings.length, 0
    );
    const totalErrors = validations.reduce((sum, v) => 
      sum + v.nameValidation.errors.length + 
      (v.symbolValidation?.errors.length || 0) + 
      v.overallErrors.length, 0
    );

    return {
      validations,
      summary: {
        total: companies.length,
        valid,
        invalid,
        requiresManualReview,
        totalWarnings,
        totalErrors
      }
    };
  }

  /**
   * Get validation summary as human-readable text
   */
  static getValidationSummaryText(validation: CompanyValidation): string {
    const lines: string[] = [];
    
    lines.push(`Company: ${validation.company.company}`);
    
    if (validation.nameValidation.suggestedName !== validation.nameValidation.originalName) {
      lines.push(`  Suggested name: ${validation.nameValidation.suggestedName}`);
      lines.push(`  Confidence: ${Math.round(validation.nameValidation.confidence * 100)}%`);
    }
    
    if (validation.nameValidation.symbol) {
      lines.push(`  Symbol: ${validation.nameValidation.symbol}`);
    }
    
    if (validation.nameValidation.requiresManualReview) {
      lines.push(`  ⚠️  Requires manual review`);
    }
    
    const allWarnings = [
      ...validation.nameValidation.warnings,
      ...(validation.symbolValidation?.warnings || []),
      ...validation.overallWarnings
    ];
    
    const allErrors = [
      ...validation.nameValidation.errors,
      ...(validation.symbolValidation?.errors || []),
      ...validation.overallErrors
    ];
    
    if (allWarnings.length > 0) {
      lines.push(`  Warnings: ${allWarnings.length}`);
      allWarnings.forEach(warning => lines.push(`    - ${warning}`));
    }
    
    if (allErrors.length > 0) {
      lines.push(`  Errors: ${allErrors.length}`);
      allErrors.forEach(error => lines.push(`    - ${error}`));
    }
    
    return lines.join('\n');
  }
}