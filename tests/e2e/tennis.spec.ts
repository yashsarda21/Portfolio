import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { expectNoA11yViolations } from "../support/a11y";
import { waitForFiniteAnimations } from "../support/animations";
import { waitForHydration } from "./support/contentPage";
import { expectGameViewport, forceLuck, openFrozen, pauseClock, VIEWPORTS } from "./support/game";

const tennis = ui.games.tennis;
const NAMES = tennis.aim.to;
const OPEN_RIGHT = `${NAMES.right} ${tennis.aim.dash} ${tennis.aim.openName}`;

// The stage is heavy to draw and the host is often loaded: a game is many fake-clock steps.
test.describe.configure({ timeout: 90_000 });

/** The game root: one per page. */
const game = (page: Page) => page.locator("[data-game]");
const phaseOf = (page: Page) => game(page).getAttribute("data-phase");
/** The big call of the layout on screen. */
const call = (page: Page) => page.locator("[data-game] [data-tone]:visible");
/** The score bug of the layout on screen. */
const bug = (page: Page) => page.locator("[data-game] [role=group]:visible");
/** The courtside cards the stage has turned in. */
const cards = (page: Page) => page.locator("[data-game] [data-side]:visible");
const serving = (page: Page) =>
  page.locator("[data-game]").getByText("YASH · SERVING", { exact: false });
const stored = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("arena:v1") ?? "{}").state ?? {});

