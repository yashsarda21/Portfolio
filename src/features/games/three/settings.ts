import type { GameLayout } from "../engine/types";

export interface LayoutSettings {
  /** The highest pixel ratio the canvas draws at. */
  dpr: number;
  /** One shadow-casting floodlight (the column draws a soft blob under each player instead). */
  shadows: boolean;
  /** How many people sit in the stands. */
  crowd: number;
  antialias: boolean;
}

/** The two 3D settings (spec §6.3): the desktop stage, and the lighter phone and tablet column. */
export const SETTINGS: Record<GameLayout, LayoutSettings> = {
  stage: { dpr: 2, shadows: true, crowd: 2400, antialias: true },
  column: { dpr: 1.5, shadows: false, crowd: 1200, antialias: false },
};
