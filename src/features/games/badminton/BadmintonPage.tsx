import type { ReactNode, Ref } from "react";
import type { GameLayout } from "../engine/types";
import { GamePage } from "../frame/GamePage";
import type { ThreeStatus } from "../three/useThreeGate";
import type { Dir } from "./3d/match";
import { BadmintonColumn } from "./BadmintonColumn";
import { BadmintonStage } from "./BadmintonStage";
import type { Badminton3dParts, Badminton3dPhase, BadmintonPhase, BadmintonView } from "./view";

/** The 3D game's part of the board: the gate, the scene (for the layout on screen only), whether a pick is taken, and the view's 3D parts. */
export interface BadmintonThree {
  status: ThreeStatus;
  /** The canvas on screen has drawn its first frame: until then the board keeps its backdrop over it. */
  drawn: boolean;
  progress: number;
  /** Drawn by `layout`'s board only, so there is one canvas. */
  scene: ReactNode | null;
  layout: GameLayout;
  /** The pick buttons and the swipe take a pick (the serve, a window, the rally shuttle). */
  live: boolean;
  parts: Badminton3dParts;
}

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
  onPick = none,
  onAgain = none,
  rootRef,
  shuttleRefs,
  three,
}: {
  view: BadmintonView;
  phase: BadmintonPhase | Badminton3dPhase;
  /** No live game (reduced motion): no meter and no hold button. */
  reduced?: boolean;
  onCharge?: () => void;
  onRelease?: () => void;
  /** The 3D game: your pick, deep or short. */
  onPick?: (dir: Dir) => void;
  onAgain?: () => void;
  rootRef?: Ref<HTMLElement>;
  /** The shuttle of each layout, which the flight moves. */
  shuttleRefs?: { stage: Ref<SVGGElement>; column: Ref<SVGGElement> };
  /** The 3D game: without it, the 2D board exactly as it always was. */
  three?: BadmintonThree;
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
        <BadmintonStage
          view={view}
          phase={phase}
          reduced={reduced}
          onCharge={onCharge}
          onRelease={onRelease}
          onPick={onPick}
          onAgain={onAgain}
          shuttleRef={shuttleRefs?.stage}
          three={on("stage")}
        />
      }
      column={
        <BadmintonColumn
          view={view}
          phase={phase}
          reduced={reduced}
          onCharge={onCharge}
          onRelease={onRelease}
          onPick={onPick}
          onAgain={onAgain}
          shuttleRef={shuttleRefs?.column}
          three={on("column")}
        />
      }
    />
  );
}
