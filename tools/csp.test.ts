import { describe, expect, it } from "vitest";
// @ts-expect-error a plain ESM tool: it ships no types
import { buildCsp, formOriginOf, hashScript, inlineScripts, withCsp } from "./csp.mjs";

const build = buildCsp as (input: { scriptHashes: string[]; formOrigin: string | null }) => string;
const hash = hashScript as (source: string) => string;
const origin = formOriginOf as (raw: string | undefined) => string | null;
const scripts = inlineScripts as (html: string) => string[];
const add = withCsp as (
  html: string,
  formOrigin: string | null,
) => { html: string; scriptHashes: string[] };

const directive = (csp: string, name: string) =>
  csp.split("; ").filter((d) => d === name || d.startsWith(`${name} `));

describe("hashScript", () => {
  it("is the SHA-256 of the exact text, in CSP form", () => {
    expect(hash("alert(1)")).toBe("'sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI='");
  });
  it("changes with one space", () => {
    expect(hash("alert(1) ")).not.toBe(hash("alert(1)"));
  });
});

describe("buildCsp", () => {
  const csp = build({ scriptHashes: ["'sha256-aaa='", "'sha256-bbb='"], formOrigin: null });

  it.each([
    "default-src",
    "script-src",
    "style-src",
    "img-src",
    "font-src",
    "media-src",
    "connect-src",
    "form-action",
    "object-src",
    "base-uri",
    "upgrade-insecure-requests",
  ])("has %s exactly once", (name) => {
    expect(directive(csp, name)).toHaveLength(1);
  });

  it("matches the ruling (P5) with no form service", () => {
    expect(csp).toBe(
      "default-src 'self'; script-src 'self' 'sha256-aaa=' 'sha256-bbb='; " +
        "style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self' https:; " +
        "connect-src 'self'; form-action 'self' mailto:; object-src 'none'; base-uri 'self'; " +
        "upgrade-insecure-requests",
    );
  });

  it("joins the hashes with spaces", () => {
    expect(directive(csp, "script-src")[0]).toBe("script-src 'self' 'sha256-aaa=' 'sha256-bbb='");
  });

  it("never lets a script run inline or from a string", () => {
    const withForm = build({ scriptHashes: ["'sha256-aaa='"], formOrigin: "https://f.example" });
    for (const policy of [csp, withForm]) {
      const script = directive(policy, "script-src")[0];
      expect(script).not.toContain("'unsafe-inline'");
      expect(script).not.toContain("'unsafe-eval'");
    }
  });

  it("adds the form origin to connect-src and form-action only when given", () => {
    const withForm = build({ scriptHashes: [], formOrigin: "https://formspree.io" });
    expect(directive(withForm, "connect-src")[0]).toBe("connect-src 'self' https://formspree.io");
    expect(directive(withForm, "form-action")[0]).toBe(
      "form-action 'self' mailto: https://formspree.io",
    );
    expect(withForm.match(/formspree/g)).toHaveLength(2);
    expect(csp).not.toContain("https://");
  });
});

describe("formOriginOf", () => {
  it("keeps only the origin of an https address", () => {
    expect(origin("https://formspree.io/f/abc123")).toBe("https://formspree.io");
  });
  it.each([undefined, "", "  ", "http://x.example/f", "javascript:alert(1)", "not a url"])(
    "is null for %j",
    (raw) => {
      expect(origin(raw)).toBeNull();
    },
  );
});

describe("the page rewrite", () => {
  const page =
    '<!DOCTYPE html><html><head><meta charSet="utf-8"/><title>t</title>' +
    "<script>var a = 1;</script>" +
    '<script src="/assets/x.js"></script>' +
    '<script type="application/ld+json">{"a":">"}</script>' +
    '<script type="module" async="">import("/assets/y.js")</script>' +
    "<script>var a = 1;</script>" +
    "</head><body><p>no scripts here</p></body></html>";

  it("finds inline scripts only, whatever their type", () => {
    expect(scripts(page)).toEqual([
      "var a = 1;",
      '{"a":">"}',
      'import("/assets/y.js")',
      "var a = 1;",
    ]);
  });

  it("puts the policy first in <head>, with each distinct script hashed once", () => {
    const { html, scriptHashes } = add(page, null);
    expect(html).toMatch(
      /<head><meta http-equiv="Content-Security-Policy" content="[^"]+"\/><meta charSet/,
    );
    expect(scriptHashes).toEqual([
      hash("var a = 1;"),
      hash('{"a":">"}'),
      hash('import("/assets/y.js")'),
    ]);
    for (const h of scriptHashes) expect(html).toContain(h);
  });

  it("is the same when run twice", () => {
    const once = add(page, "https://f.example").html;
    expect(add(once, "https://f.example").html).toBe(once);
  });

  it("refuses a page without a head", () => {
    expect(() => add("<p>x</p>", null)).toThrow(/no <head>/);
  });
});
