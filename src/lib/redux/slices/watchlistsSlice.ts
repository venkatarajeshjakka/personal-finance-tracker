import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Watchlist, WatchlistsState } from '@/types';
import { StorageService } from '@/lib/storage';

// Async thunks for watchlist operations
export const loadWatchlists = createAsyncThunk(
  'watchlists/loadWatchlists',
  async () => {
    return StorageService.getAllWatchlists();
  }
);

export const saveWatchlist = createAsyncThunk(
  'watchlists/saveWatchlist',
  async (watchlist: Watchlist) => {
    StorageService.saveWatchlist(watchlist);
    return watchlist;
  }
);

export const deleteWatchlist = createAsyncThunk(
  'watchlists/deleteWatchlist',
  async (id: string) => {
    StorageService.deleteWatchlist(id);
    return id;
  }
);

export const addSymbolToWatchlist = createAsyncThunk(
  'watchlists/addSymbolToWatchlist',
  async ({ watchlistId, symbol }: { watchlistId: string; symbol: string }) => {
    const watchlist = StorageService.getWatchlist(watchlistId);
    if (!watchlist) {
      throw new Error('Watchlist not found');
    }

    if (watchlist.symbols.includes(symbol)) {
      throw new Error('Symbol already exists in watchlist');
    }

    const updatedWatchlist: Watchlist = {
      ...watchlist,
      symbols: [...watchlist.symbols, symbol],
      updatedAt: new Date()
    };

    StorageService.saveWatchlist(updatedWatchlist);
    return updatedWatchlist;
  }
);

export const removeSymbolFromWatchlist = createAsyncThunk(
  'watchlists/removeSymbolFromWatchlist',
  async ({ watchlistId, symbol }: { watchlistId: string; symbol: string }) => {
    const watchlist = StorageService.getWatchlist(watchlistId);
    if (!watchlist) {
      throw new Error('Watchlist not found');
    }

    const updatedWatchlist: Watchlist = {
      ...watchlist,
      symbols: watchlist.symbols.filter(s => s !== symbol),
      updatedAt: new Date()
    };

    StorageService.saveWatchlist(updatedWatchlist);
    return updatedWatchlist;
  }
);

const initialState: WatchlistsState = {
  data: [],
  loading: false,
  error: null,
  selectedWatchlist: null
};

const watchlistsSlice = createSlice({
  name: 'watchlists',
  initialState,
  reducers: {
    setSelectedWatchlist: (state, action: PayloadAction<string | null>) => {
      state.selectedWatchlist = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updateWatchlistInState: (state, action: PayloadAction<Watchlist>) => {
      const index = state.data.findIndex(w => w.id === action.payload.id);
      if (index !== -1) {
        state.data[index] = action.payload;
      } else {
        state.data.push(action.payload);
      }
    }
  },
  extraReducers: (builder) => {
    builder
      // Load watchlists
      .addCase(loadWatchlists.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadWatchlists.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(loadWatchlists.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load watchlists';
      })
      // Save watchlist
      .addCase(saveWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(saveWatchlist.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        } else {
          state.data.push(action.payload);
        }
      })
      .addCase(saveWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save watchlist';
      })
      // Delete watchlist
      .addCase(deleteWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deleteWatchlist.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter(w => w.id !== action.payload);
        if (state.selectedWatchlist === action.payload) {
          state.selectedWatchlist = null;
        }
      })
      .addCase(deleteWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete watchlist';
      })
      // Add symbol to watchlist
      .addCase(addSymbolToWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addSymbolToWatchlist.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(addSymbolToWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add symbol to watchlist';
      })
      // Remove symbol from watchlist
      .addCase(removeSymbolFromWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeSymbolFromWatchlist.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(removeSymbolFromWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to remove symbol from watchlist';
      });
  }
});

export const { 
  setSelectedWatchlist, 
  clearError, 
  updateWatchlistInState 
} = watchlistsSlice.actions;

export default watchlistsSlice.reducer;