import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

/**
 * The glass in front of the cabinet: a faint 115-degree reflection over everything behind it. It sits above
 * the shelves (z-3) and never takes the pointer. Place it inside the cabinet's `relative` box. Decorative.
 */
export function CabinetGlass({
  className,
  ...rest
}: Omit<ComponentPropsWithRef<"div">, "children">) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute inset-0 z-3 scene-glass-reflection", className)}
      {...rest}
    />
  );
}
