import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/cn";
import { Glass } from "../primitives/Glass";

/** The match record in the Hub's top row: "YOUR RECORD  YASH 1 · YOU 0". A read-out, not a control. */
export function RecordChip({
  label,
  value,
  className,
  ...rest
}: { label: string; value: string } & Omit<ComponentPropsWithoutRef<"p">, "children">) {
  return (
    <Glass
      as="p"
      className={cn(
        "inline-flex h-11 items-center gap-2 px-3.5 type-mono-nav text-scout",
        className,
      )}
      {...rest}
    >
      <span>{label}</span>
      <span className="text-floodlight">{value}</span>
    </Glass>
  );
}
