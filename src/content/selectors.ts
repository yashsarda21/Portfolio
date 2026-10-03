import { formatSpan, formatYearSpan } from "./format";
import type { Content, SkillLevel } from "./schema";

export interface CareerRow {
  innings: string;
  status: "NOT OUT" | "DEBUT";
  team: string;
  role: string;
  location: string;
  span: string;
  isCurrent: boolean;
  ballByBall: string[];
  stack: string[];
  scoutLine: string;
}

export interface InningsReveal {
  n: string;
  status: "NOT OUT" | "DEBUT" | "ACADEMY";
  team: string;
  role: string;
  span: string;
}

export type RoundShort = "QF" | "SF" | "F";
export type Highlight = Content["matchHighlights"][number] & { roundShort: RoundShort };

export interface SkillView {
  name: string;
  level: SkillLevel;
  segments: number;
  tierLabel: string;
}
export interface AttributeGroup {
  name: string;
  shot: string;
  note: string;
  skills: SkillView[];
}

export type Trophy = Content["trophyRoom"][number] & { locked: boolean };

export type ResumeAction = { kind: "pdf"; href: string } | { kind: "request"; href: string };

const ROUND_ORDER: Record<Highlight["round"], { order: number; short: RoundShort }> = {
  "QUARTER-FINAL": { order: 0, short: "QF" },
  "SEMI-FINAL": { order: 1, short: "SF" },
  "THE FINAL": { order: 2, short: "F" },
};

/** Evidence levels (spec §7): shipped 9/10, built 7/10, kit 5/10. */
export const LEVEL_SEGMENTS: Record<SkillLevel, number> = { shipped: 9, built: 7, kit: 5 };
export const LEVEL_LABEL: Record<SkillLevel, string> = {
  shipped: "SHIPPED",
  built: "BUILT",
  kit: "KIT BAG",
};

export function getCareerRows(c: Content): CareerRow[] {
  return c.careerStats.map((row) => ({
    innings: row.innings,
    status: row.status,
    team: row.team,
    role: row.role,
    location: row.location,
    span: formatSpan(row.start, row.end),
    isCurrent: row.end === null,
    ballByBall: row.ballByBall,
    stack: row.stack,
    scoutLine: row.scoutLine,
  }));
}

export function getInningsReveals(c: Content): InningsReveal[] {
  const careers: InningsReveal[] = c.careerStats.map((row) => ({
    n: row.innings,
    status: row.status,
    team: row.team,
    role: row.role,
    span: formatSpan(row.start, row.end),
  }));
  const a = c.trainingAcademy;
  return [
    ...careers,
    {
      n: String(careers.length + 1).padStart(2, "0"),
      status: "ACADEMY",
      team: `${a.shortName}, ${a.city}`,
      role: a.degree,
      span: formatYearSpan(a.start, a.end),
    },
  ];
}

export function getHighlights(c: Content): Highlight[] {
  return [...c.matchHighlights]
    .sort((x, y) => ROUND_ORDER[x.round].order - ROUND_ORDER[y.round].order)
    .map((h) => ({ ...h, roundShort: ROUND_ORDER[h.round].short }));
}

export function getAttributeGroups(c: Content): AttributeGroup[] {
  return c.playerAttributes.groups.map((g) => ({
    name: g.name,
    shot: g.shot,
    note: g.note,
    skills: g.skills.map(([name, level, tag]) => ({
      name,
      level,
      segments: LEVEL_SEGMENTS[level],
      tierLabel: tag ? tag.toUpperCase() : LEVEL_LABEL[level],
    })),
  }));
}

export function getTrophies(c: Content): Trophy[] {
  return c.trophyRoom.map((t) => ({ ...t, locked: t.type === "locked" }));
}

export function getResumeAction(c: Content): ResumeAction {
  if (c.player.resumePdf) return { kind: "pdf", href: c.player.resumePdf };
  const subject = encodeURIComponent(`Resume request — ${c.player.name}`);
  return { kind: "request", href: `mailto:${c.player.contact.email}?subject=${subject}` };
}
