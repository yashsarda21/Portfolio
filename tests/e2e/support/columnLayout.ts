import { expect, type Locator, type Page } from "@playwright/test";
import type { Rect } from "../../support/visual";

/** The gap between the lights and the top row's controls, and between the lights and the board, at the least (CSS px). */
export const LIGHTS_CLEARANCE = 8;

/** The gap the column sets between the board and the actions: 40px on a phone, 56px from 768px (ScreenColumn). */
export const ACTIONS_GAP = { phone: 40, tablet: 56 } as const;
export const actionsGapAt = (width: number) =>
  width < 768 ? ACTIONS_GAP.phone : ACTIONS_GAP.tablet;

const box = async (locator: Locator, what: string): Promise<Rect> => {
  const b = await locator.boundingBox();
  if (!b) throw new Error(`${what} has no box`);
  return b;
};

/** The page coordinates of a box (boundingBox is relative to the viewport). */
async function pageBox(page: Page, locator: Locator, what: string): Promise<Rect> {
  const b = await box(locator, what);
  const scroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  return { ...b, x: b.x + scroll.x, y: b.y + scroll.y };
}

const intersects = (a: Rect, b: Rect) =>
  a.x < b.x + b.width && b.x < a.x + a.width && a.y < b.y + b.height && b.y < a.y + a.height;

/**
 * Both floodlight banks hang clear of the top row (no overlap with any of its controls, at least
 * LIGHTS_CLEARANCE below them) and end above the board. `column` is the screen column's root; its top row
 * carries data-part="top" and the board data-part="board".
 */
export async function expectLightsBelowTopRow(page: Page, column: Locator) {
  const top = column.locator("[data-part='top']");
  const row = await pageBox(page, top, "the top row");
  const controls = [
    ...(await top.locator(":scope > *").all()),
    ...(await top.locator("a, button").all()),
  ];
  const boxes = await Promise.all(controls.map((c) => pageBox(page, c, "a top-row control")));
  const board = await pageBox(page, column.locator("[data-part='board']"), "the board");
  for (const side of ["bank-1", "bank-2"]) {
    const bank = await pageBox(page, column.locator(`[data-part='${side}']`), side);
    for (const control of [row, ...boxes]) {
      expect(intersects(bank, control), `${side} overlaps a top-row control`).toBe(false);
      expect(
        bank.y - (control.y + control.height),
        `${side} is below the top row by`,
      ).toBeGreaterThanOrEqual(LIGHTS_CLEARANCE);
    }
    expect(
      board.y - (bank.y + bank.height),
      `${side} ends above the board by`,
    ).toBeGreaterThanOrEqual(LIGHTS_CLEARANCE);
  }
}

/**
 * No floodlight bank touches the stage's HUD: for each bank and each HUD control (the header's own children:
 * the lockup and the buttons) the boxes do not intersect, and where they share a column the bank is at least
 * LIGHTS_CLEARANCE below the control. `below: "all"` asks it of every bank and every control (the Intro, whose
 * banks hang in one row under the HUD). Both are measured in the page, so a scaled stage is judged as drawn.
 * With `board` given, each bank also ends above that board's top by LIGHTS_CLEARANCE.
 */
export async function expectBanksClearOfHud(
  page: Page,
  stage: Locator,
  banks: number,
  options: { below?: "shared-columns" | "all"; board?: Locator } = {},
) {
  const hud = await Promise.all(
    (await stage.locator("header > div > *").all()).map((c) => pageBox(page, c, "a HUD control")),
  );
  expect(hud.length, "HUD controls found").toBeGreaterThanOrEqual(3);
  const board = options.board && (await pageBox(page, options.board, "the board"));
  for (let n = 1; n <= banks; n++) {
    const bank = await pageBox(page, stage.locator(`[data-part='bank-${n}']`), `bank-${n}`);
    for (const control of hud) {
      expect(intersects(bank, control), `bank-${n} overlaps a HUD control`).toBe(false);
      const sharesColumn = bank.x < control.x + control.width && control.x < bank.x + bank.width;
      if (sharesColumn || options.below === "all") {
        expect(
          bank.y - (control.y + control.height),
          `bank-${n} is below a HUD control by`,
        ).toBeGreaterThanOrEqual(LIGHTS_CLEARANCE);
      }
    }
    if (board)
      expect(
        board.y - (bank.y + bank.height),
        `bank-${n} ends above the board by`,
      ).toBeGreaterThanOrEqual(LIGHTS_CLEARANCE);
  }
}
