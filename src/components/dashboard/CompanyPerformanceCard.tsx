"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyFinancials, QuarterData } from "@/types";
import { formatCurrency, formatPercentage, getGrowthColorClass, getMarketCapCategory } from "@/lib/utils/quarterUtils";
import { TrendingUp, TrendingDown, Minus, Building2, BarChart3, DollarSign, Activity } from "lucide-react";
import StockPrice from "@/components/stocks/StockPrice";

interface CompanyPerformanceCardProps {
  company: CompanyFinancials;
  selectedQuarter: string;
  selectedYear: number;
}

export function CompanyPerformanceCard({
  company,
  selectedQuarter,
  selectedYear
}: CompanyPerformanceCardProps) {
  const quarterKey = `${selectedQuarter} ${selectedYear}`;
  const quarterData = company.financials.quarters[quarterKey];

  // State to track live financial metrics
  const [liveMetrics, setLiveMetrics] = useState<{
    marketCap?: number | null;
    trailingPE?: number | null;
    forwardPE?: number | null;
    priceToBook?: number | null;
    industry?: string;
    sector?: string;
  } | null>(null);

  // Handle price and financial metrics updates from StockPrice component
  const handlePriceUpdate = (_price: number, _change: number, _changePercent: number, financialMetrics?: {
    marketCap?: number | null;
    trailingPE?: number | null;
    forwardPE?: number | null;
    priceToBook?: number | null;
    industry?: string;
    sector?: string;
  }) => {
    if (financialMetrics) {
      setLiveMetrics(financialMetrics);
    }
  };

  // Get previous quarter data for comparison
  const getPreviousQuarterData = (): QuarterData | null => {
    const quarters = Object.keys(company.financials.quarters).sort();
    const currentIndex = quarters.indexOf(quarterKey);
    if (currentIndex > 0) {
      return company.financials.quarters[quarters[currentIndex - 1]];
    }
    return null;
  };

  const previousQuarterData = getPreviousQuarterData();

  const getGrowthIcon = (value: string) => {
    const numValue = parseFloat(value.replace('%', ''));
    if (numValue > 0) return <TrendingUp className="h-4 w-4" />;
    if (numValue < 0) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getQuarterOnQuarterGrowth = (current: number, previous: number): string => {
    if (!previous) return "N/A";
    const growth = ((current - previous) / previous) * 100;
    return `${growth > 0 ? '+' : ''}${growth.toFixed(2)}%`;
  };

  // Format market cap for display
  const formatLiveMarketCap = (marketCap?: number | null): string => {
    if (!marketCap || marketCap === 0) {
      return company.market_cap || 'N/A';
    }

    // Convert to crores for Indian market display
    const crores = marketCap / 10000000; // 1 crore = 10 million
    return `₹${crores.toFixed(2)}Cr`;
  };

  // Format P/E ratio for display
  const formatLivePE = (pe?: number | null): string => {
    if (!pe || pe === 0) {
      return company.PE_ratio || 'N/A';
    }

    return pe.toFixed(1);
  };

  if (!quarterData) {
    return (
      <Card className="h-full">
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg flex items-center gap-2">
              <Building2 className="h-5 w-5" />
              {company.company}
            </CardTitle>
            <Badge variant="outline">No Data</Badge>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <p className="text-sm">No data available for {quarterKey}</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full hover:shadow-lg transition-all duration-300 border-0 shadow-sm bg-gradient-to-br from-white to-gray-50/50 dark:from-gray-900 dark:to-gray-800/50">
      <CardHeader className="pb-4 space-y-3">
        {/* Company Header */}
        <div className="flex items-start justify-between">
          <div className="space-y-3 flex-1">
            <CardTitle className="text-xl font-bold flex items-center gap-3 text-gray-900 dark:text-gray-100">
              <div className="p-2 rounded-lg bg-blue-100 dark:bg-blue-900/30">
                <Building2 className="h-5 w-5 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="truncate">{company.company}</span>
            </CardTitle>

            {/* Industry and Sector Tags */}
            {(() => {
              const displaySector = liveMetrics?.sector || company.sector;
              const displayIndustry = liveMetrics?.industry || company.industry;

              if (displaySector || displayIndustry) {
                return (
                  <div className="flex flex-wrap gap-2">
                    {displaySector && (
                      <Badge variant="secondary" className="text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300 border-0">
                        {displaySector}
                      </Badge>
                    )}
                    {displayIndustry && (
                      <Badge variant="secondary" className="text-xs font-medium bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 border-0">
                        {displayIndustry}
                      </Badge>
                    )}
                  </div>
                );
              }
              return null;
            })()}
          </div>

          <Badge variant="outline" className="font-medium bg-gray-100 dark:bg-gray-800 border-gray-200 dark:border-gray-700 ml-4">
            {quarterKey}
          </Badge>
        </div>

        {/* Price Information */}
        <div className="bg-white/60 dark:bg-gray-800/60 rounded-xl p-4 border border-gray-100 dark:border-gray-700/50">
          <div className="grid grid-cols-3 gap-4 mb-3">
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <DollarSign className="h-3 w-3" />
                Data Price
              </div>
              <div className="font-semibold text-sm">{formatCurrency(company.price)}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <BarChart3 className="h-3 w-3" />
                P/E Ratio
              </div>
              <div className="font-semibold text-sm">{formatLivePE(liveMetrics?.trailingPE)}</div>
            </div>
            <div className="text-center">
              <div className="flex items-center justify-center gap-1 text-xs text-muted-foreground mb-1">
                <Activity className="h-3 w-3" />
                Market Cap
              </div>
              <div className="font-semibold text-sm">{formatLiveMarketCap(liveMetrics?.marketCap)}</div>
            </div>
          </div>

          {/* Live Stock Price */}
          {company.symbol && (
            <div className="border-t border-gray-200 dark:border-gray-600 pt-3">
              <div className="text-xs text-muted-foreground mb-2 flex items-center gap-1">
                <Activity className="h-3 w-3" />
                Live Price ({company.symbol})
              </div>
              <StockPrice
                symbol={company.symbol}
                companyName={company.company}
                showChange={true}
                showRefresh={false}
                size="sm"
                className="text-sm"
                onPriceUpdate={handlePriceUpdate}
              />
            </div>
          )}
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Financial Metrics */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <BarChart3 className="h-4 w-4 text-blue-600 dark:text-blue-400" />
            Quarterly Performance
          </h3>
          <div className="grid grid-cols-2 gap-4">
            {[
              { label: "Sales", value: quarterData.sales, icon: DollarSign },
              { label: "EBIDT", value: quarterData.EBIDT, icon: TrendingUp },
              { label: "Net Profit", value: quarterData.net_profit, icon: Activity },
              { label: "EPS", value: quarterData.EPS, icon: BarChart3, isString: true }
            ].map((metric, index) => (
              <div key={index} className="bg-white/40 dark:bg-gray-800/40 rounded-lg p-3 border border-gray-100 dark:border-gray-700/50">
                <div className="flex items-center gap-2 mb-2">
                  <metric.icon className="h-4 w-4 text-gray-600 dark:text-gray-400" />
                  <span className="text-sm font-medium text-muted-foreground">{metric.label}</span>
                </div>
                <div className="text-lg font-bold text-gray-900 dark:text-gray-100">
                  {metric.isString ? metric.value : formatCurrency(metric.value as number)}
                </div>
                {previousQuarterData && !metric.isString && (
                  <div className="text-xs text-muted-foreground mt-1">
                    QoQ: {getQuarterOnQuarterGrowth(
                      metric.value as number,
                      previousQuarterData[metric.label.toLowerCase().replace(' ', '_') as keyof QuarterData] as number
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* YOY Growth Section */}
        <div>
          <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100 mb-4 flex items-center gap-2">
            <TrendingUp className="h-4 w-4 text-green-600 dark:text-green-400" />
            Year-over-Year Growth
          </h3>
          <div className="bg-white/40 dark:bg-gray-800/40 rounded-lg p-4 border border-gray-100 dark:border-gray-700/50">
            <div className="grid grid-cols-2 gap-4">
              {[
                { label: "Sales", growth: company.financials.YOY.sales_growth },
                { label: "EBIDT", growth: company.financials.YOY.EBIDT_growth },
                { label: "Profit", growth: company.financials.YOY.net_profit_growth },
                { label: "EPS", growth: company.financials.YOY.EPS_growth }
              ].map((item, index) => (
                <div key={index} className="flex items-center justify-between py-2">
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">{item.label}</span>
                  <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-semibold ${getGrowthColorClass(item.growth)} bg-opacity-10`}>
                    {getGrowthIcon(item.growth)}
                    {formatPercentage(item.growth)}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Market Cap Category Badge */}
        <div className="pt-4 border-t border-gray-200 dark:border-gray-700">
          {(() => {
            const marketCapToUse = liveMetrics?.marketCap
              ? formatLiveMarketCap(liveMetrics.marketCap)
              : company.market_cap;
            const category = getMarketCapCategory(marketCapToUse);
            return (
              <Badge
                variant="outline"
                className={`${category.color} ${category.bgColor} border-current text-sm font-semibold px-4 py-2`}
              >
                {category.label}
              </Badge>
            );
          })()}
        </div>
      </CardContent>
    </Card>
  );
}