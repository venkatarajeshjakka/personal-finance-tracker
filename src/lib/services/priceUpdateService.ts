import { CompanyFinancials } from '@/types';
import { getMarketStatus, shouldUpdatePrices, MarketStatus } from '@/lib/utils/marketHours';

interface CachedPrice {
    symbol: string;
    price: number;
    change: number;
    changePercent: number;
    timestamp: number;
    marketState: string;
    currency: string;
    shortName?: string;
    longName?: string;
    // Financial metrics
    marketCap?: number | null;
    trailingPE?: number | null;
    forwardPE?: number | null;
    priceToBook?: number | null;
    sharesOutstanding?: number | null;
    bookValue?: number | null;
    epsTrailingTwelveMonths?: number | null;
    trailingAnnualDividendYield?: number | null;
    beta?: number | null;
    //Company Profile
    industry?: string;
    sector?: string;
}

interface PriceUpdateResult {
    success: boolean;
    symbol: string;
    price?: number;
    change?: number;
    changePercent?: number;
    error?: string;
    cached?: boolean;
    timestamp?: number; // Unix timestamp when data was fetched/cached
    // Financial metrics
    marketCap?: number | null;
    trailingPE?: number | null;
    forwardPE?: number | null;
    priceToBook?: number | null;
    sharesOutstanding?: number | null;
    bookValue?: number | null;
    epsTrailingTwelveMonths?: number | null;
    trailingAnnualDividendYield?: number | null;
    beta?: number | null;

    //Company Profile
    industry?: string;
    sector?: string;
}

interface BulkPriceUpdateResult {
    results: PriceUpdateResult[];
    totalRequested: number;
    totalSuccess: number;
    totalErrors: number;
    totalCached: number;
}

class PriceUpdateService {
    private static cache = new Map<string, CachedPrice>();
    private static readonly RATE_LIMIT_DELAY = 100; // 100ms between requests
    private static readonly MAX_BATCH_SIZE = 10;
    private static lastRequestTime = 0;

    // Dynamic cache duration based on market status
    private static getCacheDuration(): number {
        const marketStatus = getMarketStatus();

        if (marketStatus.isHoliday || !marketStatus.isOpen) {
            // Cache for longer when market is closed or on holidays
            return 4 * 60 * 60 * 1000; // 4 hours
        }

        // During market hours, cache for 1 hour (configurable via settings)
        return 60 * 60 * 1000; // 1 hour
    }

