"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyFinancials } from "@/types";
import { formatCurrency, formatPercentage, getGrowthColorClass, parseGrowthValue, getMarketCapCategory } from "@/lib/utils/quarterUtils";
import { ArrowUpDown, ArrowUp, ArrowDown, Building2 } from "lucide-react";
import PriceUpdateService from "@/lib/services/priceUpdateService";

interface CompanyComparisonTableProps {
  companies: CompanyFinancials[];
  selectedQuarter: string;
  selectedYear: number;
}

type SortField = 'company' | 'sales' | 'EBIDT' | 'net_profit' | 'EPS' | 'sales_growth' | 'EBIDT_growth' | 'net_profit_growth' | 'EPS_growth';
type SortOrder = 'asc' | 'desc';

export function CompanyComparisonTable({
  companies,
  selectedQuarter,
  selectedYear
}: CompanyComparisonTableProps) {
  const [sortField, setSortField] = useState<SortField>('sales');
  const [sortOrder, setSortOrder] = useState<SortOrder>('desc');

  // State to track live financial metrics for multiple companies
  const [liveMetrics, setLiveMetrics] = useState<Record<string, {
    marketCap?: number | null;
    trailingPE?: number | null;
    forwardPE?: number | null;
    priceToBook?: number | null;
  }>>({});

  const quarterKey = `${selectedQuarter} ${selectedYear}`;

  // Fetch live financial metrics for companies with symbols
  useEffect(() => {
    const fetchLiveMetrics = async () => {
      const companiesWithSymbols = companies.filter(company => company.symbol);

      if (companiesWithSymbols.length === 0) return;

      try {
        const symbols = companiesWithSymbols.map(company => company.symbol!);
        const results = await PriceUpdateService.getBulkStockPrices(symbols);

        const newLiveMetrics: Record<string, {
          marketCap?: number | null;
          trailingPE?: number | null;
          forwardPE?: number | null;
          priceToBook?: number | null;
        }> = {};

        results.results.forEach(result => {
          if (result.success && result.symbol) {
            newLiveMetrics[result.symbol] = {
              marketCap: result.marketCap,
              trailingPE: result.trailingPE,
              forwardPE: result.forwardPE,
              priceToBook: result.priceToBook
            };
          }
        });

        setLiveMetrics(newLiveMetrics);
      } catch (error) {
        console.error('Failed to fetch live financial metrics:', error);
      }
    };

    fetchLiveMetrics();
  }, [companies]);

  // Format market cap for display
  const formatLiveMarketCap = (company: CompanyFinancials): string => {
    if (!company.symbol) return company.market_cap || 'N/A';

    const formattedSymbol = company.symbol.includes('.') ? company.symbol.toUpperCase() : `${company.symbol.toUpperCase()}.NS`;
    const liveData = liveMetrics[formattedSymbol];

    if (liveData?.marketCap && liveData.marketCap > 0) {
      // Convert to crores for Indian market display
      const crores = liveData.marketCap / 10000000; // 1 crore = 10 million
      return `₹${crores.toFixed(2)}Cr`;
    }
    return company.market_cap || 'N/A';
  };

  // Format P/E ratio for display
  const formatLivePE = (company: CompanyFinancials): string => {
    if (!company.symbol) return company.PE_ratio || 'N/A';

    const formattedSymbol = company.symbol.includes('.') ? company.symbol.toUpperCase() : `${company.symbol.toUpperCase()}.NS`;
    const liveData = liveMetrics[formattedSymbol];

    if (liveData?.trailingPE && liveData.trailingPE > 0) {
      return liveData.trailingPE.toFixed(1);
    }
    return company.PE_ratio || 'N/A';
  };

  // Check if company has live data
  const hasLiveData = (company: CompanyFinancials): boolean => {
    if (!company.symbol) return false;
    const formattedSymbol = company.symbol.includes('.') ? company.symbol.toUpperCase() : `${company.symbol.toUpperCase()}.NS`;
    return !!(liveMetrics[formattedSymbol]);
  };

  // Filter companies that have data for the selected quarter
  const companiesWithData = companies.filter(company =>
    company.financials.quarters[quarterKey]
  );

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('desc');
    }
  };

  const getSortValue = (company: CompanyFinancials, field: SortField): number => {
    const quarterData = company.financials.quarters[quarterKey];

    switch (field) {
      case 'company':
        return company.company.toLowerCase().charCodeAt(0);
      case 'sales':
        return quarterData?.sales || 0;
      case 'EBIDT':
        return quarterData?.EBIDT || 0;
      case 'net_profit':
        return quarterData?.net_profit || 0;
      case 'EPS':
        return parseFloat(quarterData?.EPS || '0');
      case 'sales_growth':
        return parseGrowthValue(company.financials.YOY.sales_growth);
      case 'EBIDT_growth':
        return parseGrowthValue(company.financials.YOY.EBIDT_growth);
      case 'net_profit_growth':
        return parseGrowthValue(company.financials.YOY.net_profit_growth);
      case 'EPS_growth':
        return parseGrowthValue(company.financials.YOY.EPS_growth);
      default:
        return 0;
    }
  };

  const sortedCompanies = [...companiesWithData].sort((a, b) => {
    const aValue = getSortValue(a, sortField);
    const bValue = getSortValue(b, sortField);

    if (sortOrder === 'asc') {
      return aValue - bValue;
    } else {
      return bValue - aValue;
    }
  });

  const SortButton = ({ field, children }: { field: SortField; children: React.ReactNode }) => (
    <Button
      variant="ghost"
      size="sm"
      onClick={() => handleSort(field)}
      className="h-auto p-1 font-medium text-left justify-start"
    >
      <span className="flex items-center gap-1">
        {children}
        {sortField === field ? (
          sortOrder === 'asc' ? <ArrowUp className="h-3 w-3" /> : <ArrowDown className="h-3 w-3" />
        ) : (
          <ArrowUpDown className="h-3 w-3 opacity-50" />
        )}
      </span>
    </Button>
  );

  if (companiesWithData.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Comparison - {quarterKey}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center h-32 text-muted-foreground">
            <div className="text-center">
              <Building2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No companies have data for {quarterKey}</p>
              <p className="text-sm mt-1">Import company data to see comparisons</p>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <Building2 className="h-5 w-5" />
            Company Comparison - {quarterKey}
          </CardTitle>
          <Badge variant="secondary">
            {companiesWithData.length} companies
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left p-2">
                  <SortButton field="company">Company</SortButton>
                </th>
                <th className="text-right p-2">
                  <SortButton field="sales">Sales</SortButton>
                </th>
                <th className="text-right p-2">
                  <SortButton field="EBIDT">EBIDT</SortButton>
                </th>
                <th className="text-right p-2">
                  <SortButton field="net_profit">Net Profit</SortButton>
                </th>
                <th className="text-right p-2">
                  <SortButton field="EPS">EPS</SortButton>
                </th>
                <th className="text-right p-2">
                  <SortButton field="sales_growth">Sales Growth</SortButton>
                </th>
                <th className="text-right p-2">
                  <SortButton field="EBIDT_growth">EBIDT Growth</SortButton>
                </th>
                <th className="text-right p-2">
                  <SortButton field="net_profit_growth">Profit Growth</SortButton>
                </th>
                <th className="text-right p-2">
                  <SortButton field="EPS_growth">EPS Growth</SortButton>
                </th>
              </tr>
            </thead>
            <tbody>
              {sortedCompanies.map((company, index) => {
                const quarterData = company.financials.quarters[quarterKey];
                return (
                  <tr key={company.id} className={`border-b hover:bg-muted/50 ${index % 2 === 0 ? 'bg-muted/20' : ''}`}>
                    <td className="p-2">
                      <div className="space-y-2">
                        <div className="font-medium">{company.company}</div>

                        {/* Financial metrics info */}
                        <div className="text-xs text-muted-foreground">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span>P/E: {formatLivePE(company)}</span>
                            <span>•</span>
                            <span>MCap: {formatLiveMarketCap(company)}</span>
                            
                          </div>
                          <div className="mt-1 text-muted-foreground/70">
                            Data Price: {formatCurrency(company.price)}
                          </div>
                        </div>



                        {/* Market cap category */}
                        <div>
                          {(() => {
                            // Use live market cap if available, otherwise fall back to static data
                            const marketCapToUse = hasLiveData(company)
                              ? formatLiveMarketCap(company)
                              : company.market_cap;
                            const category = getMarketCapCategory(marketCapToUse);
                            return (
                              <Badge
                                variant="outline"
                                className={`${category.color} ${category.bgColor} border-current text-xs px-2 py-0.5`}
                              >
                                {category.label}
                               
                              </Badge>
                            );
                          })()}
                        </div>
                      </div>
                    </td>
                    <td className="p-2 text-right font-medium">
                      {formatCurrency(quarterData.sales)}
                    </td>
                    <td className="p-2 text-right font-medium">
                      {formatCurrency(quarterData.EBIDT)}
                    </td>
                    <td className="p-2 text-right font-medium">
                      {formatCurrency(quarterData.net_profit)}
                    </td>
                    <td className="p-2 text-right font-medium">
                      {quarterData.EPS}
                    </td>
                    <td className={`p-2 text-right font-medium ${getGrowthColorClass(company.financials.YOY.sales_growth)}`}>
                      {formatPercentage(company.financials.YOY.sales_growth)}
                    </td>
                    <td className={`p-2 text-right font-medium ${getGrowthColorClass(company.financials.YOY.EBIDT_growth)}`}>
                      {formatPercentage(company.financials.YOY.EBIDT_growth)}
                    </td>
                    <td className={`p-2 text-right font-medium ${getGrowthColorClass(company.financials.YOY.net_profit_growth)}`}>
                      {formatPercentage(company.financials.YOY.net_profit_growth)}
                    </td>
                    <td className={`p-2 text-right font-medium ${getGrowthColorClass(company.financials.YOY.EPS_growth)}`}>
                      {formatPercentage(company.financials.YOY.EPS_growth)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        {companiesWithData.length > 0 && (
          <div className="mt-4 text-sm text-muted-foreground">
            Showing {companiesWithData.length} companies with data for {quarterKey}.
            Click column headers to sort.
          </div>
        )}
      </CardContent>
    </Card>
  );
}