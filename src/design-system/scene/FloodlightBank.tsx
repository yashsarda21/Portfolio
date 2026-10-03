import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

// Bulb radius/grid per size (Main.dc.html floodlight banks).
const SIZE = {
  lg: "h-12 w-28 shadow-bank-lg [--bulb-r1:2.6px] [--bulb-r2:3.6px] [--bulb-gx:12px] [--bulb-gy:11px]",
  sm: "h-9 w-21 shadow-bank-sm [--bulb-r1:2.4px] [--bulb-r2:3.4px] [--bulb-gx:12px] [--bulb-gy:11px]",
  mini: "h-4.5 w-11.5 shadow-bank-mini [--bulb-r1:1.6px] [--bulb-r2:2.4px] [--bulb-gx:7px] [--bulb-gy:6px]",
  mobile:
    "h-5.5 w-15 shadow-bank-mini [--bulb-r1:1.8px] [--bulb-r2:2.8px] [--bulb-gx:9px] [--bulb-gy:8px]",
} as const;

interface FloodlightBankProps {
  size?: keyof typeof SIZE;
  on?: boolean;
  /** Seconds before this bank flickers on (Landing: .6 / 1.1 / 1.6 / 2.0). Omit for steady. */
  flickerDelay?: number;
  className?: string;
}

export function FloodlightBank({
  size = "lg",
  on = true,
  flickerDelay,
  className,
}: FloodlightBankProps) {
  const flicker = on && flickerDelay !== undefined;
  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute scene-bank",
        SIZE[size],
        !on && "scene-bank-off",
        flicker && "animate-bank-flicker",
        className,
      )}
      style={flicker ? ({ "--flicker-delay": `${flickerDelay}s` } as CSSProperties) : undefined}
    />
  );
}
