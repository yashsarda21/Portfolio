import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { expectNoA11yViolations } from "../support/a11y";
import { waitForFiniteAnimations } from "../support/animations";
import { waitForHydration } from "./support/contentPage";
import {
  cssVar,
  expectGameViewport,
  forceLuck,
  openFrozen,
  pauseClock,
  stepUntil,
  VIEWPORTS,
} from "./support/game";

const badminton = ui.games.badminton;
/** The groups in content order, with their shipped skills (content: Attributes). */
const GROUPS = [
  ["BACKEND", "Java, Spring Boot, JUnit"],
  ["FRONTEND", "React, Redux"],
  ["DATA", "Oracle, SQL"],
  ["CRAFT", "DSA, OOP"],
] as const;

// The stage is heavy to draw and the host is often loaded: a game is many fake-clock steps.
test.describe.configure({ timeout: 90_000 });

/** The game root: one per page. */
const game = (page: Page) => page.locator("[data-game]");
const phaseOf = (page: Page) => game(page).getAttribute("data-phase");
/** The big call of the layout on screen. */
const call = (page: Page) => page.locator("[data-game] [data-tone]:visible");
/** The score bug of the layout on screen. */
const bug = (page: Page) => page.locator("[data-game] [role=group]:visible");
/** The attribute toasts the stage has charged. */
const charged = (page: Page) => page.locator("[data-game] [data-state=charged]:visible");
/** HOLD · RELEASE, of the layout on screen. */
const hold = (page: Page) => page.getByRole("button", { name: badminton.hold });
const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("arena:v1") ?? "{}").state ?? {});

/** What is on screen of the attributes so far: the stage's toasts, or the phone's chip for the newest and the bug for the count. */
async function expectCharged(page: Page, count: number) {
  if (await page.locator("[data-stage]").isVisible()) {
    await expect(charged(page)).toHaveCount(count);
  } else {
    if (count < 3) await expect(bug(page)).toContainText(`${ui.games.rally} ${count + 1}/4`);
    if (count > 0) {
      await expect(page.locator("[data-game-column]")).toContainText(
        `${badminton.charged} · ${ui.games.rally} ${count}`,
      );
    }
  }
}

/** The box of the text itself (the call's own element may be wider than its words). */
const textBox = (el: ReturnType<Page["locator"]>) =>
  el.evaluate((node) => {
    const range = document.createRange();
    range.selectNodeContents(node);
    const { x, y, width, height } = range.getBoundingClientRect();
    return { x, y, width, height };
  });
type Box = { x: number; y: number; width: number; height: number };
const meets = (a: Box, b: Box) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/**
 * The call on screen stays inside the field: on the stage between the power panel and the toast column (it wraps
 * to balanced lines there, at the same size), on the column inside the screen's width.
 */
async function expectCallFits(page: Page, lines: 1 | 2) {
  const text = await textBox(call(page));
  const onStage = await page.locator("[data-stage]").isVisible();
  if (onStage) {
    for (const part of ["power", "toasts"]) {
      const panel = (await page.locator(`[data-stage] [data-part=${part}]`).boundingBox())!;
      expect(meets(text, panel), `the call ${JSON.stringify(text)} meets the ${part}`).toBe(false);
    }
    // 120px display at line-height 1: one line is 120 tall, two are 240.
    expect(Math.round(text.height / 120), "lines").toBe(lines);
  } else {
    const view = page.viewportSize()!;
    expect(text.x, "call left").toBeGreaterThanOrEqual(0);
    expect(text.x + text.width, "call right").toBeLessThanOrEqual(view.width);
  }
}

/** Collects the page's errors: a game must never reach the console with one. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

/** Moves the paused fake clock in 100 ms steps until the game is in one of `phases` (at most `maxMs` of game time). */
async function advanceTo(page: Page, phases: string[], maxMs = 8000) {
  for (let spent = 0; spent <= maxMs; spent += 100) {
    const phase = await phaseOf(page);
    if (phase && phases.includes(phase)) return phase;
    await page.clock.runFor(100);
  }
  throw new Error(`the game never reached ${phases.join(" / ")} (it is in ${await phaseOf(page)})`);
}

