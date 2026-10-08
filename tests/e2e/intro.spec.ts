import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test as base, type Locator, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { INTRO_BEATS } from "../../src/features/intro/beats";
import { expectNoA11yViolations } from "../support/a11y";
import { INTRO_D5_MASKS } from "../support/introLights";
import { expectMatchesArtboard, type Rect } from "../support/visual";
import {
  actionsGapAt,
  expectBanksClearOfHud,
  expectLightsBelowTopRow,
} from "./support/columnLayout";
import { expectNoHorizontalOverflow, waitForHydration } from "./support/contentPage";

/*
 * Console errors and uncaught exceptions fail every test in this file, except the ones a test names with
 * `tolerate` (a request it breaks on purpose logs "Failed to load resource" by itself).
 */
const test = base.extend<{ tolerate: (pattern: RegExp) => void }>({
  tolerate: [
    async ({ page }, use) => {
      const errors: string[] = [];
      const allowed: RegExp[] = [];
      page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
      page.on("pageerror", (e) => errors.push(String(e)));
      await use((pattern) => allowed.push(pattern));
      expect(
        errors.filter((e) => !allowed.some((p) => p.test(e))),
        "console errors and uncaught exceptions",
      ).toEqual([]);
    },
    { auto: true },
  ],
});

const root = (page: Page) => page.locator("main#main");
const done = (page: Page, timeout = 15_000) =>
  expect(root(page)).toHaveAttribute("data-hold", "done", { timeout });
const playing = (page: Page) => expect(root(page)).toHaveAttribute("data-hold", "playing");
const name = (page: Page) => page.getByRole("heading", { level: 1, name: ui.routes.home.heading });
const enter = (page: Page) => page.getByRole("link", { name: ui.intro.enter });
const skip = (page: Page) => page.getByRole("link", { name: ui.hud.skipIntro });
const replay = (page: Page) => page.getByRole("button", { name: ui.hud.replay });

const D = INTRO_BEATS.desktop;
const M = INTRO_BEATS.mobile;

/*
 * The show runs on a virtual clock, never on sleeps. `pauseClock` is called before the page loads: from then
 * on, time in the page (timers, requestAnimationFrame, Date, performance.now) moves only when the test says so.
 * GSAP's ticker runs on requestAnimationFrame and the clock's `Date`, so it follows it: `showClock` steps the
 * timeline to a moment in seconds from the first frame of the show (give or take one 16 ms frame, so test at
 * least 50 ms either side of a beat). What the clock does not move: network and image decoding (real time:
 * wait for them with `rigIs`), and CSS animations (the 8 s fallback of `hold-part` is real time).
 */
const START = new Date("2026-01-01T00:00:00Z").getTime();
async function pauseClock(page: Page) {
  await page.clock.install({ time: START });
  await page.clock.pauseAt(START + 1000);
}
function showClock(page: Page) {
  let at = 0;
  return {
    /** Run the page's clock up to `seconds` into the show. */
    async to(seconds: number) {
      if (seconds < at) throw new Error(`the show is already at ${at} s, not before ${seconds} s`);
      await page.clock.runFor(Math.round((seconds - at) * 1000));
      at = seconds;
    },
    /** Run the clock past the end of the longest show (the stage's is 6.5 s). */
    async finish() {
      await this.to(at + 9);
    },
  };
}
/** Load the page on a paused clock and start the show's clock when it is playing. */
async function startShow(page: Page, url = "/intro") {
  await pauseClock(page);
  await page.goto(url);
  await playing(page);
  return showClock(page);
}
/** Click a link and run the page's clock until the route has changed (the wipe between routes is on it too). */
async function follow(page: Page, link: Locator, path: string) {
  await link.click();
  await expect
    .poll(async () => {
      await page.clock.runFor(100);
      return new URL(page.url()).pathname;
    })
    .toBe(path);
}
/** The clock ticks again from here on: for tools that wait on timers of their own (axe). */
const resumeClock = (page: Page) => page.clock.resume();
/** How loading the head-turn frames went (real time: the clock does not move the network). */
const rigIs = (page: Page, result: "ready" | "timeout" | "error") =>
  expect(root(page)).toHaveAttribute("data-sprites", result, { timeout: 15_000 });
