import { describe, expect, it } from "vitest";
import { parseEndpoint, parseSiteUrl } from "./config";

describe("parseEndpoint", () => {
  it("accepts an https URL", () => {
    expect(parseEndpoint("https://formspree.io/f/x")).toBe("https://formspree.io/f/x");
  });

  it("rejects missing, empty and blank values", () => {
    expect(parseEndpoint(undefined)).toBeNull();
    expect(parseEndpoint("")).toBeNull();
    expect(parseEndpoint("   ")).toBeNull();
  });

  it("rejects non-https schemes and malformed input", () => {
    expect(parseEndpoint("http://formspree.io/f/x")).toBeNull();
    expect(parseEndpoint("javascript:alert(1)")).toBeNull();
    expect(parseEndpoint("not a url")).toBeNull();
    expect(parseEndpoint("https://")).toBeNull();
  });
});

describe("parseSiteUrl", () => {
  it("rejects missing, blank, non-https and malformed values", () => {
    expect(parseSiteUrl(undefined)).toBeNull();
    expect(parseSiteUrl("")).toBeNull();
    expect(parseSiteUrl("http://x.dev")).toBeNull();
    expect(parseSiteUrl("javascript:alert(1)")).toBeNull();
    expect(parseSiteUrl("not a url")).toBeNull();
  });

  it("keeps the origin only, with no trailing slash", () => {
    expect(parseSiteUrl("https://yash.dev")).toBe("https://yash.dev");
    expect(parseSiteUrl("https://yash.dev/")).toBe("https://yash.dev");
    expect(parseSiteUrl("https://yash.dev/some/path?q=1")).toBe("https://yash.dev");
  });
});
