import { describe, expect, it } from "vitest";
import { SECTIONS, sectionForPath } from "./sections";

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
    ["/locker-room", "lockerRoom"],
    ["/career/", "career"],
  ])("%s is %s", (path, key) => expect(sectionForPath(path)).toBe(key));
  it.each(["/", "/intro", "/arena", "/arena/cricket", "/careers", "/404"])(
    "%s is not a section",
    (path) => expect(sectionForPath(path)).toBeNull(),
  );
  it("lists every section once", () => expect(new Set(SECTIONS).size).toBe(SECTIONS.length));
});
