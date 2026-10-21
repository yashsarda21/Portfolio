import { describe, expect, it } from "vitest";
import { CROSSFADE_S, sampleTrack, type ActorTrack } from "./track";

const track: ActorTrack = {
  home: [0, 0, 0],
  face: 0,
  clips: [
    { clip: "run", start: 0, loop: true, speed: 2 },
    { clip: "bowl", start: 1, from: 0.1 },
  ],
  moves: [
    { start: 0, end: 1, to: [0, 0, 10] },
    { start: 1, end: 2, to: [4, 0, 10], ease: "in", face: 1.5 },
  ],
};

describe("sampleTrack", () => {
  it("plays one clip at full weight, at its speed", () => {
    expect(sampleTrack(track, 0.5).clips).toEqual([
      { clip: "run", time: 1, weight: 1, loop: true },
    ]);
  });
  it("crossfades into the next clip over CROSSFADE_S, weights summing to 1", () => {
    const { clips } = sampleTrack(track, 1 + CROSSFADE_S / 2);
    expect(clips.map((c) => c.clip)).toEqual(["bowl", "run"]);
    expect(clips[0]!.weight + clips[1]!.weight).toBeCloseTo(1);
    expect(clips[0]!.time).toBeCloseTo(0.1 + CROSSFADE_S / 2);
    const slow = { ...track, clips: [track.clips[0]!, { ...track.clips[1]!, fade: 0.6 }] };
    expect(sampleTrack(slow, 1.3).clips[0]!.weight).toBeCloseTo(0.5); // its own, longer hand-over
  });
  it("moves along each walk in turn, with its easing and facing", () => {
    expect(sampleTrack(track, 0.5).position).toEqual([0, 0, 5]);
    const mid = sampleTrack(track, 1.5);
    expect(mid.position[0]).toBeCloseTo(1); // ease "in": 0.5² of 4 m
    expect(mid.face).toBe(1.5);
    expect(sampleTrack(track, 9).position).toEqual([4, 0, 10]);
  });
  it("turns to a move's heading over its `turn`, the short way round", () => {
    const turning = (from: number, face: number): ActorTrack => ({
      ...track,
      face: from,
      moves: [{ start: 1, end: 2, to: [1, 0, 0], face, turn: 0.2 }],
    });
    const quarter = turning(0, Math.PI / 2);
    expect(sampleTrack(quarter, 1).face).toBeCloseTo(0);
    expect(sampleTrack(quarter, 1.1).face).toBeCloseTo(Math.PI / 4);
    expect(sampleTrack(quarter, 1.2).face).toBeCloseTo(Math.PI / 2);
    expect(sampleTrack(quarter, 5).face).toBeCloseTo(Math.PI / 2);
    // From 3 to -3 radians: through pi (0.28 rad), not back through 0 (6 rad).
    expect(sampleTrack(turning(3, -3), 1.1).face).toBeCloseTo(Math.PI);
  });
  it("before the first clip, holds its first frame", () => {
    const late = { ...track, clips: [{ clip: "idle", start: 2 }] };
    expect(sampleTrack(late, 1).clips).toEqual([{ clip: "idle", time: 0, weight: 1, loop: false }]);
  });
});
