import { MEDIA } from "@/lib/breakpoints";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { useThreeGate } from "../three/useThreeGate";
import { Cricket3DScreen, type Cricket3d } from "./Cricket3DScreen";
import { CricketScreen } from "./CricketScreen";

/** Once loaded, the scene and its files are kept for the visit: a rematch or coming back is instant (spec §6.2). */
let loaded: Cricket3d | null = null;

/** three.js and the scene arrive only through this dynamic import, never in a page's first load. */
const loadCricket3d = (onProgress: (fraction: number) => void): Promise<Cricket3d> =>
  loaded
    ? Promise.resolve(loaded)
    : import("./3d/scene").then(async (m) => {
        loaded = { Scene: m.CricketScene, assets: await m.loadCricketAssets(onProgress) };
        return loaded;
      });

/** Cricket in 3D, or today's 2D game for reduced motion, no WebGL, or a failed download (spec §6.2). */
export function CricketGame() {
  const reduced = useMediaQuery(MEDIA.reducedMotion);
  const gate = useThreeGate({ reduced, load: loadCricket3d });
  return gate.status === "off" ? <CricketScreen /> : <Cricket3DScreen gate={gate} />;
}
