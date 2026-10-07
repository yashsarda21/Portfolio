import { cva } from "class-variance-authority";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { useCountUp } from "./useCountUp";

/** Split a stat into prefix / number / suffix. Numeric values only: "JUL 2024" is a date, so don't pass countUp. */
export function parseStat(value: string) {
  const m = /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(value);
  if (!m) return null;
  const num = m[2]!;
  return {
    prefix: m[1]!,
    number: Number(num),
    decimals: num.includes(".") ? num.split(".")[1]!.length : 0,
    suffix: m[3]!,
  };
}

const tile = cva("flex", {
  variants: {
    tone: {
      // On the phone, tiles share a full-width row (the page title's aside) and the values step down a size.
      glass:
        "glass flex-col gap-0.5 w-52 px-4.5 py-3.5 max-md:w-auto max-md:min-w-0 max-md:flex-1 max-md:px-3",
      volt: "flex-col gap-0.5 w-51.5 bg-volt px-4.5 py-3.5 max-md:w-auto max-md:min-w-0 max-md:flex-1 max-md:px-3",
      // A cell of the card's stat grid: label left, value right on one baseline, as drawn. The gap is the
      // least air between them: the 11px label is wider than the drawn 10px, so a full cell ("PROBLEMS 750+")
      // spills the 6px into the cell's own padding instead of letting the two touch. Neither part wraps.
      // On the phone the card is narrower than drawn: the label sits over the value instead.
      cell: "flex-col items-start gap-0.5 bg-inset p-2.5 md:flex-row md:items-baseline md:justify-between md:gap-1.5",
    },
  },
  defaultVariants: { tone: "glass" },
});
const LABEL = {
  glass: "type-mono-round text-scout",
  volt: "type-mono-round text-volt-ink-2",
  cell: "type-mono-note whitespace-nowrap text-scout",
} as const;
const VALUE = {
  glass: "type-stat text-floodlight max-md:type-d4s",
  volt: "type-stat text-volt-ink max-md:type-d4s",
  cell: "type-title-sm leading-auto whitespace-nowrap text-floodlight",
} as const;

interface StatTileProps {
  label: string;
  value: string;
  tone?: "glass" | "volt" | "cell";
  countUp?: boolean;
  /** cell tone: paint the value volt (the card's headline stats). */
  accent?: boolean;
  className?: string;
}

/** A labelled stat. With countUp, digits tick up on scroll-in; screen readers always get the final value. */
export function StatTile({
  label,
  value,
  tone = "glass",
  countUp = false,
  accent = false,
  className,
}: StatTileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const parsed = parseStat(value);
  const shown = useCountUp(
    parsed?.number ?? 0,
    parsed?.decimals ?? 0,
    countUp && parsed !== null,
    ref,
  );
  const display = parsed && countUp ? `${parsed.prefix}${shown}${parsed.suffix}` : value;
  return (
    <div ref={ref} className={cn(tile({ tone }), className)}>
      <span className={LABEL[tone]}>{label}</span>
      <span className={cn(VALUE[tone], accent && "text-volt", "tabular-nums")}>
        <span className="sr-only">{value}</span>
        <span aria-hidden="true">{display}</span>
      </span>
    </div>
  );
}
