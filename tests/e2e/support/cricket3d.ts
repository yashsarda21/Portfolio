import { expect, type Page } from "@playwright/test";
import { ui } from "../../../src/content/ui-copy";
import { CRICKET_PERIOD_MS } from "../../../src/features/games/cricket/referee";
import { RUNUP } from "../../../src/features/games/cricket/3d/sequence";
import { waitForHydration } from "./contentPage";
import { game, phaseOf } from "./cricket";
import { cssVar, freezeClock, pauseClock, stepUntil } from "./game";

/*
 * 3D cricket helpers (cricket-3d.spec.ts, the desktop-3d and mobile-3d projects). Software WebGL draws slowly, so
 * time moves in jumps: the scene is a function of its clock, so a jump draws one frame where `runFor` would draw one
 * per 16 ms, and lands in the same place.
 */

/** Opens `url` on the fake clock, waits (real time) for the 3D game to be ready, then stops time. */
export async function open3d(page: Page, url: string) {
  await freezeClock(page);
  await page.goto(url);
  await waitForHydration(page);
  await page.locator("[data-game][data-three=ready]").waitFor({ timeout: 30_000 });
  await pauseClock(page);
}

/** Moves the paused clock `ms` forward in 250 ms jumps: each fires the timers due and one frame. */
export async function jump(page: Page, ms: number) {
  for (let left = ms; left > 0; left -= 250) await page.clock.fastForward(Math.min(250, left));
}

/** Jumps until the game is in one of `phases` (at most `maxMs` of game time); returns the phase. */
export async function untilPhase(page: Page, phases: string[], maxMs = 12_000) {
  for (let spent = 0; spent <= maxMs; spent += 250) {
    const phase = await phaseOf(page);
    if (phase && phases.includes(phase)) return phase;
    await jump(page, 250);
  }
  throw new Error(`the game never reached ${phases.join(" / ")} (it is in ${await phaseOf(page)})`);
}

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