/** Waits for the hold to end (the game leaves "charging"), then lets the shuttle fly and the call hold. */
async function pass(page: Page, until: string[] = ["ready", "verdict", "end"]) {
  await expect(game(page)).not.toHaveAttribute("data-phase", /^(ready|charging)$/);
  return advanceTo(page, until);
}

/** Power %, as the meter's fill (0 to 1) reads it, for each shot. The perfect weight is 20 to 26 % of power, not drawn. */
const PERFECT: [number, number] = [0.215, 0.245];
const SMASH: [number, number] = [0.83, 0.86];
const CLEAR: [number, number] = [0.45, 0.55];
const DROP: [number, number] = [0.28, 0.32];

/** Space down, the meter runs until the fill reads in `band`, Space up: one rally. */
async function holdSpace(page: Page, band: [number, number]) {
  await page.keyboard.down("Space");
  await stepUntil(
    page,
    () => cssVar(page, "--power"),
    (v) => v >= band[0] && v <= band[1],
  );
  await page.keyboard.up("Space");
}

/** A whole game of perfect weights, then on to the end buttons. */
async function perfectGame(page: Page) {
  for (let rally = 0; rally < 4; rally++) {
    await holdSpace(page, PERFECT);
    await pass(page);
  }
  await advanceTo(page, ["end"]);
}

test.describe("perfect play still loses (F1)", () => {
  test("four perfect weights: 21–19, GAME YASH, the attributes, REMATCH, then PLAYED on the Hub", async ({
    page,
  }) => {
    await forceLuck(page, 0);
    await openFrozen(page, "/arena/badminton");
    await perfectGame(page);
    await expect(page.getByText(/CLAIM/)).toHaveCount(0);
    // At match point the last rally is a perfect drop that still loses: it is called as the shot.
    await expect(call(page)).toHaveText(badminton.calls.drop);
    await expectCallFits(page, 2);
    await expect(bug(page)).toContainText(badminton.status.game);
    await expect(bug(page)).toContainText("21");
    const see = page.getByRole("link", { name: badminton.see });
    await expect(see).toBeVisible();
    await expect(see).toHaveAttribute("href", "/attributes");
    await expect(page.getByRole("button", { name: ui.hud.rematch })).toBeVisible();

    const state = await stored(page);
    expect(state.yashWins).toBe(1);
    expect(state.lastScores.badminton).toBe("21–19");
    expect(state.bestForm.badminton).toBe(1);

    // A client navigation, so the page and the record are the same ones: the stage's breadcrumb goes to the Hub; the
    // column has none (the board draws none), so it goes through SKIP and the tab bar.
    await page.clock.resume();
    const hub = page.locator("a[href='/arena']:visible").first();
    if (await hub.count()) {
      await hub.click();
    } else {
      await see.click();
      await expect(page).toHaveURL(/\/attributes$/);
      // The wipe from the game swallows a press that lands while it still covers the page: press again until it takes.
      await expect(async () => {
        await page.getByRole("link", { name: ui.tabs.arena }).click({ timeout: 1000 });
        await expect(page).toHaveURL(/\/arena$/, { timeout: 1000 });
      }).toPass({ timeout: 10_000 });
    }
    await expect(page).toHaveURL(/\/arena$/);
    const card = page.getByRole("article").filter({ hasText: ui.venues.badminton });
    // The stage's card says PLAYED · 21–19; the phone's fixture keeps to the score.
    const onStage = await page.locator("[data-stage]").isVisible();
    await expect(card).toContainText(onStage ? "PLAYED · 21–19" : "21–19");
    await expect(card.getByRole("link", { name: ui.hud.rematch })).toBeVisible();
  });

  test("after the second loss the highlight leads (G9), and REMATCH starts a clean game", async ({
    page,
  }) => {
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/badminton");
    await perfectGame(page);
    await expect(page.getByRole("link", { name: ui.games.highlight })).toHaveCount(0);

    await page.getByRole("button", { name: ui.hud.rematch }).click({ force: true });
    await expect(game(page)).toHaveAttribute("data-phase", "ready");
    await expectCharged(page, 0);
    // Nothing of the finished game is left to fire into the new one.
    await page.clock.runFor(3000);
    await expect(game(page)).toHaveAttribute("data-phase", "ready");
    expect(await cssVar(page, "--power")).toBeCloseTo(0.08, 2);

    await perfectGame(page);
    const highlight = page.getByRole("link", { name: ui.games.highlight });
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("href", "/attributes");
    await expect(page.getByRole("button", { name: ui.hud.rematch })).toBeVisible();
    expect((await stored(page)).yashWins).toBe(2);
  });
});

