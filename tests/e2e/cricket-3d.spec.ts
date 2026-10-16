import { expect as baseExpect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { expectNoA11yViolations } from "../support/a11y";
import { waitForHydration } from "./support/contentPage";
import { game, pass, phaseOf, release, stored } from "./support/cricket";
import {
  bowlAt,
  early,
  expectBallNo,
  good,
  jump,
  open3d,
  perfect,
  space,
  tapBowl,
  untilPhase,
  type Press,
} from "./support/cricket3d";
import { freezeClock, pauseClock } from "./support/game";

// The 3D game in software WebGL (the desktop-3d and mobile-3d projects): slow to draw, so time moves in jumps. While
// the software GPU catches up with the frames a jump drew, the browser's own frames wait (CSS animations, a media
// query's change), so assertions get longer than the usual 5 s.
test.describe.configure({ timeout: 120_000 });
const expect = baseExpect.configure({ timeout: 20_000 });

const cricket = ui.games.cricket;
const URL = "/arena/cricket";

/** Collects the page's errors: the 3D game must never reach the console with one. */
function watchErrors(page: Page, allow: RegExp[] = []): string[] {
  const errors: string[] = [];
  const keep = (text: string) => !allow.some((a) => a.test(text)) && errors.push(text);
  page.on("pageerror", (e) => keep(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") keep(m.text());
  });
  return errors;
}

const stage = (page: Page) => page.locator("[data-stage]").isVisible();
/** The phone bowls with taps, the stage with Space. */
const pressFor = async (page: Page): Promise<Press> => ((await stage(page)) ? space : tapBowl);
/** The big call of the layout on screen. */
const call = (page: Page) => page.locator("[data-game] [data-tone]:visible");
const canvases = (page: Page) => page.locator("canvas");
const line = (page: Page, name: string) =>
  page.locator(`[data-game] [data-part=lines]:visible`).getByRole("button", { name });

/**
 * Where the parts around the 3D's arrival sit: SKIP, the score bug, and the stage's STADIUM SCREEN or the phone's thumb
 * zone (which grows from the loader to the controls).
 */
async function around(page: Page) {
  const parts = [
    page.locator("[data-game] a[href='/career']:visible").first(),
    page.locator(`[data-game] [role=group][aria-label="${ui.games.bug}"]:visible`),
    (await stage(page))
      ? page.locator(`[data-game] section[aria-label="${cricket.screen}"]:visible`)
      : page.locator("[data-game-column] [data-part=thumb] > div"),
  ];
  return Promise.all(parts.map((p) => p.boundingBox()));
}

test("the loader shows while the files download, then one canvas and no drawn ball; nothing moves when the 3D arrives", async ({
  page,
}) => {
  const errors = watchErrors(page);
  // Hold one file back until the loader has been seen.
  let letGo = () => {};
  const held = new Promise<void>((resolve) => (letGo = resolve));
  await page.route("**/models/moves.glb", async (route) => {
    await held;
    await route.continue();
  });
  await freezeClock(page);
  await page.goto(URL);
  await waitForHydration(page);
  await expect(game(page)).toHaveAttribute("data-three", "loading");
  await expect(page.getByRole("progressbar", { name: cricket.loading })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const before = await around(page);
  letGo();
  await page.locator("[data-game][data-three=ready]").waitFor({ timeout: 30_000 });
  await pauseClock(page);
  await jump(page, 500);
  // The loading board reserves the controls' place: the swap to the 3D shifts nothing (Lighthouse's CLS).
  expect(before.every(Boolean)).toBe(true);
  expect(await around(page)).toEqual(before);

  await expect(canvases(page)).toHaveCount(1);
  await expect(page.locator("[data-part=ball]")).toHaveCount(0);
  await expect(line(page, cricket.line.middle)).toHaveAttribute("aria-pressed", "true");
  // axe waits on timers, which the fake clock holds: time runs for the scan.
  await page.clock.resume();
  await expectNoA11yViolations(page);
  expect(errors).toEqual([]);
});

test("an over: a beaten dot on OFF, a FOUR, a SIX off a short one; 10 not out is saved", async ({
  page,
}) => {
  const errors = watchErrors(page);
  await open3d(page, URL);
  const desktop = await stage(page);
  const press = await pressFor(page);

  // The line: ← on the stage, a tap on OFF on the phone.
  if (desktop) await page.keyboard.press("ArrowLeft");
  else await line(page, cricket.line.off).tap({ force: true });
  await expect(line(page, cricket.line.off)).toHaveAttribute("aria-pressed", "true");
  // The change is said: the arrows press buttons that do not have the focus.
  await expect(page.locator("[data-game] + [aria-live=polite]")).toHaveText(
    cricket.line.said.replace("{line}", cricket.line.off),
  );
  if (desktop) {
    // A click picks a line without taking the focus: the next Space bowls (it does not press OFF again).
    await line(page, cricket.line.middle).click({ force: true });
    await line(page, cricket.line.off).click({ force: true });
    await expect(line(page, cricket.line.off)).toHaveAttribute("aria-pressed", "true");
    await expect(line(page, cricket.line.off)).not.toBeFocused();
  }
  await expectBallNo(page, 1);

  await bowlAt(page, perfect, press);
  await expect(game(page)).toHaveAttribute("data-phase", "flight");
  await expect(page.locator("[data-part=speed]:visible")).toHaveText(
    new RegExp(`^14[2-5] ${ui.games.kmh}$`),
  );
  await untilPhase(page, ["called"]);
  await expect(call(page)).toHaveText(cricket.calls.dot);
  await jump(page, 500); // the arrival line steps out for the ball's line
  if (desktop)
    await expect(page.locator("[data-commentary-bar]")).toContainText(cricket.comm.beaten);
  await untilPhase(page, ["ready"]);
  await expectBallNo(page, 2);

  await bowlAt(page, good, press);
  await untilPhase(page, ["called"]);
  await expect(call(page)).toHaveText(cricket.calls.four);
  await untilPhase(page, ["ready"]);
  await expectBallNo(page, 3);

  await bowlAt(page, early, press);
  await untilPhase(page, ["verdict"]);
  await expect(call(page)).toHaveText(cricket.calls.six);
  await expectBallNo(page, "over");
  await untilPhase(page, ["end"]);
  await expect(page.getByRole("button", { name: cricket.again })).toBeVisible();
  await expect(page.getByRole("link", { name: cricket.see })).toBeVisible();

  const state = await stored(page);
  expect(state.lastScores.cricket).toBe(`10${cricket.notOutMark} ${cricket.notOut}`);
  expect(state.bestForm.cricket).toBeCloseTo(1 / 3);
  expect(errors).toEqual([]);
});

test("Review Focus 1: mashing BOWL starts one run-up, an early press is ignored, one press releases one ball", async ({
  page,
}) => {
  const errors = watchErrors(page);
  await open3d(page, URL);
  const press = await pressFor(page);

  await press(page);
  await press(page);
  await expect(game(page)).toHaveAttribute("data-phase", "runup");
  await jump(page, 600); // still in the approach: the meter has not started
  await press(page);
  expect(await phaseOf(page)).toBe("runup");

  await jump(page, 900); // into the sweep
  await press(page);
  await expect(game(page)).toHaveAttribute("data-phase", "flight");
  await press(page);
  await jump(page, 250);
  expect(await phaseOf(page)).toBe("flight");

  await untilPhase(page, ["called"]);
  await press(page);
  await jump(page, 250);
  expect(await phaseOf(page)).toBe("called");
  await untilPhase(page, ["ready"]);
  await expectBallNo(page, 2);
  await jump(page, 1000);
  await expectBallNo(page, 2);
  expect(await phaseOf(page)).toBe("ready");
  expect(errors).toEqual([]);
});

/** Hides the tab or brings it back, as switching tabs does. */
const tab = (page: Page, state: "hidden" | "visible") =>
  page.evaluate((s) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => s });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => s === "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);

test("Review Focus 2: a hidden tab mid run-up or mid-flight cancels the ball, uncounted; back, it is bowled again", async ({
  page,
}) => {
  const errors = watchErrors(page);
  await open3d(page, URL);
  const press = await pressFor(page);

  // In the run-up.
  await press(page);
  await expect(game(page)).toHaveAttribute("data-phase", "runup");
  await jump(page, 750);
  await tab(page, "hidden");
  await expect(game(page)).toHaveAttribute("data-phase", "ready");
  await jump(page, 3000);
  expect(await phaseOf(page)).toBe("ready");
  await expectBallNo(page, 1);
  await tab(page, "visible");

  // In the flight (the ball's landing is due): nothing lands while away.
  await bowlAt(page, good, press);
  await expect(game(page)).toHaveAttribute("data-phase", "flight");
  await tab(page, "hidden");
  await expect(game(page)).toHaveAttribute("data-phase", "ready");
  await jump(page, 6000);
  expect(await phaseOf(page)).toBe("ready");
  await expectBallNo(page, 1);
  expect((await stored(page)).lastScores?.cricket).toBeUndefined();

  // Back: BOWL bowls ball 1 again, and it counts once.
  await tab(page, "visible");
  await bowlAt(page, good, press);
  await untilPhase(page, ["called"]);
  await expect(call(page)).toHaveText(cricket.calls.four);
  await untilPhase(page, ["ready"]);
  await expectBallNo(page, 2);
  expect(errors).toEqual([]);
});

test("Review Focus 3: resizing across 1200px mid-flight keeps one canvas, and the ball is counted once", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-3d", "a resize from the stage to the column");
  const errors = watchErrors(page);
  await open3d(page, URL);

  await bowlAt(page, good);
  await expect(game(page)).toHaveAttribute("data-phase", "flight");
  await page.setViewportSize({ width: 1024, height: 768 });
  await expect(page.locator("[data-game-column] canvas")).toHaveCount(1);
  await expect(canvases(page)).toHaveCount(1);
  await untilPhase(page, ["called"]);
  await expect(canvases(page)).toHaveCount(1);
  await expect(call(page)).toHaveText(cricket.calls.four);
  await untilPhase(page, ["ready"]);
  await expectBallNo(page, 2);
  await jump(page, 2000);
  await expectBallNo(page, 2);
  expect(errors).toEqual([]);
});

