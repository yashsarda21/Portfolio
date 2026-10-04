import { ui, type RouteKey } from "@/content";

interface PageMetaOptions {
  /** Open Graph type (default "website"). */
  type?: "website" | "profile";
  /** Structured data for search engines, rendered as a JSON-LD <script>. */
  jsonLd?: Record<string, unknown>;
}

/** <title>, description, Open Graph and Twitter tags for a route (spec §4.5). */
export function pageMeta(key: RouteKey, opts: PageMetaOptions = {}) {
  const r = ui.routes[key];
  const tags: Array<Record<string, unknown>> = [
    { title: r.title },
    { name: "description", content: r.description },
    { property: "og:title", content: r.title },
    { property: "og:description", content: r.description },
    { property: "og:type", content: opts.type ?? "website" },
    { property: "og:site_name", content: ui.brand.siteName },
    { name: "twitter:card", content: "summary" },
  ];
  if (opts.jsonLd) tags.push({ "script:ld+json": opts.jsonLd });
  return tags;
}
