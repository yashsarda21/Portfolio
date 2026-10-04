import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { CabinetGlass } from "./CabinetGlass";
import { Plinth } from "./Plinth";
import { ShelfLight } from "./ShelfLight";
import { Spotlight } from "./Spotlight";
import { Trophy } from "./Trophy";

const KINDS = ["cup", "medal", "plaque", "pennant", "round", "locked"] as const;

describe("Trophy", () => {
  it.each(KINDS)("draws the %s as aria-hidden art", (kind) => {
    const { container } = render(<Trophy kind={kind} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root.textContent).toBe(kind === "locked" ? "?" : "");
    expect(root).toHaveAttribute("data-kind", kind);
  });

  it("prints the label on the medal and the plaque, never on the others", () => {
    const { container: medal } = render(<Trophy kind="medal" label="99.5" />);
    expect(medal).toHaveTextContent("99.5");
    const { container: plaque } = render(<Trophy kind="plaque" label="PAPER" />);
    expect(plaque).toHaveTextContent("PAPER");
    const { container: cup } = render(<Trophy kind="cup" label="IGNORED" />);
    expect(cup).not.toHaveTextContent("IGNORED");
  });

  it("stands every kind on a plinth, except the locked outline which draws its own dashed base", () => {
    for (const kind of KINDS) {
      const { container, unmount } = render(<Trophy kind={kind} />);
      expect(container.querySelector("[data-plinth]") !== null).toBe(kind !== "locked");
      unmount();
    }
  });

  it("turns only when asked, and only the figure (the plinth stays put)", () => {
    const { container, rerender } = render(<Trophy kind="cup" />);
    expect(container.querySelector(".animate-turntable")).toBeNull();
    rerender(<Trophy kind="cup" spinning />);
    const turning = container.querySelector(".animate-turntable")!;
    expect(turning).not.toBeNull();
    expect(turning.querySelector("[data-plinth]")).toBeNull();
  });

  it("merges className onto the root", () => {
    const { container } = render(<Trophy kind="cup" className="mt-3" />);
    expect(container.firstElementChild).toHaveClass("mt-3");
  });

  it("draws at the artboard's size by default; scale=phone shrinks it below 768px in a stage of one height", () => {
    const { container, rerender } = render(<Trophy kind="plaque" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.className).not.toMatch(/scene-zoom-sm/);
    rerender(<Trophy kind="plaque" scale="phone" />);
    expect(root).toHaveClass("max-md:scene-zoom-sm", "max-md:h-39", "max-md:justify-end");
    // Only below the breakpoint: nothing changes from 768px up.
    expect(root.className.split(" ").filter((c) => c.includes("scene-zoom"))).toEqual([
      "max-md:scene-zoom-sm",
    ]);
  });

  it("the cup and the locked outline share one bowl shape", () => {
    const { container: cup } = render(<Trophy kind="cup" />);
    const { container: locked } = render(<Trophy kind="locked" />);
    expect(cup.querySelectorAll(".trophy-cup-shape")).toHaveLength(1);
    expect(locked.querySelectorAll(".trophy-cup-shape")).toHaveLength(1);
    expect(locked.querySelector(".trophy-cup")).toBeNull();
  });
});

describe("Plinth, Spotlight, ShelfLight, CabinetGlass", () => {
  it("Plinth is decorative and comes in two heights", () => {
    const { container, rerender } = render(<Plinth size="lg" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("h-6.5");
    rerender(<Plinth size="md" />);
    expect(el).toHaveClass("h-5.5");
  });

  it("Spotlight is decorative; lead is brighter than support and md is smaller than lg", () => {
    const { container, rerender } = render(<Spotlight intensity="lead" size="lg" />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveAttribute("aria-hidden", "true");
    expect(el).toHaveClass("[--spot-a:0.3]", "w-55", "h-75", "animate-spot-drop");
    rerender(<Spotlight intensity="support" size="lg" />);
    expect(el).toHaveClass("[--spot-a:0.18]");
    rerender(<Spotlight intensity="support" size="md" />);
    expect(el).toHaveClass("[--spot-a:0.16]", "w-50", "h-65");
  });

  it("Spotlight shrinks below 768px only when asked (scale=phone)", () => {
    const { container, rerender } = render(<Spotlight />);
    const el = container.firstElementChild as HTMLElement;
    expect(el.className).not.toMatch(/scene-zoom-sm/);
    rerender(<Spotlight scale="phone" />);
    expect(el).toHaveClass("max-md:scene-zoom-sm", "max-md:origin-top");
  });

  it("Spotlight staggers by index through --i", () => {
    const { container } = render(<Spotlight intensity="support" size="lg" index={3} />);
    expect((container.firstElementChild as HTMLElement).style.getPropertyValue("--i")).toBe("3");
  });

  it("ShelfLight is placed over the cabinet by default, or is a full-width grid row", () => {
    const { container, rerender } = render(<ShelfLight />);
    const el = container.firstElementChild as HTMLElement;
    expect(el).toHaveClass("absolute", "inset-x-6");
    rerender(<ShelfLight placement="row" />);
    expect(el).toHaveClass("col-span-full", "mx-6");
    expect(el).not.toHaveClass("absolute");
  });

  it("ShelfLight and CabinetGlass are decorative overlays that ignore the pointer", () => {
    for (const ui of [<ShelfLight key="s" />, <CabinetGlass key="c" />]) {
      const { container, unmount } = render(ui);
      const el = container.firstElementChild as HTMLElement;
      expect(el).toHaveAttribute("aria-hidden", "true");
      expect(el).toHaveClass("pointer-events-none");
      unmount();
    }
  });
});
