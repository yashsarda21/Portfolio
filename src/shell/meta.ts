import { ui, type RouteKey } from "@/content";

/** <title> and description for a route (spec §4.5). */
export function pageMeta(key: RouteKey) {
  const r = ui.routes[key];
  return [{ title: r.title }, { name: "description", content: r.description }];
}
