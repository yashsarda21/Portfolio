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
  scene,
  children,
}: {
  chrome: GameChrome;
  venue: "turf" | "court" | "hall";
  bug: ReactNode;
  /** The 3D scene, when there is one: it replaces the backdrop and fills the viewport under the board. */
  scene?: ReactNode;
  children: ReactNode;
}) {
  const audio = useAudio();
  return (
    <Stage
      from="lg"
      underlay={scene}
      backdrop={scene ? undefined : <GameBackdrop venue={venue} frame="stage" />}
    >
      <HUD
        fade
        // The boards space the three groups out (justify-content: space-between), so the score bug sits where the
        // breadcrumb's and the controls' widths put it, not on the centre line.
        className="absolute inset-x-0 top-0 z-10 flex justify-between"
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
      {/* The game's announcer says each call: the bar's own live region would say it a second time. */}
      <CommentarySlot tag={chrome.commTag} live={false} className="absolute bottom-9 left-9 z-8" />
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
