import { expect, test, type Page } from "@playwright/test";
import { join } from "node:path";
import { ui } from "../../src/content/ui-copy";
import { waitForFiniteAnimations } from "../support/animations";
import { expectNoA11yViolations } from "../support/a11y";
import { expectMatchesArtboard } from "../support/visual";
import { waitForHydration } from "./support/contentPage";

const hub = ui.hub;

/** A touch pointer event on an element (`page.touchscreen` can only tap). */
const touchEvent = (
  target: ReturnType<Page["locator"]>,
  type: string,
  at: { x: number; y: number },
) =>
  target.dispatchEvent(type, {
    pointerType: "touch",
    pointerId: 7,
    isPrimary: true,
    buttons: type === "pointerdown" || type === "pointermove" ? 1 : 0,
    clientX: at.x,
    clientY: at.y,
    bubbles: true,
  });

/** Writes the saved match record before the page's own scripts run. A string is stored as it is (a broken record). */
async function seed(page: Page, state: object | string) {
  await page.addInitScript((value) => {
    localStorage.setItem(
      "arena:v1",
      typeof value === "string" ? value : JSON.stringify({ state: value, version: 1 }),
    );
  }, state);
}

/** The Hub artboard's state: cricket played "14* NOT OUT", record 1 to 0, Career seen. */
const ARTBOARD = {
  venuesPlayed: ["cricket"],
  lastScores: { cricket: "14* NOT OUT" },
  sectionsSeen: ["career"],
  yashWins: 1,
};
/** After the full matchday: Full Time is listed (the rail's longest state). */
const DONE = {
  ...ARTBOARD,
  venuesPlayed: ["cricket", "tennis", "badminton"],
  lastScores: { cricket: "14* NOT OUT", tennis: "GAME YASH", badminton: "GAME YASH" },
  sectionsSeen: ["career", "highlights", "attributes", "trophies", "card", "teamUp", "scout"],
  yashWins: 3,
};
/** A record saved by Phase 5, with the win path still in it (Review Focus 1). */
const PHASE_5 = {
  ...DONE,
  yashWins: undefined,
  record: { yash: 2, you: 1 },
  achievements: ["giant-killer"],
  lockerRoomUnlocked: true,
  teamUpPrefill: "I beat you.",
  sectionsSeen: [...DONE.sectionsSeen, "lockerRoom"],
};

const rail = (page: Page) => page.locator("aside");
const card = (page: Page, name: string) => page.getByRole("article").filter({ hasText: name });
const playLinks = (page: Page) =>
  page.locator("main article").getByRole("link", { name: /^PLAY$/ });
/** The record read-out in the top row. */
const recordChip = (page: Page) =>
  page.locator("[data-stage]").getByText(ui.record.yours, { exact: true }).locator("..");
const bar = (page: Page) => page.locator("[data-commentary-bar]");

/** Collects the page's errors: an odd saved record must never reach the console. */
function watchErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (e) => errors.push(e.message));
  page.on("console", (m) => {
    if (m.type() === "error") errors.push(m.text());
  });
  return errors;
}

/** Resolves once the commentary line has finished entering (it holds on air for 4 s after that). */
const commEntered = (page: Page) =>
  page.evaluate(async () => {
    const el = document.querySelector("[data-commentary-bar]");
    await Promise.all((el?.getAnimations({ subtree: true }) ?? []).map((a) => a.finished));
  });

