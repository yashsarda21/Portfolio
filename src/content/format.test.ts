import { describe, expect, it } from "vitest";
import {
  experienceSince,
  formatMonth,
  formatMonthLong,
  formatSpan,
  formatYearSpan,
  monthsBetween,
} from "./format";

describe("formatters", () => {
  it("formats a year-month", () => {
    expect(formatMonth("2024-07")).toBe("Jul 2024");
    expect(formatMonth("2023-12")).toBe("Dec 2023");
  });

  it("formats an ongoing span", () => {
    expect(formatSpan("2024-07", null)).toBe("Jul 2024 – now");
  });

  it("collapses the year inside a same-year span", () => {
    expect(formatSpan("2023-06", "2023-07")).toBe("Jun – Jul 2023");
  });

  it("keeps both years when a span crosses a year", () => {
    expect(formatSpan("2023-12", "2024-01")).toBe("Dec 2023 – Jan 2024");
  });

  it("formats a single-month span without repeating", () => {
    expect(formatSpan("2023-06", "2023-06")).toBe("Jun 2023");
  });

  it("formats a year span", () => {
    expect(formatYearSpan("2020-07", "2024-06")).toBe("2020 – 2024");
  });

  it("builds the since-label in caps", () => {
    expect(experienceSince("2024-07")).toBe("SINCE JUL 2024");
  });

  it("counts whole months, never negative", () => {
    expect(monthsBetween("2024-07", new Date(2026, 9, 3))).toBe(27);
    expect(monthsBetween("2024-07", new Date(2024, 6, 1))).toBe(0);
    expect(monthsBetween("2030-01", new Date(2026, 9, 3))).toBe(0);
  });

  it("returns 0 for an invalid date instead of NaN", () => {
    expect(monthsBetween("2024-07", new Date("not a date"))).toBe(0);
  });

  it("throws on malformed input", () => {
    expect(() => formatMonth("2024-7")).toThrow(/YYYY-MM/);
  });

  it("formats a long month", () => {
    expect(formatMonthLong("2024-07")).toBe("July 2024");
    expect(formatMonthLong("2023-12")).toBe("December 2023");
  });

  it("rejects malformed input in the long format too", () => {
    expect(() => formatMonthLong("2024-7")).toThrow(/YYYY-MM/);
    expect(() => formatMonthLong("2024-13")).toThrow(/YYYY-MM/);
  });
});
