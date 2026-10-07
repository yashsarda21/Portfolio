import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { CONE_REGIONS } from "./cones";
import { CrowdTier } from "./CrowdTier";
import { Dust } from "./Dust";
import { Field } from "./Field";
import { FloodlightBank } from "./FloodlightBank";
import { FloodlightMast } from "./FloodlightMast";
import { LightCone } from "./LightCone";
import { PitchGlow } from "./PitchGlow";
import { SkyGlow } from "./SkyGlow";

interface LayoutSpec {
  skyAlpha: number;
  crowd: string;
  field: { tilt: number; oval: string; className: string };
  /** The pitch glow's classes, or null where the artboard draws none. */
  pitch: string | null;
  coneAlpha: number;
  /** Cone classes. The numbers behind them are CONE_BOXES in cones.ts (Scene.test.tsx checks the match). */
  cones: { left: string; right: string };
  masts: ReadonlyArray<{ part: string; className: string }>;
  /** Left to right. The CSS boot's turn for each comes from the caller (BootBeats). */
  banks: ReadonlyArray<{
    part: string;
    size: NonNullable<ComponentProps<typeof FloodlightBank>["size"]>;
    className: string;
  }>;
  /** Give each bank a flare layer for a timeline to tween. */
  flare: boolean;
}

/**
 * When each layer enters in the CSS boot, in seconds (the page multiplies by its --pace). Pass it as
 * ArenaBackdrop's `boot`; Main's values live with the Landing (LANDING_BEATS).
 */
export interface BootBeats {
  crowd: number;
  coneL: number;
  coneR: number;
  sky: number;
  field: number;
  pitch: number;
  /** Left to right: bank-1 .. bank-4. */
  banks: readonly [number, number, number, number];
}

// Class strings stay literal so Tailwind sees them.
const LAYOUT = {
  // Main.dc.html
  landing: {
    skyAlpha: 0.2,
    crowd: "-inset-x-30 top-95 h-90",
    field: { tilt: 70, oval: "h-190 w-310", className: "top-150 h-105" },
    pitch: "top-160 left-171 h-50 w-18",
    coneAlpha: 0.16,
    cones: {
      left: "top-17.5 left-15 h-190 w-130",
      right: "top-17.5 right-15 h-190 w-130",
    },
    masts: [
      { part: "mast-left", className: "top-29.5 left-37.5" },
      { part: "mast-right", className: "top-29.5 right-37.5" },
    ],
    banks: [
      { part: "bank-1", size: "lg", className: "top-17.5 left-24" },
      { part: "bank-2", size: "sm", className: "top-10 left-89" },
      { part: "bank-3", size: "sm", className: "top-10 right-89" },
      { part: "bank-4", size: "lg", className: "top-17.5 right-24" },
    ],
    flare: false,
  },
  // Intro.dc.html: lower crowd and field, wider cones, flat banks, no pitch glow or masts
  intro: {
    skyAlpha: 0.18,
    crowd: "-inset-x-30 top-132.5 h-75 opacity-60",
    field: { tilt: 72, oval: "h-175 w-325", className: "top-172.5 h-105" },
    pitch: null,
    coneAlpha: 0.14,
    cones: {
      left: "top-15 left-10 h-200 w-135",
      right: "top-15 right-10 h-200 w-135",
    },
    masts: [],
    banks: [
      { part: "bank-1", size: "lg-flat", className: "top-8.5 left-20" },
      { part: "bank-2", size: "sm-flat", className: "top-5 left-95" },
      { part: "bank-3", size: "sm-flat", className: "top-5 right-95" },
      { part: "bank-4", size: "lg-flat", className: "top-8.5 right-20" },
    ],
    flare: true,
  },
} as const satisfies Record<"landing" | "intro", LayoutSpec>;

/**
 * The floodlit stadium, laid out in the 1440×900 design space (0D's <Stage> scales it).
 * Every layer carries a `data-part` (sky, crowd, field, pitch, cone-left, cone-right, bank-1..4, mast-left,
 * mast-right) so the Landing's CSS and the Intro's timeline can address it without new props.
 * Banks run left to right: bank-1 and bank-4 are the large pair, bank-2 and bank-3 the small.
 */
export function ArenaBackdrop({
  layout = "landing",
  boot,
  dust = false,
  venue = "turf",
  bleed = false,
  layerClassName,
  className,
}: {
  /** "landing": Main's positions. "intro": the Intro artboard's (lower crowd and field, wider cones, flat banks with flare layers, no pitch glow or masts). */
  layout?: "landing" | "intro";
  /** The CSS boot: every layer fades in at its beat and the banks flicker on, at the page's --pace (the masts have no entrance). Omit it and the scene stands lit for a timeline to drive. */
  boot?: BootBeats;
  /** Dust drifting in the beams (desktop, motion allowed). */
  dust?: boolean;
  /** Re-tints every layer through the data-venue token overrides. */
  venue?: "turf" | "court" | "hall";
  /** Let the scene extend past 1440×900 into the Stage letterbox. */
  bleed?: boolean;
  /** A class for every layer that enters (sky, crowd, field, pitch, cones, banks, dust), so a screen can hold the whole scene back until its own show starts. */
  layerClassName?: string;
  className?: string;
}) {
  const spec: LayoutSpec = LAYOUT[layout];
  // A layer's boot: the shared fade class and its turn as --d (undefined without a boot).
  const fade = boot ? "animate-boot-fade" : undefined;
  const at = (beat: number | undefined): CSSProperties | undefined =>
    boot && beat !== undefined ? ({ "--d": `${beat}s` } as CSSProperties) : undefined;
  return (
    <div
      aria-hidden="true"
      data-venue={venue}
      data-layout={layout}
      className={cn(
        "pointer-events-none relative h-225 w-360 overflow-hidden bg-night",
        bleed && "overflow-visible bg-transparent",
        className,
      )}
    >
      <SkyGlow
        data-part="sky"
        alpha={spec.skyAlpha}
        className={cn(fade, layerClassName)}
        style={at(boot?.sky)}
      />
      <CrowdTier
        data-part="crowd"
        curved
        className={cn(spec.crowd, fade, layerClassName)}
        style={at(boot?.crowd)}
      />
      <Field
        data-part="field"
        tilt={spec.field.tilt}
        ovalClassName={spec.field.oval}
        className={cn(spec.field.className, fade, layerClassName)}
        style={at(boot?.field)}
      />
      {spec.pitch && (
        <PitchGlow
          data-part="pitch"
          className={cn(spec.pitch, fade, layerClassName)}
          style={at(boot?.pitch)}
        />
      )}
      <LightCone
        data-part="cone-left"
        side="left"
        alpha={spec.coneAlpha}
        className={cn(spec.cones.left, fade, layerClassName)}
        style={at(boot?.coneL)}
      />
      <LightCone
        data-part="cone-right"
        side="right"
        alpha={spec.coneAlpha}
        className={cn(spec.cones.right, fade, layerClassName)}
        style={at(boot?.coneR)}
      />
      {dust && <Dust regions={CONE_REGIONS[layout]} className={layerClassName} />}
      {spec.masts.map((mast) => (
        <FloodlightMast key={mast.part} data-part={mast.part} className={mast.className} />
      ))}
      {spec.banks.map((bank, i) => (
        <FloodlightBank
          key={bank.part}
          data-part={bank.part}
          size={bank.size}
          flare={spec.flare}
          flickerDelay={boot?.banks[i]}
          className={cn(bank.className, layerClassName)}
        />
      ))}
    </div>
  );
}
