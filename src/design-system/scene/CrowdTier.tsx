import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

export function CrowdTier({
  alpha = 0.3,
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
      style={{ "--crowd-a": alpha } as CSSProperties}
    />
  );
}
