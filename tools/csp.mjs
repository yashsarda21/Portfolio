// The Content-Security-Policy of a prerendered page, built from the page's own inline scripts. Pure functions
// (no file or network access), so tools/csp.test.ts can check them; tools/postbuild.mjs does the file work.
import { createHash } from "node:crypto";

/** `'sha256-<base64>'` of the exact text between a script's tags: the form a CSP `script-src` takes. */
export function hashScript(source) {
  return `'sha256-${createHash("sha256").update(source, "utf8").digest("base64")}'`;
}

/**
 * The policy for one page. `scriptHashes` are the page's inline scripts (already in `hashScript` form);
 * `formOrigin` is the Team Up form service's origin, or null while the site has none (the mail-app fallback).
 * Styles allow 'unsafe-inline' because React writes `style` attributes; scripts never do.
 * `upgrade-insecure-requests` is not here on purpose (ruling R2): Safari/WebKit would also upgrade the local http preview
 * and break it. It ships in public/_headers' Content-Security-Policy header instead, beside `frame-ancestors`.
 */
export function buildCsp({ scriptHashes, formOrigin }) {
  const origin = formOrigin ? [formOrigin] : [];
  const directives = [
    ["default-src", "'self'"],
    ["script-src", "'self'", ...scriptHashes],
    ["style-src", "'self'", "'unsafe-inline'"],
    ["img-src", "'self'", "data:"],
    ["font-src", "'self'"],
    ["media-src", "'self'", "https:"],
    ["connect-src", "'self'", ...origin],
    ["form-action", "'self'", "mailto:", ...origin],
    ["object-src", "'none'"],
    ["base-uri", "'self'"],
  ];
  return directives.map((parts) => parts.join(" ")).join("; ");
}

/**
 * The form origin from the raw `VITE_FORM_ENDPOINT`, or null. The same rule as `parseEndpoint` in
 * src/shell/config.ts (a tool cannot import TypeScript): only an absolute https URL counts.
 */
export function formOriginOf(raw) {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    return url.protocol === "https:" && url.hostname !== "" ? url.origin : null;
  } catch {
    return null;
  }
}

// An inline script: a <script> tag without a `src`, whatever its `type`. Attribute values may hold a ">".
const SCRIPT = /<script\b((?:[^>"']|"[^"]*"|'[^']*')*)>([\s\S]*?)<\/script\s*>/gi;
const HAS_SRC = /(?:^|\s)src\s*=/i;
const CSP_META = /<meta http-equiv="Content-Security-Policy"[^>]*>/gi;
const CHARSET_META = /^<meta\s+charset=[^>]*>/i;

/** The text of every inline script in `html`, in order. */
export function inlineScripts(html) {
  return [...html.matchAll(SCRIPT)].filter((m) => !HAS_SRC.test(m[1])).map((m) => m[2]);
}

/**
 * `html` with the page's CSP meta in <head>: right after the `<meta charset>` when that is the first child (the browser
 * finds the charset only in the first 1024 bytes, and a long policy would push it out), else first. Either way it comes
 * before every script. An earlier policy is replaced, so running twice changes nothing. Returns the new html and the
 * distinct hashes it allows.
 */
export function withCsp(html, formOrigin) {
  const bare = html.replace(CSP_META, "");
  const scriptHashes = [...new Set(inlineScripts(bare).map(hashScript))];
  const meta = `<meta http-equiv="Content-Security-Policy" content="${buildCsp({ scriptHashes, formOrigin })}"/>`;
  const head = /<head\b[^>]*>/i.exec(bare);
  if (!head) throw new Error("withCsp: no <head> in the page");
  const start = head.index + head[0].length;
  const charset = CHARSET_META.exec(bare.slice(start));
  const at = start + (charset ? charset[0].length : 0);
  return { html: bare.slice(0, at) + meta + bare.slice(at), scriptHashes };
}
