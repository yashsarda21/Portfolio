import type { Ref } from "react";
import { GamePage } from "../frame/GamePage";
import type { Side } from "./referee";
import { TennisColumn } from "./TennisColumn";
import { TennisStage } from "./TennisStage";
import type { TennisPhase, TennisView } from "./view";

const none = () => {};

/**
 * Tennis as the game so far reads. From 1200px the stage, below it the one-thumb column; CSS shows exactly one, and
 * both draw the same `view`, so a resize keeps the game. The game's clock writes how much of the serve is drawn
 * (`--serve`) on this root, which both layouts' tracers read. The call and what it unlocked are read out by the
 * announcer, phones too.
 */
export function TennisPage({
  view,
  phase,
  reduced = false,
  shot = null,
  onPick = none,
  onAgain = none,
  rootRef,
  ballRefs,
}: {
  view: TennisView;
  phase: TennisPhase;
  /** No live game (reduced motion): no zones to pick, no tracer. */
  reduced?: boolean;
  /** The side the last return was sent to. */
  shot?: Side | null;
  onPick?: (side: Side) => void;
  onAgain?: () => void;
  rootRef?: Ref<HTMLElement>;
  /** The ball of each layout, which the return's flight moves. */
  ballRefs?: { stage: Ref<SVGCircleElement>; column: Ref<SVGCircleElement> };
}) {
  return (
    <GamePage
      phase={phase}
      announce={view.announce}
      rootRef={rootRef}
      stage={
        <TennisStage
          view={view}
          phase={phase}
          reduced={reduced}
          shot={shot}
          onPick={onPick}
          onAgain={onAgain}
          ballRef={ballRefs?.stage}
        />
      }
      column={
        <TennisColumn
          view={view}
          phase={phase}
          reduced={reduced}
          shot={shot}
          onPick={onPick}
          onAgain={onAgain}
          ballRef={ballRefs?.column}
        />
      }
    />
  );
}
