import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Glass } from "./Glass";

describe("Glass", () => {
  it("is a plain glass div by default", () => {
    render(<Glass>panel</Glass>);
    const el = screen.getByText("panel");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveClass("glass");
  });

  it("combines surface, edge, elevation and padding", () => {
    render(
      <Glass
        as="section"
        surface="gradient"
        edge="volt"
        elevation="card"
        pad="md"
        aria-label="Detail"
      >
        x
      </Glass>,
    );
    const el = screen.getByRole("region", { name: "Detail" });
    expect(el).toHaveClass(
      "bg-linear-160",
      "from-panel",
      "to-stand-3",
      "border-volt-a45",
      "shadow-card-3d",
      "p-5",
    );
  });

  it("dashed surface for locked slots", () => {
    render(<Glass surface="dashed">locked</Glass>);
    expect(screen.getByText("locked")).toHaveClass("border-dashed", "border-line-strong");
  });
});
