import { MEDIA } from "@/lib/breakpoints";
import { useMediaQuery } from "@/lib/useMediaQuery";
import { loadOnce } from "../three/loadOnce";
import { useThreeGate } from "../three/useThreeGate";
import { Tennis3DScreen } from "./Tennis3DScreen";
import { TennisScreen } from "./TennisScreen";

/** three.js and the scene arrive only through this dynamic import, never in a page's first load. */
const loadTennis3d = loadOnce(async (onProgress) => {
  const m = await import("./3d/scene");
  return { Scene: m.TennisScene, assets: await m.loadTennisAssets(onProgress) };
});

/** Tennis in 3D, or today's 2D game for reduced motion, no WebGL, or a failed download (spec T8). */
export function TennisGame() {
  const reduced = useMediaQuery(MEDIA.reducedMotion);
  const gate = useThreeGate({ reduced, load: loadTennis3d });
  return gate.status === "off" ? <TennisScreen /> : <Tennis3DScreen gate={gate} />;
}
