import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { expectMatchesArtboard, referencePath } from "../support/visual";

// Which reference to use per Playwright project viewport.
const BOARD: Record<string, string> = { desktop: "Main", mobile: "Mobile-Landing" };

test("a reference matches itself", async ({ page }, testInfo) => {
  const board = BOARD[testInfo.project.name]!;
  const { width, height } = page.viewportSize()!;
  const png = readFileSync(referencePath(board, width, height)).toString("base64");
  await page.setContent(
    `<html><body style="margin:0"><img src="data:image/png;base64,${png}" style="display:block"></body></html>`,
  );
  const ratio = await expectMatchesArtboard(page, board);
  expect(ratio).toBeLessThan(0.001);
});

test("a blank page fails against a reference", async ({ page }, testInfo) => {
  const board = BOARD[testInfo.project.name]!;
  await page.setContent(`<html><body style="margin:0;background:#fff"></body></html>`);
  await expect(expectMatchesArtboard(page, board)).rejects.toThrow(/pixels differ/);
});
