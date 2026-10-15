import { Quaternion } from "three";
import { describe, expect, it } from "vitest";
import { poseClip } from "./poseClip";
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
});
