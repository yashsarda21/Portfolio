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

describe("ChipList", () => {
  it("renders a labelled list of chips", () => {
    render(<ChipList items={["React", "Spring Boot", "Oracle"]} label="Stack" size="sm" />);
    const list = screen.getByRole("list", { name: "Stack" });
    const items = within(list).getAllByRole("listitem");
    expect(items.map((i) => i.textContent)).toEqual(["React", "Spring Boot", "Oracle"]);
    expect(within(list).getByText("React")).toHaveClass("h-7.5");
  });
});