/** What is on screen of the highlights so far: the stage's cards, or the phone's chip for the newest and the bug for the count. */
async function expectUnlocked(page: Page, count: number) {
  if (await page.locator("[data-stage]").isVisible()) {
    await expect(cards(page)).toHaveCount(count);
  } else {
    if (count < 3) await expect(bug(page)).toContainText(`${ui.games.rally} ${count + 1}/3`);
    if (count > 0) {
      await expect(page.locator("[data-game-column]")).toContainText(
        `${tennis.highlight} 0${count} · ${["QF", "SF", "F"][count - 1]} ${ui.games.unlocked}`,
      );
    }
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

/** Moves the paused fake clock in `step` ms until the game is in one of `phases` (at most `maxMs` of game time). */
async function advanceTo(page: Page, phases: string[], maxMs = 8000, step = 100) {
  for (let spent = 0; spent <= maxMs; spent += step) {
    const phase = await phaseOf(page);
    if (phase && phases.includes(phase)) return phase;
    await page.clock.runFor(step);
  }
  throw new Error(`the game never reached ${phases.join(" / ")} (it is in ${await phaseOf(page)})`);
}

/** Runs the clock up to the hit: the window is open, and a return now is judged at (nearly) 0 ms, a perfect one. */
const toWindow = (page: Page) => advanceTo(page, ["window"], 5000, 20);

/** The serve is judged: the game has left the serve's phases, then lets the call hold until the next serve or the end. */
async function pass(page: Page, until: string[] = ["tell", "verdict", "end"]) {
  await expect(game(page)).not.toHaveAttribute("data-phase", /^(ready|tell|toss|window)$/);
  return advanceTo(page, until);
}

/** A whole game of prompt returns on `key`'s side, then on to the end buttons. */
async function playGame(page: Page, key: "ArrowLeft" | "ArrowRight") {
  for (let serve = 0; serve < 3; serve++) {
    await toWindow(page);
    await page.keyboard.press(key);
    await pass(page);
  }
  await advanceTo(page, ["end"]);
}

test.describe("the forced win (the 1 %)", () => {
  test("three perfect returns: RETURN WINNER, then CLAIM YOUR BREAK, saved and unlocked", async ({
    page,
  }) => {
    await forceLuck(page, 0); // every serve opens left, toss 400
    await openFrozen(page, "/arena/tennis");
    await playGame(page, "ArrowLeft");
    await expect(call(page)).toHaveText(tennis.calls.winner);
    await expect(call(page)).toHaveAttribute("data-tone", "volt");
    await expect(bug(page)).toContainText(tennis.status.broke);
    const claim = page.getByRole("link", { name: tennis.claim });
    await expect(claim).toBeVisible();
    await expect(claim).toBeFocused();
    await expect(page.getByRole("button", { name: ui.hud.rematch })).toHaveCount(0);

    const state = await stored(page);
    expect(state.record).toEqual({ yash: 0, you: 1 });
    expect(state.lockerRoomUnlocked).toBe(true);
    expect(state.teamUpPrefill).toBe("I beat you.");
    expect(state.lastScores.tennis).toBe("BROKE SERVE");
    expect(state.achievements).toContain("giant-killer");

    await page.clock.resume();
    await claim.click();
    await expect(page).toHaveURL(/\/arena\/giant-killer$/);
  });
});

test.describe("the forced loss", () => {
  test("three perfect returns and the line: GAME YASH, the highlights, REMATCH, then PLAYED on the Hub", async ({
    page,
  }) => {
    await forceLuck(page, 0.99); // every serve opens right
    await openFrozen(page, "/arena/tennis");
    await playGame(page, "ArrowRight");
    await expect(call(page)).toHaveText(tennis.calls.line);
    await expect(call(page)).toHaveAttribute("data-tone", "floodlight");
    await expect(bug(page)).toContainText(tennis.status.game);
    const see = page.getByRole("link", { name: tennis.see });
    await expect(see).toBeVisible();
    await expect(see).toHaveAttribute("href", "/highlights");
    await expect(see).toBeFocused();
    await expect(page.getByRole("button", { name: ui.hud.rematch })).toBeVisible();

    const state = await stored(page);
    expect(state.record).toEqual({ yash: 1, you: 0 });
    expect(state.lastScores.tennis).toBe("GAME YASH");

    // A client navigation, so the page and the record are the same ones: the stage's breadcrumb goes to the Hub; the
    // column has none (the board draws none), so it goes through the highlights and the tab bar.
    await page.clock.resume();
    const hub = page.locator("a[href='/arena']:visible").first();
    if (await hub.count()) {
      await hub.click();
    } else {
      await see.click();
      await expect(page).toHaveURL(/\/highlights$/);
      // The wipe from the game swallows a press that lands while it still covers the page: press again until it takes.
      await expect(async () => {
        await page.getByRole("link", { name: ui.tabs.arena }).click({ timeout: 1000 });
        await expect(page).toHaveURL(/\/arena$/, { timeout: 1000 });
      }).toPass({ timeout: 10_000 });
    }
    await expect(page).toHaveURL(/\/arena$/);
    const card = page.getByRole("article").filter({ hasText: ui.venues.tennis });
    // The stage's card says PLAYED · GAME YASH; the phone's fixture keeps to the score.
    const onStage = await page.locator("[data-stage]").isVisible();
    await expect(card).toContainText(onStage ? "PLAYED · GAME YASH" : "GAME YASH");
    await expect(card.getByRole("link", { name: ui.hud.rematch })).toBeVisible();
  });

  test("after the second loss the highlight leads (G9), and REMATCH starts a clean game", async ({
    page,
  }) => {
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/tennis");
    await playGame(page, "ArrowRight");
    await expect(page.getByRole("link", { name: ui.games.highlight })).toHaveCount(0);

    await page.getByRole("button", { name: ui.hud.rematch }).click({ force: true });
    await expect(game(page)).toHaveAttribute("data-phase", "ready");
    await expectUnlocked(page, 0);
    await expect(bug(page)).toContainText("RALLY 1");
    // Nothing of the finished game is left to fire into the new one: only the first serve follows.
    await page.clock.runFor(100);
    await expect(game(page)).toHaveAttribute("data-phase", "ready");

    await playGame(page, "ArrowRight");
    const highlight = page.getByRole("link", { name: ui.games.highlight });
    await expect(highlight).toBeVisible();
    await expect(highlight).toHaveAttribute("href", "/highlights");
    await expect(page.getByRole("button", { name: ui.hud.rematch })).toBeVisible();
    expect((await stored(page)).record).toEqual({ yash: 2, you: 0 });
  });
});

test.describe("what a return reveals and says", () => {
  test("a pick during the toss is TOO EARLY, and the card is revealed all the same", async ({
    page,
  }) => {
    await forceLuck(page, 0.99); // open right, toss 895 ms
    await openFrozen(page, "/arena/tennis");
    await advanceTo(page, ["toss"], 3000, 20);
    await expect(page.getByRole("button", { name: OPEN_RIGHT }).first()).toBeVisible();
    await page.keyboard.press("ArrowRight");
    await expect(call(page)).toHaveText(tennis.calls.early);
    await expect(call(page)).toHaveAttribute("data-tone", "floodlight");
    await expectUnlocked(page, 1);
    await expect(
      page.locator("[data-game]").getByText("POWER BI DASHBOARD").locator("visible=true").first(),
    ).toBeVisible();
  });

  test("a wrong side is WRONG SIDE, a late one is ACE", async ({ page }) => {
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/tennis");
    await toWindow(page);
    await page.keyboard.press("ArrowLeft");
    await expect(call(page)).toHaveText(tennis.calls.wrong);
    await advanceTo(page, ["tell"]);
    await toWindow(page);
    await page.clock.runFor(1000); // the 700 ms window is over: nobody picked
    await expect(call(page)).toHaveText(tennis.calls.ace);
    await expectUnlocked(page, 2);
  });

  test("with no input the serves go by: ACE, ACE, ON THE LINE, three cards, the end", async ({
    page,
  }) => {
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/tennis");
    const calls: string[] = [];
    let before: string | undefined;
    for (let spent = 0; spent <= 20_000 && (await phaseOf(page)) !== "end"; spent += 100) {
      const text = (await call(page).allTextContents()).at(0);
      // A call is new when it appears after a gap or differs from the one before.
      if (text && text !== before) calls.push(text);
      before = text;
      await page.clock.runFor(100);
    }
    expect(await phaseOf(page)).toBe("end");
    // The third serve is Yash's winner whether or not it was returned (referee: it clips the line).
    expect(calls).toEqual([tennis.calls.ace, tennis.calls.ace, tennis.calls.line]);
    await expectUnlocked(page, 3);
    expect((await stored(page)).lastScores.tennis).toBe("GAME YASH");
  });

  test("every return reveals a card and says it", async ({ page }) => {
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/tennis");
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
    for (let serve = 1; serve <= 3; serve++) {
      await toWindow(page);
      await page.keyboard.press("ArrowLeft"); // the open side is right: wrong side
      await pass(page);
    }
    await advanceTo(page, ["end"]);
    const said = await page.evaluate(() => (window as unknown as { __said: string[] }).__said);
    expect(said.map((s) => s.slice(0, s.indexOf(":")))).toEqual([
      "WRONG SIDE. Highlight 01 unlocked",
      "WRONG SIDE. Highlight 02 unlocked",
      "ON THE LINE. Highlight 03 unlocked",
    ]);
    expect(said[0]).toContain("POWER BI DASHBOARD");
    expect(said[2]).toContain("AI INTERVIEW GROOMING PLATFORM");
    await expectUnlocked(page, 3);
  });
});

test.describe("racing inputs (Review Focus 1)", () => {
  test("holding the key (repeat) and a press with the zone focused return once", async ({
    page,
  }) => {
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/tennis");
    await toWindow(page);
    // Down, down, down is a key held: the second and third keydowns carry `repeat`.
    await page.keyboard.down("ArrowRight");
    await page.keyboard.down("ArrowRight");
    await page.keyboard.down("ArrowRight");
    await page.keyboard.up("ArrowRight");
    await expect(call(page)).toHaveText(tennis.calls.clean);
    await pass(page);
    await expectUnlocked(page, 1);
  });

  test("a key, an Enter and a click during the call do nothing", async ({ page }) => {
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/tennis");
    await toWindow(page);
    await page.keyboard.press("ArrowRight");
    await page.keyboard.press("ArrowLeft");
    await page.keyboard.press("Enter");
    await expect(game(page)).toHaveAttribute("data-phase", "called");
    await page.getByRole("button", { name: NAMES.left }).first().click({ force: true });
    await page.keyboard.press("ArrowLeft");
    await page.clock.runFor(300);
    await expectUnlocked(page, 1);
    await expect(call(page)).toHaveText(tennis.calls.clean);
  });
});

test.describe("hidden mid-serve (Review Focus 2)", () => {
  test("the serve is cancelled, never judged, and served again when the tab is back", async ({
    page,
  }) => {
    await page.addInitScript(() => {
      let hidden = false;
      Object.defineProperty(document, "visibilityState", {
        configurable: true,
        get: () => (hidden ? "hidden" : "visible"),
      });
      Object.defineProperty(document, "hidden", { configurable: true, get: () => hidden });
      (window as unknown as { __hide: (h: boolean) => void }).__hide = (h) => {
        hidden = h;
        document.dispatchEvent(new Event("visibilitychange"));
      };
    });
    const hide = (hidden: boolean) =>
      page.evaluate(
        (h) => (window as unknown as { __hide: (h: boolean) => void }).__hide(h),
        hidden,
      );
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/tennis");
    await toWindow(page);

    await hide(true);
    await expect(game(page)).toHaveAttribute("data-phase", "ready");
    // Far longer than the window, the toss and the whole call: nothing is judged while away.
    await page.clock.runFor(5000);
    await expect(game(page)).toHaveAttribute("data-phase", "ready");
    await expectUnlocked(page, 0);
    await expect(call(page)).toHaveCount(0);

    await hide(false);
    await expect(game(page)).toHaveAttribute("data-phase", "tell");
    await toWindow(page);
    await page.keyboard.press("ArrowRight");
    await expect(call(page)).toHaveText(tennis.calls.clean);
    await expectUnlocked(page, 1);
  });
});

test.describe("click and swipe (G3)", () => {
  test("a click on the open side returns it", async ({ page }, testInfo) => {
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/tennis");
    await toWindow(page);
    // The stage's zone, or under the thumb on the column.
    const scope = testInfo.project.name === "desktop" ? "[data-stage]" : "[data-part=thumb]";
    await page.locator(scope).getByRole("button", { name: OPEN_RIGHT }).click({ force: true });
    await expect(call(page)).toHaveText(tennis.calls.clean);
    await expectUnlocked(page, 1);
  });

  test("on the phone a swipe on the court picks a side, and only a real swipe does", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "the column is the phone's layout");
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/tennis");
    await toWindow(page);
    const swipe = (dx: number, dy: number, pointerType = "touch") =>
      page.locator("[data-game-column] [data-part=field]").evaluate(
        (el, a) => {
          const box = el.getBoundingClientRect();
          const x = box.left + box.width / 2;
          const y = box.top + box.height / 2;
          const at = (type: string, px: number, py: number) =>
            el.dispatchEvent(
              new PointerEvent(type, {
                bubbles: true,
                pointerId: 7,
                pointerType: a.pointerType,
                clientX: px,
                clientY: py,
              }),
            );
          at("pointerdown", x, y);
          at("pointerup", x + a.dx, y + a.dy);
        },
        { dx, dy, pointerType },
      );
    await expect(page.locator("[data-game-column] [data-part=field]")).toHaveCSS(
      "touch-action",
      "pan-y",
    );
    // Too short, too steep, and a mouse: none is a swipe.
    await swipe(30, 0);
    await swipe(80, 120);
    await swipe(120, 0, "mouse");
    await expect(game(page)).toHaveAttribute("data-phase", "window");
    // A swipe right is the open side (right): clean.
    await swipe(90, 10);
    await expect(call(page)).toHaveText(tennis.calls.clean);
    await advanceTo(page, ["tell"]);
    await toWindow(page);
    await swipe(-90, -10);
    await expect(call(page)).toHaveText(tennis.calls.wrong);
  });
});

