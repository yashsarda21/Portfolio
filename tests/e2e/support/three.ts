import type { Page } from "@playwright/test";
import { ui } from "../../../src/content/ui-copy";
import { waitForHydration } from "./contentPage";
import { phaseOf } from "./cricket";
import { freezeClock, pauseClock } from "./game";

/*
 * Helpers for the 3D games' specs (the desktop-3d and mobile-3d projects). Software WebGL draws slowly, so time moves
 * in jumps: the scene is a function of its clock, so a jump draws one frame where `runFor` would draw one per 16 ms,
 * and lands in the same place.
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
export async function untilPhase(page: Page, phases: string[], maxMs = 20_000) {
  for (let spent = 0; spent <= maxMs; spent += 250) {
    const phase = await phaseOf(page);
    if (phase && phases.includes(phase)) return phase;
    await jump(page, 250);
  }
  throw new Error(`the game never reached ${phases.join(" / ")} (it is in ${await phaseOf(page)})`);
}

export type Side = "left" | "right";
const AIM = ui.games.tennis.aim;
const onStage = (page: Page) => page.locator("[data-stage]").isVisible();
/** The phone's ← / → half for `side` (its name starts with "Return to the left", the open one's adds "— open court"). */
const half = (page: Page, side: Side) =>
  page.locator(`[data-game-column] [data-part=thumb] button[aria-label^="${AIM.to[side]}"]`);

/** Tennis: sends your shot to `side`, with its arrow on the stage, a tap on its half on the phone (a click without touch). */
export async function pickSide(page: Page, side: Side) {
  if (await onStage(page)) {
    await page.keyboard.press(side === "left" ? "ArrowLeft" : "ArrowRight");
    return;
  }
  const touch = await page.evaluate(() => "ontouchstart" in window);
  if (touch) await half(page, side).tap({ force: true });
  else await half(page, side).click({ force: true });
}

/** Tennis: the side lit as open now (the stage's aim zone whose `data-state` is open, or the phone's lit half). */
async function openSide(page: Page): Promise<Side> {
  const lit = (await onStage(page))
    ? page.locator("[data-stage] [data-state=open]")
    : page.locator(
        `[data-game-column] [data-part=thumb] button[aria-label$="${AIM.dash} ${AIM.openName}"]`,
      );
  const name = await lit.getAttribute("aria-label");
  return name?.startsWith(AIM.to.left) ? "left" : "right";
}

/** Tennis: your shot to the open side. */
export const pickOpen = async (page: Page) => pickSide(page, await openSide(page));
/** Tennis: your shot to the side Yash covers. */
export const pickWrong = async (page: Page) =>
  pickSide(page, (await openSide(page)) === "left" ? "right" : "left");
