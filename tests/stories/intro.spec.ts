import { expect, test } from "@playwright/test";
import { expectMatchesArtboard, type Rect } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

/** The beams the artboard draws offset from the lamps and ours start under them (D-1); arithmetic in tests/e2e/intro.spec.ts. */
const CONE_MASKS: Rect[] = [
  { x: 74, y: 58, width: 134, height: 40 },
  { x: 84, y: 98, width: 16, height: 56 },
  { x: 1232, y: 58, width: 134, height: 40 },
];

test("Intro end state matches the Intro artboard (artboard copy)", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Intro is a 1440x900 board");
  await page.goto(story("features-intro--artboard-parity"));
  await page.locator('#storybook-root main[data-intro="done"]').waitFor();
  const ratio = await expectMatchesArtboard(page, "Intro", {
    maxDiffRatio: 0.02,
    maskRects: [
      { x: 30, y: 815, width: 400, height: 60 }, // the commentary line: the story has none, the artboard draws one
      ...CONE_MASKS,
    ],
  });
  expect(ratio).toBeLessThanOrEqual(0.02);
});
