'use client';

import { useEffect, useState } from 'react';
import { AppLayout } from "@/components/navigation";
import { WatchlistManager } from "@/components/watchlist/WatchlistManager";
import { CreateWatchlistDialog } from "@/components/watchlist/CreateWatchlistDialog";
import { WatchlistDisplay } from "@/components/watchlist/WatchlistDisplay";
import { useAppDispatch, useAppSelector } from '@/lib/redux/store';
import { loadWatchlists } from '@/lib/redux/slices/watchlistsSlice';
import { Button } from '@/components/ui/button';
import { Plus } from 'lucide-react';

export default function WatchlistPage() {
  const dispatch = useAppDispatch();
  const { data: watchlists, selectedWatchlist } = useAppSelector(state => state.watchlists);
  const [showCreateDialog, setShowCreateDialog] = useState(false);

  useEffect(() => {
    dispatch(loadWatchlists());
  }, [dispatch]);

  const selectedWatchlistData = selectedWatchlist 
    ? watchlists.find(w => w.id === selectedWatchlist)
    : null;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Watchlists</h1>
            <p className="text-muted-foreground">
              Track and monitor your favorite stocks and investments.
            </p>
          </div>
          <Button onClick={() => setShowCreateDialog(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Create Watchlist
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Watchlist Manager - Left sidebar */}
          <div className="lg:col-span-1">
            <WatchlistManager />
          </div>

          {/* Watchlist Display - Main content */}
          <div className="lg:col-span-3">
            {selectedWatchlistData ? (
              <WatchlistDisplay watchlist={selectedWatchlistData} />
            ) : (
              <div className="rounded-lg border bg-card p-8 text-center">
                <h3 className="text-lg font-medium mb-2">No Watchlist Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a watchlist from the sidebar or create a new one to get started.
                </p>
                <Button onClick={() => setShowCreateDialog(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Create Your First Watchlist
                </Button>
              </div>
            )}
          </div>
        </div>

        <CreateWatchlistDialog 
          open={showCreateDialog} 
          onOpenChange={setShowCreateDialog} 
        />
      </div>
    </AppLayout>
  );
}