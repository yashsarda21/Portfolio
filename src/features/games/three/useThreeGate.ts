import { useCallback, useEffect, useRef, useState } from "react";
import { canUse3d } from "./support";

/** How long the 3D files get before the game falls back to the 2D one. */
export const THREE_TIMEOUT_MS = 20_000;
/** Once the files are in, how long the scene gets to compile and draw its first frame before the 2D game takes over. */
export const THREE_SHOW_TIMEOUT_MS = 10_000;

export type ThreeStatus = "loading" | "ready" | "off";

export interface ThreeGate<T> {
  status: ThreeStatus;
  /** 0 to 1; only ever goes up. */
  progress: number;
  value: T | null;
  /** The scene broke: fall back to the 2D game. */
  fail(): void;
}

interface GateState<T> {
  status: ThreeStatus;
  progress: number;
  value: T | null;
}

const LOADING: GateState<never> = { status: "loading", progress: 0, value: null };
const OFF = { status: "off", progress: 0, value: null } as const;

/**
 * Decides whether a game gets its 3D scene. It starts "loading" on the server and the client alike (so hydration
 * matches the prerender). With reduced motion it is "off" at once and loads nothing. Otherwise, just after mount, in a
 * task of its own, it checks WebGL2 (making a context can take a while: the hydrated page paints first): without it,
 * "off"; with it, it runs `load`, and a rejection or `THREE_TIMEOUT_MS` also turns it "off". Whatever arrives after
 * that is ignored.
 */
export function useThreeGate<T>({
  reduced,
  load,
}: {
  reduced: boolean;
  load: (onProgress: (fraction: number) => void) => Promise<T>;
}): ThreeGate<T> {
  const [state, setState] = useState<GateState<T>>(LOADING);
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    if (reduced) return;
    let live = true;
    let timer: ReturnType<typeof setTimeout> | undefined;
    const stop = () => {
      live = false;
      clearTimeout(probe);
      clearTimeout(timer);
    };
    const off = () => {
      if (!live) return;
      stop();
      setState({ status: "off", progress: 0, value: null });
    };
    const probe = setTimeout(() => {
      if (!canUse3d()) return off();
      timer = setTimeout(off, THREE_TIMEOUT_MS);
      loadRef
        .current((fraction) => {
          if (!live) return;
          setState((s) =>
            s.status === "loading" && fraction > s.progress ? { ...s, progress: fraction } : s,
          );
        })
        .then((value) => {
          if (!live) return;
          stop();
          setState({ status: "ready", progress: 1, value });
        }, off);
    }, 0);
    return () => {
      stop();
      // A fresh load starts from "loading", not from an "off" left by the last one (a ready scene is kept).
      setState((s) => (s.status === "ready" ? s : LOADING));
    };
  }, [reduced]);

  const fail = useCallback(() => setState({ status: "off", progress: 0, value: null }), []);

  return { ...(reduced ? OFF : state), fail };
}
