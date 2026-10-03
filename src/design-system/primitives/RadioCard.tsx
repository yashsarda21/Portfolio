import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

type RadioCardProps = {
  title: string;
  description?: string;
} & Omit<ComponentPropsWithRef<"input">, "type">;

/** A native radio dressed as a selectable card (Team Up formats). The focus ring is drawn on the card. */
export function RadioCard({ title, description, className, ...rest }: RadioCardProps) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col gap-1.5 border border-line-strong p-4 transition-colors duration-(--dur-snap) ease-snap hover:border-line-hover has-checked:border-volt has-checked:bg-volt-a08 has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-volt has-focus-visible:outline-solid",
        className,
      )}
    >
      <span className="flex items-center gap-2.5">
        <input type="radio" className="size-4.5 accent-volt focus-visible:outline-none" {...rest} />
        <span className="type-d4s text-floodlight">{title}</span>
      </span>
      {description ? <span className="type-caption text-text-2">{description}</span> : null}
    </label>
  );
}
