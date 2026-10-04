import raw from "./content.json";
import type { Content } from "./schema";

/**
 * Resume content. Validated at build time by the `arena-content-check` Vite plugin
 * and by schema.test.ts, so no runtime parsing (and no Zod) ships to visitors.
 */
export const content = raw as unknown as Content;

export type { Content, SkillLevel } from "./schema";
export * from "./format";
export * from "./selectors";
export * from "./seo";
export { ui } from "./ui-copy";
export type { RouteKey, UiCopy } from "./ui-copy";
