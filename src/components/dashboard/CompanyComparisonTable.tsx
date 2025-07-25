"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CompanyFinancials } from "@/types";
import { formatCurrency, formatPercentage, getGrowthColorClass, parseGrowthValue } from "@/lib/utils/quarterUtils";
import { ArrowUpDown, ArrowUp, ArrowDown, Building2 } from "lucide-react";

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

  const quarterKey = `${selectedQuarter} ${selectedYear}`;
  
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
                      <div>
                        <div className="font-medium">{company.company}</div>
                        <div className="text-xs text-muted-foreground">
                          {formatCurrency(company.price)} • P/E: {company.PE_ratio}
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
                      ₹{quarterData.EPS}
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