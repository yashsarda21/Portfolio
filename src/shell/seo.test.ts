import { describe, expect, it } from "vitest";
import { ROUTES } from "./routes";
import { absoluteUrl, buildRobots, buildSitemap, PUBLIC_PATHS } from "./seo";

const BASE = "https://a.example";

describe("sitemap and robots", () => {
  it("PUBLIC_PATHS is every route but OUT OF BOUNDS", () => {
    expect(PUBLIC_PATHS).toHaveLength(Object.keys(ROUTES).length - 1);
    expect(PUBLIC_PATHS).not.toContain(ROUTES.notFound);
  });

  it("the sitemap lists one absolute <loc> per public path, and not the retired pages", () => {
    const xml = buildSitemap(PUBLIC_PATHS, BASE);
    expect(xml).toContain('<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">');
    expect(xml.match(/<loc>/g)).toHaveLength(PUBLIC_PATHS.length);
    expect(xml).toContain(`<loc>${BASE}/arena/full-time</loc>`);
    expect(xml).toContain(`<loc>${BASE}/</loc>`);
    for (const gone of ["/404", "giant-killer", "locker-room"]) expect(xml).not.toContain(gone);
  });

  it("with no production address the sitemap is an empty, valid urlset", () => {
    expect(buildSitemap(PUBLIC_PATHS, null).trim()).toBe(
      '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>',
    );
  });

  it("robots allows everything, and names the sitemap only with an address", () => {
    expect(buildRobots(BASE)).toBe(`User-agent: *\nAllow: /\nSitemap: ${BASE}/sitemap.xml\n`);
    expect(buildRobots(null)).toBe("User-agent: *\nAllow: /\n");
  });

  it("absoluteUrl joins the base and the path, or is null without a base", () => {
    expect(absoluteUrl("/og.png", BASE)).toBe("https://a.example/og.png");
    expect(absoluteUrl("/og.png", null)).toBeNull();
  });
});
