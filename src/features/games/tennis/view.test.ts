import { describe, expect, it } from "vitest";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { playReturn, TENNIS_START, type ReturnPick, type Side, type TennisState } from "./referee";
import { buildTennisView, type TennisPhase } from "./view";

const GOOD: ReturnPick = { side: "right", atMs: 600 };
const PERFECT: ReturnPick = { side: "right", atMs: 100 };
const ACE: ReturnPick = { side: null, atMs: 9999 };

/** Plays picks in order on serves that open on `open`; `luck` is the roll the last return's 1 % takes. */
const play = (picks: ReturnPick[], luck = 0.99, open: Side = "right"): TennisState =>
  picks.reduce(
    (s, pick) => playReturn({ ...s, serve: { open, tossMs: 500 } }, pick, "stage", () => luck),
    TENNIS_START,
  );
/** A serve in the air on top of what has been played. */
const serving = (s: TennisState, open: Side = "right"): TennisState => ({
  ...s,
  serve: { open, tossMs: 500 },
});

const view = (
  state: TennisState,
  opts: { phase?: TennisPhase; offerHighlight?: boolean } = {},
  c = content,
) =>
  buildTennisView(c, ui, ROUTES, state, {
    phase: opts.phase ?? "tell",
    offerHighlight: opts.offerHighlight ?? false,
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
      alert: false,
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
    expect(v.call).toBeNull();
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
    expect(v.chrome.skip).toEqual({ label: "SKIP TO MATCH HIGHLIGHTS", to: "/highlights" });
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

  it("holds the call only while it is being called, and says it with what it unlocked", () => {
    const state = play([PERFECT]);
    expect(view(state, { phase: "tell" }).call).toBeNull();
    expect(view(state, { phase: "called" }).call).toEqual({ text: "CLEAN RETURN.", tone: "volt" });
    expect(view(state, { phase: "called" }).announce).toBe(
      "CLEAN RETURN. Highlight 01 unlocked: POWER BI DASHBOARD, An analytics-driven web platform with interactive Power BI dashboards embedded inside it.",
    );
    expect(view(play([ACE]), { phase: "called" }).call).toEqual({
      text: "ACE.",
      tone: "floodlight",
    });
    expect(view(play([ACE]), { phase: "called" }).comm).toBe(ui.games.tennis.comm.missed);
  });

  it("a miss still reveals a card", () => {
    const v = view(play([ACE]), { phase: "called" });
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

  it("a loss: GAME YASH, saved, and the highlights with a rematch", () => {
    const v = view(play([GOOD, GOOD, GOOD]), { phase: "end" });
    expect(v.bug).toMatchObject({
      yash: "40",
      you: "30",
      status: "GAME YASH",
      statusPhone: "GAME YASH",
      alert: false,
    });
    expect(v.saved).toBe("GAME YASH");
    expect(v.call).toEqual({ text: "ON THE LINE.", tone: "floodlight" });
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
    });
  });

  it("a win: BROKE SERVE, and only the claim", () => {
    const v = view(play([PERFECT, PERFECT, PERFECT], 0), { phase: "end" });
    expect(v.bug).toMatchObject({ status: "BROKE SERVE", statusPhone: "BROKE SERVE", alert: true });
    expect(v.saved).toBe("BROKE SERVE");
    expect(v.call).toEqual({ text: "RETURN WINNER.", tone: "volt" });
    expect(v.comm).toBe(content.commentary.visitorWins[0]);
    expect(v.end).toEqual({
      primary: null,
      claim: { label: "CLAIM YOUR BREAK", to: "/arena/giant-killer" },
    });
  });

  it("the second loss swaps the primary for the highlight, rematch stays", () => {
    const v = view(play([GOOD, GOOD, GOOD]), { phase: "end", offerHighlight: true });
    expect(v.end).toEqual({
      primary: { label: "WATCH THE HIGHLIGHT INSTEAD", to: "/highlights" },
      again: "REMATCH",
    });
  });
});
