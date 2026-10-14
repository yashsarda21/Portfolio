import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { BADMINTON_START_STATE, playRally, type BadmintonState } from "./referee";
import { buildBadmintonView, type BadmintonPhase } from "./view";

/** Powers that land in each zone; none of them is the perfect weight (20 to 26 %). */
export const POWERS = { smash: 85, clear: 50, drop: 30, perfect: 23 } as const;

/** A game played rally by rally. */
export const playGame = (powers: number[]): BadmintonState =>
  powers.reduce((state, power) => playRally(state, power), BADMINTON_START_STATE);

export const badmintonView = (
  state: BadmintonState,
  {
    phase = "ready",
    offerHighlight = false,
    fullTime = false,
  }: { phase?: BadmintonPhase; offerHighlight?: boolean; fullTime?: boolean } = {},
) => buildBadmintonView(content, ui, ROUTES, state, { phase, offerHighlight, fullTime });

/** A fresh game: 17-19, rally 1. */
export const freshView = badmintonView(BADMINTON_START_STATE);

/** Badminton-Play's board: three rallies played (clear, smash, drop), match point, the hold waiting. */
export const artboardBadmintonView = badmintonView(
  playGame([POWERS.clear, POWERS.smash, POWERS.drop]),
);

/** The call for a smash on rally 2. */
export const calledView = badmintonView(playGame([POWERS.clear, POWERS.smash]), {
  phase: "called",
});

/** The end of a lost game: clear, smash, drop, drop, 21-19. */
export const lostView = (offerHighlight = false) =>
  badmintonView(playGame([POWERS.clear, POWERS.smash, POWERS.drop, POWERS.drop]), {
    phase: "end",
    offerHighlight,
  });

/** The end once all three venues are played: the main button is SEE FULL TIME. */
export const fullTimeView = badmintonView(
  playGame([POWERS.clear, POWERS.smash, POWERS.drop, POWERS.drop]),
  { phase: "end", fullTime: true },
);
