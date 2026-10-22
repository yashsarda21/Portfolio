import { MEDIA } from "@/lib/breakpoints";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { loadOnce } from "../three/loadOnce";
import { useThreeGate } from "../three/useThreeGate";
import { Badminton3DScreen } from "./Badminton3DScreen";
import { BadmintonScreen } from "./BadmintonScreen";

/** three.js and the scene arrive only through this dynamic import, never in a page's first load. */
const loadBadminton3d = loadOnce(async (onProgress) => {
  const m = await import("./3d/scene");
  return { Scene: m.BadmintonScene, assets: await m.loadBadmintonAssets(onProgress) };
});

/** Badminton in 3D, or today's 2D game for reduced motion, no WebGL, or a failed download (D10). */
export function BadmintonGame() {
  const reduced = useMediaQuery(MEDIA.reducedMotion);
  const gate = useThreeGate({ reduced, load: loadBadminton3d });
  return gate.status === "off" ? <BadmintonScreen /> : <Badminton3DScreen gate={gate} />;
}
