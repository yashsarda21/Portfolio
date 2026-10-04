import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Heading, MonoLabel, Text } from "./Text";

describe("Text", () => {
  it("renders a span with the body recipe by default and no tone", () => {
    render(<Text>hello</Text>);
    const el = screen.getByText("hello");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("type-body");
    expect(el.className).not.toMatch(/\btext-/);
  });

  it("applies variant, tone and element", () => {
    render(
      <Text as="p" variant="comm" tone="body">
        Still not out.
      </Text>,
    );
    const el = screen.getByText("Still not out.");
    expect(el.tagName).toBe("P");
    expect(el).toHaveClass("type-comm", "text-text-1");
  });

  it("lets className override the recipe", () => {
    render(
      <Text variant="body" className="type-caption">
        x
      </Text>,
    );
    const el = screen.getByText("x");
    expect(el).toHaveClass("type-caption");
    expect(el).not.toHaveClass("type-body");
  });
});

describe("Heading", () => {
  it.each([
    [1, "type-d1"],
    [2, "type-d2"],
    [3, "type-d3"],
    [4, "type-d4"],
    [5, "type-d5"],
    [6, "type-d5"],
  ] as const)("level %i defaults to %s in floodlight", (level, recipe) => {
    render(<Heading level={level}>Title</Heading>);
    const el = screen.getByRole("heading", { level, name: "Title" });
    expect(el.tagName).toBe(`H${level}`);
    expect(el).toHaveClass(recipe, "text-floodlight");
  });

  it("accepts a variant override", () => {
    render(
      <Heading level={1} variant="d2s">
        Hub
      </Heading>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("type-d2s");
  });
});

describe("Text body-copy", () => {
  it("maps to the 15px / 1.5 card-copy recipe", () => {
    render(<Text variant="body-copy">Card copy</Text>);
    expect(screen.getByText("Card copy")).toHaveClass("type-body-copy");
  });
});

describe("MonoLabel", () => {
  it("defaults to the scout-grey panel label", () => {
    render(<MonoLabel>BOWL AT ME</MonoLabel>);
    expect(screen.getByText("BOWL AT ME")).toHaveClass("type-mono-label", "text-scout");
  });

  it("supports the volt eyebrow", () => {
    render(
      <MonoLabel variant="mono-eyebrow" tone="volt">
        CONTACT
      </MonoLabel>,
    );
    expect(screen.getByText("CONTACT")).toHaveClass("type-mono-eyebrow", "text-volt");
  });

  it.each([
    ["mono-kicker", "type-mono-kicker"],
    ["mono-meta", "type-mono-meta"],
    ["mono-date", "type-mono-date"],
  ] as const)("%s maps to its recipe", (variant, recipe) => {
    render(<MonoLabel variant={variant}>LABEL</MonoLabel>);
    expect(screen.getByText("LABEL")).toHaveClass(recipe);
  });
});
