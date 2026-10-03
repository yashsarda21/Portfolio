import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("is a named 44px button", () => {
    render(<IconButton icon="speaker" label="Toggle crowd audio" />);
    const btn = screen.getByRole("button", { name: "Toggle crowd audio" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).toHaveClass("size-11");
  });

  it("exposes toggle state only when pressed is defined", () => {
    const { rerender } = render(<IconButton icon="speaker" label="Audio" />);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-pressed");
    rerender(<IconButton icon="speaker" label="Audio" pressed />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("turns volt when pressed", () => {
    render(<IconButton icon="speaker" label="Audio" pressed />);
    expect(screen.getByRole("button")).toHaveClass("aria-pressed:text-volt");
  });

  it("calls onClick", async () => {
    const onClick = vi.fn();
    render(<IconButton icon="copy" label="Copy link" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("requires a label (type-level)", () => {
    // @ts-expect-error — label is required for icon-only controls
    render(<IconButton icon="copy" />);
    expect(true).toBe(true);
  });
});