test.describe("desktop hub", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "desktop",
      "the stage is a desktop page; the phone and tablet column has its own tests below",
    );
  });

  test.describe("matches the Hub artboard", () => {
    // Reduced motion: the arc sits exactly where it is drawn (the idle sway is off).
    test.use({ reducedMotion: "reduce" });

    test("a returning visitor at 1440x900 (the artboard's state)", async ({ page }) => {
      await seed(page, ARTBOARD);
      await page.goto("/arena");
      await waitForHydration(page);
      await expect(
        card(page, "CRICKET GROUND").getByRole("link", { name: "REMATCH" }),
      ).toBeVisible();
      await expect(bar(page)).toBeVisible();
      await commEntered(page);
      const masks = {
        // The chip says YOUR RECORD (spec §11.2 #11, H3): the artboard's says RECORD, so the chip is wider.
        "record chip": recordChip(page),
        // The index adds QUICK VIEW (spec §11.3, H6): a row the artboard does not draw.
        "quick view index row": rail(page).getByRole("link", { name: /Quick View/ }),
        // F8: the rail's bottom box says FULL TIME where the artboard says HIDDEN ACHIEVEMENTS (new words).
        "full time box": rail(page).getByText(hub.fullTime.label, { exact: true }).locator(".."),
      };
      for (const [name, locator] of Object.entries(masks))
        console.log(`[mask] ${name} ${JSON.stringify(await locator.boundingBox())}`);
      const ratio = await expectMatchesArtboard(page, "Hub", {
        maxDiffRatio: 0.02,
        mask: Object.values(masks),
      });
      console.log(`[ratio] Hub route ${ratio}`);
      expect(ratio).toBeLessThanOrEqual(0.02);
    });
  });

  test("a fresh visitor sees nothing played", async ({ page }) => {
    await page.goto("/arena");
    await waitForHydration(page);
    await expect(rail(page).getByText("0 OF 3 VENUES")).toBeVisible();
    await expect(playLinks(page)).toHaveCount(3);
    await expect(recordChip(page)).toHaveText(`${ui.record.yours}YASH 0 · YOU 0`);
    await expect(bar(page)).toContainText(hub.comm.none);
    await expect(rail(page).getByRole("link", { name: /Career Stats/ })).toContainText(
      hub.index.links.career.tag,
    );
    await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.arena.heading);
  });

  test("a section opened earlier shows SEEN", async ({ page }) => {
    await page.goto("/highlights");
    await waitForHydration(page);
    // Wait out the shell's saved-record load: opening the page marks it seen once that is done.
    await expect
      .poll(() => page.evaluate(() => localStorage.getItem("arena:v1")))
      .toContain("highlights");
    await page.locator("a[href='/arena']:visible").first().click();
    await expect(page).toHaveURL("/arena");
    await expect(rail(page).getByRole("link", { name: /Match Highlights/ })).toContainText(
      hub.index.seen,
    );
    await expect(rail(page).getByRole("link", { name: /Player Attributes/ })).not.toContainText(
      hub.index.seen,
    );
  });

  test("the rail's FULL TIME box waits for all three venues, then says the result is up (F8)", async ({
    page,
  }) => {
    await seed(page, ARTBOARD);
    await page.goto("/arena");
    await waitForHydration(page);
    const box = rail(page).getByText(hub.fullTime.label, { exact: true }).locator("..");
    await expect(box).toContainText(hub.fullTime.pending);
    await expect(rail(page).getByRole("link", { name: /Full Time/ })).toHaveCount(0);
  });

  test("a record saved by Phase 5 reads as Yash's wins against YOU 0, with Full Time and no Locker Room", async ({
    page,
  }) => {
    const errors = watchErrors(page);
    await seed(page, PHASE_5);
    await page.goto("/arena");
    await waitForHydration(page);
    await expect(recordChip(page)).toHaveText(`${ui.record.yours}YASH 2 · YOU 0`);
    const full = rail(page).getByRole("link", { name: /Full Time/ });
    await expect(full).toHaveAttribute("href", "/arena/full-time");
    await expect(rail(page).getByRole("link", { name: /Locker Room/ })).toHaveCount(0);
    await expect(rail(page)).toContainText(hub.fullTime.done);
    expect(errors).toEqual([]);
  });

  test.describe("odd saved records read as a fresh visitor", () => {
    const BAD: Record<string, string> = {
      "malformed JSON": "{not json",
      "the wrong shape": JSON.stringify({
        state: { venuesPlayed: "x", record: { yash: -1 } },
        version: 1,
      }),
    };
    for (const [name, value] of Object.entries(BAD)) {
      test(name, async ({ page }) => {
        const errors = watchErrors(page);
        await seed(page, value);
        await page.goto("/arena");
        await waitForHydration(page);
        // Ready well before the 3 s CSS fallback could do it: every record-bound part has been released, and the
        // desktop has said its line.
        await expect(page.locator("[data-record-pending]")).toHaveCount(0, { timeout: 1500 });
        await expect(rail(page).getByText("0 OF 3 VENUES")).toBeVisible({ timeout: 1500 });
        await expect(playLinks(page)).toHaveCount(3);
        await expect(recordChip(page)).toBeVisible({ timeout: 1500 });
        await expect(bar(page)).toContainText(hub.comm.none, { timeout: 1500 });
        expect(errors).toEqual([]);
      });
    }

    test("a malformed record still lets a section be marked SEEN", async ({ page }) => {
      await seed(page, "{not json");
      await page.goto("/highlights");
      await waitForHydration(page);
      await expect
        .poll(() => page.evaluate(() => localStorage.getItem("arena:v1")), { timeout: 1500 })
        .toContain("highlights");
    });

    test("blocked storage", async ({ page }) => {
      const errors = watchErrors(page);
      await page.addInitScript(() => {
        Object.defineProperty(window, "localStorage", {
          get() {
            throw new DOMException("blocked", "SecurityError");
          },
        });
      });
      await page.goto("/arena");
      await waitForHydration(page);
      await expect(rail(page).getByText("0 OF 3 VENUES")).toBeVisible();
      await expect(playLinks(page)).toHaveCount(3);
      expect(errors).toEqual([]);
    });
  });

  test.describe("first paint of a returning visitor (H5)", () => {
    test("with scripts held back the record parts stay hidden, and the head script lets them go at 3 s", async ({
      page,
    }) => {
      await seed(page, ARTBOARD);
      await page.route("**/*.js", (route) => route.abort());
      await page.goto("/arena", { waitUntil: "domcontentloaded" });
      const pending = page.locator("[data-stage] [data-record-pending]");
      expect(await pending.count()).toBeGreaterThan(0);
      const visibilities = () =>
        pending.evaluateAll((els) => els.map((el) => getComputedStyle(el).visibility));
      expect(new Set(await visibilities())).toEqual(new Set(["hidden"]));
      // The h1, the facilities and the HUD brand are not record-bound: they are there from the first frame.
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.waitForTimeout(3200);
      expect(new Set(await visibilities())).toEqual(new Set(["visible"]));
    });

    // The 3 s release is a timer in the head script, not a CSS delay: a reduced-motion setting must not shorten it.
    test.describe("reduced motion", () => {
      test.use({ reducedMotion: "reduce" });
      test("with scripts held back the record parts stay hidden at 200 ms and show by 3.2 s; cricket never reads PLAY meanwhile", async ({
        page,
      }) => {
        await seed(page, ARTBOARD);
        await page.addInitScript(() => {
          const w = window as unknown as { __sawPlayEarly: boolean; __frames: number };
          w.__sawPlayEarly = false;
          w.__frames = 0;
          const frame = () => {
            const link = document.querySelector<HTMLElement>(
              "main article a[href='/arena/cricket']",
            );
            if (link) {
              w.__frames++;
              if (
                performance.now() < 2500 &&
                getComputedStyle(link).visibility === "visible" &&
                link.textContent?.trim() === "PLAY"
              )
                w.__sawPlayEarly = true;
            }
            requestAnimationFrame(frame);
          };
          requestAnimationFrame(frame);
        });
        await page.route("**/*.js", (route) => route.abort());
        await page.goto("/arena", { waitUntil: "domcontentloaded" });
        const pending = page.locator("[data-stage] [data-record-pending]");
        expect(await pending.count()).toBeGreaterThan(0);
        const visibilities = () =>
          pending.evaluateAll((els) => els.map((el) => getComputedStyle(el).visibility));
        await page.waitForTimeout(200);
        expect(new Set(await visibilities())).toEqual(new Set(["hidden"]));
        await page.waitForTimeout(2200);
        expect(new Set(await visibilities())).toEqual(new Set(["hidden"]));
        await page.waitForTimeout(800);
        expect(new Set(await visibilities())).toEqual(new Set(["visible"]));
        const seen = await page.evaluate(() => {
          const w = window as unknown as { __sawPlayEarly: boolean; __frames: number };
          return { sawPlayEarly: w.__sawPlayEarly, frames: w.__frames };
        });
        expect(seen.frames, "the probe saw frames with the card in them").toBeGreaterThan(0);
        expect(seen.sawPlayEarly).toBe(false);
      });
    });

    test("with scripts running, cricket never shows PLAY before REMATCH", async ({ page }) => {
      await seed(page, ARTBOARD);
      await page.addInitScript(() => {
        const w = window as unknown as { __sawPlay: boolean; __frames: number };
        w.__sawPlay = false;
        w.__frames = 0;
        const look = () => {
          const link = document.querySelector<HTMLElement>("main article a[href='/arena/cricket']");
          if (!link) return;
          w.__frames++;
          if (
            getComputedStyle(link).visibility === "visible" &&
            link.textContent?.trim() === "PLAY"
          )
            w.__sawPlay = true;
        };
        // Every frame, until the page is settled. A frame is what could be painted: rendering waits for the
        // stylesheet, so a DOM mutation seen before it (the unstyled prerender) is never on screen.
        const frame = () => {
          look();
          requestAnimationFrame(frame);
        };
        requestAnimationFrame(frame);
      });
      await page.goto("/arena", { waitUntil: "domcontentloaded" });
      await expect(
        card(page, "CRICKET GROUND").getByRole("link", { name: "REMATCH" }),
      ).toBeVisible();
      await page.waitForTimeout(300);
      const seen = await page.evaluate(() => {
        const w = window as unknown as { __sawPlay: boolean; __frames: number };
        return { sawPlay: w.__sawPlay, frames: w.__frames };
      });
      expect(seen.frames, "the probe saw frames with the card in them").toBeGreaterThan(0);
      expect(seen.sawPlay).toBe(false);
    });

    test.describe("scripts off", () => {
      test.use({ javaScriptEnabled: false });
      test("the fresh state is there and the links work", async ({ page }) => {
        await page.goto("/arena");
        await expect(rail(page).getByText("0 OF 3 VENUES")).toBeVisible();
        await expect(playLinks(page)).toHaveCount(3);
        await playLinks(page).first().click();
        await expect(page).toHaveURL("/arena/cricket");
      });
    });
  });

  test.describe("shortcuts (H10)", () => {
    test("2 plays tennis", async ({ page }) => {
      await page.goto("/arena");
      await waitForHydration(page);
      await page.keyboard.press("2");
      await expect(page).toHaveURL("/arena/tennis");
    });

    test("Ctrl+2 and Alt+2 do nothing: only the plain 3 that follows goes anywhere", async ({
      page,
    }) => {
      await page.goto("/arena");
      await waitForHydration(page);
      const visited: string[] = [];
      page.on("framenavigated", (frame) => visited.push(new URL(frame.url()).pathname));
      await page.keyboard.press("Control+2");
      await page.keyboard.press("Alt+2");
      await page.keyboard.press("3");
      await expect(page).toHaveURL("/arena/badminton");
      expect(visited).toEqual(["/arena/badminton"]);
    });

    test("on a focused link, 1 is not a shortcut and Enter is that link's own action", async ({
      page,
    }) => {
      await page.goto("/arena");
      await waitForHydration(page);
      await card(page, "CENTRE COURT").getByRole("link", { name: "PLAY" }).focus();
      await page.keyboard.press("1");
      await page.waitForTimeout(600);
      await expect(page).toHaveURL("/arena");
      let navigations = 0;
      page.on("framenavigated", () => navigations++);
      await page.keyboard.press("Enter");
      await expect(page).toHaveURL("/arena/tennis");
      await page.waitForTimeout(600);
      expect(navigations).toBe(1);
    });

    test("at 1024x768 the keys do nothing", async ({ page }) => {
      await page.setViewportSize({ width: 1024, height: 768 });
      await page.goto("/arena");
      await waitForHydration(page);
      await page.keyboard.press("1");
      await page.waitForTimeout(600);
      await expect(page).toHaveURL("/arena");
    });
  });

  test("exactly one h1 and no sideways scroll at every desktop size", async ({ page }) => {
    await page.goto("/arena");
    await waitForHydration(page);
    for (const [width, height] of [
      [2560, 1080],
      [1440, 900],
      [1366, 768],
      [1280, 720],
      [1200, 800],
    ] as const) {
      await page.setViewportSize({ width, height });
      await expect(page.getByRole("heading", { level: 1 }), `h1 at ${width}`).toHaveCount(1);
      await expect
        .poll(
          () =>
            page.evaluate(
              () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
            ),
          { message: `horizontal overflow at ${width}px` },
        )
        .toBeLessThanOrEqual(0);
    }
  });

  test.describe("small text on laptop screens (H13)", () => {
    for (const [width, height] of [
      [1280, 720],
      [1366, 768],
    ] as const) {
      test(`at ${width}x${height} the rail tags and the card meta render at 11px or more`, async ({
        page,
      }) => {
        await seed(page, ARTBOARD);
        await page.setViewportSize({ width, height });
        await page.goto("/arena");
        await waitForHydration(page);
        await expect(
          card(page, "CRICKET GROUND").getByRole("link", { name: "REMATCH" }),
        ).toBeVisible();
        const sizes = await page.evaluate(() => {
          const stage = document.querySelector("[data-stage]")!.getBoundingClientRect();
          const scale = stage.width / 1440;
          const size = (el: Element) => parseFloat(getComputedStyle(el).fontSize) * scale;
          const tags = [...document.querySelectorAll("aside nav a > span:last-child")].map(size);
          const meta = [...document.querySelectorAll("[data-stage] article")].flatMap((a) =>
            [...a.querySelectorAll("div.justify-between > span")].map(size),
          );
          return { scale, tags, meta };
        });
        // The stage fits the window: by its height on a wide laptop (the 16:10 board).
        expect(sizes.scale).toBeCloseTo(Math.min(width / 1440, height / 900), 2);
        expect(sizes.tags.length).toBeGreaterThanOrEqual(8);
        expect(sizes.meta).toHaveLength(6);
        for (const s of [...sizes.tags, ...sizes.meta]) expect(s).toBeGreaterThanOrEqual(11 - 0.01);
      });
    }

    // A floored mono label keeps its drawn width: its letters grow to 11px and its tracking shrinks (L2).
    for (const [width, height] of [
      [1280, 720],
      [1200, 800],
    ] as const) {
      test(`${width}x${height}: the mono lines stay on one line at 11px or more`, async ({
        page,
      }) => {
        await seed(page, ARTBOARD);
        await page.setViewportSize({ width, height });
        await page.goto("/arena");
        await waitForHydration(page);
        await expect(
          card(page, "CRICKET GROUND").getByRole("link", { name: "REMATCH" }),
        ).toBeVisible();
        const lines = await page.evaluate(
          ({ labels }) => {
            const stage = document.querySelector("[data-stage]")!.getBoundingClientRect();
            const scale = stage.width / 1440;
            const measure = (name: string, el: Element) => {
              const style = getComputedStyle(el);
              const size = parseFloat(style.fontSize);
              const lineHeight =
                style.lineHeight === "normal" ? size * 1.3 : parseFloat(style.lineHeight);
              return {
                name,
                lines: Math.round(el.getBoundingClientRect().height / lineHeight),
                rendered: size * scale,
              };
            };
            const leaf = (text: string, root: ParentNode) =>
              [...root.querySelectorAll("*")].find(
                (e) => e.children.length === 0 && e.textContent?.trim().startsWith(text),
              )!;
            const out = [...document.querySelectorAll("[data-stage] article")].flatMap((a, i) => [
              measure(`card ${i + 1} reveals`, leaf("REVEALS", a)),
              measure(`card ${i + 1} meta row`, leaf("VENUE", a).parentElement!),
            ]);
            const aside = document.querySelector("aside")!;
            for (const text of labels) out.push(measure(text, leaf(text, aside)));
            return out;
          },
          { labels: [hub.matchday.label, hub.index.title, hub.fullTime.label] },
        );
        expect(lines).toHaveLength(9);
        for (const row of lines) {
          expect(row.lines, `${row.name} on one line`).toBe(1);
          expect(row.rendered, `${row.name} rendered size`).toBeGreaterThanOrEqual(11 - 0.01);
        }
      });
    }

    for (const [width, height] of [
      [1200, 800],
      [1280, 720],
      [1366, 768],
    ] as const) {
      test(`${width}x${height}: one-line card meta, the whole rail inside its box, nothing past the stage`, async ({
        page,
      }) => {
        await seed(page, DONE);
        await page.setViewportSize({ width, height });
        await page.goto("/arena");
        await waitForHydration(page);
        await expect(rail(page).getByRole("link", { name: /Full Time/ })).toBeVisible();
        const result = await page.evaluate(() => {
          const stage = document.querySelector("[data-stage]")!.getBoundingClientRect();
          // The meta rows: the venue number and the status, side by side.
          const rows = [
            ...document.querySelectorAll("[data-stage] article div.justify-between"),
          ].map((row) => {
            const tallest = Math.max(
              ...[...row.children].map((c) => parseFloat(getComputedStyle(c).fontSize)),
            );
            return { height: row.getBoundingClientRect().height, tallest };
          });
          const aside = document.querySelector("aside")!.getBoundingClientRect();
          const last = [...document.querySelectorAll("aside *")]
            .filter((el) => el.getClientRects().length > 0)
            .map((el) => el.getBoundingClientRect())
            .reduce((max, r) => Math.max(max, r.bottom), 0);
          const rows9 = document.querySelectorAll("aside nav a").length;
          // Everything the page puts on the stage (the backdrop bleeds on purpose, past it).
          const ui = document.querySelector("[data-stage] > div:last-child")!;
          const past = [...ui.querySelectorAll("*")]
            .filter((el) => !el.closest(".sr-only") && el.getClientRects().length > 0)
            .map((el) => ({ el, r: el.getBoundingClientRect() }))
            .filter(
              ({ r }) => r.width > 0 && (r.right > stage.right + 1 || r.left < stage.left - 1),
            )
            .map(({ el }) => el.tagName + "." + el.className);
          return { rows, asideBottom: aside.bottom, lastBottom: last, rows9, past };
        });
        expect(result.rows).toHaveLength(3);
        // One line is the recipe's line box (at most 1.3 x its size); two would be 2.6 x.
        for (const row of result.rows) expect(row.height).toBeLessThanOrEqual(row.tallest * 1.5);
        expect(result.rows9).toBe(9);
        expect(result.lastBottom).toBeLessThanOrEqual(result.asideBottom + 0.5);
        expect(result.past).toEqual([]);
      });
    }
  });

  test.describe("motion (H9)", () => {
    const plate = (page: Page) => page.locator("[data-orbit]");
    const transform = (page: Page) => plate(page).evaluate((el) => getComputedStyle(el).transform);
    /** How far the plate is turned about its upright axis, in degrees. */
    const turn = (page: Page) =>
      plate(page).evaluate((el) => {
        const m = new DOMMatrix(getComputedStyle(el).transform);
        return (Math.atan2(m.m13, m.m11) * 180) / Math.PI;
      });
    /** The first child of a card is its picture: a place to press that is not a link. */
    const art = (page: Page, name: string) => card(page, name).locator("> div").first();
    const SHOTS = join(process.cwd(), ".superpowers/sdd/2026-10-08-phase-4-hub/shots");

    /** On the Hub with the motion running (it starts a beat after hydration, once the stage knows it is wide) and the cards showing. */
    async function swaying(page: Page) {
      await page.goto("/arena");
      await waitForHydration(page);
      await expect(plate(page)).toHaveAttribute("data-orbit", "sway");
      // The cards stay hidden until the saved match record has loaded (H5): nothing can be pressed before.
      await expect(playLinks(page).first()).toBeVisible();
    }

    test("the arc sways by itself", async ({ page }) => {
      await swaying(page);
      await page.waitForTimeout(1000);
      const first = await transform(page);
      expect(first).not.toBe("none");
      await page.waitForTimeout(500);
      expect(await transform(page)).not.toBe(first);
    });

    test("every card stays under the pointer across its whole width while the arc sways", async ({
      page,
    }) => {
      await swaying(page);
      for (const name of ["CRICKET GROUND", "CENTRE COURT", "BADMINTON HALL"]) {
        const box = (await card(page, name).boundingBox())!;
        for (const across of [0.1, 0.5, 0.9]) {
          const hit = await page.evaluate(
            ([x, y]) =>
              document.elementFromPoint(x!, y!)?.closest("article")?.querySelector("h2")
                ?.textContent,
            [box.x + box.width * across, box.y + box.height / 2],
          );
          expect(hit, `${name} at ${across}`).toBe(name);
        }
      }
    });

    test.describe("reduced motion", () => {
      test.use({ reducedMotion: "reduce" });
      test("nothing moves", async ({ page }) => {
        await page.goto("/arena");
        await waitForHydration(page);
        await page.waitForTimeout(2000);
        await expect(plate(page)).toHaveAttribute("data-orbit", "rest");
        expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(await transform(page));
        // The card still straightens on focus, and the tilt stays off.
        await page.mouse.move(1000, 400);
        await page.waitForTimeout(500);
        expect(await transform(page)).toBe("none");
      });
    });

    test.describe("the hint says only what works", () => {
      const hint = (page: Page) => page.locator("[data-stage] p").filter({ hasText: /VENUE$/ });
      test("a mouse with motion on: both", async ({ page }) => {
        await page.goto("/arena");
        await waitForHydration(page);
        await expect(hint(page)).toHaveText(`${hub.hint.drag} · ${hub.hint.keys}`);
      });
      test.describe("reduced motion", () => {
        test.use({ reducedMotion: "reduce" });
        test("the keys only", async ({ page }) => {
          await page.goto("/arena");
          await waitForHydration(page);
          await expect(hint(page)).toHaveText(hub.hint.keys);
        });
      });
      test.describe("a touch-only screen", () => {
        test.use({ hasTouch: true, isMobile: true, viewport: { width: 1366, height: 1024 } });
        test("the drag only", async ({ page }) => {
          await page.goto("/arena");
          await waitForHydration(page);
          await expect(page.locator("[data-stage]")).toBeVisible();
          await expect(
            page.locator("[data-stage] p").filter({ hasText: hub.hint.drag }),
          ).toHaveText(hub.hint.drag);
        });
      });
    });

    test.describe("the lift does not move the card out from under the pointer", () => {
      // Reduced motion freezes the sway, so the card sits where it is measured; the CSS lift still happens.
      test.use({ reducedMotion: "reduce" });
      test("with the pointer in a card's bottom edge it stays lifted, no bobbing", async ({
        page,
      }) => {
        await seed(page, ARTBOARD);
        await page.goto("/arena");
        await waitForHydration(page);
        const cricket = card(page, "CRICKET GROUND");
        await expect(cricket.getByRole("link", { name: "REMATCH" })).toBeVisible();
        const box = (await cricket.boundingBox())!;
        await page.mouse.move(box.x + box.width / 2, box.y + box.height - 3, { steps: 4 });
        const lifts: number[] = [];
        for (let i = 0; i < 12; i++) {
          await page.waitForTimeout(100);
          lifts.push(
            await cricket.evaluate(
              (el) => new DOMMatrix(getComputedStyle(el.parentElement!).transform).m42,
            ),
          );
        }
        expect(new Set(lifts)).toEqual(new Set([-8]));
      });
    });

    test("the mouse over a card tilts it toward the pointer", async ({ page }) => {
      await swaying(page);
      const box = (await card(page, "CENTRE COURT").boundingBox())!;
      await page.mouse.move(box.x + box.width * 0.9, box.y + box.height * 0.5, { steps: 6 });
      await expect
        .poll(() => card(page, "CENTRE COURT").evaluate((el) => getComputedStyle(el).transform))
        .not.toBe("none");
      await page.waitForTimeout(700);
      await page.screenshot({ path: join(SHOTS, "task5-hover-tilt.png") });
    });

    test("a drag on the picture turns the arc and opens nothing", async ({ page }) => {
      await swaying(page);
      const box = (await art(page, "CRICKET GROUND").boundingBox())!;
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 150, y, { steps: 10 });
      await page.mouse.move(x + 300, y, { steps: 10 });
      await expect(plate(page)).toHaveAttribute("data-orbit", "drag");
      await page.waitForTimeout(600);
      await page.screenshot({ path: join(SHOTS, "task5-drag.png") });
      // The plate itself turned, and past the idle sway's 6 degrees: 300px of an 1100px arc is 8 degrees.
      const held = await turn(page);
      expect(Math.abs(held), "the plate follows the drag").toBeGreaterThan(6.5);
      await page.waitForTimeout(300);
      expect(await turn(page), "and holds still, the sway is off").toBeCloseTo(held, 1);
      await page.mouse.up();
      await expect(plate(page)).toHaveAttribute("data-orbit", "rest");
      await page.waitForTimeout(500);
      await expect(page).toHaveURL("/arena");
    });

    test("a drag that leaves the arc and lets go outside it ends there: the plate settles back and nothing opens", async ({
      page,
    }) => {
      await swaying(page);
      const frame = (await plate(page).locator("..").boundingBox())!;
      const box = (await art(page, "CRICKET GROUND").boundingBox())!;
      const x = box.x + box.width / 2;
      const y = box.y + box.height / 2;
      await page.mouse.move(x, y);
      await page.mouse.down();
      await page.mouse.move(x + 200, y, { steps: 10 });
      await expect(plate(page)).toHaveAttribute("data-orbit", "drag");
      expect(Math.abs(await turn(page))).toBeGreaterThan(4);
      // Out of the frame, over the index rail, and let go there.
      await page.mouse.move(frame.x - 120, y, { steps: 8 });
      await page.mouse.up();
      await expect(plate(page)).not.toHaveAttribute("data-orbit", "drag");
      await expect.poll(() => turn(page).then(Math.abs), { timeout: 3000 }).toBeLessThan(0.5);
      await expect(page).toHaveURL("/arena");
      // The press is not stuck: a plain move pauses the sway again, and it comes back after 4 s.
      await page.mouse.move(x, y, { steps: 4 });
      await expect(plate(page)).toHaveAttribute("data-orbit", "rest");
      await expect(plate(page)).toHaveAttribute("data-orbit", "sway", { timeout: 6000 });
    });

    test("a drag that begins on a link does not open it", async ({ page }) => {
      await swaying(page);
      const link = card(page, "CENTRE COURT").getByRole("link", { name: "PLAY" });
      const box = (await link.boundingBox())!;
      await page.mouse.move(box.x + 10, box.y + 10);
      await page.mouse.down();
      await page.mouse.move(box.x + 60, box.y + 12, { steps: 6 });
      await page.mouse.up();
      await page.waitForTimeout(600);
      await expect(page).toHaveURL("/arena");
    });

    test("a plain click on PLAY still opens the venue", async ({ page }) => {
      await swaying(page);
      const play = card(page, "CENTRE COURT").getByRole("link", { name: "PLAY" });
      // Like a visitor: arrive over the link first, let the card lift and the arc hold still, then press.
      // (force: the swaying arc never holds still long enough for the "stable" check.)
      await play.hover({ force: true });
      await page.waitForTimeout(700);
      await play.click();
      await expect(page).toHaveURL("/arena/tennis");
    });

    test("keyboard focus straightens the card and lifts it", async ({ page }) => {
      await swaying(page);
      await card(page, "CRICKET GROUND")
        .getByRole("link", { name: /PLAY|REMATCH/ })
        .focus();
      await expect
        .poll(() =>
          card(page, "CRICKET GROUND").evaluate((el) => {
            const m = new DOMMatrix(getComputedStyle(el.parentElement!).transform);
            return [Math.abs(m.m13) < 1e-6 && Math.abs(m.m31) < 1e-6, m.m42];
          }),
        )
        .toEqual([true, -8]);
    });

    test("resizing mid-sway raises no errors", async ({ page }) => {
      const errors = watchErrors(page);
      await page.goto("/arena");
      await waitForHydration(page);
      await expect(plate(page)).toHaveAttribute("data-orbit", "sway");
      for (const [width, height] of [
        [1024, 768],
        [1440, 900],
      ] as const) {
        await page.setViewportSize({ width, height });
        await page.waitForTimeout(400);
      }
      await expect(plate(page)).toHaveAttribute("data-orbit", "sway");
      expect(errors).toEqual([]);
    });

    // An iPad Pro held wide: a finger, no mouse, and the desktop stage.
    test.describe("with a finger", () => {
      test.use({ hasTouch: true, isMobile: false, viewport: { width: 1366, height: 1024 } });

      /** A finger event on a card's picture, `dx` px along from where it went down. */
      const touch = (page: Page, name: string, type: string, dx = 0) =>
        touchEvent(art(page, name), type, { x: 300 + dx, y: 400 });

      test("the arc sways, a finger drag turns it without opening anything, a tap opens the venue", async ({
        page,
      }) => {
        await swaying(page);
        await touch(page, "CRICKET GROUND", "pointerdown");
        await touch(page, "CRICKET GROUND", "pointermove", 40);
        await touch(page, "CRICKET GROUND", "pointermove", 160);
        await expect(plate(page)).toHaveAttribute("data-orbit", "drag");
        await touch(page, "CRICKET GROUND", "pointerup", 160);
        await page.waitForTimeout(500);
        await expect(page).toHaveURL("/arena");
        await card(page, "CENTRE COURT").getByRole("link", { name: "PLAY" }).tap({ force: true });
        await expect(page).toHaveURL("/arena/tennis");
      });
    });
  });

  for (const [name, state] of [
    ["a returning visitor", ARTBOARD],
    ["a fresh visitor", null],
  ] as const) {
    test(`axe finds nothing for ${name}`, async ({ page }) => {
      if (state) await seed(page, state);
      await page.goto("/arena");
      await waitForHydration(page);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await expectNoA11yViolations(page);
    });
  }
});

