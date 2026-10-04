import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

const TAGS = ["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"];

/**
 * A silent screen recording (MediaSlot marks it `data-silent`) is video-only: WCAG 1.2.2 captions do not
 * apply to it. Its text alternative (WCAG 1.2.1) is the project line and problem / approach / result the
 * page already shows, which the video points at with aria-describedby. So axe's `video-caption` rule is
 * switched off for these videos, and only for these: they still get every other rule, and every other
 * video (one with sound) must carry a captions track.
 */
const SILENT_VIDEO = "video[data-silent]";

/** Fails the test with a readable list if axe finds any WCAG A/AA violation. */
export async function expectNoA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page }).withTags(TAGS).exclude(SILENT_VIDEO).analyze();
  const silent =
    (await page.locator(SILENT_VIDEO).count()) > 0
      ? await new AxeBuilder({ page })
          .withTags(TAGS)
          .include(SILENT_VIDEO)
          .disableRules(["video-caption"])
          .analyze()
      : null;
  const violations = [...results.violations, ...(silent?.violations ?? [])];
  const incomplete = [...results.incomplete, ...(silent?.incomplete ?? [])];
  // axe cannot resolve text on translucent glass and files it under "incomplete". That is not a
  // failure (src/design-system/tokens/contrast.test.ts enforces those pairs); log it so it stays visible.
  const unverified = incomplete
    .filter((v) => v.id === "color-contrast")
    .reduce((count, v) => count + v.nodes.length, 0);
  if (unverified > 0) {
    console.warn(`axe: ${unverified} color-contrast node(s) incomplete (not machine-verified)`);
  }
  const summary = violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
  expect(summary, "accessibility violations").toEqual([]);
}
