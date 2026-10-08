import type { ComponentProps, MouseEvent } from "react";
import { Link, useLocation, useResolvedPath, type LinkProps } from "react-router";
import { useArenaTransition } from "./transition";

type ArenaLinkProps = LinkProps & { transition?: "wipe" | "tunnel" | "none" };

/**
 * A router Link that plays the broadcast wipe. Without JS, with modifier keys, for new-tab/external
 * targets, `reloadDocument`, or when the link stays on the current page (including `#hash` links),
 * it is a plain Link.
 */
export function ArenaLink({
  to,
  transition = "wipe",
  onClick,
  target,
  reloadDocument,
  replace,
  state,
  preventScrollReset,
  ...rest
}: ArenaLinkProps) {
  const { go } = useArenaTransition();
  const { pathname } = useLocation();
  const resolved = useResolvedPath(to);

  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || transition === "none") return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (typeof to !== "string" || reloadDocument) return;
    if (target && target !== "_self") return;
    if (resolved.pathname === pathname) return;
    e.preventDefault();
    void go(to, transition, { replace, state, preventScrollReset });
  };

  return (
    <Link
      to={to}
      onClick={handle}
      target={target}
      reloadDocument={reloadDocument}
      replace={replace}
      state={state}
      preventScrollReset={preventScrollReset}
      {...rest}
    />
  );
}

/** An ArenaLink that pushes into the venue instead of wiping (spec §4.6: PLAY and REMATCH). */
export function TunnelLink(props: ComponentProps<typeof ArenaLink>) {
  return <ArenaLink {...props} transition="tunnel" />;
}
