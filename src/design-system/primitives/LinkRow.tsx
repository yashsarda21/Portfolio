import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";

type LinkRowOwnProps = {
  /** Trailing mark (arrow, ↗). Decorative: hidden from assistive tech. */
  glyph?: ReactNode;
};

/** A full-width link row (ink on a volt band) with a hairline divider; children are the label. */
export function LinkRow<T extends ElementType = "a">({
  as,
  glyph,
  className,
  children,
  ...rest
}: PolymorphicProps<T, LinkRowOwnProps>) {
  const Comp: ElementType = as ?? "a";
  return (
    <Comp
      {...rest}
      className={cn(
        // min-h: 56px plus the 1px divider (the artboard's borders are content-box); the last row has none.
        "flex min-h-14.25 items-center justify-between gap-4 border-b border-ink-a25 type-body-lg text-volt-ink last:min-h-14 last:border-b-0 focus-visible:outline-volt-ink",
        "font-semibold",
        className,
      )}
    >
      {children}
      <span aria-hidden="true">{glyph}</span>
    </Comp>
  );
}
