import { describe, expect, it } from "vitest";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { BADMINTON_START_STATE, playRally, type BadmintonState } from "./referee";
import type { Judged } from "../engine/pick";
import { MATCH_START, needsSecond, playRally as playRally3d, type MatchState } from "./3d/match";
import {
  buildBadminton3dView,
  buildBadmintonView,
  type Badminton3dPhase,
  type BadmintonPhase,
} from "./view";

/** The phone's quiet third link at the end. */
const HUB = { label: "BACK TO THE HUB", to: "/arena" };

/** Powers that land in each zone, none of them the perfect band. */
const SMASH = 85;
const CLEAR = 50;
const DROP = 30;
/** A drop in the perfect-weight band. */
const PERFECT = 23;

/** Plays powers in order. */
const play = (powers: number[]): BadmintonState =>
  powers.reduce((s, p) => playRally(s, p), BADMINTON_START_STATE);

const view = (
  state: BadmintonState,
  opts: { phase?: BadmintonPhase; offerHighlight?: boolean; fullTime?: boolean } = {},
  c = content,
) =>
  buildBadmintonView(c, ui, ROUTES, state, {
    phase: opts.phase ?? "ready",
    offerHighlight: opts.offerHighlight ?? false,
    fullTime: opts.fullTime ?? false,
  });

