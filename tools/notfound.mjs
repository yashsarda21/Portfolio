// The host's 404 file. Pure functions (no file access), so tools/notfound.test.ts can check them; tools/postbuild.mjs does the file work.

const MAIN = /<main\b[^>]*>[\s\S]*<\/main>/i;

/** The visible content of a prerendered page: its `<main>` element, tags and all. */
export function mainOf(html) {
  const match = MAIN.exec(html);
  if (!match) throw new Error("mainOf: no <main> in the page");
  return match[0];
}

/**
 * The text of `404.html`. A static host sends it, with status 404, for every unknown address, at an address that is
 * not `/404`. So it must be the client-only page (`__spa-fallback.html`, no page body): the router then renders the
 * catch-all once, and shows the path tried. (A copy of the prerendered `/404` page would be rendered twice: its own
 * body, and the router's new one below it.) For a visitor without JavaScript, the prerendered page's `<main>` is added
 * inside a `<noscript>` at the end of <body>: a browser with scripts on ignores it, and one with scripts off shows it.
 */
export function notFoundFile(fallbackHtml, prerenderedHtml) {
  const noscript = `<noscript>${mainOf(prerenderedHtml)}</noscript>`;
  const end = fallbackHtml.lastIndexOf("</body>");
  if (end === -1) throw new Error("notFoundFile: no </body> in the fallback page");
  return fallbackHtml.slice(0, end) + noscript + fallbackHtml.slice(end);
}