// ---------------------------------------------------------------------------------------------------------------
// Below 1200px: the fixtures column, the tab bar and the index drawer (H1, H2, H4).

const column = (page: Page) => page.locator("[data-hub-column]");
const fixture = (page: Page, name: string) =>
  column(page).getByRole("article").filter({ hasText: name });
const tabBar = (page: Page) => page.getByRole("navigation", { name: ui.tabs.label });
const indexButton = (page: Page) =>
  column(page).getByRole("button", { name: hub.drawer.open, exact: true });
const drawer = (page: Page) => page.getByRole("dialog", { name: hub.index.label });
const horizontalOverflow = (page: Page) =>
  page.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);

/** Resolves once the column's entrances are over (axe and the press tests look at a part at rest). */
const risen = (page: Page) => waitForFiniteAnimations(page, { root: "[data-hub-column]" });

test.describe("phone hub", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(
      testInfo.project.name !== "mobile",
      "the phone column is driven from the phone project",
    );
  });

  test.describe("record states", () => {
    test("the artboard's record: cricket played, tennis and badminton to play", async ({
      page,
    }) => {
      await seed(page, ARTBOARD);
      await page.goto("/arena");
      await waitForHydration(page);
      await expect(column(page).getByText("TODAY'S FIXTURES · 1 OF 3 PLAYED")).toBeVisible();
      const cricket = fixture(page, "CRICKET GROUND");
      await expect(cricket.getByText("14* NOT OUT")).toBeVisible();
      await expect(cricket.getByRole("link", { name: "REMATCH" })).toBeVisible();
      await expect(cricket.getByRole("link", { name: /SEE STATS/ })).toBeVisible();
      const tennis = fixture(page, "CENTRE COURT");
      await expect(tennis.getByText("~12s")).toBeVisible();
      await expect(tennis.getByRole("link", { name: "PLAY", exact: true })).toBeVisible();
      await expect(tennis.getByRole("link", { name: /^SKIP/ })).toBeVisible();
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.arena.heading);
    });

    test("a fresh visitor sees nothing played", async ({ page }) => {
      await page.goto("/arena");
      await waitForHydration(page);
      await expect(column(page).getByText("TODAY'S FIXTURES · 0 OF 3 PLAYED")).toBeVisible();
      await expect(column(page).getByRole("link", { name: "PLAY", exact: true })).toHaveCount(3);
    });
  });

  test("the tab bar: ARENA is current, and the last tile ends above it", async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto("/arena");
    await waitForHydration(page);
    await expect(tabBar(page).getByRole("link", { name: ui.tabs.arena })).toHaveAttribute(
      "aria-current",
      "page",
    );
    await risen(page);
    await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
    const last = (await column(page)
      .getByRole("link", { name: new RegExp(hub.facilities.academy.titlePhone) })
      .boundingBox())!;
    const bar = (await tabBar(page).boundingBox())!;
    expect(last.y + last.height).toBeLessThanOrEqual(bar.y);
  });

  test("no commentary on a phone (L11)", async ({ page }) => {
    await seed(page, ARTBOARD);
    await page.goto("/arena");
    await waitForHydration(page);
    await expect(column(page).getByText("TODAY'S FIXTURES · 1 OF 3 PLAYED")).toBeVisible();
    await page.waitForTimeout(800);
    await expect(bar(page)).toHaveCount(0);
    await expect(page.getByText(hub.comm.one)).toHaveCount(0);
  });

  for (const [name, state] of [
    ["a returning visitor", ARTBOARD],
    ["a fresh visitor", null],
  ] as const) {
    test(`axe finds nothing for ${name}, the drawer closed and open`, async ({ page }) => {
      if (state) await seed(page, state);
      await page.goto("/arena");
      await waitForHydration(page);
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await risen(page);
      await expectNoA11yViolations(page);
      await indexButton(page).click();
      await expect(drawer(page)).toBeVisible();
      await expectNoA11yViolations(page);
    });
  }

  test.describe("touch motion (H9)", () => {
    // The matchday bars in the drawer stagger with --i too: only the column's own parts count.
    const risers = (page: Page) => column(page).locator("[style*='--i']:not(dialog *)");

    test("the fixtures and tiles rise in one after another", async ({ page }) => {
      await page.goto("/arena");
      await waitForHydration(page);
      const rows = await risers(page).evaluateAll((els) =>
        els.map((el) => ({
          name: getComputedStyle(el).animationName,
          i: Number(el.style.getPropertyValue("--i")),
          delay: getComputedStyle(el).animationDelay,
        })),
      );
      // Three fixtures, then the two tiles.
      expect(rows.map((r) => r.i)).toEqual([0, 1, 2, 3, 4]);
      for (const row of rows) expect(row.name).toBe("rise-in");
      expect(rows.map((r) => r.delay)).toEqual(["0s", "0.06s", "0.12s", "0.18s", "0.24s"]);
    });

    test("a finger pressing a fixture tilts and presses it; a cancel lets go; a tap still opens PLAY", async ({
      page,
    }) => {
      await seed(page, ARTBOARD);
      await page.goto("/arena");
      await waitForHydration(page);
      const cricket = fixture(page, "CRICKET GROUND");
      await expect(cricket.getByRole("link", { name: "REMATCH" })).toBeVisible();
      await risen(page);
      const box = (await cricket.boundingBox())!;
      const transform = () => cricket.evaluate((el) => getComputedStyle(el).transform);
      expect(["none", "matrix(1, 0, 0, 1, 0, 0)"]).toContain(await transform());

      const where = { x: box.x + box.width * 0.85, y: box.y + box.height * 0.3 };
      await touchEvent(cricket, "pointerdown", where);
      await touchEvent(cricket, "pointermove", { x: where.x - 20, y: where.y + 6 });
      await expect(cricket).toHaveAttribute("data-pressed", "");
      await expect.poll(transform).not.toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
      await expect
        .poll(() => cricket.evaluate((el) => getComputedStyle(el.parentElement!).scale))
        .toBe("0.98");

      await touchEvent(cricket, "pointercancel", where);
      await expect(cricket).not.toHaveAttribute("data-pressed", "");
      await expect.poll(transform).toMatch(/^(none|matrix\(1, 0, 0, 1, 0, 0\))$/);
      await expect(page).toHaveURL("/arena");

      await fixture(page, "CENTRE COURT").getByRole("link", { name: "PLAY", exact: true }).tap();
      await expect(page).toHaveURL("/arena/tennis");
    });

    test.describe("reduced motion", () => {
      test.use({ reducedMotion: "reduce" });
      test("nothing rises and a press moves nothing", async ({ page }) => {
        await seed(page, ARTBOARD);
        await page.goto("/arena");
        await waitForHydration(page);
        const cricket = fixture(page, "CRICKET GROUND");
        await expect(cricket.getByRole("link", { name: "REMATCH" })).toBeVisible();
        const names = await risers(page).evaluateAll((els) =>
          els.map((el) => getComputedStyle(el).animationName),
        );
        expect(new Set(names)).toEqual(new Set(["none"]));
        const box = (await cricket.boundingBox())!;
        const at = { x: box.x + box.width * 0.85, y: box.y + box.height * 0.3 };
        await touchEvent(cricket, "pointerdown", at);
        await touchEvent(cricket, "pointermove", { x: at.x - 20, y: at.y + 6 });
        await page.waitForTimeout(500);
        expect(await cricket.evaluate((el) => getComputedStyle(el).transform)).toBe("none");
        await expect(cricket).not.toHaveAttribute("data-pressed", "");
      });
    });
  });

  test("the Hub holds at every size below the stage (Review Focus 5)", async ({ page }) => {
    await seed(page, ARTBOARD);
    await page.goto("/arena");
    await waitForHydration(page);
    for (const [width, height] of [
      [1199, 800],
      [1024, 768],
      [768, 1024],
      [390, 844],
      [375, 667],
      [360, 640],
    ] as const) {
      await page.setViewportSize({ width, height });
      const at = `at ${width}x${height}`;
      await expect(page.getByRole("heading", { level: 1 }), `h1 ${at}`).toHaveCount(1);
      await expect(
        fixture(page, "CRICKET GROUND").getByRole("link", { name: "REMATCH" }),
      ).toBeVisible();
      await expect
        .poll(() => horizontalOverflow(page), { message: `overflow ${at}` })
        .toBeLessThanOrEqual(0);
      const small = await page.evaluate(() =>
        [
          ...document.querySelectorAll<HTMLElement>(
            "[data-hub-column] *, nav[data-bottom-actions] *",
          ),
        ]
          .filter((el) => el.getClientRects().length > 0 && el.children.length === 0)
          .filter((el) => getComputedStyle(el).fontFamily.includes("JetBrains Mono"))
          .map((el) => ({ text: el.textContent, size: parseFloat(getComputedStyle(el).fontSize) }))
          .filter((m) => m.size < 10.99),
      );
      expect(small, `mono under 11px ${at}`).toEqual([]);
      await risen(page);
      await page.evaluate(() => window.scrollTo(0, document.documentElement.scrollHeight));
      const last = (await column(page).locator("a:visible").last().boundingBox())!;
      const bar = tabBar(page);
      if (width < 768) {
        const barBox = (await bar.boundingBox())!;
        expect(last.y + last.height, `last tile above the tab bar ${at}`).toBeLessThanOrEqual(
          barBox.y,
        );
      } else {
        await expect(bar, `no tab bar ${at}`).toBeHidden();
      }
      // The column is centred and at most 640px wide.
      const row = (await fixture(page, "CRICKET GROUND").boundingBox())!;
      expect(row.width).toBeLessThanOrEqual(640);
      expect(Math.abs(row.x + row.width / 2 - width / 2)).toBeLessThan(2);
    }
  });
});

