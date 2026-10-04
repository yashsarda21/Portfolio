import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

type StickyBottomActionsProps = {
  /** Accessible name for the nav landmark. */
  label: string;
  children: ReactNode;
  className?: string;
};

/** Mobile-only action bar pinned to the bottom edge, clear of the iOS home indicator (A9). */
export function StickyBottomActions({ label, children, className }: StickyBottomActionsProps) {
  return (
    <nav
      aria-label={label}
      // base.css reads this to keep focused elements clear of the bar (scroll-padding-bottom).
      data-bottom-actions=""
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2.5 bg-linear-to-b from-ground/0 to-ground to-30% px-4 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] md:hidden",
        className,
      )}
    >
      {children}
    </nav>
  );
}
