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

  it("pulls the note up under the heading (the -8px the artboard draws)", () => {
    setup();
    expect(screen.getByText("Power and pace.")).toHaveClass("-mt-2");
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
