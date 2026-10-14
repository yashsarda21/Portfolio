import { useEffect, useId, useRef, useState, type ChangeEvent, type FormEvent } from "react";
import { Button, Fieldset, RadioCard, Text, TextArea, TextField } from "@/design-system";
import { useCopyText } from "@/lib/useCopyText";
import { useMatchRecord, useRecordReady } from "@/shell/matchRecord";
import {
  HONEYPOT_NAME,
  messageText,
  prefillMessage,
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
  // "mailto": the visitor's email app was asked to open; nothing is sent until they press send there.
  const [phase, setPhase] = useState<"idle" | "sending" | "failed" | "mailto">("idle");
  const { state: copyState, copy: copyText, field: copyField } = useCopyText<HTMLTextAreaElement>();
  // A ref, not state: two presses can land before React re-renders.
  const inFlight = useRef(false);
  const nameRef = useRef<HTMLInputElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const messageRef = useRef<HTMLTextAreaElement>(null);
  // F10: a visitor who has played starts with "Good game, Yash." once their record is in, unless they have touched the field.
  const played = useMatchRecord((s) => s.venuesPlayed.length > 0);
  const recordReady = useRecordReady();
  const messageTouched = useRef(false);

  useEffect(() => {
    if (focusName) nameRef.current?.focus();
  }, [focusName]);

  useEffect(() => {
    if (!recordReady) return;
    setValues((v) => {
      const message = prefillMessage(v.message, messageTouched.current, played, view.prefill);
      return message === v.message ? v : { ...v, message };
    });
  }, [recordReady, played, view.prefill]);

  const sending = phase === "sending";
  const mailto = phase === "mailto";
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
    (key: Field | "website") => (e: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
      if (key === "message") messageTouched.current = true;
      set({ [key]: e.target.value });
    };

  const formatTitle = () => view.formats.options.find((o) => o.id === values.format)!.title;

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
    const result = await submitChallenge(values, {
      ...deps,
      to: view.address,
      formatTitle: formatTitle(),
    });
    inFlight.current = false;
    if (result === "error") setPhase("failed");
    else if (result === "mailto") setPhase("mailto");
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

      {/* The honeypot: people never reach it (out of sight, out of the tab order, out of the accessibility tree); bots fill every field they find. */}
      <div aria-hidden="true" className="sr-only">
        <label>
          {view.honeypot}
          <input
            name={HONEYPOT_NAME}
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
          size="ml"
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
          variant="mono-date"
          tone="label"
          className="hover:text-floodlight"
        >
          {view.orEmail.label}
        </Text>
      </div>
      {/* The line shows where the visitor is looking; the region is in the page before it fills, so it is announced. */}
      <div role="status" className="empty:hidden">
        {mailto ? (
          <Text as="p" variant="mono-note" tone="label">
            {view.mailto.note}
          </Text>
        ) : null}
      </div>
      {mailto ? (
        <div className="flex flex-col items-start gap-3 max-md:items-stretch">
          <Button
            type="button"
            variant="outline"
            size="s"
            skew="desktop"
            onClick={() => void copyText(messageText(values, formatTitle()))}
          >
            {copyState === "copied" ? view.mailto.copied : view.mailto.copy}
          </Button>
          {copyState === "fallback" ? (
            <TextArea
              ref={copyField}
              label={view.mailto.copy}
              readOnly
              value={messageText(values, formatTitle())}
              onFocus={(e) => e.currentTarget.select()}
              className="w-full"
            />
          ) : null}
        </div>
      ) : null}
      <p id={statusId} role="status" className="sr-only">
        {sending ? view.sending : copyState === "copied" ? view.mailto.copied : ""}
      </p>
    </form>
  );
}
