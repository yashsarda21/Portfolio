import { describe, expect, it } from "vitest";
// @ts-expect-error a plain ESM tool: it ships no types
import { headTagsOf, mainOf, notFoundFile } from "./notfound.mjs";

const main = mainOf as (html: string) => string;
const tags = headTagsOf as (html: string) => string;
const file = notFoundFile as (fallback: string, prerendered: string) => string;

const FALLBACK =
  '<html><head></head><body><a href="#main">Skip</a><script>x()</script></body></html>';
const PRERENDERED =
  '<html><head><meta charSet="utf-8"/><title>Out</title><meta name="robots" content="noindex"/><meta property="og:title" content="Out"/><link rel="x" href="/y"/></head><body><header>HUB</header><main id="main"><h1>OUT OF BOUNDS</h1><a href="/arena">BACK TO THE HUB</a></main><nav>tabs</nav></body></html>';

describe("mainOf", () => {
  it("takes the <main> element and nothing around it", () => {
    expect(main(PRERENDERED)).toBe(
      '<main id="main"><h1>OUT OF BOUNDS</h1><a href="/arena">BACK TO THE HUB</a></main>',
    );
  });
  it("fails loudly when a page has no <main>", () => {
    expect(() => main("<body>nothing</body>")).toThrow(/no <main>/);
  });
});

describe("headTagsOf", () => {
  it("takes the title and the name / property meta tags, nothing else", () => {
    expect(tags(PRERENDERED)).toBe(
      '<title>Out</title><meta name="robots" content="noindex"/><meta property="og:title" content="Out"/>',
    );
  });
  it("is empty for a head with none", () => {
    expect(tags("<html><head></head></html>")).toBe("");
  });
});

describe("notFoundFile", () => {
  const out = file(FALLBACK, PRERENDERED);
  it("is the client-only page, so the router renders the catch-all once", () => {
    expect(out).toContain('<body><a href="#main">Skip</a><script>x()</script><noscript>');
    expect(out).toContain("<script>x()</script>");
    expect(out).not.toContain("<header>HUB</header>");
  });
  it("carries the page's title and meta tags, so a crawler or a browser without scripts knows what it is", () => {
    expect(out).toContain(
      '<noscript><title>Out</title><meta name="robots" content="noindex"/><meta property="og:title" content="Out"/></noscript></head>',
    );
    expect(out.match(/<title>/g)).toHaveLength(1);
    expect(out).not.toContain('rel="x"');
  });
  it("holds the prerendered <main> in a <noscript> as the last thing in <body>", () => {
    expect(out.endsWith(`<noscript>${main(PRERENDERED)}</noscript></body></html>`)).toBe(true);
    expect(out.match(/<main\b/g)).toHaveLength(1);
  });
  it("needs a </body> to put it in", () => {
    expect(() => file("<html></html>", PRERENDERED)).toThrow(/no <\/body>/);
  });
});