test("every rally reveals: four smashes charge four groups, and each is announced", async ({
  page,
}) => {
  await forceLuck(page, 0.99);
  await openFrozen(page, "/arena/badminton");
  // What a screen reader would hear: every text the announcer's live region takes.
  await page.evaluate(() => {
    const said: string[] = [];
    (window as unknown as { __said: string[] }).__said = said;
    const region = document.querySelector("div[aria-live=polite][aria-atomic=true]")!;
    new MutationObserver(() => {
      const text = region.textContent?.trim();
      if (text) said.push(text);
    }).observe(region, { childList: true, characterData: true, subtree: true });
  });
  for (let rally = 1; rally <= 4; rally++) {
    await holdSpace(page, SMASH);
    await pass(page);
    await expectCharged(page, rally);
    // The call goes once the next hold can begin; the last one stays through the verdict.
    if (rally < 4) await expect(call(page)).toHaveCount(0);
  }
  const said = await page.evaluate(() => (window as unknown as { __said: string[] }).__said);
  expect(said).toEqual(
    GROUPS.map(
      ([name, chips], i) =>
        `${badminton.calls.smash} Attribute charged, rally ${i + 1}: ${name}, ${chips}` +
        // The last rally also says how the game ended (m-4).
        (i === GROUPS.length - 1 ? ". Game yash. 21–19." : ""),
    ),
  );
  // Each rally is heard once: the commentary bar's own live region is not on the page while a game is.
  await expect(page.locator("[data-game] [aria-live]")).toHaveCount(0);
  await advanceTo(page, ["end"]);
  expect((await stored(page)).lastScores.badminton).toBe("21–19");
});

test("at the end the four toasts stand in one column and each eyebrow is one line", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "the toasts are the stage's");
  await forceLuck(page, 0);
  await openFrozen(page, "/arena/badminton");
  await perfectGame(page);
  // The toasts slide in on CSS time, not the fake clock: let them finish.
  await page.clock.resume();
  await waitForFiniteAnimations(page);
  const toasts = charged(page);
  await expect(toasts).toHaveCount(4);
  const boxes: Box[] = [];
  for (const toast of await toasts.all()) {
    boxes.push((await toast.boundingBox())!);
    const eyebrow = toast.locator("span").first();
    const lineTops = await eyebrow.evaluate((node) => {
      const range = document.createRange();
      range.selectNodeContents(node);
      return new Set([...range.getClientRects()].map((r) => Math.round(r.top))).size;
    });
    expect(lineTops, `"${await eyebrow.textContent()}" lines`).toBe(1);
  }
  const column = (await page.locator("[data-stage] [data-part=toasts]").boundingBox())!;
  for (const box of boxes) {
    expect(box.x, "toast x").toBeCloseTo(column.x, 0);
    expect(box.width, "toast width").toBeCloseTo(column.width, 0);
  }
  expect(boxes[3]!.x + boxes[3]!.width, "inside the window").toBeLessThanOrEqual(1440);
});

test("the shots: drop and smash are called as released; a perfect weight is called, except at match point", async ({
  page,
}) => {
  await forceLuck(page, 0.99);
  await openFrozen(page, "/arena/badminton");
  const rally = async (band: [number, number], called: string, lines: 1 | 2) => {
    await holdSpace(page, band);
    await advanceTo(page, ["called", "verdict"]);
    await expect(call(page)).toHaveText(called);
    await expectCallFits(page, lines);
    if ((await phaseOf(page)) === "called") await advanceTo(page, ["ready"]);
  };
  await rally(PERFECT, badminton.calls.perfect, 2);
  await rally(DROP, badminton.calls.drop, 2);
  await rally(SMASH, badminton.calls.smash, 1);
  await expect(bug(page)).toContainText(badminton.matchPoint);
  // At match point only the 1 % is perfect: otherwise the shot is called, however well it was weighed.
  await rally(PERFECT, badminton.calls.drop, 2);
});

