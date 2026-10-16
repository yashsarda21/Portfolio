import {
  createElement,
  useEffect,
  useState,
  type ComponentType,
  type ReactNode,
  type RefObject,
} from "react";
import type { GameLayout } from "../engine/types";
import { ThreeBoundary } from "./ThreeBoundary";
import { THREE_SHOW_TIMEOUT_MS, type ThreeGate } from "./useThreeGate";

/** What every 3D game's scene component is given. */
export interface SceneProps<A, W> {
  assets: A;
  world: RefObject<W | null>;
  layout: GameLayout;
  onShown?: () => void;
  onDrawn?: () => void;
}
/** What a 3D download brings: the scene component and the files it draws. */
export interface Loaded3d<A, W> {
  Scene: ComponentType<SceneProps<A, W>>;
  assets: A;
}

/**
 * The part of a 3D game's screen that is the same for every venue: the scene mounts hidden while its shaders compile
 * (the loader stays up), then it is shown and the game takes input for the rest of the visit. `drawn` is this
 * canvas's own: the board's backdrop stays over a new canvas until its first frame is on it (a resize across 1200px
 * mounts a new one). Once the files are in, the scene gets THREE_SHOW_TIMEOUT_MS to show, or the 2D game takes over.
 * The stadium hums under it while it is on screen.
 */
export function useThreeScreen<A, W>({
  gate,
  world,
  layout,
  audio,
}: {
  gate: ThreeGate<Loaded3d<A, W>>;
  world: RefObject<W | null>;
  layout: GameLayout;
  audio: { ambience(on: boolean): void };
}): { ready: boolean; drawn: boolean; scene: ReactNode | null } {
  // The files are in: the scene mounts, hidden, and compiles its shaders; the loader stays until then. Once shown, the
  // game takes input for the rest of the visit.
  const [shown, setShown] = useState(false);
  const ready = gate.status === "ready" && shown;
  const [drawn, setDrawn] = useState<{ layout: GameLayout; on: boolean }>({ layout, on: false });
  if (drawn.layout !== layout) setDrawn({ layout, on: false });

  // Review M3: after the files arrive, the scene gets THREE_SHOW_TIMEOUT_MS to compile and draw, or the 2D game takes over.
  useEffect(() => {
    if (gate.status !== "ready" || shown) return;
    const cap = setTimeout(gate.fail, THREE_SHOW_TIMEOUT_MS);
    return () => clearTimeout(cap);
  }, [gate.status, gate.fail, shown]);

  // The stadium hums under the game while it is on screen (from the first gesture, sound on). Only `ready` restarts it:
  // the audio api changes when sound is switched on or off, and that must not stop and start the hum.
  useEffect(() => {
    if (!ready) return;
    audio.ambience(true);
    return () => audio.ambience(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [ready]);

  const loaded = gate.value;
  const scene =
    gate.status === "ready" && loaded
      ? createElement(ThreeBoundary, {
          onError: gate.fail,
          children: createElement(loaded.Scene, {
            assets: loaded.assets,
            world,
            layout,
            onShown: () => setShown(true),
            onDrawn: () => setDrawn({ layout, on: true }),
          }),
        })
      : null;
  return { ready, drawn: ready && drawn.on, scene };
}
