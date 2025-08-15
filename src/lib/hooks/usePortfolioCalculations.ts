/**
 * Portfolio Calculations Hook
 * Provides memoized portfolio calculations and metrics
 */

import { useMemo } from 'react';
import { Portfolio } from '@/types';
import { 
  PortfolioCalculationService, 
  type PortfolioMetrics, 
  type AllocationData,
  type HoldingCalculations 
} from '@/lib/utils/portfolioCalculations';

/**
 * Hook for comprehensive portfolio metrics with memoization
 */
export function usePortfolioMetrics(portfolio: Portfolio): PortfolioMetrics {
  return useMemo(() => {
    return PortfolioCalculationService.calculatePortfolioMetrics(portfolio);
  }, [portfolio.id, portfolio.currentValue, portfolio.holdings, portfolio.transactions]);
}

/**
 * Hook for portfolio allocation data with memoization
 */
export function usePortfolioAllocation(portfolio: Portfolio): AllocationData {
  return useMemo(() => {
    return PortfolioCalculationService.calculateAllocationData(portfolio);
  }, [portfolio.id, portfolio.holdings]);
}

/**
 * Hook for portfolio performance data with memoization
 */
export function usePortfolioPerformance(portfolio: Portfolio, timeframe: '1M' | '3M' | '6M' | '1Y' | 'ALL') {
  return useMemo(() => {
    return PortfolioCalculationService.calculatePerformanceData(portfolio, timeframe);
  }, [portfolio.id, portfolio.transactions, portfolio.holdings, timeframe]);
}

/**
 * Hook for concentration risk analysis with memoization
 */
export function useConcentrationRisk(portfolio: Portfolio) {
  return useMemo(() => {
    return PortfolioCalculationService.calculateConcentrationRisk(portfolio);
  }, [portfolio.id, portfolio.holdings]);
}

/**
 * Hook for diversification score with memoization
 */
export function useDiversificationScore(portfolio: Portfolio): number {
  return useMemo(() => {
    return PortfolioCalculationService.calculateDiversificationScore(portfolio);
  }, [portfolio.id, portfolio.holdings]);
}

/**
 * Hook for individual holding calculations with memoization
 */
export function useHoldingCalculations(holding: any): HoldingCalculations {
  return useMemo(() => {
    return PortfolioCalculationService.calculateHoldingMetrics(holding);
  }, [holding.id, holding.quantity, holding.averagePrice, holding.currentPrice, holding.totalValue, holding.unrealizedGain]);
}

/**
 * Hook for portfolio summary statistics
 */
export function usePortfolioSummary(portfolio: Portfolio) {
  const metrics = usePortfolioMetrics(portfolio);
  const allocation = usePortfolioAllocation(portfolio);
  const concentrationRisk = useConcentrationRisk(portfolio);
  const diversificationScore = useDiversificationScore(portfolio);
  
  return useMemo(() => ({
    ...metrics,
    allocation,
    concentrationRisk,
    diversificationScore,
    // Additional derived metrics
    averageHoldingSize: metrics.holdingsCount > 0 ? metrics.currentValue / metrics.holdingsCount : 0,
    largestSector: allocation.sectors.length > 0 ? allocation.sectors[0] : null,
    topHolding: allocation.holdings.length > 0 ? allocation.holdings[0] : null,
    riskLevel: concentrationRisk.concentrationLevel,
    isWellDiversified: diversificationScore >= 70,
    needsRebalancing: concentrationRisk.largestHoldingPercent > 25
  }), [metrics, allocation, concentrationRisk, diversificationScore]);
}

/**
 * Hook for portfolio comparison data
 */
export function usePortfolioComparison(portfolios: Portfolio[]) {
  return useMemo(() => {
    return portfolios.map(portfolio => {
      const metrics = PortfolioCalculationService.calculatePortfolioMetrics(portfolio);
      const allocation = PortfolioCalculationService.calculateAllocationData(portfolio);
      const concentrationRisk = PortfolioCalculationService.calculateConcentrationRisk(portfolio);
      const diversificationScore = PortfolioCalculationService.calculateDiversificationScore(portfolio);
      
      return {
        portfolio,
        metrics,
        allocation,
        concentrationRisk,
        diversificationScore
      };
    });
  }, [portfolios]);
}

/**
 * Hook for optimized portfolio calculations with performance monitoring
 */
export function useOptimizedPortfolioCalculations(portfolio: Portfolio) {
  const startTime = performance.now();
  
  const metrics = usePortfolioMetrics(portfolio);
  const allocation = usePortfolioAllocation(portfolio);
  const concentrationRisk = useConcentrationRisk(portfolio);
  const diversificationScore = useDiversificationScore(portfolio);
  
  const calculationTime = performance.now() - startTime;
  
  // Log performance for portfolios with many holdings
  if (portfolio.holdings.length > 100 && calculationTime > 50) {
    console.warn(`Portfolio calculations took ${calculationTime.toFixed(2)}ms for ${portfolio.holdings.length} holdings`);
  }
  
  return useMemo(() => ({
    metrics,
    allocation,
    concentrationRisk,
    diversificationScore,
    performance: {
      calculationTime,
      holdingsCount: portfolio.holdings.length,
      isOptimized: calculationTime < 50
    }
  }), [metrics, allocation, concentrationRisk, diversificationScore, calculationTime, portfolio.holdings.length]);
}

/**
 * Hook for batch portfolio calculations (for multiple portfolios)
 */
export function useBatchPortfolioCalculations(portfolios: Portfolio[]) {
  return useMemo(() => {
    const startTime = performance.now();
    
    const results = portfolios.map(portfolio => ({
      portfolioId: portfolio.id,
      metrics: PortfolioCalculationService.calculatePortfolioMetrics(portfolio),
      allocation: PortfolioCalculationService.calculateAllocationData(portfolio),
      concentrationRisk: PortfolioCalculationService.calculateConcentrationRisk(portfolio),
      diversificationScore: PortfolioCalculationService.calculateDiversificationScore(portfolio)
    }));
    
    const totalTime = performance.now() - startTime;
    const totalHoldings = portfolios.reduce((sum, p) => sum + p.holdings.length, 0);
    
    // Performance monitoring for large datasets
    if (totalHoldings > 500 && totalTime > 200) {
      console.warn(`Batch portfolio calculations took ${totalTime.toFixed(2)}ms for ${portfolios.length} portfolios with ${totalHoldings} total holdings`);
    }
    
    return {
      results,
      performance: {
        totalTime,
        portfolioCount: portfolios.length,
        totalHoldings,
        averageTimePerPortfolio: totalTime / portfolios.length,
        isOptimized: totalTime < 200
      }
    };
  }, [portfolios]);
}