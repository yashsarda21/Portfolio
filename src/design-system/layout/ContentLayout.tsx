import { cva } from "class-variance-authority";
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

/**
 * The columns of a page that has more than the title and panels. One shape at a time:
 *  - `showcase`: a showpiece (the Player Card) beside the title and panels, with an optional `rail` of actions to
 *    its right and a `caption` hung under it.
 *  - `split`: a `side` column beside the title and panels (Team Up's direct lines).
 */
export type ContentColumns =
  | {
      kind: "showcase";
      /** The showpiece. Give it one root; the layout sets its top offset and the gaps around it. */
      stage: ReactNode;
      /** A line hung under the stage: past the page's own foot on the board, in the flow below 1200px. */
      caption?: ReactNode;
      /** A third column to the right of the stage (the take-away actions). Below 1200px it runs under the rest. */
      rail?: ReactNode;
    }
  | {
      kind: "split";
      /** A column beside the title and panels. From 1200px it is the right-hand column, its top level with the panels. */
      side: ReactNode;
    };

interface ContentLayoutProps {
  /** The top bar (a HUD). It brings its own gutters. On mobile it gets 16px above it. */
  header: ReactNode;
  /** The page title block (PageTitle). */
  title: ReactNode;
  /** The panels. Give them one root that fills the width; it grows to fill the height. */
  children: ReactNode;
  /** Bottom row (commentary left, next-venue button right); stacks on mobile. */
  footer?: ReactNode;
  /** More than one column: see ContentColumns. Leave out for the single-column content page. */
  columns?: ContentColumns;
  /** Mobile main navigation (MobileTabBar). It is fixed; the page leaves room for it. */
  tabBar?: ReactNode;
  /** Decorative full-bleed layer behind the page (venue glows). */
  backdrop?: ReactNode;
  /** Id of the `<main>` landmark (the skip link targets it). */
  mainId?: string;
  className?: string;
}

type Kind = "flat" | ContentColumns["kind"];

// Every class is written out in full so Tailwind generates it (never build class names). The title, panels and body
// are the same three boxes whatever the columns; only their grid placement changes with the kind.
const bodyVariants = cva("flex flex-1 flex-col px-9 max-md:px-4", {
  variants: {
    kind: {
      flat: "",
      // One grid from the tablet up: title and panels (420px) | stage (the 402px card) | rail (420px) at 1200.
      showcase:
        "md:grid md:grid-rows-[auto_1fr_auto] md:max-lg:grid-cols-[minmax(0,1fr)_auto] lg:grid-cols-[minmax(0,26.25rem)_auto_minmax(0,26.25rem)] lg:justify-between",
      // Two columns from 1200: the title and panels, then the side (480px, 544px from 1440), 64px apart.
      split:
        "lg:grid lg:grid-cols-[minmax(0,1fr)_minmax(0,30rem)] lg:grid-rows-[auto_1fr] lg:gap-x-16 xl:grid-cols-[minmax(0,1fr)_34rem]",
    },
    footer: { true: "", false: "" },
  },
  compoundVariants: [
    // No footer to own the bottom gutter: the columns end 36px above the page edge (16px on the phone).
    { kind: ["showcase", "split"], footer: false, className: "pb-9 max-md:pb-4" },
  ],
});

const titleVariants = cva("pt-6 pb-6 max-md:pt-5 max-md:pb-11 md:min-h-40", {
  variants: {
    kind: {
      flat: "",
      // The Player-Card board starts its title 10px lower and sits the profile 22px under it.
      showcase: "md:col-start-1 md:row-start-1 lg:pt-8.5 lg:pb-5.5",
      // The Team-Up board sits its form 22px under the title.
      split: "lg:col-start-1 lg:row-start-1 lg:pb-5.5",
    },
  },
});

const panelsVariants = cva("flex flex-col", {
  variants: {
    kind: {
      // At least 554 tall on the board; the panels own the bottom gutter when there is no footer.
      flat: "flex-1 lg:min-h-138.5",
      // Last on the phone (the showpiece first), but second in the markup: the profile reads before the card.
      showcase: "min-w-0 max-md:order-last md:col-start-1 md:row-start-2",
      split: "min-w-0 lg:col-start-1 lg:row-start-2",
    },
    footer: { true: "", false: "" },
  },
  compoundVariants: [{ kind: "flat", footer: false, className: "pb-9 max-md:pb-4" }],
});

/**
 * The shared frame of a content page, on the artboards' 1440×900 grid: header 76 · title from y 100 ·
 * panels from y 236 (at least 554 tall) · footer 110 (22 above the 52px button, 36 below).
 * 768–1199 keeps the frame and lets the page scroll; below 768 it is a single column with 16px gutters.
 * Without a footer the panels run to the 36px bottom gutter themselves (the Trophy Room artboard).
 * With `columns` the body is a grid instead (see ContentColumns); the offsets of every column live here, so a page
 * passes plain nodes. Landmarks: the header is the banner; the title, panels and footer are the `<main>`; the tab bar
 * follows it.
 */
export function ContentLayout({
  header,
  title,
  children,
  footer,
  columns,
  tabBar,
  backdrop,
  mainId,
  className,
}: ContentLayoutProps) {
  const kind: Kind = columns?.kind ?? "flat";
  const hasFooter = Boolean(footer);
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
          <div className={bodyVariants({ kind, footer: hasFooter })}>
            <div className={titleVariants({ kind })}>{title}</div>
            <div className={panelsVariants({ kind, footer: hasFooter })}>{children}</div>
            {columns?.kind === "showcase" ? (
              <>
                {/* The stage's own side padding is the gap to its neighbours (the card tilts out into it): 24px beside the profile on a tablet, 32 and 40 at 1200, and 64 and 62 on the 1440 board. No min-w-0: the column never shrinks below the card. */}
                <div className="md:col-start-2 md:row-span-2 md:row-start-1 md:max-lg:pl-6 lg:max-xl:pr-10 lg:max-xl:pl-8 xl:pr-15.5 xl:pl-16">
                  <div className="flex flex-col items-center lg:relative lg:pt-11">
                    {columns.stage}
                    {columns.caption ? (
                      <div className="mt-5.5 lg:absolute lg:inset-x-0 lg:top-full">
                        {columns.caption}
                      </div>
                    ) : null}
                  </div>
                </div>
                {columns.rail ? (
                  <div className="min-w-0 pt-8 md:max-lg:col-span-2 md:max-lg:col-start-1 md:max-lg:row-start-3 lg:col-start-3 lg:row-span-2 lg:row-start-1 lg:pt-40">
                    {columns.rail}
                  </div>
                ) : null}
              </>
            ) : null}
            {columns?.kind === "split" ? (
              // 160px (pt-40): the title's own minimum height, so the column starts where the panels do.
              <div className="min-w-0 pt-10 max-md:pt-8 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:pt-40">
                {columns.side}
              </div>
            ) : null}
          </div>
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
