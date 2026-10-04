import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

/** lg stands the cup, medal and plaque (26px); md the pennant and the round (22px). Both draw a 1px lit top edge. */
const SIZE = { lg: "h-6.5", md: "h-5.5" } as const;

type PlinthProps = { size: keyof typeof SIZE } & Omit<ComponentPropsWithRef<"span">, "children">;

/**
 * The block a trophy stands on: 90px wide, a dark plinth with a 1px lit top edge. Content-box on purpose:
 * the artboard sets its height (26 / 22) on top of that 1px border. Decorative.
 */
export function Plinth({ size, className, ...rest }: PlinthProps) {
  return (
    <span
      aria-hidden="true"
      data-plinth=""
      className={cn(
        "box-content block w-22.5 border-t border-line-strong bg-plinth",
        SIZE[size],
        className,
      )}
      {...rest}
    />
  );
}
