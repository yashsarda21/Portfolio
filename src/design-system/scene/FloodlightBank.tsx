import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { SceneLayerProps } from "./layer";

// Bulb radius/grid and glow per size (Main.dc.html floodlight banks): the bulbs, once.
const MINI_BULBS =
  "shadow-bank-mini [--bulb-r1:1.6px] [--bulb-r2:2.4px] [--bulb-gx:7px] [--bulb-gy:6px]";
const BULBS = {
  lg: "shadow-bank-lg [--bulb-r1:2.6px] [--bulb-r2:3.6px] [--bulb-gx:12px] [--bulb-gy:11px]",
  sm: "shadow-bank-sm [--bulb-r1:2.4px] [--bulb-r2:3.4px] [--bulb-gx:12px] [--bulb-gy:11px]",
  mini: MINI_BULBS,
  mobile: "shadow-bank-mini [--bulb-r1:1.8px] [--bulb-r2:2.8px] [--bulb-gx:9px] [--bulb-gy:8px]",
  // The Hub's venue pictures (Hub.dc.html): the mini bulbs, 40 and 50px wide.
  card: MINI_BULBS,
  "card-wide":
    "shadow-bank-card-wide [--bulb-r1:1.6px] [--bulb-r2:2.4px] [--bulb-gx:7px] [--bulb-gy:6px]",
} as const;
// The housing around those bulbs: its width and height.
const HOUSING = {
  lg: "h-12 w-28",
  sm: "h-9 w-21",
  mini: "h-4.5 w-11.5",
  mobile: "h-5.5 w-15",
  card: "h-3.5 w-10",
  "card-wide": "h-3.5 w-12.5",
} as const;
// `flat` is the Intro's shorter housing (112x44 and 84x32): the same bulbs and glow, a lower height.
const FLAT_HEIGHT: Partial<Record<keyof typeof HOUSING, string>> = { lg: "h-11", sm: "h-8" };

export type FloodlightBankSize = keyof typeof HOUSING;

interface FloodlightBankProps extends SceneLayerProps {
  size?: FloodlightBankSize;
  /** The Intro's shorter housing, for the large and small banks (the mini and mobile banks have one height). */
  flat?: boolean;
  on?: boolean;
  /** Seconds before this bank flickers on (--d; Landing: .6 / 1.1 / 1.6 / 2.0, times the page's --pace). Omit for steady. */
  flickerDelay?: number;
  /** Add the flare layer: a bright halo at opacity 0 that a timeline tweens (the Intro). */
  flare?: boolean;
}

export function FloodlightBank({
  size = "lg",
  flat = false,
  on = true,
  flickerDelay,
  flare = false,
  "data-part": part,
  className,
  style,
}: FloodlightBankProps) {
  const flicker = on && flickerDelay !== undefined;
  return (
    <div
      aria-hidden="true"
      data-part={part}
      className={cn(
        "pointer-events-none absolute scene-bank",
        HOUSING[size],
        flat && FLAT_HEIGHT[size],
        BULBS[size],
        !on && "scene-bank-off",
        flicker && "animate-bank-flicker",
        className,
      )}
      style={flicker ? ({ "--d": `${flickerDelay}s`, ...style } as CSSProperties) : style}
    >
      {flare && on && (
        <div aria-hidden="true" data-part="flare" className="scene-bank-flare shadow-bank-flare" />
      )}
    </div>
  );
}
