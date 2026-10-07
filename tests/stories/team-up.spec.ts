import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "../support/a11y";
import { expectMatchesArtboard } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test("Team Up layout matches the Team-Up artboard (artboard copy)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Team-Up is a 1440×900 board");
  await page.goto(story("features-teamup--artboard-parity"));
  await page.locator("#storybook-root > *").first().waitFor();
  // No mask: the page has no commentary on arrival, and the fixture draws the board's own words.
  const ratio = await expectMatchesArtboard(page, "Team-Up", { maxDiffRatio: 0.02 });
  expect(ratio).toBeLessThanOrEqual(0.02);
});

// The states are reached by each story's own play function. The shared a11y gate may look before that has run,
// so each state waits for what it shows, and then runs axe.
const STATES: {
  id: string;
  name: string;
  ready: (page: import("@playwright/test").Page) => Promise<unknown>;
}[] = [
  {
    id: "features-teamup--errors",
    name: "Errors",
    ready: (page) => page.getByText("Tell me who's challenging.").waitFor(),
  },
  {
    id: "features-teamup--sending",
    name: "Sending",
    ready: (page) => page.getByRole("button", { name: "SENDING…" }).waitFor(),
  },
  {
    id: "features-teamup--success",
    name: "Success",
    ready: (page) => page.getByRole("heading", { level: 2, name: "CHALLENGE RECEIVED" }).waitFor(),
  },
  {
    id: "features-teamup--send-error",
    name: "SendError",
    ready: (page) =>
      page.getByRole("alert").filter({ hasText: "That didn't go through." }).waitFor(),
  },
];

for (const state of STATES) {
  test(`Team Up ${state.name} state is axe-clean`, async ({ page }) => {
    await page.goto(story(state.id));
    await state.ready(page);
    await page.evaluate(() => document.fonts.ready);
    await expectNoA11yViolations(page);
  });
}

test("SendError keeps what the visitor typed and offers the email address", async ({ page }) => {
  await page.goto(story("features-teamup--send-error"));
  await page.getByRole("alert").filter({ hasText: "That didn't go through." }).waitFor();
  await expect(page.getByLabel("YOUR NAME", { exact: true })).toHaveValue("Sam Visitor");
  await expect(page.getByLabel("THE CHALLENGE")).toHaveValue(
    "We are hiring a full-stack engineer.",
  );
  await expect(page.getByRole("link", { name: /OR EMAIL/ })).toBeVisible();
});
