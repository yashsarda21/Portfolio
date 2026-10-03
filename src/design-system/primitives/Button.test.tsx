import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("is a primary medium button skewed on desktop only", () => {
    render(<Button>Bowl</Button>);
    const btn = screen.getByRole("button", { name: "Bowl" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).toHaveClass("bg-volt", "text-volt-ink", "h-15.5", "md:-skew-x-12");
    expect(screen.getByText("Bowl")).toHaveClass("md:skew-x-12");
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
    expect(link).toHaveClass("glass");
  });

  it("skews always or never on request", () => {
    const { rerender } = render(<Button skew>A</Button>);
    expect(screen.getByRole("button")).toHaveClass("-skew-x-12");
    rerender(<Button skew={false}>A</Button>);
    expect(screen.getByRole("button").className).not.toMatch(/skew/);
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
    expect(screen.getByRole("button")).not.toHaveClass("animate-cta-glow");
    rerender(<Button pulse>A</Button>);
    expect(screen.getByRole("button")).toHaveClass("animate-cta-glow");
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
});
