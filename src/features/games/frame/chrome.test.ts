import { describe, expect, it } from "vitest";
import { ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { buildGameChrome, buildGameEnd, sentenceCase } from "./chrome";

describe("buildGameChrome", () => {
  it("cricket: the breadcrumb, the skip to the career page, and the heading", () => {
    const chrome = buildGameChrome(ui, ROUTES, "cricket");
    expect(chrome.breadcrumb).toEqual({
      mark: ui.brand.mark,
      hubLabel: ui.games.hubLabel,
      label: ui.pages.breadcrumb,
      trail: ["CRICKET GROUND"],
      to: "/arena",
    });
    expect(chrome.skip).toEqual({ label: "SKIP TO CAREER STATS", short: "SKIP", to: "/career" });
    expect(chrome.content).toBe("/career");
    expect(chrome.heading).toBe(ui.routes.cricket.heading);
    expect(chrome.commTag).toBe(ui.comm.tag);
    expect(chrome.audio).toBe(ui.audio);
  });

  it.each([
    ["tennis", "/highlights", ui.games.tennis.skip, ui.venues.tennis],
    ["badminton", "/attributes", ui.games.badminton.skip, ui.venues.badminton],
  ] as const)("%s: skip and content go to %s", (venue, to, label, crumb) => {
    const chrome = buildGameChrome(ui, ROUTES, venue);
    expect(chrome.skip).toEqual({ label, short: "SKIP", to });
    expect(chrome.content).toBe(to);
    expect(chrome.breadcrumb.trail).toEqual([crumb]);
    expect(chrome.heading).toBe(ui.routes[venue].heading);
  });
});

describe("buildGameEnd", () => {
  const chrome = buildGameChrome(ui, ROUTES, "tennis");
  const words = { see: "SEE IT", again: "AGAIN" };
  const end = (over: boolean, offerHighlight: boolean, fullTime = false) =>
    buildGameEnd(ui, ROUTES, chrome, { over, offerHighlight, fullTime, ...words });

  it("offers nothing while the game is on", () => {
    expect(end(false, false)).toBeNull();
  });

  it("offers the venue's page and play again; after the second loss, the highlight", () => {
    expect(end(true, false)).toEqual({
      primary: { label: "SEE IT", to: chrome.content },
      again: "AGAIN",
      hub: { label: ui.games.backToHub, to: ROUTES.arena },
    });
    expect(end(true, true)?.primary).toEqual({ label: ui.games.highlight, to: chrome.content });
  });

  it("offers SEE FULL TIME once the matchday is complete, ahead of the highlight (F3)", () => {
    expect(end(true, true, true)).toEqual({
      primary: { label: ui.games.fullTime, to: ROUTES.fullTime },
      again: "AGAIN",
      hub: { label: ui.games.backToHub, to: ROUTES.arena },
    });
  });
});

describe("sentenceCase", () => {
  it("reads upper-case copy as a sentence", () => {
    expect(sentenceCase("ATTRIBUTE CHARGED")).toBe("Attribute charged");
  });
});
