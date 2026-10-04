import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";

type LinkRowOwnProps = {
  /** Trailing mark (arrow, ↗). Decorative: hidden from assistive tech. */
  glyph?: ReactNode;
  /** `volt` = ink-on-volt, for rows sitting on the volt band. */
  tone?: "volt";
};

/** A full-width link row with a hairline divider; children are the label. */
export function LinkRow<T extends ElementType = "a">({
  as,
  glyph,
  // Only one tone for now; kept so Phase 2 can add the on-dark highlight row without an API change.
  tone: _tone = "volt",
  className,
  children,
  ...rest
}: PolymorphicProps<T, LinkRowOwnProps>) {
  const Comp: ElementType = as ?? "a";
  return (
    <Comp
      {...rest}
      className={cn(
        "flex min-h-14 items-center justify-between gap-4 border-b border-ink-a25 type-body-lg text-volt-ink last:border-b-0 focus-visible:outline-volt-ink",
        "font-semibold",
        className,
      )}
    >
      {children}
      <span aria-hidden="true">{glyph}</span>
    </Comp>
  );
}
