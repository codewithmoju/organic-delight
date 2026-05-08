import { useCallback, useRef } from 'react';
import { toast } from 'sonner';

interface OptimisticMutationOptions<T> {
  /** Get current data snapshot */
  getData: () => T;
  /** Set data (optimistic apply or rollback) */
  setData: (data: T) => void;
  /** Optional custom error message */
  errorMessage?: string;
  /** Optional success message */
  successMessage?: string;
  /** Called after successful API call */
  onSuccess?: () => void;
  /** Called after failed API call (after rollback) */
  onError?: (error: Error) => void;
}

/**
 * Generic optimistic mutation hook.
 *
 * Pattern: snapshot → apply optimistic → await API → rollback on error.
 *
 * Usage:
 * ```ts
 * const { mutate } = useOptimisticMutation({
 *   getData: () => items,
 *   setData: setItems,
 *   successMessage: 'Item deleted',
 * });
 *
 * // In handler:
 * mutate(
 *   (current) => current.filter(i => i.id !== id),  // optimistic
 *   () => deleteItem(id),                             // API call
 * );
 * ```
 */
export function useOptimisticMutation<T>(options: OptimisticMutationOptions<T>) {
  const optionsRef = useRef(options);
  optionsRef.current = options;

  const mutate = useCallback(async (
    applyOptimistic: (current: T) => T,
    apiCall: () => Promise<void>,
    overrides?: {
      successMessage?: string;
      errorMessage?: string;
      onSuccess?: () => void;
      onError?: (error: Error) => void;
    }
  ) => {
    const { getData, setData, successMessage, errorMessage, onSuccess, onError } = optionsRef.current;

    // Snapshot
    const snapshot = getData();

    // Apply optimistic update
    setData(applyOptimistic(snapshot));

    // Show success toast immediately
    const msg = overrides?.successMessage ?? successMessage;
    if (msg) toast.success(msg);

    try {
      await apiCall();
      overrides?.onSuccess?.();
      onSuccess?.();
    } catch (error: any) {
      // Rollback
      setData(snapshot);

      const errMsg = overrides?.errorMessage ?? errorMessage;
      toast.error(errMsg || error.message || 'Operation failed');
      overrides?.onError?.(error);
      onError?.(error);
    }
  }, []);

  return { mutate };
}
