import { expect, type Page } from "@playwright/test";
import { cssVar, stepUntil } from "./game";

/*
 * Cricket helpers shared by cricket.spec.ts and journeys.spec.ts: they all run on the paused fake clock
 * (see support/game.ts) and read the game root's `data-phase` and `--meter`.
 */

/** The game root: one per page. */
export const game = (page: Page) => page.locator("[data-game]");
export const phaseOf = (page: Page) => game(page).getAttribute("data-phase");

export const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("arena:v1") ?? "{}").state ?? {});

/** Moves the paused fake clock in 100 ms steps until the game is in one of `phases` (at most `maxMs` of game time). */
export async function advanceTo(page: Page, phases: string[], maxMs = 8000) {
  for (let spent = 0; spent <= maxMs; spent += 100) {
    const phase = await phaseOf(page);
    if (phase && phases.includes(phase)) return phase;
    await page.clock.runFor(100);
  }
  throw new Error(`the game never reached ${phases.join(" / ")} (it is in ${await phaseOf(page)})`);
}

/** Waits for the page to take a key (the game leaves "ready"), then lets the ball fly and the call hold. */
export async function pass(page: Page, until: string[] = ["ready", "verdict", "end"]) {
  await expect(game(page)).not.toHaveAttribute("data-phase", "ready");
  return advanceTo(page, until);
}

/** The meter sweeps its track once every 1.1 s (CRICKET_PERIOD_MS), there and back. */
export const PERIOD_MS = 1100;

/**
 * Moves the paused clock so the cursor will read about `at`, then presses Space. Two frames show which way the
 * cursor is going, one jump takes it near the target (a step by step walk costs a round trip per 10 ms), and
 * `stepUntil` settles the last few ms.
 */
export async function release(page: Page, at: [number, number]) {
  const centre = (at[0] + at[1]) / 2;
  const first = await cssVar(page, "--meter");
  await page.clock.runFor(32);
  const second = await cssVar(page, "--meter");
  if (second !== first) {
    const up = second > first;
    // Fractions of a sweep still to run: to the end of this leg, then back, as far as the target needs.
    const toEnd = up ? 1 - second : second;
    const direct = up ? centre - second : second - centre;
    const sweeps = direct >= 0 ? direct : toEnd + (up ? 1 - centre : centre);
    await page.clock.runFor(Math.max(0, Math.floor(sweeps * PERIOD_MS) - 40));
  }
  await stepUntil(
    page,
    () => cssVar(page, "--meter"),
    (v) => v >= at[0] && v <= at[1],
  );
  await page.keyboard.press("Space");
}
export const perfect: [number, number] = [0.49, 0.51];
/** Far from the middle: a miss (SIX), whichever way the cursor is going. */
export const miss: [number, number] = [0, 0.15];

/** A whole over of perfect balls, then on to the end buttons. */
export async function perfectOver(page: Page) {
  for (let ball = 0; ball < 3; ball++) {
    await release(page, perfect);
    await pass(page);
  }
  await advanceTo(page, ["end"]);
}
