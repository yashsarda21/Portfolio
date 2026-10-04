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

  it("text=name writes the name as given: the untracked mono face, not the uppercase label", () => {
    render(
      <Chip size="md" text="name">
        Spring Boot
      </Chip>,
    );
    const chip = screen.getByText("Spring Boot");
    expect(chip).toHaveClass("type-mono-stack");
    expect(chip).not.toHaveClass("type-mono-md");
  });

  it("text=label (the default) keeps the uppercase mono label", () => {
    render(<Chip size="sm">Node.js</Chip>);
    expect(screen.getByText("Node.js")).toHaveClass("type-mono-md");
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

  it("names the list by its visible heading, and hides the heading from assistive tech", () => {
    render(<ChipList items={["Java", "Oracle"]} heading="SHOTS PLAYED" />);
    const list = screen.getByRole("list", { name: "SHOTS PLAYED" });
    expect(within(list).getAllByRole("listitem")).toHaveLength(2);
    const heading = screen.getByText("SHOTS PLAYED");
    expect(heading).toHaveAttribute("aria-hidden", "true");
    expect(list).not.toContainElement(heading);
  });

  it("an explicit label wins over the heading as the accessible name", () => {
    render(<ChipList items={["Java"]} heading="STACK" label="Tools used" />);
    expect(screen.getByRole("list", { name: "Tools used" })).toBeInTheDocument();
  });

  it("without a heading it renders only the list", () => {
    const { container } = render(<ChipList items={["Java"]} label="Stack" />);
    expect(container.firstElementChild?.tagName).toBe("UL");
  });
});
