import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content, ui, type Content } from "@/content";
import { Replay } from "./Replay";
import { ShotData } from "./ShotData";
import { buildHighlightsView } from "./view";

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

const withVideo = (): Content => ({
  ...content,
  matchHighlights: content.matchHighlights.map((h) =>
    h.round === "THE FINAL" ? { ...h, media: { src: "/media/ai.mp4", silent: true } } : h,
  ),
});

const finalItem = (c: Content) =>
  buildHighlightsView(c, ui).items.find((i) => i.round === "THE FINAL")!;

describe("ShotData links", () => {
  it("every link opens in the same tab, as drawn, with no new-tab hint", () => {
    const item = finalItem(withLinks());
    render(<ShotData item={item} label={ui.pages.highlights.shotData} />);
    const links = screen.getAllByRole("link");
    expect(links.map((l) => l.textContent)).toEqual([
      `${ui.pages.highlights.code}${ui.glyph.external}`,
      `${ui.pages.highlights.demo}${ui.glyph.external}`,
      `${ui.pages.highlights.caseStudy}${ui.glyph.next}`,
    ]);
    for (const link of links) {
      expect(link).not.toHaveAttribute("target");
      expect(link).not.toHaveAttribute("rel");
    }
    expect(screen.queryByText(ui.a11y.newTab)).toBeNull();
  });

  it("names the stack list by its visible heading", () => {
    render(<ShotData item={finalItem(content)} label={ui.pages.highlights.shotData} />);
    expect(screen.getByRole("list", { name: ui.pages.highlights.stack })).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: ui.pages.highlights.shotData }),
    ).toBeInTheDocument();
  });
});

describe("Replay", () => {
  it("the placeholder (no recording yet) says the replay is coming and has no video", () => {
    const item = buildHighlightsView(content, ui).items.find((i) => i.media.video === null)!;
    const { container } = render(<Replay item={item} />);
    expect(container.querySelector("video")).toBeNull();
    expect(screen.getByText(/REPLAY COMING SOON/)).toBeInTheDocument();
  });

  it("a recording is named for the project and described by the project line and the problem / approach / result", () => {
    const item = finalItem(withVideo());
    const { container } = render(<Replay item={item} />);
    const video = container.querySelector("video")!;
    expect(video).toHaveAttribute(
      "aria-label",
      `${item.name} ${ui.glyph.sep} ${ui.pages.highlights.replay}`,
    );
    expect(video).toHaveAttribute("data-silent");
    expect(container.querySelector("track")).toBeNull();
    expect(screen.queryByText(/coming soon/i)).toBeNull();
    const ids = video.getAttribute("aria-describedby")!.split(" ");
    expect(ids).toHaveLength(2);
    const [line, par] = ids.map((id) => container.querySelector(`#${CSS.escape(id)}`)!);
    expect(line).toHaveTextContent(item.line);
    for (const cell of [item.par.serve, item.par.rally, item.par.winner]) {
      expect(within(par as HTMLElement).getByText(cell.text)).toBeInTheDocument();
    }
  });
});
