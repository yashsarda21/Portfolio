import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { GlowLayerProps } from "./layer";

/** Glow tinted by the nearest `data-venue` attribute. */
export function VenueGlow({
  x = "50%",
  y = "110%",
  w = "80%",
  h = "50%",
  alpha = 0.4,
  "data-part": part,
  className,
  style: extra,
}: GlowLayerProps) {
  const style = {
    "--glow-x": x,
    "--glow-y": y,
    "--glow-w": w,
    "--glow-h": h,
    "--glow-a": alpha,
    ...extra,
  } as CSSProperties;
  return (
    <div
      aria-hidden="true"
      data-part={part}
      className={cn("pointer-events-none absolute inset-0 scene-venue-glow", className)}
      style={style}
    />
  );
}
