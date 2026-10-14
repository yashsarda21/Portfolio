import { expect, test } from "@playwright/test";
import { ROUTES } from "../../src/shell/routes";

// The e2e web server builds with this address (playwright.config.ts).
const BASE = "https://arena.example";

test("sitemap.xml lists the public pages and not the retired or error ones", async ({
  request,
}) => {
  const res = await request.get("/sitemap.xml");
  expect(res.status()).toBe(200);
  const xml = await res.text();
  expect(xml).toContain("<urlset");
  expect(xml).toContain(`<loc>${BASE}${ROUTES.fullTime}</loc>`);
  expect(xml).toContain(`<loc>${BASE}/</loc>`);
  for (const gone of ["/404", "giant-killer", "locker-room"]) expect(xml).not.toContain(gone);
});

test("robots.txt allows crawling and names the sitemap", async ({ request }) => {
  const res = await request.get("/robots.txt");
  expect(res.status()).toBe(200);
  const text = await res.text();
  expect(text).toContain("User-agent: *");
  expect(text).toContain(`Sitemap: ${BASE}/sitemap.xml`);
});

test("a page carries its canonical address and share tags", async ({ page }) => {
  await page.goto(ROUTES.cricket);
  await expect(page.locator('link[rel="canonical"]')).toHaveAttribute(
    "href",
    `${BASE}/arena/cricket`,
  );
  await expect(page.locator('meta[property="og:url"]')).toHaveAttribute(
    "content",
    `${BASE}/arena/cricket`,
  );
  await expect(page.locator('meta[property="og:image"]')).toHaveAttribute(
    "content",
    `${BASE}/og.png`,
  );
  await expect(page.locator('meta[name="twitter:card"]')).toHaveAttribute(
    "content",
    "summary_large_image",
  );
});

test("the share image is served as a PNG", async ({ request }) => {
  const res = await request.get("/og.png");
  expect(res.status()).toBe(200);
  expect(res.headers()["content-type"]).toContain("image/png");
});
