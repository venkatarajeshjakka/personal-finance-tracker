import { CompanyFinancials, NSECompany, MatchResult } from '@/types';
import { CompanyNameMatcher } from './company-matcher';
import { ValidationService } from './validation-service';
import { StorageService } from '@/lib/storage';
import ToastService from '@/lib/toast';

export interface ImportCorrection {
  originalName: string;
  correctedName: string;
  symbol?: string;
  confidence: number;
  type: 'exact_match' | 'fuzzy_match' | 'no_match';
}

export interface ImportProcessingResult {
  processedCompanies: CompanyFinancials[];
  corrections: ImportCorrection[];
  warnings: string[];
  errors: string[];
}

export interface ValidationResult {
  isValid: boolean;
  warnings: string[];
  errors: string[];
}

export class ImportProcessor {
  /**
   * Process company data with NSE name correction and symbol addition
   */
  static async processCompanyImport(
    companies: CompanyFinancials[],
    options: {
      showNotifications?: boolean;
      autoCorrect?: boolean;
    } = {}
  ): Promise<ImportProcessingResult> {
    const { showNotifications = true, autoCorrect = true } = options;
    
    const nseCompanies = StorageService.getAllNSECompanies();
    const processedCompanies: CompanyFinancials[] = [];
    const corrections: ImportCorrection[] = [];
    const warnings: string[] = [];
    const errors: string[] = [];

    if (showNotifications) {
      ToastService.info(`Processing ${companies.length} companies for import...`);
    }

    for (let i = 0; i < companies.length; i++) {
      const company = companies[i];
      
      try {
        const result = await this.processIndividualCompany(
          company, 
          nseCompanies, 
          autoCorrect
        );
        
        processedCompanies.push(result.processedCompany);
        
        if (result.correction) {
          corrections.push(result.correction);
        }
        
        if (result.warnings.length > 0) {
          warnings.push(...result.warnings);
        }
      } catch (error) {
        const errorMessage = `Failed to process company "${company.company}": ${
          error instanceof Error ? error.message : 'Unknown error'
        }`;
        errors.push(errorMessage);
        
        // Still add the company without corrections if processing fails
        processedCompanies.push(company);
      }
    }

    // Show summary notifications
    if (showNotifications) {
      this.showProcessingSummary(corrections, warnings, errors);
    }

    return {
      processedCompanies,
      corrections,
      warnings,
      errors
    };
  }

  /**
   * Process a single company for name correction and symbol addition
   */
  private static async processIndividualCompany(
    company: CompanyFinancials,
    nseCompanies: NSECompany[],
    autoCorrect: boolean
  ): Promise<{
    processedCompany: CompanyFinancials;
    correction?: ImportCorrection;
    warnings: string[];
  }> {
    const warnings: string[] = [];
    
    if (nseCompanies.length === 0) {
      warnings.push('NSE company list not available for name correction');
      return { processedCompany: company, warnings };
    }

    // Find the best match for the company name
    const matchResult = CompanyNameMatcher.findBestMatch(company.company, nseCompanies);
    
    let processedCompany = { ...company };
    let correction: ImportCorrection | undefined;

    if (matchResult.match && matchResult.confidence > 0.7) {
      // High confidence match - apply correction
      const correctionType = matchResult.confidence > 0.95 ? 'exact_match' : 'fuzzy_match';
      
      correction = {
        originalName: company.company,
        correctedName: matchResult.match.companyName,
        symbol: matchResult.match.symbol,
        confidence: matchResult.confidence,
        type: correctionType
      };

      if (autoCorrect) {
        processedCompany = {
          ...company,
          company: matchResult.match.companyName,
          symbol: matchResult.match.symbol,
          updatedAt: new Date()
        };
      }
    } else if (matchResult.confidence > 0.3) {
      // Medium confidence - create warning but don't auto-correct
      correction = {
        originalName: company.company,
        correctedName: company.company,
        confidence: matchResult.confidence,
        type: 'no_match'
      };
      
      warnings.push(
        `Company "${company.company}" has potential matches but confidence is low (${Math.round(matchResult.confidence * 100)}%). ` +
        `Consider manual review. Suggestions: ${matchResult.suggestions.slice(0, 3).map(s => s.companyName).join(', ')}`
      );
    } else {
      // No match found
      correction = {
        originalName: company.company,
        correctedName: company.company,
        confidence: 0,
        type: 'no_match'
      };
      
      warnings.push(`No NSE match found for company "${company.company}"`);
    }

    return { processedCompany, correction, warnings };
  }

