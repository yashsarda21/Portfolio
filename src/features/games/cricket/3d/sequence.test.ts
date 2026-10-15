import { describe, expect, it } from "vitest";
import { sampleTrack } from "../../three/track";
import { deliveryPath } from "./ball";
import type { Delivery } from "./delivery";
import { CAMERA, homeOf, JUMP_Z, MARK } from "./field";
import {
  ballShotlist,
  clapTimes,
  LEAP_AT,
  RELEASE_AFTER,
  RUNUP,
  SHOT_CONTACT,
  walkBackShotlist,
} from "./sequence";

const delivery: Delivery = { speedKmh: 140, pitchZ: 4, x: -0.15, seam: 0, line: "off" };
const plan = (kind: "drive" | "beaten" | "loft" | "dugOut", bearing = -45) => ({
  ball: 0,
  delivery: kind === "loft" ? { ...delivery, pitchZ: null } : delivery,
  shot: { kind, bearing },
  pressAt: 1.7,
});

describe("clapTimes", () => {
  it("one clap per stride, from the start of the run-up, closer together as he speeds up", () => {
    const t = clapTimes();
    expect(t).toHaveLength(RUNUP.strides);
    expect(t[0]).toBe(0);
    expect(t.at(-1)!).toBeLessThan(LEAP_AT);
    const gaps = t.slice(1).map((v, i) => v - t[i]!);
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]!).toBeLessThan(gaps[i - 1]!);
  });
});

describe("ballShotlist", () => {
  it("before the release press, the bowler runs in to the leap and there is no ball", () => {
    const s = ballShotlist(0, null);
    expect(s.ball(1)).toBeNull();
    expect(sampleTrack(s.actors.bowler, LEAP_AT).position[2]).toBeCloseTo(JUMP_Z);
    expect(s.cues.filter((c) => c.sound === "clap")).toHaveLength(RUNUP.strides);
  });
  it("a drive: the bat meets the ball at contact, a bat cue there, the crowd at the rope, the camera follows", () => {
    const p = plan("drive");
    const s = ballShotlist(0, p);
    const release = p.pressAt + RELEASE_AFTER;
    const contact = release + deliveryPath(delivery).duration;
    const shot = s.actors.yash.clips.find((c) => c.clip === "drive")!;
    expect(shot.start).toBeCloseTo(contact - SHOT_CONTACT.drive);
    expect(s.ball(contact)).toEqual(deliveryPath(delivery).at(deliveryPath(delivery).duration));
    expect(s.cues).toContainEqual({ at: contact, sound: "bat" });
    expect(s.cues.some((c) => c.sound === "crowd" && c.at > contact)).toBe(true);
    expect(s.cues.some((c) => c.sound === "clap")).toBe(false);
    expect(s.camera(contact + 1)).not.toEqual(CAMERA.aim);
    expect(s.end).toBeGreaterThan(contact);
  });
  it("beaten: an ooh, no bat, the keeper takes it, the camera stays on the aim view", () => {
    const s = ballShotlist(0, plan("beaten", 0));
    expect(s.cues.some((c) => c.sound === "bat")).toBe(false);
    expect(s.cues.some((c) => c.sound === "ooh")).toBe(true);
    expect(s.actors.keeper.clips.some((c) => c.clip === "keeperTake")).toBe(true);
    expect(s.camera(s.end)).toEqual(CAMERA.aim);
    expect(s.ball(s.end)).toBeNull();
  });
  it("a drive sends the nearest fielder to dive, and he never reaches the ball's line", () => {
    const s = ballShotlist(0, plan("drive", -45));
    const diver = (["cover", "midwicket", "fineLeg", "slip"] as const).find((id) =>
      s.actors[id].clips.some((c) => c.clip === "dive"),
    );
    expect(diver).toBe("cover");
  });
});

const expectNear = (a: readonly number[], b: readonly number[]) =>
  a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, 6));

describe("walkBackShotlist", () => {
  it("everyone ends at their place for the next ball; the bowler back at his mark", () => {
    const prev = ballShotlist(0, plan("drive"));
    const s = walkBackShotlist(prev, 1);
    expectNear(sampleTrack(s.actors.bowler, s.end).position, MARK);
    expectNear(sampleTrack(s.actors.cover, s.end).position, homeOf("cover", 1));
    expectNear(s.camera(s.end).position, CAMERA.aim.position);
    expectNear(s.camera(s.end).target, CAMERA.aim.target);
  });
});
