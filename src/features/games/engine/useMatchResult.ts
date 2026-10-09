import { useCallback } from "react";
import { ui } from "@/content";
import { useMatchRecord, type Venue } from "@/shell/matchRecord";
import type { Winner } from "./types";
import { noteLoss, OFFER_AFTER_LOSSES } from "./session";

/**
 * Saves a finished game to the match record, once per call (spec §4.6; the game calls it the moment the result is
 * known). A visitor's win also carries the Team Up prefill. A failing write never reaches the game. On Yash's win
 * it counts the loss for this visit and says whether the highlight should be offered (G9).
 */
export function useMatchResult(venue: Venue) {
  const save = useCallback(
    ({ score, winner }: { score: string; winner: Winner }): { offerHighlight: boolean } => {
      try {
        useMatchRecord.getState().completeMatch({
          venue,
          score,
          winner,
          prefill: winner === "you" ? ui.games.prefill : undefined,
        });
      } catch {
        /* storage or the record failed: the game still ends */
      }
      return { offerHighlight: winner === "yash" && noteLoss(venue) >= OFFER_AFTER_LOSSES };
    },
    [venue],
  );
  return { save };
}
