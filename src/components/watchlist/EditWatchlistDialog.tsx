'use client';

import { useState, useEffect } from 'react';
import { useAppDispatch } from '@/lib/redux/store';
import { updateWatchlistName } from '@/lib/redux/slices/watchlistsSlice';
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
import { Textarea } from '@/components/ui/textarea';
import { toast } from 'sonner';
import { Watchlist } from '@/types';

interface EditWatchlistDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  watchlist: Watchlist | null;
}

export function EditWatchlistDialog({ open, onOpenChange, watchlist }: EditWatchlistDialogProps) {
  const dispatch = useAppDispatch();
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (watchlist && open) {
      setName(watchlist.name);
      setDescription(watchlist.description || '');
    }
  }, [watchlist, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!watchlist) return;
    
    const trimmedName = name.trim();
    if (!trimmedName) {
      toast.error('Watchlist name is required');
      return;
    }

    setLoading(true);
    try {
      await dispatch(updateWatchlistName({
        watchlistId: watchlist.id,
        name: trimmedName,
        description: description.trim() || undefined
      })).unwrap();
      
      toast.success('Watchlist updated successfully');
      onOpenChange(false);
    } catch (error) {
      toast.error('Failed to update watchlist');
    } finally {
      setLoading(false);
    }
  };

  const handleClose = () => {
    if (!loading) {
      onOpenChange(false);
      // Reset form when closing
      if (watchlist) {
        setName(watchlist.name);
        setDescription(watchlist.description || '');
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Edit Watchlist</DialogTitle>
          <DialogDescription>
            Update the name and description of your watchlist.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">Name *</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Enter watchlist name"
                disabled={loading}
                required
              />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter watchlist description (optional)"
                disabled={loading}
                rows={3}
              />
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
            <Button type="submit" disabled={loading}>
              {loading ? 'Updating...' : 'Update Watchlist'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}