import type { Locator, Page } from "@playwright/test";
import { expectBoxesMatchArtboard, localRects, type Rect } from "./visual";

/**
 * The Mobile-Landing artboard's boxes (390x844), where the page keeps or moves them (spec §11.11, D-2 and D-3).
 * The page differs from the artboard on purpose: the lights hang lower and the board and the calls to action
 * sit together, centred under the top row. So the page is not compared whole. What stayed (the top row) is
 * compared where it is; what moved (the board, the challenge line with its two buttons) is cut out of the
 * page at its new place and compared with the artboard's box at the old one.
 */
export const MOBILE_LANDING_BOXES = {
  topRow: { x: 0, y: 0, width: 390, height: 60 },
  board: { x: 16, y: 130, width: 358, height: 331 },
  actions: { x: 16, y: 618, width: 358, height: 186 },
} as const satisfies Record<string, Rect>;

/**
 * The two lights' old place (the artboard: y 56 to 78) and new place (the page: y 80 to 102), x 30 to 90 and
 * 300 to 360. The top row is compared with the lights and their glow masked, 20px around each housing: the
 * glow is what the move changes behind the logo and the toggle (beyond 20px it is under the comparison's
 * threshold: with a 30px pad the whole band differs by 0.03%).
 */
const LIGHTS = [
  { x: 30, y: 56, width: 60, height: 22 },
  { x: 300, y: 56, width: 60, height: 22 },
  { x: 30, y: 80, width: 60, height: 22 },
  { x: 300, y: 80, width: 60, height: 22 },
] as const;
const GLOW = 20;
export const MOBILE_LANDING_LIGHT_MASKS: Rect[] = LIGHTS.map((r) => ({
  x: r.x - GLOW,
  y: r.y - GLOW,
  width: r.width + 2 * GLOW,
  height: r.height + 2 * GLOW,
}));

/** The artboard's own copy, which the page's labels are masked against (A2 and L5, spec §11.11). */
export interface MobileLandingCopy {
  live: string;
  playerShort: string;
  status: string;
  away: string;
  enterSub: string;
  viewSub: string;
}

/** Page coordinates of a locator's box. */
async function where(page: Page, locator: Locator): Promise<Rect> {
  const box = (await locator.boundingBox())!;
  const scroll = await page.evaluate(() => ({ x: scrollX, y: scrollY }));
  return { ...box, x: box.x + scroll.x, y: box.y + scroll.y };
}

/**
 * Compare the phone Landing at 390x844 with the Mobile-Landing artboard, box by box (each at most 2%).
 * A2: the board draws its labels at 10px, the page at 11px, so each label's own box is masked.
 * L5: the toggle reads SOUND ON where the board draws SOUND OFF: only the state word is masked.
 * The lights (D-2) are masked in the top row, old and new places with their glow.
 * `column` is the Landing's column root: its board carries data-part="board", its top row data-part="top"
 * and the challenge line with the two buttons data-part="actions".
 */
export async function expectMobileLandingFidelity(
  page: Page,
  column: Locator,
  copy: MobileLandingCopy,
): Promise<Record<string, number>> {
  // Measured at the boot's last frame: the calls to action rise 18px into place, so a box read mid-boot is off.
  await page.evaluate(() =>
    document.getAnimations().forEach((a) => {
      try {
        a.finish();
      } catch {
        /* an endless loop has no end to go to */
      }
    }),
  );
  const text = (t: string) => column.getByText(t, { exact: true });
  const board = column.locator("[data-part='board']");
  const actions = column.locator("[data-part='actions']");
  const boardAt = await where(page, board);
  const actionsAt = await where(page, actions);
  const origin = (r: Rect) => ({ x: Math.round(r.x), y: Math.round(r.y) });
  const sound = column.getByRole("button", { name: /SOUND/ });

  return expectBoxesMatchArtboard(page, "Mobile-Landing", MOBILE_LANDING_BOXES, {
    maxDiffRatio: 0.02,
    placements: { board: origin(boardAt), actions: origin(actionsAt) },
    masks: {
      topRow: [
        ...MOBILE_LANDING_LIGHT_MASKS,
        ...(await localRects([sound.locator("span[aria-hidden='true']")], { x: 0, y: 0 })),
      ],
      board: await localRects(
        [text(copy.live), text(copy.playerShort), text(copy.status), text(copy.away)],
        origin(boardAt),
      ),
      actions: await localRects([text(copy.enterSub), text(copy.viewSub)], origin(actionsAt)),
    },
  });
}
