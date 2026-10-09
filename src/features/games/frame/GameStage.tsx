import type { ReactNode } from "react";
import { AudioToggle, Breadcrumb, GameBackdrop, HUD, SkipChip, Stage } from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import { useAudio } from "@/shell/audio";
import { CommentarySlot } from "@/shell/commentary";
import { QuickViewChip } from "@/shell/QuickViewChip";
import type { GameChrome } from "./chrome";

/**
 * The 1440×900 game board from 1200px (Cricket-Play, Tennis-Play, Badminton-Play): the HUD with the breadcrumb, the
 * score `bug`, QUICK VIEW and sound; COMM bottom left and SKIP bottom right. The game's own parts are `children`,
 * placed at board coordinates.
 */
export function GameStage({
  chrome,
  venue,
  bug,
  children,
}: {
  chrome: GameChrome;
  venue: "turf" | "court" | "hall";
  bug: ReactNode;
  children: ReactNode;
}) {
  const audio = useAudio();
  return (
    <Stage from="lg" backdrop={<GameBackdrop venue={venue} frame="stage" />}>
      <HUD
        fade
        className="absolute inset-x-0 top-0 z-10"
        left={<Breadcrumb as={ArenaLink} {...chrome.breadcrumb} />}
        center={bug}
        right={
          <>
            <QuickViewChip />
            <AudioToggle
              variant="icon"
              name={chrome.audio.name}
              on={audio.enabled}
              onToggle={audio.toggle}
            />
          </>
        }
      />
      {children}
      <CommentarySlot tag={chrome.commTag} className="absolute bottom-9 left-9 z-8" />
      <SkipChip
        variant="game"
        as={ArenaLink}
        to={chrome.skip.to}
        className="absolute right-9 bottom-9 z-8"
      >
        {chrome.skip.label}
      </SkipChip>
    </Stage>
  );
}
