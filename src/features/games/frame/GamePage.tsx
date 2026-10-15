import type { ReactNode, Ref } from "react";
import type { ThreeStatus } from "../three/useThreeGate";
import { GameAnnouncer } from "./GameAnnouncer";

/**
 * The page every game stands on: one `main` holding both layouts (CSS shows exactly one: the stage from 1200px, the
 * column below), so a resize keeps the game, and the announcer that reads out each call, phones too. `main` is the
 * game's root: it carries the phase for tests and styles, and the game's clock writes its meters there (`rootRef`).
 */
export function GamePage({
  phase,
  announce,
  rootRef,
  stage,
  column,
  three,
}: {
  phase: string;
  /** What a screen reader hears: change it to say it. */
  announce: string;
  rootRef?: Ref<HTMLElement>;
  stage: ReactNode;
  column: ReactNode;
  /** The 3D gate's state, for tests and styles. */
  three?: ThreeStatus;
}) {
  return (
    <>
      <main id="main" ref={rootRef} data-game="" data-phase={phase} data-three={three}>
        {stage}
        {column}
      </main>
      <GameAnnouncer line={announce} />
    </>
  );
}
