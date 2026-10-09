import { useEffect, useRef } from "react";
import { isControlTarget, isTypingTarget } from "@/shell/useScreenShortcuts";

type Handlers = Record<string, (e: KeyboardEvent) => void>;

/**
 * Game keys (G3, A8), keyed by `event.key` (`" "`, `"Enter"`, `"ArrowLeft"`, `"ArrowRight"`). They listen on
 * `window` only while `active` (the game is waiting for an input). A key is ignored in a field, with Ctrl / Cmd / Alt
 * held, and, for Space and Enter, when the focus is on a link or a button, which does its own job. A key that is
 * handled has its default prevented (Space must not scroll), a held key's repeats included; the repeats call nothing.
 */
export function useGameKeys(
  { down, up }: { down?: Handlers; up?: Handlers },
  { active }: { active: boolean },
): void {
  const latest = useRef({ down, up });
  useEffect(() => {
    latest.current = { down, up };
  });

  useEffect(() => {
    if (!active) return;
    const handle = (e: KeyboardEvent, map: Handlers | undefined, repeats: boolean) => {
      const action = map?.[e.key];
      if (!action || e.defaultPrevented) return;
      if (e.ctrlKey || e.metaKey || e.altKey || isTypingTarget(e.target)) return;
      if ((e.key === " " || e.key === "Enter") && isControlTarget(e.target)) return;
      e.preventDefault();
      if (!e.repeat || repeats) action(e);
    };
    const onDown = (e: KeyboardEvent) => handle(e, latest.current.down, false);
    const onUp = (e: KeyboardEvent) => handle(e, latest.current.up, true);
    window.addEventListener("keydown", onDown);
    window.addEventListener("keyup", onUp);
    return () => {
      window.removeEventListener("keydown", onDown);
      window.removeEventListener("keyup", onUp);
    };
  }, [active]);
}
