import { useEffect, useMemo } from "react";
import { content, ui } from "@/content";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { prefetchGsap } from "@/lib/motion";
import { safeStorage } from "@/lib/storage";
import { useAudio } from "@/shell/audio";
import { useCommentary } from "@/shell/commentary";
import { LANDING_SEEN_KEY } from "@/shell/headFlags";
import { ROUTES } from "@/shell/routes";
import { useArenaTransition } from "@/shell/transition";
import { useScreenShortcuts } from "@/shell/useScreenShortcuts";
import turn0 from "@/assets/rig/turn_0.webp?url";
import turn1 from "@/assets/rig/turn_1.webp?url";
import turn2 from "@/assets/rig/turn_2.webp?url";
import { LANDING_BEATS, landingPace } from "./beats";
import { LandingPage } from "./LandingPage";
import { prefetchRig } from "./prefetchRig";
import { buildLandingView } from "./view";

const view = buildLandingView(content, ui, ROUTES);

/** The route's screen: marks the visit, says the entrance line at its beat, wires the shortcuts, warms the intro. */
export function LandingScreen() {
  const { say } = useCommentary();
  const audio = useAudio();
  const { go } = useArenaTransition();
  const desktop = useMediaQuery("(min-width: 1200px)");

  useEffect(() => {
    // Seen: the next visit plays the cut-down (the head script reads this before first paint).
    safeStorage.set(LANDING_SEEN_KEY, "1");
    prefetchRig([turn0, turn1, turn2]);
    prefetchGsap();
  }, []);

  useEffect(() => {
    // The pace is read here, not at render: it comes from the page's flags, which prerender does not have.
    const timer = window.setTimeout(
      () => say(view.comm, { interrupt: true }),
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
