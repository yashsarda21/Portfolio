import { getAcademy, getTrophies, type Content, type UiCopy } from "@/content";
import type { TrophyKind } from "@/design-system";
import type { ROUTES } from "@/shell/routes";

export interface TrophyDetail {
  /** "2 / 5": the position among the trophies won. The locked one is not counted. */
  index: string;
  title: string;
  sub: string;
  description: string;
  links: { label: string; href: string }[];
}

export interface TrophyView {
  id: string;
  kind: TrophyKind;
  title: string;
  /** The line under the title on the shelf (the short sub where the content has one). */
  shelfSub: string;
  locked: boolean;
  /** The lettering drawn on the art: the medal's figure ("99.5"), the plaque's word ("PAPER"). */
  label?: string;
  /** What the plinth panel shows. A locked trophy has none: there is nothing to read yet. */
  detail: TrophyDetail | null;
}

export interface TrophiesView {
  listLabel: string;
  trophies: TrophyView[];
  /** The trophy selected first: the first one won (the cup). Empty if none is. */
  defaultId: string;
  plinthLabel: string;
  academy: {
    id: "academy";
    eyebrow: string;
    aside: string;
    title: string;
    monogram: string;
    name: string;
    degree: string;
    meta: string;
    extrasLabel: string;
    /** The extras as one line, joined with the separator. */
    extras: string;
    /** The same extras, one per entry: the card draws them as a list. */
    extraItems: string[];
  };
}

/** The first number in a title: "99.5 Percentile" gives "99.5". */
const figureOf = (title: string) => /\d+(?:\.\d+)?/.exec(title)?.[0];

/** The Trophy Room, as plain strings. Pure: no React, no DOM. */
export function buildTrophiesView(c: Content, copy: UiCopy, _routes: typeof ROUTES): TrophiesView {
  const t = copy.pages.trophies;
  const sep = copy.glyph.sep;
  const all = getTrophies(c);
  const won = all.filter((trophy) => !trophy.locked).length;

  let seen = 0;
  const trophies: TrophyView[] = all.map((trophy, i) => {
    const kind: TrophyKind = trophy.type;
    const label =
      kind === "medal" ? figureOf(trophy.title) : kind === "plaque" ? t.plaqueLabel : undefined;
    return {
      id: `trophy-${i + 1}`,
      kind,
      title: trophy.title,
      shelfSub: trophy.shortSub ?? trophy.sub,
      locked: trophy.locked,
      ...(label ? { label } : {}),
      detail: trophy.locked
        ? null
        : {
            index: `${++seen} / ${won}`,
            title: trophy.title,
            sub: trophy.sub,
            description: trophy.description,
            links: trophy.links.map(({ label: name, href }) => ({ label: name, href })),
          },
    };
  });

  const school = getAcademy(c);
  return {
    listLabel: t.listLabel,
    trophies,
    defaultId: trophies.find((trophy) => !trophy.locked)?.id ?? "",
    plinthLabel: t.plinth,
    academy: {
      id: "academy",
      eyebrow: t.academy.eyebrow,
      aside: t.academy.aside,
      title: copy.scout.academy.title,
      monogram: school.shortName,
      name: school.name,
      degree: school.degree,
      meta: [school.span, `${copy.scout.cgpa} ${school.cgpa}`, school.honours].join(` ${sep} `),
      extrasLabel: t.academy.extras,
      extras: school.extras.join(` ${sep} `),
      extraItems: [...school.extras],
    },
  };
}
