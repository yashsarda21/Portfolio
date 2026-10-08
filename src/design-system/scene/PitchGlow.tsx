import { cn } from "@/lib/cn";
import type { SceneLayerProps } from "./layer";

export function PitchGlow({ "data-part": part, className, style }: SceneLayerProps) {
  return (
    <div
      aria-hidden="true"
      data-part={part}
      className={cn("pointer-events-none absolute scene-pitch-glow", className)}
      style={style}
    />
  );
}
