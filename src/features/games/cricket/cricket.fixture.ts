import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import type { Quality } from "../engine/types";
import { bowl, CRICKET_START, type CricketState } from "./referee";
import { buildCricketView, type CricketPhase } from "./view";

/** An over played ball by ball. */
export const playOver = (qualities: Quality[]): CricketState =>
  qualities.reduce((state, q) => bowl(state, q), CRICKET_START);

export const cricketView = (
  state: CricketState,
  {
    phase = "ready",
    offerHighlight = false,
    fullTime = false,
  }: { phase?: CricketPhase; offerHighlight?: boolean; fullTime?: boolean } = {},
) => buildCricketView(content, ui, ROUTES, state, { phase, offerHighlight, fullTime });

/** Cricket-Play's board: a fresh over. */
export const artboardCricketView = cricketView(CRICKET_START);

/** Mobile-Game's board: after ball 1, a SIX (6*, 2/3, innings 01 open). */
export const phoneArtboardCricketView = cricketView(playOver(["miss"]));

/** The end of an over of FOUR, SIX, FOUR (14* NOT OUT). */
export const lostView = (offerHighlight = false) =>
  cricketView(playOver(["good", "miss", "good"]), { phase: "end", offerHighlight });

/** The end once all three venues are played: the main button is SEE FULL TIME. */
export const fullTimeView = cricketView(playOver(["good", "miss", "good"]), {
  phase: "end",
  fullTime: true,
});
