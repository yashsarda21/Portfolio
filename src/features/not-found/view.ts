import type { UiCopy } from "@/content";
import type { ROUTES } from "@/shell/routes";

/** The longest path the page prints back; a longer one is cut and ends in an ellipsis. */
export const MAX_TRIED = 60;

export interface NotFoundLink {
  id: "hub" | "quickView" | "home";
  label: string;
  to: string;
}

export interface NotFoundView {
  heading: string;
  description: string;
  /** "You tried /arena/nope", or null on /404 itself (nothing was tried). */
  tried: string | null;
  /** The way back, in order; the first is the main one. */
  links: NotFoundLink[];
}

/** The OUT OF BOUNDS page, as plain strings. Pure: no React, no DOM. The path is shown as text, never as markup. */
export function buildNotFoundView(
  copy: UiCopy,
  routes: typeof ROUTES,
  path?: string,
): NotFoundView {
  const shown = path && path.length > MAX_TRIED ? `${path.slice(0, MAX_TRIED)}…` : path;
  return {
    heading: copy.routes.notFound.heading,
    description: copy.routes.notFound.description,
    tried: shown ? `${copy.notFound.tried} ${shown}` : null,
    links: [
      { id: "hub", label: copy.notFound.hub, to: routes.arena },
      { id: "quickView", label: copy.hud.quickView, to: routes.scout },
      { id: "home", label: copy.notFound.home, to: routes.home },
    ],
  };
}
