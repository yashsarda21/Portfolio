import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { content, ui } from "@/content";
import { MEDIA } from "@/lib/breakpoints";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { prefetchGsap } from "@/lib/motion";
import { safeStorage } from "@/lib/storage";
import { useAudio } from "@/shell/audio";
import { useCommentary } from "@/shell/commentary";
import { LANDING_SEEN_KEY } from "@/shell/headFlags";
import { showSchedule } from "@/shell/showSound";
import { ROUTES } from "@/shell/routes";
import { useArenaTransition } from "@/shell/transition";
import { useScreenShortcuts } from "@/shell/useScreenShortcuts";
import { RIG_STRIPS } from "@/assets/rig";
import { LANDING_BEATS, bootElapsedMs, bootIsHeld, landingPace } from "./beats";
import { LandingPage } from "./LandingPage";
import { prefetchRig } from "./prefetchRig";
import { StartScreen } from "./StartScreen";
import { buildLandingView } from "./view";

const view = buildLandingView(content, ui, ROUTES);

/**
 * True once this page session has played the whole boot (set when the commentary line is due, the last beat).
 * Coming back to the Landing in the same session (back button, a logo link) then gets the cut-down, like a
 * return visit. Set that late so a strict-mode double mount can never trip it.
 */
let bootPlayed = false;

/**
 * The route's screen: marks the visit, says the entrance line at its beat, wires the shortcuts, warms the intro,
 * and plays the show's sound. A first visit meets the start screen, which holds the boot until a button is pressed
 * (the click is also what lets the browser play sound); a return visit has no start screen and boots fast, with
 * the crowd only if sound is already unlocked in this page session.
 */
export function LandingScreen() {
  const { say } = useCommentary();
  const audio = useAudio();
  const { go } = useArenaTransition();
  const desktop = useMediaQuery(MEDIA.lg);
  // Only known after hydration (the prerendered page has no flags), so it starts false and the CSS shows the screen meanwhile.
  const [holding, setHolding] = useState(false);
  const latest = useRef({ audio, desktop });
  useEffect(() => {
    latest.current = { audio, desktop };
  });

  // Before paint, so the animations start at the quick pace (the head script only knows about earlier visits).
  useLayoutEffect(() => {
    if (typeof window !== "undefined" && bootPlayed)
      document.documentElement.setAttribute("data-return-visit", "");
    // Deliberate: the page's flags are an external store, read once after mount so hydration stays identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setHolding(bootIsHeld());
  }, []);

  // A return visit (fast, silent) lets the cheer play when sound is already unlocked in this page session.
  useEffect(() => {
    const root = document.documentElement;
    const { audio: sound, desktop: stage } = latest.current;
    if (root.hasAttribute("data-return-visit") && sound.unlocked) {
      const pace = landingPace();
      sound.playShow(
        showSchedule("landing", { tier: stage ? "desktop" : "mobile", pace, firstShow: false }),
        performance.now() - bootElapsedMs(),
      );
    }
    // Leaving the Landing ends its sound.
    return () => latest.current.audio.stopShow(300);
  }, []);

  // The start screen going away is an arrival, like a route change: focus goes to the page's name (the rendered h1),
  // after the page behind has been opened again (the screen's own effect cleans up first).
  const wasHolding = useRef(false);
  useEffect(() => {
    if (holding) {
      wasHolding.current = true;
      return;
    }
    if (!wasHolding.current) return;
    wasHolding.current = false;
    const heading = [...document.querySelectorAll<HTMLElement>("main h1")].find(
      (h) => h.getClientRects().length > 0,
    );
    heading?.setAttribute("tabindex", "-1");
    heading?.focus({ preventScroll: true });
  }, [holding]);

  /** KICK OFF: the boot starts (CSS lets go of it), and the show's sound with it when the visitor chose sound. */
  const begin = useCallback(
    (withSound: boolean) => {
      const startAt = performance.now();
      document.documentElement.setAttribute("data-started", "");
      setHolding(false);
      if (!withSound) {
        if (audio.enabled) audio.toggle();
        return;
      }
      // Turning the sound on is itself the gesture that unlocks it; otherwise this click does.
      if (audio.enabled) audio.unlock();
      else audio.toggle();
      audio.playShow(
        showSchedule("landing", {
          tier: desktop ? "desktop" : "mobile",
          pace: landingPace(),
          firstShow: true,
        }),
        startAt,
      );
    },
    [audio, desktop],
  );

  useEffect(() => {
    // Seen: the next visit plays the cut-down (the head script reads this before first paint).
    safeStorage.set(LANDING_SEEN_KEY, "1");
    prefetchRig(RIG_STRIPS);
    prefetchGsap();
  }, []);

  useEffect(() => {
    // Under the start screen the boot has not begun: the line waits for it.
    if (holding || bootIsHeld()) return;
    // The pace is read here, not at render: it comes from the page's flags, which prerender does not have.
    const timer = window.setTimeout(
      () => {
        bootPlayed = true;
        say(view.comm, { interrupt: true });
      },
      LANDING_BEATS.comm * landingPace() * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [say, holding]);

  const shortcuts = useMemo(
    () => ({
      enter: () => {
        audio.unlock();
        void go(view.enter.to, "wipe");
      },
      q: () => void go(view.view.to, "wipe"),
    }),
    [audio, go],
  );
  useScreenShortcuts(shortcuts, { enabled: desktop && !holding });

  return (
    <>
      <StartScreen view={view} open={holding} onChoose={begin} />
      <LandingPage view={view} />
    </>
  );
}
