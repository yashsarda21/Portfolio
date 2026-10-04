import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

/**
 * The light bar under a shelf: 6px tall, with a soft glow. It spans the cabinet minus a 24px gutter each
 * side; set its `top` with className. Decorative.
 */
export function ShelfLight({ className, ...rest }: Omit<ComponentPropsWithRef<"div">, "children">) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-x-6 h-1.5 scene-shelf-light", className)}
      {...rest}
    />
  );
}
