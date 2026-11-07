import { describe, expect, it } from "vitest";
import { content, ui, type Content } from "@/content";
import { buildHighlightsView } from "./view";

const build = (c: Content = content) => buildHighlightsView(c, ui);
const [final, semi, quarter] = [0, 1, 2].map((i) => content.matchHighlights[i]!);

const withLinks = (): Content => ({
  ...content,
  matchHighlights: content.matchHighlights.map((h, i) =>
    i === 0
      ? {
          ...h,
          links: {
            code: "https://github.com/yashsarda21/ai-interview",
            demo: "https://example.com/demo",
            caseStudy: "https://example.com/case-study",
          },
        }
      : h,
  ),
});

describe("buildHighlightsView", () => {
  it("lists the rounds quarter-final, semi-final, final", () => {
    const { items } = build();
    expect(items.map((i) => i.round)).toEqual(["QUARTER-FINAL", "SEMI-FINAL", "THE FINAL"]);
    expect(items.map((i) => i.name)).toEqual([quarter!.name, semi!.name, final!.name]);
  });

  it("ids are slugs of the names, and the final is selected first", () => {
    const { items, defaultId } = build();
    expect(items.map((i) => i.id)).toEqual([
      "power-bi-dashboard",
      "ai-interview-grooming-platform",
      "taketray",
    ]);
    expect(defaultId).toBe("taketray");
  });

  it("carries the labels and the unlocked count", () => {
    const view = build();
    expect(view.unlocked).toBe("3 OF 3 UNLOCKED");
    expect(view.drawLabel).toBe("THE DRAW");
    expect(view.listLabel).toBe("Projects");
    expect(view.shotDataLabel).toBe("SHOT DATA");
  });

  it("each item: line, kind, problem / approach / result, facts and stack", () => {
    const item = build().items[2]!;
    expect(item).toMatchObject({
      kind: final!.kind,
      line: final!.line,
      facts: final!.facts,
      stack: final!.stack,
      stackLabel: "STACK",
    });
    expect(item.par).toEqual({
      serve: { label: "THE SERVE · PROBLEM", text: final!.serve },
      rally: { label: "THE RALLY · APPROACH", text: final!.rally },
      winner: { label: "THE WINNER · RESULT", text: final!.winner },
    });
  });

  it("links: one CODE ON GITHUB link, to the project repo when the content has one, else the GitHub profile", () => {
    for (const [i, item] of build().items.entries()) {
      expect(item.links).toEqual([
        {
          label: "CODE ON GITHUB",
          href: final!.links?.code && i === 2 ? final!.links.code : content.player.contact.github,
          tone: "outline",
          glyph: "↗",
        },
      ]);
    }
  });

  it("links: code, demo and case study in that order when the content has them", () => {
    const item = build(withLinks()).items.find((i) => i.round === "THE FINAL")!;
    expect(item.links).toEqual([
      {
        label: "CODE ON GITHUB",
        href: "https://github.com/yashsarda21/ai-interview",
        tone: "outline",
        glyph: "↗",
      },
      { label: "LIVE DEMO", href: "https://example.com/demo", tone: "outline", glyph: "↗" },
      {
        label: "FULL CASE STUDY",
        href: "https://example.com/case-study",
        tone: "primary",
        glyph: "→",
      },
    ]);
  });

  it("media: a placeholder labelled with the name and 'replay coming soon', no video", () => {
    const { media } = build().items[2]!;
    expect(media).toEqual({
      label: "TakeTray · REPLAY COMING SOON",
      badge: "REPLAY",
      round: "THE FINAL",
      video: null,
    });
  });

  it("media: a recording in the content becomes the video, with the poster and the silent flag", () => {
    const withVideo: Content = {
      ...content,
      matchHighlights: content.matchHighlights.map((h) =>
        h.round === "THE FINAL"
          ? { ...h, media: { src: "/media/ai.mp4", poster: "/media/ai.png", silent: true } }
          : h,
      ),
    };
    expect(build(withVideo).items[2]!.media.video).toEqual({
      src: "/media/ai.mp4",
      poster: "/media/ai.png",
      silent: true,
    });
  });

  it("media: a recording is named by the project and REPLAY, never 'coming soon'", () => {
    const withVideo: Content = {
      ...content,
      matchHighlights: content.matchHighlights.map((h) =>
        h.round === "THE FINAL" ? { ...h, media: { src: "/media/ai.mp4", silent: true } } : h,
      ),
    };
    const { media } = build(withVideo).items[2]!;
    expect(media.label).toBe("TakeTray · REPLAY");
    expect(media.label).not.toMatch(/coming soon/i);
    // The placeholder keeps its own label for the projects with no recording yet.
    expect(build(withVideo).items[0]!.media.label).toMatch(/REPLAY COMING SOON$/);
  });

  it("media: captions get their label and language from the interface copy", () => {
    const withCaptions: Content = {
      ...content,
      matchHighlights: content.matchHighlights.map((h) =>
        h.round === "THE FINAL"
          ? { ...h, media: { src: "/media/ai.mp4", captions: "/media/ai.vtt", silent: false } }
          : h,
      ),
    };
    expect(build(withCaptions).items[2]!.media.video).toEqual({
      src: "/media/ai.mp4",
      captions: { src: "/media/ai.vtt", label: "English", srcLang: "en" },
      silent: false,
    });
  });

  it("comm: the final says its own line, the others the first reveal line", () => {
    const { items } = build();
    expect(items[2]!.comm).toBe(ui.pages.highlights.commFinal);
    expect(items[0]!.comm).toBe("Another project shipped.");
    expect(items[1]!.comm).toBe(content.commentary.reveal[0]);
  });

  it("a fourth project makes a fourth item (no fixed counts)", () => {
    const extra: Content = {
      ...content,
      matchHighlights: [
        ...content.matchHighlights,
        { ...quarter!, name: "Side Project", round: "QUARTER-FINAL" },
      ],
    };
    const view = build(extra);
    expect(view.items).toHaveLength(4);
    expect(view.unlocked).toBe("4 OF 4 UNLOCKED");
    expect(view.defaultId).toBe("taketray");
  });
});
