import { useFrame } from "@react-three/fiber";
import type { RefObject } from "react";
import { MathUtils, PerspectiveCamera } from "three";
import type { GameLayout } from "../engine/types";
import type { CameraPose } from "./track";

/**
 * The camera, set every frame from the shotlist's camera at the world's clock (a shotlist may frame each layout its own
 * way, so it is given the layout). `tilt` (degrees) lowers the aim a little
 * on the column, so the view sits higher, clear of the thumb zone; `fov` (degrees) is the lens for each layout.
 */
export function CameraRig({
  world,
  layout,
  tilt,
  fov,
}: {
  world: RefObject<{
    shotlist: { camera(t: number, layout: GameLayout): CameraPose };
    elapsed(): number;
  } | null>;
  layout: GameLayout;
  tilt: Record<GameLayout, number>;
  fov: Record<GameLayout, number>;
}) {
  useFrame(({ camera }) => {
    const w = world.current;
    if (!w || !(camera instanceof PerspectiveCamera)) return;
    const pose = w.shotlist.camera(w.elapsed(), layout);
    camera.position.set(...pose.position);
    camera.lookAt(...pose.target);
    // The column frames the same view a little higher, clear of the thumb zone.
    camera.rotateX(-MathUtils.degToRad(tilt[layout]));
    const lens = fov[layout];
    if (Math.abs(camera.fov - lens) > 0.01) {
      camera.fov = lens;
      camera.updateProjectionMatrix();
    }
  });
  return null;
}
