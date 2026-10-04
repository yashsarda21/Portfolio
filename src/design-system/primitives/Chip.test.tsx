import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Chip, ChipList } from "./Chip";

describe("Chip", () => {
  it("defaults to an outlined mono tag", () => {
    render(<Chip>Java</Chip>);
    expect(screen.getByText("Java")).toHaveClass(
      "type-mono-md",
      "border",
      "border-line-strong",
      "h-8",
    );
  });

  it("volt fill marks shipped skills", () => {
    render(<Chip tone="volt">React</Chip>);
    expect(screen.getByText("React")).toHaveClass("bg-volt", "text-volt-ink");
  });
});

describe("Chip sizes", () => {
  it("code size uses the code recipe, not the base mono-md", () => {
    render(<Chip size="code">Java 21</Chip>);
    const chip = screen.getByText("Java 21");
    expect(chip).toHaveClass("type-mono-code");
    expect(chip).not.toHaveClass("type-mono-md");
  });

  it("meta size uses the chip recipe with a tighter mobile padding", () => {
    render(<Chip size="meta">PUNE</Chip>);
    const chip = screen.getByText("PUNE");
    expect(chip).toHaveClass("type-mono-chip", "px-3", "py-2", "max-md:px-2");
    expect(chip).not.toHaveClass("type-mono-md");
  });
});

describe("ChipList", () => {
  it("renders a labelled list of chips", () => {
    render(<ChipList items={["React", "Spring Boot", "Oracle"]} label="Stack" size="sm" />);
    const list = screen.getByRole("list", { name: "Stack" });
    const items = within(list).getAllByRole("listitem");
    expect(items.map((i) => i.textContent)).toEqual(["React", "Spring Boot", "Oracle"]);
    expect(within(list).getByText("React")).toHaveClass("h-7.5");
  });
});
