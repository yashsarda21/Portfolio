import { ROUTES } from "./routes";
import { siteUrl } from "./config";

/** `path` on the production address, or null when there is none (so no tag is better than a wrong one). */
export function absoluteUrl(path: string, base: string | null = siteUrl): string | null {
  return base ? `${base}${path}` : null;
}

/** Every page a search engine may list: the site map without OUT OF BOUNDS. */
export const PUBLIC_PATHS: readonly string[] = Object.entries(ROUTES)
  .filter(([key]) => key !== "notFound")
  .map(([, path]) => path);

const URLSET_OPEN = '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"';

/** sitemap.xml: one <loc> per path, or a valid empty <urlset/> while there is no production address. */
export function buildSitemap(paths: readonly string[], base: string | null): string {
  if (!base) return `${URLSET_OPEN}/>\n`;
  const urls = paths.map((path) => `  <url><loc>${base}${path}</loc></url>`).join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n${URLSET_OPEN}>\n${urls}\n</urlset>\n`;
}

/** robots.txt: everything may be crawled; the Sitemap line only with a production address. */
export function buildRobots(base: string | null): string {
  return `User-agent: *\nAllow: /\n${base ? `Sitemap: ${base}/sitemap.xml\n` : ""}`;
}
