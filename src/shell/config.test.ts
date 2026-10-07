import { describe, expect, it } from "vitest";
import { parseEndpoint } from "./config";

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