test.describe("holding (Review Focus 1)", () => {
  test("the meter runs while Space is held, and a rally is played when it comes up", async ({
    page,
  }) => {
    await openFrozen(page, "/arena/badminton");
    expect(await cssVar(page, "--power")).toBeCloseTo(0.08, 2);
    await page.keyboard.down("Space");
    await expect(game(page)).toHaveAttribute("data-phase", "charging");
    await stepUntil(
      page,
      () => cssVar(page, "--power"),
      (v) => v > 0.5,
    );
    // It is still charging: nothing was played.
    await expect(game(page)).toHaveAttribute("data-phase", "charging");
    await expectCharged(page, 0);
    await page.keyboard.up("Space");
    await pass(page);
    await expectCharged(page, 1);
  });

  test("with the HOLD button focused, Space holds and releases once", async ({ page }) => {
    await openFrozen(page, "/arena/badminton");
    await hold(page).focus();
    await holdSpace(page, CLEAR);
    await pass(page);
    await expectCharged(page, 1);
  });

  test("holding Space (key repeat) is one hold", async ({ page }) => {
    await openFrozen(page, "/arena/badminton");
    // Down, down, down is a key held: the second and third keydowns carry `repeat`.
    await page.keyboard.down("Space");
    await page.clock.runFor(300);
    await page.keyboard.down("Space");
    await page.keyboard.down("Space");
    await expect(game(page)).toHaveAttribute("data-phase", "charging");
    await page.keyboard.up("Space");
    await pass(page);
    await expectCharged(page, 1);
    await expect(game(page)).toHaveAttribute("data-phase", "ready");
  });

  test("Space, Enter and a click during the flight and the call do nothing", async ({ page }) => {
    await openFrozen(page, "/arena/badminton");
    await holdSpace(page, CLEAR);
    await expect(game(page)).not.toHaveAttribute("data-phase", /^(ready|charging)$/);
    await page.keyboard.press("Space");
    await page.keyboard.press("Enter");
    await advanceTo(page, ["called"]);
    await page.keyboard.press("Space");
    await hold(page).click({ force: true });
    await advanceTo(page, ["ready"]);
    await page.clock.runFor(500);
    await expect(game(page)).toHaveAttribute("data-phase", "ready");
    await expectCharged(page, 1);
  });

  test("a mouse hold on the button, let go in CLEAR: BACK LINE. STILL HIS.", async ({ page }) => {
    await openFrozen(page, "/arena/badminton");
    const box = (await hold(page).boundingBox())!;
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
    await page.mouse.down();
    await expect(game(page)).toHaveAttribute("data-phase", "charging");
    await stepUntil(
      page,
      () => cssVar(page, "--power"),
      (v) => v >= CLEAR[0] && v <= CLEAR[1],
    );
    await page.mouse.up();
    await advanceTo(page, ["called"]);
    await expect(call(page)).toHaveText(badminton.calls.clear);
    await advanceTo(page, ["ready"]);
    await expectCharged(page, 1);
  });

  test("the window losing focus while charging lets go; the next press is a fresh hold", async ({
    page,
  }) => {
    await openFrozen(page, "/arena/badminton");
    await page.keyboard.down("Space");
    await stepUntil(
      page,
      () => cssVar(page, "--power"),
      (v) => v > 0.3,
    );
    await page.evaluate(() => window.dispatchEvent(new Event("blur")));
    await advanceTo(page, ["called"]);
    await advanceTo(page, ["ready"]);
    await expectCharged(page, 1);
    // The key came up outside the page: it is still down as far as the browser knows, then comes up.
    await page.keyboard.up("Space");
    await expect(game(page)).toHaveAttribute("data-phase", "ready");
    await page.keyboard.down("Space");
    await expect(game(page)).toHaveAttribute("data-phase", "charging");
    await page.keyboard.up("Space");
    await pass(page);
    await expectCharged(page, 2);
  });

  test("a hidden tab while charging lets go", async ({ page }) => {
    await openFrozen(page, "/arena/badminton");
    await page.keyboard.down("Space");
    await page.clock.runFor(300);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "hidden",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await advanceTo(page, ["flight", "called"]);
    await page.evaluate(() => {
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => "visible",
      });
      document.dispatchEvent(new Event("visibilitychange"));
    });
    await advanceTo(page, ["ready"]);
    await expectCharged(page, 1);
    await page.keyboard.up("Space");
  });

  test("the browser taking the pointer back (pointercancel, lost capture) lets go", async ({
    page,
  }) => {
    await openFrozen(page, "/arena/badminton");
    for (const type of ["pointercancel", "lostpointercapture"]) {
      const box = (await hold(page).boundingBox())!;
      await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
      await page.mouse.down();
      await expect(game(page)).toHaveAttribute("data-phase", "charging");
      await page.clock.runFor(200);
      await hold(page).dispatchEvent(type, { pointerId: 1, pointerType: "mouse", bubbles: true });
      // Let go by the browser's doing, with the button still pressed as far as the mouse is concerned.
      await expect(game(page)).toHaveAttribute("data-phase", "flight");
      await page.mouse.up();
      await advanceTo(page, ["ready"]);
    }
    await expectCharged(page, 2);
  });
});

