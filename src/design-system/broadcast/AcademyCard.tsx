import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { Heading, Text } from "../primitives/Text";

type AcademyCardProps = {
  /** Mono label top left, in volt ("EDUCATION"). */
  eyebrow: ReactNode;
  /** Mono note top right ("WHERE THE FUNDAMENTALS CAME FROM"). */
  aside: ReactNode;
  /** The card's heading ("TRAINING ACADEMY"). */
  title: ReactNode;
  /** The school's short name in the box ("PICT"). Decorative: `name` already says it. */
  monogram: string;
  name: string;
  degree: string;
  /** One mono line: dates, grade, honours. */
  meta: string;
  /** The label over the extras ("EXTRA DRILLS"). */
  extrasLabel: string;
  /** Other qualifications, drawn as one flowing line separated by dots. None: no block. */
  extras: readonly string[];
  /** For a link target (`#academy`). */
  id?: string;
  /** The heading's level in the page's outline. Default 2. */
  headingLevel?: 2 | 3 | 4;
} & Omit<ComponentPropsWithRef<"section">, "children" | "title" | "id" | "aria-labelledby">;

/**
 * The education card (Trophy-Room "Training Academy"): a named section with a school block and an extras
 * list. It takes every word as a prop, so it knows no content.
 */
export function AcademyCard({
  eyebrow,
  aside,
  title,
  monogram,
  name,
  degree,
  meta,
  extrasLabel,
  extras,
  id,
  headingLevel = 2,
  className,
  ...rest
}: AcademyCardProps) {
  const uid = useId();
  const headingId = `${uid}-title`;
  const extrasId = `${uid}-extras`;
  return (
    <section
      id={id}
      aria-labelledby={headingId}
      className={cn(
        "flex scroll-mt-24 flex-col gap-3 border border-line bg-linear-160 from-panel to-stand-3 px-5.5 py-5",
        className,
      )}
      {...rest}
    >
      <div className="flex items-baseline justify-between gap-x-4">
        <Text variant="mono-label" tone="volt" leading="font">
          {eyebrow}
        </Text>
        <Text variant="mono-note" tone="label" className="text-right">
          {aside}
        </Text>
      </div>
      <Heading level={headingLevel} id={headingId} variant="title-panel">
        {title}
      </Heading>
      {/* The monogram box is content-box, 72px plus its 1px border, in a 72px column: as the artboard draws it. */}
      <div className="grid grid-cols-[72px_minmax(0,1fr)] items-center gap-3.5 border-t border-line pt-3">
        <span
          aria-hidden="true"
          className="box-content flex size-18 items-center justify-center border border-line-strong"
        >
          <Text variant="monogram" tone="volt">
            {monogram}
          </Text>
        </span>
        <div className="flex min-w-0 flex-col gap-1">
          <Text variant="name">{name}</Text>
          <Text variant="body-sm" tone="secondary" leading="font">
            {degree}
          </Text>
          <Text variant="mono-stack" tone="label">
            {meta}
          </Text>
        </div>
      </div>
      {extras.length > 0 ? (
        <div className="flex flex-col gap-1.5 border-t border-line pt-3">
          <Text id={extrasId} variant="mono-label" tone="label" leading="font">
            {extrasLabel}
          </Text>
          <Text
            as="ul"
            role="list"
            aria-labelledby={extrasId}
            variant="body-sm"
            tone="body"
            leading="font"
          >
            {extras.map((item, i) => (
              <li key={item} className="inline">
                {i > 0 ? <span aria-hidden="true"> · </span> : null}
                {item}
              </li>
            ))}
          </Text>
        </div>
      ) : null}
    </section>
  );
}
