import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./Icon";
import { ICONS } from "./icons";

describe("Icon", () => {
  it("is decorative by default", () => {
    const { container } = render(<Icon name="arrow-right" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("width", "18");
  });

  it("uses the artboard stroke width unless overridden", () => {
    const { container, rerender } = render(<Icon name="speaker" />);
    expect(container.querySelector("svg")).toHaveAttribute("stroke-width", "1.6");
    rerender(<Icon name="speaker" strokeWidth={2} />);
    expect(container.querySelector("svg")).toHaveAttribute("stroke-width", "2");
  });

  it("becomes an image with a name when given a title", () => {
    render(<Icon name="trophy" title="Trophy" />);
    expect(screen.getByRole("img", { name: "Trophy" })).toBeInTheDocument();
  });

  it("registry covers every artboard icon", () => {
    expect(Object.keys(ICONS).sort()).toEqual(
      [
        "arena",
        "arrow-right",
        "check",
        "close",
        "code",
        "copy",
        "download",
        "external",
        "linkedin",
        "list",
        "mail",
        "play",
        "plus-circle",
        "speaker",
        "speaker-loud",
        "speaker-off",
        "stats",
        "terminal",
        "trophy",
      ].sort(),
    );
  });
});
