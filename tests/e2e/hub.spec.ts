import { expect, test, type Page } from "@playwright/test";
import { join } from "node:path";
import { ui } from "../../src/content/ui-copy";
import { expectNoA11yViolations } from "../support/a11y";
import { expectMatchesArtboard } from "../support/visual";
import { waitForHydration } from "./support/contentPage";

const hub = ui.hub;

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
  record: { yash: 1, you: 0 },
  achievements: [],
  lockerRoomUnlocked: false,
  teamUpPrefill: null,
};
/** After a win: the Locker Room is listed (the rail's longest state). */
const UNLOCKED = {
  ...ARTBOARD,
  venuesPlayed: ["cricket", "tennis", "badminton"],
  lastScores: { cricket: "14* NOT OUT", tennis: "WON 2-1", badminton: "WON 15-9" },
  sectionsSeen: ["career", "highlights", "attributes", "trophies", "card", "teamUp", "scout"],
  record: { yash: 2, you: 1 },
  achievements: ["giant-killer"],
  lockerRoomUnlocked: true,
};

const rail = (page: Page) => page.locator("aside");
const card = (page: Page, name: string) => page.getByRole("article").filter({ hasText: name });
const playLinks = (page: Page) =>
  page.locator("main article").getByRole("link", { name: /^PLAY$/ });
/** The record read-out in the top row. */
const recordChip = (page: Page) => page.getByText(ui.record.yours, { exact: true }).locator("..");
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
    test.skip(testInfo.project.name !== "desktop", "the stage is a desktop page (Task 6: column)");
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
    await expect(page.getByText("0 OF 3 VENUES")).toBeVisible();
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
        await expect(page.getByText("0 OF 3 VENUES")).toBeVisible();
        await expect(playLinks(page)).toHaveCount(3);
        await expect(page.getByText("YASH 0 · YOU 0")).toBeVisible();
        expect(errors).toEqual([]);
      });
    }

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
      await expect(page.getByText("0 OF 3 VENUES")).toBeVisible();
      await expect(playLinks(page)).toHaveCount(3);
      expect(errors).toEqual([]);
    });
  });

  test.describe("first paint of a returning visitor (H5)", () => {
    test("with scripts held back the record parts stay hidden, and the CSS shows them at 3 s", async ({
      page,
    }) => {
      await seed(page, ARTBOARD);
      await page.route("**/*.js", (route) => route.abort());
      await page.goto("/arena", { waitUntil: "domcontentloaded" });
      const pending = page.locator("[data-record-pending]");
      expect(await pending.count()).toBeGreaterThan(0);
      const visibilities = () =>
        pending.evaluateAll((els) => els.map((el) => getComputedStyle(el).visibility));
      expect(new Set(await visibilities())).toEqual(new Set(["hidden"]));
      // The h1, the facilities and the HUD brand are not record-bound: they are there from the first frame.
      await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
      await page.waitForTimeout(3200);
      expect(new Set(await visibilities())).toEqual(new Set(["visible"]));
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
        await expect(page.getByText("0 OF 3 VENUES")).toBeVisible();
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
    test("at 1280x720 the rail tags and the card meta render at 11px or more", async ({ page }) => {
      await seed(page, ARTBOARD);
      await page.setViewportSize({ width: 1280, height: 720 });
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
        const meta = [...document.querySelectorAll("main article")].flatMap((a) =>
          [...a.querySelectorAll("div.justify-between > span")].map(size),
        );
        return { scale, tags, meta };
      });
      expect(sizes.scale).toBeCloseTo(0.8, 2);
      expect(sizes.tags.length).toBeGreaterThanOrEqual(8);
      expect(sizes.meta).toHaveLength(6);
      for (const s of [...sizes.tags, ...sizes.meta]) expect(s).toBeGreaterThanOrEqual(11 - 0.01);
    });

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
            const out = [...document.querySelectorAll("main article")].flatMap((a, i) => [
              measure(`card ${i + 1} reveals`, leaf("REVEALS", a)),
              measure(`card ${i + 1} meta row`, leaf("VENUE", a).parentElement!),
            ]);
            const aside = document.querySelector("aside")!;
            for (const text of labels) out.push(measure(text, leaf(text, aside)));
            return out;
          },
          { labels: [hub.matchday.label, hub.index.title, hub.achievements.label] },
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
        await seed(page, UNLOCKED);
        await page.setViewportSize({ width, height });
        await page.goto("/arena");
        await waitForHydration(page);
        await expect(rail(page).getByRole("link", { name: /Locker Room/ })).toBeVisible();
        const result = await page.evaluate(() => {
          const stage = document.querySelector("[data-stage]")!.getBoundingClientRect();
          // The meta rows: the venue number and the status, side by side.
          const rows = [...document.querySelectorAll("main article div.justify-between")].map(
            (row) => {
              const tallest = Math.max(
                ...[...row.children].map((c) => parseFloat(getComputedStyle(c).fontSize)),
              );
              return { height: row.getBoundingClientRect().height, tallest };
            },
          );
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
      await page.mouse.up();
      await expect(plate(page)).toHaveAttribute("data-orbit", "rest");
      await page.waitForTimeout(500);
      await expect(page).toHaveURL("/arena");
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

      /** A touch pointer event on the element (`page.touchscreen` can only tap). */
      const touch = (page: Page, name: string, type: string, dx = 0) =>
        art(page, name).dispatchEvent(type, {
          pointerType: "touch",
          pointerId: 7,
          isPrimary: true,
          buttons: type === "pointerup" ? 0 : 1,
          clientX: 300 + dx,
          clientY: 400,
          bubbles: true,
        });

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
