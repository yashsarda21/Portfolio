import { Canvas, useFrame, useThree } from "@react-three/fiber";
import { useCallback, useEffect, useRef, useState, type ReactNode } from "react";
import type { GameLayout } from "../engine/types";
import { SETTINGS } from "./settings";
import { tokenColor } from "./tokens";
import type { Vec3 } from "./track";

/**
 * Compiles every material's shaders before the first frame, then lets the canvas draw. `compileAsync` asks the GPU to
 * compile them all at once and waits without holding the main thread (where the browser offers
 * KHR_parallel_shader_compile), so the first frame does not freeze the page while each program compiles in turn. It
 * runs after the rest of the scene has mounted (it is the canvas's last child), in a task of its own. A compile that
 * fails is thrown from here, so the scene's error boundary falls back to the 2D game.
 */
function WarmUp({ onWarm }: { onWarm: () => void }) {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const camera = useThree((s) => s.camera);
  const [failed, setFailed] = useState<unknown>(null);
  if (failed) throw failed;
  useEffect(() => {
    let live = true;
    // A task of its own, after the mount's: handing the GPU every program takes a while too.
    const start = setTimeout(() => {
      gl.compileAsync(scene, camera).then(
        () => {
          if (live) onWarm();
        },
        (error: unknown) => {
          if (live) setFailed(error ?? new Error("compile failed"));
        },
      );
    }, 0);
    return () => {
      live = false;
      clearTimeout(start);
    };
  }, [gl, scene, camera, onWarm]);
  return null;
}

/**
 * Says once that the canvas holds a picture: on its second frame, so the first (which still builds the shadow
 * programs `compileAsync` skips) is on the canvas. Until then the board keeps its backdrop over it.
 */
function FirstFrame({ onDrawn }: { onDrawn: () => void }) {
  const frames = useRef(0);
  useFrame(() => {
    frames.current += 1;
    if (frames.current === 2) onDrawn();
  });
  return null;
}

/**
 * The 3D canvas, in the backdrop's place under the HUD, for both layouts (spec §6.3). Hidden from assistive tech: the
 * HUD announces everything. R3F stops drawing while the tab is hidden (requestAnimationFrame pauses). It draws
 * nothing until its shaders are compiled; then `onShown` tells the game it may show it (an undrawn canvas is
 * transparent), and `onDrawn`, after its first frame, that the board's backdrop can go.
 */
export function GameCanvas({
  layout,
  fov,
  position,
  onShown,
  onDrawn,
  children,
}: {
  layout: GameLayout;
  /** The lens for this layout (vertical degrees), and where the camera starts. */
  fov: number;
  position: Vec3;
  onShown?: () => void;
  onDrawn?: () => void;
  children: ReactNode;
}) {
  const settings = SETTINGS[layout];
  const [drawing, setDrawing] = useState(false);
  const shown = useRef(onShown);
  const drawn = useRef(onDrawn);
  useEffect(() => {
    shown.current = onShown;
    drawn.current = onDrawn;
  });
  const onWarm = useCallback(() => {
    setDrawing(true);
    shown.current?.();
  }, []);
  const onFirstFrame = useCallback(() => drawn.current?.(), []);
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
      {drawing ? <FirstFrame onDrawn={onFirstFrame} /> : null}
    </Canvas>
  );
}
