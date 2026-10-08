import { ESLint } from "eslint";
import { describe, expect, it } from "vitest";

/** Lints `code` as if it were the file `filePath` of the repo, with the repo's own config. */
async function lint(code: string, filePath: string) {
  const eslint = new ESLint({ cwd: process.cwd() });
  const [result] = await eslint.lintText(code, { filePath });
  return result!.messages;
}

const FEATURE = "src/features/intro/Fake.tsx";
const DESIGN_SYSTEM = "src/design-system/scene/Fake.tsx";

describe("the raw style rule (RAW_STYLE_LITERALS)", () => {
  it.each([
    ["an arbitrary box-shadow", 'export const a = "shadow-[0_0_16px] shadow-volt";'],
    ["an arbitrary blur", 'export const a = "blur-[2px]";'],
    ["an arbitrary drop-shadow", 'export const a = "drop-shadow-[0_0_4px]";'],
    ["a shadow behind a variant", 'export const a = "md:shadow-[0_0_30px]";'],
    ["a shadow in a template string", "export const a = `absolute shadow-[0_0_10px] ${1}`;"],
  ])("fires on %s in a feature", async (_name, code) => {
    const messages = await lint(code, FEATURE);
    expect(messages.map((m) => m.ruleId)).toContain("no-restricted-syntax");
    expect(messages.map((m) => m.message).join(" ")).toMatch(/shadow-\* and blur-\* tokens/);
  });

  it("fires in the design system too", async () => {
    const messages = await lint('export const a = "blur-[3px]";', DESIGN_SYSTEM);
    expect(messages.map((m) => m.ruleId)).toContain("no-restricted-syntax");
  });

  it.each([
    "shadow-glow-volt-md",
    "blur-soft",
    "shadow-bank-lg",
    "shadow-volt-a35",
    "[--bulb-gx:12px]",
  ])("lets the token %s through", async (cls) => {
    const messages = await lint(`export const a = "${cls}";`, FEATURE);
    expect(messages).toEqual([]);
  });
});