test("a resize across 1200px keeps the game and shows one layout (Review Focus 3)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "starts on the stage");
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await forceLuck(page, 0.99);
  await openFrozen(page, "/arena/badminton");
  await holdSpace(page, CLEAR);
  await pass(page, ["ready"]);
  await expect(page.locator("[data-stage]")).toBeVisible();
  await expect(page.locator("[data-game-column]")).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("[data-stage]")).toBeHidden();
  await expect(page.locator("[data-game-column]")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  const column = page.locator("[data-game-column]");
  await expect(column.getByText("ATTRIBUTE CHARGED · RALLY 1")).toBeVisible();
  await expect(column.getByText("BACKEND", { exact: true })).toBeVisible();
  await expect(column.getByText("RALLY 2/4")).toBeVisible();
  // The game goes on in the new layout: the next hold is the second rally.
  await holdSpace(page, SMASH);
  await pass(page, ["ready"]);
  await expect(column.getByText(badminton.matchPoint, { exact: true }).first()).toBeHidden();
  await expect(column.getByText("RALLY 3/4")).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("[data-stage]")).toBeVisible();
  await expect(page.locator("[data-game-column]")).toBeHidden();
  await expectCharged(page, 2);
  await expect(page.locator("[data-stage]").getByText("RALLY 3", { exact: true })).toBeVisible();
  expect(errors).toEqual([]);
});

test("blocked storage: the game still ends and the end buttons work (Review Focus 4)", async ({
  page,
}) => {
  const errors = watchErrors(page);
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("blocked", "SecurityError");
    };
  });
  await forceLuck(page, 0.99);
  await openFrozen(page, "/arena/badminton");
  await perfectGame(page);
  await expect(page.getByRole("link", { name: badminton.see })).toBeVisible();
  await page.getByRole("button", { name: ui.hud.rematch }).click({ force: true });
  await expect(game(page)).toHaveAttribute("data-phase", "ready");
  await expectCharged(page, 0);
  expect(errors).toEqual([]);
});

test.describe("reduced motion (G10)", () => {
  test("no hold, no meter: the game plays itself, four groups charge, then the end, saved as 21–19", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/badminton");
    await expect(page.getByRole("button", { name: badminton.hold })).toHaveCount(0);
    await expect(page.locator("[data-game] [data-part=fill]")).toHaveCount(0);
    await page.clock.runFor(3000);
    await expectCharged(page, 4);
    await advanceTo(page, ["end"]);
    await expect(page.getByRole("button", { name: ui.hud.rematch })).toBeVisible();
    await expect(page.getByRole("link", { name: badminton.see })).toBeVisible();
    expect((await stored(page)).lastScores.badminton).toBe("21–19");
    // REMATCH plays it again.
    await page.getByRole("button", { name: ui.hud.rematch }).click({ force: true });
    await expectCharged(page, 0);
    await page.clock.runFor(3000);
    await expectCharged(page, 4);
  });
});

