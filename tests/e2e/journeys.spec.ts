import { expect, test, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { advanceTo, game, pass, perfectOver, stored } from "./support/cricket";
import { waitForHydration } from "./support/contentPage";
import { cssVar, forceLuck, freezeClock, openFrozen, pauseClock, stepUntil } from "./support/game";

const tennis = ui.games.tennis;
const badminton = ui.games.badminton;
const fullTime = ui.fullTime;

/*
 * Cross-page journeys (spec 9.1). Each walks the real site from one page to the next, the way a visitor does,
 * with the games on the fake clock (support/game.ts): the pages before and after a game run in real time (the
 * fake clock is installed but keeps flowing), and the game itself is paused and stepped, so no input depends on
 * how fast the host is. The per-game rules (zones, calls, every viewport) are in cricket / tennis / badminton.spec.ts.
 */

// A journey is many pages and many fake-clock steps, and the host is often loaded.
test.describe.configure({ timeout: 120_000 });

const cricket = ui.games.cricket;
const isPhone = (testInfo: { project: { name: string } }) => testInfo.project.name === "mobile";

/** A venue's card on the Hub: the stage's article or the phone's fixture. */
const venueCard = (page: Page, venue: string) =>
  page.getByRole("article").filter({ hasText: venue });
/**
 * Presses a venue's PLAY like a visitor. On the stage the card arc sways on its own and so is never "stable" to
 * Playwright's click; moving the pointer onto the button stops the sway (H9), so the pointer goes there first.
 */
async function pressPlay(page: Page, venue: string) {
  const play = venueCard(page, venue).getByRole("link", { name: /^PLAY$/ });
  await expect(play).toBeVisible();
  const box = await play.boundingBox();
  if (box) await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await page.waitForTimeout(400);
  await play.click();
}
const wipe = (page: Page) => page.locator("[data-wipe] > div").first();
/** The Hub's index: the stage's rail, or the phone's drawer once opened. */
const openIndex = async (page: Page, phone: boolean) => {
  if (!phone) return page.locator("aside");
  await page.locator("[data-hub-column]").getByRole("button", { name: ui.hub.drawer.open }).click();
  return page.getByRole("dialog", { name: ui.hub.index.label });
};
const bowlButton = (page: Page) =>
  page.getByRole("button", { name: /^(BOWL · SPACE|TAP TO BOWL)$/ });

/** Collects uncaught exceptions: a journey must never reach one. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  return errors;
}

/** Once the route has changed and the wipe has gone, waits for the game to take input, then stops its clock. */
async function arriveAndFreeze(page: Page, path: RegExp, phase: RegExp = /^ready$/) {
  await expect(page).toHaveURL(path);
  await expect(wipe(page)).toBeHidden();
  await expect(game(page)).toHaveAttribute("data-phase", phase);
  await pauseClock(page);
}

/** One ball of any quality: the cursor is read near the start of its sweep (a miss), then the ball is bowled. */
async function bowlAnyBall(page: Page, how: "click" | "key") {
  await stepUntil(
    page,
    () => cssVar(page, "--meter"),
    (v) => v < 0.2,
  );
  // The button is clicked without Playwright's own settle checks, which wait on animation frames the paused clock holds.
  if (how === "click") await bowlButton(page).click({ force: true });
  else await page.keyboard.press("Space");
  await pass(page);
}

/** Goes to the Hub the way a visitor does from a content page: the HUD link on the stage, the tab bar on the phone (`tabs`). */
async function backToHub(page: Page, tabs: boolean) {
  // The wipe from the page before swallows a press that lands while it still covers the screen: press again until it takes.
  await expect(async () => {
    const link = tabs
      ? page.getByRole("link", { name: ui.tabs.arena })
      : page.locator("a[href='/arena']:visible").first();
    await link.click({ timeout: 1000 });
    await expect(page).toHaveURL(/\/arena$/, { timeout: 1000 });
  }).toPass({ timeout: 10_000 });
}

/** Runs the paused clock in `step` ms until the game is in one of `phases` (the tennis window needs a finer step than 100 ms). */
async function advanceGame(page: Page, phases: string[], maxMs = 8000, step = 100) {
  for (let spent = 0; spent <= maxMs; spent += step) {
    const phase = await game(page).getAttribute("data-phase");
    if (phase && phases.includes(phase)) return;
    await page.clock.runFor(step);
  }
  throw new Error(`the game never reached ${phases.join(" / ")}`);
}

/** Leaves a finished game for the Hub: the stage's HUD link, or the phone's BACK TO THE HUB at the end. */
async function leaveGameForHub(page: Page, phone: boolean) {
  await page.clock.resume();
  const link = phone
    ? page.getByRole("link", { name: ui.games.backToHub })
    : page.locator("a[href='/arena']:visible").first();
  await expect(async () => {
    await link.click({ timeout: 1000 });
    await expect(page).toHaveURL(/\/arena$/, { timeout: 1000 });
  }).toPass({ timeout: 10_000 });
}

/** Cricket from the Hub: three balls of any quality. */
async function playCricketFromHub(page: Page) {
  await pressPlay(page, ui.venues.cricket);
  await arriveAndFreeze(page, /\/arena\/cricket$/);
  for (let ball = 0; ball < 3; ball++) await bowlAnyBall(page, "click");
  await advanceTo(page, ["end"]);
}

/** Tennis from the Hub: three returns of any quality (the key is the side the serve opens on, with luck forced). */
async function playTennisFromHub(page: Page) {
  await pressPlay(page, ui.venues.tennis);
  await arriveAndFreeze(page, /\/arena\/tennis$/, /./);
  for (let serve = 0; serve < 3; serve++) {
    await advanceGame(page, ["window"], 5000, 20);
    await page.keyboard.press("ArrowRight");
    await expect(game(page)).not.toHaveAttribute("data-phase", /^(ready|tell|toss|window)$/);
    await advanceGame(page, ["tell", "verdict", "end"]);
  }
  await advanceGame(page, ["end"]);
}

/** Badminton from the Hub: four held shots of any weight. */
async function playBadmintonFromHub(page: Page) {
  await pressPlay(page, ui.venues.badminton);
  await arriveAndFreeze(page, /\/arena\/badminton$/, /./);
  for (let rally = 0; rally < 4; rally++) {
    await page.keyboard.down("Space");
    await stepUntil(
      page,
      () => cssVar(page, "--power"),
      (v) => v >= 0.45,
    );
    await page.keyboard.up("Space");
    await expect(game(page)).not.toHaveAttribute("data-phase", /^(ready|charging)$/);
    await advanceGame(page, ["ready", "verdict", "end"]);
  }
  await advanceGame(page, ["end"]);
}

/**
 * The matchday up to the third game's end, from the Hub, on the fake clock: cricket, then tennis, then badminton.
 * The first two ends still lead to their pages (F3); it returns with the clock paused on the badminton end.
 */
async function playMatchday(page: Page, phone: boolean) {
  await page.goto("/arena");
  await waitForHydration(page);
  await playCricketFromHub(page);
  await expect(page.getByRole("link", { name: cricket.see })).toBeVisible();
  await expect(page.getByRole("link", { name: ui.games.fullTime })).toHaveCount(0);
  await leaveGameForHub(page, phone);

  await playTennisFromHub(page);
  await expect(page.getByRole("link", { name: tennis.see })).toBeVisible();
  await expect(page.getByRole("link", { name: ui.games.fullTime })).toHaveCount(0);
  await leaveGameForHub(page, phone);

  await playBadmintonFromHub(page);
}

/** What Full Time must say in a finished matchday: the done state, the score, a grade, the Team Up card. */
async function expectFullTimeDone(page: Page) {
  await expect(page).toHaveURL(/\/arena\/full-time$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    new RegExp(
      `^(${Object.values(fullTime.grades)
        .map((g) => g.headline.replace(".", "\\."))
        .join("|")})$`,
    ),
  );
  await expect(page.getByRole("img", { name: `${fullTime.board}: You 0, Yash 3` })).toBeVisible();
  await expect(
    page.getByText(`${fullTime.eyebrow.done} · 3 OF 3 VENUES`).filter({ visible: true }),
  ).toBeVisible();
  await expect(page.getByText(fullTime.pending.headline)).toHaveCount(0);
}

test("the full matchday: cricket, tennis, badminton → SEE FULL TIME → YOU 0 · 3 YASH → Team Up says Good game, Yash. → the index lists Full Time", async ({
  page,
}, testInfo) => {
  const phone = isPhone(testInfo);
  const errors = watchErrors(page);
  await forceLuck(page, 0.99);
  await freezeClock(page);
  await playMatchday(page, phone);

  // The third end: the venue's own page stays the main button, and SEE FULL TIME is the quiet third link.
  const seeFullTime = page.getByRole("link", { name: ui.games.fullTime });
  await expect(seeFullTime).toBeVisible();
  await expect(seeFullTime).toHaveAttribute("href", "/arena/full-time");
  await expect(page.getByRole("link", { name: badminton.see })).toBeVisible();
  expect((await stored(page)).venuesPlayed).toEqual(["cricket", "tennis", "badminton"]);

  await page.clock.resume();
  await seeFullTime.click();
  await expectFullTimeDone(page);
  await expect(page.getByText(fullTime.note).filter({ visible: true })).toBeVisible();

  // The wipe from the game page swallows a press that lands while it still covers the screen: press again until it takes.
  await expect(async () => {
    await page
      .getByRole("link", { name: fullTime.teamUp.cta, exact: true })
      .click({ timeout: 1000 });
    await expect(page).toHaveURL(/\/team-up$/, { timeout: 1000 });
  }).toPass({ timeout: 10_000 });
  await expect(page.getByLabel(ui.pages.teamUp.fields.message, { exact: true })).toHaveValue(
    ui.pages.teamUp.prefill,
  );

  await backToHub(page, phone);
  const index = await openIndex(page, phone);
  const entry = index.getByRole("link", { name: new RegExp(ui.hub.index.links.fullTime.label) });
  await expect(entry).toHaveAttribute("href", "/arena/full-time");
  await expect(entry).toContainText(ui.hub.index.seen);
  expect(errors).toEqual([]);
});

test("the full matchday with storage blocked: SEE FULL TIME still ends the third game and Full Time shows done in that visit", async ({
  page,
}, testInfo) => {
  const phone = isPhone(testInfo);
  const errors = watchErrors(page);
  await page.addInitScript(() => {
    Storage.prototype.setItem = () => {
      throw new DOMException("blocked", "SecurityError");
    };
  });
  await forceLuck(page, 0.99);
  await freezeClock(page);
  await playMatchday(page, phone);

  // Nothing is written, so the matchday lives in memory: the third end knows all three venues are played.
  const seeFullTime = page.getByRole("link", { name: ui.games.fullTime });
  await expect(seeFullTime).toBeVisible();
  await page.clock.resume();
  await seeFullTime.click();
  await expectFullTimeDone(page);
  expect(errors).toEqual([]);
});

test("Landing → Intro → Hub → Cricket → three balls → the scorecard → Career → the Hub remembers", async ({
  page,
}, testInfo) => {
  const phone = isPhone(testInfo);
  const errors = watchErrors(page);
  await forceLuck(page, 0.99);
  await freezeClock(page);

  await page.goto("/");
  await waitForHydration(page);
  await page.getByRole("link", { name: ui.landing.enter }).click();
  await expect(page).toHaveURL(/\/intro$/);
  // The Intro's call to action appears when the show reaches it.
  await page.getByRole("link", { name: ui.intro.enter }).click();
  await expect(page).toHaveURL(/\/arena$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.arena.heading);

  await pressPlay(page, ui.venues.cricket);
  await arriveAndFreeze(page, /\/arena\/cricket$/);

  for (let ball = 0; ball < 3; ball++) await bowlAnyBall(page, "click");
  await advanceTo(page, ["end"]);
  // Three misses: SIX, SIX, SIX (the last is a FOUR or SIX, F1): 18* NOT OUT.
  expect((await stored(page)).lastScores.cricket).toBe("18* NOT OUT");
  const see = page.getByRole("link", { name: cricket.see });
  await expect(see).toHaveAttribute("href", "/career");

  await page.clock.resume();
  await see.click();
  await expect(page).toHaveURL(/\/career$/);
  await expect(page.getByRole("heading", { level: 1 })).toBeVisible();

  await backToHub(page, phone);
  const cricketCard = venueCard(page, ui.venues.cricket);
  await expect(cricketCard).toContainText(phone ? "18* NOT OUT" : "PLAYED · 18* NOT OUT");
  await expect(cricketCard.getByRole("link", { name: ui.hud.rematch })).toBeVisible();
  // The count and the record: the stage keeps the record chip in its top row and the count in the rail; the phone keeps both in the drawer.
  const index = await openIndex(page, phone);
  await expect(index.getByText("1 OF 3 VENUES")).toBeVisible();
  const record = `${ui.hub.record.yash} 1 · ${ui.hub.record.you} 0`;
  await expect(
    phone ? index.getByText(record) : page.locator("[data-stage]").getByText(record),
  ).toBeVisible();
  expect(errors).toEqual([]);
});

test.describe("SKIP on every game goes to its page", () => {
  const games = [
    ["cricket", ui.games.cricket.skip, /\/career$/],
    ["tennis", ui.games.tennis.skip, /\/highlights$/],
    ["badminton", ui.games.badminton.skip, /\/attributes$/],
  ] as const;
  for (const [name, label, path] of games) {
    test(name, async ({ page }) => {
      await page.goto(`/arena/${name}`);
      await waitForHydration(page);
      await page.getByRole("link", { name: label }).click();
      await expect(page).toHaveURL(path);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      // Skipping is not playing: nothing is saved for the venue.
      expect((await stored(page)).lastScores?.[name]).toBeUndefined();
    });
  }
});

test("perfect play still loses: SEE THE FULL SCORECARD, no claim, and the Hub lists no Locker Room", async ({
  page,
}, testInfo) => {
  const phone = isPhone(testInfo);
  const errors = watchErrors(page);
  await forceLuck(page, 0);
  await openFrozen(page, "/arena/cricket");
  await perfectOver(page);
  await expect(page.getByText(/CLAIM/)).toHaveCount(0);
  const see = page.getByRole("link", { name: cricket.see });
  await expect(see).toBeFocused();
  const state = await stored(page);
  expect(state.lastScores.cricket).toBe("4* NOT OUT");
  expect(state.yashWins).toBe(1);

  await page.clock.resume();
  await see.click();
  await expect(page).toHaveURL(/\/career$/);

  await backToHub(page, phone);
  const index = await openIndex(page, phone);
  await expect(index.getByRole("link", { name: /Locker Room/ })).toHaveCount(0);
  expect(errors).toEqual([]);
});

test("keyboard only: Hub 1 → Cricket → Space ×3 → Tab to the end button → Enter → Career", async ({
  page,
}, testInfo) => {
  test.skip(isPhone(testInfo), "the Hub's 1 / 2 / 3 keys are a desktop shortcut (H10)");
  await forceLuck(page, 0.99);
  await freezeClock(page);
  await page.goto("/arena");
  await waitForHydration(page);
  await page.keyboard.press("1");
  await arriveAndFreeze(page, /\/arena\/cricket$/);

  for (let ball = 0; ball < 3; ball++) await bowlAnyBall(page, "key");
  await advanceTo(page, ["end"]);

  // The end puts focus on its first control; Tab until the scorecard link has it, never more than a few stops.
  const see = page.getByRole("link", { name: cricket.see });
  for (let stops = 0; stops < 8; stops++) {
    if (await see.evaluate((el) => el === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(see).toBeFocused();
  await page.clock.resume();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/career$/);
});

test("reduced motion: Hub PLAY → the cricket auto-rally → the end", async ({ page }, testInfo) => {
  const phone = isPhone(testInfo);
  await page.emulateMedia({ reducedMotion: "reduce" });
  await forceLuck(page, 0.99);
  await freezeClock(page);
  await page.goto("/arena");
  await waitForHydration(page);
  await pressPlay(page, ui.venues.cricket);
  await expect(page).toHaveURL(/\/arena\/cricket$/);
  await expect(game(page)).toBeVisible();
  await pauseClock(page);

  // No live game: no BOWL button, no meter. The over plays itself in about 3 s.
  await expect(bowlButton(page)).toHaveCount(0);
  await page.clock.runFor(3000);
  await advanceTo(page, ["end"]);
  await expect(page.getByRole("link", { name: cricket.see })).toBeVisible();
  await expect(page.getByRole("button", { name: cricket.again })).toBeVisible();
  expect((await stored(page)).lastScores.cricket).toBe("14* NOT OUT");

  await page.clock.resume();
  await page.getByRole("link", { name: cricket.see }).click();
  await expect(page).toHaveURL(/\/career$/);
  await backToHub(page, phone);
  await expect(venueCard(page, ui.venues.cricket)).toContainText("14* NOT OUT");
});
