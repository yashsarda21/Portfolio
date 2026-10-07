import { useCallback, useEffect, useRef, useState } from "react";

export type CopyState = "idle" | "copied" | "fallback";

/** How long "copied" stays up. */
const COPIED_MS = 2000;

/**
 * Copy-to-clipboard with a way out. `copied` shows for two seconds, then goes back to idle. When the
 * clipboard is missing or refuses (no permission, an insecure page, an old browser) the state is
 * `fallback` and stays so: the page then shows the text in a field for the visitor to copy by hand.
 * The hook holds no wording; the caller says what each state looks like and sounds like. Render the read-only field
 * that shows the text only in the `fallback` state, with `ref={field}`: it takes the focus with the text
 * selected as it appears, ready for Ctrl/Cmd+C.
 */
export function useCopyText<E extends HTMLInputElement | HTMLTextAreaElement = HTMLInputElement>() {
  const [state, setState] = useState<CopyState>("idle");
  // A callback ref: the field is only on the page in the fallback state, so it takes the focus as it arrives.
  const field = useCallback((el: E | null) => {
    el?.focus();
    el?.select();
  }, []);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  useEffect(() => () => clearTimeout(timer.current), []);

  const copy = useCallback(async (text: string) => {
    clearTimeout(timer.current);
    try {
      // Missing (insecure context, old browser) and refused are the same to the visitor.
      if (!navigator.clipboard) throw new Error("no clipboard");
      await navigator.clipboard.writeText(text);
    } catch {
      setState("fallback");
      return;
    }
    setState("copied");
    timer.current = setTimeout(() => setState("idle"), COPIED_MS);
  }, []);

  return { state, copy, field };
}
