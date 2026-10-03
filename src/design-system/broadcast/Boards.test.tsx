import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Scoreboard } from "./Scoreboard";
import { SegmentBar } from "./SegmentBar";
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
