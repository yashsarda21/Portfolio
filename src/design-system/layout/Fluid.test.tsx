import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LinkRow } from "../primitives/LinkRow";
import { Text } from "../primitives/Text";
import { HorizontalScroller } from "./HorizontalScroller";
import { SectionHeader } from "./SectionHeader";
import { StickyBottomActions } from "./StickyBottomActions";

describe("SectionHeader", () => {
  it("renders a heading at the chosen level with the section recipe and a meta label", () => {
    render(<SectionHeader title="Career" meta="2024 — NOW" level={3} id="career" />);
    const h = screen.getByRole("heading", { level: 3, name: "Career" });
    expect(h).toHaveClass("type-section");
    expect(h).toHaveAttribute("id", "career");
    expect(screen.getByText("2024 — NOW")).toHaveClass("type-mono-md");
  });

  it("md size uses the smaller recipe and meta is optional", () => {
    const { container } = render(<SectionHeader title="Skills" size="md" />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveClass("type-section-sm");
    expect(container.querySelectorAll(".type-mono-md")).toHaveLength(0);
  });
});

describe("LinkRow", () => {
  it("is a focusable anchor with a volt-ink focus ring and an aria-hidden glyph", () => {
    render(
      <LinkRow href="/x" glyph="→">
        Email me
      </LinkRow>,
    );
    const link = screen.getByRole("link", { name: "Email me" });
    expect(link).toHaveClass("focus-visible:outline-volt-ink", "min-h-14", "font-semibold");
    const glyph = screen.getByText("→");
    expect(glyph).toHaveAttribute("aria-hidden", "true");
  });
});

describe("HorizontalScroller", () => {
  it("is a focusable, named list with an aria-hidden fade, and merges class overrides", () => {
    const { container } = render(
      <HorizontalScroller label="Projects" listClassName="md:grid" fadeClassName="md:hidden">
        <li>One</li>
        <li>Two</li>
      </HorizontalScroller>,
    );
    const list = screen.getByRole("list", { name: "Projects" });
    expect(list).toHaveAttribute("tabindex", "0");
    expect(list).toHaveClass("overflow-x-auto", "md:grid");
    const fade = container.querySelector("[aria-hidden='true']");
    expect(fade).toHaveClass("pointer-events-none", "md:hidden");
  });
});

describe("StickyBottomActions", () => {
  it("is a named nav landmark", () => {
    render(
      <StickyBottomActions label="Quick actions">
        <Text>A</Text>
      </StickyBottomActions>,
    );
    expect(screen.getByRole("navigation", { name: "Quick actions" })).toHaveClass(
      "fixed",
      "md:hidden",
    );
  });
});
