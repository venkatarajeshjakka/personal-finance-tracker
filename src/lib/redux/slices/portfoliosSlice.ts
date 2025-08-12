import { createSlice, createAsyncThunk, PayloadAction } from '@reduxjs/toolkit';
import { Portfolio, PortfoliosState, Transaction, Holding, calculateNetInvested } from '@/types';
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
          const newAveragePrice = totalCost / totalQuantity;

          existing.quantity = totalQuantity;
          existing.averagePrice = newAveragePrice;
          existing.currentPrice = tx.price; // Use latest transaction price as current price
          existing.totalValue = totalQuantity * tx.price;
          existing.unrealizedGain = existing.totalValue - (totalQuantity * newAveragePrice);
        } else {
          holdingsMap.set(tx.symbol, {
            id: `${portfolioId}-${tx.symbol}`,
            symbol: tx.symbol,
            quantity: tx.quantity,
            averagePrice: tx.price,
            currentPrice: tx.price,
            totalValue: tx.quantity * tx.price,
            unrealizedGain: 0 // No gain/loss on first purchase
          });
        }
      } else if (tx.type === 'sell' && existing) {
        existing.quantity -= tx.quantity;
        if (existing.quantity <= 0) {
          holdingsMap.delete(tx.symbol);
        } else {
          // Update current price and recalculate values
          existing.currentPrice = tx.price;
          existing.totalValue = existing.quantity * tx.price;
          existing.unrealizedGain = existing.totalValue - (existing.quantity * existing.averagePrice);
        }
      }
    });

    updatedPortfolio.holdings = Array.from(holdingsMap.values());

    // Calculate actual money invested from transactions
    const netInvested = calculateNetInvested(updatedPortfolio.transactions);

    // Recalculate portfolio totals
    updatedPortfolio.currentValue = updatedPortfolio.holdings.reduce(
      (sum, holding) => sum + holding.totalValue,
      0
    );
    updatedPortfolio.totalReturn = updatedPortfolio.currentValue - netInvested;

    StorageService.savePortfolio(updatedPortfolio);
    return updatedPortfolio;
  }
);

export const updatePortfolioHoldingPrices = createAsyncThunk(
  'portfolios/updatePortfolioHoldingPrices',
  async ({ portfolioId, priceUpdates }: {
    portfolioId: string;
    priceUpdates: Array<{
      symbol: string;
      currentPrice: number;
      priceChange: number;
      priceChangePercent: number;
      marketCap?: number | null;
      sector?: string;
      industry?: string;
      trailingPE?: number | null;
      forwardPE?: number | null;
      priceToBook?: number | null;
    }>
  }) => {
    const portfolio = StorageService.getPortfolio(portfolioId);
    if (!portfolio) {
      throw new Error('Portfolio not found');
    }

    const updatedHoldings = portfolio.holdings.map(holding => {
      const update = priceUpdates.find(u => u.symbol === holding.symbol);
      if (update) {
        const newTotalValue = holding.quantity * update.currentPrice;
        const newUnrealizedGain = newTotalValue - (holding.quantity * holding.averagePrice);
        const dayGainLoss = holding.quantity * update.priceChange;

        return {
          ...holding,
          currentPrice: update.currentPrice,
          totalValue: newTotalValue,
          unrealizedGain: newUnrealizedGain,
          priceChange: update.priceChange,
          priceChangePercent: update.priceChangePercent,
          dayGainLoss: dayGainLoss,
          // Update financial metrics from Yahoo Finance API
          marketCap: update.marketCap !== undefined ? update.marketCap : holding.marketCap,
          sector: update.sector || holding.sector,
          industry: update.industry || holding.industry,
          trailingPE: update.trailingPE !== undefined ? update.trailingPE : holding.trailingPE,
          forwardPE: update.forwardPE !== undefined ? update.forwardPE : holding.forwardPE,
          priceToBook: update.priceToBook !== undefined ? update.priceToBook : holding.priceToBook,
        };
      }
      return holding;
    });

    // Calculate actual money invested from transactions
    const netInvested = calculateNetInvested(portfolio.transactions);

    // Recalculate portfolio totals
    const newCurrentValue = updatedHoldings.reduce(
      (sum, holding) => sum + holding.totalValue,
      0
    );
    const newTotalReturn = newCurrentValue - netInvested;

    const updatedPortfolio: Portfolio = {
      ...portfolio,
      holdings: updatedHoldings,
      currentValue: newCurrentValue,
      totalReturn: newTotalReturn,
      updatedAt: new Date()
    };

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
    updateHoldingPrices: (state, action: PayloadAction<{ symbol: string; price: number; priceChange?: number; priceChangePercent?: number }[]>) => {
      const priceUpdates = new Map(action.payload.map(p => [p.symbol, { price: p.price, priceChange: p.priceChange, priceChangePercent: p.priceChangePercent }]));

      state.data.forEach(portfolio => {
        portfolio.holdings.forEach(holding => {
          const update = priceUpdates.get(holding.symbol);
          if (update !== undefined) {
            holding.currentPrice = update.price;
            holding.totalValue = holding.quantity * update.price;
            holding.unrealizedGain = holding.totalValue - (holding.quantity * holding.averagePrice);
            
            // Add daily change data if available
            if (update.priceChange !== undefined) {
              holding.priceChange = update.priceChange;
              holding.dayGainLoss = holding.quantity * update.priceChange;
            }
            if (update.priceChangePercent !== undefined) {
              holding.priceChangePercent = update.priceChangePercent;
            }
          }
        });

        // Calculate actual money invested from transactions
        const netInvested = calculateNetInvested(portfolio.transactions);

        // Recalculate portfolio totals
        portfolio.currentValue = portfolio.holdings.reduce(
          (sum, holding) => sum + holding.totalValue,
          0
        );
        portfolio.totalReturn = portfolio.currentValue - netInvested;
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
      })
      // Update portfolio holding prices
      .addCase(updatePortfolioHoldingPrices.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(updatePortfolioHoldingPrices.fulfilled, (state, action) => {
        state.loading = false;
        const index = state.data.findIndex(p => p.id === action.payload.id);
        if (index !== -1) {
          state.data[index] = action.payload;
        }
      })
      .addCase(updatePortfolioHoldingPrices.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || 'Failed to update holding prices';
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