import { useCallback, useEffect, useRef } from "react";
import { useAudio } from "./audio";
import { cueEnd, type ShowCue } from "./showSound";

/** What counts as a gesture to a browser's autoplay rules (a touch ends, a press goes down, a key goes down, a click). */
const GESTURES = ["pointerdown", "keydown", "touchend", "click"] as const;

/** True where the browser lets a page make sound with no gesture at all (Firefox can be set so; Chrome and Safari have no such answer). */
function autoplayAllowed(): boolean {
  try {
    const nav = navigator as Navigator & { getAutoplayPolicy?: (type: string) => string };
    return nav.getAutoplayPolicy?.("audiocontext") === "allowed";
  } catch {
    return false;
  }
}

/**
 * The sound of a show, for a screen that plays one (the Home's cheer, the Intro). Browsers allow no sound before a
 * gesture, so a show is `arm`ed with its own zero (`startAt`, a `performance.now()` moment) and plays:
 *  1. at once, when sound is already unlocked in this page session (the visitor clicked inside the site);
 *  2. else at once, where the browser allows autoplay;
 *  3. else on the visitor's first gesture, joining where the show has got to (a clunk already past is skipped, the crowd
 *     joins the swell). Nothing plays if the show is over by then, or if sound is saved as off.
 * The recordings are fetched as soon as the screen mounts, so they are ready for whichever comes first. Leaving the
 * screen drops the waiting listeners and fades a playing show out.
 */
export function useShowSound(): { arm: (schedule: readonly ShowCue[], startAt?: number) => void } {
  const audio = useAudio();
  const latest = useRef(audio);
  useEffect(() => {
    latest.current = audio;
  });
  const disarm = useRef<(() => void) | null>(null);

  useEffect(() => {
    latest.current.prefetchShow();
    return () => {
      disarm.current?.();
      disarm.current = null;
      latest.current.stopShow(300);
    };
  }, []);

  const arm = useCallback((schedule: readonly ShowCue[], startAt: number = performance.now()) => {
    disarm.current?.();
    disarm.current = null;
    if (schedule.length === 0) return;
    let done = false;
    let stopWaiting = () => {};
    disarm.current = () => {
      done = true;
      stopWaiting();
    };
    const play = () => latest.current.playShow(schedule, startAt);
    // After the screen's other mount effects, so the saved mute has been read before anything is unlocked.
    queueMicrotask(() => {
      if (done) return;
      const api = latest.current;
      if (api.unlocked) return play();
      if (autoplayAllowed()) {
        api.unlock();
        return play();
      }
      const onGesture = () => {
        stopWaiting();
        latest.current.unlock();
        play();
      };
      const left = Math.max(...schedule.map(cueEnd)) * 1000 - (performance.now() - startAt);
      if (left <= 0) return;
      const timer = window.setTimeout(() => stopWaiting(), left);
      stopWaiting = () => {
        window.clearTimeout(timer);
        for (const gesture of GESTURES) document.removeEventListener(gesture, onGesture, true);
      };
      for (const gesture of GESTURES)
        document.addEventListener(gesture, onGesture, { capture: true, passive: true });
    });
  }, []);

  return { arm };
}
