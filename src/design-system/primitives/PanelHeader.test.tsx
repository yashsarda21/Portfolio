import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { PanelHeader } from "./PanelHeader";

describe("PanelHeader", () => {
  it("is a decorative bar: hidden from assistive tech", () => {
    render(<PanelHeader>THE DRAW</PanelHeader>);
    const bar = screen.getByText("THE DRAW");
    expect(bar).toHaveAttribute("aria-hidden", "true");
    expect(screen.queryByText("THE DRAW", { ignore: "[aria-hidden='true']" })).toBeNull();
  });

  it("owns the content-box height and the divider, so screens never write box-content", () => {
    render(<PanelHeader size="lg">COLUMNS</PanelHeader>);
    expect(screen.getByText("COLUMNS")).toHaveClass("box-content", "h-12", "border-b");
  });

  it("takes the label recipe, and lets a screen swap it and add a grid", () => {
    render(
      <PanelHeader variant="mono-round" className="grid grid-cols-2">
        <span>INN</span>
        <span>TEAM</span>
      </PanelHeader>,
    );
    const bar = screen.getByText("INN").parentElement!;
    expect(bar).toHaveClass("type-mono-round", "grid");
    expect(bar).not.toHaveClass("flex");
  });

  it("renders as another element when asked", () => {
    render(<PanelHeader as="p">LABEL</PanelHeader>);
    expect(screen.getByText("LABEL").tagName).toBe("P");
  });
});
