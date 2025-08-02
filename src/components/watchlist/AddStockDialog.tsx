'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/store';
import { addStockToWatchlist } from '@/lib/redux/slices/watchlistsSlice';
import { WatchlistStock } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { Label } from '@/components/ui/label';
import { 
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from '@/components/ui/command';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { Badge } from '@/components/ui/badge';
import { Check, ChevronsUpDown } from 'lucide-react';
import { toast } from 'sonner';
import { cn } from '@/lib/utils';

interface AddStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watchlistId: string;
}

interface StockSearchResult {
  symbol: string;
  companyName: string;
  currentPrice?: number;
}

export function AddStockDialog({ open, onOpenChange, watchlistId }: AddStockDialogProps) {
  const dispatch = useAppDispatch();
  const { data: nseCompanies } = useAppSelector(state => state.nseCompanies);
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);

  // Filter NSE companies based on search term
  const filteredCompanies = nseCompanies.filter(company =>
    company.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
    company.companyName.toLowerCase().includes(searchTerm.toLowerCase())
  ).slice(0, 50); // Limit results for performance

  const handleStockSelect = async (company: { symbol: string; companyName: string }) => {
    setSelectedStock(company);
    setComboboxOpen(false);
    
    // Fetch current price for the selected stock
    setFetchingPrice(true);
    try {
      const response = await fetch('/api/stocks/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols: [company.symbol] }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.quotes && data.quotes.length > 0) {
          const quote = data.quotes[0];
          setSelectedStock(prev => prev ? {
            ...prev,
            currentPrice: quote.regularMarketPrice || 0
          } : null);
        }
      }
    } catch (error) {
      console.error('Failed to fetch stock price:', error);
    } finally {
      setFetchingPrice(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedStock) {
      toast.error('Please select a stock');
      return;
    }

    setLoading(true);

    try {
      const stockToAdd: Omit<WatchlistStock, 'id' | 'addedAt'> = {
        symbol: selectedStock.symbol,
        companyName: selectedStock.companyName,
        addedPrice: selectedStock.currentPrice,
        currentPrice: selectedStock.currentPrice,
        priceChange: 0,
        priceChangePercent: 0,
        lastUpdated: selectedStock.currentPrice ? new Date() : undefined,
      };

      await dispatch(addStockToWatchlist({
        watchlistId,
        stock: stockToAdd,
      })).unwrap();
      
      toast.success(`${selectedStock.companyName} added to watchlist`);
      
      // Reset form
      setSelectedStock(null);
      setSearchTerm('');
      onOpenChange(false);
    } catch (error) {
      if (error instanceof Error && error.message.includes('already exists')) {
        toast.error('This stock is already in the watchlist');
      } else {
        toast.error('Failed to add stock to watchlist');
      }
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setSelectedStock(null);
      setSearchTerm('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Stock to Watchlist</DialogTitle>
          <DialogDescription>
            Search and select a stock to add to your watchlist.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label>Select Stock</Label>
            <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  role="combobox"
                  aria-expanded={comboboxOpen}
                  className="w-full justify-between"
                  disabled={loading}
                >
                  {selectedStock ? (
                    <div className="flex items-center gap-2">
                      <span className="font-medium">{selectedStock.symbol}</span>
                      <span className="text-muted-foreground">
                        {selectedStock.companyName}
                      </span>
                    </div>
                  ) : (
                    "Search for a stock..."
                  )}
                  <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-full p-0">
                <Command>
                  <CommandInput 
                    placeholder="Search stocks..." 
                    value={searchTerm}
                    onValueChange={setSearchTerm}
                  />
                  <CommandList>
                    <CommandEmpty>
                      {nseCompanies.length === 0 
                        ? "No NSE companies loaded. Please upload NSE company list in settings."
                        : "No stocks found."
                      }
                    </CommandEmpty>
                    <CommandGroup>
                      {filteredCompanies.map((company) => (
                        <CommandItem
                          key={company.symbol}
                          value={`${company.symbol} ${company.companyName}`}
                          onSelect={() => handleStockSelect({
                            symbol: company.symbol,
                            companyName: company.companyName
                          })}
                        >
                          <Check
                            className={cn(
                              "mr-2 h-4 w-4",
                              selectedStock?.symbol === company.symbol 
                                ? "opacity-100" 
                                : "opacity-0"
                            )}
                          />
                          <div className="flex flex-col">
                            <div className="flex items-center gap-2">
                              <span className="font-medium">{company.symbol}</span>
                              <Badge variant="secondary" className="text-xs">
                                {company.series}
                              </Badge>
                            </div>
                            <span className="text-sm text-muted-foreground">
                              {company.companyName}
                            </span>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </CommandList>
                </Command>
              </PopoverContent>
            </Popover>
          </div>

          {selectedStock && (
            <div className="p-4 bg-muted/50 rounded-lg space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Selected Stock:</span>
                <Badge variant="outline">{selectedStock.symbol}</Badge>
              </div>
              <div className="text-sm text-muted-foreground">
                {selectedStock.companyName}
              </div>
              {fetchingPrice ? (
                <div className="text-sm text-muted-foreground">
                  Fetching current price...
                </div>
              ) : selectedStock.currentPrice ? (
                <div className="text-sm">
                  <span className="text-muted-foreground">Current Price: </span>
                  <span className="font-medium">
                    ₹{selectedStock.currentPrice.toFixed(2)}
                  </span>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">
                  Price data not available
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button 
              type="button" 
              variant="outline" 
              onClick={handleClose}
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedStock}>
              {loading ? 'Adding...' : 'Add to Watchlist'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}