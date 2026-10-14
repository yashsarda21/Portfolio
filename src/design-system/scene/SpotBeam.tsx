import { cn } from "@/lib/cn";
import type { SceneLayerProps } from "./layer";

/**
 * Full Time's one spotlight (Easter-Egg): a volt cone, narrow at the top and widening to its foot, fading as it
 * falls. Size and place it with classes (the artboard's is 500×980 from 40px above the stage). Decorative.
 */
export function SpotBeam({ "data-part": part, className, style }: SceneLayerProps) {
  return (
    <div
      aria-hidden="true"
      data-part={part}
      className={cn("pointer-events-none absolute scene-beam-volt", className)}
      style={style}
    />
  );
}

/** The pool of light the beam lands in (Easter-Egg's floor glow): a soft volt ellipse. Size and place it with classes. Decorative. */
export function FloorPool({ "data-part": part, className, style }: SceneLayerProps) {
  return (
    <div
      aria-hidden="true"
      data-part={part}
      className={cn("pointer-events-none absolute scene-pool-volt", className)}
      style={style}
    />
  );
}
