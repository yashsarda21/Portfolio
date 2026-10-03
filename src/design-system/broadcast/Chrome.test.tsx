import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AudioToggle } from "./AudioToggle";
import { CommentaryBar } from "./CommentaryBar";
import { HUD } from "./HUD";

describe("broadcast chrome", () => {
  it("AudioToggle exposes and flips its pressed state", async () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <AudioToggle
        name="Crowd audio"
        on={false}
        onToggle={onToggle}
        labelOn="CROWD ON"
        labelOff="CROWD OFF"
      />,
    );
    const btn = screen.getByRole("button", { name: "Crowd audio" });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(btn).toHaveTextContent("CROWD OFF");
    await userEvent.click(btn);
    expect(onToggle).toHaveBeenCalledOnce();
    rerender(
      <AudioToggle
        name="Crowd audio"
        on
        onToggle={onToggle}
        labelOn="CROWD ON"
        labelOff="CROWD OFF"
      />,
    );
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).toHaveTextContent("CROWD ON");
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
});
