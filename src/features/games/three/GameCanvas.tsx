import { Canvas } from "@react-three/fiber";
import type { ReactNode } from "react";
import type { GameLayout } from "../engine/types";
import { SETTINGS } from "./settings";
import { tokenColor } from "./tokens";
import type { Vec3 } from "./track";

/**
 * The 3D canvas, in the backdrop's place under the HUD, for both layouts (spec §6.3). Hidden from assistive tech: the
 * HUD announces everything. R3F stops drawing while the tab is hidden (requestAnimationFrame pauses).
 */
export function GameCanvas({
  layout,
  fov,
  position,
  children,
}: {
  layout: GameLayout;
  /** The lens for this layout (vertical degrees), and where the camera starts. */
  fov: number;
  position: Vec3;
  children: ReactNode;
}) {
  const settings = SETTINGS[layout];
  return (
    <Canvas
      aria-hidden="true"
      className="absolute inset-0"
      dpr={[1, settings.dpr]}
      shadows={settings.shadows ? "percentage" : false}
      gl={{ antialias: settings.antialias, powerPreference: "high-performance" }}
      camera={{ fov, near: 0.1, far: 500, position: [...position] }}
      onCreated={({ scene }) => {
        scene.background = tokenColor("--ref-night");
      }}
    >
      {children}
    </Canvas>
  );
}
