import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Scoreboard } from "./Scoreboard";
import { SegmentBar } from "./SegmentBar";
import { SkillGroup } from "./SkillGroup";
import { SkillRow } from "./SkillRow";

describe("SegmentBar", () => {
  it("is an image labelled with the evidence by default", () => {
    render(<SegmentBar level="shipped" label="Java: shipped in production" />);
    expect(screen.getByRole("img", { name: "Java: shipped in production" })).toBeInTheDocument();
  });

  it("decorative hides the bar from assistive tech", () => {
    const { container } = render(<SegmentBar level="kit" label="x" decorative />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.firstElementChild).not.toHaveAttribute("aria-label");
  });

  it("SkillRow states the evidence in text and leaves the bar decorative", () => {
    const { container } = render(<SkillRow name="Java" level="shipped" tierLabel="SHIPPED" />);
    expect(screen.queryByRole("img")).toBeNull();
    expect(container.querySelector("[aria-hidden='true']")).not.toBeNull();
    expect(screen.getByText("Java")).toBeInTheDocument();
    expect(screen.getByText("SHIPPED")).toBeInTheDocument();
  });
});

describe("Scoreboard", () => {
  it("Title renders a span by default and any element via as", () => {
    const { rerender } = render(<Scoreboard.Title>YASH</Scoreboard.Title>);
    expect(screen.getByText("YASH").tagName).toBe("SPAN");
    rerender(
      <Scoreboard.Title as="h1" className="extra">
        YASH
      </Scoreboard.Title>,
    );
    const h1 = screen.getByRole("heading", { level: 1, name: "YASH" });
    expect(h1).toHaveClass("type-hero", "extra");
  });

  it("sub-parts merge className last", () => {
    render(
      <Scoreboard className="root-x">
        <Scoreboard.Header className="header-x">H</Scoreboard.Header>
        <Scoreboard.Body className="body-x">B</Scoreboard.Body>
        <Scoreboard.Subtitle className="sub-x">S</Scoreboard.Subtitle>
        <Scoreboard.Footer className="footer-x">
          <Scoreboard.FooterCell className="cell-x" label="L" value="V" />
        </Scoreboard.Footer>
      </Scoreboard>,
    );
    for (const [text, cls] of [
      ["H", "header-x"],
      ["B", "body-x"],
      ["S", "sub-x"],
    ] as const) {
      expect(screen.getByText(text)).toHaveClass(cls);
    }
    expect(screen.getByText("V").parentElement).toHaveClass("cell-x");
    expect(screen.getByText("V").closest(".footer-x")).not.toBeNull();
  });
});

