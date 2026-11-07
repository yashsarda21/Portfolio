/** The high serve: the left hand lets go of the feathers at `drop`, the racket meets the cork at `contact`, done at `end` (s). */
export const SERVE_CLIP = { drop: 0.25, contact: 0.55, end: 1.3 } as const;
/**
 * The overhead (the clear, the drop and the smash share it, as real badminton's disguise does): the forward swing
 * starts at `commit` and meets the shuttle at `contact`, done at `end` (s).
 */
export const OVERHEAD_CLIP = { commit: 0.45, contact: 0.65, end: 1.4 } as const;
/** The jump smash: both feet leave the floor at `takeoff`, the swing starts at `commit`, he lands at `land` (s). */
export const JUMP_SMASH_CLIP = {
  takeoff: 0.35,
  commit: 0.5,
  contact: 0.7,
  land: 0.95,
  end: 1.6,
} as const;
/** The net shot, from a lunge. */
export const NET_CLIP = { contact: 0.45, end: 1.2 } as const;
/** The underarm lift, from a lunge. */
export const LIFT_CLIP = { contact: 0.45, end: 1.2 } as const;
/** The block, the racket in front. */
export const BLOCK_CLIP = { contact: 0.25, end: 0.9 } as const;
/**
 * The dive: off both feet at `launch`, the racket under the shuttle at `contact`, down on the forearms and chest at
 * `floor`, back up in the ready stance by `up` (s).
 */
export const DIVE_CLIP = { launch: 0.15, contact: 0.4, floor: 0.6, up: 1.5, end: 1.8 } as const;
/**
 * Where the dive leaves him standing (m, body frame: x his left, z his front), from where he dived: the dive clip's
 * keys from `up` on put the hips and feet here (on top of the ready stance's), so the shotlist moves him by it as the
 * dive hands over, and he does not slide back to his spot.
 */
export const DIVE_LANDS = [0, 0, 1.4] as const;
/** The stretch (beaten): the racket is at full reach this far into the clip. */
export const STRETCH_CLIP = { reach: 0.35, end: 1.1 } as const;
/** The split step when the other player hits. */
export const SPLIT_CLIP = { end: 0.3 } as const;
/** The fist pump at GAME. */
export const FIST_PUMP_CLIP = { end: 1.4 } as const;
/** The side shuffle's ground speed at clip speed 1 (m/s). */
export const SHUFFLE_PACE = 1.8;
/**
 * A swing that misses reaches the shuttle's place this long after it went by (late), or up to this long before it came
 * (early; sooner than a run there allows it is not, so you always get there). Phase 9, owner 2026-11-07: you always
 * reach the shuttle; a wrong press swings and misses it (it replaces the early swing that framed it into the net).
 */
export const MISS = { late: 0.25, early: 0.3 } as const;
/** A player sets off this long after the other's hit: the split step's push-off, blended into the run (tennis R13). */
export const RUN_AFTER = 0.1;
/** An early swing comes no sooner than a run to the shuttle's place at this speed (m/s) allows. */
export const EARLY_RUN_CAP = 6;
/** Your window closes when the forward swing must start: this long before contact. */
export const SWING_LEAD = OVERHEAD_CLIP.contact - OVERHEAD_CLIP.commit;
export type BadmintonClip =
  | "idle"
  | "walk"
  | "jog"
  | "sprint"
  | "crouch"
  | "ready"
  | "split"
  | "shuffleL"
  | "shuffleR"
  | "serve"
  | "overhead"
  | "jumpSmash"
  | "net"
  | "lift"
  | "block"
  | "dive"
  | "stretchF"
  | "stretchB"
  | "fistPump";
export type Stroke = "serve" | "overhead" | "jumpSmash" | "net" | "lift" | "block" | "dive";
