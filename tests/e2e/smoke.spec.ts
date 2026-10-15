import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { expectNoA11yViolations } from "../support/a11y";
import { gotoLanding } from "./support/startScreen";

test("home page renders its heading", async ({ page }) => {
  await gotoLanding(page);
  // The name is in the page from the first frame, at opacity 0 (readable and focusable), and fades in at its turn in the boot (3 s).
  await expect(page.getByRole("heading", { level: 1, name: ui.routes.home.heading })).toBeVisible({
    timeout: 10_000,
  });
});

test("home page has no accessibility violations", async ({ page }) => {
  await gotoLanding(page);
  // Axe judges the board at rest: wait for the boot to end.
  await page.evaluate(async () => {
    const group = document.querySelector("a[href='/intro']")?.parentElement?.parentElement;
    await Promise.all((group?.getAnimations() ?? []).map((a) => a.finished));
  });
  await expectNoA11yViolations(page);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("renders without JavaScript", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: ui.routes.home.heading })).toBeVisible(
      { timeout: 10_000 },
    );
  });
});

// GSAP must never sit in the first-load bundle (spec §9.1). Deterministic check on the built output: walk the
// static module graph a prerendered page loads (its <link rel="modulepreload"> and module script tags, then each
// chunk's static imports) and assert it never reaches a chunk that holds GSAP. The GSAP chunks are found by
// content (GSAP's licence banner is stripped, so by its `autoSleep` default), not by file name.
test.describe("first load", () => {
  test.beforeEach(({ browserName }, testInfo) => {
    void browserName; // Playwright needs a destructured fixture here
    test.skip(testInfo.project.name !== "desktop", "output check, once");
  });

  const client = join(process.cwd(), "build/client");
  const assets = join(client, "assets");
  const read = (file: string) => readFileSync(join(assets, file), "utf8");
  const gsapChunks = () =>
    readdirSync(assets).filter((f) => f.endsWith(".js") && read(f).includes("autoSleep:120"));

  function firstLoadGraph(page: string): Set<string> {
    const html = readFileSync(join(client, page, "index.html"), "utf8");
    const seen = new Set<string>();
    const queue = [...html.matchAll(/href="\/assets\/([^"]+\.js)"/g)].map((m) => m[1]!);
    queue.push(
      ...[...html.matchAll(/(?:import|from)\s*\(?\s*"\/assets\/([^"]+\.js)"/g)].map((m) => m[1]!),
    );
    while (queue.length) {
      const file = queue.pop()!;
      if (seen.has(file)) continue;
      seen.add(file);
      // Static imports only: `from"./x.js"` and bare `import"./x.js"` (a dynamic `import(...)` is not first load).
      for (const m of read(file).matchAll(/(?:from|import)\s*[`"']\.\/([^`"']+\.js)[`"']/g))
        queue.push(m[1]!);
    }
    return seen;
  }

  test("the GSAP chunk exists and is found by content", () => {
    expect(gsapChunks().length).toBeGreaterThan(0);
  });

  for (const page of ["", "scout", "intro"]) {
    test(`/${page} first-load chunks do not contain gsap`, () => {
      const graph = firstLoadGraph(page);
      expect(graph.size).toBeGreaterThan(3);
      expect([...graph].filter((f) => gsapChunks().includes(f))).toEqual([]);
    });
  }
});
