import { siteUrl } from "@/shell/config";
import { buildRobots } from "@/shell/seo";

/** Prerendered to build/client/robots.txt. */
export function loader() {
  return new Response(buildRobots(siteUrl), { headers: { "Content-Type": "text/plain" } });
}
