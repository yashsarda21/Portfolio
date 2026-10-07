import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

/** The first <h1> that is actually rendered: on mobile the desktop Scoreboard title is display:none. */
function firstRenderedHeading(): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>("main h1")].find(
    (h) => h.getClientRects().length > 0,
  );
}

/** How long a heading that is still hidden (the Landing's name, until its turn in the boot) is waited for. */
const HIDDEN_HEADING_WAIT_MS = 8000;

const HEADING = "h1, h2, h3, h4, h5, h6";

/** The element a URL hash points at, if the page has one. */
function hashTarget(hash: string): HTMLElement | null {
  if (hash.length < 2) return null;
  try {
    return document.getElementById(decodeURIComponent(hash.slice(1)));
  } catch {
    return null; // a malformed escape: no target
  }
}

/** Where focus goes after a navigation: the hash target's heading when there is one, else the page <h1>. */
function landingElement(hash: string): HTMLElement | undefined {
  const target = hashTarget(hash);
  if (target) {
    const heading = target.matches(HEADING) ? target : target.querySelector<HTMLElement>(HEADING);
    // The section's own heading reads its name; a target with no heading takes focus itself.
    return heading ?? target;
  }
  return firstRenderedHeading();
}

/**
 * After client navigation: focus where the visitor landed and announce the page title (spec §4.6, §11.1).
 * That is the new <h1>, or, for a link to `/page#section`, the section's heading: the page has scrolled
 * there, so the reading cursor and the next Tab must start there too.
 */
export function RouteAnnouncer() {
  const { pathname, hash } = useLocation();
  // Compared with the current path (not a "first run" flag) so strict mode's double effect stays a no-op.
  const prev = useRef(pathname);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (prev.current === pathname) return;
    prev.current = pathname;
    const frames: number[] = [];
    const later = (fn: () => void) => frames.push(requestAnimationFrame(fn));
    later(() =>
      later(() => {
        const landing = landingElement(hash);
        if (landing) {
          landing.setAttribute("tabindex", "-1");
          landing.focus({ preventScroll: true });
          // A hidden element cannot take focus: keep trying until it shows, unless the visitor moved on.
          const until = performance.now() + HIDDEN_HEADING_WAIT_MS;
          const retry = () => {
            const idle = document.activeElement === document.body || !document.activeElement;
            if (document.activeElement === landing || !idle || performance.now() > until) return;
            landing.focus({ preventScroll: true });
            later(retry);
          };
          later(retry);
        }
        // Clear first so two pages with the same title still re-announce.
        setMessage("");
        later(() => setMessage(document.title));
      }),
    );
    return () => frames.forEach(cancelAnimationFrame);
  }, [pathname, hash]);

  return (
    <div aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}