/** Hold the head-turn frames until `release()`. */
async function holdStrips(page: Page) {
  let release: () => void = () => {};
  const gate = new Promise<void>((resolve) => (release = resolve));
  await page.route("**/turn_*.webp", async (route) => {
    await gate;
    await route.continue().catch(() => {});
  });
  return release;
}
/** The page draws the stage and the phone column with the same part names: say which one (the stage by default). */
type Layout = "stage" | "column";
const part = (page: Page, p: string, layout: Layout = "stage") =>
  page.locator(`[data-intro-layout="${layout}"] [data-part="${p}"]`);
const style = (page: Page, p: string, layout: Layout = "stage") =>
  part(page, p, layout)
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { visibility: s.visibility, opacity: Number(s.opacity) };
    });

/** Every letter of the name is drawn (the gap between the words has no height of its own, so it is judged by style). */
async function expectLettersShown(page: Page, layout: Layout = "stage") {
  const letters = await part(page, "letter", layout).evaluateAll((els) =>
    els.map((el) => getComputedStyle(el).visibility),
  );
  expect(letters).toHaveLength(10);
  expect(letters.every((v) => v === "visible")).toBe(true);
}

/** The commentary line's text: its rendered size (design size x stage scale), and whether it sits on one line. */
async function commText(page: Page) {
  const line = page.locator("[data-commentary-bar] > span").last();
  await expect(line).toBeVisible();
  return line.evaluate((el) => {
    const scale = Number(
      getComputedStyle(document.documentElement).getPropertyValue("--stage-scale"),
    );
    const design = parseFloat(getComputedStyle(el).fontSize);
    const range = document.createRange();
    range.selectNodeContents(el);
    return { design, rendered: design * scale, lines: range.getClientRects().length };
  });
}

/** The head-turn frames the browser has been asked for. */
function trackStrips(page: Page) {
  const urls = new Set<string>();
  page.on("request", (r) => /turn_[012][^/]*\.webp/.test(r.url()) && urls.add(r.url()));
  return urls;
}

/** The accessible names of the next `count` stops of Tab, from the top of the page. */
async function tabStops(page: Page, count: number): Promise<string[]> {
  await page.evaluate(() => (document.activeElement as HTMLElement | null)?.blur());
  const stops: string[] = [];
  for (let i = 0; i < count; i++) {
    await page.keyboard.press("Tab");
    stops.push(
      await page.evaluate(() => {
        const el = document.activeElement;
        if (!el || el === document.body) return "(page)";
        return el.getAttribute("aria-label") ?? (el as HTMLElement).innerText.trim();
      }),
    );
  }
  return stops;
}

/** The gsap chunk(s) of the build, found by content as smoke.spec does. */
function gsapChunks(): string[] {
  const assets = join(process.cwd(), "build/client/assets");
  return readdirSync(assets).filter(
    (f) => f.endsWith(".js") && readFileSync(join(assets, f), "utf8").includes("autoSleep:120"),
  );
}

/** The commentary line: the artboard draws it as a still, the page's comes and goes (box: 36,821 to 373,864). */
const COMM_MASK: Rect = { x: 30, y: 815, width: 400, height: 60 };

test.describe("stage: the banks hang under the HUD, over the board (D-5)", () => {
  test.skip(({ hasTouch }) => !hasTouch, "driven from the phone project");
  for (const [width, height] of [
    [1440, 900],
    [1280, 720],
    [1200, 800],
  ] as const) {
    test(`${width}x${height}: every bank is at least 8px under the logo, REPLAY and SKIP INTRO and ends above the board; the board stays clear of WELCOME and the CTA`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      // Played to its end, so REPLAY is there (reduced motion has none).
      const show = await startShow(page);
      await show.finish();
      await done(page);
      const stage = page.locator('[data-intro-layout="stage"]');
      const board = stage.locator("[data-part='board']");
      await expectBanksClearOfHud(page, stage, 4, { below: "all", board });
      const b = (await board.boundingBox())!;
      for (const below of [part(page, "welcome"), part(page, "cta")]) {
        const box = (await below.boundingBox())!;
        expect(box.y, "below the board").toBeGreaterThanOrEqual(b.y + b.height);
      }
    });
  }
});