test.describe("reduced motion (G10)", () => {
  test("no zones to pick: the rally plays itself, three cards, then the end, saved as GAME YASH", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/tennis");
    await expect(page.getByRole("button", { name: NAMES.left })).toHaveCount(0);
    await expect(page.locator("[data-game] [data-part=tracer]")).toHaveCount(0);
    await page.clock.runFor(3000);
    await expectUnlocked(page, 3);
    await advanceTo(page, ["end"]);
    await expect(page.getByRole("button", { name: ui.hud.rematch })).toBeVisible();
    await expect(page.getByRole("link", { name: tennis.see })).toBeVisible();
    expect((await stored(page)).lastScores.tennis).toBe("GAME YASH");
    // REMATCH plays it again.
    await page.getByRole("button", { name: ui.hud.rematch }).click({ force: true });
    await expectUnlocked(page, 0);
    await page.clock.runFor(3000);
    await expectUnlocked(page, 3);
  });
});

test("a resize across 1200px keeps the game and shows one layout (Review Focus 3)", async ({
  page,
}, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "starts on the stage");
  const errors = watchErrors(page);
  await page.setViewportSize({ width: 1440, height: 900 });
  await forceLuck(page, 0.99);
  await openFrozen(page, "/arena/tennis");
  await toWindow(page);
  await page.keyboard.press("ArrowRight");
  await pass(page, ["tell"]);
  await expect(page.locator("[data-stage]")).toBeVisible();
  await expect(page.locator("[data-game-column]")).toBeHidden();

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(page.locator("[data-stage]")).toBeHidden();
  await expect(page.locator("[data-game-column]")).toBeVisible();
  await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
  const column = page.locator("[data-game-column]");
  await expect(column.getByText("HIGHLIGHT 01 · QF UNLOCKED")).toBeVisible();
  await expect(column.getByText("POWER BI DASHBOARD", { exact: true })).toBeVisible();
  await expect(column.getByText("RALLY 2/3")).toBeVisible();
  // The serve in play goes on in the new layout: a swipe-free pick on the thumb.
  await toWindow(page);
  await page
    .locator("[data-part=thumb]")
    .getByRole("button", { name: OPEN_RIGHT })
    .click({ force: true });
  await expect(call(page)).toHaveText(tennis.calls.clean);

  await page.setViewportSize({ width: 1440, height: 900 });
  await expect(page.locator("[data-stage]")).toBeVisible();
  await expect(page.locator("[data-game-column]")).toBeHidden();
  await expectUnlocked(page, 2);
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
  await openFrozen(page, "/arena/tennis");
  await playGame(page, "ArrowRight");
  await expect(page.getByRole("link", { name: tennis.see })).toBeVisible();
  await page.getByRole("button", { name: ui.hud.rematch }).click({ force: true });
  await expect(game(page)).toHaveAttribute("data-phase", "ready");
  await expectUnlocked(page, 0);
  expect(errors).toEqual([]);
});

