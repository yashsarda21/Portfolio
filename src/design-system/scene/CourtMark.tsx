import type { CSSProperties, ReactNode } from "react";
import { cn } from "@/lib/cn";
import { GAME_COURT_VIEW } from "./GameBackdrop";

type Venue = keyof typeof GAME_COURT_VIEW;

/** The crop as numbers: where it starts in the stage's design space and how big it is. */
const crop = (venue: Venue) => {
  const [x, y, w, h] = GAME_COURT_VIEW[venue].split(/\s+/).map(Number) as [
    number,
    number,
    number,
    number,
  ];
  return { x, y, w, h };
};

/**
 * The box the column's court fills (the backdrop draws the court sliced into this same box, `xMidYMin slice`). It is a
 * size container, so a `CourtMark` inside it can stand on the court at any width and height. Decorative.
 */
export function CourtBox({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      aria-hidden="true"
      className={cn("absolute inset-x-0 top-50 bottom-0", className)}
      style={{ containerType: "size" }}
    >
      {children}
    </div>
  );
}

/**
 * An HTML mark that stands on the column's court at a point of the stage's design space (the board's x, y), centred
 * on it. The court is the crop scaled to fill its box and kept at the top and the middle, so the scale is the larger
 * of box width / crop width and box height / crop height; the mark's place is worked out from the box's own size in
 * CSS, with no script and no drawing inside the SVG (WebKit is unreliable with HTML in a `foreignObject`). The court's
 * centre line is `left: 50%`, whatever the width. Put it inside a `CourtBox`.
 */
export function CourtMark({
  venue,
  x,
  y,
  className,
  children,
}: {
  venue: Venue;
  /** The board's coordinates of the mark's centre (1440x900). */
  x: number;
  y: number;
  className?: string;
  children: ReactNode;
}) {
  const c = crop(venue);
  const scale = `max(100cqw / ${c.w}, 100cqh / ${c.h})`;
  const style: CSSProperties = {
    left: `calc(50% + ${x - (c.x + c.w / 2)} * ${scale})`,
    top: `calc(${y - c.y} * ${scale})`,
  };
  return (
    <div
      data-part="court-mark"
      style={style}
      className={cn("pointer-events-none absolute -translate-x-1/2 -translate-y-1/2", className)}
    >
      {children}
    </div>
  );
}
