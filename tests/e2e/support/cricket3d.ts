import { expect, type Page } from "@playwright/test";
import { ui } from "../../../src/content/ui-copy";
import { CRICKET_PERIOD_MS } from "../../../src/features/games/cricket/referee";
import { RUNUP } from "../../../src/features/games/cricket/3d/sequence";
import { game } from "./cricket";
import { cssVar, stepUntil } from "./game";
import { jump } from "./three";

/* 3D cricket helpers (cricket-3d.spec.ts); the ones every 3D game uses live in three.ts. */

export { jump, open3d, untilPhase } from "./three";

/** Whatever starts the run-up and releases: Space on the stage, a tap on BOWL / RELEASE on the phone. */
export type Press = (page: Page) => Promise<void>;
export const space: Press = (page) => page.keyboard.press("Space");
export const tapBowl: Press = (page) =>
  page
    .locator("[data-game-column] [data-part=thumb] button[data-game-control]")
    .last()
    .tap({ force: true });

/**
 * Bowls one ball released where the meter reads inside `range`: the run-up starts, time jumps to just before the
 * sweep reaches the range, `stepUntil` settles the last few ms, and the second press releases it.
 */
export async function bowlAt(page: Page, range: [number, number], press: Press = space) {
  await press(page);
  await expect(game(page)).toHaveAttribute("data-phase", "runup");
  const lead = Math.max(0, RUNUP.approach * 1000 + range[0] * CRICKET_PERIOD_MS - 40);
  await jump(page, lead);
  await stepUntil(
    page,
    () => cssVar(page, "--meter"),
    (v) => v >= range[0] && v <= range[1],
  );
  await press(page);
}

/** The meter's places: the centre (a yorker, perfect), a little early (good on both layouts), very early (short). */
export const perfect: [number, number] = [0.49, 0.51];
export const good: [number, number] = [0.4, 0.43];
export const early: [number, number] = [0.05, 0.15];

/** The score bug of the layout on screen says ball `n` is next ("BALL 2 OF 3" / "YOU BOWLING · 2/3"), or the over is done. */
export async function expectBallNo(page: Page, n: 1 | 2 | 3 | "over") {
  const c = ui.games.cricket;
  const bug = page.locator(`[data-game] [role=group][aria-label="${ui.games.bug}"]:visible`);
  const stage = await page.locator("[data-stage]").isVisible();
  await expect(bug).toContainText(
    n === "over" ? c.over : stage ? `${c.ball} ${n} ${c.of} 3` : `${n}/3`,
  );
}
