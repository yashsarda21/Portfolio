import { useEffect, useRef, type RefObject } from "react";
import type { SoundName } from "@/shell/audio";
import { useArenaTransition } from "@/shell/transition";
import type { Timers } from "../engine/useTimers";

/**
 * The sounds and the phone's buzz still ahead on a shotlist, staged with `at(s, fn)` (runs `fn` at `s` seconds on the
 * point's clock): everything at or after `now` (s). The sounds play through `live`'s audio; the buzz is the phone's
 * only (a desktop has none).
 */
export function stageCues(
  list: { cues: readonly { at: number; sound: SoundName }[]; buzz: readonly number[] },
  now: number,
  at: (s: number, fn: () => void) => void,
  live: RefObject<{ audio: { play(n: SoundName): void }; desktop: boolean }>,
): void {
  for (const c of list.cues) if (c.at >= now) at(c.at, () => live.current.audio.play(c.sound));
  const buzz = () => {
    if (!live.current.desktop) navigator.vibrate?.(15);
  };
  for (const b of list.buzz) if (b >= now) at(b, buzz);
}

/**
 * The first rally: it begins (`begin`) `firstMs` after the scene shows (`ready`) and the page's wipe is done (m-7). If
 * the wipe is still running when the scene shows, it waits for it. Leaving (or `ready` going false) clears the timers.
 * Pass a `begin` that reads the latest state by ref: it is the one from the render `ready` came true in.
 */
export function useFirstPlay({
  ready,
  firstMs,
  begin,
  timers,
}: {
  ready: boolean;
  firstMs: number;
  begin: () => void;
  timers: Timers;
}): void {
  const { busy } = useArenaTransition();
  const busyRef = useRef(busy);
  const waitingForPage = useRef(false);
  useEffect(() => {
    busyRef.current = busy;
    if (busy || !waitingForPage.current) return;
    waitingForPage.current = false;
    timers.after(firstMs, begin);
    // Its handlers are the latest by ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [busy]);
  useEffect(() => {
    if (!ready) return;
    if (busyRef.current) waitingForPage.current = true;
    else timers.after(firstMs, begin);
    return () => {
      timers.clear();
      waitingForPage.current = false;
    };
    // Its handlers are the latest by ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);
}

/**
 * Tells the game when the tab is hidden and when it is visible again (nothing is played while hidden: timers still fire
 * there). Pass handlers that read the latest state by ref: the ones from the first render are the ones kept.
 */
export function useHiddenTab({
  onHidden,
  onVisible,
}: {
  onHidden: () => void;
  onVisible: () => void;
}): void {
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState === "hidden") onHidden();
      else onVisible();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
    // Its handlers are the latest by ref.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);
}
