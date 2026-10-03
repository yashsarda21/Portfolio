import { cn } from "@/lib/cn";
import { CrowdTier } from "./CrowdTier";
import { Field } from "./Field";
import { FloodlightBank } from "./FloodlightBank";
import { FloodlightMast } from "./FloodlightMast";
import { LightCone } from "./LightCone";
import { PitchGlow } from "./PitchGlow";
import { SkyGlow } from "./SkyGlow";

/** Main's floodlit stadium, laid out in the 1440×900 design space (0D's <Stage> scales it). */
export function ArenaBackdrop({
  venue = "turf",
  className,
}: {
  /** Re-tints every layer through the data-venue token overrides. */
  venue?: "turf" | "court" | "hall";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-venue={venue}
      className={cn("pointer-events-none relative h-225 w-360 overflow-hidden bg-night", className)}
    >
      <SkyGlow />
      <CrowdTier curved className="-inset-x-30 top-95 h-90" />
      <Field className="top-150 h-105" />
      <PitchGlow className="top-160 left-171 h-50 w-18" />
      <LightCone side="left" className="top-17.5 left-15 h-190 w-130" />
      <LightCone side="right" className="top-17.5 right-15 h-190 w-130" />
      <FloodlightMast className="top-29.5 left-37.5" />
      <FloodlightMast className="top-29.5 right-37.5" />
      <FloodlightBank size="lg" flickerDelay={0.6} className="top-17.5 left-24" />
      <FloodlightBank size="sm" flickerDelay={1.1} className="top-10 left-89" />
      <FloodlightBank size="sm" flickerDelay={1.6} className="top-10 right-89" />
      <FloodlightBank size="lg" flickerDelay={2} className="top-17.5 right-24" />
    </div>
  );
}
