import type { ElementType, MouseEventHandler } from "react";

/** Where a link goes. A plain link passes `href`; a router link passes `as` (the router's Link) and `to`. */
export interface LinkTarget {
  href?: string;
  to?: string;
  as?: ElementType;
  onClick?: MouseEventHandler;
}

/** A link with its words: every word a component shows is a prop. */
export interface LinkSpec extends LinkTarget {
  label: string;
}

/** `as` (an anchor unless told otherwise) and only the attributes that are set, ready to spread on the element. */
export function linkProps({ as, href, to, onClick }: LinkTarget): { as: ElementType } & LinkTarget {
  return {
    as: as ?? "a",
    ...(href !== undefined ? { href } : {}),
    ...(to !== undefined ? { to } : {}),
    ...(onClick ? { onClick } : {}),
  };
}
