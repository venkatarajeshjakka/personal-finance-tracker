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
import { formatDate } from '@/lib/utils/dateUtils';

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
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">My Watchlists</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-20 w-48 bg-muted animate-pulse rounded" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-lg">My Watchlists</CardTitle>
        </CardHeader>
        <CardContent>
          {watchlists.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-muted-foreground text-sm">
                No watchlists created yet
              </p>
            </div>
          ) : (
            <div className="flex flex-wrap gap-3">
              {watchlists.map((watchlist) => (
                <div
                  key={watchlist.id}
                  className={`flex-shrink-0 p-3 rounded-lg border cursor-pointer transition-colors min-w-[200px] ${
                    selectedWatchlist === watchlist.id
                      ? 'bg-primary/10 border-primary'
                      : 'hover:bg-muted/50'
                  }`}
                  onClick={() => handleSelectWatchlist(watchlist.id)}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <h4 className="font-medium truncate text-sm">{watchlist.name}</h4>
                      {watchlist.description && (
                        <p className="text-xs text-muted-foreground truncate mt-1">
                          {watchlist.description}
                        </p>
                      )}
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="secondary" className="text-xs px-2 py-0.5">
                          {watchlist.stocks.length} stocks
                        </Badge>
                        <span className="text-xs text-muted-foreground">
                          {formatDate(watchlist.updatedAt)}
                        </span>
                      </div>
                    </div>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                          <MoreVertical className="h-3 w-3" />
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