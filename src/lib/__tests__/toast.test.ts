import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import ToastService from '../toast';

// Mock the sonner library
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(() => 'success-toast-id'),
    error: vi.fn(() => 'error-toast-id'),
    warning: vi.fn(() => 'warning-toast-id'),
    info: vi.fn(() => 'info-toast-id'),
    loading: vi.fn(() => 'loading-toast-id'),
    dismiss: vi.fn(),
    promise: vi.fn()
  }
}));

import { toast } from 'sonner';

describe('ToastService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    ToastService.dismissAll();
  });

  describe('Basic toast methods', () => {
    it('should show success toast', () => {
      const message = 'Operation successful';
      const result = ToastService.success(message);

      expect(toast.success).toHaveBeenCalledWith(message, {
        duration: 4000,
        dismissible: true,
        action: undefined,
        cancel: undefined,
        onDismiss: undefined,
        onAutoClose: undefined
      });
      expect(result).toBe('success-toast-id');
    });

    it('should show error toast', () => {
      const message = 'Operation failed';
      const result = ToastService.error(message);

      expect(toast.error).toHaveBeenCalledWith(message, {
        duration: 4000,
        dismissible: true,
        action: undefined,
        cancel: undefined,
        onDismiss: undefined,
        onAutoClose: undefined
      });
      expect(result).toBe('error-toast-id');
    });

    it('should show warning toast', () => {
      const message = 'Warning message';
      const result = ToastService.warning(message);

      expect(toast.warning).toHaveBeenCalledWith(message, {
        duration: 4000,
        dismissible: true,
        action: undefined,
        cancel: undefined,
        onDismiss: undefined,
        onAutoClose: undefined
      });
      expect(result).toBe('warning-toast-id');
    });

    it('should show info toast', () => {
      const message = 'Info message';
      const result = ToastService.info(message);

      expect(toast.info).toHaveBeenCalledWith(message, {
        duration: 4000,
        dismissible: true,
        action: undefined,
        cancel: undefined,
        onDismiss: undefined,
        onAutoClose: undefined
      });
      expect(result).toBe('info-toast-id');
    });

    it('should show loading toast with infinite duration', () => {
      const message = 'Loading...';
      const result = ToastService.loading(message);

      expect(toast.loading).toHaveBeenCalledWith(message, {
        duration: Infinity,
        dismissible: true,
        action: undefined,
        cancel: undefined,
        onDismiss: undefined,
        onAutoClose: undefined
      });
      expect(result).toBe('loading-toast-id');
    });
  });

  describe('Toast options', () => {
    it('should apply custom options', () => {
      const message = 'Custom toast';
      const options = {
        duration: 6000,
        dismissible: false,
        action: {
          label: 'Action',
          onClick: vi.fn()
        }
      };

      ToastService.success(message, options);

      expect(toast.success).toHaveBeenCalledWith(message, {
        duration: 6000,
        dismissible: false,
        action: options.action,
        cancel: undefined,
        onDismiss: undefined,
        onAutoClose: undefined
      });
    });
  });

  describe('Progress toasts', () => {
    it('should create new progress toast', () => {
      const id = 'test-progress';
      const message = 'Processing';
      const progress = 50;

      ToastService.progress(id, message, progress);

      expect(toast.loading).toHaveBeenCalledWith(
        'Processing (50%)',
        expect.objectContaining({
          duration: Infinity,
          dismissible: false
        })
      );
    });

    it('should complete progress toast at 100%', (done) => {
      const id = 'test-progress';
      const message = 'Processing';
      
      ToastService.progress(id, message, 100);

      // Should auto-complete after 500ms
      setTimeout(() => {
        expect(toast.dismiss).toHaveBeenCalled();
        done();
      }, 600);
    });

    it('should manually complete progress toast', () => {
      const id = 'test-progress';
      const successMessage = 'Completed successfully';

      // First create a progress toast
      ToastService.progress(id, 'Processing', 50);
      
      // Then complete it
      ToastService.completeProgress(id, successMessage);

      expect(toast.dismiss).toHaveBeenCalled();
      expect(toast.success).toHaveBeenCalledWith(successMessage, expect.any(Object));
    });

    it('should fail progress toast', () => {
      const id = 'test-progress';
      const errorMessage = 'Operation failed';

      // First create a progress toast
      ToastService.progress(id, 'Processing', 50);
      
      // Then fail it
      ToastService.failProgress(id, errorMessage);

      expect(toast.dismiss).toHaveBeenCalled();
      expect(toast.error).toHaveBeenCalledWith(errorMessage, expect.any(Object));
    });
  });

  describe('Promise toast', () => {
    it('should handle successful promise', async () => {
      const promise = Promise.resolve('success');
      const messages = {
        loading: 'Loading...',
        success: 'Success!',
        error: 'Error!'
      };

      ToastService.promise(promise, messages);

      expect(toast.promise).toHaveBeenCalledWith(promise, {
        loading: 'Loading...',
        success: 'Success!',
        error: 'Error!',
        duration: 4000,
        dismissible: true,
        action: undefined,
        cancel: undefined,
        onDismiss: undefined,
        onAutoClose: undefined
      });
    });
  });

  describe('Batch operations', () => {
    it('should handle batch operations', async () => {
      const operations = [
        {
          operation: () => Promise.resolve('result1'),
          successMessage: 'Operation 1 success',
          errorMessage: 'Operation 1 error'
        },
        {
          operation: () => Promise.resolve('result2'),
          successMessage: 'Operation 2 success',
          errorMessage: 'Operation 2 error'
        }
      ];

      const batchName = 'Test Batch';
      const results = await ToastService.batch(operations, batchName);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(true);
    });

    it('should handle mixed batch results', async () => {
      const operations = [
        {
          operation: () => Promise.resolve('result1'),
          successMessage: 'Operation 1 success',
          errorMessage: 'Operation 1 error'
        },
        {
          operation: () => Promise.reject(new Error('Failed')),
          successMessage: 'Operation 2 success',
          errorMessage: 'Operation 2 error'
        }
      ];

      const batchName = 'Test Batch';
      const results = await ToastService.batch(operations, batchName);

      expect(results).toHaveLength(2);
      expect(results[0].success).toBe(true);
      expect(results[1].success).toBe(false);
    });
  });

  describe('Dismiss methods', () => {
    it('should dismiss specific toast', () => {
      const toastId = 'specific-toast';
      ToastService.dismiss(toastId);

      expect(toast.dismiss).toHaveBeenCalledWith(toastId);
    });

    it('should dismiss all toasts', () => {
      ToastService.dismissAll();

      expect(toast.dismiss).toHaveBeenCalledWith();
    });
  });
});