import { describe, expect, it } from "vitest";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import type { Venue } from "@/shell/matchRecord";
import { buildHubView, hubHint, type HubRecord } from "./view";

const fresh: HubRecord = {
  venuesPlayed: [],
  lastScores: {},
  sectionsSeen: [],
  yashWins: 0,
};
const artboard: HubRecord = {
  ...fresh,
  venuesPlayed: ["cricket"],
  lastScores: { cricket: "14* NOT OUT" },
  sectionsSeen: ["career"],
  yashWins: 1,
};
const view = (r: HubRecord) => buildHubView(content, ui, ROUTES, r);

describe("buildHubView", () => {
  it("reads the artboard's state like the artboard", () => {
    const v = view(artboard);
    expect(v.record.value).toBe("YASH 1 · YOU 0");
    expect(v.record.label).toBe("YOUR RECORD");
    expect(v.matchday.title).toBe("1 OF 3 VENUES");
    expect(v.matchday.progress).toBe("1 of 3 venues played");
    expect(v.fixtures).toBe("TODAY'S FIXTURES · 1 OF 3 PLAYED");
    expect(v.comm).toBe("One down. Two venues left. Still undefeated.");
    const [cricket, tennis] = v.venues;
    expect(cricket).toMatchObject({
      key: "cricket",
      scene: "turf",
      played: true,
      number: "VENUE 01",
      name: "CRICKET GROUND",
      status: "PLAYED · 14* NOT OUT",
      statusPhone: "14* NOT OUT",
      meta: "VENUE 01 · CAREER",
      reveals: "REVEALS · CAREER STATS · ~30s",
      play: { label: "REMATCH", to: "/arena/cricket" },
      skip: { label: "SKIP", labelPhone: "SEE STATS", to: "/career" },
      shortcut: "1",
    });
    expect(tennis).toMatchObject({
      played: false,
      status: "UNPLAYED",
      statusPhone: "~40s",
      play: { label: "PLAY", to: "/arena/tennis" },
      skip: { label: "SKIP", labelPhone: "SKIP", to: "/highlights" },
    });
    expect(v.index.links.map((l) => [l.label, l.tag, l.seen])).toEqual([
      ["Career Stats", "SEEN", true],
      ["Match Highlights", "PROJECTS", false],
      ["Player Attributes", "SKILLS", false],
      ["Trophy Room", "AWARDS", false],
      ["Training Academy", "EDUCATION", false],
      ["Player Card", "RESUME", false],
      ["Team Up", "CONTACT", false],
      ["Quick View", "RECRUITER", false],
    ]);
  });
  it("a fresh visitor: nothing played, the opening line", () => {
    const v = view(fresh);
    expect(v.matchday).toMatchObject({ done: 0, total: 3, title: "0 OF 3 VENUES" });
    expect(v.venues.every((x) => !x.played && x.play.label === "PLAY")).toBe(true);
    expect(v.comm).toBe("Three venues. One opponent. Pick your ground.");
    expect(v.index.links[0]).toMatchObject({ tag: "CAREER", seen: false });
  });
  it("two and three played", () => {
    expect(view({ ...fresh, venuesPlayed: ["cricket", "tennis"] }).comm).toBe(
      "Two down. One venue left. Still undefeated.",
    );
    expect(view({ ...fresh, venuesPlayed: ["cricket", "tennis", "badminton"] }).comm).toBe(
      "Full matchday. Still undefeated.",
    );
  });
  it("a played venue with no saved score just says PLAYED", () => {
    const v = view({ ...fresh, venuesPlayed: ["tennis"] });
    expect(v.venues[1]).toMatchObject({ status: "PLAYED", statusPhone: "PLAYED" });
  });
  it("a played venue with an empty saved score reads PLAYED on the phone too", () => {
    const v = view({ ...fresh, venuesPlayed: ["tennis"], lastScores: { tennis: "" } });
    expect(v.venues[1]).toMatchObject({ status: "PLAYED", statusPhone: "PLAYED" });
  });
  it("the hint shows only what works: drag needs motion, the keys need a keyboard", () => {
    const { hint } = view(fresh);
    const show = (reducedMotion: boolean, touchOnly: boolean) =>
      hubHint(hint, { reducedMotion, touchOnly });
    expect(show(false, false)).toBe("DRAG TO ORBIT · 1 2 3 TO PICK A VENUE");
    expect(show(true, false)).toBe("1 2 3 TO PICK A VENUE");
    expect(show(false, true)).toBe("DRAG TO ORBIT");
    expect(show(true, true)).toBe("");
  });
  it("the rail's FULL TIME box waits for all three venues, then says the result is up (F8)", () => {
    const some = view({ ...fresh, venuesPlayed: ["cricket"] });
    expect(some.fullTime).toEqual({ label: "FULL TIME", text: ui.hub.fullTime.pending });
    const all = view({ ...fresh, venuesPlayed: ["cricket", "tennis", "badminton"] });
    expect(all.fullTime.text).toBe(ui.hub.fullTime.done);
  });

  it("lists Full Time in the index once the matchday is complete, SEEN once opened (F8)", () => {
    const keys = (r: HubRecord) => view(r).index.links.map((l) => l.key);
    expect(keys({ ...fresh, venuesPlayed: ["cricket", "tennis"] })).not.toContain("fullTime");
    const done = { ...fresh, venuesPlayed: ["cricket", "tennis", "badminton"] as Venue[] };
    expect(keys(done).at(-1)).toBe("fullTime");
    const link = view({ ...done, sectionsSeen: ["fullTime"] }).index.links.at(-1)!;
    expect(link).toMatchObject({ to: "/arena/full-time", tag: ui.hub.index.seen, seen: true });
  });

  it("the record chip always reads YOU 0", () => {
    expect(view({ ...fresh, yashWins: 4 }).record.value).toBe("YASH 4 · YOU 0");
  });
  it("Training Academy is seen with the trophy room and links to its section", () => {
    const v = view({ ...fresh, sectionsSeen: ["trophies"] });
    expect(v.index.links.find((l) => l.key === "academy")).toMatchObject({
      seen: true,
      tag: "SEEN",
      to: "/trophies#academy",
    });
  });
  it("facilities: four on desktop (the last is volt), two on the phone", () => {
    const v = view(fresh);
    expect(v.facilities.map((f) => [f.label, f.title, f.tone, f.to])).toEqual([
      ["ACHIEVEMENTS", "TROPHY ROOM", "glass", "/trophies"],
      ["EDUCATION", "TRAINING ACADEMY", "glass", "/trophies#academy"],
      ["RESUME", "VIEW PLAYER CARD", "glass", "/card"],
      ["CONTACT", "TEAM UP", "volt", "/team-up"],
    ]);
    expect(v.facilitiesPhone.map((f) => [f.label, f.title])).toEqual([
      ["AWARDS", "TROPHY ROOM"],
      ["EDUCATION", "ACADEMY"],
    ]);
  });
});
