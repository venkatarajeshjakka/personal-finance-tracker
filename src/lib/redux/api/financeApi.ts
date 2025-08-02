import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Types for Yahoo Finance API responses
interface StockQuote {
  symbol: string;
  regularMarketPrice: number;
  regularMarketChange: number;
  regularMarketChangePercent: number;
  regularMarketTime: number;
  marketState: string;
  regularMarketPreviousClose: number;
  regularMarketOpen: number;
  regularMarketDayHigh: number;
  regularMarketDayLow: number;
  regularMarketVolume: number;
}

interface StockQuoteResponse {
  quotes: StockQuote[];
}

interface HistoricalDataPoint {
  date: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
  adjClose: number;
}

interface HistoricalDataResponse {
  symbol: string;
  data: HistoricalDataPoint[];
}

// Types for Gemini AI responses
interface AIInsightRequest {
  type: 'company_analysis' | 'portfolio_optimization' | 'quarterly_analysis' | 'investment_recommendation';
  data: any;
  context?: string;
}

interface AIInsightResponse {
  insight: string;
  confidence: number;
  recommendations?: string[];
  keyPoints?: string[];
}

export const financeApi = createApi({
  reducerPath: 'financeApi',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      headers.set('Content-Type', 'application/json');
      return headers;
    },
  }),
  tagTypes: ['StockQuote', 'HistoricalData', 'AIInsight'],
  endpoints: (builder) => ({
    // Yahoo Finance API endpoints
    getStockQuote: builder.query<StockQuote, string>({
      query: (symbol) => `/stocks/quote/${symbol}`,
      providesTags: (result, error, symbol) => [{ type: 'StockQuote', id: symbol }],
      // Cache for 1 minute
      keepUnusedDataFor: 60,
    }),
    
    getMultipleStockQuotes: builder.query<StockQuoteResponse, string[]>({
      query: (symbols) => ({
        url: '/stocks/quotes',
        method: 'POST',
        body: { symbols },
      }),
      providesTags: (result, error, symbols) => 
        symbols.map(symbol => ({ type: 'StockQuote' as const, id: symbol })),
      // Cache for 1 minute
      keepUnusedDataFor: 60,
    }),
    
    getHistoricalData: builder.query<HistoricalDataResponse, {
      symbol: string;
      period?: '1d' | '5d' | '1mo' | '3mo' | '6mo' | '1y' | '2y' | '5y' | '10y' | 'ytd' | 'max';
      interval?: '1m' | '2m' | '5m' | '15m' | '30m' | '60m' | '90m' | '1h' | '1d' | '5d' | '1wk' | '1mo' | '3mo';
    }>({
      query: ({ symbol, period = '1y', interval = '1d' }) => 
        `/stocks/historical/${symbol}?period=${period}&interval=${interval}`,
      providesTags: (result, error, { symbol }) => [{ type: 'HistoricalData', id: symbol }],
      // Cache for 5 minutes
      keepUnusedDataFor: 300,
    }),
    
    searchStocks: builder.query<{ symbol: string; name: string; type: string }[], string>({
      query: (query) => `/stocks/search?q=${encodeURIComponent(query)}`,
      // Cache for 10 minutes
      keepUnusedDataFor: 600,
    }),
    
    // Gemini AI endpoints
    getAIInsight: builder.mutation<AIInsightResponse, AIInsightRequest>({
      query: (request) => ({
        url: '/ai/insights',
        method: 'POST',
        body: request,
      }),
      invalidatesTags: ['AIInsight'],
    }),
    
    getCompanyAnalysis: builder.mutation<AIInsightResponse, {
      companyData: any;
      context?: string;
    }>({
      query: (data) => ({
        url: '/ai/company-analysis',
        method: 'POST',
        body: data,
      }),
    }),
    
    getPortfolioOptimization: builder.mutation<AIInsightResponse, {
      portfolioData: any;
      riskTolerance?: 'low' | 'medium' | 'high';
      timeHorizon?: 'short' | 'medium' | 'long';
    }>({
      query: (data) => ({
        url: '/ai/portfolio-optimization',
        method: 'POST',
        body: data,
      }),
    }),
    
    getQuarterlyAnalysis: builder.mutation<AIInsightResponse, {
      quarterlyData: any;
      previousQuarters?: any[];
    }>({
      query: (data) => ({
        url: '/ai/quarterly-analysis',
        method: 'POST',
        body: data,
      }),
    }),
    
    getInvestmentRecommendations: builder.mutation<AIInsightResponse, {
      userProfile: any;
      currentHoldings?: any[];
      preferences?: any;
    }>({
      query: (data) => ({
        url: '/ai/investment-recommendations',
        method: 'POST',
        body: data,
      }),
    }),
  }),
});

export const {
  // Stock data hooks
  useGetStockQuoteQuery,
  useLazyGetStockQuoteQuery,
  useGetMultipleStockQuotesQuery,
  useLazyGetMultipleStockQuotesQuery,
  useGetHistoricalDataQuery,
  useLazyGetHistoricalDataQuery,
  useSearchStocksQuery,
  useLazySearchStocksQuery,
  
  // AI insight hooks
  useGetAIInsightMutation,
  useGetCompanyAnalysisMutation,
  useGetPortfolioOptimizationMutation,
  useGetQuarterlyAnalysisMutation,
  useGetInvestmentRecommendationsMutation,
} = financeApi;