/** The drawer, the same on a phone (mobile project, 390x844) and on a tablet (desktop project, 1024x768). */
for (const [project, size] of [
  ["mobile", { width: 390, height: 844 }],
  ["desktop", { width: 1024, height: 768 }],
] as const) {
  test.describe(`index drawer at ${size.width}x${size.height}`, () => {
    test.use({ viewport: size });
    test.beforeEach(async ({ page }, testInfo) => {
      test.skip(testInfo.project.name !== project, `driven from the ${project} project`);
      await seed(page, ARTBOARD);
      await page.goto("/arena");
      await waitForHydration(page);
      await expect(indexButton(page)).toBeVisible();
    });

    test("INDEX opens a dialog with focus inside it, and Tab never leaves it", async ({ page }) => {
      await expect(indexButton(page)).toHaveAttribute("aria-haspopup", "dialog");
      await indexButton(page).click();
      await expect(drawer(page)).toBeVisible();
      await expect(indexButton(page)).toHaveAttribute("aria-expanded", "true");
      expect(await page.evaluate(() => !!document.activeElement?.closest("dialog"))).toBe(true);
      for (let i = 0; i < 30; i++) {
        await page.keyboard.press("Tab");
        // Past the last link Tab goes round through the browser's own controls: the page itself is inert, so
        // the document body is as far out as it gets.
        const inside = await page.evaluate(
          () =>
            document.activeElement === document.body || !!document.activeElement?.closest("dialog"),
        );
        expect(inside, `tab ${i}`).toBe(true);
      }
      // The same rail as the stage's, with the record chip leading.
      await expect(drawer(page).getByText(ui.record.yours)).toBeVisible();
      await expect(drawer(page).getByRole("link", { name: /Player Card/ })).toBeVisible();
    });

    test("Escape, the close button and a tap outside each close it, focus back on INDEX", async ({
      page,
    }) => {
      await indexButton(page).click();
      await expect(drawer(page)).toBeVisible();
      await page.keyboard.press("Escape");
      await expect(drawer(page)).toBeHidden();
      await expect(indexButton(page)).toBeFocused();

      await indexButton(page).click();
      await drawer(page).getByRole("button", { name: hub.drawer.close }).click();
      await expect(drawer(page)).toBeHidden();
      await expect(indexButton(page)).toBeFocused();

      await indexButton(page).click();
      await expect(drawer(page)).toBeVisible();
      await page.mouse.click(size.width - 6, 300);
      await expect(drawer(page)).toBeHidden();
      await expect(indexButton(page)).toBeFocused();
    });

    test("the page behind does not scroll while it is open", async ({ page }) => {
      await page.setViewportSize({ width: size.width, height: 480 });
      expect(
        await page.evaluate(() => document.scrollingElement!.scrollHeight - innerHeight),
        "the page scrolls when short enough",
      ).toBeGreaterThan(40);
      await indexButton(page).click();
      await expect(drawer(page)).toBeVisible();
      await page.mouse.move(size.width - 20, 200);
      await page.mouse.wheel(0, 300);
      await page.waitForTimeout(300);
      expect(await page.evaluate(() => document.scrollingElement!.scrollTop)).toBe(0);
    });

    test("a drawer left open when the window grows into the stage stays shut when it shrinks back", async ({
      page,
    }) => {
      await indexButton(page).click();
      await expect(drawer(page)).toBeVisible();
      await page.setViewportSize({ width: 1300, height: size.height });
      // The page has seen the wide window (it shut the dialog itself), not only hidden it: a resize back at once
      // would otherwise be one the page never saw.
      await expect(page.locator("dialog[data-drawer]")).not.toHaveAttribute("open", "");
      await expect(drawer(page)).toBeHidden();
      await page.setViewportSize(size);
      await expect(indexButton(page)).toBeVisible();
      await page.waitForTimeout(400);
      await expect(drawer(page)).toBeHidden();
      await expect(indexButton(page)).toHaveAttribute("aria-expanded", "false");
    });

    test("choosing Player Card goes there and the drawer is gone", async ({ page }) => {
      await indexButton(page).click();
      await drawer(page)
        .getByRole("link", { name: /Player Card/ })
        .click();
      await expect(page).toHaveURL("/card");
      await expect(page.getByRole("dialog")).toHaveCount(0);
    });
  });
}

