'use client';

import React, { useMemo, useEffect } from 'react';
import { Portfolio } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, TrendingUp, BarChart3, PieChart } from 'lucide-react';

import { RiskCalculationService } from '@/lib/utils/riskCalculations';
import { useAppDispatch, useHistoricalData } from '@/lib/redux/hooks';

interface RiskMetricsProps {
  portfolio: Portfolio;
}

interface RiskAnalysis {
  portfolioVolatility: number;
  concentrationRisk: number;
  sectorConcentration: { [sector: string]: number };
  largestHolding: {
    symbol: string;
    percentage: number;
    value: number;
  };
  diversificationScore: number;
  riskLevel: 'Low' | 'Medium' | 'High' | 'Very High';
  riskFactors: string[];
  recommendations: string[];
  valueAtRisk: number; // 5% VaR approximation
  maxDrawdown: number;
  sharpeRatio: number;
  beta: number; // Portfolio beta (simplified)
}

export const RiskMetrics = React.memo(function RiskMetrics({ portfolio }: RiskMetricsProps) {
  const dispatch = useAppDispatch();
  const { cache: historicalDataCache, loading: historicalDataLoading, clearExpiredCache } = useHistoricalData();
  
  const [portfolioVolatility, setPortfolioVolatility] = React.useState<number>(0);
  const [isCalculatingVolatility, setIsCalculatingVolatility] = React.useState<boolean>(true);

  // Clear expired cache on component mount
  useEffect(() => {
    clearExpiredCache();
  }, [clearExpiredCache]);

  // Memoize the portfolio holdings hash to prevent unnecessary recalculations
  const portfolioHash = useMemo(() => {
    return `${portfolio.id}-${portfolio.holdings.map(h => `${h.symbol}:${h.totalValue}`).join(',')}`;
  }, [portfolio.id, portfolio.holdings]);

  // Calculate volatility using Redux-cached data
  useEffect(() => {
    let isCancelled = false;

    const calculateVolatility = async () => {
      setIsCalculatingVolatility(true);
      
      try {
        const volatility = await RiskCalculationService.calculatePortfolioVolatilityWithRedux(
          portfolio, 
          dispatch, 
          historicalDataCache
        );
        
        if (!isCancelled) {
          setPortfolioVolatility(volatility);
        }
      } catch (error) {
        console.error('Error calculating volatility:', error);
        if (!isCancelled) {
          // Fallback to simple calculation
          const fallbackVolatility = RiskCalculationService.calculateSimplePortfolioVolatility(portfolio);
          setPortfolioVolatility(fallbackVolatility);
        }
      } finally {
        if (!isCancelled) {
          setIsCalculatingVolatility(false);
        }
      }
    };

    calculateVolatility();

    return () => {
      isCancelled = true;
    };
  }, [portfolioHash, dispatch]); // Only recalculate when portfolio composition actually changes

  // Check if any historical data is still loading
  const isAnyDataLoading = useMemo(() => {
    return Object.values(historicalDataLoading).some(loading => loading);
  }, [historicalDataLoading]);

  const riskAnalysis = useMemo((): RiskAnalysis => {
    const totalValue = portfolio.currentValue;

    // Calculate concentration risk
    const holdingPercentages = portfolio.holdings.map(holding => ({
      symbol: holding.symbol,
      percentage: (holding.totalValue / totalValue) * 100,
      value: holding.totalValue,
      sector: holding.sector || 'Unknown'
    }));

    const concentrationRisk = Math.max(...holdingPercentages.map(h => h.percentage));
    const largestHolding = holdingPercentages.reduce((largest, current) =>
      current.percentage > largest.percentage ? current : largest
    );

    // Calculate sector concentration
    const sectorConcentration: { [sector: string]: number } = {};
    holdingPercentages.forEach(holding => {
      const sector = holding.sector;
      sectorConcentration[sector] = (sectorConcentration[sector] || 0) + holding.percentage;
    });

    // Calculate diversification score (0-100)
    const numberOfHoldings = portfolio.holdings.length;
    const numberOfSectors = Object.keys(sectorConcentration).length;
    const maxSectorConcentration = Math.max(...Object.values(sectorConcentration));

    let diversificationScore = 0;
    // Holdings diversity (0-40 points)
    diversificationScore += Math.min(numberOfHoldings * 2, 40);
    // Sector diversity (0-30 points)
    diversificationScore += Math.min(numberOfSectors * 5, 30);
    // Concentration penalty (0-30 points)
    diversificationScore += Math.max(0, 30 - (maxSectorConcentration - 20));

    // Use the calculated portfolio volatility from state

    // Calculate Value at Risk (5% VaR)
    const valueAtRisk = RiskCalculationService.calculateValueAtRisk(portfolio, 0.05);

    // Calculate max drawdown
    const maxDrawdown = RiskCalculationService.calculateMaxDrawdown(portfolio);

    // Calculate Sharpe ratio with proper annualized returns
    const sharpeRatio = RiskCalculationService.calculateSharpeRatio(portfolio, portfolioVolatility);

    // Calculate beta using actual Yahoo Finance beta values
    const beta = RiskCalculationService.calculatePortfolioBeta(portfolio, portfolioVolatility);

    // Determine risk level
    let riskLevel: 'Low' | 'Medium' | 'High' | 'Very High' = 'Low';
    if (concentrationRisk > 50 || maxSectorConcentration > 70 || portfolioVolatility > 30) {
      riskLevel = 'Very High';
    } else if (concentrationRisk > 30 || maxSectorConcentration > 50 || portfolioVolatility > 20) {
      riskLevel = 'High';
    } else if (concentrationRisk > 20 || maxSectorConcentration > 30 || portfolioVolatility > 15) {
      riskLevel = 'Medium';
    }

    // Generate risk factors
    const riskFactors: string[] = [];
    if (concentrationRisk > 25) {
      riskFactors.push(`High concentration in ${largestHolding.symbol} (${concentrationRisk.toFixed(1)}%)`);
    }
    if (maxSectorConcentration > 40) {
      const topSector = Object.entries(sectorConcentration).reduce((a, b) => a[1] > b[1] ? a : b);
      riskFactors.push(`Over-concentration in ${topSector[0]} sector (${topSector[1].toFixed(1)}%)`);
    }
    if (numberOfHoldings < 5) {
      riskFactors.push('Insufficient diversification (less than 5 holdings)');
    }
    if (portfolioVolatility > 25) {
      riskFactors.push('High portfolio volatility');
    }

    // Generate recommendations
    const recommendations: string[] = [];
    if (concentrationRisk > 20) {
      recommendations.push('Consider reducing position size in largest holdings');
    }
    if (numberOfSectors < 3) {
      recommendations.push('Diversify across more sectors');
    }
    if (numberOfHoldings < 8) {
      recommendations.push('Consider adding more holdings for better diversification');
    }
    if (maxSectorConcentration > 40) {
      recommendations.push('Reduce sector concentration risk');
    }

    return {
      portfolioVolatility,
      concentrationRisk,
      sectorConcentration,
      largestHolding,
      diversificationScore,
      riskLevel,
      riskFactors,
      recommendations,
      valueAtRisk,
      maxDrawdown,
      sharpeRatio,
      beta
    };
  }, [portfolio, portfolioVolatility]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case 'Low': return 'text-green-600';
      case 'Medium': return 'text-yellow-600';
      case 'High': return 'text-orange-600';
      case 'Very High': return 'text-red-600';
      default: return 'text-gray-600';
    }
  };

  const getRiskBadgeVariant = (level: string) => {
    switch (level) {
      case 'Low': return 'default';
      case 'Medium': return 'secondary';
      case 'High': return 'destructive';
      case 'Very High': return 'destructive';
      default: return 'outline';
    }
  };

  return (
    <div className="space-y-6">
      {/* Risk Overview */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Risk Level</CardTitle>
            <Shield className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getRiskColor(riskAnalysis.riskLevel)}`}>
              {riskAnalysis.riskLevel}
            </div>
            <Badge variant={getRiskBadgeVariant(riskAnalysis.riskLevel)} className="mt-1">
              Portfolio Risk
            </Badge>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Diversification</CardTitle>
            <PieChart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {riskAnalysis.diversificationScore.toFixed(0)}/100
            </div>
            <Progress value={riskAnalysis.diversificationScore} className="mt-2" />
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Volatility</CardTitle>
            <div className="flex items-center gap-2">
              {(isCalculatingVolatility || isAnyDataLoading) && (
                <div className="animate-spin h-3 w-3 border border-muted-foreground border-t-transparent rounded-full" />
              )}
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {(isCalculatingVolatility || isAnyDataLoading) ? '...' : `${riskAnalysis.portfolioVolatility.toFixed(1)}%`}
            </div>
            <p className="text-xs text-muted-foreground">
              {(isCalculatingVolatility || isAnyDataLoading) ? 'Loading from cached/live data...' :
                riskAnalysis.portfolioVolatility < 10 ? 'Low volatility (cached historical data)' :
                  riskAnalysis.portfolioVolatility < 20 ? 'Moderate volatility (cached historical data)' :
                    riskAnalysis.portfolioVolatility < 30 ? 'High volatility (cached historical data)' : 'Very high volatility (cached historical data)'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${riskAnalysis.sharpeRatio > 1 ? 'text-green-600' :
              riskAnalysis.sharpeRatio > 0.5 ? 'text-yellow-600' :
                riskAnalysis.sharpeRatio > 0 ? 'text-orange-600' : 'text-red-600'
              }`}>
              {riskAnalysis.sharpeRatio.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              {riskAnalysis.sharpeRatio > 1 ? 'Excellent risk-adjusted return' :
                riskAnalysis.sharpeRatio > 0.5 ? 'Good risk-adjusted return' :
                  riskAnalysis.sharpeRatio > 0 ? 'Fair risk-adjusted return' : 'Poor risk-adjusted return'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Risk Analysis */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>Concentration Analysis</CardTitle>
            <CardDescription>
              Portfolio concentration and diversification metrics
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Largest Holding</span>
                <Badge variant="outline">
                  {riskAnalysis.largestHolding.symbol}
                </Badge>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-muted-foreground">
                  ₹{riskAnalysis.largestHolding.value.toLocaleString()}
                </span>
                <span className="text-sm font-medium">
                  {riskAnalysis.largestHolding.percentage.toFixed(1)}%
                </span>
              </div>
              <Progress value={riskAnalysis.largestHolding.percentage} className="mt-2" />
            </div>

            <div className="space-y-2">
              <h4 className="text-sm font-medium">Sector Concentration</h4>
              {Object.entries(riskAnalysis.sectorConcentration)
                .sort(([, a], [, b]) => b - a)
                .slice(0, 5)
                .map(([sector, percentage]) => (
                  <div key={sector} className="flex justify-between items-center">
                    <span className="text-sm truncate max-w-32">{sector}</span>
                    <div className="flex items-center gap-2">
                      <div className="w-20 bg-muted rounded-full h-2">
                        <div
                          className="bg-primary h-2 rounded-full"
                          style={{ width: `${Math.min(percentage, 100)}%` }}
                        />
                      </div>
                      <span className="text-sm font-medium w-12 text-right">
                        {percentage.toFixed(1)}%
                      </span>
                    </div>
                  </div>
                ))}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Risk Metrics</CardTitle>
            <CardDescription>
              Advanced risk measurements and ratios
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <div className="text-sm font-medium">Value at Risk (5%)</div>
                <div className="text-lg font-bold text-red-600">
                  {riskAnalysis.valueAtRisk.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Max Drawdown</div>
                <div className="text-lg font-bold text-red-600">
                  {riskAnalysis.maxDrawdown.toFixed(1)}%
                </div>
              </div>
              <div>
                <div className="flex items-center gap-1">
                  <div className="text-sm font-medium">Portfolio Beta</div>
                  {RiskCalculationService.getBetaDataQuality(portfolio).quality === 'high' && (
                    <Badge variant="outline" className="text-xs px-1 py-0">
                      Live
                    </Badge>
                  )}
                </div>
                <div className="text-lg font-bold">
                  {riskAnalysis.beta.toFixed(2)}
                </div>
                <div className="text-xs text-muted-foreground">
                  {RiskCalculationService.getBetaDataQuality(portfolio).description}
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Holdings Count</div>
                <div className="text-lg font-bold">
                  {portfolio.holdings.length}
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <h4 className="text-sm font-medium mb-2">Risk Interpretation</h4>
              <div className="space-y-1 text-xs text-muted-foreground">
                <p><strong>Volatility:</strong> Measures price fluctuation; lower is more stable</p>
                <p><strong>Sharpe Ratio:</strong> Risk-adjusted return; &gt;1.0 is excellent, &gt;0.5 is good</p>
                <p><strong>VaR (5%):</strong> Potential loss in worst 5% of scenarios</p>
                <p><strong>Beta:</strong> Market sensitivity; 1.0 = market average, &gt;1.0 = more volatile</p>
                <p><strong>Max Drawdown:</strong> Largest peak-to-trough decline</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Risk Factors and Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {riskAnalysis.riskFactors.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-4 w-4 text-orange-500" />
                Risk Factors
              </CardTitle>
              <CardDescription>
                Identified risks in your portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {riskAnalysis.riskFactors.map((factor, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-orange-50 dark:bg-orange-950/20">
                    <AlertTriangle className="h-4 w-4 text-orange-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{factor}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {riskAnalysis.recommendations.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-blue-500" />
                Recommendations
              </CardTitle>
              <CardDescription>
                Suggestions to improve your portfolio
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-2">
                {riskAnalysis.recommendations.map((recommendation, index) => (
                  <div key={index} className="flex items-start gap-2 p-2 rounded-lg bg-blue-50 dark:bg-blue-950/20">
                    <Shield className="h-4 w-4 text-blue-500 mt-0.5 flex-shrink-0" />
                    <span className="text-sm">{recommendation}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
});
