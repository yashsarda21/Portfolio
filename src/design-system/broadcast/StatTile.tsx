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

const tile = cva("flex flex-col gap-0.5", {
  variants: {
    tone: {
      // On the phone, tiles share a full-width row (the page title's aside) and the values step down a size.
      glass: "glass w-52 px-4.5 py-3.5 max-md:w-auto max-md:min-w-0 max-md:flex-1 max-md:px-3",
      volt: "w-51.5 bg-volt px-4.5 py-3.5 max-md:w-auto max-md:min-w-0 max-md:flex-1 max-md:px-3",
      cell: "bg-inset p-2.5",
    },
  },
  defaultVariants: { tone: "glass" },
});
const LABEL = {
  glass: "type-mono-round text-scout",
  volt: "type-mono-round text-volt-ink-2",
  cell: "type-mono-xs text-scout",
} as const;
const VALUE = {
  glass: "type-stat text-floodlight max-md:type-d4s",
  volt: "type-stat text-volt-ink max-md:type-d4s",
  cell: "type-d4s text-floodlight",
} as const;

interface StatTileProps {
  label: string;
  value: string;
  tone?: "glass" | "volt" | "cell";
  countUp?: boolean;
  className?: string;
}

/** A labelled stat. With countUp, digits tick up on scroll-in; screen readers always get the final value. */
export function StatTile({
  label,
  value,
  tone = "glass",
  countUp = false,
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
      <span className={cn(VALUE[tone], "tabular-nums")}>
        <span className="sr-only">{value}</span>
        <span aria-hidden="true">{display}</span>
      </span>
    </div>
  );
}
