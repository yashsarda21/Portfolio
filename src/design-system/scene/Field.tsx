import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/** Turf oval in perspective (Landing/Intro). Position the wrapper with className. */
export function Field({ tilt = 70, className }: { tilt?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-x-0 [perspective:900px]", className)}
    >
      <div
        className="mx-auto h-190 w-310 scene-field"
        style={{ "--field-tilt": `${tilt}deg` } as CSSProperties}
      />
    </div>
  );
}
