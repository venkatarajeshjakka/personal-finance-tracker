"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSelector } from 'react-redux';
import { AppLayout } from '@/components/navigation';

import { selectAllWatchlists } from '@/lib/redux/slices/watchlistsSlice';
import { selectAllCompanies } from '@/lib/redux/slices/companiesSlice';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { 
  LineChart, 
  Search, 
  TrendingUp, 
  AlertTriangle, 
  Eye,
  Building2,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';

export default function TechnicalAnalysisPage() {
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  
  // Redux selectors
  const watchlists = useSelector(selectAllWatchlists);
  const companies = useSelector(selectAllCompanies);


  // Get all available symbols from watchlists and companies
  const availableSymbols = [
    ...watchlists.flatMap(watchlist => 
      watchlist.stocks
        .filter(stock => stock.symbol)
        .map(stock => ({
          symbol: stock.symbol,
          name: stock.companyName,
          source: 'watchlist',
          watchlistName: watchlist.name
        }))
    ),
    ...companies
      .filter(company => company.symbol)
      .map(company => ({
        symbol: company.symbol!,
        name: company.company,
        source: 'company',
        industry: company.industry,
        sector: company.sector
      }))
  ];

  // Remove duplicates based on symbol
  const uniqueSymbols = availableSymbols.reduce((acc, current) => {
    const existing = acc.find(item => item.symbol === current.symbol);
    if (!existing) {
      acc.push(current);
    }
    return acc;
  }, [] as typeof availableSymbols);

  // Filter symbols based on search term
  const filteredSymbols = uniqueSymbols.filter(item =>
    item.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleSymbolClick = (symbol: string) => {
    router.push(`/technical-analysis/${symbol}`);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchTerm.trim()) {
      router.push(`/technical-analysis/${searchTerm.trim().toUpperCase()}`);
    }
  };



  return (
    <AppLayout>
      <div className="space-y-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight mb-2">Technical Analysis</h1>
        <p className="text-muted-foreground">
          Advanced chart analysis and technical indicators for your stocks
        </p>
      </div>



      {/* Search Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Search className="h-5 w-5" />
            Search Stock Symbol
          </CardTitle>
          <CardDescription>
            Enter a stock symbol to view its technical analysis chart
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearchSubmit} className="flex gap-2">
            <Input
              placeholder="Enter stock symbol (e.g., RELIANCE, TCS)"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
            <Button type="submit" disabled={!searchTerm.trim()}>
              <LineChart className="h-4 w-4 mr-2" />
              Analyze
            </Button>
          </form>
        </CardContent>
      </Card>

      {/* Available Symbols */}
      {uniqueSymbols.length > 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Available Symbols</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Stocks from your watchlists and imported companies
            </p>
          </div>

          {/* Symbols Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredSymbols.map((item) => (
              <Card
                key={item.symbol}
                className="cursor-pointer transition-colors hover:bg-accent"
                onClick={() => handleSymbolClick(item.symbol)}
              >
                <CardContent className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {item.source === 'watchlist' ? (
                        <Eye className="h-4 w-4 text-blue-500" />
                      ) : (
                        <Building2 className="h-4 w-4 text-green-500" />
                      )}
                      <Badge variant="outline" className="font-mono text-xs">
                        {item.symbol}
                      </Badge>
                    </div>
                    <ArrowRight className="h-4 w-4 text-muted-foreground" />
                  </div>
                  
                  <div className="space-y-1">
                    <h3 className="font-medium text-sm line-clamp-2">
                      {item.name}
                    </h3>
                    
                    <div className="flex flex-wrap gap-1">
                      {item.source === 'watchlist' && 'watchlistName' in item && (
                        <Badge variant="secondary" className="text-xs">
                          {item.watchlistName}
                        </Badge>
                      )}
                      
                      {item.source === 'company' && 'sector' in item && item.sector && (
                        <Badge variant="secondary" className="text-xs">
                          {item.sector}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          {filteredSymbols.length === 0 && searchTerm && (
            <div className="text-center py-8">
              <Search className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="font-semibold mb-2">No symbols found</h3>
              <p className="text-sm text-muted-foreground mb-4">
                No symbols match your search term &quot;{searchTerm}&quot;
              </p>
              <Button onClick={() => setSearchTerm('')} variant="outline">
                Clear Search
              </Button>
            </div>
          )}
        </div>
      )}

      {/* No Symbols Available */}
      {uniqueSymbols.length === 0 && (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <div className="rounded-full bg-muted p-3 mb-4">
              <TrendingUp className="h-6 w-6 text-muted-foreground" />
            </div>
            <h3 className="font-semibold mb-2">No Symbols Available</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Add stocks to your watchlists or import company data to get started with technical analysis.
            </p>
            <div className="flex gap-2">
              <Link href="/watchlist">
                <Button variant="outline">
                  <Eye className="h-4 w-4 mr-2" />
                  Manage Watchlists
                </Button>
              </Link>
              <Link href="/import">
                <Button>
                  <Building2 className="h-4 w-4 mr-2" />
                  Import Companies
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
      </div>
    </AppLayout>
  );
}