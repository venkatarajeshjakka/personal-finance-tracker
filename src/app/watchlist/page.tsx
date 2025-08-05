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
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    dispatch(loadWatchlists());
  }, [dispatch]);

  const selectedWatchlistData = selectedWatchlist
    ? watchlists.find(w => w.id === selectedWatchlist)
    : null;

  // Prevent hydration mismatch by not rendering until mounted
  if (!mounted) {
    return (
      <AppLayout>
        <div className="space-y-6 pb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Watchlists</h1>
              <p className="text-muted-foreground">
                Track and monitor your favorite stocks and investments.
              </p>
            </div>
            <Button disabled>
              <Plus className="h-4 w-4 mr-2" />
              Create Watchlist
            </Button>
          </div>
          <div className="space-y-6">
            <div className="animate-pulse bg-muted rounded-lg h-16"></div>
            <div className="animate-pulse bg-muted rounded-lg h-96"></div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="space-y-6 pb-8">
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

        {/* Compact Watchlist Manager - Horizontal layout */}
        <div className="mb-6">
          <WatchlistManager />
        </div>

        {/* Full-width Watchlist Display */}
        <div className="w-full">
          {selectedWatchlistData ? (
            <WatchlistDisplay watchlist={selectedWatchlistData} />
          ) : (
            <div className="rounded-lg border bg-card p-8 text-center">
              <h3 className="text-lg font-medium mb-2">No Watchlist Selected</h3>
              <p className="text-muted-foreground mb-4">
                Select a watchlist from above or create a new one to get started.
              </p>
              <Button onClick={() => setShowCreateDialog(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Create Your First Watchlist
              </Button>
            </div>
          )}
        </div>

        <CreateWatchlistDialog
          open={showCreateDialog}
          onOpenChange={setShowCreateDialog}
        />
      </div>
    </AppLayout>
  );
}