import { getHighlights, type Content, type UiCopy } from "@/content";

export interface HighlightLinkView {
  label: string;
  href: string;
  tone: "outline" | "primary";
  /** Trailing mark: ↗ for outside links, → for the case study. Decorative. */
  glyph: string;
}

export interface HighlightItemView {
  /** Slug of the name; the draw row's value. */
  id: string;
  round: string;
  name: string;
  kind: string;
  line: string;
  media: {
    /** The placeholder text, or the video's accessible name. */
    label: string;
    badge: string;
    round: string;
    video: { src: string; poster?: string; captions?: string } | null;
  };
  par: {
    serve: { label: string; text: string };
    rally: { label: string; text: string };
    winner: { label: string; text: string };
  };
  facts: { k: string; v: string }[];
  stackLabel: string;
  stack: string[];
  links: HighlightLinkView[];
  /** What the commentary bar says when this item is picked. */
  comm: string;
}

export interface HighlightsView {
  /** "3 OF 3 UNLOCKED" */
  unlocked: string;
  drawLabel: string;
  listLabel: string;
  items: HighlightItemView[];
  /** The item selected first: the final (spec §11.2 #3). */
  defaultId: string;
  shotDataLabel: string;
}

const FINAL = "THE FINAL";

const slug = (name: string) =>
  name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

/** The highlights page, as plain strings. Pure: no React, no DOM. */
export function buildHighlightsView(c: Content, copy: UiCopy): HighlightsView {
  const t = copy.pages.highlights;
  const sep = copy.glyph.sep;
  const highlights = getHighlights(c);

  const items = highlights.map((h): HighlightItemView => {
    const links: HighlightLinkView[] = [
      {
        label: t.code,
        href: h.links?.code ?? c.player.contact.github,
        tone: "outline",
        glyph: copy.glyph.external,
      },
    ];
    if (h.links?.demo) {
      links.push({
        label: t.demo,
        href: h.links.demo,
        tone: "outline",
        glyph: copy.glyph.external,
      });
    }
    if (h.links?.caseStudy) {
      links.push({
        label: t.caseStudy,
        href: h.links.caseStudy,
        tone: "primary",
        glyph: copy.glyph.next,
      });
    }

    return {
      id: slug(h.name),
      round: h.round,
      name: h.name,
      kind: h.kind,
      line: h.line,
      media: {
        label: `${h.name} ${sep} ${t.comingSoon}`,
        badge: t.replay,
        round: h.round,
        video: h.media ? { src: h.media } : null,
      },
      par: {
        serve: { label: t.serve, text: h.serve },
        rally: { label: t.rally, text: h.rally },
        winner: { label: t.winner, text: h.winner },
      },
      facts: h.facts,
      stackLabel: t.stack,
      stack: h.stack,
      links,
      comm: h.round === FINAL ? t.commFinal : c.commentary.reveal[0]!,
    };
  });

  return {
    unlocked: `${items.length} ${t.of} ${items.length} ${t.unlocked}`,
    drawLabel: t.draw,
    listLabel: t.listLabel,
    items,
    defaultId: (items.find((i) => i.round === FINAL) ?? items.at(-1)!).id,
    shotDataLabel: t.shotData,
  };
}
