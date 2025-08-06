import {
  CompanyFinancials,
  Portfolio,
  Watchlist,
  NSECompany,
  UserPreferences,
  StoredCompanies,
  StoredPortfolios,
  StoredWatchlists,
  StoredNSECompanies,

  ValidationResult,
  ValidationError,
  DataError
} from '@/types';
import { STORAGE_KEYS, DEFAULT_PREFERENCES } from './constants';
import {
  normalizeCompanyData,
  detectAndValidateJSONFormat,
  safeSerialize,
  safeDeserialize,
  validateLocalStorageAvailability
} from './utils';

export class StorageService {
  /**
   * Validate localStorage availability before operations
   */
  private static validateStorage(): void {
    const validation = validateLocalStorageAvailability();
    if (!validation.isValid) {
      throw new DataError(`localStorage unavailable: ${validation.errors.join(', ')}`);
    }
  }

  // Company data operations
  static saveCompany(company: CompanyFinancials): void {
    this.validateStorage();

    try {
      const companies = this.getAllCompanies();
      const updatedCompany = {
        ...company,
        updatedAt: new Date()
      };

      const updatedCompanies: StoredCompanies = {
        ...companies.reduce((acc, c) => ({ ...acc, [c.id]: c }), {}),
        [updatedCompany.id]: updatedCompany
      };

      const serialized = safeSerialize(updatedCompanies);
      localStorage.setItem(STORAGE_KEYS.COMPANIES, serialized);
    } catch (error) {
      throw new DataError(`Failed to save company: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static getCompany(id: string): CompanyFinancials | null {
    if (!id) {
      throw new ValidationError('Company ID is required');
    }

    const companies = this.getAllCompanies();
    return companies.find(c => c.id === id) || null;
  }

  static getAllCompanies(): CompanyFinancials[] {
    this.validateStorage();

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.COMPANIES);
      if (!stored) return [];

      const companies: StoredCompanies = safeDeserialize(stored);
      return Object.values(companies);
    } catch (error) {
      console.error('Failed to retrieve companies:', error);
      return [];
    }
  }

  static deleteCompany(id: string): void {
    if (!id) {
      throw new ValidationError('Company ID is required');
    }

    this.validateStorage();

    try {
      const companies = this.getAllCompanies();
      const updatedCompanies = companies.filter(c => c.id !== id);
      const storedCompanies: StoredCompanies = updatedCompanies.reduce(
        (acc, c) => ({ ...acc, [c.id]: c }),
        {}
      );

      const serialized = safeSerialize(storedCompanies);
      localStorage.setItem(STORAGE_KEYS.COMPANIES, serialized);
    } catch (error) {
      throw new DataError(`Failed to delete company: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Import company data from JSON (supports both single and multiple company formats)
   */
  static async importCompanyData(jsonData: string): Promise<ValidationResult<CompanyFinancials[]>> {
    try {
      const parsed = JSON.parse(jsonData);
      const validation = detectAndValidateJSONFormat(parsed);

      if (!validation.isValid) {
        return {
          isValid: false,
          errors: validation.errors
        };
      }

      const normalizedCompanies = normalizeCompanyData(validation.data!);

      // Use the enhanced import processor for name correction and symbol addition
      try {
        const { ImportProcessor } = await import('@/lib/utils/import-processor');
        const result = await ImportProcessor.processCompanyImport(normalizedCompanies, {
          showNotifications: false, // Don't show notifications in storage service
          autoCorrect: true
        });

        // Save all processed companies
        for (const company of result.processedCompanies) {
          this.saveCompany(company);
        }

        return {
          isValid: true,
          data: result.processedCompanies,
          errors: result.errors
        };
      } catch (importError) {
        // Fallback to basic enhancement if import processor fails
        console.warn('Import processor failed, using basic enhancement:', importError);
        
        const enhancedCompanies = normalizedCompanies.map(company => {
          const nameValidation = this.validateAndCorrectCompanyName(company.company);
          return {
            ...company,
            company: nameValidation.correctedName,
            symbol: nameValidation.symbol || company.symbol
          };
        });

        // Save all companies
        for (const company of enhancedCompanies) {
          this.saveCompany(company);
        }

        return {
          isValid: true,
          data: enhancedCompanies,
          errors: []
        };
      }
    } catch (error) {
      return {
        isValid: false,
        errors: [`Invalid JSON format: ${error instanceof Error ? error.message : 'Unknown error'}`]
      };
    }
  }

  // Portfolio operations
  static savePortfolio(portfolio: Portfolio): void {
    this.validateStorage();

    if (!portfolio.id || !portfolio.name || !portfolio.userId) {
      throw new ValidationError('Portfolio must have id, name, and userId');
    }

    try {
      const portfolios = this.getAllPortfolios();
      const updatedPortfolio: Portfolio = {
        ...portfolio,
        updatedAt: new Date()
      };

      const updatedPortfolios: StoredPortfolios = {
        ...portfolios.reduce((acc, p) => ({ ...acc, [p.id]: p }), {}),
        [updatedPortfolio.id]: updatedPortfolio
      };

      const serialized = safeSerialize(updatedPortfolios);
      localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, serialized);
    } catch (error) {
      throw new DataError(`Failed to save portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static getPortfolio(id: string): Portfolio | null {
    if (!id) {
      throw new ValidationError('Portfolio ID is required');
    }

    const portfolios = this.getAllPortfolios();
    return portfolios.find(p => p.id === id) || null;
  }

  static getAllPortfolios(): Portfolio[] {
    this.validateStorage();

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.PORTFOLIOS);
      if (!stored) return [];

      const portfolios: StoredPortfolios = safeDeserialize(stored);
      return Object.values(portfolios);
    } catch (error) {
      console.error('Failed to retrieve portfolios:', error);
      return [];
    }
  }

  static deletePortfolio(id: string): void {
    if (!id) {
      throw new ValidationError('Portfolio ID is required');
    }

    this.validateStorage();

    try {
      const portfolios = this.getAllPortfolios();
      const updatedPortfolios = portfolios.filter(p => p.id !== id);
      const storedPortfolios: StoredPortfolios = updatedPortfolios.reduce(
        (acc, p) => ({ ...acc, [p.id]: p }),
        {}
      );

      const serialized = safeSerialize(storedPortfolios);
      localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, serialized);
    } catch (error) {
      throw new DataError(`Failed to delete portfolio: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // Watchlist operations
  static saveWatchlist(watchlist: Watchlist): void {
    this.validateStorage();

    if (!watchlist.id || !watchlist.name || !watchlist.userId) {
      throw new ValidationError('Watchlist must have id, name, and userId');
    }

    try {
      const watchlists = this.getAllWatchlists();
      const updatedWatchlist = {
        ...watchlist,
        updatedAt: new Date()
      };

      const updatedWatchlists: StoredWatchlists = {
        ...watchlists.reduce((acc, w) => ({ ...acc, [w.id]: w }), {}),
        [updatedWatchlist.id]: updatedWatchlist
      };

      const serialized = safeSerialize(updatedWatchlists);
      localStorage.setItem(STORAGE_KEYS.WATCHLISTS, serialized);
    } catch (error) {
      throw new DataError(`Failed to save watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static getWatchlist(id: string): Watchlist | null {
    if (!id) {
      throw new ValidationError('Watchlist ID is required');
    }

    const watchlists = this.getAllWatchlists();
    return watchlists.find(w => w.id === id) || null;
  }

  static getAllWatchlists(): Watchlist[] {
    this.validateStorage();

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.WATCHLISTS);
      if (!stored) return [];

      const watchlists: StoredWatchlists = safeDeserialize(stored);
      return Object.values(watchlists);
    } catch (error) {
      console.error('Failed to retrieve watchlists:', error);
      return [];
    }
  }

  static deleteWatchlist(id: string): void {
    if (!id) {
      throw new ValidationError('Watchlist ID is required');
    }

    this.validateStorage();

    try {
      const watchlists = this.getAllWatchlists();
      const updatedWatchlists = watchlists.filter(w => w.id !== id);
      const storedWatchlists: StoredWatchlists = updatedWatchlists.reduce(
        (acc, w) => ({ ...acc, [w.id]: w }),
        {}
      );

      const serialized = safeSerialize(storedWatchlists);
      localStorage.setItem(STORAGE_KEYS.WATCHLISTS, serialized);
    } catch (error) {
      throw new DataError(`Failed to delete watchlist: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  // User preferences
  static getUserPreferences(): UserPreferences {
    if (typeof window === 'undefined') return DEFAULT_PREFERENCES;
    const stored = localStorage.getItem(STORAGE_KEYS.USER_PREFERENCES);
    if (!stored) return DEFAULT_PREFERENCES;
    return { ...DEFAULT_PREFERENCES, ...JSON.parse(stored) };
  }

  static saveUserPreferences(preferences: Partial<UserPreferences>): void {
    const current = this.getUserPreferences();
    const updated = { ...current, ...preferences };
    localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(updated));
  }

  // NSE Company operations
  static saveNSECompanies(companies: NSECompany[]): void {
    this.validateStorage();

    if (!Array.isArray(companies)) {
      throw new ValidationError('Companies must be an array');
    }

    try {
      const storedCompanies: StoredNSECompanies = companies.reduce(
        (acc, company) => ({ ...acc, [company.symbol]: company }),
        {}
      );

      const serialized = safeSerialize(storedCompanies);
      localStorage.setItem(STORAGE_KEYS.NSE_COMPANIES, serialized);
    } catch (error) {
      throw new DataError(`Failed to save NSE companies: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  static getNSECompany(symbol: string): NSECompany | null {
    if (!symbol) {
      throw new ValidationError('Symbol is required');
    }

    const companies = this.getAllNSECompanies();
    return companies.find(c => c.symbol.toUpperCase() === symbol.toUpperCase()) || null;
  }

  static getAllNSECompanies(): NSECompany[] {
    this.validateStorage();

    try {
      const stored = localStorage.getItem(STORAGE_KEYS.NSE_COMPANIES);
      if (!stored) return [];

      const companies: StoredNSECompanies = safeDeserialize(stored);
      return Object.values(companies);
    } catch (error) {
      console.error('Failed to retrieve NSE companies:', error);
      return [];
    }
  }

  static searchNSECompanies(query: string): NSECompany[] {
    if (!query || typeof query !== 'string' || !query.trim()) {
      return this.getAllNSECompanies();
    }

    const companies = this.getAllNSECompanies();
    const searchTerm = query.toLowerCase().trim();

    return companies.filter(company => 
      company.symbol.toLowerCase().includes(searchTerm) ||
      company.companyName.toLowerCase().includes(searchTerm) ||
      company.isinNumber.toLowerCase().includes(searchTerm)
    );
  }

  static clearNSECompanies(): void {
    this.validateStorage();
    localStorage.removeItem(STORAGE_KEYS.NSE_COMPANIES);
  }

  static validateAndCorrectCompanyName(companyName: string): { correctedName: string; symbol?: string } {
    const nseCompanies = this.getAllNSECompanies();
    
    if (nseCompanies.length === 0) {
      return { correctedName: companyName };
    }

    // Use the advanced company matcher if available
    try {
      const { CompanyNameMatcher } = require('@/lib/utils/company-matcher');
      const result = CompanyNameMatcher.validateAndCorrectCompanyName(companyName, nseCompanies);
      return result;
    } catch (error) {
      // Fallback to simple matching if company matcher is not available
      const exactMatch = nseCompanies.find(nse => 
        nse.companyName.toLowerCase() === companyName.toLowerCase()
      );

      if (exactMatch) {
        return {
          correctedName: exactMatch.companyName,
          symbol: exactMatch.symbol
        };
      }

      // Partial matching
      const partialMatch = nseCompanies.find(nse => 
        nse.companyName.toLowerCase().includes(companyName.toLowerCase()) ||
        companyName.toLowerCase().includes(nse.companyName.toLowerCase())
      );

      if (partialMatch) {
        return {
          correctedName: partialMatch.companyName,
          symbol: partialMatch.symbol
        };
      }

      return { correctedName: companyName };
    }
  }

  // Utility methods
  static clearAllData(): void {
    Object.values(STORAGE_KEYS).forEach(key => {
      localStorage.removeItem(key);
    });
  }

  static exportData(): string {
    const data = {
      companies: this.getAllCompanies(),
      portfolios: this.getAllPortfolios(),
      watchlists: this.getAllWatchlists(),
      nseCompanies: this.getAllNSECompanies(),
      preferences: this.getUserPreferences(),

      exportDate: new Date().toISOString()
    };
    return JSON.stringify(data, null, 2);
  }

  static importData(jsonData: string): boolean {
    try {
      const data = JSON.parse(jsonData);

      if (data.companies) {
        const companies: StoredCompanies = data.companies.reduce(
          (acc: StoredCompanies, c: CompanyFinancials) => ({ ...acc, [c.id]: c }),
          {}
        );
        localStorage.setItem(STORAGE_KEYS.COMPANIES, JSON.stringify(companies));
      }

      if (data.portfolios) {
        const portfolios: StoredPortfolios = data.portfolios.reduce(
          (acc: StoredPortfolios, p: Portfolio) => ({ ...acc, [p.id]: p }),
          {}
        );
        localStorage.setItem(STORAGE_KEYS.PORTFOLIOS, JSON.stringify(portfolios));
      }

      if (data.watchlists) {
        const watchlists: StoredWatchlists = data.watchlists.reduce(
          (acc: StoredWatchlists, w: Watchlist) => ({ ...acc, [w.id]: w }),
          {}
        );
        localStorage.setItem(STORAGE_KEYS.WATCHLISTS, JSON.stringify(watchlists));
      }

      if (data.nseCompanies) {
        const nseCompanies: StoredNSECompanies = data.nseCompanies.reduce(
          (acc: StoredNSECompanies, c: NSECompany) => ({ ...acc, [c.symbol]: c }),
          {}
        );
        localStorage.setItem(STORAGE_KEYS.NSE_COMPANIES, JSON.stringify(nseCompanies));
      }

      if (data.preferences) {
        localStorage.setItem(STORAGE_KEYS.USER_PREFERENCES, JSON.stringify(data.preferences));
      }



      return true;
    } catch (error) {
      console.error('Failed to import data:', error);
      return false;
    }
  }


}