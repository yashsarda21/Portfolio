/**
 * Validates a form endpoint. Only absolute https URLs pass; anything else (unset, blank,
 * http, javascript:, malformed) is null so the Team Up form can fall back to email.
 */
export function parseEndpoint(raw: string | undefined): string | null {
  const value = raw?.trim();
  if (!value) return null;
  try {
    const url = new URL(value);
    if (url.protocol !== "https:" || url.hostname === "") return null;
    return value;
  } catch {
    return null;
  }
}

/**
 * The Team Up form endpoint from `VITE_FORM_ENDPOINT`, or null when unset or unsafe. The form posts to it the
 * way Formspree takes a post (JSON with `Accept: application/json`, honeypot field `_gotcha`); a service that
 * needs extra fields in the body (Web3Forms wants an `access_key`) is not supported as is.
 */
export const formEndpoint: string | null = parseEndpoint(import.meta.env.VITE_FORM_ENDPOINT);

/**
 * The year the site was built (injected by Vite's `define`, see vite.define.ts). The prerendered HTML and the
 * client bundle share it, so the first client render matches the HTML whatever the visitor's year is.
 */
export const BUILD_YEAR: number = __BUILD_YEAR__;
