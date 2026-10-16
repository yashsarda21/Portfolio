import { MEDIA } from "@/lib/breakpoints";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useThreeGate } from "../three/useThreeGate";
import { Cricket3DScreen, type Cricket3d } from "./Cricket3DScreen";
import { CricketScreen } from "./CricketScreen";

/**
 * The download, kept for the visit once started: a rematch or coming back is instant (spec §6.2), and coming back
 * while it is still running joins it rather than starting it again. A failed one is forgotten, so the next visit tries
 * again. Progress goes to the latest game waiting on it.
 */
let pending: Promise<Cricket3d> | null = null;
let progressTo: (fraction: number) => void = () => {};

/** three.js and the scene arrive only through this dynamic import, never in a page's first load. */
const loadCricket3d = (onProgress: (fraction: number) => void): Promise<Cricket3d> => {
  progressTo = onProgress;
  pending ??= import("./3d/scene")
    .then(async (m) => ({
      Scene: m.CricketScene,
      assets: await m.loadCricketAssets((fraction) => progressTo(fraction)),
    }))
    .catch((error: unknown) => {
      pending = null;
      throw error;
    });
  return pending;
};

/** Cricket in 3D, or today's 2D game for reduced motion, no WebGL, or a failed download (spec §6.2). */
export function CricketGame() {
  const reduced = useMediaQuery(MEDIA.reducedMotion);
  const gate = useThreeGate({ reduced, load: loadCricket3d });
  return gate.status === "off" ? <CricketScreen /> : <Cricket3DScreen gate={gate} />;
}
