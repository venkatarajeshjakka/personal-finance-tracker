'use client';

import { useState } from 'react';
import { useAppDispatch } from '@/lib/redux/store';
import { saveWatchlist, setSelectedWatchlist } from '@/lib/redux/slices/watchlistsSlice';
import { Watchlist } from '@/types';
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
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';

interface CreateWatchlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function CreateWatchlistDialog({ open, onOpenChange }: CreateWatchlistDialogProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      toast.error('Watchlist name is required');
      return;
    }

    setLoading(true);

    try {
      const newWatchlist: Watchlist = {
        id: `watchlist-${Date.now()}`,
        name: name.trim(),
        description: description.trim() || undefined,
        userId: 'default-user', // TODO: Replace with actual user ID when auth is implemented
        stocks: [],
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await dispatch(saveWatchlist(newWatchlist)).unwrap();
      dispatch(setSelectedWatchlist(newWatchlist.id));
      
      toast.success('Watchlist created successfully');
      
      // Reset form
      setName('');
      setDescription('');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to create watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      setName('');
      setDescription('');
      onOpenChange(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Create New Watchlist</DialogTitle>
          <DialogDescription>
            Create a new watchlist to track your favorite stocks and investments.
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Name *</Label>
            <Input
              id="name"
              placeholder="e.g., Tech Stocks, Dividend Stocks"
              value={name}
              onChange={(e) => setName(e.target.value)}
              disabled={loading}
              required
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="description">Description (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Brief description of this watchlist..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              disabled={loading}
              rows={3}
            />
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Creating...' : 'Create Watchlist'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}