test("keyboard only: Tab reaches the zones, SKIP and QUICK VIEW; the end takes focus", async ({
  page,
}, testInfo) => {
  await forceLuck(page, 0.99);
  await openFrozen(page, "/arena/tennis");
  await toWindow(page);
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
  // The phone's zones on the court are a picture of the thumb's buttons: only those take Tab.
  const wanted = [NAMES.left, tennis.skip, ui.hud.quickView];
  expect([...reached]).toEqual(
    expect.arrayContaining(wanted.map((n) => expect.stringContaining(n))),
  );
  if (testInfo.project.name === "mobile") {
    expect(
      await page.locator("[data-game-column] [data-part=field] button[tabindex='-1']").count(),
    ).toBe(2);
  }
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  await page.keyboard.press("ArrowRight");
  await pass(page);
  await toWindow(page);
  await page.keyboard.press("ArrowRight");
  await pass(page);
  await toWindow(page);
  await page.keyboard.press("ArrowRight");
  await pass(page, ["end"]);
  await expect(page.getByRole("link", { name: tennis.see })).toBeFocused();
  await expect(game(page)).toHaveAttribute("data-phase", "end");
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("the fresh court with SKIP and QUICK VIEW as plain links", async ({ page }) => {
    await page.goto("/arena/tennis");
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.tennis.heading);
    await expect(page.getByText("0 / 3 UNLOCKED").first()).toBeAttached();
    const skip = page.getByRole("link", { name: tennis.skip });
    const quick = page.getByRole("link", { name: ui.hud.quickView });
    await expect(skip).toHaveAttribute("href", "/highlights");
    await expect(quick).toHaveAttribute("href", "/scout");
    await skip.click();
    await expect(page).toHaveURL(/\/highlights$/);
  });
});

