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

/**
 * The floodlit stadium, laid out in the 1440×900 design space (0D's <Stage> scales it).
 * Every layer carries a `data-part` (sky, crowd, field, pitch, cone-left, cone-right, bank-1..4, mast-left,
 * mast-right) so the Landing's CSS and the Intro's timeline can address it without new props.
 * Banks run left to right: bank-1 and bank-4 are the large pair, bank-2 and bank-3 the small.
 */
export function ArenaBackdrop({
  layout = "landing",
  boot = true,
  dust = false,
  venue = "turf",
  bleed = false,
  className,
}: {
  /** "landing": Main's positions. "intro": the Intro artboard's (lower crowd and field, wider cones, flat banks with flare layers, no pitch glow or masts). */
  layout?: "landing" | "intro";
  /** true: the banks flicker on by CSS, each at its own turn, at the page's --pace. false: they stand lit and a timeline drives them. */
  boot?: boolean;
  /** Dust drifting in the beams (desktop, motion allowed). */
  dust?: boolean;
  /** Re-tints every layer through the data-venue token overrides. */
  venue?: "turf" | "court" | "hall";
  /** Let the scene extend past 1440×900 into the Stage letterbox. */
  bleed?: boolean;
  className?: string;
}) {
  const intro = layout === "intro";
  // Seconds into the page that each bank flickers on (Main), only while the CSS boot runs.
  const turn = (seconds: number) => (boot ? seconds : undefined);
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
      <SkyGlow data-part="sky" alpha={intro ? 0.18 : undefined} />
      {intro ? (
        <CrowdTier data-part="crowd" curved className="-inset-x-30 top-132.5 h-75 opacity-60" />
      ) : (
        <CrowdTier data-part="crowd" curved className="-inset-x-30 top-95 h-90" />
      )}
      {intro ? (
        <Field
          data-part="field"
          tilt={72}
          ovalClassName="h-175 w-325"
          className="top-172.5 h-105"
        />
      ) : (
        <Field data-part="field" className="top-150 h-105" />
      )}
      {!intro && <PitchGlow data-part="pitch" className="top-160 left-171 h-50 w-18" />}
      <LightCone
        data-part="cone-left"
        side="left"
        alpha={intro ? 0.14 : undefined}
        className={intro ? "top-15 left-10 h-200 w-135" : "top-17.5 left-15 h-190 w-130"}
      />
      <LightCone
        data-part="cone-right"
        side="right"
        alpha={intro ? 0.14 : undefined}
        className={intro ? "top-15 right-10 h-200 w-135" : "top-17.5 right-15 h-190 w-130"}
      />
      {dust && <Dust regions={CONE_REGIONS[layout]} />}
      {!intro && <FloodlightMast data-part="mast-left" className="top-29.5 left-37.5" />}
      {!intro && <FloodlightMast data-part="mast-right" className="top-29.5 right-37.5" />}
      {intro ? (
        <>
          <FloodlightBank data-part="bank-1" size="lg-flat" flare className="top-8.5 left-20" />
          <FloodlightBank data-part="bank-2" size="sm-flat" flare className="top-5 left-95" />
          <FloodlightBank data-part="bank-3" size="sm-flat" flare className="top-5 right-95" />
          <FloodlightBank data-part="bank-4" size="lg-flat" flare className="top-8.5 right-20" />
        </>
      ) : (
        <>
          <FloodlightBank
            data-part="bank-1"
            size="lg"
            flickerDelay={turn(0.6)}
            className="top-17.5 left-24"
          />
          <FloodlightBank
            data-part="bank-2"
            size="sm"
            flickerDelay={turn(1.1)}
            className="top-10 left-89"
          />
          <FloodlightBank
            data-part="bank-3"
            size="sm"
            flickerDelay={turn(1.6)}
            className="top-10 right-89"
          />
          <FloodlightBank
            data-part="bank-4"
            size="lg"
            flickerDelay={turn(2)}
            className="top-17.5 right-24"
          />
        </>
      )}
    </div>
  );
}
