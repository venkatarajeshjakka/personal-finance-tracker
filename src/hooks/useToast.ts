import { useCallback } from 'react';
import ToastService from '@/lib/toast';

/**
 * Custom hook for toast notifications with simple patterns
 */
export const useToast = () => {
  // Basic toast methods
  const success = useCallback((message: string, options?: { duration?: number }) => {
    return ToastService.success(message, options);
  }, []);

  const error = useCallback((message: string, options?: { duration?: number }) => {
    return ToastService.error(message, options);
  }, []);

  const warning = useCallback((message: string, options?: { duration?: number }) => {
    return ToastService.warning(message, options);
  }, []);

  const info = useCallback((message: string, options?: { duration?: number }) => {
    return ToastService.info(message, options);
  }, []);

  const loading = useCallback((message: string) => {
    return ToastService.loading(message);
  }, []);

  // Promise-based toast for async operations
  const promise = useCallback(<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) => {
    return ToastService.promise(promise, messages);
  }, []);

  // Dismiss methods
  const dismiss = useCallback((toastId?: string) => {
    ToastService.dismiss(toastId);
  }, []);

  const dismissAll = useCallback(() => {
    ToastService.dismissAll();
  }, []);

  // Simple validation helpers
  const validation = {
    error: (field: string, message: string) => {
      error(`${field}: ${message}`, { duration: 5000 });
    },
    
    multipleErrors: (errors: Array<{ field: string; message: string }>) => {
      const errorMessage = `Validation failed: ${errors.map(e => `${e.field} - ${e.message}`).join(', ')}`;
      error(errorMessage, { duration: 7000 });
    }
  };

  // Simple data quality helpers
  const dataQuality = {
    warning: (entityName: string, issues: string[]) => {
      const message = `Data quality issues for "${entityName}": ${issues.join(', ')}`;
      warning(message, { duration: 6000 });
    }
  };

  // Simple progress helpers
  const progress = {
    start: (id: string, message: string, description?: string) => {
      ToastService.progress(id, message, 0, description);
    },
    
    update: (id: string, message: string, progress: number, description?: string) => {
      ToastService.progress(id, message, progress, description);
    },
    
    complete: (id: string, successMessage?: string) => {
      ToastService.completeProgress(id, successMessage);
    },
    
    fail: (id: string, errorMessage: string) => {
      ToastService.failProgress(id, errorMessage);
    }
  };

  return {
    // Basic methods
    success,
    error,
    warning,
    info,
    loading,
    promise,
    dismiss,
    dismissAll,
    
    // Helper patterns
    validation,
    dataQuality,
    progress
  };
};

export default useToast;