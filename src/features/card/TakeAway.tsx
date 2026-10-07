import { useEffect, useId, useRef } from "react";
import { ActionRow, Text, TextField, type IconName } from "@/design-system";
import type { CardView } from "./view";
import type { useCopyLink } from "./useCopyLink";

const ICON: Record<CardView["take"]["actions"][number]["kind"], IconName> = {
  "pdf-view": "arrow-right",
  "pdf-download": "download",
  request: "mail",
};

/**
 * "Take the card with you": the resume rows (a request by email until a PDF is public), the copy-link row
 * with its feedback, and a note on what the back of the card holds.
 * The copy row's feedback is a visible line plus a separate polite status for screen readers: a live region
 * inside a button is not reliably announced.
 */
export function TakeAway({
  take,
  note,
  link,
}: {
  take: CardView["take"];
  note: CardView["backNote"];
  link: ReturnType<typeof useCopyLink>;
}) {
  const labelId = useId();
  const hintId = useId();
  const field = useRef<HTMLInputElement>(null);
  const showFallback = link.state === "fallback";
  useEffect(() => {
    // The clipboard refused: hand the visitor the link, selected, ready for Ctrl/Cmd+C.
    if (showFallback) {
      field.current?.focus();
      field.current?.select();
    }
  }, [showFallback]);

  return (
    <section aria-labelledby={labelId} className="flex flex-col gap-3">
      <Text id={labelId} variant="mono-label" tone="label" leading="font">
        {take.label}
      </Text>
      {take.actions.map((action, i) => (
        <ActionRow
          key={action.kind}
          href={action.href}
          tone={i === 0 ? "primary" : "glass"}
          title={action.title}
          sub={action.sub}
          icon={ICON[action.kind]}
          {...(action.newTab
            ? { target: "_blank", rel: "noopener", "aria-describedby": hintId }
            : {})}
          {...(action.download ? { download: action.download } : {})}
        />
      ))}
      <span id={hintId} hidden>
        {take.newTabHint}
      </span>
      <ActionRow
        as="button"
        type="button"
        tone="glass"
        title={take.copy.title}
        sub={take.copy.sub}
        icon="copy"
        status={
          link.state === "copied" ? <span aria-hidden="true">{take.copy.done}</span> : undefined
        }
        onClick={() => void link.copy()}
      />
      <p role="status" className="sr-only">
        {link.state === "copied"
          ? take.copy.announce
          : link.state === "fallback"
            ? take.copy.fallback
            : ""}
      </p>
      {showFallback ? (
        <TextField
          ref={field}
          label={take.copy.fallback}
          readOnly
          value={take.copy.url}
          onFocus={(e) => e.currentTarget.select()}
        />
      ) : null}
      <div className="mt-3.5 flex flex-col gap-2 border-t border-line pt-4">
        <Text variant="mono-label" tone="label" leading="font">
          {note.label}
        </Text>
        <Text as="p" variant="body-note" tone="secondary">
          {note.text}
        </Text>
        <Text variant="mono-note" tone="dim">
          {note.meta}
        </Text>
      </div>
    </section>
  );
}
