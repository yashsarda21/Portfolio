import { describe, expect, it } from "vitest";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import type { Quality } from "../engine/types";
import { bowl, CRICKET_START, type CricketState } from "./referee";
import { buildCricket3dControls, buildCricketView, type CricketPhase } from "./view";

/** The phone's quiet third link at the end. */
const HUB = { label: "BACK TO THE HUB", to: "/arena" };

/** Plays qualities in order. */
const play = (qualities: Quality[]): CricketState =>
  qualities.reduce((s, q) => bowl(s, q), CRICKET_START);
const view = (
  state: CricketState,
  opts: { phase?: CricketPhase; offerHighlight?: boolean; fullTime?: boolean } = {},
  c = content,
) =>
  buildCricketView(c, ui, ROUTES, state, {
    phase: opts.phase ?? "called",
    offerHighlight: opts.offerHighlight ?? false,
    fullTime: opts.fullTime ?? false,
  });

describe("buildCricketView", () => {
  it("reads the fresh board like the artboard", () => {
    const v = view(CRICKET_START, { phase: "ready" });
    expect(v.bug).toMatchObject({
      name: "YASH",
      score: "0*",
      meta: "BALL 1 OF 3",
      away: "YOU BOWLING",
      metaPhone: "YOU BOWLING · 1/3",
    });
    expect(v.onStrike).toBe("YASH · ON STRIKE · 0*");
    expect(v.screen.title).toBe("STADIUM SCREEN");
    expect(v.screen.count).toBe("0 / 3 UNLOCKED");
    expect(v.screen.slots).toEqual([
      { state: "locked", label: "INNINGS 01 · LOCKED", hint: "BOWL BALL 1" },
      { state: "locked", label: "INNINGS 02 · LOCKED", hint: "BOWL BALL 2" },
      { state: "locked", label: "INNINGS 03 · LOCKED", hint: "BOWL BALL 3" },
    ]);
    expect(v.balls.map((b) => [b.label, b.state])).toEqual([
      ["1", "current"],
      ["2", "pending"],
      ["3", "pending"],
    ]);
    expect(v.latest).toBeNull();
    expect(v.call).toBeNull();
    expect(v.comm).toBe(ui.games.cricket.comm.start);
    expect(v.announce).toBe("");
    expect(v.end).toBeNull();
    expect(v.heading).toBe("BOWL AT ME");
    expect(v.headline).toBe(ui.games.cricket.headline);
    expect(v.bowl).toEqual({
      label: "BOWL · SPACE",
      labelPhone: "TAP TO BOWL",
      hint: ui.games.cricket.touchHint,
    });
  });

  it("gives the meter the zones the judge uses, in % of the track", () => {
    const { meter } = view(CRICKET_START);
    expect(meter.labels).toEqual({ start: "SHORT", target: "YORKER", end: "FULL TOSS" });
    expect(meter.zones.stage).toEqual({ perfect: [46.5, 53.5], good: [38, 62] });
    expect(meter.zones.column).toEqual({ perfect: [45, 55], good: [36, 64] });
  });

  it("after a miss: SIX for him, and innings 01 is open", () => {
    const v = view(play(["miss"]));
    expect(v.bug.score).toBe("6*");
    expect(v.bug.meta).toBe("BALL 2 OF 3");
    expect(v.bug.metaPhone).toBe("YOU BOWLING · 2/3");
    expect(v.onStrike).toBe("YASH · ON STRIKE · 6*");
    expect(v.screen.count).toBe("1 / 3 UNLOCKED");
    expect(v.screen.slots[0]).toEqual({
      state: "open",
      eyebrow: "INNINGS 01 · NOT OUT",
      title: "DEUTSCHE BANK",
      meta: "Software Engineer 1 · Jul 2024 – now",
    });
    expect(v.screen.slots[1]).toMatchObject({ state: "locked", hint: "BOWL BALL 2" });
    expect(v.latest).toEqual({
      eyebrow: "INNINGS 01 UNLOCKED · NOT OUT",
      title: "DEUTSCHE BANK",
      meta: "Software Engineer 1 · Jul 2024 – now",
    });
    expect(v.call).toEqual({ text: "SIX.", tone: "floodlight" });
    expect(v.comm).toBe(ui.games.cricket.comm.six);
    expect(v.balls.map((b) => [b.label, b.state])).toEqual([
      ["6", "against"],
      ["2", "current"],
      ["3", "pending"],
    ]);
  });

  it("after a perfect ball: a dot for you, DOT BALL in volt", () => {
    const v = view(play(["perfect"]));
    expect(v.balls[0]).toEqual({ label: "•", state: "for" });
    expect(v.call).toEqual({ text: "DOT BALL.", tone: "volt" });
    expect(v.bug.score).toBe("0*");
    expect(v.comm).toBe(ui.games.cricket.comm.dot);
  });

  it("holds the call only while it is being called, and its words for the screen reader", () => {
    const state = play(["perfect", "good"]);
    expect(view(state, { phase: "ready" }).call).toBeNull();
    expect(view(state, { phase: "flight" }).call).toBeNull();
    expect(view(state, { phase: "called" }).call?.text).toBe("FOUR.");
    expect(view(state, { phase: "called" }).announce).toBe(
      "FOUR. Innings 02 unlocked: DEUTSCHE BANK, Graduate Analyst Intern, Jun – Jul 2023",
    );
  });

  it("an over of good, miss, good: 14 not out, all three innings open", () => {
    const state = play(["good", "miss", "good"]);
    const v = view(state, { phase: "end" });
    expect(v.bug.score).toBe("14*");
    expect(v.bug.meta).toBe("OVER COMPLETE");
    expect(v.bug.metaPhone).toBe("OVER COMPLETE");
    expect(v.screen.count).toBe("3 / 3 UNLOCKED");
    expect(v.screen.slots.every((s) => s.state === "open")).toBe(true);
    expect(v.screen.slots[2]).toEqual({
      state: "open",
      eyebrow: "INNINGS 03 · ACADEMY",
      title: "PICT, PUNE",
      meta: "B.Tech, Information Technology · 2020 – 2024",
    });
    expect(v.saved).toBe("14* NOT OUT");
    expect(v.comm).toBe(ui.games.cricket.comm.lastGood);
    expect(v.end).toEqual({
      primary: { label: "SEE THE FULL SCORECARD", to: "/career" },
      again: "BOWL AGAIN",
      hub: HUB,
    });
  });

  it("offers the highlight after a second loss, with play-again beside it", () => {
    const v = view(play(["good", "miss", "good"]), { phase: "end", offerHighlight: true });
    expect(v.end).toEqual({
      primary: { label: "WATCH THE HIGHLIGHT INSTEAD", to: "/career" },
      again: "BOWL AGAIN",
      hub: HUB,
    });
  });

  it("three perfect balls: dot, dot, then FOUR, and Yash is 4 not out (F1)", () => {
    const v = view(play(["perfect", "perfect", "perfect"]), { phase: "end" });
    expect(v.balls.map((b) => [b.label, b.state])).toEqual([
      ["•", "for"],
      ["•", "for"],
      ["4", "against"],
    ]);
    expect(v.bug.score).toBe("4*");
    expect(v.onStrike).toBe("YASH · ON STRIKE · 4*");
    expect(v.saved).toBe("4* NOT OUT");
    expect(v.call).toEqual({ text: "FOUR.", tone: "floodlight" });
    expect(v.comm).toBe(ui.games.cricket.comm.lastPerfect);
    expect(v.end?.primary).toEqual({ label: "SEE THE FULL SCORECARD", to: "/career" });
    expect(JSON.stringify(v)).not.toMatch(/CLAIM|BOWLED|BROKE|GETS THROUGH/);
  });

  it("once all three venues are played, the main button is SEE FULL TIME, ahead of the highlight (F3)", () => {
    const state = play(["good", "miss", "good"]);
    for (const offerHighlight of [false, true]) {
      expect(view(state, { phase: "end", offerHighlight, fullTime: true }).end).toEqual({
        primary: { label: "SEE FULL TIME", to: "/arena/full-time" },
        again: "BOWL AGAIN",
        hub: HUB,
      });
    }
  });

  it("with a third career role the over still reveals innings 01, 02, then the academy", () => {
    const [first, second] = content.careerStats;
    const three = {
      ...content,
      careerStats: [first!, second!, { ...second!, innings: "03", team: "Third Co" }],
    };
    const v = view(play(["good", "good", "good"]), { phase: "end" }, three);
    expect(v.screen.slots.map((s) => s.state === "open" && s.eyebrow)).toEqual([
      "INNINGS 01 · NOT OUT",
      "INNINGS 02 · DEBUT",
      "INNINGS 03 · ACADEMY",
    ]);
    expect(JSON.stringify(v.screen.slots)).not.toContain("THIRD CO");
  });

  it("names the pieces of the board", () => {
    const v = view(CRICKET_START);
    expect(v.pitch).toEqual({ yorker: "YORKER", good: "GOOD LENGTH" });
    expect(v.youTag).toBe("YOU · BOWLING");
    expect(v.how).toBe(ui.games.cricket.how);
    expect(v.chrome.skip).toEqual({ label: "SKIP TO CAREER STATS", short: "SKIP", to: "/career" });
  });
  it("m-4: the announcer says how the over ended, once it is over, and not before", () => {
    const first = view(play(["good"]), { phase: "called" }).announce;
    expect(first).not.toMatch(/over complete/i);
    const done = view(play(["good", "miss", "good"]), { phase: "verdict" }).announce;
    expect(done).toMatch(/\. Over complete\. Yash 14 not out\.$/);
    expect(view(play(["perfect", "perfect", "perfect"]), { phase: "verdict" }).announce).toMatch(
      /\. Over complete\. Yash 4 not out\.$/,
    );
    // The end buttons appear on the same words: nothing is said again.
    expect(view(play(["good", "miss", "good"]), { phase: "end" }).announce).toBe(done);
  });

  it("3D: a beaten dot on OFF and a full-toss six have their own commentary; 2D keeps the old lines", () => {
    const comm = ui.games.cricket.comm;
    const beaten = bowl(CRICKET_START, "perfect", { aim: "off", full: false });
    expect(view(beaten).comm).toBe(comm.beaten);
    const dug = bowl(CRICKET_START, "perfect", { aim: "middle", full: false });
    expect(view(dug).comm).toBe(comm.dot);
    const full = bowl(CRICKET_START, "miss", { aim: "leg", full: true });
    expect(view(full).comm).toBe(comm.sixFull);
    expect(view(play(["miss"])).comm).toBe(comm.six);
  });
});