test("keyboard only: Tab reaches HOLD, SKIP and QUICK VIEW; Space on it holds; the end takes focus", async ({
  page,
}) => {
  await forceLuck(page, 0.99);
  await openFrozen(page, "/arena/badminton");
  const reached = new Set<string>();
  for (let i = 0; i < 14; i++) {
    await page.keyboard.press("Tab");
    const name = await page.evaluate(
      () =>
        (document.activeElement?.getAttribute("aria-label") ??
          document.activeElement?.textContent ??
          "") as string,
    );
    reached.add(name.trim());
  }
  expect([...reached]).toEqual(
    expect.arrayContaining(
      [badminton.hold, badminton.skip, ui.hud.quickView].map((n) => expect.stringContaining(n)),
    ),
  );
  // Space on the focused button holds it (the game's own key listener leaves a control alone: one hold).
  await hold(page).focus();
  await holdSpace(page, CLEAR);
  await pass(page);
  await expectCharged(page, 1);
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  for (let rally = 0; rally < 3; rally++) {
    await holdSpace(page, PERFECT);
    await pass(page);
  }
  await advanceTo(page, ["end"]);
  await expect(page.getByRole("link", { name: badminton.see })).toBeFocused();
  await expect(game(page)).toHaveAttribute("data-phase", "end");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the fresh game with SKIP and QUICK VIEW as plain links", async ({ page }) => {
    await page.goto("/arena/badminton");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.badminton.heading);
    await expect(page.getByText("UP NEXT · RALLY 1").first()).toBeAttached();
    const skip = page.getByRole("link", { name: badminton.skip });
    const quick = page.getByRole("link", { name: ui.hud.quickView });
    await expect(skip).toHaveAttribute("href", "/attributes");
    await expect(quick).toHaveAttribute("href", "/scout");
    await skip.click();
    await expect(page).toHaveURL(/\/attributes$/);
  });
});

test("leaving mid-game: no timer fires and nothing is saved", async ({ page }) => {
  const errors = watchErrors(page);
  await forceLuck(page, 0.99);
  await openFrozen(page, "/arena/badminton");
  await holdSpace(page, PERFECT);
  await advanceTo(page, ["called"]);
  await page.clock.resume();
  await page.getByRole("link", { name: badminton.skip }).click();
  await expect(page).toHaveURL(/\/attributes$/);
  // Past where the call, and the next hold, would have been.
  await page.waitForTimeout(2500);
  expect((await stored(page)).lastScores?.badminton).toBeUndefined();
  expect(errors).toEqual([]);
});

test("leaving mid-hold: the held meter and its listeners go with the page", async ({ page }) => {
  const errors = watchErrors(page);
  await openFrozen(page, "/arena/badminton");
  await page.keyboard.down("Space");
  await page.clock.runFor(300);
  await page.clock.resume();
  await page.getByRole("link", { name: badminton.skip }).click();
  await expect(page).toHaveURL(/\/attributes$/);
  await page.evaluate(() => window.dispatchEvent(new Event("blur")));
  await page.waitForTimeout(500);
  expect((await stored(page)).lastScores?.badminton).toBeUndefined();
  expect(errors).toEqual([]);
});

