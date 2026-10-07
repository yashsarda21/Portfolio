import { useId } from "react";
import { ActionRow, Text, TextField, type IconName } from "@/design-system";
import type { useCopyText } from "@/lib/useCopyText";
import type { CardView } from "./view";

const ICON: Record<CardView["take"]["actions"][number]["kind"], IconName> = {
  "pdf-view": "arrow-right",
  "pdf-download": "download",
  request: "mail",
};

/**
 * "Take the card with you": the resume rows (a request by email until a PDF is public), the copy-link row
 * with its feedback, and a note on what the back of the card holds.
 * The copy row's feedback is a visible line (hidden from screen readers) plus a separate polite status that
 * announces "copied": a live region inside a button is not reliably announced. When the clipboard refuses,
 * the focus move to the selected field is the announcement (its label says what to do), so the status stays quiet.
 */
export function TakeAway({
  take,
  note,
  link,
}: {
  take: CardView["take"];
  note: CardView["backNote"];
  link: ReturnType<typeof useCopyText<HTMLInputElement>>;
}) {
  const { state: linkState, copy: copyLink, field: linkField } = link;
  const labelId = useId();
  const hintId = useId();

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
          linkState === "copied" ? <span aria-hidden="true">{take.copy.done}</span> : undefined
        }
        onClick={() => void copyLink(take.copy.url)}
      />
      <p role="status" className="sr-only">
        {linkState === "copied" ? take.copy.announce : ""}
      </p>
      {linkState === "fallback" ? (
        <TextField
          ref={linkField}
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
        <Text as="p" variant="body-cell" tone="secondary">
          {note.text}
        </Text>
        <Text variant="mono-note" tone="dim">
          {note.meta}
        </Text>
      </div>
    </section>
  );
}
