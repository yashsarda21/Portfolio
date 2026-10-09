import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { expectNoA11yViolations } from "../support/a11y";
import { waitForFiniteAnimations } from "../support/animations";
import { expectMatchesArtboard } from "../support/visual";
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

const cricket = ui.games.cricket;

// The stage is heavy to draw and the host is often loaded: a game is many fake-clock steps.
test.describe.configure({ timeout: 90_000 });

/** The game root: one per page. */
const game = (page: Page) => page.locator("[data-game]");
const phaseOf = (page: Page) => game(page).getAttribute("data-phase");
/** The big call of the layout on screen. */
const call = (page: Page) => page.locator("[data-game] [data-tone]:visible");
/** The score bug's meta of the layout on screen: "BALL 2 OF 3" (stage) or "YOU BOWLING · 2/3" (column). */
const bug = (page: Page) => page.locator("[data-game] [role=group]:visible");
const openSlots = (page: Page) => page.locator("[data-game] li[data-state=open]:visible");
/** The stage lists the innings it has opened; the column keeps only the newest in a chip, and its score bug counts the balls. */
async function expectUnlocked(page: Page, innings: number) {
  if (await page.locator("[data-stage]").isVisible()) {
    await expect(openSlots(page)).toHaveCount(innings);
  } else {
    await expect(bug(page)).toContainText(innings === 3 ? cricket.over : `${innings + 1}/3`);
    if (innings > 0) {
      await expect(page.locator("[data-game-column]")).toContainText(
        `${cricket.innings} 0${innings} ${ui.games.unlocked}`,
      );
    }
  }
}
const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("arena:v1") ?? "{}").state ?? {});

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

/** Waits for the page to take a key (the game leaves "ready"), then lets the ball fly and the call hold. */
async function pass(page: Page, until: string[] = ["ready", "verdict", "end"]) {
  await expect(game(page)).not.toHaveAttribute("data-phase", "ready");
  return advanceTo(page, until);
}

/** The meter sweeps its track once every 1.1 s (CRICKET_PERIOD_MS), there and back. */
const PERIOD_MS = 1100;

/**
 * Moves the paused clock so the cursor will read about `at`, then presses Space. Two frames show which way the
 * cursor is going, one jump takes it near the target (a step by step walk costs a round trip per 10 ms), and
 * `stepUntil` settles the last few ms.
 */
async function release(page: Page, at: [number, number]) {
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
const perfect: [number, number] = [0.49, 0.51];
/** Far from the middle: a miss (SIX), whichever way the cursor is going. */
const miss: [number, number] = [0, 0.15];

/** A whole over of perfect balls, then on to the end buttons. */
async function perfectOver(page: Page) {
  for (let ball = 0; ball < 3; ball++) {
    await release(page, perfect);
    await pass(page);
  }
  await advanceTo(page, ["end"]);
}

test.describe("route matches Cricket-Play", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "Cricket-Play is a 1440×900 board");
  });

  test("the fresh over at 1440x900", async ({ page }) => {
    await openFrozen(page, "/arena/cricket");
    // The clock was stopped some way into a sweep: put the cursor where the board draws it (the start of the track).
    await game(page).evaluate((el) => el.style.setProperty("--meter", "0"));
    await expect(page.locator("[data-commentary-bar]")).toBeVisible();
    // CSS animations are not on the fake clock: wait for the finite ones (the COMM line coming in) to end.
    await waitForFiniteAnimations(page);
    const ratio = await expectMatchesArtboard(page, "Cricket-Play", {
      maxDiffRatio: 0.02,
      // D-8: the near stumps, moved onto the pitch's centre line (both places).
      maskRects: [{ x: 590, y: 785, width: 156, height: 115 }],
    });
    console.log(`[ratio] Cricket-Play route ${ratio}`);
    expect(ratio).toBeLessThanOrEqual(0.02);
  });
});

