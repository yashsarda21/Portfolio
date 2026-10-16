import type { ReactNode } from "react";
import { GameBackdrop, SkipChip } from "@/design-system";
import { cn } from "@/lib/cn";
import { ArenaLink } from "@/shell/ArenaLink";
import { QuickViewChip } from "@/shell/QuickViewChip";
import type { GameChrome } from "./chrome";

/**
 * The phone and tablet game (Mobile-Game; below 1200px, so CSS shows exactly one of this and the stage). It fills the
 * screen: the score `bug` and SKIP in the top row, the `reveal` under them with QUICK VIEW right-aligned beneath it
 * (the board has none, A5), the in-field tags and rings in `field`, and the `thumb` zone at the bottom, under the
 * thumb and clear of the home bar. On a tablet it stands centred and a step up, as the Hub does. The `h1` is for
 * screen readers (the board draws no title). Keys work here too.
 *
 * On a short screen (a phone held sideways, under 500px tall) nothing may hide behind the thumb: the thumb zone
 * shrinks (its hint goes, the button is 64px) and QUICK VIEW moves up into the top row, beside SKIP.
 */
export function GameColumn({
  chrome,
  venue,
  bug,
  reveal,
  field,
  thumb,
  heading,
  scene,
  sceneHidden = false,
}: {
  chrome: GameChrome;
  venue: "turf" | "court" | "hall";
  bug: ReactNode;
  reveal: ReactNode;
  field?: ReactNode;
  thumb: ReactNode;
  heading: string;
  /** The 3D scene, when there is one: it replaces the backdrop and fills the screen's width. */
  scene?: ReactNode;
  /** The scene is there but not on screen yet (its shaders compile): it stays invisible, and the backdrop stays. */
  sceneHidden?: boolean;
}) {
  return (
    <div data-game-column="" className="relative h-dvh overflow-hidden bg-night lg:hidden">
      {scene ? (
        <div className={cn("absolute inset-0", sceneHidden && "invisible")}>{scene}</div>
      ) : null}
      <div className="relative mx-auto h-full max-w-160">
        {scene && !sceneHidden ? null : <GameBackdrop venue={venue} frame="column" />}
        <h1 className="sr-only">{heading}</h1>
        <div
          data-part="top"
          className="absolute inset-x-3 top-3.5 z-10 flex items-center justify-between md:inset-x-5 md:top-5"
        >
          {bug}
          <div className="flex items-center gap-2">
            <QuickViewChip tone="glass-line" className="hidden short:inline-flex" />
            {/* The name is the full "SKIP TO …" (it holds the visible word, 2.5.3); the chip draws SKIP →. */}
            <SkipChip
              variant="hub"
              as={ArenaLink}
              to={chrome.skip.to}
              aria-label={chrome.skip.label}
              className="h-11"
            >
              {chrome.skip.short}
            </SkipChip>
          </div>
        </div>
        <div className="absolute inset-x-3 top-18 z-10 flex flex-col items-end gap-2 md:inset-x-5 md:top-23">
          <div className="w-full">{reveal}</div>
          <QuickViewChip tone="glass-line" className="short:hidden" />
        </div>
        {field ? <div className="absolute inset-0 z-5">{field}</div> : null}
        <div
          data-part="thumb"
          className="pointer-events-none absolute inset-x-0 bottom-0 z-10 flex min-h-75 flex-col justify-end bg-linear-to-b from-ground/0 to-ground/92 to-30% px-5 pb-[calc(34px+env(safe-area-inset-bottom))] short:min-h-0 short:pb-[calc(12px+env(safe-area-inset-bottom))]"
        >
          <div className="pointer-events-auto flex flex-col items-center gap-4 short:gap-2 short:**:data-[part=hint]:hidden">
            {thumb}
          </div>
        </div>
      </div>
    </div>
  );
}
