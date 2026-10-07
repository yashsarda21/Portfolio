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
  /**
   * A showpiece beside the title and panels (the Player Card). With `stage` the title and panels become a
   * left column and the stage the centre one, so a title can sit above the panels while the stage rises
   * alongside both. On a tablet the stage takes the right column; on the phone it follows the title and
   * the panels come last. Give it one root; it sets its own top offset.
   */
  stage?: ReactNode;
  /** A third column to the right of the stage (the take-away actions). Below 1200px it runs under the rest. Needs `stage`. */
  rail?: ReactNode;
  /**
   * A column beside the title and panels (Team Up's direct lines). From 1200px it is the right-hand column, 64px
   * to the side (544px wide from 1440, 480px below), its top level with the panels' (y 236); the title and panels
   * share the column on its left. Below 1200px it follows the panels. Not with `stage`.
   */
  side?: ReactNode;
  /** Mobile main navigation (MobileTabBar). It is fixed; the page leaves room for it. */
  tabBar?: ReactNode;
  /** Decorative full-bleed layer behind the page (venue glows). */
  backdrop?: ReactNode;
  /** Id of the `<main>` landmark (the skip link targets it). */
  mainId?: string;
  className?: string;
}

/**
 * The shared frame of a content page, on the artboards' 1440×900 grid: header 76 · title from y 100 ·
 * panels from y 236 (at least 554 tall) · footer 110 (22 above the 52px button, 36 below).
 * 768–1199 keeps the frame and lets the page scroll; below 768 it is a single column with 16px gutters.
 * Without a footer the panels run to the 36px bottom gutter themselves (the Trophy Room artboard).
 * With a `stage` (and a `rail`) the body is a grid instead: title and panels (420px) | stage (the 402px card) | rail
 * (420px) from 1200px, 64px and 62px apart at 1440 as drawn, and the
 * title starts 10px lower (the Player-Card board). Landmarks: the header is the banner; the title, panels and
 * footer are the `<main>`; the tab bar follows it.
 */
export function ContentLayout({
  header,
  title,
  children,
  footer,
  stage,
  rail,
  side,
  tabBar,
  backdrop,
  mainId,
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
        <main id={mainId} className="flex flex-1 flex-col">
          {stage ? (
            <div
              className={cn(
                "flex flex-1 flex-col px-9 max-md:px-4 min-[1200px]:grid-cols-[minmax(0,26.25rem)_auto_minmax(0,26.25rem)] min-[1200px]:justify-between md:grid md:grid-rows-[auto_1fr_auto] md:max-[1199px]:grid-cols-[minmax(0,1fr)_auto]",
                !footer && "pb-9 max-md:pb-4",
              )}
            >
              {/* The Player-Card board starts its title 10px lower and sits the profile 22px under it. */}
              <div className="pt-6 pb-6 max-md:pt-5 max-md:pb-11 min-[1200px]:pt-8.5 min-[1200px]:pb-5.5 md:col-start-1 md:row-start-1 md:min-h-40">
                {title}
              </div>
              {/* Last on the phone (the card first), but second in the markup: the profile reads before the card. */}
              <div className="flex min-w-0 flex-col max-md:order-last md:col-start-1 md:row-start-2">
                {children}
              </div>
              {/* The stage's own side padding is the gap to its neighbours (the card tilts out into it): 24px beside the profile on a tablet, 32 and 40 at 1200, and 64 and 62 on the 1440 board. No min-w-0: the column never shrinks below the card. */}
              <div className="min-[1200px]:max-[1439px]:pr-10 min-[1200px]:max-[1439px]:pl-8 min-[1440px]:pr-15.5 min-[1440px]:pl-16 md:col-start-2 md:row-span-2 md:row-start-1 md:max-[1439px]:pl-6">
                {stage}
              </div>
              {rail ? (
                <div className="min-w-0 min-[1200px]:col-start-3 min-[1200px]:row-span-2 min-[1200px]:row-start-1 md:max-[1199px]:col-span-2 md:max-[1199px]:col-start-1 md:max-[1199px]:row-start-3">
                  {rail}
                </div>
              ) : null}
            </div>
          ) : side ? (
            <div
              className={cn(
                "flex flex-1 flex-col px-9 max-md:px-4 min-[1200px]:grid min-[1200px]:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] min-[1200px]:grid-rows-[auto_1fr] min-[1200px]:gap-x-16 min-[1440px]:grid-cols-[minmax(0,1fr)_34rem]",
                !footer && "pb-9 max-md:pb-4",
              )}
            >
              {/* The Team-Up board sits its form 22px under the title. */}
              <div className="pt-6 pb-6 max-md:pt-5 max-md:pb-11 min-[1200px]:col-start-1 min-[1200px]:row-start-1 min-[1200px]:pb-5.5 md:min-h-40">
                {title}
              </div>
              <div className="flex min-w-0 flex-col min-[1200px]:col-start-1 min-[1200px]:row-start-2">
                {children}
              </div>
              {/* 160px: the title's own minimum height, so the column starts where the panels do. */}
              <div className="min-w-0 pt-10 max-md:pt-8 min-[1200px]:col-start-2 min-[1200px]:row-span-2 min-[1200px]:row-start-1 min-[1200px]:pt-40">
                {side}
              </div>
            </div>
          ) : (
            <>
              <div className="px-9 pt-6 pb-6 max-md:px-4 max-md:pt-5 max-md:pb-11 md:min-h-40">
                {title}
              </div>
              <div
                className={cn(
                  "flex flex-1 flex-col px-9 max-md:px-4 lg:min-h-138.5",
                  // No footer to own the bottom gutter: the panels end 36px above the page edge (16px on the phone).
                  !footer && "pb-9 max-md:pb-4",
                )}
              >
                {children}
              </div>
            </>
          )}
          {footer ? (
            <div className="flex items-end justify-between gap-4 px-9 pt-5.5 pb-9 max-md:flex-col max-md:items-stretch max-md:px-4 max-md:pt-4 max-md:pb-4">
              {footer}
            </div>
          ) : null}
        </main>
      </div>
      {tabBar}
    </div>
  );
}
