import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SkyGlow } from "../scene/SkyGlow";

interface StageProps {
  /** Scene drawn beneath the UI in the same 1440×900 space (e.g. <ArenaBackdrop bleed />). */
  backdrop?: ReactNode;
  /** Hide below 768px — cinematic screens render a mobile layout instead (spec D2). */
  desktopOnly?: boolean;
  className?: string;
  children: ReactNode;
}

/** Fixed 1440×900 design space scaled to fit the viewport; the scene bleeds into the letterbox (spec §4.4). */
export function Stage({ backdrop, desktopOnly = true, className, children }: StageProps) {
  return (
    <div
      data-transition-scene
      className={cn(
        "relative h-dvh w-full overflow-hidden bg-night",
        desktopOnly && "max-md:hidden",
        className,
      )}
    >
      <SkyGlow />
      <div
        data-stage
        className="absolute top-1/2 left-1/2 h-225 w-360 [transform:translate(-50%,-50%)_scale(var(--stage-scale,1))]"
      >
        {backdrop ? <div className="absolute inset-0">{backdrop}</div> : null}
        <div className="relative h-full w-full">{children}</div>
      </div>
    </div>
  );
}
