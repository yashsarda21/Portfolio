import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { IntroName, IntroTagline, IntroTitle } from "./IntroParts";
import { createLetters } from "./letters";
import { buildIntroView } from "./view";

const view = buildIntroView(content, ui, ROUTES);
const letters = createLetters(view.name);

describe("IntroName", () => {
  it("is the page's h1, named by the whole name, with one decorative span per letter", () => {
    render(<IntroName heading={view.heading} letters={letters} />);
    const h1 = screen.getByRole("heading", { level: 1, name: view.heading });
    const spans = h1.querySelectorAll('[data-part="letter"]');
    expect(spans).toHaveLength(letters.length);
    for (const span of spans) expect(span).toHaveAttribute("aria-hidden", "true");
    expect(h1).toHaveClass("whitespace-nowrap");
    expect(h1.querySelector(".block")).toBeNull();
  });

  it("stacked sets one word to a line and draws no gap", () => {
    render(<IntroName heading={view.heading} letters={letters} stacked />);
    const h1 = screen.getByRole("heading", { level: 1 });
    const lines = h1.querySelectorAll(":scope > .block");
    expect(lines).toHaveLength(view.name.split(" ").length);
    const gap = h1.querySelector(".intro-letter-gap");
    expect(gap).toHaveClass("hidden");
    expect(h1).not.toHaveClass("whitespace-nowrap");
  });

  it("on the wide board the gap between the words is not hidden", () => {
    render(<IntroName heading={view.heading} letters={letters} />);
    expect(document.querySelector(".intro-letter-gap")).not.toHaveClass("hidden");
  });
});

describe("IntroTitle", () => {
  it("is the subtitle and its bar, sized by the caller", () => {
    const { container } = render(<IntroTitle title={view.title} className="h-9.5" />);
    expect(container.firstElementChild).toHaveClass("relative", "h-9.5");
    expect(screen.getByText(view.title)).toHaveAttribute("data-part", "title");
    const bar = container.querySelector('[data-part="title-bar"]');
    expect(bar).toHaveClass("-inset-y-1", "w-1", "bg-led", "shadow-glow-volt-md");
    expect(bar).toHaveAttribute("aria-hidden", "true");
  });
});

describe("IntroTagline", () => {
  it("draws the view's tones as they are, and hides the bullets from screen readers", () => {
    render(<IntroTagline parts={view.tagline} variant="stage" />);
    const parts = document.querySelectorAll('[data-part="tagline"]');
    expect(parts).toHaveLength(view.tagline.length);
    view.tagline.forEach((part, i) => {
      if (part.kind === "sep") expect(parts[i]).toHaveAttribute("aria-hidden", "true");
      else expect(parts[i]).not.toHaveAttribute("aria-hidden");
    });
    expect(parts[0]).toHaveClass("type-mono-lg", "text-floodlight");
  });

  it("the phone's variant is centred in the smaller face", () => {
    const { container } = render(<IntroTagline parts={view.tagline} variant="column" />);
    expect(container.firstElementChild).toHaveClass("justify-center");
    expect(document.querySelector('[data-part="tagline"]')).toHaveClass("type-mono-md");
  });
});
