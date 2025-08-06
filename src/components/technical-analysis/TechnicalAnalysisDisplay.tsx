"use client";

import { CandlestickChart } from './CandlestickChart';
import { TechnicalAnalysisCompanyDetails } from './TechnicalAnalysisCompanyDetails';
import type { CompanyFinancials } from '@/types';


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
        companyName={companyData?.company}
      />


    </div>
  );
}