import { describe, expect, it } from "vitest";
import { content, getHighlights, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { MATCH_START, playPoint, type MatchState } from "./3d/match";
import {
  playReturn,
  TENNIS_START,
  type ReturnPick,
  type Side,
  type TennisReturn,
  type TennisState,
} from "./referee";
import { buildTennis3dView, buildTennisView, type Tennis3dPhase, type TennisPhase } from "./view";

const GOOD: ReturnPick = { side: "right", atMs: 600 };
const PERFECT: ReturnPick = { side: "right", atMs: 100 };
const ACE: ReturnPick = { side: null, atMs: 9999 };

/** The phone's quiet third link at the end. */
const HUB = { label: "BACK TO THE HUB", to: "/arena" };

/** Plays picks in order on serves that open on `open`. */
const play = (picks: ReturnPick[], open: Side = "right"): TennisState =>
  picks.reduce(
    (s, pick) => playReturn({ ...s, serve: { open, tossMs: 500 } }, pick, "stage"),
    TENNIS_START,
  );
/** A serve in the air on top of what has been played. */
const serving = (s: TennisState, open: Side = "right"): TennisState => ({
  ...s,
  serve: { open, tossMs: 500 },
});

const view = (
  state: TennisState,
  opts: { phase?: TennisPhase; offerHighlight?: boolean; fullTime?: boolean } = {},
  c = content,
) =>
  buildTennisView(c, ui, ROUTES, state, {
    phase: opts.phase ?? "tell",
    offerHighlight: opts.offerHighlight ?? false,
    fullTime: opts.fullTime ?? false,
  });

describe("buildTennisView", () => {
  it("reads the fresh court: 15 all, rally 1, nothing unlocked", () => {
    const v = view(TENNIS_START, { phase: "ready" });
    expect(v.bug).toMatchObject({
      name: "YASH",
      yash: "15",
      you: "15",
      away: "YOU",
      status: "RALLY 1",
      statusPhone: "RALLY 1/3",
    });
    expect(v.serving).toBe("YASH · SERVING · 178 KM/H");
    expect(v.cards).toEqual([]);
    expect(v.latest).toBeNull();
    expect(v.marquee.map((m) => m.text)).toEqual([
      "MATCH HIGHLIGHTS · 0 / 3 UNLOCKED",
      "QUARTER-FINAL IS NEXT",
      "CENTRE COURT",
    ]);
    expect(v.progress.bars).toEqual(["current", "todo", "todo"]);
    expect(v.progress.label).toBe("EACH RETURN UNLOCKS A HIGHLIGHT");
    expect(v.comm).toBe(content.commentary.entrance[0]);
    expect(v.spotlight).toBeNull();
    expect(v.announce).toBe("");
    expect(v.end).toBeNull();
    expect(v.heading).toBe("RETURN OF SERVE");
    expect(v.instructions).toEqual({
      title: "RETURN OF SERVE",
      how: "Pick the open side before the bounce.",
      keys: "← →",
      tap: "or tap a side.",
      phoneHint: "SWIPE OR TAP THE OPEN SIDE",
    });
    expect(v.chrome.skip).toEqual({
      label: "SKIP TO MATCH HIGHLIGHTS",
      short: "SKIP",
      to: "/highlights",
    });
  });

  it("lights no side until a serve is in play", () => {
    const v = view(TENNIS_START, { phase: "ready" });
    expect(v.aims.map((a) => [a.side, a.label, a.name, a.open])).toEqual([
      ["left", "← LEFT", "Return to the left", false],
      ["right", "RIGHT →", "Return to the right", false],
    ]);
  });

  it("the board's state: rally 3 in play, open right, two returns (good, perfect)", () => {
    const v = view(serving(play([GOOD, PERFECT])), { phase: "tell" });
    expect(v.bug).toMatchObject({
      yash: "40",
      you: "30",
      status: "RALLY 3",
      statusPhone: "RALLY 3/3",
    });
    expect(v.serving).toBe("YASH · SERVING · 194 KM/H");
    expect(v.aims.map((a) => [a.side, a.label, a.name, a.open])).toEqual([
      ["left", "← LEFT", "Return to the left", false],
      ["right", "OPEN COURT →", "Return to the right — open court", true],
    ]);
    expect(v.cards).toEqual([
      {
        side: "left",
        eyebrow: "HIGHLIGHT 01 · QF",
        tag: "RALLY 1",
        media: "[SCREEN RECORDING]",
        title: "POWER BI DASHBOARD",
        line: "An analytics-driven web platform with interactive Power BI dashboards embedded inside it.",
        moved: false,
      },
      {
        side: "right",
        eyebrow: "HIGHLIGHT 02 · SF",
        tag: "RALLY 2",
        media: "[SCREEN RECORDING]",
        title: "KUDO BOARD",
        line: "A recognition platform celebrating individual and team wins for 10,000+ employees.",
        moved: false,
      },
    ]);
    expect(v.marquee).toEqual([
      { text: "MATCH HIGHLIGHTS · 2 / 3 UNLOCKED", tone: "volt" },
      { text: "ANOTHER PROJECT SHIPPED", tone: "floodlight" },
      { text: "MATCH POINT · THE FINAL IS NEXT", tone: "volt" },
      { text: "CENTRE COURT", tone: "floodlight" },
    ]);
    expect(v.progress.bars).toEqual(["done", "done", "current"]);
    expect(v.latest).toEqual({
      eyebrow: "HIGHLIGHT 02 · SF UNLOCKED",
      title: "KUDO BOARD",
      meta: "A recognition platform celebrating individual and team wins for 10,000+ employees.",
    });
    expect(v.comm).toBe(ui.games.tennis.comm.shipped);
  });

  it("walks the serve speed up and the next round along", () => {
    expect(view(serving(TENNIS_START)).serving).toBe("YASH · SERVING · 178 KM/H");
    expect(view(serving(play([GOOD]))).serving).toBe("YASH · SERVING · 186 KM/H");
    const one = view(play([GOOD]));
    expect(one.marquee.map((m) => m.text)).toEqual([
      "MATCH HIGHLIGHTS · 1 / 3 UNLOCKED",
      "ANOTHER PROJECT SHIPPED",
      "SEMI-FINAL IS NEXT",
      "CENTRE COURT",
    ]);
    expect(one.bug).toMatchObject({ yash: "30", you: "15", status: "RALLY 2" });
  });

  it("the open side is on the left when the serve opens left", () => {
    const v = view(serving(TENNIS_START, "left"), { phase: "window" });
    expect(v.aims.map((a) => [a.label, a.name, a.open])).toEqual([
      ["← OPEN COURT", "Return to the left — open court", true],
      ["RIGHT →", "Return to the right", false],
    ]);
  });

  it("lights the open side from the tell to the end of the window, and no longer", () => {
    const state = serving(TENNIS_START);
    const lit = (phase: TennisPhase) => view(state, { phase }).aims.some((a) => a.open);
    expect(lit("tell")).toBe(true);
    expect(lit("toss")).toBe(true);
    expect(lit("window")).toBe(true);
    expect(lit("ready")).toBe(false);
    expect(lit("called")).toBe(false);
  });

  it("puts the project a return unlocked in the spotlight, with its result, and says what it unlocked", () => {
    const state = play([PERFECT]);
    expect(view(state, { phase: "tell" }).spotlight).toBeNull();
    const first = content.matchHighlights.find((h) => h.name === "Power BI Dashboard")!;
    expect(view(state, { phase: "called" }).spotlight).toEqual({
      kind: "unlock",
      eyebrow: "HIGHLIGHT 01 · QF",
      title: "POWER BI DASHBOARD",
      line: first.winner,
      to: "left",
    });
    expect(view(state, { phase: "called" }).announce).toBe(
      "Highlight 01 unlocked: POWER BI DASHBOARD, An analytics-driven web platform with interactive Power BI dashboards embedded inside it.",
    );
    // a miss is still his point: the project is unlocked all the same
    expect(view(play([ACE]), { phase: "called" }).spotlight).toMatchObject({ kind: "unlock" });
    expect(view(play([ACE]), { phase: "called" }).comm).toBe(ui.games.tennis.comm.missed);
  });

  it("the second card's spotlight goes right, the third left, each with its project's result", () => {
    const highlights = getHighlights(content);
    for (const n of [1, 2, 3]) {
      const sp = view(play(Array(n).fill(GOOD)), { phase: "called" }).spotlight;
      expect(sp).toEqual({
        kind: "unlock",
        eyebrow: expect.stringContaining(`HIGHLIGHT 0${n}`),
        title: highlights[n - 1]!.name.toUpperCase(),
        line: highlights[n - 1]!.winner,
        to: n === 2 ? "right" : "left",
      });
    }
  });

  it("the newest card and chip wait while the spotlight is up, and are back in the next phase", () => {
    const state = play([GOOD, GOOD]);
    const up = view(state, { phase: "called" });
    expect(up.cards.map((c) => c.eyebrow)).toEqual(["HIGHLIGHT 01 · QF"]);
    expect(up.latest?.eyebrow).toBe("HIGHLIGHT 01 · QF UNLOCKED");
    const after = view(state, { phase: "tell" });
    expect(after.cards).toHaveLength(2);
    expect(after.latest?.eyebrow).toBe("HIGHLIGHT 02 · SF UNLOCKED");
    expect(view(play([GOOD]), { phase: "called" }).cards).toEqual([]);
  });

  it("a miss still reveals a card", () => {
    const v = view(play([ACE]), { phase: "tell" });
    expect(v.cards).toHaveLength(1);
    expect(v.cards[0]).toMatchObject({ eyebrow: "HIGHLIGHT 01 · QF", title: "POWER BI DASHBOARD" });
    expect(v.latest?.eyebrow).toBe("HIGHLIGHT 01 · QF UNLOCKED");
    expect(v.progress.bars).toEqual(["done", "current", "todo"]);
  });

  it("the third card goes to the left again", () => {
    const v = view(play([GOOD, GOOD, GOOD]), { phase: "end" });
    expect(v.cards.map((c) => [c.side, c.eyebrow, c.tag])).toEqual([
      ["left", "HIGHLIGHT 01 · QF", "RALLY 1"],
      ["right", "HIGHLIGHT 02 · SF", "RALLY 2"],
      ["left", "HIGHLIGHT 03 · F", "RALLY 3"],
    ]);
    expect(v.cards[2]!.title).toBe("AI INTERVIEW GROOMING PLATFORM");
    // The third card takes the drawn place on the left; the first moves up out of its way. The right one stays.
    expect(v.cards.map((c) => c.moved)).toEqual([true, false, false]);
  });

  it("the game ends GAME YASH, saved, with the highlights and a rematch", () => {
    const v = view(play([GOOD, GOOD, GOOD]), { phase: "end" });
    expect(v.bug).toMatchObject({
      yash: "40",
      you: "30",
      status: "GAME YASH",
      statusPhone: "GAME YASH",
    });
    expect(v.saved).toBe("GAME YASH");
    expect(v.comm).toBe(ui.games.tennis.comm.line);
    expect(v.marquee.map((m) => m.text)).toEqual([
      "MATCH HIGHLIGHTS · 3 / 3 UNLOCKED",
      "ANOTHER PROJECT SHIPPED",
      "ALL THREE ON THE BIG SCREEN",
      "CENTRE COURT",
    ]);
    expect(v.progress.bars).toEqual(["done", "done", "done"]);
    expect(v.end).toEqual({
      primary: { label: "SEE MATCH HIGHLIGHTS", to: "/highlights" },
      again: "REMATCH",
      next: null,
      hub: HUB,
    });
  });

  it("three perfect returns still end GAME YASH (F1)", () => {
    const v = view(play([PERFECT, PERFECT, PERFECT]), { phase: "end" });
    expect(v.bug).toMatchObject({ status: "GAME YASH", statusPhone: "GAME YASH" });
    expect(v.saved).toBe("GAME YASH");
    expect(v.comm).toBe(ui.games.tennis.comm.line);
    expect(v.end?.primary).toEqual({ label: "SEE MATCH HIGHLIGHTS", to: "/highlights" });
    expect(JSON.stringify(v)).not.toMatch(/CLAIM|BOWLED|BROKE|GETS THROUGH/);
  });

  it("once all three venues are played, the main button stays the venue's page (or the highlight offer) and SEE FULL TIME is the quiet third link (F3)", () => {
    const state = play([GOOD, GOOD, GOOD]);
    for (const offerHighlight of [false, true]) {
      expect(view(state, { phase: "end", offerHighlight, fullTime: true }).end).toEqual({
        primary: {
          label: offerHighlight ? "WATCH THE HIGHLIGHT INSTEAD" : "SEE MATCH HIGHLIGHTS",
          to: "/highlights",
        },
        again: "REMATCH",
        next: { label: "SEE FULL TIME", to: "/arena/full-time" },
        hub: HUB,
      });
    }
  });

  it("the second loss swaps the primary for the highlight, rematch stays", () => {
    const v = view(play([GOOD, GOOD, GOOD]), { phase: "end", offerHighlight: true });
    expect(v.end).toEqual({
      primary: { label: "WATCH THE HIGHLIGHT INSTEAD", to: "/highlights" },
      again: "REMATCH",
      next: null,
      hub: HUB,
    });
  });
  it("m-4: the announcer says how the game ended, once it is over, and not before", () => {
    expect(view(play([GOOD]), { phase: "called" }).announce).not.toMatch(/game yash/i);
    expect(view(play([GOOD, GOOD, GOOD]), { phase: "verdict" }).announce).toMatch(
      /\. Game yash\.$/,
    );
    expect(view(play([PERFECT, PERFECT, PERFECT]), { phase: "verdict" }).announce).toMatch(
      /\. Game yash\.$/,
    );
  });
});

describe("buildTennis3dView", () => {
  const three = ui.games.tennis.three;
  const ace: TennisReturn = { q: "miss", call: "ace" };
  const clean: TennisReturn = { q: "perfect", call: "clean" };
  const good: TennisReturn = { q: "good", call: "returned" };

  const played = (points: TennisReturn[][]): MatchState =>
    points.reduce((s, inputs) => playPoint(s, inputs), MATCH_START);
  const view3d = (state: MatchState, phase: Tennis3dPhase = "ready", open: Side | null = null) =>
    buildTennis3dView(content, ui, ROUTES, state, {
      phase,
      open,
      offerHighlight: false,
      fullTime: false,
    });

  it("reads the fresh court: 0 all, point 1, nothing unlocked", () => {
    const v = view3d(MATCH_START);
    expect(v.bug).toMatchObject({ yash: "0", you: "0", status: "POINT 1", statusPhone: "POINT 1" });
    expect(v.cards).toEqual([]);
    expect(v.spotlight).toBeNull();
    expect(v.serving).toMatch(/178 KM\/H$/);
    expect(v.comm).toBe(content.commentary.entrance[0]);
    const lit = view3d(MATCH_START, "window", "left").aims[0];
    expect(lit.open).toBe(true);
    expect(lit.name).toMatch(/open court$/);
  });

  it("after an ace: 15–0, the project in the spotlight, and its card once the spotlight has left", () => {
    const up = view3d(played([[ace]]), "called");
    expect(up.bug).toMatchObject({ yash: "15", you: "0" });
    const [first] = getHighlights(content);
    expect(up.spotlight).toEqual({
      kind: "unlock",
      eyebrow: "HIGHLIGHT 01 · QF",
      title: "POWER BI DASHBOARD",
      line: first!.winner,
      to: "left",
    });
    expect(up.cards).toEqual([]);
    expect(up.latest).toBeNull();
    const v = view3d(played([[ace]]), "ready");
    expect(v.spotlight).toBeNull();
    expect(v.cards.map((c) => [c.eyebrow, c.tag])).toEqual([["HIGHLIGHT 01 · QF", "POINT 1"]]);
    expect(v.cards[0]!.title).toBe(up.spotlight && "title" in up.spotlight && up.spotlight.title);
    expect(v.comm).toBe(ui.games.tennis.comm.missed);
  });

  it("after your point: 0–15, no card, WELL PLAYED.", () => {
    const v = view3d(played([[clean, clean]]), "called");
    expect(v.bug).toMatchObject({ yash: "0", you: "15" });
    expect(v.cards).toEqual([]);
    expect(v.spotlight).toEqual({ kind: "yours", text: "WELL PLAYED." });
    expect(v.comm).toBe(three.comm.yourPoint);
  });

  it("your 1st and 2nd points (the most you can win) say WELL PLAYED. then GOOD POINT.", () => {
    const win = [clean, clean];
    expect(view3d(played([win]), "called").spotlight).toEqual({
      kind: "yours",
      text: "WELL PLAYED.",
    });
    expect(view3d(played([win, [ace], win]), "called").spotlight).toEqual({
      kind: "yours",
      text: "GOOD POINT.",
    });
  });

  it("after three Yash points: GAME POINT, three cards tagged by the point that unlocked them", () => {
    const v = view3d(played([[ace], [clean, clean], [ace], [ace]]));
    expect(v.bug.status).toBe("GAME POINT");
    expect(v.cards.map((c) => c.tag)).toEqual(["POINT 1", "POINT 3", "POINT 4"]);
    const three3 = view3d(played([[ace], [ace], [ace]]), "ready");
    expect(three3.bug.status).toBe("GAME POINT");
    expect(three3.cards).toHaveLength(3);
    expect(three3.marquee.map((m) => m.text)).toContain("ALL THREE ON THE BIG SCREEN");
    expect(three3.comm).toBe(three.comm.gamePoint);
  });

  it("after four aces: GAME YASH, saved, the end, and the announcer says so", () => {
    const v = view3d(played([[ace], [ace], [ace], [ace]]), "end");
    expect(v.bug.status).toBe("GAME YASH");
    expect(v.saved).toBe("GAME YASH");
    expect(v.end).not.toBeNull();
    expect(v.comm).toBe(three.comm.game);
    expect(v.announce).toBe("40–0. Game yash.");
    // the game point unlocks nothing, and the visitor has won nothing: the centre stays empty
    expect(v.spotlight).toBeNull();
  });

  it("announces a point with what it unlocked, and your point with the visitor's words; no shot word is ever said", () => {
    expect(view3d(played([[ace]]), "called").announce).toBe(
      "15–0. Highlight 01 unlocked: POWER BI DASHBOARD, An analytics-driven web platform with interactive Power BI dashboards embedded inside it.",
    );
    expect(view3d(played([[clean, clean]]), "called").announce).toBe("WELL PLAYED. 0–15.");
    const all = played([[ace], [clean, clean], [good, good], [clean, clean], [ace]]);
    expect(view3d(all, "called").announce).not.toMatch(
      /WINNER|OUT\.|WRONG|TOO LATE|TOO EARLY|ACE\./,
    );
  });

  it("an OUT point: Yash's, with his project in the spotlight, and the Hawk-Eye line", () => {
    const v = view3d(
      played([
        [clean, clean],
        [good, good],
        [clean, clean],
      ]),
      "called",
    );
    expect(v.bug).toMatchObject({ yash: "15", you: "30" });
    expect(v.spotlight).toMatchObject({ kind: "unlock", eyebrow: "HIGHLIGHT 01 · QF" });
    expect(v.comm).toBe(three.comm.out);
  });
});
