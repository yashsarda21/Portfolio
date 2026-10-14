import {
  experienceSince,
  formatSpan,
  getAttributeGroups,
  getCardStat,
  getCareerRows,
  getHighlights,
  getResumeAction,
  getTrophies,
  type Content,
  type UiCopy,
} from "@/content";
import type { ROUTES } from "@/shell/routes";

export type ScoutSectionId = "career" | "highlights" | "attributes" | "trophies" | "teamup";
export interface ScoutLinkView {
  label: string;
  href: string;
  /** Trailing decorative mark, when the link has one. */
  glyph?: string;
  download?: string;
  newTab?: boolean;
}
export interface ScoutReport {
  header: {
    mark: string;
    label: string;
    nav: { id: ScoutSectionId; label: string }[];
    navLabel: string;
    enter: { label: string; to: string };
    enterShort: string;
    next: string;
  };
  hero: {
    eyebrow: string;
    eyebrowMore: string;
    sep: string;
    nameParts: string[];
    summary: string;
    summaryShort: string;
    chips: { label: string; short?: string; highlight?: boolean; desktopOnly?: boolean }[];
    primary: ScoutLinkView;
    secondary: { label: string; href: string };
    /** Screen-reader note appended to a link that opens in a new tab. */
    newTabHint: string;
  };
  career: {
    title: string;
    meta: string;
    metaShort: string;
    rows: {
      span: string;
      status: string;
      isCurrent: boolean;
      team: string;
      roleLine: string;
      stackLine: string;
      bullets: string[];
      compactTitle: string;
      compactLine?: string;
    }[];
  };
  highlights: {
    title: string;
    meta: string;
    swipe: string;
    next: string;
    listLabel: string;
    more: ScoutLinkView;
    items: {
      round: string;
      tag: string;
      sep: string;
      title: string;
      shortTitle: string;
      body: string;
      short: string;
      stackLine: string;
      featured: boolean;
    }[];
  };
  attributes: {
    title: string;
    meta: string;
    legend: string;
    groups: { name: string; chips: { label: string; filled: boolean }[] }[];
  };
  trophies: { title: string; rows: { title: string; sub: string }[] };
  academy: { title: string; school: string; degreeLine: string; datesLine: string };
  teamUp: { eyebrow: string; headline: string; links: ScoutLinkView[] };
  footer: { credit: string; arena: { label: string; to: string }; next: string };
  actions: {
    label: string;
    card: { label: string; to: string };
    teamUp: { label: string; href: string };
  };
}

/** Content group that the report replaces with the curated "craft and tools" list. */
const CRAFT_GROUP = "Craft";
const TEAM_UP_HREF = "#teamup";

/** Last non-empty path segment of a URL (a profile handle). */
function handle(url: string): string {
  const segments = new URL(url).pathname.split("/").filter(Boolean);
  return segments[segments.length - 1] ?? url;
}

/** "Pune, MH" -> "Pune". */
function city(location: string): string {
  return location.split(",")[0]!.trim();
}

const problemsValue = (c: Content): string => getCardStat(c, "problems").value;

