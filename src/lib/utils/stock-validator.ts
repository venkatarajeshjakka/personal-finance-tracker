/**
 * Stock Symbol Validator and Price Fetcher
 * Provides utilities for validating stock symbols and fetching current prices
 */

export interface StockValidationResult {
  isValid: boolean;
  symbol: string;
  name?: string;
  currentPrice?: number;
  error?: string;
}

export interface StockSuggestion {
  symbol: string;
  name: string;
  exchange?: string;
  sector?: string;
}

export class StockValidator {
  /**
   * Validate if a stock symbol is properly formatted
   */
  static validateSymbolFormat(symbol: string): boolean {
    if (!symbol || typeof symbol !== 'string') return false;
    
    // Basic validation: 1-10 characters, alphanumeric, no spaces
    const symbolRegex = /^[A-Z0-9]{1,10}$/;
    return symbolRegex.test(symbol.toUpperCase());
  }

  /**
   * Get stock suggestions based on partial input
   */
  static getStockSuggestions(
    query: string, 
    availableStocks: StockSuggestion[]
  ): StockSuggestion[] {
    if (!query || query.length < 1) return [];
    
    const searchTerm = query.toLowerCase();
    
    return availableStocks
      .filter(stock => 
        stock.symbol.toLowerCase().includes(searchTerm) ||
        stock.name.toLowerCase().includes(searchTerm)
      )
      .sort((a, b) => {
        // Prioritize exact symbol matches
        if (a.symbol.toLowerCase() === searchTerm) return -1;
        if (b.symbol.toLowerCase() === searchTerm) return 1;
        
        // Then prioritize symbol starts with
        if (a.symbol.toLowerCase().startsWith(searchTerm)) return -1;
        if (b.symbol.toLowerCase().startsWith(searchTerm)) return 1;
        
        // Then alphabetical
        return a.symbol.localeCompare(b.symbol);
      })
      .slice(0, 20); // Limit results
  }

  /**
   * Validate stock symbol and get basic info
   * This is a mock implementation - in a real app, you'd call an API
   */
  static async validateStock(symbol: string): Promise<StockValidationResult> {
    if (!this.validateSymbolFormat(symbol)) {
      return {
        isValid: false,
        symbol,
        error: 'Invalid symbol format. Use 1-10 alphanumeric characters.'
      };
    }

    // Mock validation - in real app, call stock API
    const mockStockData: Record<string, { name: string; price: number }> = {
      'RELIANCE': { name: 'Reliance Industries Limited', price: 2450.50 },
      'TCS': { name: 'Tata Consultancy Services Limited', price: 3650.75 },
      'INFY': { name: 'Infosys Limited', price: 1420.30 },
      'HDFCBANK': { name: 'HDFC Bank Limited', price: 1580.25 },
      'ICICIBANK': { name: 'ICICI Bank Limited', price: 950.80 },
      'SBIN': { name: 'State Bank of India', price: 720.45 },
      'BHARTIARTL': { name: 'Bharti Airtel Limited', price: 890.60 },
      'ITC': { name: 'ITC Limited', price: 415.30 },
      'KOTAKBANK': { name: 'Kotak Mahindra Bank Limited', price: 1750.90 },
      'LT': { name: 'Larsen & Toubro Limited', price: 2890.40 }
    };

    const stockInfo = mockStockData[symbol.toUpperCase()];
    
    if (stockInfo) {
      return {
        isValid: true,
        symbol: symbol.toUpperCase(),
        name: stockInfo.name,
        currentPrice: stockInfo.price
      };
    }

    // For unknown symbols, assume they're valid but no price data available
    return {
      isValid: true,
      symbol: symbol.toUpperCase(),
      error: 'Symbol accepted but no price data available'
    };
  }

  /**
   * Get popular Indian stock symbols for suggestions
   */
  static getPopularStocks(): StockSuggestion[] {
    return [
      { symbol: 'RELIANCE', name: 'Reliance Industries Limited', sector: 'Oil & Gas' },
      { symbol: 'TCS', name: 'Tata Consultancy Services Limited', sector: 'IT Services' },
      { symbol: 'INFY', name: 'Infosys Limited', sector: 'IT Services' },
      { symbol: 'HDFCBANK', name: 'HDFC Bank Limited', sector: 'Banking' },
      { symbol: 'ICICIBANK', name: 'ICICI Bank Limited', sector: 'Banking' },
      { symbol: 'SBIN', name: 'State Bank of India', sector: 'Banking' },
      { symbol: 'BHARTIARTL', name: 'Bharti Airtel Limited', sector: 'Telecom' },
      { symbol: 'ITC', name: 'ITC Limited', sector: 'FMCG' },
      { symbol: 'KOTAKBANK', name: 'Kotak Mahindra Bank Limited', sector: 'Banking' },
      { symbol: 'LT', name: 'Larsen & Toubro Limited', sector: 'Construction' },
      { symbol: 'WIPRO', name: 'Wipro Limited', sector: 'IT Services' },
      { symbol: 'MARUTI', name: 'Maruti Suzuki India Limited', sector: 'Automobile' },
      { symbol: 'ASIANPAINT', name: 'Asian Paints Limited', sector: 'Paints' },
      { symbol: 'NESTLEIND', name: 'Nestle India Limited', sector: 'FMCG' },
      { symbol: 'ULTRACEMCO', name: 'UltraTech Cement Limited', sector: 'Cement' },
      { symbol: 'TITAN', name: 'Titan Company Limited', sector: 'Jewellery' },
      { symbol: 'SUNPHARMA', name: 'Sun Pharmaceutical Industries Limited', sector: 'Pharma' },
      { symbol: 'POWERGRID', name: 'Power Grid Corporation of India Limited', sector: 'Power' },
      { symbol: 'NTPC', name: 'NTPC Limited', sector: 'Power' },
      { symbol: 'ONGC', name: 'Oil and Natural Gas Corporation Limited', sector: 'Oil & Gas' }
    ];
  }

  /**
   * Format stock symbol for display
   */
  static formatSymbol(symbol: string): string {
    return symbol.toUpperCase().trim();
  }

  /**
   * Check if symbol is likely an Indian stock (NSE/BSE)
   */
  static isIndianStock(symbol: string): boolean {
    // Simple heuristic - Indian stocks are typically all caps, no dots
    return /^[A-Z0-9]+$/.test(symbol) && !symbol.includes('.');
  }

  /**
   * Get exchange suggestion based on symbol format
   */
  static suggestExchange(symbol: string): string {
    if (this.isIndianStock(symbol)) {
      return 'NSE/BSE';
    }
    if (symbol.includes('.')) {
      return 'International';
    }
    return 'Unknown';
  }
}