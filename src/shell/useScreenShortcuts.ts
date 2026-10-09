import { useEffect, useRef } from "react";

/** Somewhere text is typed: a key there is a letter, never a shortcut. */
const TYPING = "input, textarea, select, [contenteditable]:not([contenteditable='false'])";
/** Controls that do their own job on Space / Enter. */
const CONTROLS = "a, button, [role=button]";

const closest = (el: EventTarget | null, selector: string) =>
  el instanceof Element && el.closest(selector) !== null;

/** True when `el` is, or sits inside, a field, a textarea, a select or an editable region. */
export const isTypingTarget = (el: EventTarget | null) => closest(el, TYPING);

/** True when `el` is, or sits inside, a link, a button or a `[role=button]` (Space / Enter act on it). */
export const isControlTarget = (el: EventTarget | null) => closest(el, CONTROLS);

/** Keys that mean something on these already (Enter on a link, typing in a field): a shortcut stays out. */
const OWN_KEYS = `${TYPING}, ${CONTROLS}, [role=tab]`;

/**
 * Keyboard shortcuts for one screen (spec A8, L9). `map` is keyed by `event.key` lowercased ("enter", "q").
 * A key is ignored when something already handled it, with Ctrl / Cmd / Alt held, when the focus is on a
 * link, button, field or tab, or when `enabled` is false. They live only while the screen is mounted.
 */
export function useScreenShortcuts(
  map: Record<string, () => void>,
  { enabled }: { enabled: boolean },
): void {
  const latest = useRef(map);
  useEffect(() => {
    latest.current = map;
  });

  useEffect(() => {
    if (!enabled) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.defaultPrevented || e.repeat || e.ctrlKey || e.metaKey || e.altKey) return;
      if (closest(e.target, OWN_KEYS)) return;
      const action = latest.current[e.key.toLowerCase()];
      if (!action) return;
      action();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
