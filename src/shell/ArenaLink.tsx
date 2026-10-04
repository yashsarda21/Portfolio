import type { MouseEvent } from "react";
import { Link, type LinkProps } from "react-router";
import { useArenaTransition } from "./transition";

type ArenaLinkProps = LinkProps & { transition?: "wipe" | "tunnel" | "none" };

/** A router Link that plays the broadcast wipe. Without JS (or with modifier keys) it's a normal link. */
export function ArenaLink({ to, transition = "wipe", onClick, ...rest }: ArenaLinkProps) {
  const { go } = useArenaTransition();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || transition === "none") return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (typeof to !== "string") return;
    e.preventDefault();
    void go(to, transition);
  };
  return <Link to={to} onClick={handle} {...rest} />;
}
