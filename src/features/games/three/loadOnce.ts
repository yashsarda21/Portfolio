/**
 * A download kept for the visit once started (cycle 1 spec §6.2): a rematch or coming back is instant, and coming back
 * while it is still running joins it rather than starting it again. A failed one is forgotten, so the next visit tries
 * again. Progress goes to the latest caller waiting on it.
 */
export function loadOnce<T>(start: (onProgress: (fraction: number) => void) => Promise<T>) {
  let pending: Promise<T> | null = null;
  let progressTo: (fraction: number) => void = () => {};
  return (onProgress: (fraction: number) => void): Promise<T> => {
    progressTo = onProgress;
    pending ??= start((fraction) => progressTo(fraction)).catch((error: unknown) => {
      pending = null;
      throw error;
    });
    return pending;
  };
}
