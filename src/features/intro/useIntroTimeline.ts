import type { gsap as Gsap } from "gsap";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { loadGsap } from "@/lib/motion";
import { useAudio } from "@/shell/audio";
import turn0 from "@/assets/rig/turn_0.webp?url";
import turn1 from "@/assets/rig/turn_1.webp?url";
import turn2 from "@/assets/rig/turn_2.webp?url";
import { INTRO_BEATS } from "./beats";
import { collectIntroRefs } from "./refs";
import { loadRig } from "./rig";
import { createIntroTimeline, showIntroEndState } from "./timeline";

/** Where the show is. The page's root carries it as `data-intro`; CSS holds the parts back while it is pending. */
export type IntroState = "pending" | "playing" | "done";

/**
 * Which intro this screen gets. The stage (desktop AND tablet, L1) plays the full show; the phone's own cut
 * comes with Task 7; reduced motion gets the end state at once, whatever the width.
 */
const TIERS = {
  desktop: "(min-width: 768px) and (prefers-reduced-motion: no-preference)",
  mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)",
  reduce: "(prefers-reduced-motion: reduce)",
} as const;

/** The head-turn strips, in play order. Only the desktop branch ever asks for them. */
const RIG_URLS = [turn0, turn1, turn2];
/** What the timeline will wait for the strips at the performance beat (L7); the loader gives up then too. */
const RIG_WAIT_SECONDS = 1.5;

/**
 * Plays the Player Introduction on the page under `rootRef`, and reports where it is.
 *
 * Loads GSAP on demand, then `gsap.matchMedia()` picks the tier (above) and builds the timeline from the refs
 * on the page (`collectIntroRefs`, by `data-part`). The root's `data-intro` goes pending, playing, done. Under
 * reduced motion it shows the end state and never touches the rig. If GSAP cannot load, the state stays pending
 * and the CSS fallback shows the parts after 8 s. Leaving the page reverts everything (`mm.revert()`).
 *
 * Phone width (until Task 7 draws the phone's intro) plays nothing and marks the root done.
 * `replay()` restarts the timeline from the dark stadium; replaying while playing restarts again.
 */
export function useIntroTimeline(
  rootRef: RefObject<HTMLElement | null>,
  { onComm }: { onComm: () => void },
): { replay: () => void; state: IntroState } {
  const audio = useAudio();
  const [state, setState] = useState<IntroState>("pending");
  const timeline = useRef<{ restart: () => unknown } | null>(null);
  // What the timeline's beats call is read at the beat, so a new callback never rebuilds the show.
  const latest = useRef({ onComm, play: audio.play });
  useEffect(() => {
    latest.current = { onComm, play: audio.play };
  });

  const mark = useCallback(
    (next: IntroState) => {
      rootRef.current?.setAttribute("data-intro", next);
      setState(next);
    },
    [rootRef],
  );

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;
    let cancelled = false;
    let mm: ReturnType<typeof Gsap.matchMedia> | undefined;

    loadGsap().then(
      (gsap) => {
        if (cancelled) return;
        mm = gsap.matchMedia();
        mm.add(TIERS, (context) => {
          const { desktop, reduce } = context.conditions as Record<keyof typeof TIERS, boolean>;
          const refs = collectIntroRefs(root);
          if (reduce) {
            showIntroEndState(gsap, refs);
            mark("done");
            return;
          }
          if (!desktop) {
            mark("done");
            return;
          }
          // The page may draw the head-turn frames now (CSS keys off this); reduced motion and the phone never do.
          root.setAttribute("data-rig", "");
          const rig = loadRig(RIG_URLS, {
            timeoutMs: (INTRO_BEATS.desktop.performance + RIG_WAIT_SECONDS) * 1000,
          });
          const tl = createIntroTimeline(gsap, refs, {
            tier: "desktop",
            rig,
            onBeat: (beat) => {
              if (beat === "bank") latest.current.play("floodlight");
              else if (beat === "comm") latest.current.onComm();
              else mark("done");
            },
          });
          timeline.current = tl;
          // After the timeline has hidden what it will reveal, so the CSS hold can let go without a flash.
          mark("playing");
          return () => {
            timeline.current = null;
            root.removeAttribute("data-rig");
          };
        });
      },
      () => {
        /* GSAP did not load: the root stays pending and the parts appear through the CSS fallback. */
      },
    );

    return () => {
      cancelled = true;
      mm?.revert();
      timeline.current = null;
    };
  }, [rootRef, mark]);

  const replay = useCallback(() => {
    const tl = timeline.current;
    if (!tl) return;
    mark("playing");
    tl.restart();
  }, [mark]);

  return { replay, state };
}
