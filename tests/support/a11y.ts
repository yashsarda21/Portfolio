import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Fails the test with a readable list if axe finds any WCAG A/AA violation. */
export async function expectNoA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  // axe cannot resolve text on translucent glass and files it under "incomplete". That is not a
  // failure (src/design-system/tokens/contrast.test.ts enforces those pairs); log it so it stays visible.
  const unverified = results.incomplete
    .filter((v) => v.id === "color-contrast")
    .reduce((count, v) => count + v.nodes.length, 0);
  if (unverified > 0) {
    console.warn(`axe: ${unverified} color-contrast node(s) incomplete (not machine-verified)`);
  }
  const summary = results.violations.map(
    (v) =>
      `${v.id} (${v.impact}): ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
  expect(summary, "accessibility violations").toEqual([]);
}
