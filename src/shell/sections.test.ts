import { describe, expect, it } from "vitest";
import type { Venue } from "./matchRecord";
import { SECTIONS, sectionForPath, sectionToMark } from "./sections";

describe("sectionForPath", () => {
  it.each([
    ["/career", "career"],
    ["/highlights", "highlights"],
    ["/attributes", "attributes"],
    ["/trophies", "trophies"],
    ["/card", "card"],
    ["/team-up", "teamUp"],
    ["/scout", "scout"],
    ["/arena/full-time", "fullTime"],
    ["/career/", "career"],
  ])("%s is %s", (path, key) => expect(sectionForPath(path)).toBe(key));
  it.each(["/", "/intro", "/arena", "/arena/cricket", "/careers", "/404"])(
    "%s is not a section",
    (path) => expect(sectionForPath(path)).toBeNull(),
  );
  it("lists every section once", () => expect(new Set(SECTIONS).size).toBe(SECTIONS.length));
});

describe("sectionToMark", () => {
  const all: Venue[] = ["cricket", "tennis", "badminton"];
  it("marks Full Time only when the matchday is complete", () => {
    expect(sectionToMark("/arena/full-time", { venuesPlayed: ["cricket", "tennis"] })).toBeNull();
    expect(sectionToMark("/arena/full-time", { venuesPlayed: all })).toBe("fullTime");
  });
  it("marks every other section whatever has been played", () => {
    expect(sectionToMark("/career", { venuesPlayed: [] })).toBe("career");
    expect(sectionToMark("/arena", { venuesPlayed: [] })).toBeNull();
  });
});
