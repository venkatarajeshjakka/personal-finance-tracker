import { Portfolio, Holding, calculateNetInvested } from '@/types';

export interface VolatilityData {
  weight: number;
  volatility: number;
  symbol: string;
}

export interface HistoricalDataPoint {
  date: string;
  close: number;
}

export interface BetaDataQuality {
  quality: 'high' | 'medium' | 'low';
  percentage: number;
  description: string;
}

/**
 * Risk Calculation Utility Class
 * Provides comprehensive risk analysis functions for portfolio management
 */
export class RiskCalculationService {
  
  /**
   * Calculate portfolio volatility using Yahoo Finance historical data
   */
  static async calculatePortfolioVolatility(portfolio: Portfolio): Promise<number> {
    if (portfolio.holdings.length === 0) return 0;

    try {
      const totalValue = portfolio.currentValue;
      const volatilityData: VolatilityData[] = [];

      // Fetch historical volatility for each holding
      for (const holding of portfolio.holdings) {
        const weight = holding.totalValue / totalValue;
        const formattedSymbol = holding.symbol.includes('.') ? holding.symbol : `${holding.symbol}.NS`;
        
        try {
          // Fetch 1 year of daily data for volatility calculation
          const response = await fetch(`/api/stocks/historical/${formattedSymbol}?period=1y&interval=1d`);
          
          if (response.ok) {
            const data = await response.json();
            
            if (data.data && data.data.length > 30) { // Need at least 30 days of data
              const volatility = this.calculateStockVolatility(data.data);
              volatilityData.push({
                weight,
                volatility,
                symbol: holding.symbol
              });
            } else {
              // Fallback to estimated volatility based on current return
              const estimatedVolatility = this.estimateVolatilityFromCurrentReturn(holding);
              volatilityData.push({
                weight,
                volatility: estimatedVolatility,
                symbol: holding.symbol
              });
            }
          } else {
            // Fallback for API errors
            const estimatedVolatility = this.estimateVolatilityFromCurrentReturn(holding);
            volatilityData.push({
              weight,
              volatility: estimatedVolatility,
              symbol: holding.symbol
            });
          }
        } catch (error) {
          console.warn(`Failed to fetch volatility for ${holding.symbol}:`, error);
          // Fallback to estimated volatility
          const estimatedVolatility = this.estimateVolatilityFromCurrentReturn(holding);
          volatilityData.push({
            weight,
            volatility: estimatedVolatility,
            symbol: holding.symbol
          });
        }
      }

      if (volatilityData.length === 0) return 0;

      // Calculate portfolio volatility using weighted individual volatilities
      // This is a simplified approach - proper portfolio volatility would need correlation matrix
      const weightedVolatility = volatilityData.reduce((sum, item) => {
        return sum + (item.weight * item.weight * item.volatility * item.volatility);
      }, 0);

      // Apply diversification benefit (simplified correlation assumption)
      const avgCorrelation = 0.3; // Typical stock correlation
      const diversificationFactor = Math.sqrt(
        weightedVolatility + 
        (avgCorrelation * (1 - weightedVolatility))
      );

      return Math.max(0, diversificationFactor);

    } catch (error) {
      console.error('Error calculating portfolio volatility:', error);
      // Fallback to simple calculation
      return this.calculateSimplePortfolioVolatility(portfolio);
    }
  }

  /**
   * Calculate individual stock volatility from historical data
   */
  static calculateStockVolatility(historicalData: HistoricalDataPoint[]): number {
    if (historicalData.length < 2) return 0;

    // Calculate daily returns
    const dailyReturns: number[] = [];
    for (let i = 1; i < historicalData.length; i++) {
      const prevClose = historicalData[i - 1].close;
      const currentClose = historicalData[i].close;
      
      if (prevClose > 0) {
        const dailyReturn = (currentClose - prevClose) / prevClose;
        dailyReturns.push(dailyReturn);
      }
    }

    if (dailyReturns.length < 2) return 0;

    // Calculate standard deviation of daily returns
    const mean = dailyReturns.reduce((sum, ret) => sum + ret, 0) / dailyReturns.length;
    const variance = dailyReturns.reduce((sum, ret) => sum + Math.pow(ret - mean, 2), 0) / (dailyReturns.length - 1);
    const dailyVolatility = Math.sqrt(variance);

    // Annualize volatility (multiply by sqrt of trading days per year)
    const annualizedVolatility = dailyVolatility * Math.sqrt(252) * 100; // Convert to percentage

    return annualizedVolatility;
  }

