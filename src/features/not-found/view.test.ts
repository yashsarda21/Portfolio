import { describe, expect, it } from "vitest";
import { ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { buildNotFoundView, MAX_TRIED } from "./view";

describe("buildNotFoundView", () => {
  const view = buildNotFoundView(ui, ROUTES, "/arena/nope");

  it("names the page and the path that was tried", () => {
    expect(view.heading).toBe("OUT OF BOUNDS");
    expect(view.description).toBe(ui.routes.notFound.description);
    expect(view.tried).toBe("You tried /arena/nope");
  });

  it("links back to the Hub, Quick View and Home", () => {
    expect(view.links.map((l) => [l.id, l.label, l.to])).toEqual([
      ["hub", "BACK TO THE HUB", "/arena"],
      ["quickView", "QUICK VIEW", "/scout"],
      ["home", "HOME", "/"],
    ]);
  });

  it("has no 'You tried' line when no path was tried (/404 itself)", () => {
    expect(buildNotFoundView(ui, ROUTES).tried).toBeNull();
    expect(buildNotFoundView(ui, ROUTES, "").tried).toBeNull();
  });

  it("keeps the path as plain text, cut at 60 characters with an ellipsis", () => {
    const long = `/${"a".repeat(100)}`;
    const tried = buildNotFoundView(ui, ROUTES, long).tried!;
    expect(tried).toBe(`You tried ${long.slice(0, MAX_TRIED)}…`);
    expect(buildNotFoundView(ui, ROUTES, "/<img src=x onerror=alert(1)>").tried).toBe(
      "You tried /<img src=x onerror=alert(1)>",
    );
  });
});