test.describe("desktop", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1200, "the 1440x900 stage");

  test("the end state matches the Intro artboard", async ({ page }) => {
    const show = await startShow(page);
    await show.finish();
    await done(page);
    // animations: "disabled" in the compare ends every finite animation and drops the loops (breathing, glow, sweep).
    const ratio = await expectMatchesArtboard(page, "Intro", {
      maxDiffRatio: 0.02,
      maskRects: [COMM_MASK, ...INTRO_D5_MASKS],
    });
    expect(ratio).toBeLessThanOrEqual(0.02);
  });

  test("nothing shows lit before the show starts: the scenery, the board's parts and the CTA are held back", async ({
    page,
  }) => {
    // Hold the GSAP chunk back so the page stays in its pending state as long as the test wants.
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    for (const chunk of gsapChunks())
      await page.route(`**/assets/${chunk}`, async (route) => {
        await gate;
        await route.continue();
      });
    await pauseClock(page);
    await page.goto("/intro");
    await expect(root(page)).toHaveAttribute("data-hold", "pending");
    for (const p of [
      "sky",
      "letterbox-sky",
      "crowd",
      "field",
      "cone-left",
      "cone-right",
      "bank-1",
      "bank-4",
      "backlight",
      "board-header",
      "mover",
      "letter",
      "title",
      "tagline",
      "board-strip",
      "welcome",
      "cta",
    ])
      expect((await style(page, p)).visibility, p).toBe("hidden");
    // the page's own controls are there from the first frame; REPLAY has nothing to replay yet
    await expect(skip(page)).toBeVisible();
    await expect(replay(page)).toBeVisible();
    await expect(replay(page)).toHaveAttribute("aria-disabled", "true");
    await expect(name(page)).toBeAttached();
    release();
    await playing(page);
    await expect(replay(page)).not.toHaveAttribute("aria-disabled", "true");
    await showClock(page).finish();
    await done(page);
  });

  test("the CTA is hidden, and out of the Tab order, until its beat; focusable once done", async ({
    page,
  }) => {
    const show = await startShow(page);
    await show.to(D.cta - 0.1);
    expect((await style(page, "cta")).visibility).toBe("hidden");
    const stops = await tabStops(page, 4);
    expect(stops.join(" | ")).toContain(ui.hud.skipIntro);
    expect(stops.join(" | ")).not.toContain(ui.intro.enter);
    await show.to(D.cta + 0.1);
    expect((await style(page, "cta")).visibility).toBe("visible");
    await show.finish();
    await done(page);
    await enter(page).focus();
    await expect(enter(page)).toBeFocused();
    await expect(enter(page)).toHaveAttribute("href", "/arena");
  });

  test("SKIP INTRO works half a second in: the hub, no errors", async ({ page }) => {
    const show = await startShow(page);
    await show.to(0.5);
    await follow(page, skip(page), "/arena");
    await page.clock.runFor(500);
  });

  test("REPLAY five times quickly: one more show, one end, the letters all there", async ({
    page,
  }) => {
    const show = await startShow(page);
    await waitForHydration(page);
    await show.finish();
    await done(page);
    // Count how often the root becomes done from now on.
    await page.evaluate(() => {
      const w = window as unknown as { __ends: number };
      w.__ends = 0;
      new MutationObserver(() => {
        if (document.querySelector("main#main")!.getAttribute("data-hold") === "done") w.__ends++;
      }).observe(document.querySelector("main#main")!, {
        attributes: true,
        attributeFilter: ["data-hold"],
      });
    });
    for (let i = 0; i < 5; i++) await replay(page).click({ delay: 0 });
    await playing(page);
    await showClock(page).finish();
    await done(page);
    await page.clock.runFor(800);
    expect(await page.evaluate(() => (window as unknown as { __ends: number }).__ends)).toBe(1);
    const letters = await part(page, "letter").evaluateAll((els) =>
      els.map((el) => ({
        visible: getComputedStyle(el).visibility !== "hidden",
        opacity: getComputedStyle(el).opacity,
        lit: el.getAttribute("data-lit"),
      })),
    );
    expect(letters).toHaveLength(10);
    expect(letters.every((l) => l.visible && l.opacity === "1" && l.lit === "done")).toBe(true);
    await expect(enter(page)).toBeVisible();
  });

  test("at the end nothing is filtered and the idle loops move only transform and opacity (L14)", async ({
    page,
  }) => {
    const show = await startShow(page);
    await show.finish();
    await done(page);
    const report = await page.evaluate(() => {
      const q = (p: string) =>
        document.querySelector<HTMLElement>(`[data-intro-layout="stage"] [data-part="${p}"]`)!;
      const fig = q("fig");
      // The figure and everything above it, up to the document.
      const chain: HTMLElement[] = [];
      for (let el: HTMLElement | null = fig; el; el = el.parentElement) chain.push(el);
      const filters = chain.map((el) => getComputedStyle(el).filter).filter((f) => f !== "none");
      const props = new Set<string>();
      const names = new Set<string>();
      for (const a of fig.getAnimations({ subtree: true })) {
        names.add((a as CSSAnimation).animationName);
        for (const kf of (a.effect as KeyframeEffect).getKeyframes())
          for (const key of Object.keys(kf))
            if (!["offset", "easing", "composite", "computedOffset"].includes(key)) props.add(key);
      }
      return {
        filters,
        shade: getComputedStyle(q("shade")).visibility,
        props: [...props].sort(),
        names: [...names].sort(),
      };
    });
    expect(report.filters, "figure and ancestors with a filter").toEqual([]);
    expect(report.shade).toBe("hidden");
    // The loops are really running (so the check above is not vacuous), and they animate transform and opacity only.
    expect(report.names).toEqual(
      expect.arrayContaining(["breathe", "face-sweep", "face-sweep-band"]),
    );
    expect(report.props).toEqual(["opacity", "transform"]);
  });

  test.describe("the head-turn frames", () => {
    test("late (held past the end of the show): the silhouette stands from the entrance, the show runs on, and it ends on the rest pose", async ({
      page,
      tolerate,
    }) => {
      tolerate(/ERR_ABORTED|Failed to load/);
      const release = await holdStrips(page);
      const show = await startShow(page);

      // The silhouette is on show with the mover while the frames load: the rest pose, with its image in.
      await show.to(D.entrance + 0.5);
      const rest = part(page, "rest");
      await expect(rest).toBeVisible();
      expect(await rest.evaluate((img: HTMLImageElement) => img.naturalWidth)).toBeGreaterThan(0);
      expect(await rest.evaluate((img) => !!img.closest('[data-part="mover"]'))).toBe(true);
      expect((await style(page, "mover")).visibility).toBe("visible");
      expect((await style(page, "shade")).visibility).toBe("visible");

      // The show does not stop at the performance beat: the scan bar, the trails and the ghosts finish.
      await show.to(D.performance + 0.6);
      for (const p of ["scan", "trails", "ghost"])
        expect((await style(page, p)).visibility, p).toBe("hidden");
      await expect(rest).toBeVisible();

      await show.finish();
      await done(page);
      await rigIs(page, "timeout");
      await expect(rest).toBeVisible();
      for (const strip of await part(page, "turn").all()) await expect(strip).toBeHidden();
      await expect(enter(page)).toBeVisible();
      release();
    });

    test("failing: the rest pose, the strips hidden, the show ends", async ({ page, tolerate }) => {
      tolerate(/ERR_FAILED|Failed to load/);
      await page.route("**/turn_*.webp", (route) => route.abort());
      const show = await startShow(page);
      await rigIs(page, "error");
      await show.finish();
      await done(page);
      await expect(part(page, "rest")).toBeVisible();
      for (const strip of await part(page, "turn").all()) await expect(strip).toBeHidden();
    });

    test("on time: the head turn plays and the rest pose steps aside", async ({ page }) => {
      const strips = trackStrips(page);
      const show = await startShow(page);
      await rigIs(page, "ready");
      // still the silhouette until the beat
      await show.to(D.performance - 0.1);
      await expect(part(page, "rest")).toBeVisible();
      await show.to(D.performance + 0.3);
      await expect(part(page, "rest")).toBeHidden();
      await expect(part(page, "turn").nth(0)).toBeVisible();
      await show.finish();
      await done(page);
      expect(strips.size).toBe(3);
      await expect(part(page, "rest")).toBeHidden();
      // the last strip is left on its final frame
      await expect(part(page, "turn").nth(2)).toBeVisible();
    });

    test("late but inside the wait: the head turn starts when they arrive, from its first frame", async ({
      page,
    }) => {
      const release = await holdStrips(page);
      const show = await startShow(page);
      await show.to(D.performance + 0.3);
      await expect(part(page, "rest")).toBeVisible();
      // still waiting: the rest pose stands, the show has gone on
      expect((await style(page, "scan")).visibility).toBe("hidden");
      release();
      await rigIs(page, "ready");
      await show.to(D.performance + 0.3 + 0.3);
      await expect(part(page, "rest")).toBeHidden();
      await expect(part(page, "turn").nth(0)).toBeVisible();
      await show.finish();
      await done(page);
      await expect(part(page, "turn").nth(2)).toBeVisible();
      await expect(part(page, "rest")).toBeHidden();
    });
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("the end state at once, no frames requested, REPLAY gone", async ({ page }) => {
      const strips = trackStrips(page);
      await pauseClock(page);
      await page.goto("/intro", { waitUntil: "commit" });
      await part(page, "cta").waitFor({ state: "attached" });
      // Everything is already in place (CSS), before any script has run.
      for (const p of ["welcome", "cta", "board-strip"])
        expect((await style(page, p)).visibility, p).toBe("visible");
      await done(page, 5000);
      await expect(name(page)).toBeVisible();
      await expect(enter(page)).toBeVisible();
      await expect(replay(page)).toBeHidden();
      await expect(skip(page)).toBeVisible();
      await expect(part(page, "rest")).toBeVisible();
      await page.clock.runFor(2500);
      expect([...strips]).toEqual([]);
    });
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    test("the name, ENTER THE ARENA and SKIP INTRO are there; the held-back parts are not held back", async ({
      page,
    }) => {
      const strips = trackStrips(page);
      await page.goto("/intro");
      await expect(name(page)).toBeVisible();
      await expect(enter(page)).toBeVisible();
      await expect(enter(page)).toHaveAttribute("href", "/arena");
      await expect(skip(page)).toBeVisible();
      await expect(skip(page)).toHaveAttribute("href", "/arena");
      await expect(root(page)).toHaveAttribute("data-hold", "pending");
      await expect(page.locator("html.js")).toHaveCount(0);
      for (const p of ["crowd", "board-header", "mover", "title", "board-strip", "welcome"])
        expect((await style(page, p)).visibility, p).toBe("visible");
      await expectLettersShown(page);
      await expect(part(page, "rest")).toBeVisible();
      await page.waitForLoadState("load");
      expect([...strips]).toEqual([]);
    });
  });

  test("when the GSAP chunk cannot load, the parts appear by 8.5 s through the CSS fallback", async ({
    page,
    tolerate,
  }) => {
    tolerate(/404|Failed to load|dynamically imported|gsap/i);
    for (const chunk of gsapChunks())
      await page.route(`**/assets/${chunk}`, (route) => route.fulfill({ status: 404 }));
    await page.goto("/intro");
    expect((await style(page, "cta")).visibility).toBe("hidden");
    await expect(root(page)).toHaveAttribute("data-hold", "pending");
    // The fallback is a CSS animation (8 s on the page's own animation clock, which the virtual clock does not move).
    await expect(enter(page)).toBeVisible({ timeout: 10_000 });
    for (const p of ["crowd", "board-header", "mover", "title", "welcome"])
      expect((await style(page, p)).visibility, p).toBe("visible");
    await expectLettersShown(page);
    await expect(part(page, "rest")).toBeVisible();
  });

  test("GSAP arriving after the 8 s fallback shows the end state: nothing is hidden again, nothing replays, REPLAY stays disabled", async ({
    page,
  }) => {
    test.slow();
    let release: () => void = () => {};
    const gate = new Promise<void>((resolve) => (release = resolve));
    for (const chunk of gsapChunks())
      await page.route(`**/assets/${chunk}`, async (route) => {
        await gate;
        await route.continue();
      });
    await page.goto("/intro");
    await expect(root(page)).toHaveAttribute("data-hold", "pending");
    // The fallback (real time) has let go of the hold.
    await expect(enter(page)).toBeVisible({ timeout: 12_000 });
    // From here on, a part that is hidden at any frame is a flash of the show restarting.
    await page.evaluate(() => {
      const w = window as unknown as { __hidden: string[] };
      w.__hidden = [];
      const watch = () => {
        for (const el of document.querySelectorAll<HTMLElement>(
          '[data-intro-layout="stage"] [data-part="cta"], [data-intro-layout="stage"] [data-part="mover"], [data-intro-layout="stage"] [data-part="letter"]',
        ))
          if (getComputedStyle(el).visibility === "hidden") w.__hidden.push(el.dataset.part!);
        requestAnimationFrame(watch);
      };
      watch();
    });
    release();
    await done(page, 10_000);
    await expect(root(page)).not.toHaveAttribute("data-sprites");
    await expect(replay(page)).toHaveAttribute("aria-disabled", "true");
    await expect(enter(page)).toBeVisible();
    await expect(part(page, "rest")).toBeVisible();
    await expectLettersShown(page);
    expect(
      await page.evaluate(() => (window as unknown as { __hidden: string[] }).__hidden),
    ).toEqual([]);
  });

  test("the commentary line is exactly its recipe's 16px at 1440x900, and at least 14px rendered at 1280x720", async ({
    page,
  }) => {
    const show = await startShow(page);
    await show.finish();
    await done(page);
    expect((await commText(page)).design).toBe(16);
    await page.setViewportSize({ width: 1280, height: 720 });
    const small = await commText(page);
    expect(small.rendered).toBeGreaterThanOrEqual(13.99);
    expect(small.lines).toBe(1);
  });

  test("arriving from the Landing by ENTER THE ARENA puts focus on the name", async ({ page }) => {
    await page.addInitScript(() => localStorage.setItem("arena:landing-seen", "1"));
    await page.goto("/");
    await waitForHydration(page);
    const toIntro = page.getByRole("link", { name: ui.landing.enter });
    await expect(toIntro).toBeVisible({ timeout: 8000 });
    await page.evaluate(async () => {
      const group = document.querySelector("a[href='/intro']")!.parentElement!.parentElement!;
      await Promise.all(group.getAnimations().map((a) => a.finished));
    });
    await toIntro.click();
    await expect(page).toHaveURL("/intro");
    await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
    await expect(page.getByRole("heading", { level: 1 })).toHaveAccessibleName(
      new RegExp(`^${ui.routes.home.heading}$`, "i"),
    );
    await done(page);
  });

  test("has no accessibility violations once the show is done", async ({ page }) => {
    const show = await startShow(page);
    await show.finish();
    await done(page);
    await resumeClock(page);
    await expectNoA11yViolations(page);
  });

  test("exactly one h1 is rendered at every width: the stage's from 1200px, the column's below", async ({
    page,
  }) => {
    for (const [width, height] of [
      [1440, 900],
      [1200, 800],
      [1199, 800],
      [768, 1024],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.goto("/intro");
      await expect(page.getByRole("heading", { level: 1 }), `${width}px`).toHaveCount(1);
      await expect(name(page), `${width}px`).toBeAttached();
    }
  });
});

