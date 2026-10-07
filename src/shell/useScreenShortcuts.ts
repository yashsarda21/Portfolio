import { useEffect, useRef } from "react";

/** Keys that mean something on these already (Enter on a link, typing in a field): a shortcut stays out. */
const OWN_KEYS =
  "input, textarea, select, [contenteditable]:not([contenteditable='false']), a, button, [role=button], [role=tab]";

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
      if (e.target instanceof Element && e.target.closest(OWN_KEYS)) return;
      const action = latest.current[e.key.toLowerCase()];
      if (!action) return;
      action();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [enabled]);
}
