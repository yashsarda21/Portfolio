import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArenaBackdrop } from "./ArenaBackdrop";
import { CrowdTier } from "./CrowdTier";

describe("scene", () => {
  it("CrowdTier leaves density to the venue unless alpha is passed", () => {
    const { container, rerender } = render(<CrowdTier />);
    const tier = container.firstElementChild as HTMLElement;
    expect(tier.style.getPropertyValue("--crowd-a")).toBe("");
    rerender(<CrowdTier alpha={0.5} />);
    expect(tier.style.getPropertyValue("--crowd-a")).toBe("0.5");
  });

  it("ArenaBackdrop is decorative and picks its venue (default turf)", () => {
    const { container, rerender } = render(<ArenaBackdrop />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveAttribute("data-venue", "turf");
    rerender(<ArenaBackdrop venue="hall" />);
    expect(root).toHaveAttribute("data-venue", "hall");
  });
});
