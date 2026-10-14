import type { UiCopy } from "@/content";
import { VENUES, matchdayComplete, type MatchRecordData } from "@/shell/matchRecord";
import type { ROUTES } from "@/shell/routes";
import { gradeFor } from "./grade";

export interface FullTimeView {
  state: "done" | "pending";
  brand: { mark: string; label: string; to: string };
  toast: { eyebrow: string; title: string };
  board: {
    label: string;
    home: { name: string; score: string };
    away: { name: string; score: string };
    winner: "home" | "away";
  };
  headline: string;
  line: string;
  card: { eyebrow: string; title: string; body: string; cta: { label: string; to: string } };
  links: { label: string; to: string }[];
  comm: string;
  commTag: string;
  /** Said only once the matchday is done: a first-time visitor has nothing saved yet. */
  note: string | null;
}

export type FullTimeRecord = Pick<MatchRecordData, "venuesPlayed" | "bestForm">;

/** "YOU" to "You": the scoreboard's sentence for a screen reader. */
const sentence = (word: string) => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();

/**
 * Everything the Full Time page shows, as plain words, from the copy and the saved record. Opened early it is
 * "NOT YET." with the next venue; after all three venues it is the verdict, YOU 0 and YASH 3, graded by how close
 * the visitor's best forms came (F3, F4).
 */
export function buildFullTimeView(
  ui: UiCopy,
  routes: typeof ROUTES,
  record: FullTimeRecord,
): FullTimeView {
  const { fullTime: copy, hub } = ui;
  const sep = ui.glyph.sep;
  const total = VENUES.length;
  const played = VENUES.filter((v) => record.venuesPlayed.includes(v)).length;
  const done = matchdayComplete(record);
  const you = hub.record.you;
  const yash = hub.record.yash;
  // Yash wins every venue played: his score is the number of venues done (3 once the matchday is over).
  const yashScore = String(played);
  const back = { label: ui.games.backToHub, to: routes.arena };
  const common = {
    brand: { mark: ui.brand.mark, label: ui.brand.wordmark, to: routes.home },
    toast: {
      // A no-break space before the separator: when the eyebrow wraps (a phone), no line begins with it.
      eyebrow: `${done ? copy.eyebrow.done : copy.eyebrow.pending}\u00a0${sep} ${played} ${hub.matchday.of} ${total} ${hub.matchday.venues}`,
      title: ui.routes.fullTime.heading,
    },
    board: {
      label: `${copy.board}: ${sentence(you)} 0, ${sentence(yash)} ${yashScore}`,
      home: { name: you, score: "0" },
      away: { name: yash, score: yashScore },
      winner: "away" as const,
    },
    commTag: ui.comm.tag,
  };

  if (done) {
    const grade = copy.grades[gradeFor(record.bestForm)];
    return {
      ...common,
      state: "done",
      headline: grade.headline,
      line: grade.line,
      card: {
        eyebrow: copy.teamUp.eyebrow,
        title: copy.teamUp.title,
        body: copy.teamUp.body,
        cta: { label: copy.teamUp.cta, to: routes.teamUp },
      },
      links: [
        { label: copy.again, to: routes.cricket },
        { label: copy.card, to: routes.card },
        back,
      ],
      comm: copy.comm.done,
      note: copy.note,
    };
  }

  const next = VENUES.find((v) => !record.venuesPlayed.includes(v)) ?? VENUES[0];
  return {
    ...common,
    state: "pending",
    headline: copy.pending.headline,
    line: `${played} ${copy.pending.of} ${total} ${copy.pending.played} ${copy.pending.tail}`,
    card: {
      eyebrow: copy.next.eyebrow,
      title: ui.venues[next],
      body: hub.venues[next].blurb,
      cta: { label: copy.next.cta, to: routes[next] },
    },
    links: [back],
    comm: copy.comm.pending,
    note: null,
  };
}
