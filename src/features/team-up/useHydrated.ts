import { useSyncExternalStore } from "react";

const subscribe = () => () => {};

/**
 * False in the prerendered HTML and until React has taken over, true after. Lets a form rely on the browser's
 * own checks when scripts have not run (no JavaScript, or not loaded yet) and on its own once they have.
 */
export function useHydrated(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => true,
    () => false,
  );
}
