import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

const plateOf = (el: HTMLElement) => {
  const plate = el.querySelector("[data-plate]");
  if (!plate) throw new Error("no plate");
  return plate;
};

describe("Button", () => {
  it("is a primary medium button skewed on desktop only", () => {
    render(<Button>Bowl</Button>);
    const btn = screen.getByRole("button", { name: "Bowl" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).toHaveClass("text-volt-ink", "h-15.5");
    expect(btn.className).not.toMatch(/skew/);
    expect(plateOf(btn)).toHaveClass("bg-volt", "md:-skew-x-12");
    expect(plateOf(btn)).toHaveAttribute("aria-hidden", "true");
    expect(screen.getByText("Bowl").className).not.toMatch(/skew/);
  });

  it("renders as an anchor without a type attribute", () => {
    render(
      <Button as="a" href="/scout" variant="secondary">
        View portfolio
      </Button>,
    );
    const link = screen.getByRole("link", { name: "View portfolio" });
    expect(link).toHaveAttribute("href", "/scout");
    expect(link).not.toHaveAttribute("type");
    expect(plateOf(link)).toHaveClass("glass");
  });

  it("skews always or never on request", () => {
    const { rerender } = render(<Button skew>A</Button>);
    expect(plateOf(screen.getByRole("button"))).toHaveClass("-skew-x-12");
    rerender(<Button skew={false}>A</Button>);
    expect(plateOf(screen.getByRole("button")).className).not.toMatch(/skew/);
  });

  it("stacks a sub-label under the label at XL", () => {
    render(
      <Button size="xl" subLabel="INTERACTIVE · ~3 MIN">
        Enter the arena
      </Button>,
    );
    const btn = screen.getByRole("button", { name: /Enter the arena/ });
    expect(btn).toHaveClass("h-19.5", "w-77.5", "flex-col");
    expect(screen.getByText("INTERACTIVE · ~3 MIN")).toHaveClass(
      "type-mono-tag",
      "text-volt-ink-2",
    );
  });

  it("pulses only when asked", () => {
    const { rerender } = render(<Button>A</Button>);
    expect(plateOf(screen.getByRole("button"))).not.toHaveClass("animate-cta-glow");
    rerender(<Button pulse>A</Button>);
    expect(plateOf(screen.getByRole("button"))).toHaveClass("animate-cta-glow");
  });

  it("shows a trailing icon", () => {
    const { container } = render(<Button iconRight="arrow-right">Team up</Button>);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("does not fire when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        A
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });

  it("scopes hover styles to its own named group, not any ancestor .group", () => {
    render(<Button variant="secondary">A</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("group/button");
    expect(btn).toHaveAttribute("data-sweep-host");
    expect(btn.className).not.toMatch(/(^|\s)group(\s|$)/);
    expect(plateOf(btn)).toHaveClass("group-hover/button:bg-white-a10");
    expect(plateOf(btn).className).not.toMatch(/group-hover:|group-focus-visible:/);
  });

  it("looks and acts disabled when a link-button is aria-disabled", () => {
    render(
      <Button as="a" href="/x" aria-disabled="true">
        Soon
      </Button>,
    );
    expect(screen.getByRole("link", { name: "Soon" })).toHaveClass(
      "aria-disabled:pointer-events-none",
      "aria-disabled:opacity-40",
    );
  });

  it("stacks a sub-label under the label at any size", () => {
    render(<Button subLabel="~3 MIN">Enter</Button>);
    expect(screen.getByRole("button", { name: /Enter/ })).toHaveClass("flex-col", "gap-1");
  });

  it("stays a single row without a sub-label", () => {
    render(<Button>Enter</Button>);
    expect(screen.getByRole("button")).not.toHaveClass("flex-col");
  });

  it("keeps the CTA glow by default and drops it with glow={false}", () => {
    const { rerender } = render(<Button>A</Button>);
    expect(plateOf(screen.getByRole("button"))).toHaveClass("shadow-glow-cta");
    rerender(<Button glow={false}>A</Button>);
    expect(plateOf(screen.getByRole("button"))).not.toHaveClass("shadow-glow-cta");
  });

  it("panel variant is an inset plate with a volt hover border", () => {
    render(<Button variant="panel">A</Button>);
    const btn = screen.getByRole("button");
    expect(btn).toHaveClass("text-floodlight");
    expect(plateOf(btn)).toHaveClass("bg-inset", "border-line-3", "group-hover/button:border-volt");
    expect(plateOf(btn)).not.toHaveClass("shadow-glow-cta");
  });

  it("has CTA and bar sizes", () => {
    const { rerender } = render(<Button size="cta">A</Button>);
    expect(screen.getByRole("button")).toHaveClass("min-h-14", "type-btn-heavy");
    rerender(<Button size="bar">A</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-13.5", "w-full", "type-btn-bar");
  });

  it("has a form size: the 62px body with the 24px heavy label, full width on the phone", () => {
    render(<Button size="form">SEND CHALLENGE</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "h-15.5",
      "px-10",
      "type-btn-lg",
      "max-md:w-full",
    );
  });

  it("size s never wraps or shrinks, and is the full-width bar on the phone", () => {
    render(<Button size="s">NEXT VENUE · BADMINTON HALL →</Button>);
    expect(screen.getByRole("button")).toHaveClass(
      "whitespace-nowrap",
      "shrink-0",
      "type-btn",
      "max-md:w-full",
      "max-md:type-btn-bar",
      "max-md:h-13.5",
    );
  });

  it("adds the content-box border height to outlined and panel CTA and bar buttons", () => {
    const { rerender } = render(
      <Button size="cta" variant="outline">
        A
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveClass("min-h-14.5");
    expect(screen.getByRole("button")).not.toHaveClass("min-h-14");
    rerender(
      <Button size="bar" variant="panel">
        A
      </Button>,
    );
    expect(screen.getByRole("button")).toHaveClass("h-14");
    expect(screen.getByRole("button")).not.toHaveClass("h-13.5");
    rerender(<Button size="bar">A</Button>);
    expect(screen.getByRole("button")).toHaveClass("h-13.5");
  });
});
