'use client';

import React, { useMemo } from 'react';
import { Portfolio } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { AlertTriangle, Shield, TrendingUp, BarChart3, PieChart } from 'lucide-react';
import { calculateNetInvested } from '@/types';

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

export function RiskMetrics({ portfolio }: RiskMetricsProps) {
  const riskAnalysis = useMemo((): RiskAnalysis => {
    const totalValue = portfolio.currentValue;
    const netInvested = calculateNetInvested(portfolio.transactions);
    
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

    // Calculate portfolio volatility (simplified)
    const returns = portfolio.holdings.map(holding => {
      const returnPercent = holding.averagePrice > 0 ? 
        ((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100 : 0;
      return returnPercent;
    });
    
    const avgReturn = returns.reduce((sum, r) => sum + r, 0) / returns.length;
    const variance = returns.reduce((sum, r) => sum + Math.pow(r - avgReturn, 2), 0) / returns.length;
    const portfolioVolatility = Math.sqrt(variance);

    // Calculate Value at Risk (5% VaR) - simplified
    const portfolioReturn = netInvested > 0 ? ((totalValue - netInvested) / netInvested) * 100 : 0;
    const valueAtRisk = Math.abs(portfolioReturn - (1.645 * portfolioVolatility)); // 5% VaR

    // Calculate max drawdown (simplified)
    const maxDrawdown = Math.max(0, ...portfolio.holdings.map(holding => {
      const returnPercent = holding.averagePrice > 0 ? 
        ((holding.currentPrice - holding.averagePrice) / holding.averagePrice) * 100 : 0;
      return Math.abs(Math.min(0, returnPercent));
    }));

    // Calculate Sharpe ratio (simplified, assuming risk-free rate of 6%)
    const riskFreeRate = 6;
    const excessReturn = portfolioReturn - riskFreeRate;
    const sharpeRatio = portfolioVolatility > 0 ? excessReturn / portfolioVolatility : 0;

    // Calculate beta (simplified, assuming market return of 12%)
    const marketReturn = 12;
    const beta = portfolioVolatility > 0 ? (portfolioReturn / marketReturn) : 1;

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
  }, [portfolio]);

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
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {riskAnalysis.portfolioVolatility.toFixed(1)}%
            </div>
            <p className="text-xs text-muted-foreground">
              Portfolio volatility
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Sharpe Ratio</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {riskAnalysis.sharpeRatio.toFixed(2)}
            </div>
            <p className="text-xs text-muted-foreground">
              Risk-adjusted return
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
                .sort(([,a], [,b]) => b - a)
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
                <div className="text-sm font-medium">Portfolio Beta</div>
                <div className="text-lg font-bold">
                  {riskAnalysis.beta.toFixed(2)}
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
                <p><strong>VaR:</strong> Potential loss in worst 5% of scenarios</p>
                <p><strong>Beta:</strong> Sensitivity to market movements (1.0 = market average)</p>
                <p><strong>Sharpe:</strong> Return per unit of risk (higher is better)</p>
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
}