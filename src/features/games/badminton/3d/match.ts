import { pickQuality, TOUCH_STRETCH, type Judged } from "../../engine/pick";
import type { GameLayout } from "../../engine/types";

/** Where a pick sends the shuttle: deep (smash, the up arrow) or short (drop, the down arrow). */
export type Dir = "deep" | "short";
export type Player = "yash" | "you";
/** Yash's card shot for a rally: Backend smash, Frontend drop, Data dive, Craft placement, then the final smash. */
export type RallyKind = "smash" | "drop" | "dive" | "placement" | "final";
/** How a rally ended, in the words the call shows. */
export type RallyCall = "early" | "late" | "wrong" | "read" | "winner" | "out" | "dive";

/** The game opens at 17–19, and you can never pass 20. */
export const START = { yash: 17, you: 19 } as const;
export const YOUR_MAX = 20;
/** Yash's rally wins so far pick the kind of the next rally (the fifth, after 20 all, is the final smash). */
export const KINDS: readonly RallyKind[] = ["smash", "drop", "dive", "placement", "final"];
/** Each window (ms) by Yash's rally wins so far (0 to 4); the first pick follows his hit, the second his scoop. */
export const WINDOW_MS = {
  first: [1300, 1200, 1100, 1000, 900],
  second: [1000, 950, 900, 850, 800],
} as const;
/** The speed gun reads only Yash's smashes. */
export const SMASH_KMH = { smash: 348, final: 365 } as const;
/** The call holds this long before the next rally's routine; the first rally waits `firstMs` after the 3D shows. */
export const BADMINTON_3D_BEATS = { callMs: 1800, firstMs: 1500 } as const;

export interface Rally {
  server: Player;
  kind: RallyKind;
  winner: Player;
  call: RallyCall;
  /** Shots played, the serve included. */
  shots: 3 | 4 | 5 | 6;
  /** Your picks in this rally (1 or 2), as judged. */
  picks: Judged[];
  /** The attribute card this rally charged (0 to 3): null for your rally and for the final smash. */
  card: number | null;
}
export interface MatchState {
  rallies: Rally[];
}
export const MATCH_START: MatchState = { rallies: [] };

const yashWins = (s: MatchState) => s.rallies.filter((r) => r.winner === "yash").length;
const step = (s: MatchState) => Math.min(yashWins(s), KINDS.length - 1);
const cards = KINDS.length - 1;

export const scoreOf = (s: MatchState) => ({
  yash: START.yash + yashWins(s),
  you: START.you + s.rallies.filter((r) => r.winner === "you").length,
});
/** Yash needs 21 and a lead of two, so after 20 all he plays on to 22–20. */
export const matchOver = (s: MatchState) => {
  const { yash, you } = scoreOf(s);
  return yash >= 21 && yash - you >= 2;
};
/** Real serving: whoever won the last rally serves, Yash first. */
export const serverOf = (s: MatchState): Player => s.rallies.at(-1)?.winner ?? "yash";
/** The server's box: the right on an even score, the left on an odd one. */
export const boxOf = (s: MatchState): "right" | "left" =>
  scoreOf(s)[serverOf(s)] % 2 === 0 ? "right" : "left";
export const kindOf = (s: MatchState): RallyKind => KINDS[step(s)]!;
/** Whether the one OUT call has been made. */
export const outUsed = (s: MatchState) => s.rallies.some((r) => r.call === "out");
/** How many attribute cards are charged: Yash's wins, four at most. */
export const chargedOf = (s: MatchState) => Math.min(yashWins(s), cards);
export const allPicks = (s: MatchState) => s.rallies.flatMap((r) => r.picks);

/** The window for a pick (ms): it shrinks as Yash's wins rise; the column (touch) gets 25 % longer. */
export const windowMs = (pick: 0 | 1, s: MatchState, layout: GameLayout) =>
  WINDOW_MS[pick === 0 ? "first" : "second"][step(s)]! * (layout === "column" ? TOUCH_STRETCH : 1);
/** The speed gun's reading for Yash's rally, or null when nothing is smashed. */
export const smashKmh = (kind: RallyKind): number | null =>
  kind === "smash" || kind === "final" ? SMASH_KMH[kind] : null;
/** One pick, judged exactly as tennis judges a return (right choice, in time, the first 40 % perfect). */
export const judge = (pick: { dir: Dir | null; atMs: number }, open: Dir, window: number): Judged =>
  pickQuality(pick, open, window);

const isGood = (j: Judged) => j.q !== "miss";
/** On 20 after the OUT is used (or on the final rally), a good first pick is read: Yash is already there. */
const isRead = (s: MatchState) =>
  scoreOf(s).you >= YOUR_MAX && (outUsed(s) || kindOf(s) === "final");

/** Whether a good first pick brings a second: not in the Data rally, and not when Yash has read it. */
export const needsSecond = (s: MatchState, first: Judged) =>
  isGood(first) && kindOf(s) !== "dive" && !isRead(s);

/** How the rally ends, from your picks (spec §3.2 and §3.3). */
export function decideRally(s: MatchState, picks: readonly Judged[]): Rally {
  const [first, second] = picks;
  if (!first) throw new Error("a rally needs your pick");
  const server = serverOf(s);
  const kind = kindOf(s);
  const extra = server === "you" ? 1 : 0;
  const card = yashWins(s) < cards ? yashWins(s) : null;
  const yash = (call: RallyCall, base: number): Rally => ({
    server,
    kind,
    winner: "yash",
    call,
    shots: (base + extra) as Rally["shots"],
    picks: [...picks],
    card,
  });
  const missed = (j: Judged, base: number) => yash(j.call as "late" | "early" | "wrong", base);

  if (!isGood(first)) return missed(first, 3);
  if (kind === "dive") return yash("dive", 3);
  if (isRead(s)) return yash("read", kind === "smash" || kind === "final" ? 5 : 3);
  if (!second) throw new Error("a good pick needs your second shot");
  if (!isGood(second)) return missed(second, 5);
  if (scoreOf(s).you < YOUR_MAX) {
    return {
      server,
      kind,
      winner: "you",
      call: "winner",
      shots: (4 + extra) as Rally["shots"],
      picks: [...picks],
      card: null,
    };
  }
  return yash("out", 4);
}

export const playRally = (s: MatchState, picks: readonly Judged[]): MatchState =>
  matchOver(s) ? s : { rallies: [...s.rallies, decideRally(s, picks)] };
