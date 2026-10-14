import { test } from "@playwright/test";
import { expectNoA11yViolations } from "../support/a11y";
import { waitForFiniteAnimations } from "../support/animations";
import { waitForHydration } from "./support/contentPage";
import { ALL_PATHS, seedFullMatchday } from "./support/matchday";

// P8: axe over every page, on both screens (the desktop / mobile projects), fresh and after a full matchday.
for (const state of ["fresh", "full matchday"] as const) {
  test.describe(`axe sweep, ${state}`, () => {
    for (const { name, path } of ALL_PATHS) {
      test(`${name} (${path}) has no violations`, async ({ page }) => {
        if (state === "full matchday") await seedFullMatchday(page);
        await page.goto(path);
        await waitForHydration(page);
        // Axe judges a page at rest: the boot, the intro and Full Time play long entrances.
        await waitForFiniteAnimations(page);
        await expectNoA11yViolations(page);
      });
    }
  });
}
