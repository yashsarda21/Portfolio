import { readFileSync } from "node:fs";
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

  it("AudioToggle text variant is the phone's chip: the word and the state, no icon, 44px", () => {
    render(
      <AudioToggle
        name="Crowd audio"
        variant="text"
        label="SOUND"
        on
        onToggle={() => {}}
        stateOn="ON"
        stateOff="OFF"
      />,
    );
    const btn = screen.getByRole("button", { name: "SOUND" });
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).toHaveTextContent("SOUND ON");
    expect(btn.querySelector("svg")).toBeNull();
    expect(btn).toHaveClass("h-11", "hud-chip");
    expect(btn).not.toHaveClass("type-mono-md", "px-4");
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

  it("CommentaryBar carries a stable hook for tests that find or mask it", () => {
    const { container } = render(<CommentaryBar tag="COMM" line="Hello." />);
    expect(container.querySelectorAll("[data-commentary-bar]")).toHaveLength(1);
    expect(container.firstElementChild).toHaveAttribute("data-commentary-bar");
  });

  it("CommentaryBar shows the tag and the current line", () => {
    render(<CommentaryBar tag="COMM" line="Still not out." />);
    expect(screen.getByText("COMM")).toHaveClass("bg-volt", "text-volt-ink");
    expect(screen.getByText("Still not out.")).toHaveClass("type-comm", "glass");
  });

  it("the inline CommentaryBar line is 15px italic on the font's own line box (Team Up)", () => {
    render(<CommentaryBar tag="COMM" variant="inline" line="I'll serve first." />);
    const line = screen.getByText("I'll serve first.");
    expect(line).toHaveClass("type-body-md", "italic", "leading-auto", "bg-panel");
    expect(line).not.toHaveClass("type-comm");
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
    expect(btn).toHaveClass("border-volt", "text-volt", "bg-transparent", "h-11.5");
    expect(btn).not.toHaveClass("h-11");
  });

  it("the compact chip is one class: always on glass-compact, phone only on glass-line", () => {
    const { rerender } = render(<HUDButton tone="glass-compact">SKIP</HUDButton>);
    const compact = screen.getByRole("button");
    expect(compact).toHaveClass("glass", "hud-chip");
    expect(compact).not.toHaveClass("px-4", "type-mono-md", "leading-auto");
    rerender(<HUDButton tone="glass-line">QUICK VIEW</HUDButton>);
    const line = screen.getByRole("button");
    expect(line).toHaveClass(
      "glass",
      "px-4",
      "type-mono-md",
      "max-md:hud-chip",
      "max-md:bg-transparent",
    );
    expect(line).not.toHaveClass("hud-chip");
    // The chip's gutters and type are written once, in base.css.
    expect(readFileSync("src/design-system/tokens/base.css", "utf8")).toMatch(
      /@utility hud-chip \{\s*@apply px-3 type-mono-xs;\s*\}/,
    );
    expect(readFileSync("src/design-system/broadcast/HUDButton.tsx", "utf8")).not.toMatch(
      /px-3|type-mono-xs/,
    );
  });
});