test.describe("the forced win (the 1 %)", () => {
  test("dot, dot, wicket: BOWLED HIM, then CLAIM YOUR WICKET, saved and unlocked", async ({
    page,
  }) => {
    await forceLuck(page, 0);
    await openFrozen(page, "/arena/cricket");
    await perfectOver(page);
    await expect(call(page)).toHaveText(cricket.calls.bowled);
    await expect(call(page)).toHaveAttribute("data-tone", "volt");
    const claim = page.getByRole("link", { name: cricket.claim });
    await expect(claim).toBeVisible();
    await expect(claim).toBeFocused();
    await expect(page.getByRole("button", { name: cricket.again })).toHaveCount(0);

    const state = await stored(page);
    expect(state.record).toEqual({ yash: 0, you: 1 });
    expect(state.lockerRoomUnlocked).toBe(true);
    expect(state.teamUpPrefill).toBe("I beat you.");
    expect(state.lastScores.cricket).toBe("0 OUT");
    expect(state.achievements).toContain("giant-killer");

    await page.clock.resume();
    await claim.click();
    await expect(page).toHaveURL(/\/arena\/giant-killer$/);
  });
});

test.describe("the forced loss", () => {
  test("three perfect balls and a FOUR: the scorecard, BOWL AGAIN, then PLAYED on the Hub", async ({
    page,
  }) => {
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/cricket");
    await perfectOver(page);
    await expect(call(page)).toHaveText(cricket.calls.four);
    await expect(call(page)).toHaveAttribute("data-tone", "floodlight");
    const see = page.getByRole("link", { name: cricket.see });
    await expect(see).toBeVisible();
    await expect(see).toHaveAttribute("href", "/career");
    await expect(page.getByRole("button", { name: cricket.again })).toBeVisible();

    const state = await stored(page);
    expect(state.record).toEqual({ yash: 1, you: 0 });
    expect(state.lastScores.cricket).toBe("4* NOT OUT");

    // A client navigation, so the page and the record are the same ones: the stage's breadcrumb goes to the Hub; the
    // column has none (the board draws none), so it goes through SKIP and the tab bar.
    await page.clock.resume();
    const hub = page.locator("a[href='/arena']:visible").first();
    if (await hub.count()) {
      await hub.click();
    } else {
      await see.click();
      await expect(page).toHaveURL(/\/career$/);
      // The wipe from the game swallows a press that lands while it still covers the page: press again until it takes.
      await expect(async () => {
        await page.getByRole("link", { name: ui.tabs.arena }).click({ timeout: 1000 });
        await expect(page).toHaveURL(/\/arena$/, { timeout: 1000 });
      }).toPass({ timeout: 10_000 });
    }
    await expect(page).toHaveURL(/\/arena$/);
    const card = page.getByRole("article").filter({ hasText: ui.venues.cricket });
    // The stage's card says PLAYED · 4* NOT OUT; the phone's fixture keeps to the score.
    const onStage = await page.locator("[data-stage]").isVisible();
    await expect(card).toContainText(onStage ? "PLAYED · 4* NOT OUT" : "4* NOT OUT");
    await expect(card.getByRole("link", { name: ui.hud.rematch })).toBeVisible();
  });

  test("after the second loss the highlight leads (G9), and BOWL AGAIN starts a clean over", async ({
    page,
  }) => {
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/cricket");
    await perfectOver(page);
    await expect(page.getByRole("link", { name: ui.games.highlight })).toHaveCount(0);

    await page.getByRole("button", { name: cricket.again }).click();
    await expect(game(page)).toHaveAttribute("data-phase", "ready");
    await expectUnlocked(page, 0);
    // Nothing of the finished over is left to fire into the new one.
    await page.clock.runFor(3000);
    await expect(game(page)).toHaveAttribute("data-phase", "ready");

    await perfectOver(page);
    const highlight = page.getByRole("link", { name: ui.games.highlight });
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("href", "/career");
    await expect(page.getByRole("button", { name: cricket.again })).toBeVisible();
    expect((await stored(page)).record).toEqual({ yash: 2, you: 0 });
  });
});

test("every input reveals: three misses open three innings, and each is announced", async ({
  page,
}) => {
  await forceLuck(page, 0.99);
  await openFrozen(page, "/arena/cricket");
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
  for (let ball = 1; ball <= 3; ball++) {
    await release(page, miss);
    await pass(page);
    await expectUnlocked(page, ball);
  }
  const said = await page.evaluate(() => (window as unknown as { __said: string[] }).__said);
  expect(said).toEqual([
    "SIX. Innings 01 unlocked: DEUTSCHE BANK, Software Engineer 1, Jul 2024 – now",
    "SIX. Innings 02 unlocked: DEUTSCHE BANK, Graduate Analyst Intern, Jun – Jul 2023",
    "SIX. Innings 03 unlocked: PICT, PUNE, B.Tech, Information Technology, 2020 – 2024",
  ]);
  await advanceTo(page, ["end"]);
  expect((await stored(page)).lastScores.cricket).toBe("18* NOT OUT");
});

