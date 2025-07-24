import { store } from '../store';
import { 
  setSelectedQuarter, 
  setSelectedYear,
  setSortBy,
  setTheme,
  addNotification
} from '../slices';

describe('Redux Store', () => {
  test('should have initial state', () => {
    const state = store.getState();
    
    expect(state.companies).toBeDefined();
    expect(state.portfolios).toBeDefined();
    expect(state.watchlists).toBeDefined();
    expect(state.filters).toBeDefined();
    expect(state.ui).toBeDefined();
    expect(state.financeApi).toBeDefined();
  });

  test('should handle companies actions', () => {
    store.dispatch(setSelectedQuarter('Q1'));
    store.dispatch(setSelectedYear(2024));
    
    const state = store.getState();
    expect(state.companies.selectedQuarter).toBe('Q1');
    expect(state.companies.selectedYear).toBe(2024);
  });

  test('should handle filters actions', () => {
    store.dispatch(setSortBy('EBIDT'));
    
    const state = store.getState();
    expect(state.filters.sortBy).toBe('EBIDT');
  });

  test('should handle UI actions', () => {
    store.dispatch(setTheme('dark'));
    store.dispatch(addNotification({
      type: 'success',
      title: 'Test',
      message: 'Test message'
    }));
    
    const state = store.getState();
    expect(state.ui.theme).toBe('dark');
    expect(state.ui.notifications).toHaveLength(1);
    expect(state.ui.notifications[0].title).toBe('Test');
  });
});