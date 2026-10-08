import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Stage } from "./Stage";

const scene = (el: HTMLElement) => el.querySelector("[data-transition-scene]")!;

describe("Stage", () => {
  it('hides below md by default and for from="md"', () => {
    const a = render(<Stage>x</Stage>);
    expect(scene(a.container)).toHaveClass("max-md:hidden");
    const b = render(<Stage from="md">x</Stage>);
    expect(scene(b.container)).toHaveClass("max-md:hidden");
  });
  it('hides below lg for from="lg"', () => {
    const { container } = render(<Stage from="lg">x</Stage>);
    expect(scene(container)).toHaveClass("max-lg:hidden");
    expect(scene(container)).not.toHaveClass("max-md:hidden");
  });
  it("is always shown for from={null}", () => {
    const { container } = render(<Stage from={null}>x</Stage>);
    expect(scene(container).className).not.toMatch(/max-(md|lg):hidden/);
  });
  it("passes a class and style to the letterbox sky, so a page can boot it", () => {
    const { container } = render(
      <Stage skyClassName="animate-boot-fade" skyStyle={{ "--d": "2.2s" } as React.CSSProperties}>
        x
      </Stage>,
    );
    const sky = container.querySelector("[data-transition-scene] > .scene-sky") as HTMLElement;
    expect(sky).toHaveClass("animate-boot-fade");
    expect(sky.style.getPropertyValue("--d")).toBe("2.2s");
  });
  it("names the letterbox sky, so a timeline can find it", () => {
    const { container } = render(<Stage>x</Stage>);
    const sky = container.querySelector("[data-transition-scene] > .scene-sky");
    expect(sky).toHaveAttribute("data-part", "letterbox-sky");
  });
  it("sets the 14px body floor on the stage", () => {
    const { container } = render(<Stage>x</Stage>);
    expect(container.querySelector("[data-stage]")).toHaveClass(
      "[--stage-body-min:calc(14px/var(--stage-scale,1))]",
    );
  });
  it("sets the 11px mono floor on the stage", () => {
    const { container } = render(<Stage>x</Stage>);
    expect(container.querySelector("[data-stage]")).toHaveClass(
      "[--stage-mono-min:calc(11px/var(--stage-scale,1))]",
    );
  });
  it("hands the scale to the mono fit, on the stage only", () => {
    const { container } = render(<Stage>x</Stage>);
    expect(container.querySelector("[data-stage]")).toHaveClass(
      "[--stage-fit:var(--stage-scale,1)]",
    );
  });
});
