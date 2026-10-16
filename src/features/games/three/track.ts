export type Vec3 = readonly [x: number, y: number, z: number];

/** One clip on an actor's timeline, from `start` (s) until the next one starts. */
export interface ClipSeg<C extends string = string> {
  clip: C;
  start: number;
  /** Seconds into the clip at `start` (default 0). */
  from?: number;
  /** Playback speed (default 1). */
  speed?: number;
  loop?: boolean;
  /** Seconds the clip before this one takes to hand over to it (default `CROSSFADE_S`). */
  fade?: number;
}
/** A walk from wherever the actor is to `to`, from `start` to `end` (moves do not overlap and are in order). */
export interface Move {
  start: number;
  end: number;
  to: Vec3;
  ease?: "linear" | "in" | "out";
  /** The heading to face from `start` (radians, 0 faces +z); unchanged when left out. */
  face?: number;
}
export interface ActorTrack<C extends string = string> {
  home: Vec3;
  face: number;
  clips: ClipSeg<C>[];
  moves: Move[];
}
export interface ClipSample<C extends string = string> {
  clip: C;
  time: number;
  weight: number;
  loop: boolean;
}
export interface ActorSample<C extends string = string> {
  position: Vec3;
  face: number;
  clips: ClipSample<C>[];
}

/** How long one clip takes to hand over to the next, unless it says otherwise. */
export const CROSSFADE_S = 0.15;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const EASE = {
  linear: (f: number) => f,
  in: (f: number) => f * f,
  out: (f: number) => 1 - (1 - f) * (1 - f),
};
export const lerp3 = (a: Vec3, b: Vec3, f: number): Vec3 => [
  a[0] + (b[0] - a[0]) * f,
  a[1] + (b[1] - a[1]) * f,
  a[2] + (b[2] - a[2]) * f,
];

const sampleClip = <C extends string>(
  seg: ClipSeg<C>,
  t: number,
  weight: number,
): ClipSample<C> => ({
  clip: seg.clip,
  time: (seg.from ?? 0) + Math.max(0, t - seg.start) * (seg.speed ?? 1),
  weight,
  loop: seg.loop ?? false,
});

/** Where an actor is at `t`, which way it faces, and its clips with their weights (the newest first). */
export function sampleTrack<C extends string>(track: ActorTrack<C>, t: number): ActorSample<C> {
  let position = track.home;
  let face = track.face;
  for (const m of track.moves) {
    if (t < m.start) break;
    if (m.face !== undefined) face = m.face;
    const f = m.end > m.start ? clamp01((t - m.start) / (m.end - m.start)) : 1;
    position = lerp3(position, m.to, EASE[m.ease ?? "linear"](f));
  }
  let i = -1;
  for (let k = 0; k < track.clips.length; k++) if (track.clips[k]!.start <= t) i = k;
  const clips: ClipSample<C>[] = [];
  if (i < 0) {
    const first = track.clips[0];
    if (first) clips.push(sampleClip(first, first.start, 1));
  } else {
    const current = track.clips[i]!;
    const w = i > 0 ? clamp01((t - current.start) / (current.fade ?? CROSSFADE_S)) : 1;
    clips.push(sampleClip(current, t, w));
    if (w < 1) clips.push(sampleClip(track.clips[i - 1]!, t, 1 - w));
  }
  return { position, face, clips };
}
