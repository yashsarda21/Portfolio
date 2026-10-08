import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SkyGlow } from "../scene/SkyGlow";

interface StageProps {
  /** Scene drawn beneath the UI in the same 1440×900 space (e.g. <ArenaBackdrop bleed />). */
  backdrop?: ReactNode;
  /**
   * The width from which the stage shows (spec D2): "md" hides it below 768px (default), "lg" below
   * 1200px, null always shows it. Cinematic screens render their own layout where it is hidden.
   */
  from?: "md" | "lg" | null;
  className?: string;
  /** Class and style for the full-bleed letterbox sky, so a page can boot it with the rest of the scene. */
  skyClassName?: string;
  skyStyle?: CSSProperties;
  children: ReactNode;
}

/** Fixed 1440×900 design space scaled to fit the viewport; the scene bleeds into the letterbox (spec §4.4). */
export function Stage({
  backdrop,
  from = "md",
  className,
  skyClassName,
  skyStyle,
  children,
}: StageProps) {
  return (
    <div
      data-transition-scene
      className={cn(
        "relative h-dvh w-full overflow-hidden bg-night",
        from === "md" && "max-md:hidden",
        from === "lg" && "max-lg:hidden",
        className,
      )}
    >
      <SkyGlow data-part="letterbox-sky" className={skyClassName} style={skyStyle} />
      <div
        data-stage
        className="absolute top-1/2 left-1/2 h-225 w-360 [transform:translate(-50%,-50%)_scale(var(--stage-scale,1))] [--stage-body-min:calc(14px/var(--stage-scale,1))] [--stage-fit:var(--stage-scale,1)] [--stage-mono-min:calc(11px/var(--stage-scale,1))]"
      >
        {backdrop ? <div className="absolute inset-0">{backdrop}</div> : null}
        <div className="relative h-full w-full">{children}</div>
      </div>
    </div>
  );
}
