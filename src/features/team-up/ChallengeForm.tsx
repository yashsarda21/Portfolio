import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Button, Fieldset, RadioCard, Text, TextArea, TextField } from "@/design-system";
import {
  submitChallenge,
  validate,
  type ChallengeValues,
  type FieldErrors,
  type Format,
  type SubmitDeps,
} from "./form";
import type { TeamUpView } from "./view";
import { useHydrated } from "./useHydrated";

/** How the form sends: the service address (or none, for email), the network and the way to open a link. */
export type TeamUpDeps = Pick<SubmitDeps, "endpoint" | "fetch" | "openUrl">;

type Field = keyof FieldErrors;
const FIELD_ORDER: Field[] = ["name", "email", "message"];
const EMPTY: ChallengeValues = { format: "sign", name: "", email: "", message: "", website: "" };

/**
 * The challenge form. Without JavaScript it posts natively (to the form service, or as an email); with it,
 * the form checks each field, focuses the first one that needs fixing, and sends once (a second press while
 * sending does nothing). If sending fails the visitor's words stay and the email address is offered.
 */
export function ChallengeForm({
  view,
  deps,
  onSent,
  focusName = false,
}: {
  view: TeamUpView;
  deps: TeamUpDeps;
  /** The challenge went out (or was quietly dropped). */
  onSent: () => void;
  /** Put the cursor in the name field on mount ("SEND ANOTHER"). */
  focusName?: boolean;
}) {
  const hydrated = useHydrated();
  const statusId = useId();
  const [values, setValues] = useState<ChallengeValues>(EMPTY);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [phase, setPhase] = useState<"idle" | "sending" | "failed">("idle");
  // A ref, not state: two presses can land before React re-renders.
  const inFlight = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (focusName) nameRef.current?.focus();
  }, [focusName]);

  const sending = phase === "sending";
  const mailAction = `mailto:${view.address}`;
  const set = (patch: Partial<ChallengeValues>) => {
    const next = { ...values, ...patch };
    setValues(next);
    // A field that was flagged is re-checked as the visitor fixes it; the others wait for the next send.
    if (Object.keys(errors).length > 0) {
      const now = validate(next, view.errors);
      setErrors((prev) =>
        Object.fromEntries(FIELD_ORDER.filter((k) => prev[k]).map((k) => [k, now[k]])),
      );
    }
  };
  const onText =
    (key: Field | "website") => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      set({ [key]: e.target.value });

  async function onSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (inFlight.current) return;
    const found = validate(values, view.errors);
    setErrors(found);
    const first = FIELD_ORDER.find((k) => found[k]);
    if (first) {
      ({ name: nameRef, email: emailRef, message: messageRef })[first].current?.focus();
      return;
    }
    inFlight.current = true;
    setPhase("sending");
    const title = view.formats.options.find((o) => o.id === values.format)!.title;
    const result = await submitChallenge(values, { ...deps, to: view.address, formatTitle: title });
    inFlight.current = false;
    if (result === "error") setPhase("failed");
    else onSent();
  }

  return (
    <form
      // Without JavaScript the form posts by itself: to the service, or as an email (plain text keeps it readable).
      action={deps.endpoint ?? mailAction}
      method="post"
      {...(deps.endpoint ? {} : { encType: "text/plain" })}
      // Our own checks take over once scripts run; before that, the browser's own `required` and `type=email` apply.
      noValidate={hydrated}
      onSubmit={(e) => void onSubmit(e)}
      className="flex flex-col gap-5.5"
    >
      <Fieldset legend={view.formats.legend}>
        <div className="grid grid-cols-1 gap-2.5 md:grid-cols-3">
          {view.formats.options.map((o) => (
            <RadioCard
              key={o.id}
              name="format"
              value={o.id}
              title={o.title}
              description={o.sub}
              checked={values.format === o.id}
              onChange={() => set({ format: o.id as Format })}
            />
          ))}
        </div>
      </Fieldset>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
        <TextField
          ref={nameRef}
          name="name"
          type="text"
          autoComplete="name"
          required
          label={view.fields.name.label}
          placeholder={view.fields.name.placeholder}
          value={values.name}
          onChange={onText("name")}
          error={errors.name}
        />
        <TextField
          ref={emailRef}
          name="email"
          type="email"
          autoComplete="email"
          required
          label={view.fields.email.label}
          placeholder={view.fields.email.placeholder}
          value={values.email}
          onChange={onText("email")}
          error={errors.email}
        />
      </div>
      <TextArea
        ref={messageRef}
        name="message"
        required
        label={view.fields.message.label}
        placeholder={view.fields.message.placeholder}
        value={values.message}
        onChange={onText("message")}
        error={errors.message}
      />

      {/* The honeypot: people never reach it (out of sight, out of the tab order); bots fill every field they find. */}
      <div className="sr-only">
        <label>
          {view.honeypot}
          <input
            name="website"
            type="text"
            tabIndex={-1}
            autoComplete="off"
            value={values.website}
            onChange={onText("website")}
          />
        </label>
      </div>

      {phase === "failed" ? (
        <Text as="p" role="alert" variant="body" tone="primary">
          {view.error}
        </Text>
      ) : null}

      <div className="flex items-center gap-5 max-md:flex-col max-md:items-stretch max-md:gap-4">
        <Button
          type="submit"
          size="form"
          skew="desktop"
          glow={false}
          aria-disabled={sending || undefined}
          aria-describedby={sending ? statusId : undefined}
        >
          {sending ? view.sending : view.send}
        </Button>
        <Text
          as="a"
          href={view.orEmail.href}
          variant="mono-line"
          tone="label"
          className="hover:text-floodlight"
        >
          {view.orEmail.label}
        </Text>
      </div>
      <p id={statusId} role="status" className="sr-only">
        {sending ? view.sending : ""}
      </p>
    </form>
  );
}
