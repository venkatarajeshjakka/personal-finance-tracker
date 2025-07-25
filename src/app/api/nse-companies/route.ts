import { NextRequest, NextResponse } from 'next/server';
import { CSVParserService } from '@/lib/utils/csv-parser';
import { CompanyNameMatcher } from '@/lib/utils/company-matcher';

export async function POST(request: NextRequest) {
  try {
    const { csvContent } = await request.json();

    if (!csvContent || typeof csvContent !== 'string') {
      return NextResponse.json(
        { error: 'CSV content is required' },
        { status: 400 }
      );
    }

    // Parse CSV content
    const companies = await CSVParserService.parseNSECompanyCSV(csvContent);
    
    // Detect duplicates
    const duplicateReport = CSVParserService.detectDuplicates(companies);
    
    // Remove duplicates
    const uniqueCompanies = CSVParserService.removeDuplicates(companies);

    return NextResponse.json({
      success: true,
      data: {
        companies: uniqueCompanies,
        duplicates: duplicateReport,
        totalProcessed: companies.length,
        totalUnique: uniqueCompanies.length
      }
    });

  } catch (error) {
    console.error('NSE companies API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'Failed to process CSV',
        success: false 
      },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q');
    const action = searchParams.get('action');

    if (action === 'validate' && query) {
      // This would require access to stored NSE companies
      // For now, return a placeholder response
      return NextResponse.json({
        success: true,
        data: {
          query,
          suggestions: [],
          match: null
        }
      });
    }

    return NextResponse.json(
      { error: 'Invalid request parameters' },
      { status: 400 }
    );

  } catch (error) {
    console.error('NSE companies API error:', error);
    
    return NextResponse.json(
      { 
        error: error instanceof Error ? error.message : 'API request failed',
        success: false 
      },
      { status: 500 }
    );
  }
}