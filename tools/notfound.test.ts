import { describe, expect, it } from "vitest";
// @ts-expect-error a plain ESM tool: it ships no types
import { mainOf, notFoundFile } from "./notfound.mjs";

const main = mainOf as (html: string) => string;
const file = notFoundFile as (fallback: string, prerendered: string) => string;

const FALLBACK =
  '<html><head></head><body><a href="#main">Skip</a><script>x()</script></body></html>';
const PRERENDERED =
  '<html><head><title>Out</title></head><body><header>HUB</header><main id="main"><h1>OUT OF BOUNDS</h1><a href="/arena">BACK TO THE HUB</a></main><nav>tabs</nav></body></html>';

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

describe("notFoundFile", () => {
  const out = file(FALLBACK, PRERENDERED);
  it("is the client-only page, so the router renders the catch-all once", () => {
    expect(out.startsWith(FALLBACK.slice(0, FALLBACK.indexOf("</body>")))).toBe(true);
    expect(out).toContain("<script>x()</script>");
    expect(out).not.toContain("<header>HUB</header>");
    expect(out).not.toContain("<title>");
  });
  it("holds the prerendered <main> in a <noscript> as the last thing in <body>", () => {
    expect(out.endsWith(`<noscript>${main(PRERENDERED)}</noscript></body></html>`)).toBe(true);
    expect(out.match(/<main\b/g)).toHaveLength(1);
  });
  it("needs a </body> to put it in", () => {
    expect(() => file("<html></html>", PRERENDERED)).toThrow(/no <\/body>/);
  });
});
