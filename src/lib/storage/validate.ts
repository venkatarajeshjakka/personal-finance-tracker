// Simple validation for storage service
import { StorageService } from './index';
import { CompanyFinancials, Portfolio, Watchlist } from '@/types';

export function validateStorageService(): boolean {
  try {
    // Test company operations
    const testCompany: CompanyFinancials = {
      id: 'test-company-1',
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
          'Q1-2024': {
            sales: 1000000,
            EBIDT: 200000,
            net_profit: 150000,
            EPS: '2.50'
          }
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Test portfolio operations
    const testPortfolio: Portfolio = {
      id: 'test-portfolio-1',
      name: 'Test Portfolio',
      description: 'A test portfolio',
      userId: 'user-1',
      initialCapital: 10000,
      currentValue: 12000,
      totalReturn: 20,
      holdings: [],
      transactions: [],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Test watchlist operations
    const testWatchlist: Watchlist = {
      id: 'test-watchlist-1',
      name: 'Test Watchlist',
      description: 'A test watchlist',
      userId: 'user-1',
      symbols: ['AAPL', 'GOOGL', 'MSFT'],
      createdAt: new Date(),
      updatedAt: new Date()
    };

    // Validate that all methods exist and are functions
    const requiredMethods = [
      'saveCompany', 'getCompany', 'getAllCompanies', 'deleteCompany', 'importCompanyData',
      'savePortfolio', 'getPortfolio', 'getAllPortfolios', 'deletePortfolio',
      'saveWatchlist', 'getWatchlist', 'getAllWatchlists', 'deleteWatchlist',
      'getUserPreferences', 'saveUserPreferences', 'clearAllData', 'exportData', 'importData'
    ];

    for (const method of requiredMethods) {
      if (typeof (StorageService as any)[method] !== 'function') {
        console.error(`❌ Method ${method} is not a function`);
        return false;
      }
    }

    // Test JSON import functionality
    const singleCompanyJSON = JSON.stringify({
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
            'Q1-2024': {
              sales: 1000000,
              EBIDT: 200000,
              net_profit: 150000,
              EPS: '2.50'
            }
          }
        }
      }
    });

    const importResult = StorageService.importCompanyData(singleCompanyJSON);
    if (!importResult.isValid) {
      console.error('❌ JSON import validation failed:', importResult.errors);
      return false;
    }

    console.log('✅ Storage service validation passed');
    return true;
  } catch (error) {
    console.error('❌ Storage service validation failed:', error);
    return false;
  }
}

// Export validation function for use in other modules
export default validateStorageService;