import type { ElementType, MouseEventHandler } from "react";

/** Where a link goes. A plain link passes `href`; a router link passes `as` (the router's Link) and `to`. */
export interface LinkTarget {
  href?: string;
  to?: string;
  as?: ElementType;
  onClick?: MouseEventHandler;
  /** `false` keeps the browser from picking the link up to drag (a drag on a card turns the arc instead). */
  draggable?: boolean;
}

/** A link with its words: every word a component shows is a prop. */
export interface LinkSpec extends LinkTarget {
  label: string;
}

/**
 * `as` (an anchor unless told otherwise) and only the attributes that are set, ready to spread on the element. (`as`
 * is typed once, not as `ElementType & ElementType`: with three.js's JSX tags that intersection is too large for tsc.)
 */
export function linkProps({
  as,
  href,
  to,
  onClick,
  draggable,
}: LinkTarget): Omit<LinkTarget, "as"> & { as: ElementType } {
  return {
    as: as ?? "a",
    ...(href !== undefined ? { href } : {}),
    ...(to !== undefined ? { to } : {}),
    ...(onClick ? { onClick } : {}),
    ...(draggable !== undefined ? { draggable } : {}),
  };
}
