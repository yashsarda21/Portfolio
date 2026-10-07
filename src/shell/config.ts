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

/** The Team Up form endpoint from `VITE_FORM_ENDPOINT`, or null when unset or unsafe. */
export const formEndpoint: string | null = parseEndpoint(import.meta.env.VITE_FORM_ENDPOINT);