test.describe("viewports (Review Focus 5)", () => {
  test("every size holds the game's rules", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "sets its own sizes");
    test.setTimeout(120_000);
    for (const [width, height] of VIEWPORTS) {
      await page.setViewportSize({ width, height });
      await page.goto("/arena/badminton");
      await waitForHydration(page);
      await expectGameViewport(page);
    }
  });

  test("on the smallest phones the meter and the hold are fully on screen and clear of the chips", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "sets its own sizes");
    for (const [width, height] of [
      [375, 667],
      [360, 640],
      [390, 844],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.goto("/arena/badminton");
      await waitForHydration(page);
      const column = page.locator("[data-game-column]");
      const meter = (await column.locator("[data-size=column]").boundingBox())!;
      const button = (await hold(page).boundingBox())!;
      const quick = (await page.getByRole("link", { name: ui.hud.quickView }).boundingBox())!;
      expect(meter.height, `${width}x${height} meter height`).toBeGreaterThanOrEqual(238);
      expect(meter.x + meter.width, `${width}x${height} meter right`).toBeLessThanOrEqual(width);
      expect(meter.y + meter.height, `${width}x${height} meter bottom`).toBeLessThanOrEqual(
        button.y,
      );
      // Under the QUICK VIEW chip, which is the lowest thing above it.
      expect(meter.y, `${width}x${height} meter top`).toBeGreaterThanOrEqual(
        quick.y + quick.height,
      );
      expect(button.y + button.height, `${width}x${height} hold bottom`).toBeLessThanOrEqual(
        height,
      );
      expect(button.height).toBeGreaterThanOrEqual(110);
    }
  });
});

/** A phone held sideways: short and wide. SKIP, QUICK VIEW and the call must not hide behind the thumb zone (G11). */
const SIDEWAYS = [
  [844, 390],
  [667, 375],
] as const;
for (const [width, height] of SIDEWAYS) {
  test.describe(`a phone held sideways, ${width}x${height}`, () => {
    test.use({ viewport: { width, height }, hasTouch: true });

    test("fresh and after one input the call, SKIP and QUICK VIEW stay clear of the thumb zone", async ({
      page,
    }, testInfo) => {
      test.skip(testInfo.project.name !== "desktop", "sets its own size");
      await forceLuck(page, 0.99);
      await openFrozen(page, "/arena/badminton");
      await expectGameViewport(page);
      await holdSpace(page, PERFECT);
      await pass(page, ["called"]);
      await expect(call(page)).toBeVisible();
      // The reveal and the call pop in: judge them once they have settled.
      await waitForFiniteAnimations(page);
      await expectGameViewport(page);
    });
  });
}

test.describe("the phone's court (D-9)", () => {
  test("Yash's ring and the tag stand where the stage draws them, scaled with the court, at any width", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "the column is the phone's layout");
    for (const { width, height } of [
      { width: 390, height: 844 },
      { width: 360, height: 640 },
      { width: 768, height: 1024 },
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto("/arena/badminton");
      await waitForHydration(page);
      const box = (selector: string) =>
        page.locator(`[data-game-column] ${selector}`).first().boundingBox();
      const court = (await box("svg[data-part=court]"))!;
      const middle = court.x + court.width / 2;
      // The court's crop (280 290 880 590) is sliced to the box: its scale is the larger of the two.
      const scale = Math.max(court.width / 880, court.height / 590);
      const ring = (await box("[data-who=yash]"))!;
      expect(Math.abs(ring.x + ring.width / 2 - (middle + 72 * scale))).toBeLessThanOrEqual(1.5);
      expect(
        Math.abs(ring.y + ring.height / 2 - (court.y + (343 - 290) * scale)),
      ).toBeLessThanOrEqual(1.5);
      const tag = (await page
        .locator("[data-game-column]")
        .getByText(`${ui.hub.record.yash} · ${badminton.reading}`)
        .boundingBox())!;
      expect(Math.abs(tag.x + tag.width / 2 - middle)).toBeLessThanOrEqual(1);
    }
  });
});

test.describe("axe", () => {
  /** axe waits on timers, which the fake clock holds: let time run for the scan, then stop it again. */
  async function scan(page: Page) {
    await page.clock.resume();
    await waitForFiniteAnimations(page);
    await expectNoA11yViolations(page);
    await pauseClock(page);
  }

  test("clean fresh, during a call and at the end", async ({ page }) => {
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/badminton");
    await scan(page);

    await holdSpace(page, SMASH);
    await advanceTo(page, ["called"]);
    await expect(call(page)).toBeVisible();
    await scan(page);

    await advanceTo(page, ["ready"]);
    for (let rally = 0; rally < 3; rally++) {
      await holdSpace(page, SMASH);
      await pass(page, ["ready", "end"]);
    }
    await advanceTo(page, ["end"]);
    await scan(page);
  });
});
