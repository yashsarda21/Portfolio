import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import type { SceneLayerProps } from "./layer";

interface FieldProps extends SceneLayerProps {
  tilt?: number;
  /** The oval's size: 1240x760 by default (`h-190 w-310`); the Intro's is 1300x700. */
  ovalClassName?: string;
}

/** Turf oval in perspective (Landing/Intro). Position the wrapper with className. */
export function Field({
  tilt = 70,
  ovalClassName,
  "data-part": part,
  className,
  style,
}: FieldProps) {
  return (
    <div
      aria-hidden="true"
      data-part={part}
      className={cn("pointer-events-none absolute inset-x-0 [perspective:900px]", className)}
      style={style}
    >
      <div
        className={cn("mx-auto h-190 w-310 scene-field", ovalClassName)}
        style={{ "--field-tilt": `${tilt}deg` } as CSSProperties}
      />
    </div>
  );
}
