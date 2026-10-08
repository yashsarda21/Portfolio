import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { SceneLayerProps } from "./layer";

/** stand: the stadium stand's dot grid. curved: the same, bowed along its top edge. flat: the phone's band. */
const SHAPE = {
  stand: "scene-crowd",
  curved: "scene-crowd [border-radius:50%_50%_0_0/60%_60%_0_0]",
  flat: "scene-crowd-flat",
} as const;

export type CrowdShape = keyof typeof SHAPE;

interface CrowdTierProps extends SceneLayerProps {
  alpha?: number;
  /** The phone's flat band has finer dots and its own fade; the stand can be curved (default: a plain stand). */
  shape?: CrowdShape;
}

/** Dot-grid crowd. Density comes from the venue (--venue-crowd-alpha) unless `alpha` is passed. */
export function CrowdTier({
  alpha,
  shape = "stand",
  "data-part": part,
  className,
  style,
}: CrowdTierProps) {
  return (
    <div
      aria-hidden="true"
      data-part={part}
      className={cn("pointer-events-none absolute opacity-70", SHAPE[shape], className)}
      style={alpha === undefined ? style : ({ "--crowd-a": alpha, ...style } as CSSProperties)}
    />
  );
}