test("leaving mid-game: no timer fires and nothing is saved", async ({ page }) => {
  const errors = watchErrors(page);
  await forceLuck(page, 0.99);
  await openFrozen(page, "/arena/tennis");
  await toWindow(page);
  await page.keyboard.press("ArrowRight");
  await advanceTo(page, ["called"]);
  await page.clock.resume();
  await page.getByRole("link", { name: tennis.skip }).click();
  await expect(page).toHaveURL(/\/highlights$/);
  // Past where the call, and the next serve, would have been.
  await page.waitForTimeout(2500);
  expect((await stored(page)).lastScores?.tennis).toBeUndefined();
  expect(errors).toEqual([]);
});

test.describe("viewports (Review Focus 5)", () => {
  test("every size holds the game's rules", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "sets its own sizes");
    test.setTimeout(120_000);
    for (const [width, height] of VIEWPORTS) {
      await page.setViewportSize({ width, height });
      await page.goto("/arena/tennis");
      await waitForHydration(page);
      await expectGameViewport(page);
    }
  });
});

test.describe("the phone's court centre line (D-9)", () => {
  test("the Yash ring, the zones and the serve's bounce stand about the court's middle", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "the column is the phone's layout");
    for (const { width, height } of [
      { width: 390, height: 844 },
      { width: 360, height: 640 },
      { width: 640, height: 900 },
    ]) {
      await page.setViewportSize({ width, height });
      await page.goto("/arena/tennis");
      await waitForHydration(page);
      const box = (selector: string) =>
        page.locator(`[data-game-column] ${selector}`).first().boundingBox();
      const court = (await box("[data-part=court]"))!;
      const middle = court.x + court.width / 2;
      const ring = (await box("[data-who=yash]"))!;
      expect(Math.abs(ring.x + ring.width / 2 - middle)).toBeLessThanOrEqual(1);
      // The zones are mirror images about the middle.
      const left = (await box("[data-state][aria-label^='Return to the left']"))!;
      const right = (await box("[data-state][aria-label^='Return to the right']"))!;
      expect(Math.abs(middle - (left.x + left.width) - (right.x - middle))).toBeLessThanOrEqual(1);
      // The serve's bounce ring is on the court's own line (court x 640 of 100..1340, scaled): left of the middle.
      const bounce = (await box("[data-part=bounce]"))!;
      expect(bounce.x + bounce.width / 2).toBeLessThan(middle);
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

  /**
   * The game does not wait for you, and a scan lets real time run: each scan is of the state the game was put in
   * just before it, and the driver below carries on from wherever the game has got to.
   */
  async function finish(page: Page) {
    for (let i = 0; i < 400 && (await phaseOf(page)) !== "end"; i++) {
      if ((await phaseOf(page)) === "window") await page.keyboard.press("ArrowRight");
      await page.clock.runFor(50);
    }
  }

  test("clean fresh, with a serve in play, during a call and at the end", async ({ page }) => {
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/tennis");
    await scan(page);

    await toWindow(page);
    await expect(serving(page).locator("visible=true").first()).toBeVisible();
    await scan(page);

    await toWindow(page);
    await page.keyboard.press("ArrowRight");
    await expect(call(page)).toBeVisible();
    await scan(page);

    await finish(page);
    await expect(game(page)).toHaveAttribute("data-phase", "end");
    await scan(page);
  });
});

test.describe("every courtside card stays on screen", () => {
  test("at the end all three cards are visible and none overlaps another or the HUD", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "the cards are the stage's");
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/tennis");
    await playGame(page, "ArrowRight");
    // The slide to make room is a transform: let it finish (it runs on real time).
    await page.clock.resume();
    await waitForFiniteAnimations(page);
    await page.waitForTimeout(700);
    const cardBoxes = cards(page);
    await expect(cardBoxes).toHaveCount(3);
    const titles = await cardBoxes.evaluateAll((els) => els.map((el) => el.textContent ?? ""));
    for (const name of ["POWER BI DASHBOARD", "KUDO BOARD", "AI INTERVIEW GROOMING PLATFORM"]) {
      expect(
        titles.some((t) => t.includes(name)),
        name,
      ).toBe(true);
    }
    const boxes = await cardBoxes.evaluateAll((els) =>
      els.map((el) => {
        // The card itself (the rotated glass), not its perspective wrapper.
        const r = el.firstElementChild!.getBoundingClientRect();
        return { x: r.x, y: r.y, width: r.width, height: r.height };
      }),
    );
    for (const [i, a] of boxes.entries()) {
      for (const b of boxes.slice(i + 1)) {
        const apart =
          a.x + a.width <= b.x ||
          b.x + b.width <= a.x ||
          a.y + a.height <= b.y ||
          b.y + b.height <= a.y;
        expect(apart, `cards ${JSON.stringify(a)} and ${JSON.stringify(b)}`).toBe(true);
      }
      // Under the HUD (76) and inside the window.
      expect(a.y).toBeGreaterThanOrEqual(76);
      expect(a.y + a.height).toBeLessThanOrEqual(900);
    }
    const left = boxes.filter((b) => b.x < 720).sort((a, b) => a.y - b.y);
    expect(left).toHaveLength(2);
    // The one that moved is above the drawn spot (380); the pill (x 456 to 984) is clear of both columns.
    expect(left[0]!.y + left[0]!.height).toBeLessThanOrEqual(380);
    expect(Math.max(...boxes.map((b) => b.x + b.width))).toBeGreaterThan(0);
  });
});
