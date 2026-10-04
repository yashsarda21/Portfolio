import { cva } from "class-variance-authority";
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";

// Every class is written out in full so Tailwind generates it (never build class names).
const linkRowVariants = cva("flex items-center justify-between gap-4", {
  variants: {
    tone: {
      // Ink on a volt band. min-h: 56px plus the 1px divider (the artboard's borders are content-box); the last row has none.
      band: "min-h-14.25 border-b border-ink-a25 type-body-lg font-semibold text-volt-ink last:min-h-14 last:border-b-0 focus-visible:outline-volt-ink",
      // Bordered row on glass: 46px content-box + 1px borders = 48px.
      outline:
        "box-content h-11.5 border border-line-strong px-3.5 type-mono-nav text-floodlight hover:border-volt",
      // Volt fill, same size as outline; the default volt ring sits outside it.
      primary: "box-content h-11.5 bg-volt px-3.5 type-mono-nav font-bold text-volt-ink",
    },
  },
  defaultVariants: { tone: "band" },
});

export type LinkRowTone = "band" | "outline" | "primary";

type LinkRowOwnProps = {
  /** Trailing mark (arrow, ↗). Decorative: hidden from assistive tech. */
  glyph?: ReactNode;
  /** band: ink on a volt band (default) · outline: bordered row on a panel · primary: volt fill. */
  tone?: LinkRowTone;
};

/** A full-width link row; children are the label. */
export function LinkRow<T extends ElementType = "a">({
  as,
  glyph,
  tone,
  className,
  children,
  ...rest
}: PolymorphicProps<T, LinkRowOwnProps>) {
  const Comp: ElementType = as ?? "a";
  return (
    <Comp {...rest} className={cn(linkRowVariants({ tone }), className)}>
      {children}
      <span aria-hidden="true">{glyph}</span>
    </Comp>
  );
}
