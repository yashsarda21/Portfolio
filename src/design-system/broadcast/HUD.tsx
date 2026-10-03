import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type HUDProps = { left?: ReactNode; center?: ReactNode; right?: ReactNode; fade?: boolean } & Omit<
  ComponentPropsWithRef<"header">,
  "children"
>;

/** The 76px top bar: brand left, score bug centre, controls right. Screens position it. */
export function HUD({ left, center, right, fade = false, className, ...rest }: HUDProps) {
  return (
    <header
      className={cn(
        "grid h-19 grid-cols-[1fr_auto_1fr] items-center gap-4 px-(--gutter)",
        fade && "bg-linear-180 from-ground-a85 to-transparent",
        className,
      )}
      {...rest}
    >
      <div className="flex min-w-0 items-center">{left}</div>
      <div className="flex items-center">{center}</div>
      <div className="flex items-center justify-end gap-2.5">{right}</div>
    </header>
  );
}
