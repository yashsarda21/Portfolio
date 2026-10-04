import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AudioToggle } from "./AudioToggle";
import { CommentaryBar } from "./CommentaryBar";
import { HUD } from "./HUD";
import { HUDButton } from "./HUDButton";

describe("broadcast chrome", () => {
  it("AudioToggle exposes and flips its pressed state", async () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <AudioToggle
        name="Crowd audio"
        label="CROWD"
        on={false}
        onToggle={onToggle}
        stateOn="ON"
        stateOff="OFF"
      />,
    );
    // The visible word names the button (WCAG 2.5.3); the state word is visual only.
    const btn = screen.getByRole("button", { name: "CROWD" });
    expect(btn).not.toHaveAttribute("aria-label");
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(btn).toHaveTextContent("CROWD OFF");
    await userEvent.click(btn);
    expect(onToggle).toHaveBeenCalledOnce();
    rerender(
      <AudioToggle
        name="Crowd audio"
        label="CROWD"
        on
        onToggle={onToggle}
        stateOn="ON"
        stateOff="OFF"
      />,
    );
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).toHaveTextContent("CROWD ON");
  });

  it("AudioToggle icon variant is named by its aria-label", () => {
    render(<AudioToggle name="Crowd audio" variant="icon" on onToggle={() => {}} />);
    expect(screen.getByRole("button", { name: "Crowd audio" })).toHaveAttribute(
      "aria-pressed",
      "true",
    );
  });

  it("CommentaryBar passes rest props and exposes its state", () => {
    const { container } = render(
      <CommentaryBar tag="COMM" line="Bye." state="out" aria-hidden="true" />,
    );
    const bar = container.firstElementChild;
    expect(bar).toHaveAttribute("aria-hidden", "true");
    expect(bar).toHaveAttribute("data-state", "out");
    expect(screen.getByText("Bye.")).toHaveClass(
      "data-[state=out]:opacity-0",
      "data-[state=out]:-translate-x-3",
    );
    expect(screen.getByText("Bye.")).toHaveAttribute("data-state", "out");
  });

  it("CommentaryBar shows the tag and the current line", () => {
    render(<CommentaryBar tag="COMM" line="Still not out." />);
    expect(screen.getByText("COMM")).toHaveClass("bg-volt", "text-volt-ink");
    expect(screen.getByText("Still not out.")).toHaveClass("type-comm", "glass");
  });

  it("HUD is a banner landmark with three slots", () => {
    render(<HUD left={<span>L</span>} center={<span>C</span>} right={<span>R</span>} fade />);
    const banner = screen.getByRole("banner");
    expect(banner).toHaveClass("h-19", "from-ground-a85");
    expect(banner).toHaveTextContent("LCR");
  });

  it("HUDButton is glass by default and volt-outline has no glass", () => {
    const { rerender } = render(<HUDButton>QUICK VIEW</HUDButton>);
    expect(screen.getByRole("button")).toHaveClass("glass", "text-floodlight");
    rerender(<HUDButton tone="volt-outline">QUICK VIEW</HUDButton>);
    const btn = screen.getByRole("button");
    expect(btn).not.toHaveClass("glass");
    expect(btn).toHaveClass("border-volt", "text-volt", "bg-transparent");
  });
});
