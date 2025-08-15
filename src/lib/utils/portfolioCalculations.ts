/**
 * Centralized Portfolio Calculation Utilities
 * Eliminates code duplication across portfolio components
 */

import { Portfolio, Holding, Transaction, calculateNetInvested } from '@/types';

export interface PortfolioMetrics {
  totalInvestment: number;
  currentValue: number;
  totalReturn: number;
  totalReturnPercent: number;
  dayPL: number;
  dayPLPercent: number;
  holdingsCount: number;
  topGainer?: Holding;
  topLoser?: Holding;
  averageReturn: number;
  bestPerformingStock: {
    symbol: string;
    return: number;
    returnPercent: number;
  } | null;
  worstPerformingStock: {
    symbol: string;
    return: number;
    returnPercent: number;
  } | null;
}

export interface HoldingCalculations {
  investedAmount: number;
  currentValue: number;
  unrealizedGain: number;
  unrealizedGainPercent: number;
  netChange: number;
  netChangePercent: number;
  dayGainLoss: number;
  dayGainLossPercent: number;
}

export interface AllocationData {
  holdings: Array<{
    symbol: string;
    value: number;
    percentage: number;
    unrealizedGain: number;
    quantity: number;
  }>;
  sectors: Array<{
    sector: string;
    value: number;
    percentage: number;
    count: number;
  }>;
  industries: Array<{
    industry: string;
    value: number;
    percentage: number;
    count: number;
  }>;
  marketCaps: Array<{
    category: string;
    value: number;
    percentage: number;
    count: number;
  }>;
}

/**
 * Portfolio Calculation Service
 * Provides centralized calculation functions for portfolio metrics
 */
export class PortfolioCalculationService {
  
  /**
   * Calculate comprehensive portfolio metrics
   */
  static calculatePortfolioMetrics(portfolio: Portfolio): PortfolioMetrics {
    const totalInvestment = calculateNetInvested(portfolio.transactions);
    const currentValue = portfolio.currentValue;
    const totalReturn = currentValue - totalInvestment;
    const totalReturnPercent = totalInvestment > 0 ? (totalReturn / totalInvestment) * 100 : 0;
    
    // Calculate day P&L
    const dayPL = portfolio.holdings.reduce((sum, holding) => {
      return sum + (holding.dayGainLoss || 0);
    }, 0);
    
    const dayPLPercent = currentValue > 0 ? (dayPL / currentValue) * 100 : 0;
    
    // Find top gainer and loser
    let topGainer: Holding | undefined;
    let topLoser: Holding | undefined;
    let maxGainPercent = -Infinity;
    let maxLossPercent = Infinity;
    
    portfolio.holdings.forEach(holding => {
      const gainPercent = this.calculateUnrealizedGainPercent(holding);
      if (gainPercent > maxGainPercent) {
        maxGainPercent = gainPercent;
        topGainer = holding;
      }
      if (gainPercent < maxLossPercent) {
        maxLossPercent = gainPercent;
        topLoser = holding;
      }
    });
    
    // Calculate average return
    const averageReturn = portfolio.holdings.length > 0 ? 
      portfolio.holdings.reduce((sum, holding) => sum + this.calculateUnrealizedGainPercent(holding), 0) / portfolio.holdings.length : 0;
    
    // Best and worst performing stocks
    const bestPerformingStock = topGainer ? {
      symbol: topGainer.symbol,
      return: topGainer.unrealizedGain,
      returnPercent: maxGainPercent
    } : null;
    
    const worstPerformingStock = topLoser && maxLossPercent < 0 ? {
      symbol: topLoser.symbol,
      return: topLoser.unrealizedGain,
      returnPercent: maxLossPercent
    } : null;
    
    return {
      totalInvestment,
      currentValue,
      totalReturn,
      totalReturnPercent,
      dayPL,
      dayPLPercent,
      holdingsCount: portfolio.holdings.length,
      topGainer,
      topLoser,
      averageReturn,
      bestPerformingStock,
      worstPerformingStock
    };
  }
  
  /**
   * Calculate individual holding metrics
   */
  static calculateHoldingMetrics(holding: Holding): HoldingCalculations {
    const investedAmount = holding.quantity * holding.averagePrice;
    const currentValue = holding.totalValue;
    const unrealizedGain = holding.unrealizedGain;
    const unrealizedGainPercent = this.calculateUnrealizedGainPercent(holding);
    const netChange = holding.currentPrice - holding.averagePrice;
    const netChangePercent = holding.averagePrice > 0 ? (netChange / holding.averagePrice) * 100 : 0;
    const dayGainLoss = holding.dayGainLoss || 0;
    const dayGainLossPercent = holding.priceChangePercent || 0;
    
    return {
      investedAmount,
      currentValue,
      unrealizedGain,
      unrealizedGainPercent,
      netChange,
      netChangePercent,
      dayGainLoss,
      dayGainLossPercent
    };
  }
  
