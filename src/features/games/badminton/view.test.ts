import { describe, expect, it } from "vitest";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { BADMINTON_START_STATE, playRally, type BadmintonState } from "./referee";
import { buildBadmintonView, type BadmintonPhase } from "./view";

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
    expect(v.call).toBeNull();
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

  it("calls each rally: the shot, or the perfect weight", () => {
    const called = (powers: number[], phase: BadmintonPhase = "called") =>
      view(play(powers), { phase }).call;
    expect(called([SMASH])).toEqual({ text: "HE READS IT.", tone: "floodlight" });
    expect(called([CLEAR])).toEqual({ text: "BACK LINE. STILL HIS.", tone: "floodlight" });
    expect(called([DROP])).toEqual({ text: "AT THE NET. STILL HIS.", tone: "floodlight" });
    expect(called([PERFECT])).toEqual({ text: "PERFECT WEIGHT.", tone: "volt" });
    expect(called([PERFECT], "verdict")?.text).toBe("PERFECT WEIGHT.");
    // The call is made only while it is being called.
    expect(called([SMASH], "ready")).toBeNull();
    expect(called([SMASH], "charging")).toBeNull();
    expect(called([SMASH], "flight")).toBeNull();
  });

  it("says the rally's line: a perfect weight, a plain rally, match point", () => {
    expect(view(play([PERFECT])).comm).toBe(ui.games.badminton.comm.perfect);
    expect(view(play([DROP])).comm).toBe(ui.games.badminton.comm.rally);
    // Match point takes the line over, whatever the third rally was.
    expect(view(play([PERFECT, PERFECT, PERFECT])).comm).toBe(ui.games.badminton.comm.matchPoint);
  });

  it("announces the call and what it charged", () => {
    expect(view(play([SMASH])).announce).toBe(
      "HE READS IT. Attribute charged, rally 1: BACKEND, Java, Spring Boot, JUnit",
    );
    expect(view(play([SMASH, CLEAR])).announce).toBe(
      "BACK LINE. STILL HIS. Attribute charged, rally 2: FRONTEND, React, Redux",
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

  it("four perfect drops still end 21–19: the last call is the shot (F1)", () => {
    const v = view(play([PERFECT, PERFECT, PERFECT, PERFECT]), { phase: "end" });
    expect(v.bug).toMatchObject({ yash: "21", you: "19", status: "GAME YASH", alert: false });
    expect(v.saved).toBe("21–19");
    expect(v.call).toEqual({ text: "AT THE NET. STILL HIS.", tone: "floodlight" });
    expect(v.end?.primary).toEqual({ label: "SEE PLAYER ATTRIBUTES", to: ROUTES.attributes });
    expect(v.comm).toBe(content.commentary.yashWins[0]);
    expect(JSON.stringify(v)).not.toMatch(/CLAIM|BOWLED|BROKE|GETS THROUGH/);
  });

  it("once all three venues are played, the main button is SEE FULL TIME, ahead of the highlight (F3)", () => {
    const state = play([CLEAR, SMASH, DROP, DROP]);
    for (const offerHighlight of [false, true]) {
      expect(view(state, { phase: "end", offerHighlight, fullTime: true }).end).toEqual({
        primary: { label: "SEE FULL TIME", to: "/arena/full-time" },
        again: "REMATCH",
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
