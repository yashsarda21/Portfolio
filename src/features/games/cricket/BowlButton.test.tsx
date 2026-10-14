import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BowlButton } from "./BowlButton";

const setup = () => {
  const onBowl = vi.fn();
  render(
    <BowlButton size="tap" skew={false} glow={false} disabled={false} onBowl={onBowl}>
      TAP TO BOWL
    </BowlButton>,
  );
  return { onBowl, button: screen.getByRole("button", { name: "TAP TO BOWL" }) };
};

describe("BowlButton (m-6)", () => {
  it("Space bowls when the key goes down, and the key coming up bowls nothing more", async () => {
    const { onBowl, button } = setup();
    button.focus();
    const user = userEvent.setup();
    await user.keyboard("[Space>]");
    expect(onBowl).toHaveBeenCalledTimes(1);
    await user.keyboard("[/Space]");
    expect(onBowl).toHaveBeenCalledTimes(1);
  });

  it("Enter bowls once, on the way down", async () => {
    const { onBowl, button } = setup();
    button.focus();
    await userEvent.setup().keyboard("{Enter}");
    expect(onBowl).toHaveBeenCalledTimes(1);
  });

  it("a key repeat bowls nothing", () => {
    const { onBowl, button } = setup();
    fireEvent.keyDown(button, { key: " ", repeat: true });
    expect(onBowl).not.toHaveBeenCalled();
  });

  it("a click or a tap bowls once", async () => {
    const { onBowl, button } = setup();
    await userEvent.setup().click(button);
    expect(onBowl).toHaveBeenCalledTimes(1);
  });

  it("is aria-disabled, never `disabled`, so it keeps its place in the tab order", () => {
    render(
      <BowlButton size="m" skew glow={false} disabled onBowl={() => {}}>
        BOWL
      </BowlButton>,
    );
    const button = screen.getByRole("button", { name: "BOWL" });
    expect(button).toHaveAttribute("aria-disabled", "true");
    expect(button).not.toBeDisabled();
  });
});