  /**
   * Calculate unrealized gain percentage for a holding
   */
  static calculateUnrealizedGainPercent(holding: Holding): number {
    const investedAmount = holding.quantity * holding.averagePrice;
    return investedAmount > 0 ? (holding.unrealizedGain / investedAmount) * 100 : 0;
  }
  
  /**
   * Calculate portfolio allocation data
   */
  static calculateAllocationData(portfolio: Portfolio): AllocationData {
    const totalValue = portfolio.currentValue;
    
    // Holdings allocation
    const holdingAllocations = portfolio.holdings
      .map(holding => ({
        symbol: holding.symbol,
        value: holding.totalValue,
        percentage: totalValue > 0 ? (holding.totalValue / totalValue) * 100 : 0,
        unrealizedGain: holding.unrealizedGain,
        quantity: holding.quantity
      }))
      .sort((a, b) => b.percentage - a.percentage);
    
    // Sector allocation
    const sectorMap = new Map<string, { value: number; count: number }>();
    portfolio.holdings.forEach(holding => {
      const sector = holding.sector || 'Unknown';
      const existing = sectorMap.get(sector) || { value: 0, count: 0 };
      sectorMap.set(sector, {
        value: existing.value + holding.totalValue,
        count: existing.count + 1
      });
    });
    
    const sectorAllocations = Array.from(sectorMap.entries())
      .map(([sector, data]) => ({
        sector,
        value: data.value,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
        count: data.count
      }))
      .filter(item => item.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage);
    
    // Industry allocation
    const industryMap = new Map<string, { value: number; count: number }>();
    portfolio.holdings.forEach(holding => {
      const industry = holding.industry || 'Unknown';
      const existing = industryMap.get(industry) || { value: 0, count: 0 };
      industryMap.set(industry, {
        value: existing.value + holding.totalValue,
        count: existing.count + 1
      });
    });
    
    const industryAllocations = Array.from(industryMap.entries())
      .map(([industry, data]) => ({
        industry,
        value: data.value,
        percentage: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
        count: data.count
      }))
      .filter(item => item.percentage > 0)
      .sort((a, b) => b.percentage - a.percentage);
    
    // Market cap allocation (simplified - would need market cap categories)
    const marketCapAllocations: Array<{
      category: string;
      value: number;
      percentage: number;
      count: number;
    }> = [];
    
    return {
      holdings: holdingAllocations,
      sectors: sectorAllocations,
      industries: industryAllocations,
      marketCaps: marketCapAllocations
    };
  }
  