  /**
   * Validate name corrections and symbol assignments
   */
  static validateCorrections(corrections: ImportCorrection[]): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    for (const correction of corrections) {
      // Validate confidence levels
      if (correction.confidence < 0.5 && correction.type !== 'no_match') {
        warnings.push(
          `Low confidence correction for "${correction.originalName}" -> "${correction.correctedName}" (${Math.round(correction.confidence * 100)}%)`
        );
      }

      // Validate symbol format
      if (correction.symbol) {
        if (!/^[A-Z0-9]+$/.test(correction.symbol)) {
          errors.push(`Invalid symbol format "${correction.symbol}" for company "${correction.correctedName}"`);
        }
        
        if (correction.symbol.length > 20) {
          errors.push(`Symbol "${correction.symbol}" is too long for company "${correction.correctedName}"`);
        }
      }

      // Check for potential issues
      if (correction.originalName.length < 3) {
        warnings.push(`Very short company name "${correction.originalName}" may cause matching issues`);
      }

      if (correction.correctedName !== correction.originalName && correction.confidence < 0.8) {
        warnings.push(
          `Name change from "${correction.originalName}" to "${correction.correctedName}" has moderate confidence (${Math.round(correction.confidence * 100)}%)`
        );
      }
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Show processing summary notifications
   */
  private static showProcessingSummary(
    corrections: ImportCorrection[],
    warnings: string[],
    errors: string[]
  ): void {
    const exactMatches = corrections.filter(c => c.type === 'exact_match').length;
    const fuzzyMatches = corrections.filter(c => c.type === 'fuzzy_match').length;
    const noMatches = corrections.filter(c => c.type === 'no_match').length;

    // Success summary
    if (exactMatches > 0 || fuzzyMatches > 0) {
      const correctionSummary = [];
      if (exactMatches > 0) correctionSummary.push(`${exactMatches} exact matches`);
      if (fuzzyMatches > 0) correctionSummary.push(`${fuzzyMatches} fuzzy matches`);
      
      ToastService.success(
        `Import processing completed with ${correctionSummary.join(', ')}`,
        { duration: 6000 }
      );
    }

    // Warning summary
    if (warnings.length > 0) {
      ToastService.warning(
        `${warnings.length} warnings during import processing. Check console for details.`,
        { duration: 8000 }
      );
      console.warn('Import processing warnings:', warnings);
    }

    // Error summary
    if (errors.length > 0) {
      ToastService.error(
        `${errors.length} errors during import processing. Check console for details.`,
        { duration: 10000 }
      );
      console.error('Import processing errors:', errors);
    }

    // No matches summary
    if (noMatches > 0) {
      ToastService.info(
        `${noMatches} companies had no NSE matches and will be imported as-is`,
        { duration: 6000 }
      );
    }

    // Show detailed corrections for high-confidence matches
    const highConfidenceCorrections = corrections.filter(
      c => c.type !== 'no_match' && c.confidence > 0.8
    );
    
    if (highConfidenceCorrections.length > 0 && highConfidenceCorrections.length <= 5) {
      highConfidenceCorrections.forEach(correction => {
        if (correction.originalName !== correction.correctedName) {
          ToastService.info(
            `Corrected "${correction.originalName}" → "${correction.correctedName}"${
              correction.symbol ? ` (${correction.symbol})` : ''
            }`,
            { duration: 8000 }
          );
        } else if (correction.symbol) {
          ToastService.info(
            `Added symbol ${correction.symbol} to "${correction.correctedName}"`,
            { duration: 6000 }
          );
        }
      });
    } else if (highConfidenceCorrections.length > 5) {
      ToastService.info(
        `Applied ${highConfidenceCorrections.length} automatic corrections. Check import summary for details.`,
        { duration: 8000 }
      );
    }
  }

  /**
   * Get suggestions for manual correction
   */
  static getSuggestionsForCompany(
    companyName: string,
    nseCompanies: NSECompany[]
  ): NSECompany[] {
    return CompanyNameMatcher.suggestCorrections(companyName, nseCompanies);
  }

  /**
   * Apply manual correction to a company
   */
  static applyManualCorrection(
    company: CompanyFinancials,
    nseCompany: NSECompany
  ): CompanyFinancials {
    return {
      ...company,
      company: nseCompany.companyName,
      symbol: nseCompany.symbol,
      updatedAt: new Date()
    };
  }

  /**
   * Validate company data before import
   */
  static validateCompanyData(company: CompanyFinancials): ValidationResult {
    const warnings: string[] = [];
    const errors: string[] = [];

    // Required fields validation
    if (!company.company || company.company.trim().length === 0) {
      errors.push('Company name is required');
    }

    if (!company.financials || !company.financials.quarters) {
      errors.push('Financial quarters data is required');
    }

    // Data quality checks
    if (company.company && company.company.length < 2) {
      warnings.push('Company name is very short');
    }

    if (company.company && company.company.length > 100) {
      warnings.push('Company name is unusually long');
    }

    if (company.symbol && !/^[A-Z0-9]+$/.test(company.symbol)) {
      warnings.push('Symbol contains invalid characters');
    }

    // Financial data validation
    if (company.financials?.quarters) {
      const quarters = Object.keys(company.financials.quarters);
      if (quarters.length === 0) {
        errors.push('At least one quarter of financial data is required');
      }

      // Check for reasonable financial values
      Object.entries(company.financials.quarters).forEach(([quarter, data]) => {
        if (data.sales < 0) {
          warnings.push(`Negative sales value in ${quarter}`);
        }
        if (data.net_profit < -data.sales) {
          warnings.push(`Unusually large loss in ${quarter}`);
        }
      });
    }

    return {
      isValid: errors.length === 0,
      warnings,
      errors
    };
  }

  /**
   * Generate import summary report
   */
  static generateImportSummary(result: ImportProcessingResult): string {
    const { processedCompanies, corrections, warnings, errors } = result;
    
    const summary = [
      `Import Processing Summary`,
      `========================`,
      `Total companies processed: ${processedCompanies.length}`,
      ``,
      `Name Corrections:`,
      `- Exact matches: ${corrections.filter(c => c.type === 'exact_match').length}`,
      `- Fuzzy matches: ${corrections.filter(c => c.type === 'fuzzy_match').length}`,
      `- No matches: ${corrections.filter(c => c.type === 'no_match').length}`,
      ``,
      `Issues:`,
      `- Warnings: ${warnings.length}`,
      `- Errors: ${errors.length}`,
    ];

    if (corrections.length > 0) {
      summary.push(``, `Detailed Corrections:`);
      corrections.forEach(correction => {
        if (correction.type !== 'no_match') {
          summary.push(
            `- "${correction.originalName}" → "${correction.correctedName}"${
              correction.symbol ? ` (${correction.symbol})` : ''
            } [${Math.round(correction.confidence * 100)}% confidence]`
          );
        }
      });
    }

    if (warnings.length > 0) {
      summary.push(``, `Warnings:`);
      warnings.forEach(warning => summary.push(`- ${warning}`));
    }

    if (errors.length > 0) {
      summary.push(``, `Errors:`);
      errors.forEach(error => summary.push(`- ${error}`));
    }

    return summary.join('\n');
  }
}