  /**
   * Calculate Sharpe ratio with proper annualized returns
   */
  static calculateSharpeRatio(portfolio: Portfolio, volatility: number): number {
    if (volatility <= 0) return 0;

    const netInvested = calculateNetInvested(portfolio.transactions);
    if (netInvested <= 0) return 0;

    // Calculate annualized portfolio return
    const totalReturn = ((portfolio.currentValue - netInvested) / netInvested) * 100;
    
    // Calculate time period for annualization
    const firstTransaction = portfolio.transactions.reduce((earliest, tx) =>
      new Date(tx.date) < new Date(earliest.date) ? tx : earliest
    );
    
    if (!firstTransaction) return 0;
    
    const daysSinceFirst = (Date.now() - new Date(firstTransaction.date).getTime()) / (1000 * 60 * 60 * 24);
    const years = daysSinceFirst / 365.25;
    
    if (years <= 0) return 0;
    
    // Annualize the return
    const annualizedReturn = years >= 1 ? 
      (Math.pow(1 + (totalReturn / 100), 1 / years) - 1) * 100 : 
      totalReturn * (365.25 / daysSinceFirst);

    // Use current Indian risk-free rate (approximate)
    const riskFreeRate = 6.5; // 10-year Government bond yield (approximate)
    
    // Calculate excess return
    const excessReturn = annualizedReturn - riskFreeRate;
    
    // Return Sharpe ratio
    return excessReturn / volatility;
  }

  /**
   * Calculate portfolio beta using actual Yahoo Finance beta values
   */
  static calculatePortfolioBeta(portfolio: Portfolio, portfolioVolatility: number): number {
    if (portfolio.holdings.length === 0) return 1;

    const totalValue = portfolio.currentValue;
    let weightedBeta = 0;
    let totalWeightWithBeta = 0;

    // Calculate weighted beta using actual beta values from Yahoo Finance
    portfolio.holdings.forEach(holding => {
      const weight = holding.totalValue / totalValue;
      
      if (holding.beta !== null && holding.beta !== undefined && !isNaN(holding.beta)) {
        // Use actual beta from Yahoo Finance
        weightedBeta += weight * holding.beta;
        totalWeightWithBeta += weight;
      }
    });

    // If we have beta data for some holdings, calculate weighted average
    if (totalWeightWithBeta > 0) {
      const actualWeightedBeta = weightedBeta / totalWeightWithBeta;
      
      // For holdings without beta data, use fallback sector-based betas
      if (totalWeightWithBeta < 1) {
        const remainingWeight = 1 - totalWeightWithBeta;
        const fallbackBeta = this.calculateFallbackBeta(portfolio, remainingWeight);
        return actualWeightedBeta * totalWeightWithBeta + fallbackBeta * remainingWeight;
      }
      
      return Math.max(0.1, Math.min(3.0, actualWeightedBeta));
    }

    // Fallback to sector-based calculation if no beta data is available
    return this.calculateFallbackBeta(portfolio, 1);
  }

  /**
   * Assess beta data quality for portfolio
   */
  static getBetaDataQuality(portfolio: Portfolio): BetaDataQuality {
    if (portfolio.holdings.length === 0) {
      return { quality: 'low', percentage: 0, description: '0% live data, no holdings' };
    }
    
    const totalValue = portfolio.currentValue;
    let weightWithBeta = 0;
    
    portfolio.holdings.forEach(holding => {
      if (holding.beta !== null && holding.beta !== undefined && !isNaN(holding.beta)) {
        weightWithBeta += holding.totalValue / totalValue;
      }
    });
    
    const percentage = Math.round(weightWithBeta * 100);
    
    if (weightWithBeta >= 0.8) {
      return { 
        quality: 'high', 
        percentage, 
        description: `${percentage}% from Yahoo Finance` 
      };
    }
    if (weightWithBeta >= 0.5) {
      return { 
        quality: 'medium', 
        percentage, 
        description: `${percentage}% live data, rest estimated` 
      };
    }
    return { 
      quality: 'low', 
      percentage, 
      description: `${percentage}% live data, mostly estimated` 
    };
  }

