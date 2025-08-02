import { toast } from 'sonner';

class ToastService {
  private static defaultDuration = 4000;
  private static progressToasts = new Map<string, string>();

  /**
   * Show a success toast notification
   */
  static success(message: string, options?: { duration?: number }) {
    return toast.success(message, {
      duration: options?.duration ?? this.defaultDuration,
    });
  }

  /**
   * Show an error toast notification
   */
  static error(message: string, options?: { duration?: number }) {
    return toast.error(message, {
      duration: options?.duration ?? this.defaultDuration,
    });
  }

  /**
   * Show a warning toast notification
   */
  static warning(message: string, options?: { duration?: number }) {
    return toast.warning(message, {
      duration: options?.duration ?? this.defaultDuration,
    });
  }

  /**
   * Show an info toast notification
   */
  static info(message: string, options?: { duration?: number }) {
    return toast.info(message, {
      duration: options?.duration ?? this.defaultDuration,
    });
  }

  /**
   * Show a loading toast notification
   */
  static loading(message: string) {
    return toast.loading(message);
  }

  /**
   * Show a progress toast notification for bulk operations
   */
  static progress(id: string, message: string, progress: number, description?: string) {
    const progressMessage = `${message} (${Math.round(progress)}%)`;

    if (this.progressToasts.has(id)) {
      // Update existing progress toast
      const toastId = this.progressToasts.get(id)!;
      toast.loading(progressMessage, {
        id: toastId,
        description,
      });
    } else {
      // Create new progress toast
      const toastId = toast.loading(progressMessage, {
        description,
      });
      this.progressToasts.set(id, String(toastId));
    }

    // Auto-complete when progress reaches 100%
    if (progress >= 100) {
      setTimeout(() => {
        this.completeProgress(id, `${message} completed successfully!`);
      }, 500);
    }
  }

  /**
   * Complete a progress toast and show success message
   */
  static completeProgress(id: string, successMessage?: string) {
    if (this.progressToasts.has(id)) {
      const toastId = this.progressToasts.get(id)!;
      toast.dismiss(toastId);
      this.progressToasts.delete(id);

      if (successMessage) {
        this.success(successMessage);
      }
    }
  }

  /**
   * Fail a progress toast and show error message
   */
  static failProgress(id: string, errorMessage: string) {
    if (this.progressToasts.has(id)) {
      const toastId = this.progressToasts.get(id)!;
      toast.dismiss(toastId);
      this.progressToasts.delete(id);
      this.error(errorMessage);
    }
  }

  /**
   * Dismiss a specific toast by ID
   */
  static dismiss(toastId?: string) {
    toast.dismiss(toastId);
  }

  /**
   * Dismiss all toasts
   */
  static dismissAll() {
    toast.dismiss();
    this.progressToasts.clear();
  }

  /**
   * Promise-based toast for async operations
   */
  static promise<T>(
    promise: Promise<T>,
    messages: {
      loading: string;
      success: string | ((data: T) => string);
      error: string | ((error: any) => string);
    }
  ) {
    return toast.promise(promise, messages);
  }

  /**
   * Batch operation toast helper
   */
  static async batch(
    operations: Array<{
      operation: () => Promise<any>;
      successMessage: string;
      errorMessage: string;
    }>,
    batchName: string
  ) {
    const progressId = `batch-${Date.now()}`;
    let completed = 0;
    const total = operations.length;

    this.progress(progressId, `Processing ${batchName}`, 0, `0 of ${total} completed`);

    const results = [];

    for (const { operation, successMessage, errorMessage } of operations) {
      try {
        await operation();
        completed++;
        const progress = (completed / total) * 100;
        this.progress(progressId, `Processing ${batchName}`, progress, `${completed} of ${total} completed`);
        results.push({ success: true, message: successMessage });
      } catch (error) {
        completed++;
        const progress = (completed / total) * 100;
        this.progress(progressId, `Processing ${batchName}`, progress, `${completed} of ${total} completed (${total - completed} failed)`);
        results.push({ success: false, message: errorMessage, error });
      }
    }

    const successful = results.filter(r => r.success).length;
    const failed = results.filter(r => !r.success).length;

    if (failed === 0) {
      this.completeProgress(progressId, `${batchName} completed successfully! ${successful} items processed.`);
    } else if (successful === 0) {
      this.failProgress(progressId, `${batchName} failed! All ${failed} items failed to process.`);
    } else {
      this.completeProgress(progressId);
      this.warning(`${batchName} completed with mixed results: ${successful} successful, ${failed} failed.`);
    }

    return results;
  }
}

export default ToastService;