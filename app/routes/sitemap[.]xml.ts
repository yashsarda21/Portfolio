import { siteUrl } from "@/shell/config";
import { buildSitemap, PUBLIC_PATHS } from "@/shell/seo";

/** Prerendered to build/client/sitemap.xml (empty while there is no VITE_SITE_URL). */
export function loader() {
  return new Response(buildSitemap(PUBLIC_PATHS, siteUrl), {
    headers: { "Content-Type": "application/xml" },
  });
}