test.describe("racing inputs (Review Focus 1)", () => {
  test("Space with the BOWL button focused bowls once", async ({ page }) => {
    await openFrozen(page, "/arena/cricket");
    const button = page.getByRole("button", { name: /^(BOWL · SPACE|TAP TO BOWL)$/ });
    await button.focus();
    await stepUntil(
      page,
      () => cssVar(page, "--meter"),
      (v) => v < 0.2,
    );
    await page.keyboard.press("Space");
    await pass(page);
    await expectUnlocked(page, 1);
  });

  test("holding Space (key repeat) bowls once", async ({ page }) => {
    await openFrozen(page, "/arena/cricket");
    await stepUntil(
      page,
      () => cssVar(page, "--meter"),
      (v) => v < 0.2,
    );
    // Down, down, down is a key held: the second and third keydowns carry `repeat`.
    await page.keyboard.down("Space");
    await page.keyboard.down("Space");
    await page.keyboard.down("Space");
    await page.keyboard.up("Space");
    await pass(page);
    await expectUnlocked(page, 1);
    await expect(game(page)).toHaveAttribute("data-phase", "ready");
  });

  test("Space and a click during the flight and the call do nothing", async ({ page }) => {
    await openFrozen(page, "/arena/cricket");
    await stepUntil(
      page,
      () => cssVar(page, "--meter"),
      (v) => v < 0.2,
    );
    await page.keyboard.press("Space");
    await expect(game(page)).not.toHaveAttribute("data-phase", "ready");
    // Straight away (flight), then again once the call is on screen.
    await page.keyboard.press("Space");
    await page.keyboard.press("Enter");
    await advanceTo(page, ["called"]);
    await page.keyboard.press("Space");
    await page.getByRole("button", { name: /^(BOWL · SPACE|TAP TO BOWL)$/ }).click({ force: true });
    await advanceTo(page, ["ready"]);
    await page.clock.runFor(500);
    await expectUnlocked(page, 1);
  });
});

test("a resize across 1200px keeps the game and shows one layout (Review Focus 3)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "starts on the stage");
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await forceLuck(page, 0.99);
  await openFrozen(page, "/arena/cricket");
  await release(page, miss);
  await pass(page, ["ready"]);
  await expect(page.locator("[data-stage]")).toBeVisible();
  await expect(page.locator("[data-game-column]")).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("[data-stage]")).toBeHidden();
  await expect(page.locator("[data-game-column]")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  const column = page.locator("[data-game-column]");
  await expect(column.getByText("INNINGS 01 UNLOCKED · NOT OUT")).toBeVisible();
  await expect(column.getByText("DEUTSCHE BANK")).toBeVisible();
  await expect(column.getByText("YOU BOWLING · 2/3")).toBeVisible();
  // The game goes on in the new layout: the next ball is the second.
  await release(page, miss);
  await pass(page, ["ready"]);
  await expect(column.getByText("YOU BOWLING · 3/3")).toBeVisible();

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("[data-stage]")).toBeVisible();
  await expect(page.locator("[data-game-column]")).toBeHidden();
  await expectUnlocked(page, 2);
  await expect(page.locator("[data-stage]").getByText("BALL 3 OF 3")).toBeVisible();
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
  await openFrozen(page, "/arena/cricket");
  await perfectOver(page);
  await expect(page.getByRole("link", { name: cricket.see })).toBeVisible();
  await page.getByRole("button", { name: cricket.again }).click();
  await expect(game(page)).toHaveAttribute("data-phase", "ready");
  await expectUnlocked(page, 0);
  expect(errors).toEqual([]);
});

