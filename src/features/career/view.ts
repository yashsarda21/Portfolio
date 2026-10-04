import {
  formatMonth,
  getCareerRows,
  getInningsReveals,
  type Content,
  type UiCopy,
} from "@/content";
import type { ROUTES } from "@/shell/routes";

export interface CareerRowView {
  /** The innings number ("01"); also the row's id in the list. */
  id: string;
  n: string;
  team: string;
  role: string;
  span: string;
  status: string;
  current: boolean;
  detail: {
    heading: string;
    span: string;
    roleLine: string;
    balls: string[];
    shotsLabel: string;
    stack: string[];
  };
}

export interface CareerView {
  stats: { label: string; value: string; tone: "glass" | "volt" }[];
  cols: { inn: string; team: string; role: string; span: string; status: string };
  listLabel: string;
  rows: CareerRowView[];
  /** The education innings, drawn as a link row after the scorecard rows. Null draws nothing. */
  academy: {
    n: string;
    team: string;
    role: string;
    span: string;
    status: string;
    to: string;
  } | null;
  legend: string;
  viewCard: { label: string; to: string };
  /** The row selected first. */
  defaultId: string;
}

/** The scorecard page, as plain strings. Pure: no React, no DOM. */
export function buildCareerView(c: Content, copy: UiCopy, routes: typeof ROUTES): CareerView {
  const t = copy.pages.career;
  const sep = copy.glyph.sep;
  const careerRows = getCareerRows(c);
  const current = careerRows.find((row) => row.isCurrent);
  const academy = getInningsReveals(c).find((reveal) => reveal.kind === "academy");

  const rows = careerRows.map((row) => ({
    id: row.innings,
    n: row.innings,
    team: row.team,
    role: row.role,
    span: row.span,
    status: row.status,
    current: row.isCurrent,
    detail: {
      heading: `${t.innings} ${row.innings} ${sep} ${t.ballByBall}`,
      span: row.span,
      roleLine: `${row.role} ${sep} ${row.location}`,
      balls: row.ballByBall,
      shotsLabel: t.shots,
      stack: row.stack,
    },
  }));

  return {
    stats: [
      { label: t.stats.proSince, value: formatMonth(c.player.proSince), tone: "glass" },
      { label: t.stats.club, value: c.player.clubShort, tone: "glass" },
      // No current role (everything has ended): show the latest innings in a plain tile.
      current
        ? { label: t.stats.current, value: current.status, tone: "volt" }
        : { label: t.stats.current, value: careerRows[0]!.status, tone: "glass" },
    ],
    cols: t.cols,
    listLabel: t.listLabel,
    rows,
    academy: academy
      ? {
          n: academy.n,
          team: academy.team,
          // The short degree keeps the row to one line; the Trophy Room shows the full one.
          role: c.trainingAcademy.degreeShort,
          span: academy.span,
          status: t.academy,
          to: `${routes.trophies}#academy`,
        }
      : null,
    legend: t.legend,
    viewCard: { label: t.viewCard, to: routes.card },
    defaultId: rows[0]!.id,
  };
}
