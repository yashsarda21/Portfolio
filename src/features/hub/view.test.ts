import { describe, expect, it } from "vitest";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { buildHubView, hubHint, type HubRecord } from "./view";

const fresh: HubRecord = {
  venuesPlayed: [],
  lastScores: {},
  sectionsSeen: [],
  record: { yash: 0, you: 0 },
  achievements: [],
  lockerRoomUnlocked: false,
};
const artboard: HubRecord = {
  ...fresh,
  venuesPlayed: ["cricket"],
  lastScores: { cricket: "14* NOT OUT" },
  sectionsSeen: ["career"],
  record: { yash: 1, you: 0 },
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
      reveals: "REVEALS · CAREER STATS · ~10s",
      play: { label: "REMATCH", to: "/arena/cricket" },
      skip: { label: "SKIP", labelPhone: "SEE STATS", to: "/career" },
      shortcut: "1",
    });
    expect(tennis).toMatchObject({
      played: false,
      status: "UNPLAYED",
      statusPhone: "~12s",
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
    expect(v.achievements.text).toBe("0 of 1 unlocked. Rumour says you have to beat him.");
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
  it("after a visitor win: the Locker Room joins the index and the line changes", () => {
    const v = view({
      ...artboard,
      record: { yash: 1, you: 1 },
      achievements: ["giant-killer"],
      lockerRoomUnlocked: true,
    });
    expect(v.index.links.at(-1)).toMatchObject({
      label: "Locker Room",
      tag: "UNLOCKED",
      to: "/locker-room",
    });
    expect(v.achievements.text).toBe("1 of 1 unlocked. Giant Killer. The Locker Room is open.");
    expect(v.comm).toBe(content.commentary.visitorWins[0]);
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
