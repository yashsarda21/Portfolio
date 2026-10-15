import type { Shotlist } from "./sequence";

/** What the scene draws each frame: the shotlist on screen, its clock (s), and whether the crowd stands (ball 3). */
export interface WorldState {
  shotlist: Shotlist;
  elapsed(): number;
  crowdUp: boolean;
}
