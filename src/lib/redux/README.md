# Redux Store Setup

This directory contains the complete Redux Toolkit setup for the Personal Finance Tracker application.

## Structure

```
redux/
├── api/
│   └── financeApi.ts          # RTK Query API for external services
├── middleware/
│   └── localStorageMiddleware.ts  # localStorage synchronization
├── slices/
│   ├── companiesSlice.ts      # Company data management
│   ├── portfoliosSlice.ts     # Portfolio management
│   ├── watchlistsSlice.ts     # Watchlist management
│   ├── filtersSlice.ts        # Filter state management
│   ├── uiSlice.ts            # UI state management
│   └── index.ts              # Slice exports
├── __tests__/
│   └── store.test.ts         # Store tests
├── hooks.ts                  # Custom Redux hooks
├── selectors.ts              # Memoized selectors
├── store.ts                  # Store configuration
├── index.ts                  # Main exports
└── README.md                 # This file
```

## Features

### 1. Redux Slices

- **Companies Slice**: Manages company financial data with async operations for loading, saving, deleting, and importing
- **Portfolios Slice**: Handles portfolio management including transactions and holdings calculations
- **Watchlists Slice**: Manages watchlist creation and symbol tracking
- **Filters Slice**: Controls sorting, filtering, and search functionality
- **UI Slice**: Manages UI state like sidebar, theme, and notifications

### 2. RTK Query API

The `financeApi` provides endpoints for:
- Stock quotes and historical data (Yahoo Finance)
- AI insights and analysis (Gemini AI)
- Search functionality
- Real-time price updates

### 3. localStorage Synchronization

Automatic synchronization between Redux state and localStorage:
- User preferences (theme, default quarter/year)
- Data persistence across browser sessions
- Debounced updates for performance

### 4. Memoized Selectors

Optimized selectors using `createSelector` for:
- Filtered and sorted data
- Computed values
- Performance metrics
- Dashboard aggregations

### 5. Custom Hooks

Convenient hooks that combine selectors and actions:
- `useCompanies()` - Company data and operations
- `usePortfolios()` - Portfolio management
- `useWatchlists()` - Watchlist operations
- `useFilters()` - Filter controls
- `useUI()` - UI state management
- `useDashboard()` - Dashboard data

## Usage Examples

### Basic Component Usage

```tsx
import { useCompanies, useFilters } from '@/lib/redux';

function CompanyList() {
  const { filteredCompanies, loading, setSelectedQuarter } = useCompanies();
  const { filters, setSortBy } = useFilters();

  if (loading) return <div>Loading...</div>;

  return (
    <div>
      <select onChange={(e) => setSortBy(e.target.value as any)}>
        <option value="sales">Sales</option>
        <option value="EBIDT">EBIDT</option>
      </select>
      
      {filteredCompanies.map(company => (
        <div key={company.id}>{company.company}</div>
      ))}
    </div>
  );
}
```

### Direct Store Access

```tsx
import { useAppSelector, useAppDispatch } from '@/lib/redux';
import { setTheme, selectTheme } from '@/lib/redux';

function ThemeToggle() {
  const theme = useAppSelector(selectTheme);
  const dispatch = useAppDispatch();

  return (
    <button onClick={() => dispatch(setTheme(theme === 'light' ? 'dark' : 'light'))}>
      Current: {theme}
    </button>
  );
}
```

### Async Operations

```tsx
import { useCompanies } from '@/lib/redux';

function DataImport() {
  const { importCompanyData, loading } = useCompanies();

  const handleImport = async (jsonData: string) => {
    try {
      await importCompanyData(jsonData).unwrap();
      // Success handling
    } catch (error) {
      // Error handling
    }
  };

  return (
    <button onClick={() => handleImport(data)} disabled={loading}>
      Import Data
    </button>
  );
}
```

## Middleware

### localStorage Middleware

Automatically syncs specific actions with localStorage:
- Saves user preferences on theme/filter changes
- Debounces high-frequency updates
- Handles errors gracefully with notifications

### RTK Query Middleware

Provides caching, background updates, and optimistic updates for API calls.

## Testing

The store includes comprehensive tests covering:
- Initial state verification
- Action dispatching
- State updates
- Async operations

Run tests with:
```bash
npm test src/lib/redux/__tests__/
```

## Performance Considerations

- Memoized selectors prevent unnecessary re-renders
- Debounced localStorage updates
- RTK Query caching reduces API calls
- Normalized state structure for efficient updates

## Error Handling

- Async thunks include proper error handling
- localStorage errors show user notifications
- API errors are captured and displayed
- Graceful degradation when services are unavailable