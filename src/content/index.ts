import raw from "./content.json";
import { parseContent } from "./schema";

/** Validated content. Importing this module throws (and fails the build) if content.json is invalid. */
export const content = parseContent(raw);

export { ContentError, parseContent } from "./schema";
export type { Content, SkillLevel } from "./schema";
export * from "./format";
export * from "./selectors";
export { ui } from "./ui-copy";
export type { UiCopy } from "./ui-copy";
