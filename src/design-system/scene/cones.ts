/** A polygon as [x, y] points in fractions (0 to 1) of the 1440x900 canvas it is drawn on. */
export type Polygon = ReadonlyArray<readonly [number, number]>;

interface Box {
  x: number;
  y: number;
  w: number;
  h: number;
}

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
 * Where the two light cones are, for the dust drifting in them. Keep in step with ArenaBackdrop's cone boxes
 * (landing: 520x760 at left/right 60, top 70; intro: 540x800 at left/right 40, top 60) and with the apex
 * percentages in scene.css (D-1).
 */
export const CONE_REGIONS = {
  landing: [
    polygonIn({ x: 60, y: 70, w: 520, h: 760 }, [
      [6.9231, 0],
      [28.4615, 0],
      [100, 100],
      [40, 100],
    ]),
    polygonIn({ x: 860, y: 70, w: 520, h: 760 }, [
      [71.5385, 0],
      [93.0769, 0],
      [60, 100],
      [0, 100],
    ]),
  ],
  intro: [
    polygonIn({ x: 40, y: 60, w: 540, h: 800 }, [
      [7.4074, 0],
      [28.1481, 0],
      [100, 100],
      [40, 100],
    ]),
    polygonIn({ x: 860, y: 60, w: 540, h: 800 }, [
      [71.8519, 0],
      [92.5926, 0],
      [60, 100],
      [0, 100],
    ]),
  ],
} as const satisfies Record<string, readonly Polygon[]>;
