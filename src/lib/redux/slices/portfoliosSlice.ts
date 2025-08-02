import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Portfolio, PortfoliosState, Transaction, Holding } from '@/types';
import { StorageService } from '@/lib/storage';

// Async thunks for portfolio operations
export const loadPortfolios = createAsyncThunk(
  'portfolios/loadPortfolios',
  async () => {
    return StorageService.getAllPortfolios();
  }
);

export const savePortfolio = createAsyncThunk(
  'portfolios/savePortfolio',
  async (portfolio: Portfolio) => {
    StorageService.savePortfolio(portfolio);
    return portfolio;
  }
);

export const deletePortfolio = createAsyncThunk(
  'portfolios/deletePortfolio',
  async (id: string) => {
    StorageService.deletePortfolio(id);
    return id;
  }
);

export const addTransaction = createAsyncThunk(
  'portfolios/addTransaction',
  async ({ portfolioId, transaction }: { portfolioId: string; transaction: Transaction }) => {
    const portfolio = StorageService.getPortfolio(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const updatedPortfolio: Portfolio = {
      ...portfolio,
      transactions: [...portfolio.transactions, transaction],
      updatedAt: new Date()
    };

    // Recalculate holdings based on transactions
    const holdingsMap = new Map<string, Holding>();
    
    updatedPortfolio.transactions.forEach(tx => {
      const existing = holdingsMap.get(tx.symbol);
      
      if (tx.type === 'buy') {
        if (existing) {
          const totalQuantity = existing.quantity + tx.quantity;
          const totalCost = (existing.quantity * existing.averagePrice) + (tx.quantity * tx.price);
          existing.quantity = totalQuantity;
          existing.averagePrice = totalCost / totalQuantity;
        } else {
          holdingsMap.set(tx.symbol, {
            id: `${portfolioId}-${tx.symbol}`,
            symbol: tx.symbol,
            quantity: tx.quantity,
            averagePrice: tx.price,
            currentPrice: tx.price, // Will be updated by real-time data
            totalValue: tx.quantity * tx.price,
            unrealizedGain: 0
          });
        }
      } else if (tx.type === 'sell' && existing) {
        existing.quantity -= tx.quantity;
        if (existing.quantity <= 0) {
          holdingsMap.delete(tx.symbol);
        }
      }
    });

    updatedPortfolio.holdings = Array.from(holdingsMap.values());
    
    // Recalculate portfolio totals
    updatedPortfolio.currentValue = updatedPortfolio.holdings.reduce(
      (sum, holding) => sum + holding.totalValue, 
      0
    );
    updatedPortfolio.totalReturn = updatedPortfolio.currentValue - updatedPortfolio.initialCapital;

    StorageService.savePortfolio(updatedPortfolio);
    return updatedPortfolio;
  }
);

const initialState: PortfoliosState = {
  data: [],
  loading: false,
  error: null,
  selectedPortfolio: null
};

const portfoliosSlice = createSlice({
  name: 'portfolios',
  initialState,
  reducers: {
    setSelectedPortfolio: (state, action: PayloadAction<string | null>) => {
      state.selectedPortfolio = action.payload;
    },
    clearError: (state) => {
      state.error = null;
    },
    updatePortfolioInState: (state, action: PayloadAction<Portfolio>) => {
      const index = state.data.findIndex(p => p.id === action.payload.id);
      if (index !== -1) {
        state.data[index] = action.payload;
      } else {
        state.data.push(action.payload);
      }
    },
    updateHoldingPrices: (state, action: PayloadAction<{ symbol: string; price: number }[]>) => {
      const priceUpdates = new Map(action.payload.map(p => [p.symbol, p.price]));
      
      state.data.forEach(portfolio => {
        portfolio.holdings.forEach(holding => {
          const newPrice = priceUpdates.get(holding.symbol);
          if (newPrice !== undefined) {
            holding.currentPrice = newPrice;
            holding.totalValue = holding.quantity * newPrice;
            holding.unrealizedGain = holding.totalValue - (holding.quantity * holding.averagePrice);
          }
        });
        
        // Recalculate portfolio totals
        portfolio.currentValue = portfolio.holdings.reduce(
          (sum, holding) => sum + holding.totalValue, 
          0
        );
        portfolio.totalReturn = portfolio.currentValue - portfolio.initialCapital;
      });
    }
  },
  extraReducers: (builder) => {
    builder
      // Load portfolios
      .addCase(loadPortfolios.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(loadPortfolios.fulfilled, (state, action) => {
        state.loading = false;
        state.data = action.payload;
      })
      .addCase(loadPortfolios.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to load portfolios';
      })
      // Save portfolio
      .addCase(savePortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(savePortfolio.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        } else {
          state.data.push(action.payload);
        }
      })
      .addCase(savePortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to save portfolio';
      })
      // Delete portfolio
      .addCase(deletePortfolio.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(deletePortfolio.fulfilled, (state, action) => {
        state.loading = false;
        state.data = state.data.filter(p => p.id !== action.payload);
        if (state.selectedPortfolio === action.payload) {
          state.selectedPortfolio = null;
        }
      })
      .addCase(deletePortfolio.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to delete portfolio';
      })
      // Add transaction
      .addCase(addTransaction.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addTransaction.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(addTransaction.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to add transaction';
      });
  }
});

export const { 
  setSelectedPortfolio, 
  clearError, 
  updatePortfolioInState,
  updateHoldingPrices
} = portfoliosSlice.actions;

export default portfoliosSlice.reducer;