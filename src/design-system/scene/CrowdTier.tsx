import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/** Dot-grid crowd. Density comes from the venue (--venue-crowd-alpha) unless `alpha` is passed. */
export function CrowdTier({
  alpha,
  curved = false,
  className,
}: {
  alpha?: number;
  curved?: boolean;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute scene-crowd opacity-70",
        curved && "[border-radius:50%_50%_0_0/60%_60%_0_0]",
        className,
      )}
      style={alpha === undefined ? undefined : ({ "--crowd-a": alpha } as CSSProperties)}
    />
  );
}
