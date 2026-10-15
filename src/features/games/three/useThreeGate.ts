import { useCallback, useEffect, useRef, useState, useSyncExternalStore } from "react";
import { canUse3d } from "./support";

/** How long the 3D files get before the game falls back to the 2D one. */
export const THREE_TIMEOUT_MS = 20_000;

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
 * matches the prerender). With reduced motion or without WebGL2 it is "off" at once and loads nothing; otherwise it
 * runs `load`, and a rejection or `THREE_TIMEOUT_MS` also turns it "off". Whatever arrives after that is ignored.
 */
export function useThreeGate<T>({
  reduced,
  load,
}: {
  reduced: boolean;
  load: (onProgress: (fraction: number) => void) => Promise<T>;
}): ThreeGate<T> {
  const [state, setState] = useState<GateState<T>>(LOADING);
  // WebGL2 is probed once per gate. The server (and the hydrating client) assume yes, so both start at "loading".
  const [probe] = useState<{ webgl2?: boolean }>(() => ({}));
  const supported = useSyncExternalStore(
    () => () => {},
    () => (probe.webgl2 ??= canUse3d()),
    () => true,
  );
  const unavailable = reduced || !supported;
  const loadRef = useRef(load);
  useEffect(() => {
    loadRef.current = load;
  });

  useEffect(() => {
    if (unavailable) return;
    let live = true;
    const stop = () => {
      live = false;
      clearTimeout(timer);
    };
    const off = () => {
      if (!live) return;
      stop();
      setState({ status: "off", progress: 0, value: null });
    };
    const timer = setTimeout(off, THREE_TIMEOUT_MS);
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
    return () => {
      stop();
      // A fresh load starts from "loading", not from an "off" left by the last one (a ready scene is kept).
      setState((s) => (s.status === "ready" ? s : LOADING));
    };
  }, [unavailable]);

  const fail = useCallback(() => setState({ status: "off", progress: 0, value: null }), []);

  return { ...(unavailable ? OFF : state), fail };
}
