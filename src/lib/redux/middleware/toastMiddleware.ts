import { Middleware } from '@reduxjs/toolkit';
import ToastService from '@/lib/toast';

// Define types for actions
interface ReduxAction {
  type: string;
  payload?: any;
  error?: { message: string };
  meta?: { arg: any };
}

// Actions that are handled manually by components or toastActions (to avoid duplicate toasts)
const COMPONENT_HANDLED_ACTIONS = new Set([
  'companies/saveCompany',
  'companies/updateCompany',
  'companies/deleteCompany', // Handled by component
  'companies/bulkDeleteCompanies', // Handled by component
  'companies/importCompanyData',
  'companies/importCompanyDataFromJSON',
  'companies/importCompaniesWithProcessing', // Handled by component
  'companies/mergeCompanies',
  'portfolios/savePortfolio',
  'portfolios/addTransaction',
  'watchlists/saveWatchlist',
  'watchlists/addStockToWatchlist',
  'watchlists/removeStockFromWatchlist',
  'watchlists/updateStockPrices',
  'nseCompanies/uploadCSV',
  'nseCompanies/clear'
]);

// Define toast messages for different operations
const TOAST_MESSAGES = {
  // Company operations (excluding manually handled ones)
  // Delete operations are now handled by components



  // Portfolio operations (excluding manually handled ones)
  'portfolios/deletePortfolio/pending': 'Deleting portfolio...',
  'portfolios/deletePortfolio/fulfilled': 'Portfolio deleted successfully!',
  'portfolios/deletePortfolio/rejected': (action: ReduxAction) => `Failed to delete portfolio: ${action.error?.message || 'Unknown error'}`,



  // Watchlist operations (excluding manually handled ones)
  'watchlists/deleteWatchlist/pending': 'Deleting watchlist...',
  'watchlists/deleteWatchlist/fulfilled': 'Watchlist deleted successfully!',
  'watchlists/deleteWatchlist/rejected': (action: ReduxAction) => `Failed to delete watchlist: ${action.error?.message || 'Unknown error'}`,



  // NSE Companies operations are handled by toastActions
};

// Track loading toasts to dismiss them when operations complete
const loadingToasts = new Map<string, string>();

export const toastMiddleware: Middleware = (_store) => (next) => (action) => {
  const result = next(action);
  const reduxAction = action as ReduxAction;

  // Handle async thunk actions
  if (reduxAction.type && typeof reduxAction.type === 'string') {
    // Skip actions that are handled manually by components
    const baseActionType = reduxAction.type.replace(/\/(pending|fulfilled|rejected)$/, '');
    if (COMPONENT_HANDLED_ACTIONS.has(baseActionType)) {
      return result;
    }

    const actionType = reduxAction.type as keyof typeof TOAST_MESSAGES;
    const messageConfig = TOAST_MESSAGES[actionType];

    if (messageConfig) {
      if (reduxAction.type.endsWith('/pending')) {
        // Show loading toast
        const message = typeof messageConfig === 'function' ? messageConfig(reduxAction) : messageConfig;
        const toastId = ToastService.loading(message);
        loadingToasts.set(reduxAction.type.replace('/pending', ''), String(toastId));
      } else if (reduxAction.type.endsWith('/fulfilled')) {
        // Dismiss loading toast and show success
        const baseType = reduxAction.type.replace('/fulfilled', '');
        const loadingToastId = loadingToasts.get(baseType);
        if (loadingToastId) {
          ToastService.dismiss(loadingToastId);
          loadingToasts.delete(baseType);
        }

        const message = typeof messageConfig === 'function' ? messageConfig(reduxAction) : messageConfig;
        ToastService.success(message);
      } else if (reduxAction.type.endsWith('/rejected')) {
        // Dismiss loading toast and show error
        const baseType = reduxAction.type.replace('/rejected', '');
        const loadingToastId = loadingToasts.get(baseType);
        if (loadingToastId) {
          ToastService.dismiss(loadingToastId);
          loadingToasts.delete(baseType);
        }

        const message = typeof messageConfig === 'function' ? messageConfig(reduxAction) : messageConfig;
        ToastService.error(message);
      }
    }

    // Handle special cases for progress toasts (NSE upload is handled by toastActions)
    // Bulk delete operations are now handled by components
  }

  return result;
};

// Helper function to show validation warnings
export const showValidationWarning = (message: string, details?: string) => {
  ToastService.warning(message, { duration: 6000 });
  if (details) {
    setTimeout(() => {
      ToastService.info(details, { duration: 8000 });
    }, 1000);
  }
};

// Helper function to show data quality warnings
export const showDataQualityWarning = (companyName: string, issues: string[]) => {
  const message = `Data quality issues found for "${companyName}": ${issues.join(', ')}`;
  ToastService.warning(message, { duration: 6000 });
};

// Helper function for batch operations
export const showBatchOperationToast = (
  operationName: string,
  operations: Array<() => Promise<any>>,
  onComplete?: (results: any[]) => void
) => {
  const batchOperations = operations.map((operation, index) => ({
    operation,
    successMessage: `${operationName} ${index + 1} completed`,
    errorMessage: `${operationName} ${index + 1} failed`
  }));

  return ToastService.batch(batchOperations, operationName).then((results) => {
    if (onComplete) {
      onComplete(results);
    }
    return results;
  });
};

export default toastMiddleware;