/** A polygon as [x, y] points in fractions (0 to 1) of the 1440x900 canvas it is drawn on. */
export type Polygon = ReadonlyArray<readonly [number, number]>;

export interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

type Layout = "landing" | "intro";
type Side = "left" | "right";

const CANVAS = { w: 1440, h: 900 } as const;

/** A clip-path polygon given in percent of its box, placed on the canvas. */
export function polygonIn(
  box: Box,
  percentPoints: ReadonlyArray<readonly [number, number]>,
): Polygon {
  return percentPoints.map(([px, py]) => [
    (box.x + (px / 100) * box.w) / CANVAS.w,
    (box.y + (py / 100) * box.h) / CANVAS.h,
  ]);
}

/*
 * The source of the cone geometry (design px on the 1440x900 canvas). Three places draw from it:
 *  - ArenaBackdrop's cone classes (Tailwind needs literal classes; Scene.test.tsx checks them against CONE_BOXES),
 *  - the apex percentages in scene.css (cones.test.ts checks them against CONE_APEX),
 *  - the dust regions below.
 */
/** Each cone's box (Main: 520x760 at side 60 / top 70; Intro.dc.html: 540x800 at side 40 / top 60, here D-5: top 102, same bottom, 540x758, so each beam starts 26px into its lowered lamp as the artboard's does). */
export const CONE_BOXES = {
  landing: {
    left: { x: 60, y: 70, w: 520, h: 760 },
    right: { x: 860, y: 70, w: 520, h: 760 },
  },
  intro: {
    left: { x: 40, y: 102, w: 540, h: 758 },
    right: { x: 860, y: 102, w: 540, h: 758 },
  },
} as const satisfies Record<Layout, Record<Side, Box>>;

/** The large bank's span [from, to] in x: the lamp each beam must start from (D-1, spec 11.4). */
export const LAMP_SPANS = {
  landing: { left: [96, 208], right: [1232, 1344] },
  intro: { left: [80, 192], right: [1248, 1360] },
} as const satisfies Record<Layout, Record<Side, readonly [number, number]>>;

/** The beam's top edge as percent of its box, so it covers exactly the lamp: (lamp - box.x) / box.w, 4 places. */
export function apexOf(box: Box, lamp: readonly [number, number]): [number, number] {
  const pct = (x: number) => Math.round(((x - box.x) / box.w) * 1e6) / 1e4;
  return [pct(lamp[0]), pct(lamp[1])];
}

/** The apex percentages scene.css carries (the cone defaults and the Intro override). */
export const CONE_APEX = {
  landing: {
    left: apexOf(CONE_BOXES.landing.left, LAMP_SPANS.landing.left),
    right: apexOf(CONE_BOXES.landing.right, LAMP_SPANS.landing.right),
  },
  intro: {
    left: apexOf(CONE_BOXES.intro.left, LAMP_SPANS.intro.left),
    right: apexOf(CONE_BOXES.intro.right, LAMP_SPANS.intro.right),
  },
} as const satisfies Record<Layout, Record<Side, readonly [number, number]>>;

// The bottom edge of each beam (unchanged from the artboards), percent of its box.
const BOTTOM = {
  left: [
    [100, 100],
    [40, 100],
  ],
  right: [
    [60, 100],
    [0, 100],
  ],
} as const;

function region(layout: Layout, side: Side): Polygon {
  const [a, b] = CONE_APEX[layout][side];
  return polygonIn(CONE_BOXES[layout][side], [[a, 0], [b, 0], ...BOTTOM[side]]);
}

/** Where the two light cones are, for the dust drifting in them. */
export const CONE_REGIONS = {
  landing: [region("landing", "left"), region("landing", "right")],
  intro: [region("intro", "left"), region("intro", "right")],
} as const satisfies Record<Layout, readonly Polygon[]>;
