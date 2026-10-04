import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { STAGE_SCALE_SCRIPT } from "./stageScript";

describe("stage scale script", () => {
  it("is copied verbatim into Storybook's head so stories scale like the app", () => {
    const head = readFileSync(join(process.cwd(), ".storybook/preview-head.html"), "utf8");
    expect(head).toContain(STAGE_SCALE_SCRIPT);
  });
});
