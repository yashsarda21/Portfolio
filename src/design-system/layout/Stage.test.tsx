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
  it("sets the 11px mono floor on the stage", () => {
    const { container } = render(<Stage>x</Stage>);
    expect(container.querySelector("[data-stage]")).toHaveClass("[--stage-mono-floor:11px]");
  });
});
