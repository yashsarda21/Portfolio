import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

const SIDE = {
  left: "scene-cone-left",
  right: "scene-cone-right",
  down: "scene-cone-down",
} as const;

export function LightCone({
  side,
  alpha = 0.16,
  "data-part": part,
  className,
}: {
  side: keyof typeof SIDE;
  alpha?: number;
  "data-part"?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-part={part}
      className={cn("pointer-events-none absolute scene-cone", SIDE[side], className)}
      style={{ "--cone-a": alpha } as CSSProperties}
    />
  );
}