test.describe("tablet hub (H1)", () => {
  test.beforeEach(({ page: _page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "driven from the desktop project");
  });

  for (const [width, height] of [
    [1024, 768],
    [768, 1024],
  ] as const) {
    test(`${width}x${height}: the column, no stage, no tab bar, a centred column of at most 640px`, async ({
      page,
    }) => {
      await page.setViewportSize({ width, height });
      await seed(page, ARTBOARD);
      await page.goto("/arena");
      await waitForHydration(page);
      await expect(column(page)).toBeVisible();
      await expect(page.locator("[data-stage]")).toBeHidden();
      await expect(page.getByRole("heading", { level: 1 })).toHaveCount(1);
      await expect(tabBar(page)).toBeHidden();
      await expect(
        fixture(page, "CRICKET GROUND").getByRole("link", { name: "REMATCH" }),
      ).toBeVisible();
      for (const name of ["CRICKET GROUND", "CENTRE COURT", "BADMINTON HALL"]) {
        const box = (await fixture(page, name).boundingBox())!;
        expect(box.width, name).toBeLessThanOrEqual(640);
        expect(Math.abs(box.x + box.width / 2 - width / 2), name).toBeLessThan(2);
      }
      expect(await horizontalOverflow(page)).toBeLessThanOrEqual(0);
    });
  }
});
