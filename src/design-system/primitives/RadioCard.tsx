import { useId, type ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

type RadioCardProps = {
  title: string;
  description?: string;
} & Omit<ComponentPropsWithRef<"input">, "type">;

/**
 * A native radio dressed as a selectable card (Team Up formats). The focus ring is drawn on the card. The title is
 * the 22px / 900 / .06em display face (the monogram's recipe); the description sits on the font's own line box.
 */
export function RadioCard({
  title,
  description,
  className,
  "aria-describedby": callerDescribedBy,
  ...rest
}: RadioCardProps) {
  const titleId = useId();
  const descriptionId = useId();
  const describedBy =
    [callerDescribedBy, description ? descriptionId : undefined].filter(Boolean).join(" ") ||
    undefined;
  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col gap-1.5 border border-line-strong p-4 transition-colors duration-(--dur-snap) ease-snap hover:border-line-hover has-checked:border-volt has-checked:bg-volt-a07 has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-volt has-focus-visible:outline-solid has-disabled:cursor-default has-disabled:opacity-40",
        className,
      )}
    >
      <span className="flex items-center gap-2.5">
        <input
          type="radio"
          aria-labelledby={titleId}
          aria-describedby={describedBy}
          // Light scheme: the unchosen disc is the white one the artboard draws, the chosen one is volt.
          className="size-4.5 accent-volt scheme-light focus-visible:outline-none"
          {...rest}
        />
        <span id={titleId} className="type-monogram text-floodlight">
          {title}
        </span>
      </span>
      {description ? (
        <span id={descriptionId} className="type-caption leading-auto text-text-2">
          {description}
        </span>
      ) : null}
    </label>
  );
}
