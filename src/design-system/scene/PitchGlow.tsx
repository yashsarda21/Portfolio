import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

export function PitchGlow({
  "data-part": part,
  className,
  style,
}: {
  "data-part"?: string;
  className?: string;
  style?: CSSProperties;
}) {
  return (
    <div
      aria-hidden="true"
      data-part={part}
      className={cn("pointer-events-none absolute scene-pitch-glow", className)}
      style={style}
    />
  );
}
