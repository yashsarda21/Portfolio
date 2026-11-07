/** Yash's serve routine: bounces before the serve, each this long (s); fewer on the first point. */
export const ROUTINE = { bounces: 3, first: 2, period: 0.55 } as const;
/** The serve clip: the toss leaves his left hand at `toss`, the racket meets the ball at `contact`, done at `end` (s). */
export const SERVE_CLIP = { toss: 0.3, contact: 1.05, end: 1.9 } as const;
/**
 * Where the serve's follow-through lands him (m, body frame: x his left, z his front), from where he served: the serve
 * clip's last key puts the hips here (on top of the ready stance's), and the shotlist moves him by it as the serve hands
 * over, so he does not slide back to his spot.
 */
export const SERVE_LANDS = [-0.15, 0, 0.68] as const;
/** A ground stroke: the forward swing starts at `commit`, meets the ball at `contact`, done at `end` (s). */
export const STROKE_CLIP = { commit: 0.4, contact: 0.6, end: 1.3 } as const;
/** Your window closes when the forward swing must start: this long before contact (spec §3.3). */
export const SWING_LEAD = STROKE_CLIP.contact - STROKE_CLIP.commit;
/** A missed swing meets the ball's place this long after it went by (late), or before it came (early). */
export const MISS = { late: 0.25, early: 0.3 } as const;
/** A player sets off this long after the other's hit: the split-step's push-off, blended into the run. */
export const RUN_AFTER = 0.1;
/** An early swing comes no sooner than a run to the ball's place at this speed (m/s) allows: he always gets there (Phase 9, owner 2026-11-07). */
export const EARLY_RUN_CAP = 6;
/** The stretch (beaten): the racket is at full reach this far into the clip. */
export const STRETCH_CLIP = { reach: 0.35, end: 1.1 } as const;
/** The split-step when the other player hits, and the side shuffle's ground speed at clip speed 1 (m/s). */
export const SPLIT_CLIP = { end: 0.3 } as const;
export const SHUFFLE_PACE = 1.8;
/** The fist pump at GAME. */
export const FIST_PUMP_CLIP = { end: 1.4 } as const;
export type TennisClip =
  | "idle"
  | "walk"
  | "jog"
  | "sprint"
  | "crouch"
  | "ready"
  | "split"
  | "shuffleL"
  | "shuffleR"
  | "bounceBall"
  | "serve"
  | "forehand"
  | "backhand"
  | "stretchF"
  | "stretchB"
  | "fistPump";
export type Stroke = "forehand" | "backhand";
