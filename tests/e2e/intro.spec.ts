import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test as base, type Page } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { expectNoA11yViolations } from "../support/a11y";
import { expectMatchesArtboard, type Rect } from "../support/visual";
import { waitForHydration } from "./support/contentPage";

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
  expect(root(page)).toHaveAttribute("data-intro", "done", { timeout });
const playing = (page: Page) => expect(root(page)).toHaveAttribute("data-intro", "playing");
const name = (page: Page) => page.getByRole("heading", { level: 1, name: ui.routes.home.heading });
const enter = (page: Page) => page.getByRole("link", { name: ui.intro.enter });
const skip = (page: Page) => page.getByRole("link", { name: ui.hud.skipIntro });
const replay = (page: Page) => page.getByRole("button", { name: ui.hud.replay });
const part = (page: Page, p: string) => page.locator(`[data-part="${p}"]`);
const style = (page: Page, p: string) =>
  part(page, p)
    .first()
    .evaluate((el) => {
      const s = getComputedStyle(el);
      return { visibility: s.visibility, opacity: Number(s.opacity) };
    });

/** Every letter of the name is drawn (the gap between the words has no height of its own, so it is judged by style). */
async function expectLettersShown(page: Page) {
  const letters = await part(page, "letter").evaluateAll((els) =>
    els.map((el) => getComputedStyle(el).visibility),
  );
  expect(letters).toHaveLength(10);
  expect(letters.every((v) => v === "visible")).toBe(true);
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

/*
 * Where Intro.dc.html draws the two light cones and where the page does (D-1, spec 11.4: our beam tops start
 * under each lamp; the artboard's are drawn offset). Cone boxes (src/design-system/scene/cones.ts), design px:
 *   left  x 40..580,  y 60..860 (540x800)         right x 860..1400, y 60..860
 * Artboard top edges, as percent of the box: left 18%-30%, right 70%-82%.
 *   left  18% = 40 + .18 x 540 = 137.2   30% = 40 + .30 x 540 = 202
 *   right 70% = 860 + .70 x 540 = 1238   82% = 860 + .82 x 540 = 1302.8
 * Ours (CONE_APEX.intro): left 7.4074%-28.1481% = x 80..192, right 71.8519%-92.5926% = x 1248..1360.
 * Both beams run to the same bottom corners, so they only part near the top, where the artboard's is the
 * narrower and the board has not yet covered either. The board (x 100..1340, y 96..636) hides the rest.
 *   above the board (y 60..96): left  x 80..202 (+6 blur each side) -> x 74..208
 *                               right x 1238..1360               -> x 1232..1366
 *   beside the board: our left edge runs x = 80 + 176 (y-60)/800, so it is still left of the board's edge
 *     (x = 100) until y = 60 + 20 x 800/176 = 151: a sliver x 84..100, y 98..154. On the right ours is
 *     x = 1360 - 500 (y-60)/800, inside the board's ring (x 1349) from y = 78.
 * Everything is boxed a little wider than the arithmetic; the board, name, portrait and CTA are never masked.
 */
const CONE_MASKS: Rect[] = [
  { x: 74, y: 58, width: 134, height: 40 }, // left beam above the board
  { x: 84, y: 98, width: 16, height: 56 }, // left beam beside the board
  { x: 1232, y: 58, width: 134, height: 40 }, // right beam above the board
];
/** The commentary line: the artboard draws it as a still, the page's comes and goes (box: 36,821 to 373,864). */
const COMM_MASK: Rect = { x: 30, y: 815, width: 400, height: 60 };

test.describe("desktop", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) < 1200, "the 1440x900 stage");

  test("the end state matches the Intro artboard", async ({ page }) => {
    await page.goto("/intro");
    await waitForHydration(page);
    await done(page);
    // animations: "disabled" in the compare ends every finite animation and drops the loops (breathing, glow, sweep).
    const ratio = await expectMatchesArtboard(page, "Intro", {
      maxDiffRatio: 0.02,
      maskRects: [COMM_MASK, ...CONE_MASKS],
    });
    expect(ratio).toBeLessThanOrEqual(0.02);
  });

  test("nothing shows lit before the show starts: the scenery, the board's parts and the CTA are held back", async ({
    page,
  }) => {
    // Hold the GSAP chunk back so the page stays in its pending state long enough to look at it.
    for (const chunk of gsapChunks())
      await page.route(`**/assets/${chunk}`, async (route) => {
        await new Promise((r) => setTimeout(r, 3000));
        await route.continue();
      });
    await page.goto("/intro");
    await expect(root(page)).toHaveAttribute("data-intro", "pending");
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
    // the page's own controls are there from the first frame
    await expect(skip(page)).toBeVisible();
    await expect(replay(page)).toBeVisible();
    await expect(name(page)).toBeAttached();
    await done(page);
  });

  test("the CTA is hidden, and out of the Tab order, until its beat; focusable once done", async ({
    page,
  }) => {
    await page.goto("/intro");
    await playing(page);
    await page.waitForTimeout(3000);
    expect((await style(page, "cta")).visibility).toBe("hidden");
    const stops = await tabStops(page, 4);
    expect(stops.join(" | ")).toContain(ui.hud.skipIntro);
    expect(stops.join(" | ")).not.toContain(ui.intro.enter);
    await done(page);
    await enter(page).focus();
    await expect(enter(page)).toBeFocused();
    await expect(enter(page)).toHaveAttribute("href", "/arena");
  });

  test("SKIP INTRO works half a second in: the hub, no errors", async ({ page }) => {
    await page.goto("/intro");
    await playing(page);
    await page.waitForTimeout(500);
    await skip(page).click();
    await expect(page).toHaveURL("/arena");
    await page.waitForTimeout(500);
  });

  test("REPLAY five times quickly: one more show, one end, the letters all there", async ({
    page,
  }) => {
    await page.goto("/intro");
    await waitForHydration(page);
    await done(page);
    // Count how often the root becomes done from now on.
    await page.evaluate(() => {
      const w = window as unknown as { __ends: number };
      w.__ends = 0;
      new MutationObserver(() => {
        if (document.querySelector("main#main")!.getAttribute("data-intro") === "done") w.__ends++;
      }).observe(document.querySelector("main#main")!, {
        attributes: true,
        attributeFilter: ["data-intro"],
      });
    });
    for (let i = 0; i < 5; i++) await replay(page).click({ delay: 0 });
    await playing(page);
    await done(page);
    await page.waitForTimeout(800);
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

  test.describe("a slow rig", () => {
    test("frames that take 5 s: the show still ends, on the rest pose, with no head turn", async ({
      page,
      tolerate,
    }) => {
      tolerate(/ERR_ABORTED|Failed to load/);
      await page.route("**/turn_*.webp", (route) => setTimeout(() => void route.continue(), 5000));
      await page.goto("/intro");
      await playing(page);
      const start = Date.now();
      // 6.5 s of show, plus the 1.5 s it waits for the frames at the performance beat, plus slack.
      await done(page, 10_000);
      expect(Date.now() - start).toBeLessThan(8500);
      await expect(part(page, "rest")).toBeVisible();
      for (const strip of await part(page, "turn").all()) await expect(strip).toBeHidden();
      await expect(enter(page)).toBeVisible();
    });

    test("frames that fail: rest pose, strips hidden, the show ends on time", async ({
      page,
      tolerate,
    }) => {
      tolerate(/ERR_FAILED|Failed to load/);
      await page.route("**/turn_*.webp", (route) => route.abort());
      await page.goto("/intro");
      await playing(page);
      const start = Date.now();
      await done(page, 10_000);
      expect(Date.now() - start).toBeLessThan(8500);
      await expect(part(page, "rest")).toBeVisible();
      for (const strip of await part(page, "turn").all()) await expect(strip).toBeHidden();
    });

    test("with the frames on time, the head turn plays and the rest pose waits", async ({
      page,
    }) => {
      const strips = trackStrips(page);
      await page.goto("/intro");
      await done(page);
      expect(strips.size).toBe(3);
      await expect(part(page, "rest")).toBeHidden();
      // the last strip is left on its final frame
      await expect(part(page, "turn").nth(2)).toBeVisible();
    });
  });

  test.describe("reduced motion", () => {
    test.use({ reducedMotion: "reduce" });
    test("the end state at once, no frames requested, REPLAY gone", async ({ page }) => {
      const strips = trackStrips(page);
      await page.goto("/intro", { waitUntil: "commit" });
      await page.waitForTimeout(300);
      // Everything is already in place (CSS), before any script has run.
      for (const p of ["welcome", "cta", "board-strip"])
        expect((await style(page, p)).visibility, p).toBe("visible");
      await done(page, 5000);
      await expect(name(page)).toBeVisible();
      await expect(enter(page)).toBeVisible();
      await expect(replay(page)).toBeHidden();
      await expect(skip(page)).toBeVisible();
      await expect(part(page, "rest")).toBeVisible();
      await page.waitForTimeout(2500);
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
      await expect(root(page)).toHaveAttribute("data-intro", "pending");
      await expect(page.locator("html.js")).toHaveCount(0);
      for (const p of ["crowd", "board-header", "mover", "title", "board-strip", "welcome"])
        expect((await style(page, p)).visibility, p).toBe("visible");
      await expectLettersShown(page);
      await expect(part(page, "rest")).toBeVisible();
      await page.waitForTimeout(1000);
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
    await page.waitForTimeout(2000);
    expect((await style(page, "cta")).visibility).toBe("hidden");
    await expect(root(page)).toHaveAttribute("data-intro", "pending");
    await expect(enter(page)).toBeVisible({ timeout: 6500 });
    for (const p of ["crowd", "board-header", "mover", "title", "welcome"])
      expect((await style(page, p)).visibility, p).toBe("visible");
    await expectLettersShown(page);
    await expect(part(page, "rest")).toBeVisible();
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
    await page.goto("/intro");
    await done(page);
    await expectNoA11yViolations(page);
  });

  test("exactly one h1 is rendered from 768px up, and the phone placeholder's from below", async ({
    page,
  }) => {
    for (const [width, height] of [
      [1440, 900],
      [1200, 800],
      [768, 1024],
    ] as const) {
      await page.setViewportSize({ width, height });
      await page.goto("/intro");
      await expect(page.getByRole("heading", { level: 1 }), `${width}px`).toHaveCount(1);
      await expect(name(page), `${width}px`).toBeAttached();
    }
  });
});

test.describe("tablet (L1): the same stage intro on the scaled stage", () => {
  test.skip(({ hasTouch }) => hasTouch, "driven from the desktop project");

  for (const [width, height] of [
    [1024, 768],
    [768, 1024],
  ] as const) {
    test(`${width}x${height}: plays to done with the frames requested; mono stays readable and inside its box`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      const strips = trackStrips(page);
      await page.goto("/intro");
      await playing(page);
      await done(page);
      expect(strips.size, "the head-turn frames are requested").toBe(3);
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(name(page)).toBeVisible();
      await expect(enter(page)).toBeVisible();

      // Rendered size = the stage's design size x its scale (L2: nothing under 11px).
      const mono = await page.evaluate(() => {
        const scale = Number(
          getComputedStyle(document.documentElement).getPropertyValue("--stage-scale"),
        );
        return [...document.querySelectorAll<HTMLElement>('[data-stage] [class*="type-mono"]')]
          .filter((el) => el.getClientRects().length > 0)
          .map((el) => ({
            text: el.textContent,
            px: parseFloat(getComputedStyle(el).fontSize) * scale,
          }))
          .filter((m) => m.px < 10.99);
      });
      expect(mono, "mono text rendered under 11px").toEqual([]);

      // No mono text runs out of its box: the HUD buttons, the board header's spans, the footer cells.
      const overflowing = await page.evaluate(() => {
        const boxes = [
          ...document.querySelectorAll<HTMLElement>(
            "[data-stage] header a, [data-stage] header button",
          ),
          ...document.querySelectorAll<HTMLElement>('[data-part="board-header"] > span'),
          ...document.querySelectorAll<HTMLElement>('[data-part="board-strip"] > div'),
        ];
        return boxes
          .filter((el) => el.scrollWidth > el.clientWidth)
          .map((el) => `${el.textContent}: ${el.scrollWidth} > ${el.clientWidth}`);
      });
      expect(overflowing).toEqual([]);
    });
  }
});

test.describe("phone (until the phone's intro is built)", () => {
  test.skip(({ viewport }) => (viewport?.width ?? 0) >= 768, "the phone project");

  test("keeps its placeholder: one h1, no stage, nothing held back", async ({ page }) => {
    await page.goto("/intro");
    await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.intro.heading, {
      ignoreCase: true,
    });
    await expect(page.locator("[data-stage]")).toBeHidden();
    await expect(root(page)).toHaveAttribute("data-intro", "done");
  });
});