  /**
   * Calculate portfolio performance over time
   */
  static calculatePerformanceData(portfolio: Portfolio, timeframe: '1M' | '3M' | '6M' | '1Y' | 'ALL') {
    const data: Array<{
      date: string;
      portfolioValue: number;
      invested: number;
      return: number;
      returnPercent: number;
    }> = [];
    
    const sortedTransactions = [...portfolio.transactions].sort((a, b) => 
      new Date(a.date).getTime() - new Date(b.date).getTime()
    );

    if (sortedTransactions.length === 0) {
      return [];
    }

    // Calculate portfolio value at each transaction point
    let runningInvested = 0;
    const holdings = new Map<string, { quantity: number; avgPrice: number }>();

    sortedTransactions.forEach((transaction) => {
      const transactionDate = new Date(transaction.date);
      
      // Update holdings
      const existing = holdings.get(transaction.symbol) || { quantity: 0, avgPrice: 0 };
      
      if (transaction.type === 'buy') {
        const totalQuantity = existing.quantity + transaction.quantity;
        const totalCost = (existing.quantity * existing.avgPrice) + (transaction.quantity * transaction.price);
        const newAvgPrice = totalQuantity > 0 ? totalCost / totalQuantity : 0;
        
        holdings.set(transaction.symbol, {
          quantity: totalQuantity,
          avgPrice: newAvgPrice
        });
        runningInvested += transaction.totalAmount;
      } else if (transaction.type === 'sell') {
        const newQuantity = Math.max(0, existing.quantity - transaction.quantity);
        holdings.set(transaction.symbol, {
          quantity: newQuantity,
          avgPrice: existing.avgPrice
        });
        runningInvested -= transaction.totalAmount;
      }

      // Calculate current portfolio value (using current prices for simplicity)
      let portfolioValue = 0;
      holdings.forEach((holding, symbol) => {
        const currentHolding = portfolio.holdings.find(h => h.symbol === symbol);
        const currentPrice = currentHolding?.currentPrice || holding.avgPrice;
        portfolioValue += holding.quantity * currentPrice;
      });

      const returnValue = portfolioValue - runningInvested;
      const returnPercent = runningInvested > 0 ? (returnValue / runningInvested) * 100 : 0;

      data.push({
        date: transactionDate.toISOString().split('T')[0],
        portfolioValue,
        invested: runningInvested,
        return: returnValue,
        returnPercent
      });
    });

    // Add current data point
    const currentInvested = calculateNetInvested(portfolio.transactions);
    const currentReturn = portfolio.currentValue - currentInvested;
    const currentReturnPercent = currentInvested > 0 ? (currentReturn / currentInvested) * 100 : 0;

    data.push({
      date: new Date().toISOString().split('T')[0],
      portfolioValue: portfolio.currentValue,
      invested: currentInvested,
      return: currentReturn,
      returnPercent: currentReturnPercent
    });

    // Filter data based on timeframe
    const now = new Date();
    let startDate = new Date();
    
    switch (timeframe) {
      case '1M':
        startDate.setMonth(now.getMonth() - 1);
        break;
      case '3M':
        startDate.setMonth(now.getMonth() - 3);
        break;
      case '6M':
        startDate.setMonth(now.getMonth() - 6);
        break;
      case '1Y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      case 'ALL':
        startDate = new Date(0); // Include all data
        break;
    }

    return data.filter(point => new Date(point.date) >= startDate);
  }
  
  /**
   * Calculate concentration risk metrics
   */
  static calculateConcentrationRisk(portfolio: Portfolio) {
    const totalValue = portfolio.currentValue;
    
    if (totalValue === 0 || portfolio.holdings.length === 0) {
      return {
        largestHoldingPercent: 0,
        top5HoldingsPercent: 0,
        herfindahlIndex: 0,
        concentrationLevel: 'Low' as const
      };
    }
    
    // Calculate holding percentages
    const holdingPercentages = portfolio.holdings
      .map(holding => (holding.totalValue / totalValue) * 100)
      .sort((a, b) => b - a);
    
    const largestHoldingPercent = holdingPercentages[0] || 0;
    const top5HoldingsPercent = holdingPercentages.slice(0, 5).reduce((sum, pct) => sum + pct, 0);
    
    // Calculate Herfindahl-Hirschman Index
    const herfindahlIndex = holdingPercentages.reduce((sum, pct) => sum + (pct * pct), 0);
    
    // Determine concentration level
    let concentrationLevel: 'Low' | 'Medium' | 'High' | 'Very High' = 'Low';
    if (largestHoldingPercent > 40 || herfindahlIndex > 2500) {
      concentrationLevel = 'Very High';
    } else if (largestHoldingPercent > 25 || herfindahlIndex > 1800) {
      concentrationLevel = 'High';
    } else if (largestHoldingPercent > 15 || herfindahlIndex > 1000) {
      concentrationLevel = 'Medium';
    }
    
    return {
      largestHoldingPercent,
      top5HoldingsPercent,
      herfindahlIndex,
      concentrationLevel
    };
  }
  
  /**
   * Calculate diversification score (0-100)
   */
  static calculateDiversificationScore(portfolio: Portfolio): number {
    const numberOfHoldings = portfolio.holdings.length;
    const allocationData = this.calculateAllocationData(portfolio);
    const numberOfSectors = allocationData.sectors.length;
    const maxSectorConcentration = Math.max(...allocationData.sectors.map(s => s.percentage), 0);
    const concentrationRisk = this.calculateConcentrationRisk(portfolio);
    
    let score = 0;
    
    // Holdings diversity (0-40 points)
    score += Math.min(numberOfHoldings * 2, 40);
    
    // Sector diversity (0-30 points)
    score += Math.min(numberOfSectors * 5, 30);
    
    // Concentration penalty (0-30 points)
    score += Math.max(0, 30 - (maxSectorConcentration - 20));
    
    // Additional penalty for very high concentration
    if (concentrationRisk.concentrationLevel === 'Very High') {
      score -= 20;
    } else if (concentrationRisk.concentrationLevel === 'High') {
      score -= 10;
    }
    
    return Math.max(0, Math.min(100, score));
  }
}