import { content, ui, type RouteKey } from "@/content";
import { siteUrl } from "./config";
import { ROUTES } from "./routes";
import { absoluteUrl } from "./seo";

interface PageMetaOptions {
  /** Open Graph type (default "website"). */
  type?: "website" | "profile";
  /** Structured data for search engines, rendered as a JSON-LD <script>. */
  jsonLd?: Record<string, unknown>;
  /** Ask search engines not to list the page (OUT OF BOUNDS). */
  noindex?: boolean;
}

/** The share image (public/og.png): 1200x630. */
const SHARE_IMAGE = { path: "/og.png", width: 1200, height: 630 } as const;

/** The share image's alt text: who and what the picture shows, from the content and the brand (P4). */
const shareAlt = () => `${content.player.name}, ${content.player.title} — ${ui.brand.siteName}`;

/** <title>, description, Open Graph and Twitter tags for a route (spec §4.5). */
export function pageMeta(key: RouteKey, opts: PageMetaOptions = {}, base: string | null = siteUrl) {
  const r = ui.routes[key];
  const tags: Array<Record<string, unknown>> = [
    { title: r.title },
    { name: "description", content: r.description },
    { property: "og:title", content: r.title },
    { property: "og:description", content: r.description },
    { property: "og:type", content: opts.type ?? "website" },
    { property: "og:site_name", content: ui.brand.siteName },
    { name: "twitter:card", content: base ? "summary_large_image" : "summary" },
  ];
  // A page that asks not to be listed (OUT OF BOUNDS answers every unknown path) names no canonical address.
  const pageUrl = opts.noindex ? null : absoluteUrl(ROUTES[key], base);
  const imageUrl = absoluteUrl(SHARE_IMAGE.path, base);
  if (pageUrl) {
    tags.push({ tagName: "link", rel: "canonical", href: pageUrl });
    tags.push({ property: "og:url", content: pageUrl });
  }
  if (imageUrl) {
    tags.push(
      { property: "og:image", content: imageUrl },
      { property: "og:image:width", content: String(SHARE_IMAGE.width) },
      { property: "og:image:height", content: String(SHARE_IMAGE.height) },
      { property: "og:image:alt", content: shareAlt() },
    );
  }
  if (opts.noindex) tags.push({ name: "robots", content: "noindex" });
  if (opts.jsonLd) tags.push({ "script:ld+json": opts.jsonLd });
  return tags;
}
