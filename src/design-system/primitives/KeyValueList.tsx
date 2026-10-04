import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface KeyValueItem {
  k: ReactNode;
  v: ReactNode;
  accent?: boolean;
}

interface KeyValueListProps {
  items: KeyValueItem[];
  variant?: "row" | "stacked";
  className?: string;
}

export function KeyValueList({ items, variant = "row", className }: KeyValueListProps) {
  return (
    <dl className={cn("flex flex-col", variant === "stacked" && "gap-3", className)}>
      {items.map((item, i) =>
        variant === "row" ? (
          <div
            key={i}
            className="flex items-baseline justify-between gap-4 border-t border-line py-3"
          >
            <dt className="type-body-md text-scout">{item.k}</dt>
            <dd
              className={cn(
                "text-right type-body-md",
                item.accent ? "text-volt" : "text-floodlight",
              )}
            >
              {item.v}
            </dd>
          </div>
        ) : (
          <div key={i} className="flex flex-col gap-0.75 border-b border-line pb-2.5">
            <dt className="type-mono-xs leading-auto text-scout">{item.k}</dt>
            <dd
              className={cn(
                "type-body-sm leading-auto",
                item.accent ? "text-volt" : "text-floodlight",
              )}
            >
              {item.v}
            </dd>
          </div>
        ),
      )}
    </dl>
  );
}
