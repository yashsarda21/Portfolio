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

export function SkyGlow({
  x = "50%",
  y = "0%",
  w = "75%",
  h = "50%",
  alpha = 0.2,
  className,
}: GlowProps) {
  const style = {
    "--sky-x": x,
    "--sky-y": y,
    "--sky-w": w,
    "--sky-h": h,
    "--sky-a": alpha,
  } as CSSProperties;
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 scene-sky", className)}
      style={style}
    />
  );
}
