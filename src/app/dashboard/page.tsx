"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { AppLayout } from "@/components/navigation";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { CompanyPerformanceCard } from "@/components/dashboard/CompanyPerformanceCard";
import { CompanyComparisonTable } from "@/components/dashboard/CompanyComparisonTable";
import { EmptyState } from "@/components/dashboard/EmptyState";
import { useAppDispatch, useAppSelector } from "@/lib/redux/store";
import { loadCompanies, setSelectedQuarter, setSelectedYear } from "@/lib/redux/slices/companiesSlice";
import { getCurrentQuarter, getAvailableQuarters } from "@/lib/utils/quarterUtils";
import { 
  LayoutDashboard, 
  Building2, 
  TrendingUp, 
  Calendar, 
  Upload,
  AlertCircle,
  Eye,
  Briefcase
} from "lucide-react";

export default function DashboardPage() {
  const dispatch = useAppDispatch();
  const { data: companies, loading, error, selectedQuarter, selectedYear } = useAppSelector(state => state.companies);
  const [mounted, setMounted] = useState(false);

  // Handle hydration
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load companies on mount
  useEffect(() => {
    if (mounted) {
      dispatch(loadCompanies());
    }
  }, [dispatch, mounted]);

  // Set current quarter as default if not set
  useEffect(() => {
    if (mounted && companies.length > 0) {
      const currentQuarter = getCurrentQuarter();
      const availableQuarters = getAvailableQuarters(companies);
      
      // If current quarter data is not available, use the most recent quarter
      const hasCurrentQuarterData = availableQuarters.some(
        q => q.quarter === currentQuarter.quarter && q.year === currentQuarter.year
      );
      
      if (!hasCurrentQuarterData && availableQuarters.length > 0) {
        dispatch(setSelectedQuarter(availableQuarters[0].quarter));
        dispatch(setSelectedYear(availableQuarters[0].year));
      } else if (hasCurrentQuarterData) {
        dispatch(setSelectedQuarter(currentQuarter.quarter));
        dispatch(setSelectedYear(currentQuarter.year));
      }
    }
  }, [dispatch, companies, mounted]);

  if (!mounted) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <div className="animate-pulse">
            <div className="h-8 bg-muted rounded w-48 mb-2"></div>
            <div className="h-4 bg-muted rounded w-96"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  const currentQuarter = getCurrentQuarter();
  const availableQuarters = getAvailableQuarters(companies);
  const selectedQuarterKey = `${selectedQuarter} ${selectedYear}`;
  
  // Filter companies that have data for selected quarter
  const companiesWithData = companies.filter(company => 
    company.financials.quarters[selectedQuarterKey]
  );

  const handleQuarterChange = (value: string) => {
    const [quarter, year] = value.split(' ');
    dispatch(setSelectedQuarter(quarter));
    dispatch(setSelectedYear(parseInt(year)));
  };

  return (
    <AppLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <LayoutDashboard className="h-8 w-8" />
              Dashboard
            </h1>
            <p className="text-muted-foreground">
              Financial performance overview for {selectedQuarterKey}
            </p>
          </div>
          
          {availableQuarters.length > 0 && (
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Calendar className="h-4 w-4 text-muted-foreground" />
                <Select value={selectedQuarterKey} onValueChange={handleQuarterChange}>
                  <SelectTrigger className="w-32">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {availableQuarters.map((quarter) => (
                      <SelectItem key={quarter.displayName} value={quarter.displayName}>
                        {quarter.displayName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              {mounted && selectedQuarterKey === currentQuarter.displayName && (
                <Badge variant="success" className="flex items-center gap-1">
                  <TrendingUp className="h-3 w-3" />
                  Current Quarter
                </Badge>
              )}
            </div>
          )}
        </div>

        {/* Error State */}
        {error && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {/* Loading State */}
        {loading && (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {[...Array(6)].map((_, i) => (
              <Card key={i} className="animate-pulse">
                <CardHeader>
                  <div className="h-4 bg-muted rounded w-3/4"></div>
                  <div className="h-3 bg-muted rounded w-1/2"></div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <div className="h-6 bg-muted rounded"></div>
                    <div className="h-4 bg-muted rounded w-2/3"></div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}

        {/* Empty State */}
        {!loading && companies.length === 0 && (
          <EmptyState type="no-companies" />
        )}

        {/* No Data for Selected Quarter */}
        {!loading && companies.length > 0 && companiesWithData.length === 0 && (
          <EmptyState 
            type="no-quarter-data" 
            quarterKey={selectedQuarterKey}
            availableQuarters={availableQuarters}
            onQuarterChange={handleQuarterChange}
          />
        )}

        {/* Dashboard Content */}
        {!loading && companiesWithData.length > 0 && (
          <>
            {/* Summary Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Companies Tracked</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{companiesWithData.length}</div>
                  <p className="text-xs text-muted-foreground">
                    {companies.length - companiesWithData.length} without {selectedQuarterKey} data
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Sales</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    ₹{(companiesWithData.reduce((sum, company) => {
                      const quarterData = company.financials.quarters[selectedQuarterKey];
                      return sum + (quarterData?.sales || 0);
                    }, 0) / 10000000).toFixed(2)}Cr
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Combined sales for {selectedQuarterKey}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg Growth</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {companiesWithData.length > 0 ? (
                      `${(companiesWithData.reduce((sum, company) => {
                        const growth = parseFloat(company.financials.YOY.sales_growth.replace('%', ''));
                        return sum + (isNaN(growth) ? 0 : growth);
                      }, 0) / companiesWithData.length).toFixed(1)}%`
                    ) : 'N/A'}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Average YoY sales growth
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Data Coverage</CardTitle>
                  <Calendar className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{availableQuarters.length}</div>
                  <p className="text-xs text-muted-foreground">
                    Quarters of data available
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Company Performance Cards */}
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-xl font-semibold">Company Performance</h2>
                <Badge variant="outline">{companiesWithData.length} companies</Badge>
              </div>
              
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {companiesWithData.map((company) => (
                  <CompanyPerformanceCard
                    key={company.id}
                    company={company}
                    selectedQuarter={selectedQuarter}
                    selectedYear={selectedYear}
                  />
                ))}
              </div>
            </div>

            {/* Comparison Table */}
            <CompanyComparisonTable
              companies={companies}
              selectedQuarter={selectedQuarter}
              selectedYear={selectedYear}
            />

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>
                  Manage your financial data and analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <Link href="/import" className="flex items-center gap-2">
                      <Upload className="h-4 w-4" />
                      Import More Data
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/watchlist" className="flex items-center gap-2">
                      <Eye className="h-4 w-4" />
                      Manage Watchlists
                    </Link>
                  </Button>
                  <Button variant="outline" asChild>
                    <Link href="/portfolio" className="flex items-center gap-2">
                      <Briefcase className="h-4 w-4" />
                      View Portfolios
                    </Link>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    </AppLayout>
  );
}