import { describe, expect, it } from "vitest";
import { ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { buildFullTimeView } from "./view";

const build = (venuesPlayed: Parameters<typeof buildFullTimeView>[2]["venuesPlayed"], form = 0) =>
  buildFullTimeView(ui, ROUTES, {
    venuesPlayed,
    bestForm: Object.fromEntries(venuesPlayed.map((v) => [v, form])),
  });

describe("buildFullTimeView: all three venues played", () => {
  const view = build(["cricket", "tennis", "badminton"], 1 / 3);

  it("is the verdict: YOU 0, YASH 3, and the grade for the forms", () => {
    expect(view.state).toBe("done");
    expect(view.toast).toEqual({
      eyebrow: "MATCHDAY COMPLETE · 3 OF 3 VENUES",
      title: "FULL TIME",
    });
    expect(view.board).toEqual({
      home: { name: "YOU", score: "0" },
      away: { name: "YASH", score: "3" },
      winner: "away",
      label: "Final score: You 0, Yash 3",
    });
    expect(view.headline).toBe("NICE EFFORT.");
    expect(view.line).toBe(ui.fullTime.grades.niceEffort.line);
  });

  it("offers Team Up, a rematch, the player card and the hub", () => {
    expect(view.card.cta).toEqual({ label: "TEAM UP", to: "/team-up" });
    expect(view.card.title).toBe("TEAM UP WITH YASH");
    expect(view.links).toEqual([
      { label: "PLAY AGAIN", to: "/arena/cricket" },
      { label: "SEE THE PLAYER CARD", to: "/card" },
      { label: "BACK TO THE HUB", to: "/arena" },
    ]);
    expect(view.comm).toBe(ui.fullTime.comm.done);
  });

  it("grades by how close the visitor came", () => {
    expect(build(["cricket", "tennis", "badminton"], 0).headline).toBe("GOOD TRY.");
    expect(build(["cricket", "tennis", "badminton"], 1).headline).toBe("SO CLOSE.");
  });
});

describe("buildFullTimeView: opened early", () => {
  it("with tennis played, it is NOT YET. and names cricket next", () => {
    const view = build(["tennis"]);
    expect(view.state).toBe("pending");
    expect(view.toast.eyebrow).toBe("MATCHDAY IN PROGRESS · 1 OF 3 VENUES");
    expect(view.board.away.score).toBe("1");
    expect(view.board.label).toBe("Final score: You 0, Yash 1");
    expect(view.headline).toBe("NOT YET.");
    expect(view.line).toBe("1 of 3 venues played. The final whistle blows after all three.");
    expect(view.card).toEqual({
      eyebrow: "NEXT VENUE",
      title: "CRICKET GROUND",
      body: ui.hub.venues.cricket.blurb,
      cta: { label: "PLAY", to: "/arena/cricket" },
    });
    expect(view.links).toEqual([{ label: "BACK TO THE HUB", to: "/arena" }]);
    expect(view.comm).toBe(ui.fullTime.comm.pending);
  });

  it("with cricket and tennis played, the next venue is the badminton hall", () => {
    const view = build(["cricket", "tennis"]);
    expect(view.card.title).toBe("BADMINTON HALL");
    expect(view.card.cta.to).toBe("/arena/badminton");
  });

  it("with nothing played, it is 0 of 3 and cricket is next", () => {
    const view = build([]);
    expect(view.state).toBe("pending");
    expect(view.toast.eyebrow).toBe("MATCHDAY IN PROGRESS · 0 OF 3 VENUES");
    expect(view.line).toBe("0 of 3 venues played. The final whistle blows after all three.");
    expect(view.card.title).toBe("CRICKET GROUND");
  });
});
