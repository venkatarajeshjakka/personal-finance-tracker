'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/store';
import { moveStockBetweenWatchlists } from '@/lib/redux/slices/watchlistsSlice';
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
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { toast } from 'sonner';
import { WatchlistStock } from '@/types';

interface MoveStockDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  stock: WatchlistStock | null;
  currentWatchlistId: string;
}

export function MoveStockDialog({ 
  open, 
  onOpenChange, 
  stock, 
  currentWatchlistId 
}: MoveStockDialogProps) {
  const dispatch = useAppDispatch();
  const { data: watchlists } = useAppSelector(state => state.watchlists);
  const [selectedWatchlistId, setSelectedWatchlistId] = useState<string>('');
  const [loading, setLoading] = useState(false);

  // Filter out the current watchlist and watchlists that already contain this stock
  const availableWatchlists = watchlists.filter(watchlist => {
    if (watchlist.id === currentWatchlistId) return false;
    if (stock && watchlist.stocks.some(s => s.symbol === stock.symbol)) return false;
    return true;
  });

  const handleMove = async () => {
    if (!stock || !selectedWatchlistId) {
      toast.error('Please select a destination watchlist');
      return;
    }

    setLoading(true);
    try {
      await dispatch(moveStockBetweenWatchlists({
        fromWatchlistId: currentWatchlistId,
        toWatchlistId: selectedWatchlistId,
        stockId: stock.id
      })).unwrap();

      const destinationWatchlist = watchlists.find(w => w.id === selectedWatchlistId);
      toast.success(`${stock.companyName} moved to ${destinationWatchlist?.name}`);
      onOpenChange(false);
      setSelectedWatchlistId('');
    } catch (error: any) {
      toast.error(error.message || 'Failed to move stock');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      setSelectedWatchlistId('');
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Move Stock</DialogTitle>
          <DialogDescription>
            Move {stock?.companyName} ({stock?.symbol}) to another watchlist.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="watchlist">Destination Watchlist</Label>
            {availableWatchlists.length === 0 ? (
              <div className="text-sm text-muted-foreground p-3 border rounded-md">
                {stock ? (
                  watchlists.filter(w => w.id !== currentWatchlistId).length === 0 ? (
                    'No other watchlists available. Create another watchlist first.'
                  ) : (
                    `${stock.companyName} already exists in all other watchlists.`
                  )
                ) : (
                  'No watchlists available.'
                )}
              </div>
            ) : (
              <Select
                value={selectedWatchlistId}
                onValueChange={setSelectedWatchlistId}
                disabled={loading}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select a watchlist" />
                </SelectTrigger>
                <SelectContent>
                  {availableWatchlists.map((watchlist) => (
                    <SelectItem key={watchlist.id} value={watchlist.id}>
                      <div className="flex flex-col">
                        <span>{watchlist.name}</span>
                        {watchlist.description && (
                          <span className="text-xs text-muted-foreground">
                            {watchlist.description}
                          </span>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="outline"
            onClick={handleClose}
            disabled={loading}
          >
            Cancel
          </Button>
          <Button
            onClick={handleMove}
            disabled={loading || !selectedWatchlistId || availableWatchlists.length === 0}
          >
            {loading ? 'Moving...' : 'Move Stock'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}