describe("buildBadmintonView", () => {
  it("reads the fresh game: 17-19, rally 1, every group still to come", () => {
    const v = view(BADMINTON_START_STATE);
    expect(v.bug).toEqual({
      label: "Score",
      name: "YASH",
      yash: "17",
      you: "19",
      away: "YOU",
      status: "RALLY 1",
      statusPhone: "RALLY 1/4",
      phoneBadge: false,
      alert: false,
    });
    expect(v.toasts).toEqual([
      { state: "next", label: "BACKEND", hint: "UP NEXT · RALLY 1" },
      { state: "later", label: "FRONTEND", hint: "RALLY 2" },
      { state: "later", label: "DATA", hint: "RALLY 3" },
      { state: "later", label: "CRAFT", hint: "RALLY 4" },
    ]);
    expect(v.latest).toBeNull();
    expect(v.comm).toBe(ui.games.badminton.comm.start);
    expect(v.spotlight).toBeNull();
    expect(v.announce).toBe("");
    expect(v.end).toBeNull();
    expect(v.reading).toBe("YASH · READING YOUR GRIP");
    expect(v.hold).toEqual({ label: "HOLD · RELEASE", phoneHint: ui.games.badminton.phoneHint });
    expect(v.heading).toBe("SMASH OR CLEAR");
    expect(v.meter.label).toBe("SHOT POWER");
    expect(v.meter.zones).toEqual({ smashFrom: 80, dividerAt: 40 });
    expect(v.meter.legend.map((l) => [l.name, l.tone])).toEqual([
      ["SMASH", "volt"],
      ["CLEAR", "floodlight"],
      ["DROP", "scout"],
    ]);
  });

  it("reads the artboard's state: three rallies played, MATCH POINT, the newest charge accented", () => {
    const v = view(play([CLEAR, SMASH, DROP]));
    expect(v.bug).toMatchObject({
      yash: "20",
      you: "19",
      status: "MATCH POINT",
      statusPhone: "MATCH POINT",
      phoneBadge: true,
      alert: true,
    });
    expect(v.toasts).toEqual([
      {
        state: "charged",
        eyebrow: "ATTRIBUTE CHARGED · RALLY 1",
        tag: "SMASH",
        title: "BACKEND",
        chips: ["Java", "Spring Boot", "JUnit"],
        accent: false,
      },
      {
        state: "charged",
        eyebrow: "ATTRIBUTE CHARGED · RALLY 2",
        tag: "DROP SHOT",
        title: "FRONTEND",
        chips: ["React", "Redux"],
        accent: false,
      },
      {
        state: "charged",
        eyebrow: "ATTRIBUTE CHARGED · RALLY 3",
        tag: "DEFENCE",
        title: "DATA",
        chips: ["Oracle", "SQL"],
        accent: true,
      },
      { state: "next", label: "CRAFT", hint: "UP NEXT · RALLY 4" },
    ]);
    expect(v.latest).toEqual({
      eyebrow: "ATTRIBUTE CHARGED · RALLY 3",
      title: "DATA",
      meta: "Oracle · SQL",
    });
    expect(v.comm).toBe("Match point. He's done this before.");
  });

  it("counts the rallies up to match point: 18-19 and 19-19 are plain RALLY n", () => {
    const one = view(play([CLEAR]));
    expect(one.bug).toMatchObject({ yash: "18", status: "RALLY 2", statusPhone: "RALLY 2/4" });
    expect(one.bug.phoneBadge).toBe(false);
    expect(one.bug.alert).toBe(false);
    expect(one.toasts[1]).toEqual({ state: "next", label: "FRONTEND", hint: "UP NEXT · RALLY 2" });
    expect(one.toasts[2]).toEqual({ state: "later", label: "DATA", hint: "RALLY 3" });
    expect(one.latest?.title).toBe("BACKEND");
    expect(one.comm).toBe(ui.games.badminton.comm.rally);
    const two = view(play([CLEAR, SMASH]));
    expect(two.bug).toMatchObject({ yash: "19", status: "RALLY 3" });
    expect(two.toasts[2]).toEqual({ state: "next", label: "DATA", hint: "UP NEXT · RALLY 3" });
  });

  it("puts the group a rally charged in the spotlight: its eyebrow, title and skills, going right", () => {
    const called = (powers: number[], phase: BadmintonPhase = "called") =>
      view(play(powers), { phase }).spotlight;
    const backend = {
      kind: "unlock",
      eyebrow: "ATTRIBUTE CHARGED · RALLY 1",
      title: "BACKEND",
      line: "Java · Spring Boot · JUnit",
      to: "right",
    };
    // Every shot charges the same way: no shot word, only the work.
    for (const power of [SMASH, CLEAR, DROP, PERFECT]) expect(called([power])).toEqual(backend);
    expect(called([CLEAR, SMASH])).toMatchObject({ title: "FRONTEND", line: "React · Redux" });
    expect(called([PERFECT], "verdict")).toEqual(backend);
    // Only while it is being called.
    expect(called([SMASH], "ready")).toBeNull();
    expect(called([SMASH], "charging")).toBeNull();
    expect(called([SMASH], "flight")).toBeNull();
  });

  it("the newest toast and chip wait while the spotlight is up, and are back in the next phase", () => {
    const state = play([CLEAR, SMASH]);
    const up = view(state, { phase: "called" });
    expect(up.toasts.map((t) => t.state)).toEqual(["charged", "next", "later", "later"]);
    expect(up.toasts[0]).toMatchObject({ accent: true });
    expect(up.toasts[1]).toEqual({ state: "next", label: "FRONTEND", hint: "UP NEXT · RALLY 2" });
    expect(up.latest?.title).toBe("BACKEND");
    const after = view(state, { phase: "ready" });
    expect(after.toasts.map((t) => t.state)).toEqual(["charged", "charged", "next", "later"]);
    expect(after.latest?.title).toBe("FRONTEND");
    expect(view(play([CLEAR]), { phase: "called" }).latest).toBeNull();
  });

  it("says the rally's line: a perfect weight, a plain rally, match point", () => {
    expect(view(play([PERFECT])).comm).toBe(ui.games.badminton.comm.perfect);
    expect(view(play([DROP])).comm).toBe(ui.games.badminton.comm.rally);
    // Match point takes the line over, whatever the third rally was.
    expect(view(play([PERFECT, PERFECT, PERFECT])).comm).toBe(ui.games.badminton.comm.matchPoint);
  });

  it("announces what it charged, with no shot word", () => {
    expect(view(play([SMASH])).announce).toBe(
      "Attribute charged, rally 1: BACKEND, Java, Spring Boot, JUnit",
    );
    expect(view(play([SMASH, CLEAR])).announce).toBe(
      "Attribute charged, rally 2: FRONTEND, React, Redux",
    );
  });

  it("ends a lost game 21-19: GAME YASH, the attributes page and a rematch", () => {
    const v = view(play([CLEAR, SMASH, DROP, DROP]), { phase: "end" });
    expect(v.bug).toMatchObject({
      yash: "21",
      you: "19",
      status: "GAME YASH",
      statusPhone: "GAME YASH",
      phoneBadge: true,
      alert: false,
    });
    expect(v.saved).toBe("21–19");
    expect(v.end).toEqual({
      primary: { label: "SEE PLAYER ATTRIBUTES", to: ROUTES.attributes },
      again: "REMATCH",
      next: null,
      hub: HUB,
    });
    expect(v.comm).toBe(content.commentary.yashWins[0]);
    expect(v.toasts.every((t) => t.state === "charged")).toBe(true);
    expect(v.toasts.map((t) => t.state === "charged" && t.accent)).toEqual([
      false,
      false,
      false,
      true,
    ]);
  });

  it("offers the highlight instead after a second loss (G9)", () => {
    const v = view(play([CLEAR, SMASH, DROP, DROP]), { phase: "end", offerHighlight: true });
    expect(v.end?.primary).toEqual({ label: ui.games.highlight, to: ROUTES.attributes });
    expect(v.end?.again).toBe("REMATCH");
  });

  it("four perfect drops still end 21–19, and the last rally still charges Craft (F1)", () => {
    const v = view(play([PERFECT, PERFECT, PERFECT, PERFECT]), { phase: "end" });
    expect(v.bug).toMatchObject({ yash: "21", you: "19", status: "GAME YASH", alert: false });
    expect(v.saved).toBe("21–19");
    // Its spotlight holds through the verdict (the toast waits); at the end it has left and all four toasts stand.
    expect(v.spotlight).toBeNull();
    expect(v.toasts.every((t) => t.state === "charged")).toBe(true);
    const verdict = view(play([PERFECT, PERFECT, PERFECT, PERFECT]), { phase: "verdict" });
    expect(verdict.spotlight).toMatchObject({ kind: "unlock", title: "CRAFT" });
    expect(verdict.toasts[3]).toMatchObject({ state: "next", label: "CRAFT" });
    expect(v.end?.primary).toEqual({ label: "SEE PLAYER ATTRIBUTES", to: ROUTES.attributes });
    expect(v.comm).toBe(content.commentary.yashWins[0]);
    expect(JSON.stringify(v)).not.toMatch(/CLAIM|BOWLED|BROKE|GETS THROUGH/);
  });

  it("once all three venues are played, the main button stays the venue's page (or the highlight offer) and SEE FULL TIME is the quiet third link (F3)", () => {
    const state = play([CLEAR, SMASH, DROP, DROP]);
    for (const offerHighlight of [false, true]) {
      expect(view(state, { phase: "end", offerHighlight, fullTime: true }).end).toEqual({
        primary: {
          label: offerHighlight ? "WATCH THE HIGHLIGHT INSTEAD" : "SEE PLAYER ATTRIBUTES",
          to: ROUTES.attributes,
        },
        again: "REMATCH",
        next: { label: "SEE FULL TIME", to: "/arena/full-time" },
        hub: HUB,
      });
    }
  });

  it("takes the groups from the content, in its order, however many there are", () => {
    const groups = content.playerAttributes.groups;
    const renamed = {
      ...content,
      playerAttributes: {
        ...content.playerAttributes,
        groups: [groups[3]!, groups[2]!, groups[1]!, groups[0]!, groups[0]!],
      },
    };
    const v = view(play([CLEAR]), {}, renamed);
    expect(v.toasts).toHaveLength(4);
    expect(v.toasts[0]).toMatchObject({ title: "CRAFT", tag: "COURT VISION" });
    expect(v.toasts[1]).toMatchObject({ state: "next", label: "DATA" });
  });

  it("never says LOCKED, in any state (spec 11.2 #24)", () => {
    const states = [
      BADMINTON_START_STATE,
      play([CLEAR]),
      play([CLEAR, SMASH, DROP]),
      play([CLEAR, SMASH, DROP, DROP]),
      play([PERFECT, PERFECT, PERFECT, PERFECT]),
    ];
    const phases: BadmintonPhase[] = ["ready", "charging", "flight", "called", "verdict", "end"];
    for (const state of states) {
      for (const phase of phases) {
        expect(JSON.stringify(view(state, { phase }))).not.toMatch(/locked/i);
      }
    }
  });
  it("m-4: the announcer says how the game ended, once it is over, and not before", () => {
    expect(view(play([CLEAR])).announce).not.toMatch(/21|game yash/i);
    expect(view(play([CLEAR, SMASH, DROP, DROP]), { phase: "verdict" }).announce).toMatch(
      /\. Game yash\. 21–19\.$/,
    );
    expect(view(play([PERFECT, PERFECT, PERFECT, PERFECT]), { phase: "verdict" }).announce).toMatch(
      /\. Game yash\. 21–19\.$/,
    );
  });
});

