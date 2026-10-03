import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

type Level = "shipped" | "built" | "kit";
const FILLED: Record<Level, number> = { shipped: 9, built: 7, kit: 5 };
const FILL: Record<Level, string> = { shipped: "bg-volt", built: "bg-floodlight", kit: "bg-dim" };

interface SegmentBarProps {
  level: Level;
  /** Evidence in words, e.g. "Java: shipped in production". */
  label: string;
  animate?: boolean;
  size?: "md" | "sm";
  className?: string;
}

/** 10-segment evidence bar — never a percentage (spec §7). */
export function SegmentBar({
  level,
  label,
  animate = false,
  size = "md",
  className,
}: SegmentBarProps) {
  return (
    <div role="img" aria-label={label} className={cn("flex gap-(--seg-gap)", className)}>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={cn(
            "flex-1",
            size === "md" ? "h-2.5" : "h-2",
            i < FILLED[level] ? FILL[level] : size === "md" ? "bg-seg-track" : "bg-seg-empty",
            animate && "animate-seg-fill",
          )}
          style={animate ? ({ "--i": i } as CSSProperties) : undefined}
        />
      ))}
    </div>
  );
}
