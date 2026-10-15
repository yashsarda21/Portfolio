import type { ReactNode, Ref } from "react";
import type { GameLayout } from "../engine/types";
import { GamePage } from "../frame/GamePage";
import type { ThreeStatus } from "../three/useThreeGate";
import { CricketColumn } from "./CricketColumn";
import { CricketStage } from "./CricketStage";
import type { CricketAim } from "./referee";
import type { Cricket3dControls, CricketPhase, CricketView } from "./view";

/** The 3D game's part of the board: the gate, the scene (for the layout on screen only) and its controls. */
export interface CricketThree {
  status: ThreeStatus;
  progress: number;
  /** Drawn by `layout`'s board only, so there is one canvas. */
  scene: ReactNode | null;
  layout: GameLayout;
  controls: Cricket3dControls;
  onLine(line: CricketAim): void;
}

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
  three,
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
  /** The 3D game: without it, the 2D board exactly as it always was. */
  three?: CricketThree;
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
        <CricketStage
          view={view}
          phase={phase}
          reduced={reduced}
          onBowl={onBowl}
          onAgain={onAgain}
          ballRef={ballRefs?.stage}
          three={on("stage")}
        />
      }
      column={
        <CricketColumn
          view={view}
          phase={phase}
          reduced={reduced}
          onBowl={onBowl}
          onAgain={onAgain}
          ballRef={ballRefs?.column}
          three={on("column")}
        />
      }
    />
  );
}
