import { cn } from "@/lib/cn";
import type { SceneLayerProps } from "./layer";

export function FloodlightMast({ "data-part": part, className, style }: SceneLayerProps) {
  return (
    <div
      aria-hidden="true"
      data-part={part}
      className={cn("pointer-events-none absolute h-75 w-0.5 scene-mast", className)}
      style={style}
    />
  );
}