describe("buildCricket3dControls", () => {
  const copy = ui.games.cricket;

  it("BOWL reads RELEASE during the run-up, and the picked line is the pressed one", () => {
    const ready = buildCricket3dControls(ui, { phase: "ready", aim: "middle", speedKmh: null });
    expect(ready.bowl).toEqual({ label: copy.bowl, labelPhone: copy.bowlPhone });
    expect(ready.lines.options.map((o) => [o.label, o.pressed])).toEqual([
      [copy.line.off, false],
      [copy.line.middle, true],
      [copy.line.leg, false],
    ]);
    const runup = buildCricket3dControls(ui, { phase: "runup", aim: "off", speedKmh: null });
    expect(runup.bowl).toEqual({ label: copy.release, labelPhone: copy.releasePhone });
    expect(runup.lines.options.find((o) => o.pressed)?.id).toBe("off");
  });

  it("the speed gun reads 143 KM/H once a ball is bowled, and nothing before", () => {
    expect(
      buildCricket3dControls(ui, { phase: "ready", aim: "leg", speedKmh: null }).speed,
    ).toBeNull();
    expect(buildCricket3dControls(ui, { phase: "flight", aim: "leg", speedKmh: 143 }).speed).toBe(
      `143 ${ui.games.kmh}`,
    );
  });
});
