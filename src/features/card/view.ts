import { formatMonthLong, getAcademy, getResumeAction, type Content, type UiCopy } from "@/content";
import type { ROUTES } from "@/shell/routes";

type TakeAction = {
  kind: "pdf-view" | "pdf-download" | "request";
  title: string;
  sub: string;
  href: string;
  /** The PDF view opens in a new tab (the row says so to screen readers). */
  newTab?: boolean;
  /** The PDF download's file name. */
  download?: string;
};

export interface CardView {
  titleLines: string[];
  bio: string;
  rows: { k: string; v: string; accent?: boolean }[];
  front: {
    position: { value: string; label: string };
    mark: string;
    season: { label: string; buildYear: number };
    portrait: { src: string; alt: string };
    name: string;
    /** "Software Engineer · Deutsche Bank": the card sets the case. */
    line: string;
    stats: { label: string; value: string; accent: boolean }[];
    footer: { left: string; right: string };
  };
  back: {
    title: string;
    items: { label: string; to: string }[];
    /** The address, one tap from the index: the back is the full sheet, so it says how to reach the player. */
    contact: { label: string; value: string; href: string };
    footer: { left: string; right: string };
  };
  hint: { pointer: string; touch: string };
  take: {
    label: string;
    actions: TakeAction[];
    /** Read after a link that opens a new tab. */
    newTabHint: string;
    copy: {
      title: string;
      sub: string;
      /** The visible line once copied ("LINK COPIED ✓"). */
      done: string;
      /** What screen readers hear once copied (the check mark is not read well). */
      announce: string;
      /** The label of the fallback field. */
      fallback: string;
      url: string;
    };
  };
  backNote: { label: string; text: string; meta: string };
  flip: { toBack: string; toFront: string };
}

/** How many of the card's stats are drawn in volt (the headline three). */
const ACCENTED_STATS = 3;

/**
 * The player card page, as plain strings. Pure: no React, no DOM. `origin` is the site's origin on the
 * client and "" while prerendering (the scouting link is then a relative path); `buildYear` is the year the
 * page was built, which the card shows until the client's own year replaces it.
 */
export function buildCardView(
  c: Content,
  copy: UiCopy,
  routes: typeof ROUTES,
  opts: { portraitSrc: string; origin: string; buildYear: number },
): CardView {
  const t = copy.pages.card;
  const sep = copy.glyph.sep;
  const { player } = c;
  const academy = getAcademy(c);
  const footer = { left: t.number, right: copy.record.career };

  const resume = getResumeAction(c);
  const actions: TakeAction[] =
    resume.kind === "pdf"
      ? [
          {
            kind: "pdf-view",
            title: t.view.title,
            sub: t.view.sub,
            href: resume.href,
            newTab: true,
          },
          {
            kind: "pdf-download",
            title: t.download.title,
            sub: t.download.sub,
            href: resume.href,
            download: copy.scout.resume.fileName,
          },
        ]
      : [{ kind: "request", title: t.request.title, sub: t.request.sub, href: resume.href }];

  return {
    titleLines: [...t.titleLines],
    bio: player.cardBio,
    rows: [
      { k: t.rows.home, v: player.location },
      { k: t.rows.debut, v: formatMonthLong(player.proSince) },
      { k: t.rows.club, v: player.currentClub },
      {
        k: t.rows.academy,
        v: `${academy.shortName} ${sep} ${copy.scout.cgpa} ${academy.cgpa}`,
        accent: true,
      },
    ],
    front: {
      position: { value: player.position, label: t.position },
      mark: copy.brand.mark,
      season: { label: t.season, buildYear: opts.buildYear },
      portrait: { src: opts.portraitSrc, alt: player.name },
      name: player.name,
      line: `${player.title} ${sep} ${player.currentClub}`,
      stats: player.cardStats.map(({ label, value, cardValue }, i) => ({
        label,
        value: cardValue ?? value,
        accent: i < ACCENTED_STATS,
      })),
      footer,
    },
    back: {
      title: t.backTitle,
      items: [
        { label: t.back.career, to: routes.career },
        { label: t.back.highlights, to: routes.highlights },
        { label: t.back.skills, to: routes.attributes },
        { label: t.back.trophies, to: routes.trophies },
        { label: t.back.contact, to: routes.teamUp },
      ],
      contact: {
        label: copy.pages.teamUp.channels.email,
        value: player.contact.email,
        href: `mailto:${player.contact.email}`,
      },
      footer,
    },
    hint: { pointer: t.hint, touch: t.hintTouch },
    take: {
      label: t.take,
      actions,
      newTabHint: copy.a11y.newTab,
      copy: {
        title: t.copy.title,
        sub: t.copy.sub,
        done: t.copy.done,
        announce: copy.a11y.copied,
        fallback: t.copy.fallback,
        url: `${opts.origin}${routes.scout}`,
      },
    },
    backNote: { ...t.backNote },
    flip: { toBack: t.flipToBack, toFront: t.flipToFront },
  };
}
