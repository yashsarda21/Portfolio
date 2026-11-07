import { expect as baseExpect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { expectNoA11yViolations } from "../support/a11y";
import { waitForHydration } from "./support/contentPage";
import { game, phaseOf, stored } from "./support/cricket";
import {
  expectUnlockThenCard,
  forceLuck,
  freezeClock,
  pauseClock,
  spotlight,
} from "./support/game";
import { jump, open3d, pickDir, pickOpenDir, untilPhase } from "./support/three";

// The 3D game in software WebGL (the desktop-3d and mobile-3d projects): slow to draw, so time moves in jumps. While
// the software GPU catches up with the frames a jump drew, the browser's own frames wait (CSS animations, a media
// query's change), so assertions get longer than the usual 5 s.
test.describe.configure({ timeout: 240_000 });
const expect = baseExpect.configure({ timeout: 20_000 });

const badminton = ui.games.badminton;
const three = badminton.three;
const [WELL_PLAYED] = ui.games.yours;
const URL = "/arena/badminton";

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

const onStage = (page: Page) => page.locator("[data-stage]").isVisible();
const canvases = (page: Page) => page.locator("canvas");
const bug = (page: Page) =>
  page.locator(`[data-game] [role=group][aria-label="${ui.games.bug}"]:visible`);
const skip = (page: Page) => page.locator("[data-game] a[href='/attributes']:visible").first();
const field = (page: Page) => page.locator("[data-game-column] [data-part=field]");

/** The score bug of the layout on screen reads Yash's points, then yours. */
async function expectScore(page: Page, yash: string, you: string) {
  const cells = bug(page).locator(":scope > span");
  await expect(cells.nth(1)).toHaveText(yash);
  await expect(cells.nth(2)).toHaveText(you);
}

/** Where the parts around the 3D's arrival sit: SKIP, the score bug, and on the phone the thumb zone. */
async function around(page: Page) {
  const parts = [skip(page), bug(page)];
  if (!(await onStage(page)))
    parts.push(page.locator("[data-game-column] [data-part=thumb] > div"));
  return Promise.all(parts.map((p) => p.boundingBox()));
}

/** Hides the tab or brings it back, as switching tabs does. */
const tab = (page: Page, state: "hidden" | "visible") =>
  page.evaluate((s) => {
    Object.defineProperty(document, "visibilityState", { configurable: true, get: () => s });
    Object.defineProperty(document, "hidden", { configurable: true, get: () => s === "hidden" });
    document.dispatchEvent(new Event("visibilitychange"));
  }, state);

/** A finger swiping `dy` px up (negative) or down on the phone's field, from its middle. */
const swipe = (page: Page, dy: number) =>
  field(page).evaluate((el, d) => {
    const box = el.getBoundingClientRect();
    const x = box.left + box.width / 2;
    const y = box.top + box.height / 2;
    const at = (type: string, py: number) =>
      el.dispatchEvent(
        new PointerEvent(type, {
          bubbles: true,
          pointerId: 7,
          pointerType: "touch",
          clientX: x,
          clientY: py,
        }),
      );
    at("pointerdown", y);
    at("pointerup", y + d);
  }, dy);

/** A rally won with two picks to the open part: the window, his dive and scoop, the second window, the call. */
async function winRally(page: Page) {
  await untilPhase(page, ["window"]);
  await pickOpenDir(page);
  await untilPhase(page, ["window"]);
  await pickOpenDir(page);
  await untilPhase(page, ["called", "verdict"]);
}

/**
 * Plays to the end, every pick to the open part as its window opens; returns what the centre showed after each rally:
 * your words ("yours"), Yash's unlock ("unlock") or nothing ("none").
 */
async function playToEnd(page: Page, picks: boolean) {
  const calls: string[] = [];
  let was: string | null = null;
  for (let spent = 0; spent <= 150_000; spent += 250) {
    const phase = await phaseOf(page);
    if (phase === "end") break;
    const calling = phase === "called" || phase === "verdict";
    if (calling && was !== "called" && was !== "verdict") {
      const panel = spotlight(page);
      calls.push((await panel.count()) === 0 ? "none" : (await panel.getAttribute("data-kind"))!);
    }
    was = phase;
    if (picks && phase === "window") await pickOpenDir(page);
    else await jump(page, 250);
  }
  expect(await phaseOf(page)).toBe("end");
  return calls;
}

test("the loader shows while the files download, then one canvas; nothing moves when the 3D arrives", async ({
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
  await expect(page.getByRole("progressbar", { name: three.loading })).toBeVisible();
  await page.evaluate(() => document.fonts.ready);
  const before = await around(page);
  letGo();
  await page.locator("[data-game][data-three=ready]").waitFor({ timeout: 30_000 });
  await pauseClock(page);
  await jump(page, 500);
  // The loading board holds the controls' place: the swap to the 3D shifts nothing (Lighthouse's CLS).
  expect(before.every(Boolean)).toBe(true);
  expect(await around(page)).toEqual(before);

  await expect(canvases(page)).toHaveCount(1);
  const aims = (await onStage(page))
    ? page.locator("[data-stage] button[data-state]")
    : page.locator("[data-game-column] [data-part=thumb] button[data-game-control]");
  await expect(aims).toHaveCount(2);
  for (const aim of await aims.all()) await expect(aim).toBeVisible();
  // The 2D game's meter and hold are not drawn.
  await expect(page.getByRole("button", { name: badminton.hold })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("no input: four rallies, 21–19, the four cards charged, and 21–19 saved", async ({ page }) => {
  const errors = watchErrors(page);
  await forceLuck(page, 0.2);
  await open3d(page, URL);
  const calls = await playToEnd(page, false);
  expect(calls).toEqual(Array(4).fill("unlock"));
  await expectScore(page, "21", "19");
  if (await onStage(page)) {
    await expect(page.locator("[data-game] [data-state=charged]:visible")).toHaveCount(4);
  } else {
    // The phone's chip shows the newest: the fourth card, charged by rally 4.
    await expect(page.locator("[data-game-column]")).toContainText(
      `${badminton.charged} · ${ui.games.rally} 4`,
    );
  }
  expect((await stored(page)).lastScores.badminton).toBe("21–19");
  expect(errors).toEqual([]);
});

test("Yash's rally puts its group in the centre; by SPOTLIGHT_MS + 500 the toast stands at the side", async ({
  page,
}) => {
  const errors = watchErrors(page);
  await forceLuck(page, 0.2);
  await open3d(page, URL);
  await untilPhase(page, ["called"], 60_000); // no input: Yash's first rally
  await expectUnlockThenCard(page, (ms) => jump(page, ms));
  expect(errors).toEqual([]);
});

test("perfect play: your point at 17–20, then Yash's four unlocks and the game; 22–20 saved", async ({
  page,
}) => {
  const errors = watchErrors(page);
  await forceLuck(page, 0.2);
  await open3d(page, URL);
  const calls = await playToEnd(page, true);
  // Your point; then each of Yash's rallies charges a group until all four are, and his last wins the game with none.
  expect(calls).toEqual(["yours", "unlock", "unlock", "unlock", "unlock", "none"]);
  await expectScore(page, "22", "20");
  expect((await stored(page)).lastScores.badminton).toBe("22–20");
  expect(errors).toEqual([]);
});

test("Review Focus 1: mashing is TOO EARLY once; a press in the routine, the call or while your swing is under way does nothing", async ({
  page,
}) => {
  const errors = watchErrors(page);
  await forceLuck(page, 0.2);
  await open3d(page, URL);

  // Yash's serve: mashing is TOO EARLY once.
  await untilPhase(page, ["serve"]);
  for (let k = 0; k < 3; k++) await pickDir(page, "deep");
  await expect(game(page)).toHaveAttribute("data-phase", "struck");
  await untilPhase(page, ["called"]);
  await expect(spotlight(page)).toHaveAttribute("data-kind", "unlock");
  await expectScore(page, "18", "19");
  // The call: a press does nothing.
  await pickDir(page, "deep");
  expect(await phaseOf(page)).toBe("called");
  await expectScore(page, "18", "19");
  // The next rally's routine: a press does nothing.
  await untilPhase(page, ["ready"]);
  await pickDir(page, "deep");
  expect(await phaseOf(page)).toBe("ready");
  await expectScore(page, "18", "19");

  // A good first pick, then a press in "struck": it is not your second shot (that would be TOO EARLY, before his scoop).
  await untilPhase(page, ["window"]);
  await pickOpenDir(page);
  await expect(game(page)).toHaveAttribute("data-phase", "struck");
  await pickDir(page, "deep");
  await pickDir(page, "short");
  expect(await phaseOf(page)).toBe("struck");
  expect(await untilPhase(page, ["rally", "called"])).toBe("rally");
  await expectScore(page, "18", "19");
  // Before his scoop: mashing is TOO EARLY once (Yash's rally, 19–19).
  for (let k = 0; k < 3; k++) await pickDir(page, "deep");
  expect(await phaseOf(page)).toBe("struck");
  await untilPhase(page, ["called"]);
  await expect(spotlight(page)).toHaveAttribute("data-kind", "unlock");
  await expectScore(page, "19", "19");
  expect(errors).toEqual([]);
});

test("Review Focus 2: a hidden tab drops the rally; back, it is played again fresh and counts once", async ({
  page,
}) => {
  const errors = watchErrors(page);
  await forceLuck(page, 0.2);
  await open3d(page, URL);

  await untilPhase(page, ["window"]);
  await tab(page, "hidden");
  await expect(game(page)).toHaveAttribute("data-phase", "ready");
  // Far longer than the window and the call: nothing is judged or played while away. One jump, so one frame.
  await page.clock.fastForward(8000);
  expect(await phaseOf(page)).toBe("ready");
  await expectScore(page, "17", "19");

  // Back: the rally is played again from the routine.
  await tab(page, "visible");
  await untilPhase(page, ["serve"]);
  await winRally(page);
  await expect(spotlight(page)).toHaveText(WELL_PLAYED);
  await expectScore(page, "17", "20");
  expect((await stored(page)).lastScores?.badminton).toBeUndefined();
  expect(errors).toEqual([]);
});

test("Review Focus 3: resizing across 1200px mid-rally keeps one canvas, and the rally counts once", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop-3d", "a resize from the stage to the column");
  const errors = watchErrors(page);
  await forceLuck(page, 0.2);
  await open3d(page, URL);

  await untilPhase(page, ["window"]);
  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("[data-game-column] canvas")).toHaveCount(1);
  await expect(canvases(page)).toHaveCount(1);
  await pickOpenDir(page);
  await untilPhase(page, ["window"]);
  await pickOpenDir(page);
  await untilPhase(page, ["called"]);
  await expect(canvases(page)).toHaveCount(1);
  await expect(spotlight(page)).toHaveText(WELL_PLAYED);
  await expectScore(page, "17", "20");
  await jump(page, 2000);
  await expectScore(page, "17", "20");
  await expect(canvases(page)).toHaveCount(1);
  expect(errors).toEqual([]);
});

test("Review Focus 4: a swipe up in a window picks SMASH once; a swipe outside a window does nothing", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "mobile-3d", "the swipe is the phone's");
  const errors = watchErrors(page);
  await forceLuck(page, 0.2);
  await open3d(page, URL);

  // The window (the Backend smash rally: the back is open, ↑ SMASH lit): the field takes the touch.
  await untilPhase(page, ["window"]);
  await expect(field(page)).toHaveCSS("touch-action", "none");
  // Too short: not a swipe.
  await swipe(page, -30);
  expect(await phaseOf(page)).toBe("window");
  // Up is SMASH, and the second swipe while your swing is under way does nothing.
  await swipe(page, -120);
  await swipe(page, 120);
  await expect(game(page)).toHaveAttribute("data-phase", "struck");
  await expect(field(page)).toHaveCSS("touch-action", "pan-y");
  // It was the open part: his dive, then the second window.
  expect(await untilPhase(page, ["rally", "called"])).toBe("rally");
  await untilPhase(page, ["window"]);
  await swipe(page, -120);
  await untilPhase(page, ["called"]);
  await expect(spotlight(page)).toHaveText(WELL_PLAYED);
  await expectScore(page, "17", "20");
  // The call: the page scrolls over the field again, and a swipe does nothing.
  await expect(field(page)).toHaveCSS("touch-action", "pan-y");
  await swipe(page, -120);
  expect(await phaseOf(page)).toBe("called");
  // The next rally's routine: the same.
  await untilPhase(page, ["ready"]);
  await expect(field(page)).toHaveCSS("touch-action", "pan-y");
  await swipe(page, -120);
  await swipe(page, 120);
  expect(await phaseOf(page)).toBe("ready");
  await expectScore(page, "17", "20");
  expect(errors).toEqual([]);
});

test("Review Focus 5: SKIP mid-rally leaves cleanly, no sound after, and coming back downloads nothing again", async ({
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
  await forceLuck(page, 0.2);
  await open3d(page, URL);

  await untilPhase(page, ["window"]);
  await pickOpenDir(page);
  await untilPhase(page, ["rally"]);
  // SKIP on the paused clock: time jumps through the page transition and on past the rally's hits and its call.
  await skip(page).click({ force: true });
  for (let ms = 0; ms < 5000 && !page.url().endsWith("/attributes"); ms += 250)
    await jump(page, 250);
  await expect(page).toHaveURL(/\/attributes$/);
  const left = await sounds();
  expect(left).toBeGreaterThan(0);
  await jump(page, 6000);
  await expect(page.locator("[data-game]")).toHaveCount(0);
  expect(await sounds()).toBe(left);
  expect((await stored(page)).lastScores?.badminton).toBeUndefined();

  // Back in real time: the files are kept, so nothing downloads again; the new canvas only compiles its shaders
  // before it shows (about 8 s in software GL, where a real GPU takes a moment).
  const fetched: string[] = [];
  page.on("request", (r) => {
    if (/\/models\/|\/scene-/.test(r.url())) fetched.push(r.url());
  });
  await page.clock.resume();
  await page.goBack();
  await expect(page).toHaveURL(/\/arena\/badminton$/);
  await expect(game(page)).toHaveAttribute("data-three", "ready");
  expect(fetched).toEqual([]);
  expect(errors).toEqual([]);
});

test("accessibility: the 3D page in a window has no violations", async ({ page }) => {
  await forceLuck(page, 0.2);
  await open3d(page, URL);
  await untilPhase(page, ["window"]);
  // axe waits on timers, which the fake clock holds: time runs for the scan.
  await page.clock.resume();
  await expectNoA11yViolations(page);
});