export function buildScoutReport(c: Content, copy: UiCopy, routes: typeof ROUTES): ScoutReport {
  const s = copy.scout;
  const sep = copy.glyph.sep;
  const { contact } = c.player;
  const resume = getResumeAction(c);
  const careerRows = getCareerRows(c);
  const current = c.careerStats.find((row) => row.end === null) ?? c.careerStats[0]!;
  const since = experienceSince(c.player.proSince);
  const academy = c.trainingAcademy;
  const attributeGroups = getAttributeGroups(c);
  // The page swaps this group for the curated list; fail loudly if content renames it.
  if (!attributeGroups.some((g) => g.name === CRAFT_GROUP)) {
    throw new Error(`content.skills needs a "${CRAFT_GROUP}" group`);
  }

  const primary: ScoutLinkView =
    resume.kind === "pdf"
      ? { label: s.resume.view, href: resume.href, newTab: true }
      : { label: s.resume.request, href: resume.href };

  const resumeRow: ScoutLinkView =
    resume.kind === "pdf"
      ? {
          label: s.resume.row,
          href: resume.href,
          glyph: copy.glyph.download,
          download: s.resume.fileName,
        }
      : { label: s.resume.rowRequest, href: resume.href, glyph: copy.glyph.external };

  return {
    header: {
      mark: copy.brand.mark,
      label: s.label,
      nav: [
        { id: "career", label: s.nav.career },
        { id: "highlights", label: s.nav.highlights },
        { id: "attributes", label: s.nav.attributes },
        { id: "trophies", label: s.nav.trophies },
        { id: "teamup", label: s.nav.teamUp },
      ],
      navLabel: s.sectionsNav,
      enter: { label: s.enter, to: routes.arena },
      enterShort: s.enterShort,
      next: copy.glyph.next,
    },
    hero: {
      eyebrow: s.eyebrow,
      eyebrowMore: s.eyebrowMore,
      sep,
      nameParts: c.player.name.split(" "),
      summary: c.scout.summary,
      summaryShort: c.scout.summaryShort,
      chips: [
        { label: c.player.location },
        {
          label: `${current.role} ${sep} ${since}`,
          short: `${current.shortRole} ${sep} ${since}`,
        },
        {
          label: `${academy.degreeShort} ${sep} ${academy.shortName} ${sep} ${s.cgpa} ${academy.cgpa}`,
          desktopOnly: true,
        },
        {
          label: `${problemsValue(c)} ${s.problemsSolved}`,
          short: `${problemsValue(c)} ${s.solved}`,
          highlight: true,
        },
      ],
      primary,
      secondary: { label: s.teamUpCta, href: TEAM_UP_HREF },
      newTabHint: copy.a11y.newTab,
    },
    career: {
      title: s.career.title,
      meta: s.career.meta,
      metaShort: `${careerRows.length} ${s.career.innings}`,
      rows: careerRows.map((row) => ({
        span: row.span,
        status: row.status,
        isCurrent: row.isCurrent,
        team: row.team,
        roleLine: `${row.role} ${sep} ${city(row.location)}`,
        stackLine: row.stack.join(` ${sep} `),
        bullets: row.ballByBall,
        compactTitle: row.isCurrent ? row.team : `${row.team} ${sep} ${row.shortRole}`,
        ...(row.isCurrent ? { compactLine: `${row.role} ${sep} ${row.scoutLine}` } : {}),
      })),
    },
    highlights: {
      title: s.highlights.title,
      meta: s.highlights.meta,
      swipe: s.highlights.swipe,
      next: copy.glyph.next,
      listLabel: s.highlights.list,
      more: { label: s.highlights.more, href: contact.github, glyph: copy.glyph.external },
      // Strongest first (the content order is quarter-final to final).
      items: getHighlights(c)
        .slice()
        .reverse()
        .map((h, i) => ({
          round: h.round,
          tag: h.scoutTag,
          sep,
          title: h.name,
          shortTitle: h.shortName,
          body: h.scoutLine,
          short: h.scoutShort,
          stackLine: h.stack.join(` ${sep} `),
          featured: i === 0,
        })),
    },
    attributes: {
      title: s.attributes.title,
      meta: s.attributes.meta,
      legend: s.attributes.legend,
      groups: [
        ...attributeGroups
          .filter((g) => g.name !== CRAFT_GROUP)
          .map((g) => ({
            name: g.name,
            chips: g.skills.map((k) => ({ label: k.name, filled: k.level === "shipped" })),
          })),
        {
          name: s.attributes.craft,
          chips: c.scout.craftAndTools.map((label) => ({ label, filled: false })),
        },
      ],
    },
    trophies: {
      title: s.trophies.title,
      rows: getTrophies(c).map((t) => ({ title: t.title, sub: t.sub })),
    },
    academy: {
      title: s.academy.title,
      school: academy.school,
      degreeLine: `${academy.degree} ${sep} ${academy.honours}`,
      datesLine: `${formatSpan(academy.start, academy.end)} ${sep} ${s.cgpa} ${academy.cgpa}`,
    },
    teamUp: {
      eyebrow: s.teamUp.eyebrow,
      headline: s.teamUp.headline,
      links: [
        {
          label: contact.email,
          href: `mailto:${contact.email}`,
          glyph: copy.glyph.external,
        },
        {
          label: `${s.teamUp.linkedin} ${sep} ${handle(contact.linkedin)}`,
          href: contact.linkedin,
          glyph: copy.glyph.external,
        },
        {
          label: `${s.teamUp.github} ${sep} ${handle(contact.github)}`,
          href: contact.github,
          glyph: copy.glyph.external,
        },
        resumeRow,
      ],
    },
    footer: {
      credit: `${c.player.name} ${sep} ${c.player.title}`,
      arena: { label: s.footer.arena, to: routes.arena },
      next: copy.glyph.next,
    },
    actions: {
      label: s.actions.label,
      card: { label: s.actions.card, to: routes.card },
      teamUp: { label: s.actions.teamUp, href: TEAM_UP_HREF },
    },
  };
}
