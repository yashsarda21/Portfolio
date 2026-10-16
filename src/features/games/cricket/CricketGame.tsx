import { MEDIA } from "@/lib/breakpoints";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { loadOnce } from "../three/loadOnce";
import { useThreeGate } from "../three/useThreeGate";
import { Cricket3DScreen } from "./Cricket3DScreen";
import { CricketScreen } from "./CricketScreen";

/** three.js and the scene arrive only through this dynamic import, never in a page's first load. */
const loadCricket3d = loadOnce(async (onProgress) => {
  const m = await import("./3d/scene");
  return { Scene: m.CricketScene, assets: await m.loadCricketAssets(onProgress) };
});

/** Cricket in 3D, or today's 2D game for reduced motion, no WebGL, or a failed download (spec §6.2). */
export function CricketGame() {
  const reduced = useMediaQuery(MEDIA.reducedMotion);
  const gate = useThreeGate({ reduced, load: loadCricket3d });
  return gate.status === "off" ? <CricketScreen /> : <Cricket3DScreen gate={gate} />;
}
