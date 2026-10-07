import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ActionRow } from "./ActionRow";

describe("ActionRow", () => {
  it("is a link by default with a title and a sub-line", () => {
    render(
      <ActionRow
        href="/x"
        title="VIEW PLAYER CARD"
        sub="FULL RESUME"
        icon="arrow-right"
        tone="primary"
      />,
    );
    const link = screen.getByRole("link", { name: /VIEW PLAYER CARD/ });
    expect(link).toHaveAttribute("href", "/x");
    expect(screen.getByText("FULL RESUME")).toBeInTheDocument();
  });

  it("renders as a button when asked", () => {
    render(
      <ActionRow as="button" type="button" title="COPY" sub="LINK" icon="copy" tone="glass" />,
    );
    expect(screen.getByRole("button", { name: /COPY/ })).toBeInTheDocument();
  });

  it("status replaces the sub-line and sits in a polite live region", () => {
    const { rerender } = render(
      <ActionRow
        as="button"
        type="button"
        title="COPY"
        sub="OPENS QUICK VIEW"
        icon="copy"
        tone="glass"
      />,
    );
    expect(screen.getByText("OPENS QUICK VIEW")).toHaveAttribute("aria-live", "polite");
    rerender(
      <ActionRow
        as="button"
        type="button"
        title="COPY"
        sub="OPENS QUICK VIEW"
        icon="copy"
        tone="glass"
        status="LINK COPIED ✓"
      />,
    );
    expect(screen.queryByText("OPENS QUICK VIEW")).not.toBeInTheDocument();
    expect(screen.getByText("LINK COPIED ✓")).toHaveAttribute("aria-live", "polite");
  });

  it("the primary tone is volt with ink text; glass is glass with a volt hover border", () => {
    render(
      <>
        <ActionRow href="/a" title="PRIMARY" sub="s" icon="arrow-right" tone="primary" />
        <ActionRow href="/b" title="GLASS" sub="s" icon="download" tone="glass" />
      </>,
    );
    expect(screen.getByRole("link", { name: /PRIMARY/ })).toHaveClass("bg-volt", "text-volt-ink");
    const glass = screen.getByRole("link", { name: /GLASS/ });
    expect(glass).toHaveClass("glass");
    expect(glass.className).toContain("hover:border-volt");
  });
});
