import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScoreBug } from "./ScoreBug";

describe("ScoreBug", () => {
  it("is a labelled group summarising the score", () => {
    render(
      <ScoreBug label="Yash 14 not out, ball 2 of 3">
        <ScoreBug.Name>YASH</ScoreBug.Name>
        <ScoreBug.Cell>14*</ScoreBug.Cell>
        <ScoreBug.Meta>BALL 2 OF 3</ScoreBug.Meta>
        <ScoreBug.Away>YOU BOWLING</ScoreBug.Away>
      </ScoreBug>,
    );
    expect(screen.getByRole("group", { name: "Yash 14 not out, ball 2 of 3" })).toHaveClass("h-11");
    expect(screen.getByText("YASH")).toHaveClass("bg-floodlight", "text-ground");
  });

  it("alert status is never a red fill (spec A4)", () => {
    render(
      <ScoreBug label="Match point">
        <ScoreBug.Status alert>MATCH POINT</ScoreBug.Status>
      </ScoreBug>,
    );
    const chip = screen.getByText("MATCH POINT");
    expect(chip.className).not.toMatch(/bg-live/);
    expect(chip).toHaveClass("bg-panel", "text-floodlight", "font-bold");
    expect(chip.querySelector(".bg-live")).not.toBeNull();
  });

  it("small size shrinks the bar", () => {
    render(
      <ScoreBug label="x" size="sm">
        <ScoreBug.Cell>6*</ScoreBug.Cell>
      </ScoreBug>,
    );
    expect(screen.getByRole("group")).toHaveClass("h-10");
    expect(screen.getByText("6*")).toHaveClass("type-score");
  });

  it("sub-parts and the root merge className last", () => {
    render(
      <ScoreBug label="x" className="mx-auto">
        <ScoreBug.Name className="extra-name">A</ScoreBug.Name>
        <ScoreBug.Cell className="extra-cell">1</ScoreBug.Cell>
        <ScoreBug.Meta className="extra-meta">M</ScoreBug.Meta>
        <ScoreBug.Away className="extra-away">B</ScoreBug.Away>
        <ScoreBug.Status className="extra-status">S</ScoreBug.Status>
      </ScoreBug>,
    );
    expect(screen.getByRole("group")).toHaveClass("mx-auto");
    for (const [text, cls] of [
      ["A", "extra-name"],
      ["1", "extra-cell"],
      ["M", "extra-meta"],
      ["B", "extra-away"],
      ["S", "extra-status"],
    ] as const) {
      expect(screen.getByText(text)).toHaveClass(cls);
    }
  });
});
