import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { SceneLayerProps } from "./layer";

const SIDE = {
  left: "scene-cone-left",
  right: "scene-cone-right",
  down: "scene-cone-down",
} as const;

interface LightConeProps extends SceneLayerProps {
  side: keyof typeof SIDE;
  alpha?: number;
}

export function LightCone({
  side,
  alpha = 0.16,
  "data-part": part,
  className,
  style,
}: LightConeProps) {
  return (
    <div
      aria-hidden="true"
      data-part={part}
      className={cn("pointer-events-none absolute scene-cone", SIDE[side], className)}
      style={{ "--cone-a": alpha, ...style } as CSSProperties}
    />
  );
}
