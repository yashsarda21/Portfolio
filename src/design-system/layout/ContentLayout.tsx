import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface ContentLayoutProps {
  /** The top bar (a HUD). It brings its own gutters. On mobile it gets 16px above it. */
  header: ReactNode;
  /** The page title block (PageTitle). */
  title: ReactNode;
  /** The panels. Give them one root that fills the width; it grows to fill the height. */
  children: ReactNode;
  /** Bottom row (commentary left, next-venue button right); stacks on mobile. */
  footer?: ReactNode;
  /** Mobile main navigation (MobileTabBar). It is fixed; the page leaves room for it. */
  tabBar?: ReactNode;
  /** Decorative full-bleed layer behind the page (venue glows). */
  backdrop?: ReactNode;
  className?: string;
}

/**
 * The shared frame of a content page, on the artboards' 1440×900 grid: header 76 · title from y 100 ·
 * panels from y 236 (at least 554 tall) · footer 110 (22 above the 52px button, 36 below).
 * 768–1199 keeps the frame and lets the page scroll; below 768 it is a single column with 16px gutters.
 */
export function ContentLayout({
  header,
  title,
  children,
  footer,
  tabBar,
  backdrop,
  className,
}: ContentLayoutProps) {
  return (
    <div className={cn("relative isolate", className)}>
      {backdrop ? (
        <div aria-hidden="true" className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
          {backdrop}
        </div>
      ) : null}
      <div
        className={cn(
          "mx-auto flex min-h-dvh max-w-360 flex-col",
          // Clear the fixed tab bar: its 76px + 1px border + home-indicator inset, plus 16px of air.
          tabBar && "max-md:pb-[calc(93px+env(safe-area-inset-bottom))]",
        )}
      >
        <div className="max-md:pt-4">{header}</div>
        <div className="px-9 pt-6 max-md:px-4 max-md:pt-5 max-md:pb-11 md:min-h-40">{title}</div>
        <div className="flex flex-1 flex-col px-9 max-md:px-4 lg:min-h-138.5">{children}</div>
        {footer ? (
          <div className="flex items-end justify-between gap-4 px-9 pt-5.5 pb-9 max-md:flex-col max-md:items-stretch max-md:px-4 max-md:pt-4 max-md:pb-4">
            {footer}
          </div>
        ) : null}
      </div>
      {tabBar}
    </div>
  );
}
