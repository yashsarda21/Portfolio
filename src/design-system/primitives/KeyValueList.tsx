import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface KeyValueItem {
  k: ReactNode;
  v: ReactNode;
  accent?: boolean;
  /** "profile" variant only: the label sits over a mono value (a run of tools) instead of beside a plain one. */
  stacked?: boolean;
}

interface KeyValueListProps {
  items: KeyValueItem[];
  /**
   * "row": ruled rows, label left and value right. "stacked": mono labels over values, ruled below.
   * "profile": a compact spec sheet under one rule (Badminton-Attributes): 14px rows, label left and value
   * right, and an item marked `stacked` shows its mono value under the label.
   */
  variant?: "row" | "stacked" | "profile";
  className?: string;
}

export function KeyValueList({ items, variant = "row", className }: KeyValueListProps) {
  return (
    <dl
      className={cn(
        "flex flex-col",
        variant === "stacked" && "gap-3",
        variant === "profile" && "gap-2.5 border-t border-line pt-3.5",
        className,
      )}
    >
      {items.map((item, i) =>
        variant === "profile" ? (
          <div
            key={i}
            className={cn(
              "flex gap-x-4",
              item.stacked ? "flex-col gap-y-1.5" : "items-baseline justify-between",
            )}
          >
            <dt className="type-body-sm leading-auto text-scout">{item.k}</dt>
            <dd
              className={cn(
                item.stacked ? "type-mono-run" : "text-right type-body-sm leading-auto",
                item.accent ? "text-volt" : "text-floodlight",
              )}
            >
              {item.v}
            </dd>
          </div>
        ) : variant === "row" ? (
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