describe("Scoreboard sizes", () => {
  const board = (size?: "landing" | "intro" | "compact") =>
    render(
      <Scoreboard size={size}>
        <Scoreboard.Header>H</Scoreboard.Header>
        <Scoreboard.Body>
          <Scoreboard.Title>NAME</Scoreboard.Title>
          <Scoreboard.Subtitle>SUB</Scoreboard.Subtitle>
        </Scoreboard.Body>
        <Scoreboard.Footer>
          <Scoreboard.FooterCell label="A" value="ONE" tone="volt" align="start" />
          <Scoreboard.FooterCell label="B" value="TWO" tone="label" align="end" />
        </Scoreboard.Footer>
      </Scoreboard>,
    );

  it("landing is the default: header 53, footer 71, three columns, 24px values", () => {
    board();
    expect(screen.getByText("H")).toHaveClass("h-13.25", "type-mono-eyebrow");
    expect(screen.getByText("H").parentElement).toHaveClass("shadow-board");
    expect(screen.getByText("ONE").closest(".grid")).toHaveClass("h-17.75", "grid-cols-3");
    expect(screen.getByText("ONE")).toHaveClass("type-score-lg");
    expect(screen.getByText("NAME")).toHaveClass("type-hero");
    expect(screen.getByText("SUB")).toHaveClass("type-sub", "pl-[0.42em]");
  });

  it("intro: header 48 and footer 64 sit on the board's own ground; values are 22px", () => {
    board("intro");
    expect(screen.getByText("H")).toHaveClass("h-12", "bg-board");
    const footer = screen.getByText("ONE").closest(".grid");
    expect(footer).toHaveClass("h-16", "bg-board", "grid-cols-3");
    expect(screen.getByText("ONE")).toHaveClass("type-score-md");
    expect(screen.getByText("H").parentElement).toHaveClass("shadow-board");
  });

  it("compact: header 38 at 11px, two footer cells, 18px values, a 5px bezel", () => {
    board("compact");
    expect(screen.getByText("H")).toHaveClass("h-9.5", "type-mono-label");
    const footer = screen.getByText("ONE").closest(".grid");
    expect(footer).toHaveClass("h-12", "grid-cols-2");
    expect(footer?.children).toHaveLength(2);
    expect(screen.getByText("ONE")).toHaveClass("type-d5");
    expect(screen.getByText("NAME")).toHaveClass("type-hero-stack");
    expect(screen.getByText("SUB")).toHaveClass("type-sub-sm", "pl-[0.38em]");
    expect(screen.getByText("H").parentElement).toHaveClass("shadow-board-compact");
    expect(screen.getByText("H").parentElement).not.toHaveClass("shadow-board");
  });

  it("Power: two decorative ring layers, hidden until a timeline lights them", () => {
    const { container } = render(<Scoreboard.Power className="absolute top-24 left-25" />);
    const layers = container.querySelectorAll("[data-part]");
    expect([...layers].map((l) => l.getAttribute("data-part"))).toEqual(["board-on", "board-hit"]);
    for (const layer of layers) {
      expect(layer).toHaveAttribute("aria-hidden", "true");
      expect(layer).toHaveClass("opacity-0");
    }
    expect(container.firstElementChild).toHaveAttribute("aria-hidden", "true");
    expect(container.firstElementChild).toHaveClass("top-24", "left-25");
  });

  it("a board without Power has no ring layers (the resting ring is its own shadow)", () => {
    const { container } = board();
    expect(container.querySelector('[data-part="board-on"], [data-part="board-hit"]')).toBeNull();
  });

  it("Scan: Main's 90-high band or Intro's 90-wide bar, decorative and at rest invisible", () => {
    const { container } = render(
      <Scoreboard>
        <Scoreboard.Scan variant="band" />
        <Scoreboard.Scan variant="bar" />
      </Scoreboard>,
    );
    const [band, bar] = [...container.querySelectorAll('[data-part="scan"]')];
    expect(band).toHaveClass("h-22.5", "scene-scan-band", "opacity-0");
    expect(bar).toHaveClass("w-22.5", "scene-scan-bar", "opacity-0");
    for (const scan of [band, bar]) expect(scan).toHaveAttribute("aria-hidden", "true");
  });
});

describe("SkillGroup", () => {
  const skills = [
    { name: "Java", level: "shipped", tierLabel: "SHIPPED" },
    { name: "JUnit", level: "shipped", tierLabel: "75+ TESTS" },
    { name: "Apache Kafka", level: "kit", tierLabel: "KIT BAG" },
  ] as const;
  const setup = (props = {}) =>
    render(
      <SkillGroup
        name="Backend"
        shotLine="SHOT · Smash"
        note="Power and pace."
        skills={skills}
        {...props}
      />,
    );

  it("is a section named by its heading, with the shot line and note beside it", () => {
    setup();
    const group = screen.getByRole("region", { name: "Backend" });
    expect(within(group).getByRole("heading", { level: 2, name: "Backend" })).toBeInTheDocument();
    expect(within(group).getByText("SHOT · Smash")).toBeInTheDocument();
    expect(within(group).getByText("Power and pace.")).toBeInTheDocument();
  });

  it("lists every skill with its tier word, one list item each", () => {
    setup();
    const items = within(screen.getByRole("list")).getAllByRole("listitem");
    expect(items.map((li) => li.textContent)).toEqual([
      "JavaSHIPPED",
      "JUnit75+ TESTS",
      "Apache KafkaKIT BAG",
    ]);
  });

  it("spans three rows of a tablet grid (heading, note, list) only when asked, so neighbours stay level", () => {
    const { rerender } = setup();
    const group = screen.getByRole("region", { name: "Backend" });
    expect(group.className).not.toMatch(/subgrid/);
    rerender(<SkillGroup name="Backend" shotLine="x" note="n" skills={skills} alignRows />);
    expect(group).toHaveClass("md:max-[1199px]:grid-rows-subgrid", "md:max-[1199px]:row-span-3");
  });

  it("takes the heading level and animates the bars on request", () => {
    const { container } = setup({ headingLevel: 3, animate: true });
    expect(screen.getByRole("heading", { level: 3 })).toBeInTheDocument();
    expect(container.querySelectorAll(".animate-seg-fill")).toHaveLength(30);
  });

  it("two groups have separate heading ids", () => {
    render(
      <>
        <SkillGroup name="A" shotLine="x" note="n" skills={skills} />
        <SkillGroup name="B" shotLine="x" note="n" skills={skills} />
      </>,
    );
    expect(screen.getByRole("region", { name: "A" })).toBeInTheDocument();
    expect(screen.getByRole("region", { name: "B" })).toBeInTheDocument();
  });
});
