import type { gsap as Gsap } from "gsap";
import { useCallback, useEffect, useRef, useState, type RefObject } from "react";
import { MEDIA } from "@/lib/breakpoints";
import { loadGsap } from "@/lib/motion";
import { useAudio } from "@/shell/audio";
import { showSchedule } from "@/shell/showSound";
import { RIG_STRIPS } from "@/assets/rig";
import { INTRO_BEATS } from "./beats";
import { collectIntroRefs } from "./refs";
import { loadRig } from "./rig";
import { RIG_WAIT_MS } from "./rigGate";
import { createIntroTimeline, showIntroEndState } from "./timeline";

/** Where the show is. The page's root carries it as `data-hold`; CSS holds the parts back while it is pending. */
type IntroState = "pending" | "playing" | "done";

/**
 * Which intro this screen gets. The stage (from 1200px, L1) plays the full show; the column (phones and
 * tablets, below 1200px) plays its own three-second cut (L6, D-6); reduced motion gets the end state at once, whatever the width.
 */
const TIERS = {
  desktop: `${MEDIA.lg} and (prefers-reduced-motion: no-preference)`,
  mobile: `${MEDIA.belowLg} and (prefers-reduced-motion: no-preference)`,
  reduce: "(prefers-reduced-motion: reduce)",
} as const;

/**
 * The page draws both layouts and CSS shows one. Each is marked, and a branch collects the parts of its own
 * layout only: the stage and the column use the same `data-part` names.
 */
const LAYOUT = { desktop: "stage", mobile: "column" } as const;
const layoutOf = (root: HTMLElement, tier: keyof typeof LAYOUT) =>
  root.querySelector<HTMLElement>(`[data-intro-layout="${LAYOUT[tier]}"]`);

/** The CSS hold lets go by itself at 8 s (`hold-fallback`, motion.css); once it has, the parts are already on show. */
const FALLBACK_ANIMATION = "hold-fallback";
function fallbackFired(root: HTMLElement): boolean {
  if (typeof root.getAnimations !== "function") return false;
  return root
    .getAnimations({ subtree: true })
    .some(
      (a) =>
        (a as Partial<CSSAnimation>).animationName === FALLBACK_ANIMATION &&
        a.playState === "finished",
    );
}

/**
 * Plays the Player Introduction on the page under `rootRef`, and reports where it is.
 *
 * Loads GSAP on demand, then `gsap.matchMedia()` picks the tier (above) and builds the timeline from the refs
 * on the page (`collectIntroRefs`, by `data-part`). The root's `data-hold` goes pending, playing, done, and its
 * `data-sprites` says how loading the head-turn frames went (empty while loading, then ready, timeout or error). Under
 * reduced motion it shows the end state and never touches the rig. If GSAP cannot load, the state stays pending
 * and the CSS fallback shows the parts after 8 s. Leaving the page reverts everything (`mm.revert()`).
 *
 * Below 1200px plays the column's cut: no rig (it never loads, so no head-turn frame is ever requested) and
 * no commentary (L11). Resizing across 1200px mid-play reverts one branch and builds the other.
 * `replay()` restarts the timeline from the dark stadium; replaying while playing restarts again.
 * `canReplay` is whether there is a timeline to restart (REPLAY is disabled until there is). It changes when a
 * timeline is built or dropped, not at every beat, so the page does not re-render as the show goes on.
 *
 * If GSAP only arrives after the 8 s CSS fallback has already shown the parts, the page shows the end state
 * instead of hiding everything again to play a show nobody has seen the start of (and there is no timeline).
 */
export function useIntroTimeline(
  rootRef: RefObject<HTMLElement | null>,
  { onComm }: { onComm: () => void },
): { replay: () => void; canReplay: boolean } {
  const audio = useAudio();
  const [canReplay, setCanReplay] = useState(false);
  const timeline = useRef<{ restart: () => unknown } | null>(null);
  // What the timeline's beats call is read at the beat, so a new callback never rebuilds the show.
  const latest = useRef({ onComm, playShow: audio.playShow, stopShow: audio.stopShow });
  useEffect(() => {
    latest.current = { onComm, playShow: audio.playShow, stopShow: audio.stopShow };
  });
  /**
   * The show's sound: a clunk per bank and the crowd, placed on the audio clock from the beat table (never timers
   * of its own), starting with the timeline. Called where a timeline is built or restarted, and ended by SKIP,
   * leaving the page or a tab switch (the service fades it out).
   */
  const tier = useRef<"desktop" | "mobile">("desktop");
  const startSound = useCallback((which: "desktop" | "mobile") => {
    tier.current = which;
    latest.current.playShow(showSchedule("intro", { tier: which }), performance.now());
  }, []);

  const mark = useCallback(
    (next: IntroState) => rootRef.current?.setAttribute("data-hold", next),
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
          if (reduce || fallbackFired(root)) {
            // Whichever layout is on show (the width can change without this branch running again).
            for (const tier of ["desktop", "mobile"] as const) {
              const layout = layoutOf(root, tier);
              if (layout) showIntroEndState(gsap, collectIntroRefs(layout));
            }
            mark("done");
            return;
          }
          const layout = layoutOf(root, desktop ? "desktop" : "mobile");
          if (!layout) {
            mark("done");
            return;
          }
          const refs = collectIntroRefs(layout);
          if (!desktop) {
            const tl = createIntroTimeline(gsap, refs, {
              tier: "mobile",
              // No head turn on a phone: the rig is not loaded, the timeline never waits for it.
              rig: Promise.resolve("timeout"),
              onBeat: (beat) => {
                if (beat === "done") mark("done");
                // "bank": the clunks are scheduled with the show (startSound); "comm": phones are silent (L11), the column draws no commentary
              },
            });
            timeline.current = tl;
            startSound("mobile");
            setCanReplay(true);
            mark("playing");
            return () => {
              latest.current.stopShow(300);
              timeline.current = null;
              setCanReplay(false);
            };
          }
          // The page may draw the head-turn frames now (CSS keys off this); reduced motion and the phone never do.
          root.setAttribute("data-sprites", "");
          const rig = loadRig(RIG_STRIPS, {
            timeoutMs: INTRO_BEATS.desktop.performance * 1000 + RIG_WAIT_MS,
          });
          // Say how loading went: "" while it loads, then ready, timeout or error (CSS only needs the attribute).
          void rig.then((result) => {
            if (root.hasAttribute("data-sprites")) root.setAttribute("data-sprites", result);
          });
          const tl = createIntroTimeline(gsap, refs, {
            tier: "desktop",
            rig,
            onBeat: (beat) => {
              if (beat === "comm") latest.current.onComm();
              else if (beat === "done") mark("done");
            },
          });
          timeline.current = tl;
          startSound("desktop");
          setCanReplay(true);
          // After the timeline has hidden what it will reveal, so the CSS hold can let go without a flash.
          mark("playing");
          return () => {
            latest.current.stopShow(300);
            timeline.current = null;
            setCanReplay(false);
            root.removeAttribute("data-sprites");
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
  }, [rootRef, mark, startSound]);

  const replay = useCallback(() => {
    const tl = timeline.current;
    if (!tl) return;
    mark("playing");
    tl.restart();
    startSound(tier.current);
  }, [mark, startSound]);

  return { replay, canReplay };
}