    /**
     * Get current stock price for a single symbol
     */
    static async getStockPrice(symbol: string, settings?: { marketHoursOnly?: boolean; checkHolidays?: boolean }): Promise<PriceUpdateResult> {
        if (!symbol || symbol.trim() === '') {
            return {
                success: false,
                symbol,
                error: 'Invalid symbol provided'
            };
        }

        const cleanSymbol = symbol.trim().toUpperCase();

        // Add .NS suffix for NSE symbols if not already present
        const formattedSymbol = cleanSymbol.includes('.') ? cleanSymbol : `${cleanSymbol}.NS`;

        // Check cache first
        const cached = this.getCachedPrice(formattedSymbol);
        if (cached) {
            return {
                success: true,
                symbol: formattedSymbol,
                price: cached.price,
                change: cached.change,
                changePercent: cached.changePercent,
                cached: true,
                timestamp: cached.timestamp,
                marketCap: cached.marketCap,
                trailingPE: cached.trailingPE,
                forwardPE: cached.forwardPE,
                priceToBook: cached.priceToBook,
                sharesOutstanding: cached.sharesOutstanding,
                bookValue: cached.bookValue,
                epsTrailingTwelveMonths: cached.epsTrailingTwelveMonths,
                trailingAnnualDividendYield: cached.trailingAnnualDividendYield,
                beta: cached.beta,
                industry: cached.industry,
                sector: cached.sector
            };
        }

        // Check if we should update prices based on market status
        const marketHoursOnly = settings?.marketHoursOnly ?? true;
        const checkHolidays = settings?.checkHolidays ?? true;

        // If market is closed/holiday, try to return previous closing price first
        if (!shouldUpdatePrices(marketHoursOnly, checkHolidays)) {
            const previousCached = this.getPreviousClosingPrice(formattedSymbol);
            if (previousCached) {
                console.log(`Using cached price for ${formattedSymbol} (market closed/holiday)`);
                return {
                    success: true,
                    symbol: formattedSymbol,
                    price: previousCached.price,
                    change: previousCached.change,
                    changePercent: previousCached.changePercent,
                    cached: true,
                    timestamp: previousCached.timestamp,
                    marketCap: previousCached.marketCap,
                    trailingPE: previousCached.trailingPE,
                    forwardPE: previousCached.forwardPE,
                    priceToBook: previousCached.priceToBook,
                    sharesOutstanding: previousCached.sharesOutstanding,
                    bookValue: previousCached.bookValue,
                    epsTrailingTwelveMonths: previousCached.epsTrailingTwelveMonths,
                    trailingAnnualDividendYield: previousCached.trailingAnnualDividendYield,
                    beta: previousCached.beta,
                    industry: previousCached.industry,
                    sector: previousCached.sector
                };
            }
            // If no cached data available, continue to fetch fresh data
            // This ensures we always try to get data even when market is closed
            console.log(`No cached data for ${formattedSymbol}, fetching fresh data despite market being closed/holiday`);
        }

        // Apply rate limiting
        await this.applyRateLimit();

        try {
            const response = await fetch(`/api/stocks/quote/${formattedSymbol}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            });

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}));
                throw new Error(errorData.error || `HTTP ${response.status}`);
            }

            const data = await response.json();
            const fetchTimestamp = Date.now();

            // Cache the result
            this.setCachedPrice(formattedSymbol, {
                symbol: formattedSymbol,
                price: data.regularMarketPrice,
                change: data.regularMarketChange,
                changePercent: data.regularMarketChangePercent,
                timestamp: fetchTimestamp,
                marketState: data.marketState,
                currency: data.currency,
                shortName: data.shortName,
                longName: data.longName,
                marketCap: data.marketCap,
                trailingPE: data.trailingPE,
                forwardPE: data.forwardPE,
                priceToBook: data.priceToBook,
                sharesOutstanding: data.sharesOutstanding,
                bookValue: data.bookValue,
                epsTrailingTwelveMonths: data.epsTrailingTwelveMonths,
                trailingAnnualDividendYield: data.trailingAnnualDividendYield,
                beta: data.beta,
                industry: data.industry,
                sector: data.sector
            });

            return {
                success: true,
                symbol: formattedSymbol,
                price: data.regularMarketPrice,
                change: data.regularMarketChange,
                changePercent: data.regularMarketChangePercent,
                cached: false,
                timestamp: fetchTimestamp,
                marketCap: data.marketCap,
                trailingPE: data.trailingPE,
                forwardPE: data.forwardPE,
                priceToBook: data.priceToBook,
                sharesOutstanding: data.sharesOutstanding,
                bookValue: data.bookValue,
                epsTrailingTwelveMonths: data.epsTrailingTwelveMonths,
                trailingAnnualDividendYield: data.trailingAnnualDividendYield,
                beta: data.beta,
                industry: data.industry,
                sector: data.sector
            };

        } catch (error) {
            console.error(`Failed to fetch price for ${formattedSymbol}:`, error);
            return {
                success: false,
                symbol: formattedSymbol,
                error: error instanceof Error ? error.message : 'Unknown error'
            };
        }
    }

    /**
     * Get current stock prices for multiple symbols
     */
    static async getBulkStockPrices(symbols: string[], settings?: { marketHoursOnly?: boolean; checkHolidays?: boolean }): Promise<BulkPriceUpdateResult> {
        if (!symbols || symbols.length === 0) {
            return {
                results: [],
                totalRequested: 0,
                totalSuccess: 0,
                totalErrors: 0,
                totalCached: 0
            };
        }

        const cleanSymbols = symbols
            .filter(symbol => symbol && symbol.trim() !== '')
            .map(symbol => {
                const clean = symbol.trim().toUpperCase();
                return clean.includes('.') ? clean : `${clean}.NS`;
            });

        const results: PriceUpdateResult[] = [];
        const uncachedSymbols: string[] = [];

        // Check cache for all symbols first
        for (const symbol of cleanSymbols) {
            const cached = this.getCachedPrice(symbol);
            if (cached) {
                results.push({
                    success: true,
                    symbol,
                    price: cached.price,
                    change: cached.change,
                    changePercent: cached.changePercent,
                    cached: true,
                    timestamp: cached.timestamp,
                    marketCap: cached.marketCap,
                    trailingPE: cached.trailingPE,
                    forwardPE: cached.forwardPE,
                    priceToBook: cached.priceToBook,
                    sharesOutstanding: cached.sharesOutstanding,
                    bookValue: cached.bookValue,
                    epsTrailingTwelveMonths: cached.epsTrailingTwelveMonths,
                    trailingAnnualDividendYield: cached.trailingAnnualDividendYield,
                    beta: cached.beta,
                    industry: cached.industry,
                    sector: cached.sector
                });
            } else {
                uncachedSymbols.push(symbol);
            }
        }

        // Check if we should update prices based on market status
        const marketHoursOnly = settings?.marketHoursOnly ?? true;
        const checkHolidays = settings?.checkHolidays ?? true;

        // Separate symbols that have previous cached data from those that don't
        const symbolsToFetch: string[] = [];

        if (!shouldUpdatePrices(marketHoursOnly, checkHolidays)) {
            // Try to get previous closing prices for uncached symbols
            for (const symbol of uncachedSymbols) {
                const previousCached = this.getPreviousClosingPrice(symbol);
                if (previousCached) {
                    results.push({
                        success: true,
                        symbol,
                        price: previousCached.price,
                        change: previousCached.change,
                        changePercent: previousCached.changePercent,
                        cached: true,
                        timestamp: previousCached.timestamp,
                        marketCap: previousCached.marketCap,
                        trailingPE: previousCached.trailingPE,
                        forwardPE: previousCached.forwardPE,
                        priceToBook: previousCached.priceToBook,
                        sharesOutstanding: previousCached.sharesOutstanding,
                        bookValue: previousCached.bookValue,
                        epsTrailingTwelveMonths: previousCached.epsTrailingTwelveMonths,
                        trailingAnnualDividendYield: previousCached.trailingAnnualDividendYield,
                        beta: previousCached.beta,
                        industry: previousCached.industry,
                        sector: previousCached.sector
                        
                    });
                } else {
                    // No cached data available, add to fetch list
                    symbolsToFetch.push(symbol);
                }
            }
        } else {
            // Market is open, fetch all uncached symbols
            symbolsToFetch.push(...uncachedSymbols);
        }

        // Fetch symbols that don't have cached data
        if (symbolsToFetch.length > 0) {
            const batches = this.createBatches(symbolsToFetch, this.MAX_BATCH_SIZE);

            for (const batch of batches) {
                await this.applyRateLimit();

                try {
                    const response = await fetch('/api/stocks/quotes', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                        },
                        body: JSON.stringify({ symbols: batch }),
                    });

                    if (!response.ok) {
                        const errorData = await response.json().catch(() => ({}));
                        throw new Error(errorData.error || `HTTP ${response.status}`);
                    }

                    const data = await response.json();

                    // Process successful quotes
                    if (data.quotes && Array.isArray(data.quotes)) {
                        for (const quote of data.quotes) {
                            const fetchTimestamp = Date.now();

                            // Cache the result
                            this.setCachedPrice(quote.symbol, {
                                symbol: quote.symbol,
                                price: quote.regularMarketPrice,
                                change: quote.regularMarketChange,
                                changePercent: quote.regularMarketChangePercent,
                                timestamp: fetchTimestamp,
                                marketState: quote.marketState,
                                currency: quote.currency,
                                shortName: quote.shortName,
                                longName: quote.longName,
                                marketCap: quote.marketCap,
                                trailingPE: quote.trailingPE,
                                forwardPE: quote.forwardPE,
                                priceToBook: quote.priceToBook,
                                sharesOutstanding: quote.sharesOutstanding,
                                bookValue: quote.bookValue,
                                epsTrailingTwelveMonths: quote.epsTrailingTwelveMonths,
                                trailingAnnualDividendYield: quote.trailingAnnualDividendYield,
                                beta: quote.beta,
                                industry: quote.industry,
                                sector: quote.sector
                            });

                            results.push({
                                success: true,
                                symbol: quote.symbol,
                                price: quote.regularMarketPrice,
                                change: quote.regularMarketChange,
                                changePercent: quote.regularMarketChangePercent,
                                cached: false,
                                timestamp: fetchTimestamp,
                                marketCap: quote.marketCap,
                                trailingPE: quote.trailingPE,
                                forwardPE: quote.forwardPE,
                                priceToBook: quote.priceToBook,
                                sharesOutstanding: quote.sharesOutstanding,
                                bookValue: quote.bookValue,
                                epsTrailingTwelveMonths: quote.epsTrailingTwelveMonths,
                                trailingAnnualDividendYield: quote.trailingAnnualDividendYield,
                                beta: quote.beta,
                                industry: quote.industry,
                                sector: quote.sector
                            });
                        }
                    }

                    // Process errors
                    if (data.errors && Array.isArray(data.errors)) {
                        for (const error of data.errors) {
                            results.push({
                                success: false,
                                symbol: error.symbol,
                                error: error.error
                            });
                        }
                    }

                } catch (error) {
                    console.error('Failed to fetch bulk prices:', error);
                    // Add error results for all symbols in this batch
                    for (const symbol of batch) {
                        results.push({
                            success: false,
                            symbol,
                            error: error instanceof Error ? error.message : 'Unknown error'
                        });
                    }
                }

                // Add delay between batches
                if (batches.indexOf(batch) < batches.length - 1) {
                    await new Promise(resolve => setTimeout(resolve, 1000));
                }
            }
        }

        const totalSuccess = results.filter(r => r.success).length;
        const totalErrors = results.filter(r => !r.success).length;
        const totalCached = results.filter(r => r.cached).length;

        return {
            results,
            totalRequested: cleanSymbols.length,
            totalSuccess,
            totalErrors,
            totalCached
        };
    }

    /**
     * Update prices for companies with valid symbols
     */
    static async updateCompanyPrices(companies: CompanyFinancials[], settings?: { marketHoursOnly?: boolean; checkHolidays?: boolean }): Promise<{
        updatedCompanies: CompanyFinancials[];
        priceResults: PriceUpdateResult[];
    }> {
        const companiesWithSymbols = companies.filter(company =>
            company.symbol && company.symbol.trim() !== ''
        );

        if (companiesWithSymbols.length === 0) {
            return {
                updatedCompanies: companies,
                priceResults: []
            };
        }

        const symbols = companiesWithSymbols.map(company => company.symbol!);
        const priceResults = await this.getBulkStockPrices(symbols, settings);

        const updatedCompanies = companies.map(company => {
            if (!company.symbol) return company;

            const formattedSymbol = company.symbol.includes('.') ? company.symbol.toUpperCase() : `${company.symbol.toUpperCase()}.NS`;
            const priceResult = priceResults.results.find(r =>
                r.symbol === formattedSymbol
            );

            if (priceResult && priceResult.success && priceResult.price !== undefined) {
                return {
                    ...company,
                    price: priceResult.price.toString(),
                    updatedAt: new Date()
                };
            }

            return company;
        });

        return {
            updatedCompanies,
            priceResults: priceResults.results
        };
    }

    /**
     * Get cached price if available and not expired
     */
    private static getCachedPrice(symbol: string): CachedPrice | null {
        const cached = this.cache.get(symbol);
        if (!cached) return null;

        const now = Date.now();
        const cacheDuration = this.getCacheDuration();

        if (now - cached.timestamp > cacheDuration) {
            this.cache.delete(symbol);
            return null;
        }

        return cached;
    }

    /**
     * Get previous closing price (longer cache for market closed periods)
     */
    private static getPreviousClosingPrice(symbol: string): CachedPrice | null {
        const cached = this.cache.get(symbol);
        if (!cached) return null;

        // For closed market periods, allow older cache (up to 24 hours)
        const now = Date.now();
        const maxAge = 24 * 60 * 60 * 1000; // 24 hours

        if (now - cached.timestamp > maxAge) {
            return null;
        }

        return cached;
    }

    /**
     * Set cached price
     */
    private static setCachedPrice(symbol: string, price: CachedPrice): void {
        this.cache.set(symbol, price);
    }

    /**
     * Apply rate limiting between requests
     */
    private static async applyRateLimit(): Promise<void> {
        const now = Date.now();
        const timeSinceLastRequest = now - this.lastRequestTime;

        if (timeSinceLastRequest < this.RATE_LIMIT_DELAY) {
            await new Promise(resolve =>
                setTimeout(resolve, this.RATE_LIMIT_DELAY - timeSinceLastRequest)
            );
        }

        this.lastRequestTime = Date.now();
    }

    /**
     * Create batches from array
     */
    private static createBatches<T>(array: T[], batchSize: number): T[][] {
        const batches: T[][] = [];
        for (let i = 0; i < array.length; i += batchSize) {
            batches.push(array.slice(i, i + batchSize));
        }
        return batches;
    }

    /**
     * Clear all cached prices
     */
    static clearCache(): void {
        this.cache.clear();
    }

    /**
     * Get cache statistics
     */
    static getCacheStats(): {
        totalCached: number;
        validCached: number;
        expiredCached: number;
    } {
        const now = Date.now();
        const cacheDuration = this.getCacheDuration();
        let validCached = 0;
        let expiredCached = 0;

        for (const [, cached] of this.cache.entries()) {
            if (now - cached.timestamp > cacheDuration) {
                expiredCached++;
            } else {
                validCached++;
            }
        }

        return {
            totalCached: this.cache.size,
            validCached,
            expiredCached
        };
    }

    /**
     * Clean expired cache entries
     */
    static cleanExpiredCache(): number {
        const now = Date.now();
        const cacheDuration = this.getCacheDuration();
        let cleanedCount = 0;

        for (const [symbol, cached] of this.cache.entries()) {
            if (now - cached.timestamp > cacheDuration) {
                this.cache.delete(symbol);
                cleanedCount++;
            }
        }

        return cleanedCount;
    }

    /**
     * Force fetch prices regardless of market status (useful for manual refresh)
     */
    static async forceFetchStockPrice(symbol: string): Promise<PriceUpdateResult> {
        return this.getStockPrice(symbol, { marketHoursOnly: false, checkHolidays: false });
    }

    /**
     * Force fetch bulk prices regardless of market status (useful for manual refresh)
     */
    static async forceFetchBulkStockPrices(symbols: string[]): Promise<BulkPriceUpdateResult> {
        return this.getBulkStockPrices(symbols, { marketHoursOnly: false, checkHolidays: false });
    }

    /**
     * Check if a symbol has cached data (including previous closing price)
     */
    static hasCachedData(symbol: string): boolean {
        const cleanSymbol = symbol.trim().toUpperCase();
        const formattedSymbol = cleanSymbol.includes('.') ? cleanSymbol : `${cleanSymbol}.NS`;

        const cached = this.getCachedPrice(formattedSymbol);
        if (cached) return true;

        const previousCached = this.getPreviousClosingPrice(formattedSymbol);
        return previousCached !== null;
    }

    /**
     * Get current market status
     */
    static getMarketStatus(): MarketStatus {
        return getMarketStatus();
    }
}

export default PriceUpdateService;