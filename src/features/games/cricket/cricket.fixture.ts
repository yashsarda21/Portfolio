import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import type { Quality } from "../engine/types";
import { bowl, CRICKET_START, type CricketState } from "./referee";
import { buildCricketView, type CricketPhase } from "./view";

/** An over played ball by ball. `luck` is the roll the last ball's 1 % takes (0 lands it, the default never does). */
export const playOver = (qualities: Quality[], luck = 0.99): CricketState =>
  qualities.reduce((state, q) => bowl(state, q, () => luck), CRICKET_START);

export const cricketView = (
  state: CricketState,
  {
    phase = "ready",
    offerHighlight = false,
  }: { phase?: CricketPhase; offerHighlight?: boolean } = {},
) => buildCricketView(content, ui, ROUTES, state, { phase, offerHighlight });

/** Cricket-Play's board: a fresh over. */
export const artboardCricketView = cricketView(CRICKET_START);

/** Mobile-Game's board: after ball 1, a SIX (6*, 2/3, innings 01 open). */
export const phoneArtboardCricketView = cricketView(playOver(["miss"]));

/** The end of an over of FOUR, SIX, FOUR (14* NOT OUT). */
export const lostView = (offerHighlight = false) =>
  cricketView(playOver(["good", "miss", "good"]), { phase: "end", offerHighlight });

/** The end of the 1 %: dot, dot, wicket. */
export const wonView = cricketView(playOver(["perfect", "perfect", "perfect"], 0), {
  phase: "end",
});
