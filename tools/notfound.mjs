// The host's 404 file. Pure functions (no file access), so tools/notfound.test.ts can check them; tools/postbuild.mjs does the file work.

const MAIN = /<main\b[^>]*>[\s\S]*<\/main>/i;

/** The visible content of a prerendered page: its `<main>` element, tags and all. */
export function mainOf(html) {
  const match = MAIN.exec(html);
  if (!match) throw new Error("mainOf: no <main> in the page");
  return match[0];
}

const TITLE = /<title>[\s\S]*?<\/title>/i;
const META_TAG = /<meta\s+(?:name|property)="[^"]*"\s+content="[^"]*"\s*\/?>/gi;

/** The page's own title and description / Open Graph / robots tags: what tells a browser or a crawler what the page is. */
export function headTagsOf(html) {
  const head = /<head\b[^>]*>([\s\S]*?)<\/head>/i.exec(html)?.[1] ?? "";
  return (TITLE.exec(head)?.[0] ?? "") + (head.match(META_TAG) ?? []).join("");
}

/**
 * The text of `404.html`. A static host sends it, with status 404, for every unknown address, at an address that is
 * not `/404`. So it must be the client-only page (`__spa-fallback.html`, no page body): the router then renders the
 * catch-all once, and shows the path tried. (A copy of the prerendered `/404` page would be rendered twice: its own
 * body, and the router's new one below it.) For a visitor without JavaScript, the prerendered page's title and meta tags
 * (the same ones the router renders for the catch-all, so they go in a `<noscript>` too, and nothing is doubled) and its `<main>`, inside a `<noscript>` at the
 * end of <body>, are added: a browser with scripts on ignores the <noscript>, and one with scripts off shows it.
 */
export function notFoundFile(fallbackHtml, prerenderedHtml) {
  const noscript = `<noscript>${mainOf(prerenderedHtml)}</noscript>`;
  const end = fallbackHtml.lastIndexOf("</body>");
  if (end === -1) throw new Error("notFoundFile: no </body> in the fallback page");
  const withBody = fallbackHtml.slice(0, end) + noscript + fallbackHtml.slice(end);
  const headEnd = withBody.indexOf("</head>");
  if (headEnd === -1) throw new Error("notFoundFile: no </head> in the fallback page");
  // In a <noscript>, so a browser with scripts on does not make them: the router renders its own title and tags, and
  // these would be a second set. A browser with scripts off reads them as the page's own.
  return (
    withBody.slice(0, headEnd) +
    `<noscript>${headTagsOf(prerenderedHtml)}</noscript>` +
    withBody.slice(headEnd)
  );
}
