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
    <dl className={cn("flex flex-col", className)}>
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
          <div key={i} className="flex flex-col gap-1 border-b border-line pt-3 pb-3 first:pt-0">
            <dt className="type-mono-label text-scout">{item.k}</dt>
            <dd className={cn("type-body-sm", item.accent ? "text-volt" : "text-floodlight")}>
              {item.v}
            </dd>
          </div>
        ),
      )}
    </dl>
  );
}
