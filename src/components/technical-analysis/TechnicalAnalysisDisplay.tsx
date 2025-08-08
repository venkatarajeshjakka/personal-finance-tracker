"use client";

import { useRef } from 'react';
import { CandlestickChart } from './CandlestickChart';
import { TechnicalAnalysisCompanyDetails } from './TechnicalAnalysisCompanyDetails';
import { AIAnalysisDisplay } from './AIAnalysisDisplay';
import type { CompanyFinancials } from '@/types';


interface TechnicalAnalysisDisplayProps {
  symbol: string;
  companyData?: CompanyFinancials;
}

export function TechnicalAnalysisDisplay({
  symbol,
  companyData,
}: TechnicalAnalysisDisplayProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  return (
    <div className="space-y-6">
      {/* Company Details Section */}
      <TechnicalAnalysisCompanyDetails
        symbol={symbol}
        companyData={companyData}
      />

      {/* Main Candlestick Chart */}
      <div ref={chartRef}>
        <CandlestickChart
          symbol={symbol}
        />
      </div>

      {/* AI Analysis Section */}
      <AIAnalysisDisplay
        symbol={symbol}
        chartElementRef={chartRef}
        timeframe="1y"
        additionalContext={{
          currentPrice: companyData ? parseFloat(companyData.price) : undefined,
          marketCap: companyData ? parseFloat(companyData.market_cap) : undefined,
          sector: companyData?.sector,
          industry: companyData?.industry
        }}
      />
    </div>
  );
}