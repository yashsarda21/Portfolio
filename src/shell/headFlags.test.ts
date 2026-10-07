import { describe, expect, it } from "vitest";
import { HEAD_FLAGS_SCRIPT, LANDING_SEEN_KEY } from "./headFlags";

function run(seen: string | null, throws = false) {
  const attrs: Record<string, string> = {};
  const classes = new Set<string>();
  const asked: string[] = [];
  const document = {
    documentElement: {
      classList: { add: (c: string) => classes.add(c) },
      setAttribute: (k: string, v: string) => (attrs[k] = v),
    },
  };
  const localStorage = {
    getItem: (k: string) => {
      asked.push(k);
      if (throws) throw new Error("blocked");
      return seen;
    },
  };
  new Function("document", "localStorage", HEAD_FLAGS_SCRIPT)(document, localStorage);
  return { attrs, classes, asked };
}

describe("HEAD_FLAGS_SCRIPT", () => {
  it("marks JS on", () => expect(run(null).classes.has("js")).toBe(true));
  it("marks a return visit", () => expect(run("1").attrs["data-return-visit"]).toBe(""));
  it("first visit has no flag", () => expect(run(null).attrs["data-return-visit"]).toBeUndefined());
  it("survives blocked storage", () => expect(run(null, true).classes.has("js")).toBe(true));
  it("reads the shared key", () => expect(run("1").asked).toEqual([LANDING_SEEN_KEY]));
  it("the key is arena:landing-seen", () => expect(LANDING_SEEN_KEY).toBe("arena:landing-seen"));
});