test.describe("tablet (L1): the phone's column intro, centred", () => {
  test.skip(({ hasTouch }) => !hasTouch, "driven from the phone project");

  for (const [width, height] of [
    [1024, 768],
    [768, 1024],
    [1199, 800],
  ] as const) {
    test(`${width}x${height}: the column plays to done in about 3 s, no head-turn frames, the stage stays hidden, nothing clipped sideways`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      const strips = trackStrips(page);
      const show = await startShow(page);
      await show.to(3.2);
      await done(page, 1000);
      await expect(page.locator("[data-stage]")).toBeHidden();
      await expect(page.locator('[data-intro-layout="column"]')).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(name(page)).toBeVisible();
      await expect(enter(page)).toBeVisible();
      await expectLettersShown(page, "column");
      expect([...strips], "head-turn frames requested on a tablet").toEqual([]);
      await expectNoHorizontalOverflow(page, [width], height);
      // The tablet treatment: the column is centred and at most 640px wide.
      const board = (await part(page, "board-header", "column").locator("..").boundingBox())!;
      expect(board.width).toBeLessThanOrEqual(640);
      expect(Math.abs(board.x + board.width / 2 - width / 2)).toBeLessThan(2);
      await expectLightsBelowTopRow(page, page.locator('[data-intro-layout="column"]'));
      const small = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[class*="type-mono"]')]
          .filter((el) => el.getClientRects().length > 0)
          .map((el) => parseFloat(getComputedStyle(el).fontSize))
          .filter((px) => px < 10.99),
      );
      expect(small, "mono text under 11px").toEqual([]);
    });
  }
});

