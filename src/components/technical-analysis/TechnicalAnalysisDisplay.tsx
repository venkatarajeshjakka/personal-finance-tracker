"use client";

import { CandlestickChart } from './CandlestickChart';
import { TechnicalAnalysisCompanyDetails } from './TechnicalAnalysisCompanyDetails';
import type { CompanyFinancials } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TrendingUp, BarChart3, Activity } from 'lucide-react';

interface TechnicalAnalysisDisplayProps {
  symbol: string;
  companyData?: CompanyFinancials;
}

export function TechnicalAnalysisDisplay({
  symbol,
  companyData,
}: TechnicalAnalysisDisplayProps) {

  return (
    <div className="space-y-6">
      {/* Company Details Section */}
      <TechnicalAnalysisCompanyDetails
        symbol={symbol}
        companyData={companyData}
      />

      {/* Main Candlestick Chart */}
      <CandlestickChart
        symbol={symbol}
        companyName={companyData?.company || companyData?.companyName}
      />

      {/* Additional Analysis Tabs */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="h-5 w-5" />
            Technical Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="overview" className="w-full">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="patterns">Patterns</TabsTrigger>
              <TabsTrigger value="indicators">Indicators</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4">
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <BarChart3 className="h-4 w-4" />
                      Chart Information
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>Symbol: {symbol}</p>
                      <p>Data Source: Yahoo Finance</p>
                      <p>Chart Type: Candlestick with Volume</p>
                      <p>Real-time Updates: Available</p>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <h4 className="font-medium flex items-center gap-2">
                      <TrendingUp className="h-4 w-4" />
                      Features
                    </h4>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p>✓ Interactive candlestick chart</p>
                      <p>✓ Volume histogram</p>
                      <p>✓ Multiple timeframes</p>
                      <p>✓ Zoom and pan functionality</p>
                      <p>✓ Download chart as image</p>
                    </div>
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="patterns" className="mt-4">
              <div className="space-y-4">
                <h4 className="font-medium">Chart Patterns</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>Analyze the candlestick chart for common patterns:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Support and Resistance levels</li>
                    <li>Trend lines and channels</li>
                    <li>Candlestick patterns (Doji, Hammer, etc.)</li>
                    <li>Volume confirmation</li>
                  </ul>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Note: Pattern recognition is visual. Use the interactive chart above to identify patterns.
                  </p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="indicators" className="mt-4">
              <div className="space-y-4">
                <h4 className="font-medium">Technical Indicators</h4>
                <div className="text-sm text-muted-foreground space-y-2">
                  <p>The chart includes basic technical analysis:</p>
                  <ul className="list-disc list-inside space-y-1 ml-4">
                    <li>Price action via candlesticks</li>
                    <li>Volume analysis</li>
                    <li>Multiple timeframe analysis</li>
                  </ul>
                  <p className="mt-4 text-xs text-muted-foreground">
                    Advanced indicators can be added in future updates.
                  </p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}