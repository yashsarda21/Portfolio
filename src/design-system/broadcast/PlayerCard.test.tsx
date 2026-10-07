import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { useState } from "react";
import { describe, expect, it, vi } from "vitest";
import { PlayerCard } from "./PlayerCard";

function Card({ onFlip = vi.fn() }: { onFlip?: () => void }) {
  const [flipped, setFlipped] = useState(false);
  return (
    <PlayerCard
      flipped={flipped}
      onFlip={() => {
        onFlip();
        setFlipped((f) => !f);
      }}
      label={flipped ? "Flip card: show the front" : "Flip card: show the back"}
      front={<p>FRONT FACE</p>}
      back={<a href="#career">Career</a>}
    />
  );
}

const face = (text: string) => screen.getByText(text, { selector: "p, a" }).closest("[data-face]");

describe("PlayerCard", () => {
  it("is a button named for where it flips to (not a toggle), and calls onFlip on click", async () => {
    const onFlip = vi.fn();
    render(<Card onFlip={onFlip} />);
    const btn = screen.getByRole("button", { name: "Flip card: show the back" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).not.toHaveAttribute("aria-pressed");
    await userEvent.click(btn);
    expect(onFlip).toHaveBeenCalledOnce();
    expect(screen.getByRole("button", { name: "Flip card: show the front" })).not.toHaveAttribute(
      "aria-pressed",
    );
  });

  it("hides the back from everyone until flipped, then the front", async () => {
    render(<Card />);
    expect(face("Career")).toHaveAttribute("inert");
    expect(face("Career")).toHaveAttribute("aria-hidden", "true");
    expect(face("FRONT FACE")).not.toHaveAttribute("inert");
    expect(face("FRONT FACE")).not.toHaveAttribute("aria-hidden");
    await userEvent.click(screen.getByRole("button"));
    expect(face("FRONT FACE")).toHaveAttribute("inert");
    expect(face("FRONT FACE")).toHaveAttribute("aria-hidden", "true");
    expect(face("Career")).not.toHaveAttribute("inert");
  });

  it("flips with Enter and Space (a native button)", async () => {
    const onFlip = vi.fn();
    render(<Card onFlip={onFlip} />);
    await userEvent.tab();
    expect(screen.getByRole("button")).toHaveFocus();
    await userEvent.keyboard("{Enter}");
    expect(onFlip).toHaveBeenCalledTimes(1);
    await userEvent.keyboard(" ");
    expect(onFlip).toHaveBeenCalledTimes(2);
  });

  it("keeps keyboard focus on the visible face's button after a flip", async () => {
    render(<Card />);
    await userEvent.tab();
    await userEvent.keyboard("{Enter}");
    expect(screen.getByRole("button", { name: "Flip card: show the front" })).toHaveFocus();
  });

  it("puts the back face's links outside any button", () => {
    render(<Card />);
    const link = screen.getByText("Career");
    expect(link.closest("button")).toBeNull();
  });

  it("floats by default and stops when float is off", () => {
    const { container, rerender } = render(<Card />);
    expect(container.querySelector(".animate-card-float")).not.toBeNull();
    rerender(
      <PlayerCard flipped={false} onFlip={vi.fn()} label="Flip" front="f" back="b" float={false} />,
    );
    expect(container.querySelector(".animate-card-float")).toBeNull();
  });

  it("Contact is a label over a link, and Footer stays below it", () => {
    render(
      <>
        <PlayerCard.Contact label="EMAIL" value="a@b.dev" href="mailto:a@b.dev" />
        <PlayerCard.Footer left="L" right="R" />
      </>,
    );
    const link = screen.getByRole("link", { name: "a@b.dev" });
    expect(link).toHaveAttribute("href", "mailto:a@b.dev");
    expect(screen.getByText("EMAIL")).toBeInTheDocument();
    expect(
      link.compareDocumentPosition(screen.getByText("L")) & Node.DOCUMENT_POSITION_FOLLOWING,
    ).toBeTruthy();
  });
});
