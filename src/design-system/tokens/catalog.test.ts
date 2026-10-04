import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TOKEN_CATALOG } from "./catalog";

const dir = join(process.cwd(), "src/design-system/tokens");
const theme = readFileSync(join(dir, "theme.css"), "utf8");
const base = readFileSync(join(dir, "base.css"), "utf8");

describe("token catalogue", () => {
  it.each(TOKEN_CATALOG.colors)("colour $name exists in theme.css", ({ name, className }) => {
    expect(theme).toContain(`--color-${name}:`);
    expect(className).toBe(`bg-${name}`);
  });
  it.each(TOKEN_CATALOG.type)("type recipe %s exists in base.css", (name) => {
    expect(base).toContain(`@utility ${name} {`);
  });
  it("every type recipe in base.css is in the catalogue (no unlisted near-duplicates)", () => {
    const defined = [...base.matchAll(/@utility (type-[\w-]+) \{/g)].map((m) => m[1]);
    expect(
      defined.filter((name) => !(TOKEN_CATALOG.type as readonly string[]).includes(name!)),
    ).toEqual([]);
  });
  it.each(TOKEN_CATALOG.shadows)("shadow $name exists in theme.css", ({ name, className }) => {
    expect(theme).toContain(`--shadow-${name}:`);
    expect(className).toBe(`shadow-${name}`);
  });
  it.each(TOKEN_CATALOG.eases)("ease %s exists in theme.css", (name) => {
    expect(theme).toContain(`--ease-${name}:`);
  });
});
