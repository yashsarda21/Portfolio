import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

interface ProgressStepsProps {
  total: number;
  done: number;
  /** Half-light the next step (in progress). */
  current?: boolean;
  variant?: "bar" | "segment";
  /** Progress in words, e.g. "1 of 3 venues played" — what screen readers announce. */
  label: string;
  /** The cells fill in one after another on arrival (the segment preset: 350 ms, 40 ms apart). */
  animate?: boolean;
  className?: string;
}

const CELL = { bar: "h-1 flex-1", segment: "h-1.5 w-21" } as const;
const GAP = { bar: "gap-1", segment: "gap-1.5" } as const;

export function ProgressSteps({
  total,
  done,
  current = false,
  variant = "bar",
  label,
  animate = false,
  className,
}: ProgressStepsProps) {
  const filled = Math.max(0, Math.min(done, total));
  return (
    <div role="img" aria-label={label} className={cn("flex", GAP[variant], className)}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            CELL[variant],
            i < filled ? "bg-volt" : i === filled && current ? "bg-volt-a35" : "bg-seg-empty",
            animate && "animate-seg-fill",
          )}
          style={animate ? ({ "--i": i } as CSSProperties) : undefined}
        />
      ))}
    </div>
  );
}
