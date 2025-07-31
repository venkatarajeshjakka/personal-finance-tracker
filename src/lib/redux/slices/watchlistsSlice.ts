import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Watchlist, WatchlistStock, WatchlistsState } from '@/types';
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

export const addStockToWatchlist = createAsyncThunk(
  'watchlists/addStockToWatchlist',
  async ({ watchlistId, stock }: { watchlistId: string; stock: Omit<WatchlistStock, 'id' | 'addedAt'> }) => {
    const watchlist = StorageService.getWatchlist(watchlistId);
    if (!watchlist) {
      throw new Error('Watchlist not found');
    }

    if (watchlist.stocks.some(s => s.symbol === stock.symbol)) {
      throw new Error('Stock already exists in watchlist');
    }

    const newStock: WatchlistStock = {
      id: `${watchlistId}-${stock.symbol}-${Date.now()}`,
      ...stock,
      addedAt: new Date()
    };

    const updatedWatchlist: Watchlist = {
      ...watchlist,
      stocks: [...watchlist.stocks, newStock],
      updatedAt: new Date()
    };

    StorageService.saveWatchlist(updatedWatchlist);
    return updatedWatchlist;
  }
);

export const removeStockFromWatchlist = createAsyncThunk(
  'watchlists/removeStockFromWatchlist',
  async ({ watchlistId, stockId }: { watchlistId: string; stockId: string }) => {
    const watchlist = StorageService.getWatchlist(watchlistId);
    if (!watchlist) {
      throw new Error('Watchlist not found');
    }

    const updatedWatchlist: Watchlist = {
      ...watchlist,
      stocks: watchlist.stocks.filter(s => s.id !== stockId),
      updatedAt: new Date()
    };

    StorageService.saveWatchlist(updatedWatchlist);
    return updatedWatchlist;
  }
);

export const updateStockPrices = createAsyncThunk(
  'watchlists/updateStockPrices',
  async ({ watchlistId, priceUpdates }: { 
    watchlistId: string; 
    priceUpdates: Array<{ stockId: string; currentPrice: number; priceChange: number; priceChangePercent: number }> 
  }) => {
    const watchlist = StorageService.getWatchlist(watchlistId);
    if (!watchlist) {
      throw new Error('Watchlist not found');
    }

    const updatedStocks = watchlist.stocks.map(stock => {
      const update = priceUpdates.find(u => u.stockId === stock.id);
      if (update) {
        return {
          ...stock,
          currentPrice: update.currentPrice,
          priceChange: update.priceChange,
          priceChangePercent: update.priceChangePercent,
          lastUpdated: new Date()
        };
      }
      return stock;
    });

    const updatedWatchlist: Watchlist = {
      ...watchlist,
      stocks: updatedStocks,
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
      // Add stock to watchlist
      .addCase(addStockToWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addStockToWatchlist.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(addStockToWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add stock to watchlist';
      })
      // Remove stock from watchlist
      .addCase(removeStockFromWatchlist.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(removeStockFromWatchlist.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(removeStockFromWatchlist.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to remove stock from watchlist';
      })
      // Update stock prices
      .addCase(updateStockPrices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updateStockPrices.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(w => w.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(updateStockPrices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update stock prices';
      });
  }
});

export const { 
  setSelectedWatchlist, 
  clearError, 
  updateWatchlistInState 
} = watchlistsSlice.actions;

export default watchlistsSlice.reducer;