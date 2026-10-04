import { cva } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

const shelfLight = cva("pointer-events-none h-1.5 scene-shelf-light", {
  variants: {
    placement: {
      // Over the cabinet, `top` set by the caller.
      absolute: "absolute inset-x-6",
      // A row of the shelf grid, between two shelves: 2px up into the shelf above, 8px of air below.
      row: "col-span-full mx-6 -mt-0.5 mb-2",
    },
  },
  defaultVariants: { placement: "absolute" },
});

type ShelfLightProps = {
  /** absolute: placed with `top` over the cabinet (default) · row: a full-width grid item between two shelves. */
  placement?: "absolute" | "row";
} & Omit<ComponentPropsWithRef<"div">, "children">;

/**
 * The light bar under a shelf: 6px tall, with a soft glow, inset 24px each side. Either placed over the cabinet
 * (`absolute`, set its `top` with className) or drawn as a row of the shelf grid, so it follows the shelf above it
 * however tall that grows. Decorative.
 */
export function ShelfLight({ placement, className, ...rest }: ShelfLightProps) {
  return <div aria-hidden="true" className={cn(shelfLight({ placement }), className)} {...rest} />;
}
