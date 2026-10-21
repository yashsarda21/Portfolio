import type { ReactNode, Ref } from "react";
import type { GameLayout } from "../engine/types";
import { GamePage } from "../frame/GamePage";
import type { ThreeStatus } from "../three/useThreeGate";
import type { Side } from "./referee";
import { TennisColumn } from "./TennisColumn";
import { TennisStage } from "./TennisStage";
import type { Tennis3dPhase, TennisPhase, TennisView } from "./view";

/** The 3D game's part of the board: the gate, the scene (for the layout on screen only) and whether a pick is taken. */
export interface TennisThree {
  status: ThreeStatus;
  /** The canvas on screen has drawn its first frame: until then the board keeps its backdrop over it. */
  drawn: boolean;
  progress: number;
  /** Drawn by `layout`'s board only, so there is one canvas. */
  scene: ReactNode | null;
  layout: GameLayout;
  /** The aim buttons take a pick (toss, window, rally). */
  live: boolean;
  loading: string;
}

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
  three,
}: {
  view: TennisView;
  phase: TennisPhase | Tennis3dPhase;
  /** No live game (reduced motion): no zones to pick, no tracer. */
  reduced?: boolean;
  /** The side the last return was sent to. */
  shot?: Side | null;
  onPick?: (side: Side) => void;
  onAgain?: () => void;
  rootRef?: Ref<HTMLElement>;
  /** The ball of each layout, which the return's flight moves. */
  ballRefs?: { stage: Ref<SVGCircleElement>; column: Ref<SVGCircleElement> };
  /** The 3D game: without it, the 2D board exactly as it always was. */
  three?: TennisThree;
}) {
  const on = (layout: GameLayout) =>
    three && { ...three, scene: three.layout === layout ? three.scene : null };
  return (
    <GamePage
      phase={phase}
      announce={view.announce}
      rootRef={rootRef}
      three={three?.status}
      stage={
        <TennisStage
          view={view}
          phase={phase}
          reduced={reduced}
          shot={shot}
          onPick={onPick}
          onAgain={onAgain}
          ballRef={ballRefs?.stage}
          three={on("stage")}
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
          three={on("column")}
        />
      }
    />
  );
}
