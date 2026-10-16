import { Canvas, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { GameLayout } from "../engine/types";
import { SETTINGS } from "./settings";
import { tokenColor } from "./tokens";
import type { Vec3 } from "./track";

/**
 * Compiles every material's shaders before the first frame, then lets the canvas draw. `compileAsync` asks the GPU to
 * compile them all at once and waits without holding the main thread (where the browser offers
 * KHR_parallel_shader_compile), so the first frame does not freeze the page while each program compiles in turn. It
 * runs after the rest of the scene has mounted (it is the canvas's last child), in a task of its own.
 */
function WarmUp({ onWarm }: { onWarm: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  useEffect(() => {
    let live = true;
    // A task of its own, after the mount's: handing the GPU every program takes a while too.
    const start = setTimeout(() => {
      void gl.compileAsync(scene, camera).then(() => {
        if (live) onWarm();
      });
    }, 0);
    return () => {
      live = false;
      clearTimeout(start);
    };
  }, [gl, scene, camera, onWarm]);
  return null;
}

/**
 * The 3D canvas, in the backdrop's place under the HUD, for both layouts (spec §6.3). Hidden from assistive tech: the
 * HUD announces everything. R3F stops drawing while the tab is hidden (requestAnimationFrame pauses). It draws
 * nothing until its shaders are compiled; then `onShown` tells the game the scene is on screen.
 */
export function GameCanvas({
  layout,
  fov,
  position,
  onShown,
  children,
}: {
  layout: GameLayout;
  /** The lens for this layout (vertical degrees), and where the camera starts. */
  fov: number;
  position: Vec3;
  onShown?: () => void;
  children: ReactNode;
}) {
  const settings = SETTINGS[layout];
  const [drawing, setDrawing] = useState(false);
  const shown = useRef(onShown);
  useEffect(() => {
    shown.current = onShown;
  });
  const onWarm = useCallback(() => {
    setDrawing(true);
    shown.current?.();
  }, []);
  return (
    <Canvas
      aria-hidden="true"
      className="absolute inset-0"
      dpr={[1, settings.dpr]}
      shadows={settings.shadows ? "percentage" : false}
      gl={{ antialias: settings.antialias, powerPreference: "high-performance" }}
      camera={{ fov, near: 0.1, far: 500, position: [...position] }}
      frameloop={drawing ? "always" : "never"}
      onCreated={({ scene }) => {
        scene.background = tokenColor("--ref-night");
      }}
    >
      {children}
      <WarmUp onWarm={onWarm} />
    </Canvas>
  );
}
