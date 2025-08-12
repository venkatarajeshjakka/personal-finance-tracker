'use client';

import React, { useState } from 'react';
import { useAppSelector } from '@/lib/redux/hooks';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Transaction } from '@/types';
import { toast } from 'sonner';

interface AddTransactionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  portfolioId: string;
  onSuccess: (transaction: Omit<Transaction, 'id'>) => void;
}

interface StockSearchResult {
  symbol: string;
  companyName: string;
  currentPrice?: number;
}

export function AddTransactionDialog({
  open,
  onOpenChange,
  portfolioId,
  onSuccess
}: AddTransactionDialogProps) {
  const { data: companies } = useAppSelector(state => state.companies);
  const { data: nseCompanies } = useAppSelector(state => state.nseCompanies);
  const [formData, setFormData] = useState({
    symbol: '',
    type: 'buy' as 'buy' | 'sell',
    quantity: '',
    price: '',
    date: new Date().toISOString().split('T')[0],
    fees: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [selectedStock, setSelectedStock] = useState<StockSearchResult | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [comboboxOpen, setComboboxOpen] = useState(false);
  const [fetchingPrice, setFetchingPrice] = useState(false);

  // Combine companies and NSE data for stock search
  const availableStocks = [
    // From imported companies
    ...(companies || [])
      .filter(company => company.symbol)
      .map(company => ({
        symbol: company.symbol!,
        companyName: company.company,
        source: 'imported'
      })),
    // From NSE companies
    ...(nseCompanies || [])
      .map(company => ({
        symbol: company.symbol,
        companyName: company.companyName,
        source: 'nse'
      }))
  ];

  // Remove duplicates and filter based on search term
  const uniqueStocks = availableStocks
    .filter((stock, index, self) =>
      index === self.findIndex(s => s.symbol === stock.symbol)
    )
    .filter(stock =>
      stock.symbol.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.companyName.toLowerCase().includes(searchTerm.toLowerCase())
    )
    .slice(0, 50); // Limit results for performance

  const handleStockSelect = async (stock: { symbol: string; companyName: string }) => {
    setSelectedStock(stock);
    setFormData(prev => ({ ...prev, symbol: stock.symbol }));
    setComboboxOpen(false);

    // Fetch current price for the selected stock
    setFetchingPrice(true);
    try {
      const response = await fetch('/api/stocks/quotes', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ symbols: [stock.symbol] }),
      });

      if (response.ok) {
        const data = await response.json();
        if (data.quotes && data.quotes.length > 0) {
          const quote = data.quotes[0];
          const currentPrice = quote.regularMarketPrice || 0;
          setSelectedStock(prev => prev ? {
            ...prev,
            currentPrice
          } : null);

          // Auto-fill price if not already set
          if (!formData.price && currentPrice > 0) {
            setFormData(prev => ({ ...prev, price: currentPrice.toString() }));
          }
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

    if (!formData.symbol.trim()) {
      toast.error('Stock symbol is required');
      return;
    }

    const quantity = parseFloat(formData.quantity);
    const price = parseFloat(formData.price);
    const fees = parseFloat(formData.fees) || 0;

    if (quantity <= 0) {
      toast.error('Quantity must be greater than 0');
      return;
    }

    if (price <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    if (fees < 0) {
      toast.error('Fees cannot be negative');
      return;
    }

    setIsSubmitting(true);

    try {
      const totalAmount = (quantity * price) + (formData.type === 'buy' ? fees : -fees);

      const transaction: Omit<Transaction, 'id'> = {
        portfolioId,
        symbol: formData.symbol.toUpperCase(),
        type: formData.type,
        quantity,
        price,
        totalAmount,
        date: new Date(formData.date),
        fees: fees > 0 ? fees : undefined
      };

      onSuccess(transaction);
      toast.success(`${formData.type === 'buy' ? 'Buy' : 'Sell'} transaction added successfully`);

      // Reset form and close dialog
      setFormData({
        symbol: '',
        type: 'buy',
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
        fees: ''
      });
      setSelectedStock(null);
      setSearchTerm('');
      onOpenChange(false);

    } catch (error) {
      toast.error(`Failed to add transaction: ${error}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleInputChange = (field: keyof typeof formData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleClose = () => {
    if (!isSubmitting) {
      setFormData({
        symbol: '',
        type: 'buy',
        quantity: '',
        price: '',
        date: new Date().toISOString().split('T')[0],
        fees: ''
      });
      setSelectedStock(null);
      setSearchTerm('');
      onOpenChange(false);
    }
  };

  const calculateTotal = () => {
    const quantity = parseFloat(formData.quantity) || 0;
    const price = parseFloat(formData.price) || 0;
    const fees = parseFloat(formData.fees) || 0;

    if (quantity > 0 && price > 0) {
      const subtotal = quantity * price;
      const total = formData.type === 'buy' ? subtotal + fees : subtotal - fees;
      return total;
    }
    return 0;
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 2,
    }).format(amount);
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Add Transaction</DialogTitle>
          <DialogDescription>
            Record a buy or sell transaction for your portfolio.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Transaction Type */}
          <div className="space-y-3">
            <Label>Transaction Type</Label>
            <RadioGroup
              value={formData.type}
              onValueChange={(value) => handleInputChange('type', value)}
              className="flex space-x-6"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="buy" id="buy" />
                <Label htmlFor="buy">Buy</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="sell" id="sell" />
                <Label htmlFor="sell">Sell</Label>
              </div>
            </RadioGroup>
          </div>

          {/* Stock Symbol */}
          <div className="space-y-2">
            <Label>Stock Symbol *</Label>
            <div className="flex space-x-2">
              <div className="flex-1">
                <Popover open={comboboxOpen} onOpenChange={setComboboxOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={comboboxOpen}
                      className="w-full justify-between"
                      disabled={isSubmitting}
                    >
                      {selectedStock ? (
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{selectedStock.symbol}</span>
                          <span className="text-muted-foreground truncate">
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
                          {availableStocks.length === 0
                            ? "No stock data available. Import company data or NSE companies in settings."
                            : "No stocks found."
                          }
                        </CommandEmpty>
                        <CommandGroup>
                          {uniqueStocks.map((stock) => (
                            <CommandItem
                              key={stock.symbol}
                              value={`${stock.symbol} ${stock.companyName}`}
                              onSelect={() => handleStockSelect({
                                symbol: stock.symbol,
                                companyName: stock.companyName
                              })}
                            >
                              <Check
                                className={cn(
                                  "mr-2 h-4 w-4",
                                  selectedStock?.symbol === stock.symbol
                                    ? "opacity-100"
                                    : "opacity-0"
                                )}
                              />
                              <div className="flex flex-col">
                                <div className="flex items-center gap-2">
                                  <span className="font-medium">{stock.symbol}</span>
                                  <Badge variant="secondary" className="text-xs">
                                    {stock.source === 'imported' ? 'Imported' : 'NSE'}
                                  </Badge>
                                </div>
                                <span className="text-sm text-muted-foreground truncate">
                                  {stock.companyName}
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
              <div className="flex-shrink-0">
                <Input
                  placeholder="Or type symbol"
                  value={formData.symbol}
                  onChange={(e) => {
                    const value = e.target.value.toUpperCase();
                    handleInputChange('symbol', value);
                    if (value !== selectedStock?.symbol) {
                      setSelectedStock(null);
                    }
                  }}
                  disabled={isSubmitting}
                  className="w-32"
                />
              </div>
            </div>
            <div className="text-xs text-muted-foreground">
              Search from {availableStocks.length} available stocks or enter any symbol manually
            </div>
          </div>

          {/* Selected Stock Info */}
          {selectedStock && (
            <div className="p-3 bg-muted/50 rounded-lg space-y-2">
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

          {/* Quantity and Price */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="quantity">Quantity *</Label>
              <Input
                id="quantity"
                type="number"
                placeholder="100"
                min="1"
                step="1"
                value={formData.quantity}
                onChange={(e) => handleInputChange('quantity', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="price">Price per Share (₹) *</Label>
              <Input
                id="price"
                type="number"
                placeholder="1000.00"
                min="0.01"
                step="0.01"
                value={formData.price}
                onChange={(e) => handleInputChange('price', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>
          </div>

          {/* Date and Fees */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="date">Transaction Date *</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) => handleInputChange('date', e.target.value)}
                disabled={isSubmitting}
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="fees">Fees & Charges (₹)</Label>
              <Input
                id="fees"
                type="number"
                placeholder="0.00"
                min="0"
                step="0.01"
                value={formData.fees}
                onChange={(e) => handleInputChange('fees', e.target.value)}
                disabled={isSubmitting}
              />
            </div>
          </div>

          {/* Total Calculation */}
          {formData.quantity && formData.price && (
            <div className="p-3 bg-muted rounded-lg">
              <div className="flex justify-between items-center text-sm">
                <span>Subtotal:</span>
                <span>{formatCurrency(parseFloat(formData.quantity) * parseFloat(formData.price))}</span>
              </div>
              {formData.fees && parseFloat(formData.fees) > 0 && (
                <div className="flex justify-between items-center text-sm">
                  <span>Fees:</span>
                  <span>{formatCurrency(parseFloat(formData.fees))}</span>
                </div>
              )}
              <div className="flex justify-between items-center font-semibold border-t pt-2 mt-2">
                <span>Total {formData.type === 'buy' ? 'Cost' : 'Proceeds'}:</span>
                <span>{formatCurrency(calculateTotal())}</span>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : `Add ${formData.type === 'buy' ? 'Buy' : 'Sell'} Transaction`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}