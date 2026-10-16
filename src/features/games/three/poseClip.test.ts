import { Quaternion } from "three";
import { describe, expect, it } from "vitest";
import { poseClip, SMOOTH_FPS } from "./poseClip";
import { BONES, type BoneKey } from "./rig";

describe("poseClip", () => {
  it("turns key poses into one quaternion track per bone, from the rest rotation", () => {
    const rest = Object.fromEntries(Object.keys(BONES).map((b) => [b, new Quaternion()])) as Record<
      BoneKey,
      Quaternion
    >;
    const clip = poseClip(
      "test",
      [
        { at: 0, pose: {} },
        { at: 1, pose: { hips: [90, 0, 0] } },
      ],
      rest,
      BONES,
    );
    expect(clip.duration).toBe(1);
    expect(clip.tracks.map((t) => t.name).sort()).toEqual(
      Object.values(BONES)
        .map((n) => `${n}.quaternion`)
        .sort(),
    );
    const hips = clip.tracks.find((t) => t.name === "pelvis.quaternion")!;
    expect(Array.from(hips.times)).toEqual([0, 1]);
    const second = Array.from(hips.values.slice(4, 8));
    [0.7071, 0, 0, 0.7071].forEach((v, i) => expect(second[i]).toBeCloseTo(v, 3));
  });
  it("smoothed: keyed in between, exactly on every key, eased out of the first and into the last, a hold held", () => {
    const rest = Object.fromEntries(Object.keys(BONES).map((b) => [b, new Quaternion()])) as Record<
      BoneKey,
      Quaternion
    >;
    const keys = [
      { at: 0, pose: {} },
      { at: 0.3, pose: { hips: [60, 0, 0] as const } },
      { at: 0.6, pose: { hips: [90, 0, 0] as const } },
      { at: 1, pose: { hips: [90, 0, 0] as const } },
    ];
    const hips = poseClip("test", keys, rest, BONES, undefined, { smooth: true }).tracks.find(
      (t) => t.name === "pelvis.quaternion",
    )!;
    const times = Array.from(hips.times);
    expect(times.length).toBeGreaterThan(SMOOTH_FPS * 0.9);
    const angle = (i: number) => (2 * Math.acos(hips.values[i * 4 + 3]!) * 180) / Math.PI;
    for (const k of keys) {
      const i = times.findIndex((t) => Math.abs(t - k.at) < 1e-6);
      expect(i).toBeGreaterThanOrEqual(0);
      expect(angle(i)).toBeCloseTo(k.pose.hips?.[0] ?? 0, 3);
    }
    // Slow out of the first key, faster through the middle one, and still in the hold.
    const step = (a: number, b: number) => angle(b) - angle(a);
    const mid = times.findIndex((t) => Math.abs(t - 0.3) < 1e-6);
    expect(step(0, 1)).toBeLessThan(step(mid - 1, mid));
    for (let i = times.findIndex((t) => t >= 0.6); i < times.length; i++)
      expect(angle(i)).toBeCloseTo(90, 3);
  });
});
