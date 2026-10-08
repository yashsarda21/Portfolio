import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TOKEN_CATALOG } from "./catalog";

const dir = join(process.cwd(), "src/design-system/tokens");
const theme = readFileSync(join(dir, "theme.css"), "utf8");
const base = readFileSync(join(dir, "base.css"), "utf8");

/** Every source file under `dir` that is not a test, story or fixture. */
function sources(dir: string): string[] {
  return readdirSync(dir).flatMap((entry) => {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) return sources(path);
    return /\.tsx?$/.test(entry) && !/\.(test|stories|fixture)\.tsx?$/.test(entry) ? [path] : [];
  });
}

describe("type faces", () => {
  const faces = [...base.matchAll(/@utility (face-[\w-]+) \{/g)].map((m) => m[1]!);

  it("exist, and each is applied by at least two recipes (otherwise it is not shared)", () => {
    expect(faces.length).toBeGreaterThan(0);
    for (const face of faces) {
      const users = [...base.matchAll(new RegExp(`@apply ${face};`, "g"))];
      expect(users.length, `${face} is applied ${users.length} times`).toBeGreaterThanOrEqual(2);
    }
  });

  it("are never used in markup: they have no size, so a page uses the sized type-* recipe", () => {
    const used = sources(join(process.cwd(), "src")).filter((file) =>
      faces.some((face) =>
        new RegExp(`(^|[^\\w-])${face}([^\\w-]|$)`).test(readFileSync(file, "utf8")),
      ),
    );
    expect(used).toEqual([]);
  });
});

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
