import { useEffect, useLayoutEffect, useMemo } from "react";
import { content, ui } from "@/content";
import { MEDIA } from "@/lib/breakpoints";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { prefetchGsap } from "@/lib/motion";
import { safeStorage } from "@/lib/storage";
import { useAudio } from "@/shell/audio";
import { useCommentary } from "@/shell/commentary";
import { LANDING_SEEN_KEY } from "@/shell/headFlags";
import { ROUTES } from "@/shell/routes";
import { useArenaTransition } from "@/shell/transition";
import { showSchedule } from "@/shell/showSound";
import { useScreenShortcuts } from "@/shell/useScreenShortcuts";
import { useShowSound } from "@/shell/useShowSound";
import { RIG_STRIPS } from "@/assets/rig";
import { LANDING_BEATS, bootElapsedMs, landingPace } from "./beats";
import { LandingPage } from "./LandingPage";
import { prefetchRig } from "./prefetchRig";
import { buildLandingView } from "./view";

const view = buildLandingView(content, ui, ROUTES);

/**
 * True once this page session has played the whole boot (set when the commentary line is due, the last beat).
 * Coming back to the Landing in the same session (back button, a logo link) then gets the cut-down, like a
 * return visit. Set that late so a strict-mode double mount can never trip it.
 */
let bootPlayed = false;

/**
 * The route's screen: marks the visit, says the entrance line at its beat, wires the shortcuts, warms the intro.
 * Sound: the first visit is silent (the two recordings are only prefetched, ready for the Intro); a return visit
 * gets the crowd's cheer at the fast pace's name beat (see useShowSound for when it can play).
 */
export function LandingScreen() {
  const { say } = useCommentary();
  const audio = useAudio();
  const { go } = useArenaTransition();
  const desktop = useMediaQuery(MEDIA.lg);
  const { arm } = useShowSound();

  // Before paint, so the animations start at the quick pace (the head script only knows about earlier visits).
  useLayoutEffect(() => {
    if (typeof window !== "undefined" && bootPlayed)
      document.documentElement.setAttribute("data-return-visit", "");
  }, []);

  useEffect(() => {
    // The show's zero is where the boot's own clock is now, so a page that was slow to start still lines up.
    if (document.documentElement.hasAttribute("data-return-visit"))
      arm(showSchedule("landing", { pace: landingPace() }), performance.now() - bootElapsedMs());
  }, [arm]);

  useEffect(() => {
    // Seen: the next visit plays the cut-down (the head script reads this before first paint).
    safeStorage.set(LANDING_SEEN_KEY, "1");
    prefetchRig(RIG_STRIPS);
    prefetchGsap();
  }, []);

  useEffect(() => {
    // The pace is read here, not at render: it comes from the page's flags, which prerender does not have.
    const timer = window.setTimeout(
      () => {
        bootPlayed = true;
        say(view.comm, { interrupt: true });
      },
      LANDING_BEATS.comm * landingPace() * 1000,
    );
    return () => window.clearTimeout(timer);
  }, [say]);

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
  useScreenShortcuts(shortcuts, { enabled: desktop });

  return <LandingPage view={view} />;
}
