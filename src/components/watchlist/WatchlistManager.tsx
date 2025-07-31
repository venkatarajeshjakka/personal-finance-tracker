'use client';

import { useState } from 'react';
import { useAppDispatch, useAppSelector } from '@/lib/redux/store';
import { setSelectedWatchlist, deleteWatchlist } from '@/lib/redux/slices/watchlistsSlice';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger 
} from '@/components/ui/dropdown-menu';
import { 
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { EditWatchlistDialog } from './EditWatchlistDialog';
import { MoreVertical, Trash2, Eye, Edit } from 'lucide-react';
import { toast } from 'sonner';
import { Watchlist } from '@/types';

export function WatchlistManager() {
  const dispatch = useAppDispatch();
  const { data: watchlists, loading, selectedWatchlist } = useAppSelector(state => state.watchlists);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [watchlistToDelete, setWatchlistToDelete] = useState<string | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [watchlistToEdit, setWatchlistToEdit] = useState<Watchlist | null>(null);

  const handleSelectWatchlist = (watchlistId: string) => {
    dispatch(setSelectedWatchlist(watchlistId));
  };

  const handleDeleteWatchlist = async (watchlistId: string) => {
    try {
      await dispatch(deleteWatchlist(watchlistId)).unwrap();
      toast.success('Watchlist deleted successfully');
      setDeleteDialogOpen(false);
      setWatchlistToDelete(null);
    } catch (error) {
      toast.error('Failed to delete watchlist');
    }
  };

  const openDeleteDialog = (watchlistId: string) => {
    setWatchlistToDelete(watchlistId);
    setDeleteDialogOpen(true);
  };

  const openEditDialog = (watchlist: Watchlist) => {
    setWatchlistToEdit(watchlist);
    setEditDialogOpen(true);
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>My Watchlists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-16 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>My Watchlists</CardTitle>
        </CardHeader>
        <CardContent>
          {watchlists.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground text-sm">
                No watchlists created yet
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {watchlists.map((watchlist) => (
                <div
                  key={watchlist.id}
                  className={`p-3 rounded-lg border cursor-pointer transition-colors ${
                    selectedWatchlist === watchlist.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleSelectWatchlist(watchlist.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate">{watchlist.name}</h4>
                      {watchlist.description && (
                        <p className="text-sm text-muted-foreground truncate">
                          {watchlist.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-1">
                        <Badge variant="secondary" className="text-xs">
                          {watchlist.stocks.length} stocks
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {new Date(watchlist.updatedAt).toLocaleDateString()}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm">
                          <MoreVertical className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem onClick={() => handleSelectWatchlist(watchlist.id)}>
                          <Eye className="h-4 w-4 mr-2" />
                          View
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => openEditDialog(watchlist)}>
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={() => openDeleteDialog(watchlist.id)}
                          className="text-destructive"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Watchlist</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this watchlist? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => watchlistToDelete && handleDeleteWatchlist(watchlistToDelete)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <EditWatchlistDialog
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        watchlist={watchlistToEdit}
      />
    </>
  );
}