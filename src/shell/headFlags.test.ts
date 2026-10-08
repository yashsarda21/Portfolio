import { describe, expect, it } from "vitest";
import { HEAD_FLAGS_SCRIPT, LANDING_SEEN_KEY } from "./headFlags";
import { MATCH_RECORD_KEY } from "./storageKeys";

function run(store: Record<string, string>, throws = false) {
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
      return store[k] ?? null;
    },
  };
  new Function("document", "localStorage", HEAD_FLAGS_SCRIPT)(document, localStorage);
  return { attrs, classes, asked };
}

describe("HEAD_FLAGS_SCRIPT", () => {
  it("marks JS on", () => expect(run({}).classes.has("js")).toBe(true));
  it("marks a return visit", () =>
    expect(run({ [LANDING_SEEN_KEY]: "1" }).attrs["data-return-visit"]).toBe(""));
  it("first visit has no flag", () => {
    const { attrs } = run({});
    expect(attrs["data-return-visit"]).toBeUndefined();
    expect(attrs["data-record"]).toBeUndefined();
  });
  it("marks a saved match record", () =>
    expect(run({ "arena:v1": "{}" }).attrs["data-record"]).toBe(""));
  it("survives blocked storage", () => expect(run({}, true).classes.has("js")).toBe(true));
  it("reads the shared keys", () =>
    expect(run({}).asked).toEqual([LANDING_SEEN_KEY, MATCH_RECORD_KEY]));
  it("the keys are arena:landing-seen and arena:v1", () => {
    expect(LANDING_SEEN_KEY).toBe("arena:landing-seen");
    expect(MATCH_RECORD_KEY).toBe("arena:v1");
  });
});
