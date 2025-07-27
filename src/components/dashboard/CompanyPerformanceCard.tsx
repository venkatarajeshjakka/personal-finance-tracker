"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { CompanyFinancials, QuarterData } from "@/types";
import { formatCurrency, formatPercentage, getGrowthColorClass, getMarketCapCategory } from "@/lib/utils/quarterUtils";
import { TrendingUp, TrendingDown, Minus, Building2 } from "lucide-react";
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
    <Card className="h-full hover:shadow-md transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            {company.company}
          </CardTitle>
          <Badge variant="secondary">{quarterKey}</Badge>
        </div>
        <div className="space-y-2">
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <span>Data Price: {formatCurrency(company.price)}</span>
            <span>P/E: {company.PE_ratio}</span>
            <span>MCap: {formatCurrency(company.market_cap)}</span>
          </div>
          
          {/* Real-time Stock Price */}
          {company.symbol && (
            <div className="p-2 bg-muted/50 rounded-md">
              <div className="text-xs text-muted-foreground mb-1">Live Price ({company.symbol})</div>
              <StockPrice
                symbol={company.symbol}
                companyName={company.company}
                showChange={true}
                showRefresh={false}
                size="sm"
                className="text-sm"
              />
            </div>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Sales</p>
            <p className="text-xl font-semibold">{formatCurrency(quarterData.sales)}</p>
            {previousQuarterData && (
              <p className="text-xs text-muted-foreground">
                QoQ: {getQuarterOnQuarterGrowth(quarterData.sales, previousQuarterData.sales)}
              </p>
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">EBIDT</p>
            <p className="text-xl font-semibold">{formatCurrency(quarterData.EBIDT)}</p>
            {previousQuarterData && (
              <p className="text-xs text-muted-foreground">
                QoQ: {getQuarterOnQuarterGrowth(quarterData.EBIDT, previousQuarterData.EBIDT)}
              </p>
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <p className="text-xl font-semibold">{formatCurrency(quarterData.net_profit)}</p>
            {previousQuarterData && (
              <p className="text-xs text-muted-foreground">
                QoQ: {getQuarterOnQuarterGrowth(quarterData.net_profit, previousQuarterData.net_profit)}
              </p>
            )}
          </div>
          
          <div className="space-y-1">
            <p className="text-sm text-muted-foreground">EPS</p>
            <p className="text-xl font-semibold">{quarterData.EPS}</p>
          </div>
        </div>

        {/* YOY Growth Indicators */}
        <div className="border-t pt-4">
          <p className="text-sm font-medium mb-3">Year-over-Year Growth</p>
          <div className="grid grid-cols-2 gap-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Sales</span>
              <div className={`flex items-center gap-1 ${getGrowthColorClass(company.financials.YOY.sales_growth)}`}>
                {getGrowthIcon(company.financials.YOY.sales_growth)}
                <span className="text-sm font-medium">
                  {formatPercentage(company.financials.YOY.sales_growth)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">EBIDT</span>
              <div className={`flex items-center gap-1 ${getGrowthColorClass(company.financials.YOY.EBIDT_growth)}`}>
                {getGrowthIcon(company.financials.YOY.EBIDT_growth)}
                <span className="text-sm font-medium">
                  {formatPercentage(company.financials.YOY.EBIDT_growth)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">Profit</span>
              <div className={`flex items-center gap-1 ${getGrowthColorClass(company.financials.YOY.net_profit_growth)}`}>
                {getGrowthIcon(company.financials.YOY.net_profit_growth)}
                <span className="text-sm font-medium">
                  {formatPercentage(company.financials.YOY.net_profit_growth)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm text-muted-foreground">EPS</span>
              <div className={`flex items-center gap-1 ${getGrowthColorClass(company.financials.YOY.EPS_growth)}`}>
                {getGrowthIcon(company.financials.YOY.EPS_growth)}
                <span className="text-sm font-medium">
                  {formatPercentage(company.financials.YOY.EPS_growth)}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Market Cap Category Badge */}
        <div className="border-t pt-3">
          {(() => {
            const category = getMarketCapCategory(company.market_cap);
            return (
              <Badge 
                variant="outline" 
                className={`${category.color} ${category.bgColor} border-current text-sm px-3 py-1`}
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