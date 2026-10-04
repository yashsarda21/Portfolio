import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type HorizontalScrollerProps = {
  /** Accessible name for the scrollable list. */
  label: string;
  /** `<li className="shrink-0 snap-start">` items, written by the consumer. */
  children: ReactNode;
  className?: string;
  /** Merged onto the `<ul>` (e.g. turn the row into a grid on desktop). */
  listClassName?: string;
  /** Merged onto the right-edge fade (e.g. hide it on desktop). */
  fadeClassName?: string;
};

/** A snap-scrolling row with a keyboard-focusable list and a fade hinting at more to the right. */
export function HorizontalScroller({
  label,
  children,
  className,
  listClassName,
  fadeClassName,
}: HorizontalScrollerProps) {
  return (
    <div className={cn("relative", className)}>
      {/* A scroll container must take focus so keyboard users can scroll it (axe: scrollable-region-focusable).
          On wide screens a consumer may turn it into a grid that doesn't scroll; it stays one harmless tab stop. */}
      {/* Tailwind's `list-style: none` makes Safari/VoiceOver drop the list role, which names this region. */}
      {/* eslint-disable-next-line jsx-a11y/no-redundant-roles */}
      <ul
        role="list"
        aria-label={label}
        // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
        tabIndex={0}
        className={cn(
          "scrollbar-none flex snap-x snap-mandatory gap-2.5 overflow-x-auto focus-visible:outline-offset-2",
          listClassName,
        )}
      >
        {children}
      </ul>
      <div
        aria-hidden="true"
        className={cn(
          "pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-ground to-ground/0",
          fadeClassName,
        )}
      />
    </div>
  );
}
