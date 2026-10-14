import { VENUES, type MatchRecordData } from "@/shell/matchRecord";

export type Grade = "goodTry" | "niceEffort" | "soClose";
/** F4: the average best perfect share across the three venues that earns each grade. */
export const FULL_TIME_GRADES = { soClose: 0.6, niceEffort: 0.2 } as const;

/**
 * One verdict for the matchday: the three venues' best forms averaged (a venue not played counts 0).
 * The sum is held against `threshold * VENUES.length`, not the average against the threshold: 0.6 + 0.6 + 0.6 is
 * exactly 0.6 * 3 in floating point, while that sum divided by 3 can land a hair under 0.6 (the threshold is inclusive).
 */
export function gradeFor(bestForm: MatchRecordData["bestForm"]): Grade {
  const sum = VENUES.reduce((total, v) => total + (bestForm[v] ?? 0), 0);
  return sum >= FULL_TIME_GRADES.soClose * VENUES.length
    ? "soClose"
    : sum >= FULL_TIME_GRADES.niceEffort * VENUES.length
      ? "niceEffort"
      : "goodTry";
}