  /**
   * Fallback function to estimate volatility from current return
   */
  private static estimateVolatilityFromCurrentReturn(holding: Holding): number {
    const returnPercent = holding.averagePrice > 0 ?
      Math.abs((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100 : 0;
    
    // Rough estimate: volatility is typically 2-4x the absolute return for most stocks
    // This is a very rough approximation
    return Math.min(returnPercent * 3, 50); // Cap at 50% volatility
  }

  /**
   * Fallback beta calculation when Yahoo Finance data is not available
   */
  private static calculateFallbackBeta(portfolio: Portfolio, weight: number): number {
    const sectorBetas: { [sector: string]: number } = {
      'Technology': 1.3,
      'Financial Services': 1.2,
      'Healthcare': 0.9,
      'Consumer Goods': 1.0,
      'Industrials': 1.1,
      'Energy': 1.4,
      'Materials': 1.2,
      'Utilities': 0.7,
      'Real Estate': 1.1,
      'Telecommunications': 0.8,
      'Unknown': 1.0
    };

    const totalValue = portfolio.currentValue;
    
    // Calculate weighted beta based on sector allocation for holdings without beta data
    const sectorWeightedBeta = portfolio.holdings.reduce((sum, holding) => {
      if (holding.beta === null || holding.beta === undefined || isNaN(holding.beta)) {
        const holdingWeight = holding.totalValue / totalValue;
        const sector = holding.sector || 'Unknown';
        const sectorBeta = sectorBetas[sector] || 1.0;
        return sum + (holdingWeight * sectorBeta);
      }
      return sum;
    }, 0);

    return Math.max(0.1, Math.min(3.0, sectorWeightedBeta / weight));
  }

  /**
   * Simple fallback volatility calculation (original method)
   */
  static calculateSimplePortfolioVolatility(portfolio: Portfolio): number {
    if (portfolio.holdings.length === 0) return 0;

    const totalValue = portfolio.currentValue;
    const weightedReturns = portfolio.holdings.map(holding => {
      const weight = holding.totalValue / totalValue;
      const returnPercent = holding.averagePrice > 0 ?
        ((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100 : 0;
      return { weight, return: returnPercent };
    });

    const portfolioReturn = weightedReturns.reduce((sum, item) => sum + (item.weight * item.return), 0);
    const weightedVariance = weightedReturns.reduce((sum, item) => {
      const deviation = item.return - portfolioReturn;
      return sum + (item.weight * item.weight * deviation * deviation);
    }, 0);

    const correlationAdjustment = 0.3;
    const diversificationBenefit = 1 - (correlationAdjustment * (1 - (1 / portfolio.holdings.length)));
    const adjustedVariance = weightedVariance * diversificationBenefit;

    return Math.max(0, Math.sqrt(adjustedVariance));
  }

  /**
   * Calculate Value at Risk (VaR) at specified confidence level
   */
  static calculateValueAtRisk(portfolio: Portfolio, confidenceLevel: number = 0.05): number {
    const netInvested = calculateNetInvested(portfolio.transactions);
    if (netInvested <= 0) return 0;

    const portfolioReturn = netInvested > 0 ? ((portfolio.currentValue - netInvested) / netInvested) * 100 : 0;
    
    // Simplified VaR calculation using normal distribution assumption
    // In practice, this would use historical simulation or Monte Carlo methods
    const zScore = confidenceLevel === 0.05 ? 1.645 : 1.96; // 95% or 97.5% confidence
    
    // Estimate portfolio volatility (this would ideally use the calculated volatility)
    const estimatedVolatility = 20; // Placeholder - should use actual calculated volatility
    
    const valueAtRisk = Math.abs(portfolioReturn - (zScore * estimatedVolatility));
    
    return valueAtRisk;
  }

  /**
   * Calculate maximum drawdown from historical performance
   */
  static calculateMaxDrawdown(portfolio: Portfolio): number {
    // Simplified max drawdown calculation based on current holdings
    // In practice, this would use historical portfolio values
    const maxDrawdown = Math.max(0, ...portfolio.holdings.map(holding => {
      const returnPercent = holding.averagePrice > 0 ? 
        ((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100 : 0;
      return Math.abs(Math.min(0, returnPercent));
    }));

    return maxDrawdown;
  }
}