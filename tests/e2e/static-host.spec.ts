import { existsSync, readFileSync, statSync } from "node:fs";
import { createServer, type Server } from "node:http";
import type { AddressInfo } from "node:net";
import { extname, join, normalize } from "node:path";
import { expect, test } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { ROUTES } from "../../src/shell/routes";
import { waitForHydration } from "./support/contentPage";

/*
 * The planned host (Cloudflare, wrangler.jsonc) is a plain static host: a real file, or a folder's index.html, or else
 * `404.html` with status 404, and no rewrite to the SPA fallback. The other specs run against sirv with
 * `--single`, which never serves 404.html for an unknown path, so this file serves build/client the way the host does.
 */

const ROOT = join(process.cwd(), "build/client");
const TYPES: Record<string, string> = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".css": "text/css; charset=utf-8",
  ".woff2": "font/woff2",
  ".json": "application/json; charset=utf-8",
  ".png": "image/png",
  ".xml": "application/xml; charset=utf-8",
  ".txt": "text/plain; charset=utf-8",
};

/** The file a static host sends for `pathname`, and with what status. */
function fileFor(pathname: string): { file: string; status: number } {
  let path: string;
  try {
    path = normalize(decodeURIComponent(pathname));
  } catch {
    return { file: join(ROOT, "404.html"), status: 404 };
  }
  const found = join(ROOT, path);
  if (found.startsWith(ROOT)) {
    if (existsSync(found) && statSync(found).isFile()) return { file: found, status: 200 };
    const index = join(found, "index.html");
    if (existsSync(index)) return { file: index, status: 200 };
  }
  return { file: join(ROOT, "404.html"), status: 404 };
}

let server: Server;
let base = "";

test.beforeAll(async () => {
  server = createServer((req, res) => {
    const { file, status } = fileFor(new URL(req.url ?? "/", "http://host").pathname);
    res.writeHead(status, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
    res.end(readFileSync(file));
  });
  await new Promise<void>((done) => server.listen(0, "127.0.0.1", done));
  base = `http://127.0.0.1:${(server.address() as AddressInfo).port}`;
});

test.afterAll(async () => {
  await new Promise((done) => server.close(done));
});

const PATHS = ["/arena/nope", "/nope?x=1", "/arena/nope/deeper"];

for (const path of PATHS) {
  test(`${path}: a real 404 with one OUT OF BOUNDS page that names the path`, async ({ page }) => {
    const problems: string[] = [];
    page.on("console", (m) => {
      // The browser reports the 404 document itself as a failed resource: that is the status under test, not a problem.
      const isDocument =
        new URL(m.location().url || "http://none").pathname === new URL(path, base).pathname;
      if ((m.type() === "error" || m.type() === "warning") && !isDocument) {
        problems.push(`${m.text()} (${m.location().url})`);
      }
    });
    page.on("pageerror", (e) => problems.push(e.message));

    const response = await page.goto(base + path);
    expect(response?.status()).toBe(404);
    await waitForHydration(page);

    const tried = page.getByRole("main").getByText(ui.notFound.tried);
    await expect(tried).toContainText(new URL(path, base).pathname);
    await expect(page.locator("main")).toHaveCount(1);
    const h1 = page.getByRole("heading", { level: 1 });
    await expect(h1).toHaveCount(1);
    await expect(h1).toBeVisible();
    await expect(h1).toHaveText(ui.routes.notFound.heading, { ignoreCase: true });
    await expect(page).toHaveTitle(ui.routes.notFound.title);
    await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(1);
    expect(problems, "console errors and warnings").toEqual([]);
  });
}

test("a real page is a 200 on the same host (the emulation is not a catch-all 404)", async ({
  page,
}) => {
  const response = await page.goto(base + ROUTES.scout);
  expect(response?.status()).toBe(200);
  await expect(page.locator("main")).toHaveCount(1);
});

test("without JavaScript an unknown address still shows OUT OF BOUNDS and the way back", async ({
  browser,
}) => {
  const context = await browser.newContext({ javaScriptEnabled: false });
  const page = await context.newPage();
  const response = await page.goto(`${base}/arena/nope`);
  expect(response?.status()).toBe(404);
  const h1 = page.getByRole("heading", { level: 1 });
  await expect(h1).toBeVisible();
  await expect(h1).toHaveText(ui.routes.notFound.heading, { ignoreCase: true });
  await expect(page).toHaveTitle(ui.routes.notFound.title);
  await expect(page.locator('meta[name="robots"][content="noindex"]')).toHaveCount(1);
  await expect(page.locator("main")).toHaveCount(1);
  const back = page.getByRole("link", { name: ui.notFound.hub });
  await expect(back).toBeVisible();
  await expect(back).toHaveAttribute("href", ROUTES.arena);
  await context.close();
});
