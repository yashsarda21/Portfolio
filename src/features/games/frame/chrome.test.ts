import { describe, expect, it } from "vitest";
import { ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { buildGameChrome } from "./chrome";

describe("buildGameChrome", () => {
  it("cricket: the breadcrumb, the skip to the career page, and the heading", () => {
    const chrome = buildGameChrome(ui, ROUTES, "cricket");
    expect(chrome.breadcrumb).toEqual({
      mark: ui.brand.mark,
      hubLabel: ui.placeholder.hub,
      label: ui.pages.breadcrumb,
      trail: ["CRICKET GROUND"],
      to: "/arena",
    });
    expect(chrome.skip).toEqual({ label: "SKIP TO CAREER STATS", to: "/career" });
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
    expect(chrome.skip).toEqual({ label, to });
    expect(chrome.content).toBe(to);
    expect(chrome.breadcrumb.trail).toEqual([crumb]);
    expect(chrome.heading).toBe(ui.routes[venue].heading);
  });
});
