import { AppDispatch } from '../store';
import ToastService from '@/lib/toast';
import { 
  saveCompany, 
  deleteCompany, 
  bulkDeleteCompanies, 
  updateCompany, 
  importCompanyData,
  mergeCompanies
} from '../slices/companiesSlice';
import { 
  savePortfolio, 
  deletePortfolio, 
  addTransaction 
} from '../slices/portfoliosSlice';
import { 
  saveWatchlist, 
  deleteWatchlist, 
  addSymbolToWatchlist, 
  removeSymbolFromWatchlist 
} from '../slices/watchlistsSlice';
import { 
  uploadNSECompaniesCSV, 
  clearNSECompanies 
} from '../slices/nseCompaniesSlice';
import { CompanyFinancials, Portfolio, Watchlist, Transaction } from '@/types';

// Company Actions with Toast
export const createCompanyWithToast = (company: CompanyFinancials) => 
  async (dispatch: AppDispatch) => {
    return ToastService.promise(
      dispatch(saveCompany(company)).unwrap(),
      {
        loading: 'Creating company...',
        success: `Company "${company.company}" created successfully!`,
        error: 'Failed to create company'
      }
    );
  };

export const updateCompanyWithToast = (company: CompanyFinancials) => 
  async (dispatch: AppDispatch) => {
    return ToastService.promise(
      dispatch(updateCompany(company)).unwrap(),
      {
        loading: 'Updating company...',
        success: `Company "${company.company}" updated successfully!`,
        error: 'Failed to update company'
      }
    );
  };

export const deleteCompanyWithToast = (id: string, companyName?: string) => 
  async (dispatch: AppDispatch) => {
    return ToastService.promise(
      dispatch(deleteCompany(id)).unwrap(),
      {
        loading: 'Deleting company...',
        success: companyName 
          ? `Company "${companyName}" deleted successfully!`
          : 'Company deleted successfully!',
        error: 'Failed to delete company'
      }
    );
  };

export const bulkDeleteCompaniesWithToast = (ids: string[]) => 
  async (dispatch: AppDispatch) => {
    const count = ids.length;
    return ToastService.promise(
      dispatch(bulkDeleteCompanies(ids)).unwrap(),
      {
        loading: `Deleting ${count} companies...`,
        success: `Successfully deleted ${count} companies!`,
        error: 'Failed to delete companies'
      }
    );
  };

export const importCompanyWithToast = (company: CompanyFinancials) => 
  async (dispatch: AppDispatch) => {
    return ToastService.promise(
      dispatch(importCompanyData(company)).unwrap(),
      {
        loading: 'Importing company data...',
        success: `Company "${company.company}" imported successfully!`,
        error: 'Failed to import company data'
      }
    );
  };

export const mergeCompaniesWithToast = (primaryId: string, duplicateIds: string[]) => 
  async (dispatch: AppDispatch) => {
    return ToastService.promise(
      dispatch(mergeCompanies({ primaryId, duplicateIds })).unwrap(),
      {
        loading: 'Merging duplicate companies...',
        success: `Successfully merged ${duplicateIds.length} duplicate companies!`,
        error: 'Failed to merge companies'
      }
    );
  };

// Portfolio Actions with Toast
export const createPortfolioWithToast = (portfolio: Portfolio) => 
  async (dispatch: AppDispatch) => {
    return ToastService.promise(
      dispatch(savePortfolio(portfolio)).unwrap(),
      {
        loading: 'Creating portfolio...',
        success: `Portfolio "${portfolio.name}" created successfully!`,
        error: 'Failed to create portfolio'
      }
    );
  };

export const updatePortfolioWithToast = (portfolio: Portfolio) => 
  async (dispatch: AppDispatch) => {
    return ToastService.promise(
      dispatch(savePortfolio(portfolio)).unwrap(),
      {
        loading: 'Updating portfolio...',
        success: `Portfolio "${portfolio.name}" updated successfully!`,
        error: 'Failed to update portfolio'
      }
    );
  };

export const deletePortfolioWithToast = (id: string, portfolioName?: string) => 
  async (dispatch: AppDispatch) => {
    return ToastService.promise(
      dispatch(deletePortfolio(id)).unwrap(),
      {
        loading: 'Deleting portfolio...',
        success: portfolioName 
          ? `Portfolio "${portfolioName}" deleted successfully!`
          : 'Portfolio deleted successfully!',
        error: 'Failed to delete portfolio'
      }
    );
  };

