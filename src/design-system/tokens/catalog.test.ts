import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TOKEN_CATALOG } from "./catalog";

const dir = join(process.cwd(), "src/design-system/tokens");
const theme = readFileSync(join(dir, "theme.css"), "utf8");
const base = readFileSync(join(dir, "base.css"), "utf8");

describe("token catalogue", () => {
  it.each(TOKEN_CATALOG.colors)("colour %s exists in theme.css", (name) => {
    expect(theme).toContain(`--color-${name}:`);
  });
  it.each(TOKEN_CATALOG.type)("type recipe %s exists in base.css", (name) => {
    expect(base).toContain(`@utility ${name} {`);
  });
  it.each(TOKEN_CATALOG.shadows)("shadow %s exists in theme.css", (name) => {
    expect(theme).toContain(`--shadow-${name}:`);
  });
  it.each(TOKEN_CATALOG.eases)("ease %s exists in theme.css", (name) => {
    expect(theme).toContain(`--ease-${name}:`);
  });
});
