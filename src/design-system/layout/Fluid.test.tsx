import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { LinkRow } from "../primitives/LinkRow";
import { Text } from "../primitives/Text";
import { AutoGrid } from "./AutoGrid";
import { FluidContainer } from "./FluidContainer";
import { FluidSection } from "./FluidSection";
import { HorizontalScroller } from "./HorizontalScroller";
import { SectionHeader } from "./SectionHeader";
import { StickyBottomActions } from "./StickyBottomActions";

describe("SectionHeader", () => {
  it("renders a heading at the chosen level with the section recipe and a meta label", () => {
    render(<SectionHeader title="Career" meta="2024 — NOW" level={3} id="career" />);
    const h = screen.getByRole("heading", { level: 3, name: "Career" });
    expect(h).toHaveClass("type-section");
    expect(h).toHaveAttribute("id", "career");
    expect(screen.getByText("2024 — NOW")).toHaveClass("type-mono-meta");
  });

  it("md size uses the smaller recipe and meta is optional", () => {
    const { container } = render(<SectionHeader title="Skills" size="md" />);
    expect(screen.getByRole("heading", { level: 2 })).toHaveClass("type-section-sm");
    expect(container.querySelectorAll(".type-mono-meta")).toHaveLength(0);
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
    expect(link).toHaveClass(
      "focus-visible:outline-volt-ink",
      "min-h-14.25",
      "last:min-h-14",
      "font-semibold",
    );
    const glyph = screen.getByText("→");
    expect(glyph).toHaveAttribute("aria-hidden", "true");
  });
});

describe("LinkRow tones", () => {
  it("outline has no ink classes and a hover volt border", () => {
    render(
      <LinkRow tone="outline" href="/x" glyph="↗">
        Code on GitHub
      </LinkRow>,
    );
    const link = screen.getByRole("link", { name: "Code on GitHub" });
    expect(link.className).not.toMatch(/ink/);
    expect(link).toHaveClass("border-line-strong", "type-mono-nav", "hover:border-volt");
  });

  it("primary is a volt fill with ink text", () => {
    render(
      <LinkRow tone="primary" href="/x" glyph="→">
        Full case study
      </LinkRow>,
    );
    expect(screen.getByRole("link", { name: "Full case study" })).toHaveClass(
      "bg-volt",
      "text-volt-ink",
    );
  });

  it("band stays the default", () => {
    render(<LinkRow href="/x">Plain</LinkRow>);
    expect(screen.getByRole("link", { name: "Plain" })).toHaveClass("border-ink-a25");
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
    // Explicit: Tailwind's list-style:none makes Safari/VoiceOver drop the implicit list role.
    expect(list).toHaveAttribute("role", "list");
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

  it("marks itself so base.css can pad the scroll area above it", () => {
    render(
      <StickyBottomActions label="Quick actions">
        <Text>A</Text>
      </StickyBottomActions>,
    );
    expect(screen.getByRole("navigation", { name: "Quick actions" })).toHaveAttribute(
      "data-bottom-actions",
    );
  });
});

describe("AutoGrid", () => {
  it("is a div grid at 300px by default and merges className", () => {
    const { container } = render(<AutoGrid className="gap-4">x</AutoGrid>);
    const grid = container.firstElementChild!;
    expect(grid.tagName).toBe("DIV");
    expect(grid).toHaveClass(
      "grid",
      "grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))]",
      "gap-4",
    );
  });

  it.each([250, 300, 360, 380] as const)("min=%i sets its own column track", (min) => {
    const { container } = render(<AutoGrid min={min}>x</AutoGrid>);
    expect(container.firstElementChild).toHaveClass(
      `grid-cols-[repeat(auto-fit,minmax(min(${min}px,100%),1fr))]`,
    );
  });

  it("from=md only becomes a grid from 768px up, and renders as the element asked for", () => {
    render(
      <AutoGrid as="ul" min={380} from="md" aria-label="Cards">
        <li>x</li>
      </AutoGrid>,
    );
    const list = screen.getByRole("list", { name: "Cards" });
    expect(list).toHaveClass(
      "md:grid",
      "md:grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))]",
    );
    expect(list).not.toHaveClass("grid");
  });
});

describe("FluidContainer", () => {
  it("centres a 312-unit column with 24px gutters (16px on mobile)", () => {
    const { container } = render(<FluidContainer as="main">x</FluidContainer>);
    const el = container.firstElementChild!;
    expect(el.tagName).toBe("MAIN");
    expect(el).toHaveClass("mx-auto", "max-w-312", "px-6", "max-md:px-4");
  });
});

describe("FluidSection", () => {
  it("is a named section that owns the anchor offset, with the tablet header allowance", () => {
    render(
      <FluidSection id="career" aria-label="Career">
        x
      </FluidSection>,
    );
    const section = screen.getByRole("region", { name: "Career" });
    expect(section).toHaveAttribute("id", "career");
    expect(section).toHaveClass("scroll-mt-20", "md:max-lg:scroll-mt-32");
    expect(section).toHaveClass("flex", "flex-col", "max-md:border-t");
  });

  it("can drop the stack and the mobile divider but keeps the offset", () => {
    render(
      <FluidSection stack={false} divided={false} aria-label="Band">
        x
      </FluidSection>,
    );
    const section = screen.getByRole("region", { name: "Band" });
    expect(section).toHaveClass("scroll-mt-20", "md:max-lg:scroll-mt-32");
    expect(section).not.toHaveClass("flex");
    expect(section).not.toHaveClass("max-md:border-t");
  });
});
