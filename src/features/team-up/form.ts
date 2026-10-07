import type { UiCopy } from "@/content";

export type Format = "sign" | "doubles" | "rally";

export interface ChallengeValues {
  format: Format;
  name: string;
  email: string;
  message: string;
  /** The honeypot: a field no visitor sees or reaches. Bots fill it, so a value here means the challenge is dropped. */
  website: string;
}

export type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;

/** The least a message can say (after trimming) to count as a challenge. */
export const MIN_MESSAGE_LENGTH = 10;

/** One @, a name before it, and a domain of dotted parts after it: no spaces anywhere. */
const EMAIL = /^[^\s@]+@[^\s@.]+(?:\.[^\s@.]+)+$/;

/** Checks a challenge. Values are trimmed first; an empty result means it can be sent. */
export function validate(
  v: ChallengeValues,
  copy: UiCopy["pages"]["teamUp"]["errors"],
): FieldErrors {
  const errors: FieldErrors = {};
  if (v.name.trim() === "") errors.name = copy.name;
  if (!EMAIL.test(v.email.trim())) errors.email = copy.email;
  if (v.message.trim().length < MIN_MESSAGE_LENGTH) errors.message = copy.message;
  return errors;
}

/** The challenge written out as an email: its subject and body. */
export function buildMessage(v: ChallengeValues, formatTitle: string) {
  const name = v.name.trim();
  return {
    subject: `${formatTitle} — ${name}`,
    body: `${v.message.trim()}\n\n${name}\n${v.email.trim()}`,
  };
}

/** The whole message as one block of text (what COPY MESSAGE puts on the clipboard). */
export function messageText(v: ChallengeValues, formatTitle: string): string {
  const { subject, body } = buildMessage(v, formatTitle);
  return `${subject}\n\n${body}`;
}

/** The honeypot's field name: Formspree's own (`_gotcha`), so a service that has one ignores a bot's post. */
export const HONEYPOT_NAME = "_gotcha";

/** The email link that opens the visitor's mail app with the challenge written out. */
export function buildMailto(v: ChallengeValues, to: string, formatTitle: string): string {
  const { subject, body } = buildMessage(v, formatTitle);
  return `mailto:${to}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

/**
 * What a send came to. `sent`: the service took it (2xx). `mailto`: the visitor's mail app was asked to open,
 * and nothing has gone out until they press send there. `dropped`: the honeypot was filled (reads as sent).
 */
export type SubmitResult = "sent" | "mailto" | "error" | "dropped";

export interface SubmitDeps {
  /** The form service's address; null sends by email instead. */
  endpoint: string | null;
  fetch: typeof fetch;
  /** Opens a URL (the mailto link). */
  openUrl: (url: string) => void;
  /** The address the email goes to. */
  to: string;
  /** The chosen format's title, for the email's subject. */
  formatTitle: string;
}

/**
 * Sends a challenge. A filled honeypot is dropped quietly (it reads as sent, so bots learn nothing). With an
 * endpoint the challenge is posted as JSON (Formspree-compatible: `Accept: application/json`); without one the visitor's mail app is opened, pre-filled.
 * Never throws: a failure of any kind is "error", and the caller keeps the visitor's text.
 */
export async function submitChallenge(v: ChallengeValues, deps: SubmitDeps): Promise<SubmitResult> {
  if (v.website.trim() !== "") return "dropped";
  try {
    if (deps.endpoint) {
      const response = await deps.fetch(deps.endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          format: v.format,
          name: v.name.trim(),
          email: v.email.trim(),
          message: v.message.trim(),
        }),
      });
      return response.ok ? "sent" : "error";
    }
    deps.openUrl(buildMailto(v, deps.to, deps.formatTitle));
    return "mailto";
  } catch {
    return "error";
  }
}
