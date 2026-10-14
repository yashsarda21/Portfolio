import type { ReactNode, Ref } from "react";
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
}: {
  phase: string;
  /** What a screen reader hears: change it to say it. */
  announce: string;
  rootRef?: Ref<HTMLElement>;
  stage: ReactNode;
  column: ReactNode;
}) {
  return (
    <>
      <main id="main" ref={rootRef} data-game="" data-phase={phase}>
        {stage}
        {column}
      </main>
      <GameAnnouncer line={announce} />
    </>
  );
}