/** Every request for the rest portrait (the phone and the stage draw the same file). */
function trackPortrait(page: Page) {
  const urls: string[] = [];
  page.on("request", (r) => /portrait-rest[^/]*\.webp/.test(r.url()) && urls.push(r.url()));
  return urls;
}

test.describe("phone (L6): the column's three-second cut (D-6)", () => {
  test.skip(({ hasTouch }) => !hasTouch, "driven from the phone project");

  for (const [width, height] of [
    [390, 844],
    [375, 667],
    [360, 640],
  ] as const) {
    test(`${width}x${height}: done in 3.2 s, no head-turn frames, targets and CTA sized, nothing clipped, mono at 11px or more`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      const strips = trackStrips(page);
      const portrait = trackPortrait(page);
      const show = await startShow(page);
      // The cut is done within 3.2 s of its first frame (D-6: about 3 s; nothing is left to wait for).
      await show.to(3.2);
      await done(page, 1000);
      await show.to(3.6);

      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(name(page)).toBeVisible();
      await expect(page.locator("[data-stage]")).toBeHidden();
      expect([...strips], "head-turn frames requested on a phone").toEqual([]);
      expect(portrait.length, "the rest portrait is one request").toBeLessThanOrEqual(1);

      // Touch targets, and the call to action across the board's width.
      for (const control of [replay(page), skip(page)]) {
        const box = (await control.boundingBox())!;
        expect(box.height).toBeGreaterThanOrEqual(44);
        expect(box.width).toBeGreaterThanOrEqual(44);
      }
      const board = (await part(page, "board-header", "column").locator("..").boundingBox())!;
      const cta = (await enter(page).boundingBox())!;
      expect(Math.abs(cta.width - board.width)).toBeLessThanOrEqual(1);
      expect(cta.height).toBeGreaterThanOrEqual(44);
      await enter(page).focus();
      await expect(enter(page)).toBeFocused();
      await expect(enter(page)).toHaveAttribute("href", "/arena");

      // Short phones scroll: nothing sideways, and the call to action sits fully inside the document.
      await expectNoHorizontalOverflow(page, [width], height);
      await enter(page).scrollIntoViewIfNeeded();
      const inside = await enter(page).evaluate((el) => {
        const r = el.getBoundingClientRect();
        const doc = document.documentElement;
        return {
          left: r.left >= 0,
          right: r.right <= doc.scrollWidth,
          bottom: r.bottom + window.scrollY <= doc.scrollHeight,
        };
      });
      expect(inside).toEqual({ left: true, right: true, bottom: true });

      const small = await page.evaluate(() =>
        [...document.querySelectorAll<HTMLElement>('[class*="type-mono"]')]
          .filter((el) => el.getClientRects().length > 0)
          .map((el) => ({ text: el.textContent, size: parseFloat(getComputedStyle(el).fontSize) }))
          .filter((m) => m.size < 10.99),
      );
      expect(small, "mono text under 11px").toEqual([]);
    });
  }

  test.describe("the column fits a common phone at its end state", () => {
    for (const [width, height] of [
      [390, 844],
      [375, 812],
    ] as const) {
      test(`${width}x${height}: no scrolling, ENTER THE ARENA at least 16px above the bottom`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        const show = await startShow(page);
        await show.finish();
        await done(page);
        const fit = await page.evaluate(() => ({
          scroll: document.documentElement.scrollHeight - window.innerHeight,
          ctaBottom: document
            .querySelector('[data-intro-layout="column"] [data-part="cta"]')!
            .getBoundingClientRect().bottom,
        }));
        expect(fit.scroll, "document is taller than the window by").toBeLessThanOrEqual(0);
        expect(height - fit.ctaBottom, "space under the button").toBeGreaterThanOrEqual(16);
      });
    }
  });

  test.describe("the column's lights and spacing (D-2, D-3)", () => {
    for (const [width, height] of [
      [390, 844],
      [375, 667],
      [360, 640],
    ] as const) {
      test(`${width}x${height}: the lights sit under the top row, and the welcome line a fixed gap under the board`, async ({
        page,
      }) => {
        await page.setViewportSize({ width, height });
        const show = await startShow(page);
        await show.finish();
        await done(page);
        const column = page.locator('[data-intro-layout="column"]');
        await expectLightsBelowTopRow(page, column);
        const board = (await column.locator("[data-part='board']").boundingBox())!;
        const welcome = (await part(page, "welcome", "column").boundingBox())!;
        const gap = welcome.y - (board.y + board.height);
        expect(Math.abs(gap - actionsGapAt(width)), `gap ${gap}`).toBeLessThanOrEqual(2);
      });
    }
  });

  test("the CTA is hidden, and out of the Tab order, until its beat; the name's letters lock in", async ({
    page,
  }) => {
    const show = await startShow(page);
    await show.to(M.cta - 0.1);
    expect((await style(page, "cta", "column")).visibility).toBe("hidden");
    const stops = await tabStops(page, 3);
    expect(stops.join(" | ")).toContain(ui.hud.skipIntro);
    expect(stops.join(" | ")).not.toContain(ui.intro.enter);
    await show.to(M.cta + 0.1);
    expect((await style(page, "cta", "column")).visibility).toBe("visible");
    await show.finish();
    await done(page);
    await expectLettersShown(page, "column");
    await enter(page).focus();
    await expect(enter(page)).toBeFocused();
  });

  test("silent: no commentary line (not even in the hidden stage) and no dust", async ({
    page,
  }) => {
    const show = await startShow(page);
    await show.finish();
    await done(page);
    // The line mounts only when said, and phones say nothing (L11): not even in the hidden stage.
    await page.clock.runFor(500);
    await expect(page.locator("[data-commentary-bar]")).toHaveCount(0);
    await expect(page.locator("canvas:visible")).toHaveCount(0);
  });

  test("SKIP INTRO works half a second in; REPLAY plays the same cut again", async ({ page }) => {
    const first = await startShow(page);
    await first.to(0.5);
    await follow(page, skip(page), "/arena");

    await page.goto("/intro");
    await playing(page);
    await showClock(page).finish();
    await done(page);
    await replay(page).click();
    await playing(page);
    await showClock(page).finish();
    await done(page);
    await expectLettersShown(page, "column");
    await expect(enter(page)).toBeVisible();
  });

  test("resizing from the stage to the column mid-play (and back) reaches done with no errors", async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 });
    const stage = await startShow(page);
    await stage.to(0.7);
    await page.setViewportSize({ width: 390, height: 844 });
    await playing(page);
    await showClock(page).finish();
    await done(page);
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(name(page)).toBeVisible();
    await expect(enter(page)).toBeVisible();
    await expectLettersShown(page, "column");

    await replay(page).click();
    await playing(page);
    const again = showClock(page);
    await again.to(0.5);
    await page.setViewportSize({ width: 1280, height: 800 });
    await playing(page);
    await showClock(page).finish();
    await done(page);
    await expect(name(page)).toBeVisible();
    await expect(enter(page)).toBeVisible();
    await expectLettersShown(page);
  });

  test("has no accessibility violations once the show is done", async ({ page }) => {
    const show = await startShow(page);
    await show.finish();
    await done(page);
    await resumeClock(page);
    await expectNoA11yViolations(page);
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("the end state at once, no frames requested, REPLAY gone", async ({ page }) => {
      const strips = trackStrips(page);
      await page.goto("/intro", { waitUntil: "commit" });
      await done(page, 5000);
      await expect(name(page)).toBeVisible();
      await expect(enter(page)).toBeVisible();
      await expect(replay(page)).toBeHidden();
      await expect(skip(page)).toBeVisible();
      await expectLettersShown(page, "column");
      expect([...strips]).toEqual([]);
    });
  });

  test.describe("without JavaScript", () => {
    test.use({ javaScriptEnabled: false });
    test("the column's end state: the name, the portrait, ENTER THE ARENA and SKIP INTRO", async ({
      page,
    }) => {
      await page.goto("/intro");
      await expect(name(page)).toBeVisible();
      await expect(enter(page)).toBeVisible();
      await expect(enter(page)).toHaveAttribute("href", "/arena");
      await expect(skip(page)).toBeVisible();
      await expect(root(page)).toHaveAttribute("data-hold", "pending");
      for (const p of ["board-header", "portrait", "title", "board-strip", "welcome", "bank-1"])
        expect((await style(page, p, "column")).visibility, p).toBe("visible");
      await expectLettersShown(page, "column");
      await expect(part(page, "portrait", "column")).toBeVisible();
    });
  });
});