test("Review Focus 4: a model file that will not download gives the 2D game, which plays", async ({
  page,
}) => {
  // The one console line is the browser reporting the 404 this test forces.
  const errors = watchErrors(page, [/Failed to load resource.*404/]);
  await page.route("**/models/athlete.glb", (route) => route.fulfill({ status: 404 }));
  await freezeClock(page);
  await page.goto(URL);
  await waitForHydration(page);
  const bowl = page.getByRole("button", {
    name: new RegExp(`^(${cricket.bowl}|${cricket.bowlPhone})$`),
  });
  await expect(bowl.filter({ visible: true })).toBeVisible({ timeout: 30_000 });
  await pauseClock(page);

  await expect(canvases(page)).toHaveCount(0);
  await expect(game(page)).not.toHaveAttribute("data-three");
  await release(page, perfect);
  await pass(page);
  await expectBallNo(page, 2);
  expect(errors).toEqual([]);
});

test("Review Focus 5: SKIP mid-flight leaves cleanly, no sound after, and coming back downloads nothing again", async ({
  page,
}) => {
  const errors = watchErrors(page);
  // Counts every sound the page starts (the code-made ones and the recordings).
  await page.addInitScript(() => {
    const w = window as unknown as { sounds: number };
    w.sounds = 0;
    const count = <K extends "createOscillator" | "createBufferSource">(name: K) => {
      const make = AudioContext.prototype[name] as (...a: unknown[]) => unknown;
      (AudioContext.prototype as unknown as Record<K, unknown>)[name] = function (
        this: AudioContext,
        ...a: unknown[]
      ) {
        w.sounds++;
        return make.apply(this, a);
      };
    };
    count("createOscillator");
    count("createBufferSource");
  });
  const sounds = () => page.evaluate(() => (window as unknown as { sounds: number }).sounds);
  await open3d(page, URL);

  await bowlAt(page, good, await pressFor(page));
  await expect(game(page)).toHaveAttribute("data-phase", "flight");
  // SKIP on the paused clock: time jumps through the page transition and on past the ball's landing and its call.
  await page.locator("[data-game] a[href='/career']:visible").first().click({ force: true });
  for (let ms = 0; ms < 5000 && !page.url().endsWith("/career"); ms += 250) await jump(page, 250);
  await expect(page).toHaveURL(/\/career$/);
  const left = await sounds();
  await jump(page, 4000);
  await expect(page.locator("[data-game]")).toHaveCount(0);
  expect(await sounds()).toBe(left);
  expect((await stored(page)).lastScores?.cricket).toBeUndefined();

  // Back in real time: the files are kept, so nothing downloads again; the new canvas only compiles its shaders (slow
  // in software GL) before it shows.
  const fetched: string[] = [];
  page.on("request", (r) => {
    if (/\/models\/|\/scene-/.test(r.url())) fetched.push(r.url());
  });
  await page.clock.resume();
  await page.goBack();
  await expect(page).toHaveURL(/\/arena\/cricket$/);
  await expect(game(page)).toHaveAttribute("data-three", "ready");
  expect(fetched).toEqual([]);
  await expectBallNo(page, 1);
  expect(errors).toEqual([]);
});
