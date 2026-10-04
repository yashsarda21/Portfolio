import { getAttributeGroups, getCareerRows, type Content, type UiCopy } from "@/content";

type Level = "shipped" | "built" | "kit";

export interface AttributesView {
  legend: { label: string; swatch: "volt" | "floodlight" | "dim" }[];
  profile: {
    portrait: { src: string; alt: string };
    badge: { value: string; label: string };
    name: string;
    roleLine: string;
    rows: { k: string; v: string }[];
    /** The kit bag is a line of tools, shown stacked under its label. */
    kitBag: { label: string; items: string };
  };
  groups: {
    name: string;
    /** "SHOT · Smash": the page sets the case. */
    shotLine: string;
    note: string;
    skills: { name: string; level: Level; tierLabel: string }[];
  }[];
}

/** The attributes page, as plain strings. Pure: no React, no DOM. */
export function buildAttributesView(c: Content, copy: UiCopy, portraitSrc: string): AttributesView {
  const t = copy.pages.attributes;
  const sep = copy.glyph.sep;
  const { player, playerAttributes } = c;
  const current = getCareerRows(c).find((row) => row.isCurrent);

  return {
    legend: [
      { label: t.legend.shipped, swatch: "volt" },
      { label: t.legend.built, swatch: "floodlight" },
      { label: t.legend.kit, swatch: "dim" },
    ],
    profile: {
      portrait: { src: portraitSrc, alt: t.portraitAlt },
      badge: { value: player.position, label: t.position },
      name: player.name,
      roleLine: `${current?.role ?? player.title} ${sep} ${player.currentClub}`,
      rows: [
        { k: t.profile.playingStyle, v: player.playingStyle },
        { k: t.profile.languages, v: playerAttributes.languages.join(` ${sep} `) },
      ],
      kitBag: { label: t.profile.kitBag, items: playerAttributes.kitBag.join(` ${sep} `) },
    },
    groups: getAttributeGroups(c).map((group) => ({
      name: group.name,
      shotLine: `${t.shot} ${sep} ${group.shot}`,
      note: group.note,
      skills: group.skills.map(({ name, level, tierLabel }) => ({ name, level, tierLabel })),
    })),
  };
}
