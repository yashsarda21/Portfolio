import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { playReturn, TENNIS_START, type ReturnPick, type Side, type TennisState } from "./referee";
import { buildTennisView, type TennisPhase } from "./view";

/** A return in 100 ms (perfect), in 600 ms (good) or never (an ace), on the side the serve opened. */
export const PICKS = {
  perfect: { side: "right", atMs: 100 },
  good: { side: "right", atMs: 600 },
  ace: { side: null, atMs: 9999 },
} as const satisfies Record<string, ReturnPick>;

/** A game played serve by serve. */
export const playGame = (picks: ReturnPick[], open: Side = "right"): TennisState =>
  picks.reduce(
    (state, pick) => playReturn({ ...state, serve: { open, tossMs: 500 } }, pick, "stage"),
    TENNIS_START,
  );

/** A serve in the air, opening on `open`, on top of the returns so far. */
export const serving = (state: TennisState, open: Side = "right"): TennisState => ({
  ...state,
  serve: { open, tossMs: 500 },
});

export const tennisView = (
  state: TennisState,
  {
    phase = "tell",
    offerHighlight = false,
    fullTime = false,
  }: { phase?: TennisPhase; offerHighlight?: boolean; fullTime?: boolean } = {},
) => buildTennisView(content, ui, ROUTES, state, { phase, offerHighlight, fullTime });

/** A fresh game, before the first serve. */
export const freshView = tennisView(TENNIS_START, { phase: "ready" });

/** Tennis-Play's board: rally 3 in play, the right side open, two returns (good, perfect). */
export const artboardTennisView = tennisView(serving(playGame([PICKS.good, PICKS.perfect])), {
  phase: "tell",
});

/** The call for a clean return on rally 2. */
export const calledView = tennisView(playGame([PICKS.good, PICKS.perfect]), { phase: "called" });

/** The end of three good returns: ON THE LINE, GAME YASH. */
export const lostView = (offerHighlight = false) =>
  tennisView(playGame([PICKS.good, PICKS.good, PICKS.good]), { phase: "end", offerHighlight });

/** The end once all three venues are played: the main button is SEE FULL TIME. */
export const fullTimeView = tennisView(playGame([PICKS.good, PICKS.good, PICKS.good]), {
  phase: "end",
  fullTime: true,
});
