import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { artboardCardView } from "./CardPage.fixture";
import { TakeAway } from "./TakeAway";

const { take, backNote } = artboardCardView;

function link(state: "idle" | "copied" | "fallback") {
  return { state, copy: vi.fn(), field: () => {} };
}

describe("TakeAway", () => {
  it("announces 'copied' through its own status, and hides the row's visible line from assistive tech", () => {
    render(<TakeAway take={take} note={backNote} link={link("copied")} />);
    expect(screen.getByRole("status")).toHaveTextContent(take.copy.announce);
    expect(screen.getByText(take.copy.done)).toHaveAttribute("aria-hidden", "true");
  });

  it("says nothing of its own when the clipboard refuses: the focus move to the field is the message", () => {
    render(<TakeAway take={take} note={backNote} link={link("fallback")} />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(screen.getByRole("textbox", { name: take.copy.fallback })).toHaveValue(take.copy.url);
  });

  it("is quiet at rest, and no sub-line is a live region", () => {
    const { container } = render(<TakeAway take={take} note={backNote} link={link("idle")} />);
    expect(screen.getByRole("status")).toBeEmptyDOMElement();
    expect(container.querySelector("[aria-live]")).toBeNull();
    expect(screen.queryByRole("textbox")).toBeNull();
  });
});
