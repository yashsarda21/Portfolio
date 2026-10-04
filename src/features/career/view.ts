import {
  formatMonth,
  formatSpan,
  getCareerRows,
  getInningsReveals,
  type Content,
  type UiCopy,
} from "@/content";
import type { ROUTES } from "@/shell/routes";

/** What closes a panel: the stack of an innings, or the way on to the Trophy Room for the academy. */
export type DetailFooter =
  { kind: "shots"; label: string; stack: string[] } | { kind: "link"; label: string; to: string };

export interface CareerRowDetail {
  heading: string;
  span: string;
  /** The panel's h2: the team, or the school's full name. */
  title: string;
  roleLine: string;
  balls: string[];
  footer: DetailFooter;
}

export interface CareerRowView {
  /** The innings number ("01"); also the row's id in the list. */
  id: string;
  n: string;
  team: string;
  role: string;
  span: string;
  status: string;
  current: boolean;
  detail: CareerRowDetail;
}

export interface CareerView {
  stats: { label: string; value: string; tone: "glass" | "volt" }[];
  cols: { inn: string; team: string; role: string; span: string; status: string };
  listLabel: string;
  /** The career innings, then the academy as the last (selectable) row. */
  rows: CareerRowView[];
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

  const innings: CareerRowView[] = careerRows.map((row) => ({
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
      title: row.team,
      roleLine: `${row.role} ${sep} ${row.location}`,
      balls: row.ballByBall,
      footer: { kind: "shots", label: t.shots, stack: row.stack },
    },
  }));

  const school = c.trainingAcademy;
  const rows: CareerRowView[] = academy
    ? [
        ...innings,
        {
          id: academy.n,
          n: academy.n,
          team: academy.team,
          // The short degree keeps the row to one line; the panel shows the full one.
          role: school.degreeShort,
          span: academy.span,
          status: t.academy,
          current: false,
          detail: {
            heading: `${t.innings} ${academy.n} ${sep} ${t.academy}`,
            span: formatSpan(school.start, school.end),
            title: school.school,
            roleLine: `${school.degree} ${sep} ${school.honours}`,
            balls: [`${copy.scout.cgpa} ${school.cgpa}`, ...school.extras],
            footer: { kind: "link", label: t.academyLink, to: `${routes.trophies}#academy` },
          },
        },
      ]
    : innings;

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
    legend: t.legend,
    viewCard: { label: t.viewCard, to: routes.card },
    defaultId: rows[0]!.id,
  };
}
