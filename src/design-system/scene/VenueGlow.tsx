import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

interface GlowProps {
  x?: string;
  y?: string;
  w?: string;
  h?: string;
  alpha?: number;
  className?: string;
}

/** Glow tinted by the nearest `data-venue` attribute. */
export function VenueGlow({
  x = "50%",
  y = "110%",
  w = "80%",
  h = "50%",
  alpha = 0.4,
  className,
}: GlowProps) {
  const style = {
    "--glow-x": x,
    "--glow-y": y,
    "--glow-w": w,
    "--glow-h": h,
    "--glow-a": alpha,
  } as CSSProperties;
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 scene-venue-glow", className)}
      style={style}
    />
  );
}
