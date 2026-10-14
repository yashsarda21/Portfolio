import { useCallback } from "react";
import { matchdayComplete, useMatchRecord, type Venue } from "@/shell/matchRecord";
import { noteLoss, OFFER_AFTER_LOSSES } from "./session";

/** What the end offers beyond the venue's page: the highlight after the second loss (G9); Full Time once all three venues are played (F3). */
export interface EndFlags {
  offerHighlight: boolean;
  fullTime: boolean;
}
export const NO_END_FLAGS: EndFlags = { offerHighlight: false, fullTime: false };

/**
 * Saves a finished game to the match record, once per call (spec §4.6; the game calls it the moment the result is
 * known): its score and how close it came (F4). Every game is Yash's win (F1). A failing write never reaches the
 * game, and Full Time is then not offered. It counts the loss for this visit and says whether the highlight should
 * be offered (G9) and whether the matchday is complete.
 */
export function useMatchResult(venue: Venue) {
  const save = useCallback(
    ({ score, form }: { score: string; form: number }): EndFlags => {
      let fullTime = false;
      try {
        useMatchRecord.getState().completeMatch({ venue, score, form });
        fullTime = matchdayComplete(useMatchRecord.getState());
      } catch {
        /* storage or the record failed: the game still ends */
      }
      return { offerHighlight: noteLoss(venue) >= OFFER_AFTER_LOSSES, fullTime };
    },
    [venue],
  );
  return { save };
}