describe("buildBadminton3dView", () => {
  const perfect: Judged = { q: "perfect", call: "perfect" };
  const late: Judged = { q: "miss", call: "late" };
  const wrong: Judged = { q: "miss", call: "wrong" };
  /** Plays rallies in order, each a list of picks. */
  const play3d = (...rallies: Judged[][]): MatchState =>
    rallies.reduce((s, picks) => playRally3d(s, picks), MATCH_START);
  /** A whole game of perfect picks: 22–20. */
  const allPerfect = (): MatchState => {
    let s = MATCH_START;
    while (s.rallies.length < 6) {
      s = playRally3d(s, needsSecond(s, perfect) ? [perfect, perfect] : [perfect]);
    }
    return s;
  };
  /** A rally you win (from 19, outside the Data rally), or the OUT rally once you are on 20. */
  const yours = [perfect, perfect];
  const view3d = (
    state: MatchState,
    opts: { phase?: Badminton3dPhase; open?: "deep" | "short" | null; fullTime?: boolean } = {},
  ) =>
    buildBadminton3dView(content, ui, ROUTES, state, {
      phase: opts.phase ?? "ready",
      open: opts.open ?? null,
      offerHighlight: false,
      fullTime: opts.fullTime ?? false,
    });

  it("3D: before the first rally the bug reads 17–19 and RALLY 1; nothing is called or charged", () => {
    const v = view3d(MATCH_START);
    expect(v.bug).toEqual({
      label: "Score",
      name: "YASH",
      yash: "17",
      you: "19",
      away: "YOU",
      status: "RALLY 1",
      statusPhone: "RALLY 1",
      phoneBadge: false,
      alert: false,
    });
    expect(v.toasts).toEqual([
      { state: "next", label: "BACKEND", hint: "UP NEXT" },
      { state: "later", label: "FRONTEND", hint: "DROP SHOT" },
      { state: "later", label: "DATA", hint: "DEFENCE" },
      { state: "later", label: "CRAFT", hint: "COURT VISION" },
    ]);
    expect(v.latest).toBeNull();
    expect(v.spotlight).toBeNull();
    expect(v.announce).toBe("");
    expect(v.end).toBeNull();
    expect(v.three.speed).toBeNull();
    expect(v.comm).toBe(content.commentary.entrance[0]);
    expect(v.three).toMatchObject({
      how: "Send it where he isn't: deep or short.",
      keys: "↑ ↓",
      hint: { stage: "↑ ↓ OR CLICK", phone: "TAP OR SWIPE ↑ ↓" },
      progress: "HIS RALLIES CHARGE THE ATTRIBUTES",
      loading: "PREPARING THE HALL",
    });
    // The 2D parts are kept, not drawn.
    expect(v.meter.label).toBe("SHOT POWER");
    expect(v.reading).toBe("YASH · READING YOUR GRIP");
  });

  it("3D: the status reads MATCH POINT at 20–19 (alert), YOUR MATCH POINT at 17–20 (alert), 20 ALL at 20–20, and GAME YASH at the end", () => {
    const at = (state: MatchState) => view3d(state).bug;
    expect(at(play3d([late], [late], [late]))).toMatchObject({
      yash: "20",
      you: "19",
      status: "MATCH POINT",
      statusPhone: "MATCH POINT",
      phoneBadge: true,
      alert: true,
    });
    expect(at(play3d(yours))).toMatchObject({
      yash: "17",
      you: "20",
      status: "YOUR MATCH POINT",
      phoneBadge: true,
      alert: true,
    });
    expect(at(play3d(yours, [late], [late], [late]))).toMatchObject({
      yash: "20",
      you: "20",
      status: "20 ALL",
      phoneBadge: true,
      alert: false,
    });
    expect(at(play3d(yours, [late], [late], [late], [late]))).toMatchObject({
      status: "MATCH POINT",
      alert: true,
    });
    expect(at(play3d([late], [late], [late], [late]))).toMatchObject({
      yash: "21",
      status: "GAME YASH",
      statusPhone: "GAME YASH",
      phoneBadge: true,
      alert: false,
    });
    expect(at(play3d([late])).status).toBe("RALLY 2");
  });

  it("3D: the aims are ↓ DROP then ↑ SMASH; in a window the open one is lit, reads OPEN COURT and is named 'Send it deep: smash — open court'", () => {
    const idle = view3d(MATCH_START).three.aims;
    expect(idle).toEqual([
      {
        dir: "short",
        arrow: "↓",
        shot: "↓ DROP",
        label: "↓ DROP",
        name: "Send it short: drop",
        open: false,
      },
      {
        dir: "deep",
        arrow: "↑",
        shot: "↑ SMASH",
        label: "↑ SMASH",
        name: "Send it deep: smash",
        open: false,
      },
    ]);
    const lit = view3d(MATCH_START, { phase: "window", open: "deep" }).three.aims;
    expect(lit[1]).toEqual({
      dir: "deep",
      arrow: "↑",
      shot: "↑ SMASH",
      label: "↑ OPEN COURT",
      name: "Send it deep: smash — open court",
      open: true,
    });
    expect(lit[0]!.open).toBe(false);
    // Nothing is lit outside a window, whatever is open.
    expect(view3d(MATCH_START, { phase: "rally", open: "deep" }).three.aims).toEqual(idle);
  });

  it("3D: the toasts charge in content order, each eyebrow naming the rally that charged it; the next reads UP NEXT and the later ones their shot", () => {
    // Your win is rally 1; Yash's wins are rallies 2 and 3 (the OUT charges Backend).
    const v = view3d(play3d(yours, yours, [late]));
    expect(v.toasts).toEqual([
      {
        state: "charged",
        eyebrow: "ATTRIBUTE CHARGED · RALLY 2",
        tag: "SMASH",
        title: "BACKEND",
        chips: ["Java", "Spring Boot", "JUnit"],
        accent: false,
      },
      {
        state: "charged",
        eyebrow: "ATTRIBUTE CHARGED · RALLY 3",
        tag: "DROP SHOT",
        title: "FRONTEND",
        chips: ["React", "Redux"],
        accent: true,
      },
      { state: "next", label: "DATA", hint: "UP NEXT" },
      { state: "later", label: "CRAFT", hint: "COURT VISION" },
    ]);
    expect(v.latest).toEqual({
      eyebrow: "ATTRIBUTE CHARGED · RALLY 3",
      title: "FRONTEND",
      meta: "React · Redux",
    });
  });

  it("3D: Yash's charging rally puts its group in the spotlight; the toast and chip wait, then return", () => {
    const state = play3d(yours, yours, [late]);
    const up = view3d(state, { phase: "called" });
    expect(up.spotlight).toEqual({
      kind: "unlock",
      eyebrow: "ATTRIBUTE CHARGED · RALLY 3",
      title: "FRONTEND",
      line: "React · Redux",
      to: "right",
    });
    expect(up.toasts.map((t) => t.state)).toEqual(["charged", "next", "later", "later"]);
    expect(up.latest?.title).toBe("BACKEND");
    const after = view3d(state, { phase: "ready" });
    expect(after.toasts.map((t) => t.state)).toEqual(["charged", "charged", "next", "later"]);
    expect(after.latest?.title).toBe("FRONTEND");
    expect(after.spotlight).toBeNull();
    expect(view3d(state, { phase: "rally" }).spotlight).toBeNull();
  });

  it("3D: your rally says WELL PLAYED. and charges nothing", () => {
    const v = view3d(play3d(yours), { phase: "called" });
    expect(v.spotlight).toEqual({ kind: "yours", text: "WELL PLAYED." });
    expect(v.toasts.every((t) => t.state !== "charged")).toBe(true);
  });

  it("3D: the last rally can charge the last group and end the game: the spotlight holds through the verdict, then the end", () => {
    const v = view3d(play3d([late], [late], [late], [late]), { phase: "end" });
    expect(v.spotlight).toBeNull();
    expect(v.end).not.toBeNull();
    expect(v.toasts[3]).toMatchObject({ state: "charged", title: "CRAFT" });
    // The game ends with the spotlight up: the verdict holds it, and the Craft toast waits for it to leave.
    const up = view3d(play3d([late], [late], [late], [late]), { phase: "verdict" });
    expect(up.spotlight).toMatchObject({ kind: "unlock", title: "CRAFT" });
    expect(up.toasts[3]).toMatchObject({ state: "next", label: "CRAFT" });
  });

  it("3D: comm after a smash win is 'Jump smash. Backend charged.'; after your miss, 'Backend charged.'; after the OUT, 'Hawk-Eye says out. By a whisker. Backend charged anyway.'", () => {
    expect(view3d(play3d([wrong])).comm).toBe("Jump smash. Backend charged.");
    expect(view3d(play3d([wrong], [wrong])).comm).toBe(
      "Drop shot. Dead at the net. Frontend charged.",
    );
    // Too late (or too early) he plays no card shot: the line names none.
    expect(view3d(play3d([late])).comm).toBe("Backend charged.");
    expect(view3d(play3d(yours, yours)).comm).toBe(
      "Hawk-Eye says out. By a whisker. Backend charged anyway.",
    );
    expect(view3d(play3d(yours)).comm).toBe(ui.games.tennis.three.comm.yourPoint);
    // Your rally that makes it 20 all.
    expect(view3d(play3d([late], [late], [late], yours)).comm).toBe("Twenty all. Nerves of steel.");
    expect(view3d(play3d([late], [late], [late], [late])).comm).toBe(
      ui.games.tennis.three.comm.game,
    );
  });

  it("3D: the speed line reads YASH · SMASH · 348 KM/H only while a smash win is called", () => {
    const smash = play3d([wrong]);
    expect(view3d(smash, { phase: "called" }).three.speed).toBe("YASH · SMASH · 348 KM/H");
    // Your miss: he smashed nothing.
    expect(view3d(play3d([late]), { phase: "called" }).three.speed).toBeNull();
    expect(view3d(smash, { phase: "verdict" }).three.speed).toBe("YASH · SMASH · 348 KM/H");
    expect(view3d(smash, { phase: "ready" }).three.speed).toBeNull();
    expect(view3d(smash, { phase: "rally" }).three.speed).toBeNull();
    expect(view3d(play3d([wrong], [wrong]), { phase: "called" }).three.speed).toBeNull();
    // The OUT rally is Yash's win by a call, not a smash.
    expect(view3d(play3d(yours, yours), { phase: "called" }).three.speed).toBeNull();
    // The final smash reads 365.
    expect(view3d(allPerfect(), { phase: "end" }).three.speed).toBe("YASH · SMASH · 365 KM/H");
  });

  it("3D: saved is the real score: 21–19, or 22–20", () => {
    expect(view3d(play3d([late], [late], [late], [late]), { phase: "end" }).saved).toBe("21–19");
    expect(view3d(allPerfect(), { phase: "end" }).saved).toBe("22–20");
    expect(view3d(allPerfect(), { phase: "end" }).end?.again).toBe("REMATCH");
  });

  it("3D: the announcement is the score, then what was charged: '18–19. Backend charged: Java, Spring Boot, JUnit.'", () => {
    expect(view3d(play3d([late])).announce).toBe(
      "18–19. Backend charged: Java, Spring Boot, JUnit.",
    );
    // Your rally charges nothing, and says the visitor's words.
    expect(view3d(play3d(yours)).announce).toBe("WELL PLAYED. 17–20.");
    // The end adds how the game ended.
    expect(view3d(play3d([late], [late], [late], [late]), { phase: "end" }).announce).toMatch(
      /^21–19\. Craft charged: .+\. Game yash\.$/,
    );
  });

  it("3D: the announcer says none of the shot words", () => {
    const states = [
      play3d([late]),
      play3d([wrong]),
      play3d([wrong], [wrong]),
      play3d(yours, yours),
      play3d(yours),
      allPerfect(),
    ];
    for (const state of states)
      expect(view3d(state, { phase: "called" }).announce).not.toMatch(
        /WINNER|OUT\.|WRONG|TOO LATE|TOO EARLY|HE READ IT|DIVE/,
      );
  });
});
