import { useCallback, useEffect, useRef, useState } from "react";

type CopyState = "idle" | "copied" | "fallback";

/** How long "LINK COPIED" stays up. */
const COPIED_MS = 2000;

/**
 * Copy-to-clipboard with a way out. `copied` shows for two seconds, then goes back to idle. When the
 * clipboard is missing or refuses (no permission, an insecure page, an old browser) the state is
 * `fallback` and stays so: the page then shows the link in a field for the visitor to copy by hand.
 * `message` is the line for the current state (the row's status, which is also what screen readers hear).
 */
export function useCopyLink(url: string, copy: { done: string; fallback: string }) {
  const [state, setState] = useState<CopyState>("idle");
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const run = useCallback(async () => {
    clearTimeout(timer.current);
    try {
      // Missing (insecure context, old browser) and refused are the same to the visitor.
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(url);
    } catch {
      setState("fallback");
      return;
    }
    setState("copied");
    timer.current = setTimeout(() => setState("idle"), COPIED_MS);
  }, [url]);

  const message = state === "copied" ? copy.done : state === "fallback" ? copy.fallback : undefined;
  return { state, copy: run, message };
}