export const addTransactionWithToast = (portfolioId: string, transaction: Transaction) => 
  async (dispatch: AppDispatch) => {
    return ToastService.promise(
      dispatch(addTransaction({ portfolioId, transaction })).unwrap(),
      {
        loading: 'Adding transaction...',
        success: `Transaction for ${transaction.symbol} added successfully!`,
        error: 'Failed to add transaction'
      }
    );
  };

// Watchlist Actions with Toast
export const createWatchlistWithToast = (watchlist: Watchlist) => 
  async (dispatch: AppDispatch) => {
    return ToastService.promise(
      dispatch(saveWatchlist(watchlist)).unwrap(),
      {
        loading: 'Creating watchlist...',
        success: `Watchlist "${watchlist.name}" created successfully!`,
        error: 'Failed to create watchlist'
      }
    );
  };

export const updateWatchlistWithToast = (watchlist: Watchlist) => 
  async (dispatch: AppDispatch) => {
    return ToastService.promise(
      dispatch(saveWatchlist(watchlist)).unwrap(),
      {
        loading: 'Updating watchlist...',
        success: `Watchlist "${watchlist.name}" updated successfully!`,
        error: 'Failed to update watchlist'
      }
    );
  };

export const deleteWatchlistWithToast = (id: string, watchlistName?: string) => 
  async (dispatch: AppDispatch) => {
    return ToastService.promise(
      dispatch(deleteWatchlist(id)).unwrap(),
      {
        loading: 'Deleting watchlist...',
        success: watchlistName 
          ? `Watchlist "${watchlistName}" deleted successfully!`
          : 'Watchlist deleted successfully!',
        error: 'Failed to delete watchlist'
      }
    );
  };

export const addSymbolToWatchlistWithToast = (watchlistId: string, symbol: string) => 
  async (dispatch: AppDispatch) => {
    return ToastService.promise(
      dispatch(addSymbolToWatchlist({ watchlistId, symbol })).unwrap(),
      {
        loading: 'Adding symbol to watchlist...',
        success: `Symbol "${symbol}" added to watchlist successfully!`,
        error: 'Failed to add symbol to watchlist'
      }
    );
  };

export const removeSymbolFromWatchlistWithToast = (watchlistId: string, symbol: string) => 
  async (dispatch: AppDispatch) => {
    return ToastService.promise(
      dispatch(removeSymbolFromWatchlist({ watchlistId, symbol })).unwrap(),
      {
        loading: 'Removing symbol from watchlist...',
        success: `Symbol "${symbol}" removed from watchlist successfully!`,
        error: 'Failed to remove symbol from watchlist'
      }
    );
  };

// NSE Companies Actions with Toast
export const uploadNSECompaniesWithToast = (csvContent: string) => 
  async (dispatch: AppDispatch) => {
    const progressId = 'nse-upload';
    
    try {
      ToastService.progress(progressId, 'Uploading NSE companies', 0, 'Preparing to process CSV...');

      const result = await dispatch(uploadNSECompaniesCSV(csvContent)).unwrap();
      
      ToastService.completeProgress(progressId, `Successfully uploaded ${result.length} NSE companies!`);
      return result;
    } catch (error) {
      ToastService.failProgress(progressId, `Failed to upload CSV: ${error}`);
      throw error;
    }
  };

export const clearNSECompaniesWithToast = () => 
  async (dispatch: AppDispatch) => {
    return ToastService.promise(
      dispatch(clearNSECompanies()).unwrap(),
      {
        loading: 'Clearing NSE companies data...',
        success: 'NSE companies data cleared successfully!',
        error: 'Failed to clear NSE companies data'
      }
    );
  };

// Batch Operations with Progress
export const batchImportCompaniesWithToast = (companies: CompanyFinancials[]) => 
  async (dispatch: AppDispatch) => {
    const operations = companies.map(company => ({
      operation: () => dispatch(importCompanyData(company)).unwrap(),
      successMessage: `${company.company} imported`,
      errorMessage: `${company.company} failed`
    }));

    return ToastService.batch(operations, 'Company Import');
  };

// Simple validation helpers
export const showValidationError = (message: string) => {
  ToastService.error(message, { duration: 5000 });
};

export const showDataQualityWarning = (companyName: string, issues: string[]) => {
  const message = `Data quality issues found for "${companyName}": ${issues.join(', ')}`;
  ToastService.warning(message, { duration: 6000 });
};