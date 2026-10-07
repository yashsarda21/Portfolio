import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KeyValueList } from "./KeyValueList";
import { Legend } from "./Legend";
import { ProgressSteps } from "./ProgressSteps";

describe("KeyValueList", () => {
  it("renders a definition list with accented values", () => {
    const { container } = render(
      <KeyValueList
        items={[
          { k: "Home ground", v: "Pune, India" },
          { k: "Current club", v: "Deutsche Bank", accent: true },
        ]}
      />,
    );
    const dl = container.querySelector("dl")!;
    expect(
      within(dl)
        .getAllByRole("term")
        .map((t) => t.textContent),
    ).toEqual(["Home ground", "Current club"]);
    expect(screen.getByText("Deutsche Bank")).toHaveClass("text-volt");
    expect(screen.getByText("Pune, India")).toHaveClass("text-floodlight");
  });

  it("row variant: a rule above every row and under the last, on the font's own line box", () => {
    render(
      <KeyValueList
        items={[
          { k: "Home ground", v: "Pune, India" },
          { k: "Academy", v: "PICT" },
        ]}
      />,
    );
    const row = screen.getByText("Home ground").parentElement!;
    expect(row).toHaveClass("border-t", "last:border-b");
    expect(screen.getByText("Home ground")).toHaveClass("leading-auto");
    expect(screen.getByText("Pune, India")).toHaveClass("leading-auto");
  });

  it("stacked variant puts mono labels over values", () => {
    render(<KeyValueList variant="stacked" items={[{ k: "TYPE", v: "Analytics web platform" }]} />);
    expect(screen.getByText("TYPE")).toHaveClass("type-mono-xs");
  });
});

describe("KeyValueList profile variant", () => {
  const items = [
    { k: "Playing style", v: "Full-stack" },
    { k: "Kit bag", v: "Git · Google Cloud", stacked: true },
  ];

  it("is one definition list under a single rule, with compact rows", () => {
    const { container } = render(<KeyValueList variant="profile" items={items} />);
    const dl = container.querySelector("dl")!;
    expect(dl).toHaveClass("border-t", "pt-3.5");
    expect(
      within(dl)
        .getAllByRole("term")
        .map((t) => t.textContent),
    ).toEqual(["Playing style", "Kit bag"]);
    expect(screen.getByText("Full-stack")).toHaveClass("type-body-sm", "text-right");
    // No per-row rules: the one rule is the list's.
    expect(container.querySelectorAll(".border-b").length).toBe(0);
  });

  it("a stacked item puts a mono value under its label", () => {
    render(<KeyValueList variant="profile" items={items} />);
    expect(screen.getByText("Git · Google Cloud")).toHaveClass("type-mono-run");
    expect(screen.getByText("Kit bag").parentElement).toHaveClass("flex-col");
    expect(screen.getByText("Playing style").parentElement).not.toHaveClass("flex-col");
  });
});

describe("Legend", () => {
  it("lists swatches with labels", () => {
    render(
      <Legend
        items={[
          { label: "SHIPPED AT DEUTSCHE BANK", swatch: "volt" },
          { label: "BUILT IN PROJECTS", swatch: "floodlight" },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]!.querySelector("[aria-hidden]")).toHaveClass("bg-volt");
  });
});

describe("ProgressSteps", () => {
  it("describes progress in words and lights the right cells", () => {
    render(<ProgressSteps total={3} done={1} current label="1 of 3 venues played" />);
    const meter = screen.getByRole("img", { name: "1 of 3 venues played" });
    const cells = Array.from(meter.children);
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveClass("bg-volt");
    expect(cells[1]).toHaveClass("bg-volt-a35");
    expect(cells[2]).toHaveClass("bg-seg-empty");
  });

  it("clamps done to the total", () => {
    render(<ProgressSteps total={3} done={9} label="done" variant="segment" />);
    const cells = Array.from(screen.getByRole("img").children);
    expect(cells.every((c) => c.classList.contains("bg-volt"))).toBe(true);
    expect(cells[0]).toHaveClass("w-21", "h-1.5");
  });
});
