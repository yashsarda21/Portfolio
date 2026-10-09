import type { Ref } from "react";
import { GameAnnouncer } from "../frame/GameAnnouncer";
import { BadmintonColumn } from "./BadmintonColumn";
import { BadmintonStage } from "./BadmintonStage";
import type { BadmintonPhase, BadmintonView } from "./view";

const none = () => {};

/**
 * Badminton as the game so far reads. From 1200px the stage, below it the one-thumb column; CSS shows exactly one, and
 * both draw the same `view`, so a resize keeps the game. The game's clock writes the meter's fill (`--power`) on this
 * root, which both layouts' meters read. The call and what it charged are read out by the announcer, phones too.
 */
export function BadmintonPage({
  view,
  phase,
  reduced = false,
  onCharge = none,
  onRelease = none,
  onAgain = none,
  rootRef,
  shuttleRefs,
}: {
  view: BadmintonView;
  phase: BadmintonPhase;
  /** No live game (reduced motion): no meter and no hold button. */
  reduced?: boolean;
  onCharge?: () => void;
  onRelease?: () => void;
  onAgain?: () => void;
  rootRef?: Ref<HTMLElement>;
  /** The shuttle of each layout, which the flight moves. */
  shuttleRefs?: { stage: Ref<SVGGElement>; column: Ref<SVGGElement> };
}) {
  return (
    <>
      <main id="main" ref={rootRef} data-game="" data-phase={phase}>
        <BadmintonStage
          view={view}
          phase={phase}
          reduced={reduced}
          onCharge={onCharge}
          onRelease={onRelease}
          onAgain={onAgain}
          shuttleRef={shuttleRefs?.stage}
        />
        <BadmintonColumn
          view={view}
          phase={phase}
          reduced={reduced}
          onCharge={onCharge}
          onRelease={onRelease}
          onAgain={onAgain}
          shuttleRef={shuttleRefs?.column}
        />
      </main>
      <GameAnnouncer line={view.announce} />
    </>
  );
}
