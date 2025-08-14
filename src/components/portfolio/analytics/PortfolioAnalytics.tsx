'use client';

import React, { useState, useMemo } from 'react';
import { Portfolio } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Download, TrendingUp, BarChart3, Calendar } from 'lucide-react';
import { PerformanceChart } from '@/components/portfolio/analytics/PerformanceChart';
import { RiskMetrics } from '@/components/portfolio/analytics/RiskMetrics';
import { ReturnCalculations } from '@/components/portfolio/analytics/ReturnCalculations';
import { ExportDialog } from '@/components/portfolio/analytics/ExportDialog';
import { calculateNetInvested, calculatePortfolioReturnPercentage, calculatePortfolioDayPL, calculatePortfolioDayPLPercent } from '@/types';

interface PortfolioAnalyticsProps {
  portfolio: Portfolio;
}

export function PortfolioAnalytics({ portfolio }: PortfolioAnalyticsProps) {
  const [showExportDialog, setShowExportDialog] = useState(false);
  const [selectedTimeframe, setSelectedTimeframe] = useState<'1M' | '3M' | '6M' | '1Y' | 'ALL'>('3M');

  // Calculate key metrics
  const metrics = useMemo(() => {
    const netInvested = calculateNetInvested(portfolio.transactions);
    const currentValue = portfolio.currentValue;
    const totalReturn = currentValue - netInvested;
    const totalReturnPercent = calculatePortfolioReturnPercentage(portfolio);
    const dayPL = calculatePortfolioDayPL(portfolio);
    const dayPLPercent = calculatePortfolioDayPLPercent(portfolio);

    return {
      netInvested,
      currentValue,
      totalReturn,
      totalReturnPercent,
      dayPL,
      dayPLPercent,
      holdingsCount: portfolio.holdings.length,
      transactionsCount: portfolio.transactions.length
    };
  }, [portfolio]);



  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Portfolio Analytics</h2>
          <p className="text-muted-foreground">
            Comprehensive analysis of {portfolio.name}
          </p>
        </div>
        <Button onClick={() => setShowExportDialog(true)}>
          <Download className="h-4 w-4 mr-2" />
          Export Report
        </Button>
      </div>



      {/* Analytics Tabs */}
      <Tabs defaultValue="performance" className="space-y-4">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="returns">Returns</TabsTrigger>
          <TabsTrigger value="risk">Risk Analysis</TabsTrigger>
        </TabsList>

        <TabsContent value="performance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Portfolio Performance</CardTitle>
              <CardDescription>
                Track your portfolio value and returns over time
              </CardDescription>
            </CardHeader>
            <CardContent>
              <PerformanceChart
                portfolio={portfolio}
                timeframe={selectedTimeframe}
                onTimeframeChange={setSelectedTimeframe}
              />
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="returns" className="space-y-4">
          <ReturnCalculations portfolio={portfolio} />
        </TabsContent>

        <TabsContent value="risk" className="space-y-4">
          <RiskMetrics portfolio={portfolio} />
        </TabsContent>
      </Tabs>

      {/* Export Dialog */}
      <ExportDialog
        open={showExportDialog}
        onOpenChange={setShowExportDialog}
        portfolio={portfolio}
        metrics={metrics}
      />
    </div>
  );
}