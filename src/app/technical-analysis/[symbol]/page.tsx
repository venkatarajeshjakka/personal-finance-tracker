"use client";

import { useParams } from 'next/navigation';
import { useSelector } from 'react-redux';
import { AppLayout } from '@/components/navigation';
import { TechnicalAnalysisDisplay } from '@/components/technical-analysis';
import { selectCompanyBySymbol } from '@/lib/redux/slices/companiesSlice';
import type { RootState } from '@/types';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';

export default function TechnicalAnalysisPage() {
  const params = useParams();
  const symbol = params.symbol as string;

  // Redux selectors
  const companyData = useSelector((state: RootState) => selectCompanyBySymbol(state, symbol));

  // Handle invalid symbol
  if (!symbol) {
    return (
      <AppLayout>
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invalid Symbol</CardTitle>
              <CardDescription>
                No stock symbol provided for technical analysis.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Link href="/watchlist">
                <Button>Back to Watchlist</Button>
              </Link>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="mb-6">
          <Link href="/watchlist">
            <Button variant="ghost" className="mb-4">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to Watchlist
            </Button>
          </Link>

          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
                {symbol} - {'Stock Analysis'}
              </h1>

            </div>
          </div>
        </div>

        <TechnicalAnalysisDisplay
          symbol={symbol}
          companyData={companyData}
        />
      </div>
    </AppLayout>
  );
}