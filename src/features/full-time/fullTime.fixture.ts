import { ui } from "@/content";
import { VENUES, type MatchRecordData } from "@/shell/matchRecord";
import { ROUTES } from "@/shell/routes";
import type { Grade } from "./grade";
import { buildFullTimeView, type FullTimeView } from "./view";

/**
 * The Easter-Egg artboard's own words (the Giant Killer, a win the visitor can never have). It exists only so parity
 * can measure the layout against the artboard (F14): no page shows it.
 */
export const artboardView: FullTimeView = {
  state: "done",
  brand: { mark: ui.brand.mark, label: ui.brand.wordmark, to: ROUTES.home },
  toast: { eyebrow: "HIDDEN ACHIEVEMENT UNLOCKED", title: "GIANT KILLER" },
  board: {
    label: "Final score: You 1, Yash 0",
    home: { name: "YOU", score: "1" },
    away: { name: "YASH", score: "0" },
    winner: "home",
  },
  headline: "OKAY… YOU GOT ME.",
  line: "That doesn't happen often.",
  card: {
    eyebrow: "NOW OPEN · ONLY FOR GIANT KILLERS",
    title: "THE LOCKER ROOM",
    body: "How this arena was built, the story behind the published AI interview paper, and the system design notes I write about.",
    cta: { label: "ENTER", to: "/locker-room" },
  },
  links: [
    { label: "TELL YASH YOU WON →", to: ROUTES.teamUp },
    { label: "HE WANTS A REMATCH", to: ROUTES.cricket },
    { label: "BACK TO THE HUB", to: ROUTES.arena },
  ],
  comm: "The crowd is on its feet. He's already asking for a rematch.",
  commTag: ui.comm.tag,
  note: "TROPHY ADDED TO YOUR CABINET",
};

/** The best form at every venue that earns each grade (the average is the form itself). */
const FORM: Record<Grade, number> = { goodTry: 0, niceEffort: 1 / 3, soClose: 1 };

const record = (
  played: number,
  form: number,
): Pick<MatchRecordData, "venuesPlayed" | "bestForm"> => {
  const venuesPlayed = VENUES.slice(0, played);
  return { venuesPlayed, bestForm: Object.fromEntries(venuesPlayed.map((v) => [v, form])) };
};

/** All three venues played, with the forms that earn `grade`. */
export const doneView = (grade: Grade) => buildFullTimeView(ui, ROUTES, record(3, FORM[grade]));

/** Opened early: `n` of the three venues played (the next one in the Hub's order is named). */
export const pendingView = (n: 0 | 1 | 2) => buildFullTimeView(ui, ROUTES, record(n, 0));
