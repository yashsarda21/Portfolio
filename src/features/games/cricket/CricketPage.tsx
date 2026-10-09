import type { Ref } from "react";
import { GameAnnouncer } from "../frame/GameAnnouncer";
import { CricketColumn } from "./CricketColumn";
import { CricketStage } from "./CricketStage";
import type { CricketPhase, CricketView } from "./view";

const none = () => {};

/**
 * Cricket as the over so far reads. From 1200px the stage, below it the one-thumb column; CSS shows exactly one, and
 * both draw the same `view`, so a resize keeps the game. The game's clock writes the meter's place (`--meter`) on this
 * root, which both layouts' meters read. The call and what it unlocked are read out by the announcer, phones too.
 */
export function CricketPage({
  view,
  phase,
  reduced = false,
  onBowl = none,
  onAgain = none,
  rootRef,
  ballRefs,
}: {
  view: CricketView;
  phase: CricketPhase;
  /** No live game (reduced motion): no meter and no BOWL button. */
  reduced?: boolean;
  onBowl?: () => void;
  onAgain?: () => void;
  rootRef?: Ref<HTMLElement>;
  /** The ball dot of each layout, which the flight moves. */
  ballRefs?: { stage: Ref<HTMLSpanElement>; column: Ref<HTMLSpanElement> };
}) {
  return (
    <>
      <main id="main" ref={rootRef} data-game="" data-phase={phase}>
        <CricketStage
          view={view}
          phase={phase}
          reduced={reduced}
          onBowl={onBowl}
          onAgain={onAgain}
          ballRef={ballRefs?.stage}
        />
        <CricketColumn
          view={view}
          phase={phase}
          reduced={reduced}
          onBowl={onBowl}
          onAgain={onAgain}
          ballRef={ballRefs?.column}
        />
      </main>
      <GameAnnouncer line={view.announce} />
    </>
  );
}