test.describe("reduced motion (G10)", () => {
  test("no BOWL button: the over plays itself, then the end, saved as 14* NOT OUT", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/cricket");
    await expect(page.getByRole("button", { name: /BOWL/ })).toHaveCount(0);
    await expect(page.locator("[data-game] [data-part=cursor]")).toHaveCount(0);
    await page.clock.runFor(3000);
    await expectUnlocked(page, 3);
    await advanceTo(page, ["end"]);
    await expect(page.getByRole("button", { name: cricket.again })).toBeVisible();
    await expect(page.getByRole("link", { name: cricket.see })).toBeVisible();
    expect((await stored(page)).lastScores.cricket).toBe("14* NOT OUT");
    // REMATCH plays it again.
    await page.getByRole("button", { name: cricket.again }).click();
    await expectUnlocked(page, 0);
    await page.clock.runFor(3000);
    await expectUnlocked(page, 3);
  });
});

test("keyboard only: Tab reaches BOWL, SKIP and QUICK VIEW; the end takes focus", async ({
  page,
}, testInfo) => {
  await forceLuck(page, 0.99);
  await openFrozen(page, "/arena/cricket");
  const bowl = testInfo.project.name === "desktop" ? cricket.bowl : cricket.bowlPhone;
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
      [bowl, cricket.skip, ui.hud.quickView].map((n) => expect.stringContaining(n)),
    ),
  );
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await perfectOver(page);
  await expect(page.getByRole("link", { name: cricket.see })).toBeFocused();
  // Space on the focused end link follows it; it is never a shot.
  await expect(game(page)).toHaveAttribute("data-phase", "end");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the fresh board with SKIP and QUICK VIEW as plain links", async ({ page }) => {
    await page.goto("/arena/cricket");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.cricket.heading);
    await expect(page.getByText("0 / 3 UNLOCKED").first()).toBeAttached();
    const skip = page.getByRole("link", { name: cricket.skip });
    const quick = page.getByRole("link", { name: ui.hud.quickView });
    await expect(skip).toHaveAttribute("href", "/career");
    await expect(quick).toHaveAttribute("href", "/scout");
    await skip.click();
    await expect(page).toHaveURL(/\/career$/);
  });
});

test("leaving mid-game: no timer fires and nothing is saved", async ({ page }) => {
  const errors = watchErrors(page);
  await forceLuck(page, 0.99);
  await openFrozen(page, "/arena/cricket");
  await release(page, perfect);
  await advanceTo(page, ["called"]);
  await page.clock.resume();
  await page.getByRole("link", { name: cricket.skip }).click();
  await expect(page).toHaveURL(/\/career$/);
  // Past where the call, and the next ball, would have been.
  await page.waitForTimeout(2500);
  expect((await stored(page)).lastScores?.cricket).toBeUndefined();
  expect(errors).toEqual([]);
});

test.describe("viewports (Review Focus 5)", () => {
  test("every size holds the game's rules", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "sets its own sizes");
    test.setTimeout(120_000);
    for (const [width, height] of VIEWPORTS) {
      await page.setViewportSize({ width, height });
      await page.goto("/arena/cricket");
      await waitForHydration(page);
      await expectGameViewport(page);
    }
  });
});

test.describe("the phone's pitch centre line (D-9)", () => {
  test("the far stumps, the Yash ring and the pitch share one centre", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "the column is the phone's layout");
    const centreX = async (selector: string) =>
      page
        .locator(`[data-game-column] ${selector}`)
        .first()
        .evaluate((el) => {
          const box = el.getBoundingClientRect();
          return box.left + box.width / 2;
        });
    for (const { width, height } of [
      { width: 390, height: 844 },
      { width: 360, height: 640 },
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto("/arena/cricket");
      await waitForHydration(page);
      const pitch = await centreX("[data-part=pitch]");
      expect(Math.abs((await centreX("[data-part=stumps-far]")) - pitch)).toBeLessThanOrEqual(1);
      expect(Math.abs((await centreX("[data-who=yash]")) - pitch)).toBeLessThanOrEqual(1);
      expect(Math.abs((await centreX("[data-part=length]")) - pitch)).toBeLessThanOrEqual(1);
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
    await openFrozen(page, "/arena/cricket");
    await scan(page);

    await release(page, miss);
    await advanceTo(page, ["called"]);
    await expect(call(page)).toBeVisible();
    await scan(page);

    await advanceTo(page, ["ready"]);
    await release(page, miss);
    await pass(page, ["ready"]);
    await release(page, miss);
    await pass(page, ["end"]);
    await scan(page);
  });
});
