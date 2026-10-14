import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { expectNoA11yViolations } from "../support/a11y";
import { waitForFiniteAnimations } from "../support/animations";
import { expectMatchesArtboard } from "../support/visual";
import { waitForHydration } from "./support/contentPage";
import {
  advanceTo,
  game,
  miss,
  pass,
  perfect,
  perfectOver,
  release,
  stored,
} from "./support/cricket";
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

/** Collects the page's errors: a game must never reach the console with one. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
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

test.describe("perfect play still loses (F1)", () => {
  test("three perfect balls and a FOUR: the scorecard, BOWL AGAIN, then PLAYED on the Hub", async ({
    page,
  }) => {
    await forceLuck(page, 0);
    await openFrozen(page, "/arena/cricket");
    await perfectOver(page);
    await expect(page.getByText(/CLAIM/)).toHaveCount(0);
    await expect(call(page)).toHaveText(cricket.calls.four);
    await expect(call(page)).toHaveAttribute("data-tone", "floodlight");
    const see = page.getByRole("link", { name: cricket.see });
    await expect(see).toBeVisible();
    await expect(see).toHaveAttribute("href", "/career");
    await expect(page.getByRole("button", { name: cricket.again })).toBeVisible();

    const state = await stored(page);
    expect(state.yashWins).toBe(1);
    expect(state.lastScores.cricket).toBe("4* NOT OUT");
    expect(state.bestForm.cricket).toBe(1);

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
    expect((await stored(page)).yashWins).toBe(2);
  });
});

test("with tennis and badminton already played, the over's end leads to SEE FULL TIME (F3)", async ({
  page,
}) => {
  await page.addInitScript(() => {
    localStorage.setItem(
      "arena:v1",
      JSON.stringify({
        state: {
          venuesPlayed: ["tennis", "badminton"],
          lastScores: { tennis: "GAME YASH", badminton: "21–19" },
          bestForm: { tennis: 0, badminton: 0 },
          sectionsSeen: [],
          yashWins: 2,
        },
        version: 2,
      }),
    );
  });
  await forceLuck(page, 0);
  await openFrozen(page, "/arena/cricket");
  await perfectOver(page);
  const fullTime = page.getByRole("link", { name: ui.games.fullTime });
  await expect(fullTime).toBeVisible();
  await expect(fullTime).toHaveAttribute("href", "/arena/full-time");
  await expect(fullTime).toBeFocused();
  await expect(page.getByRole("link", { name: cricket.see })).toHaveCount(0);
  await expect(page.getByRole("button", { name: cricket.again })).toBeVisible();
  expect((await stored(page)).venuesPlayed).toEqual(["tennis", "badminton", "cricket"]);

  await page.clock.resume();
  await fullTime.click();
  await expect(page).toHaveURL(/\/arena\/full-time$/);
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
    // The last ball also says how the over ended (m-4).
    "SIX. Innings 03 unlocked: PICT, PUNE, B.Tech, Information Technology, 2020 – 2024. Over complete. Yash 18 not out.",
  ]);
  // Each ball is heard once: the commentary bar's own live region is not on the page while a game is.
  await expect(page.locator("[data-game] [aria-live]")).toHaveCount(0);
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
      await openFrozen(page, "/arena/cricket");
      await expectGameViewport(page);
      await release(page, perfect);
      await advanceTo(page, ["called"]);
      await expect(call(page)).toBeVisible();
      // The reveal and the call pop in: judge them once they have settled.
      await waitForFiniteAnimations(page);
      await expectGameViewport(page);
    });
  });
}

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

test.describe("review minors", () => {
  const bowlButton = (page: Page) =>
    page.getByRole("button", { name: /^(BOWL · SPACE|TAP TO BOWL)$/ });

  test("m-6: Space on the focused BOWL bowls on the key going down, not when it comes up", async ({
    page,
  }) => {
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/cricket");
    await bowlButton(page).focus();
    await stepUntil(
      page,
      () => cssVar(page, "--meter"),
      (v) => v < 0.2,
    );
    await page.keyboard.down("Space");
    // The key is still down: a button's own Space would not have fired yet.
    await expect(game(page)).not.toHaveAttribute("data-phase", "ready");
    await page.keyboard.up("Space");
    await pass(page);
    await expectUnlocked(page, 1);
  });

  test("m-9: the BOWL ring is the button's pseudo-element, and will-change is set only in flight", async ({
    page,
  }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "one layout is enough");
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/cricket");
    const look = () =>
      page.evaluate(() => {
        const button = [...document.querySelectorAll("button")].find((b) =>
          /BOWL/.test(b.textContent ?? ""),
        )!;
        const plate = button.querySelector("[data-plate]")!;
        const ball = document.querySelector("[data-game] [data-part=ball]")!;
        return {
          ring: getComputedStyle(button, "::after").animationName,
          plate: getComputedStyle(plate).animationName,
          willChange: getComputedStyle(ball).willChange,
        };
      });
    expect(await look()).toEqual({ ring: "ring", plate: "none", willChange: "auto" });
    await release(page, perfect);
    await advanceTo(page, ["flight"]);
    await page.clock.runFor(60);
    expect((await look()).willChange).toBe("transform");
    await pass(page);
    expect((await look()).willChange).toBe("auto");
  });

  test("m-8: the phone's end has a quiet way back to the Hub; the stage has the breadcrumb", async ({
    page,
  }, testInfo) => {
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/cricket");
    for (let ball = 1; ball <= 3; ball++) {
      await release(page, miss);
      await pass(page, ball < 3 ? ["ready"] : ["end"]);
    }
    const back = page.getByRole("link", { name: ui.games.backToHub });
    if (testInfo.project.name === "mobile") {
      await expect(back).toBeVisible();
      await expect(back).toHaveAttribute("href", "/arena");
    } else {
      await expect(back).toHaveCount(0);
    }
  });

  test("m-3: a visitor who has tabbed to QUICK VIEW keeps the focus when the game ends by itself", async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await forceLuck(page, 0.99);
    await openFrozen(page, "/arena/cricket");
    const quick = page.getByRole("link", { name: ui.hud.quickView });
    await quick.focus();
    await page.clock.runFor(3000);
    await advanceTo(page, ["end"]);
    await expect(quick).toBeFocused();
  });
});
