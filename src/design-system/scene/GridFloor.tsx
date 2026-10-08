import { cn } from "@/lib/cn";
import type { SceneLayerProps } from "./layer";

/**
 * The Hub's floor grid: a plane lying back in perspective, fading away from its top centre. The default box is the
 * artboard's (300px in from the left, 560px down, 400px high); pass className to place it elsewhere. Decorative.
 */
export function GridFloor({ "data-part": part, className, style }: SceneLayerProps) {
  return (
    <div
      aria-hidden="true"
      data-part={part}
      className={cn(
        "pointer-events-none absolute top-140 right-0 left-75 h-100 perspective-grid",
        className,
      )}
      style={style}
    >
      <div className="mx-auto h-150 w-325 scene-grid-floor" />
    </div>
  );
}
