import type { ComponentProps, CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { CONE_REGIONS } from "./cones";
import { CrowdTier, type CrowdShape } from "./CrowdTier";
import { Dust } from "./Dust";
import { Field } from "./Field";
import { FloodlightBank } from "./FloodlightBank";
import { FloodlightMast } from "./FloodlightMast";
import { GridFloor } from "./GridFloor";
import { LightCone } from "./LightCone";
import { PitchGlow } from "./PitchGlow";
import { SkyGlow } from "./SkyGlow";
import { VenueGlow } from "./VenueGlow";

interface LayoutSpec {
  /** The scene's box: the 1440x900 design space, or (column) whatever screen it sits behind. */
  frame: string;
  /** What `bleed` changes about the box: let the scene extend past 1440x900 into the Stage letterbox. */
  bleed: string;
  /** "enters": the washes (sky, crowd, field, pitch, cones) take the boot, the layer class and a data-part. "static": scenery that is just there (the layer class is for the banks only; a boot still fades the washes in). */
  wash: "enters" | "static";
  sky: { alpha: number; x?: string; w?: string; h?: string };
  /** The venue's own glow along the bottom, or null where the artboard draws none. */
  glow: { y: string; w: string; h: string; alpha: number } | null;
  /** A volt glow rising from the floor, the same under every venue (the Hub's). Unset where the artboard draws none. */
  floorGlow?: { x: string; y: string; w: string; h: string; alpha: number };
  crowd: { shape: CrowdShape; alpha?: number; className: string };
  /** The perspective turf, or null (the phone column has none). */
  field: { tilt: number; oval: string; className: string } | null;
  /** The pitch glow's classes, or null where the artboard draws none. */
  pitch: string | null;
  /** The light cones, or null (the phone column has none). Their numbers are CONE_BOXES in cones.ts (Scene.test.tsx checks the match). */
  cones: { alpha: number; left: string; right: string } | null;
  masts: ReadonlyArray<{ part: string; className: string }>;
  /** A box the banks hang in, where they are placed against something other than the scene's own edge. */
  banksFrame: string | null;
  /** Left to right. The CSS boot's turn for each comes from the caller (BootBeats). */
  banks: ReadonlyArray<
    Pick<ComponentProps<typeof FloodlightBank>, "size" | "flat"> & {
      part: string;
      className: string;
    }
  >;
  /** Give each bank a flare layer for a timeline to tween. */
  flare: boolean;
  /** The Hub's grid floor (GridFloor, at its own place). Unset where the artboard draws none. */
  grid?: boolean;
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
const STAGE_FRAME = "relative h-225 w-360 overflow-hidden bg-night";
const STAGE_BLEED = "overflow-visible bg-transparent";

const LAYOUT = {
  // Main.dc.html
  landing: {
    frame: STAGE_FRAME,
    bleed: STAGE_BLEED,
    wash: "enters",
    sky: { alpha: 0.2 },
    glow: null,
    crowd: { shape: "curved", className: "-inset-x-30 top-95 h-90" },
    field: { tilt: 70, oval: "h-190 w-310", className: "top-150 h-105" },
    pitch: "top-160 left-171 h-50 w-18",
    cones: {
      alpha: 0.16,
      left: "top-17.5 left-15 h-190 w-130",
      right: "top-17.5 right-15 h-190 w-130",
    },
    masts: [
      { part: "mast-left", className: "top-29.5 left-37.5" },
      { part: "mast-right", className: "top-29.5 right-37.5" },
    ],
    banksFrame: null,
    banks: [
      { part: "bank-1", size: "lg", className: "top-17.5 left-24" },
      { part: "bank-2", size: "sm", className: "top-10 left-89" },
      { part: "bank-3", size: "sm", className: "top-10 right-89" },
      { part: "bank-4", size: "lg", className: "top-17.5 right-24" },
    ],
    flare: false,
  },
  // Intro.dc.html: lower crowd and field, wider cones, flat banks, no pitch glow or masts. D-5 (spec 11.4): the
  // banks hang 76px down, not 34 / 20 (the artboard's), at the artboard's x: the HUD's controls end at y 60 and
  // the board starts at y 136, so every housing has 16px above (8px on a 768px tablet's scaled stage) and
  // below it. The cone boxes follow, so each beam still starts under its lamp.
  intro: {
    frame: STAGE_FRAME,
    bleed: STAGE_BLEED,
    wash: "enters",
    sky: { alpha: 0.18 },
    glow: null,
    crowd: { shape: "curved", className: "-inset-x-30 top-132.5 h-75 opacity-60" },
    field: { tilt: 72, oval: "h-175 w-325", className: "top-172.5 h-105" },
    pitch: null,
    cones: {
      alpha: 0.14,
      left: "top-25.5 left-10 h-189.5 w-135",
      right: "top-25.5 right-10 h-189.5 w-135",
    },
    masts: [],
    banksFrame: null,
    banks: [
      { part: "bank-1", size: "lg", flat: true, className: "top-19 left-20" },
      { part: "bank-2", size: "sm", flat: true, className: "top-19 left-95" },
      { part: "bank-3", size: "sm", flat: true, className: "top-19 right-95" },
      { part: "bank-4", size: "lg", flat: true, className: "top-19 right-20" },
    ],
    flare: true,
  },
  // Mobile-Landing: the phone's (and a tablet's) column. Two small banks hang over the column's own edges
  // (centred at most 640px wide), over a sky and venue glow and a flat crowd band. The banks sit 80px down:
  // clear of the top row (it ends at 60px) and short of the board (never above 116px, see ScreenColumn).
  // With a boot the washes enter like the stage's (sky, glow on the field's turn, crowd) and the banks flicker
  // left then right; without one the scene stands lit, and only the banks take layerClassName.
  column: {
    frame: "absolute inset-0 overflow-hidden",
    bleed: "",
    wash: "static",
    sky: { alpha: 0.2, w: "90%", h: "40%" },
    glow: { y: "100%", w: "120%", h: "30%", alpha: 0.35 },
    crowd: { shape: "flat", alpha: 0.22, className: "-inset-x-5 top-105 h-40 opacity-100" },
    field: null,
    pitch: null,
    cones: null,
    masts: [],
    banksFrame: "relative mx-auto h-full max-w-160",
    banks: [
      { part: "bank-1", size: "mobile", className: "top-20 left-7.5" },
      { part: "bank-2", size: "mobile", className: "top-20 right-7.5" },
    ],
    flare: false,
  },
  // Hub.dc.html: the sky leans right, a volt glow rises from the floor, a faint crowd strip and a grid floor.
  // No banks, cones, field or masts: the venue cards carry their own lights.
  hub: {
    frame: STAGE_FRAME,
    bleed: STAGE_BLEED,
    wash: "enters",
    sky: { alpha: 0.16, x: "60%", w: "70%", h: "40%" },
    glow: null,
    floorGlow: { x: "60%", y: "105%", w: "80%", h: "40%", alpha: 0.07 },
    crowd: {
      shape: "stand",
      alpha: 0.2,
      className: "left-70 -right-15 top-22.5 h-55 opacity-60 scene-crowd-fade",
    },
    field: null,
    pitch: null,
    cones: null,
    masts: [],
    banksFrame: null,
    banks: [],
    flare: false,
    grid: true,
  },
} as const satisfies Record<"landing" | "intro" | "column" | "hub", LayoutSpec>;

/**
 * The floodlit stadium. The stage layouts ("landing", "intro") are laid out in the 1440×900 design space
 * (0D's <Stage> scales it); "column" is the phone's: it fills the screen behind it.
 * Every layer that a page addresses carries a `data-part` (sky, crowd, field, pitch, cone-left, cone-right,
 * dust, bank-1..4, mast-left, mast-right) so the Landing's CSS and the Intro's timeline can find it without
 * new props. Banks run left to right: on a stage bank-1 and bank-4 are the large pair, bank-2 and bank-3 the
 * small; the column has bank-1 and bank-2.
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
  /** "hub": the Arena Hub's (a sky leaning right, a volt floor glow, a faint crowd strip, a grid floor; no banks). "landing": Main's positions. "intro": the Intro artboard's (lower crowd and field, wider cones, flat banks with flare layers, no pitch glow or masts). "column": the phone and tablet column's (sky and venue glow, a flat crowd band, two small banks). */
  layout?: keyof typeof LAYOUT;
  /** The CSS boot: every layer fades in at its beat and the banks flicker on, at the page's --pace (the masts have no entrance). The column takes it too: its venue glow enters on the field's beat, and its two banks flicker at the first two bank beats. Omit it and the scene stands lit for a timeline to drive. */
  boot?: BootBeats;
  /** Dust drifting in the beams (the stage layouts; it is drawn on desktop with motion allowed). Fades in with the left cone. */
  dust?: boolean;
  /** Re-tints every layer through the data-venue token overrides. */
  venue?: "turf" | "court" | "hall";
  /** Let the scene extend past 1440×900 into the Stage letterbox. */
  bleed?: boolean;
  /** A class for every layer that enters (sky, crowd, field, pitch, cones, banks, dust), so a screen can hold the whole scene back until its own show starts. The column's static washes do not enter: its banks do. */
  layerClassName?: string;
  className?: string;
}) {
  const spec: LayoutSpec = LAYOUT[layout];
  const enters = spec.wash === "enters";
  // A layer's boot: the shared fade class and its turn as --d (undefined without a boot).
  const fade = boot ? "animate-boot-fade" : undefined;
  const at = (beat: number | undefined): CSSProperties | undefined =>
    boot && beat !== undefined ? ({ "--d": `${beat}s` } as CSSProperties) : undefined;
  // What a layer gets from the page: a name, the boot's fade, the held class and its turn (none of it in a static wash).
  const layer = (part: string, own?: string, beat?: number) =>
    enters
      ? { "data-part": part, className: cn(own, fade, layerClassName), style: at(beat) }
      : boot
        ? { "data-part": part, className: cn(own, fade), style: at(beat) }
        : { className: own };
  const banks = spec.banks.map((bank, i) => (
    <FloodlightBank
      key={bank.part}
      data-part={bank.part}
      size={bank.size}
      flat={"flat" in bank ? bank.flat : undefined}
      flare={spec.flare}
      flickerDelay={boot?.banks[i]}
      className={cn(bank.className, layerClassName)}
    />
  ));
  return (
    <div
      aria-hidden="true"
      data-venue={venue}
      data-layout={layout}
      className={cn("pointer-events-none", spec.frame, bleed && spec.bleed, className)}
    >
      <SkyGlow
        alpha={spec.sky.alpha}
        x={spec.sky.x}
        w={spec.sky.w}
        h={spec.sky.h}
        {...layer("sky", undefined, boot?.sky)}
      />
      {spec.glow && <VenueGlow {...spec.glow} {...layer("venue", undefined, boot?.field)} />}
      {spec.floorGlow && (
        <VenueGlow {...spec.floorGlow} {...layer("floor-glow", "scene-glow-volt", boot?.field)} />
      )}
      <CrowdTier
        shape={spec.crowd.shape}
        alpha={spec.crowd.alpha}
        {...layer("crowd", spec.crowd.className, boot?.crowd)}
      />
      {spec.grid && <GridFloor {...layer("grid", undefined, boot?.field)} />}
      {spec.field && (
        <Field
          tilt={spec.field.tilt}
          ovalClassName={spec.field.oval}
          {...layer("field", spec.field.className, boot?.field)}
        />
      )}
      {spec.pitch && <PitchGlow {...layer("pitch", spec.pitch, boot?.pitch)} />}
      {spec.cones && (
        <>
          <LightCone
            side="left"
            alpha={spec.cones.alpha}
            {...layer("cone-left", spec.cones.left, boot?.coneL)}
          />
          <LightCone
            side="right"
            alpha={spec.cones.alpha}
            {...layer("cone-right", spec.cones.right, boot?.coneR)}
          />
        </>
      )}
      {dust && (layout === "landing" || layout === "intro") && (
        <Dust regions={CONE_REGIONS[layout]} {...layer("dust", undefined, boot?.coneL)} />
      )}
      {spec.masts.map((mast) => (
        <FloodlightMast key={mast.part} data-part={mast.part} className={mast.className} />
      ))}
      {spec.banksFrame ? <div className={spec.banksFrame}>{banks}</div> : banks}
    </div>
  );
}
