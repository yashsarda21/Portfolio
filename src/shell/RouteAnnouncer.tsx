import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

/** The first <h1> that is actually rendered: on mobile the desktop Scoreboard title is display:none. */
function firstRenderedHeading(): HTMLElement | undefined {
  return [...document.querySelectorAll<HTMLElement>("main h1")].find(
    (h) => h.getClientRects().length > 0,
  );
}

/** After client navigation: focus the new <h1> and announce the page title (spec §4.6, §11.1). */
export function RouteAnnouncer() {
  const { pathname } = useLocation();
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
        const h1 = firstRenderedHeading();
        if (h1) {
          h1.setAttribute("tabindex", "-1");
          h1.focus({ preventScroll: true });
        }
        // Clear first so two pages with the same title still re-announce.
        setMessage("");
        later(() => setMessage(document.title));
      }),
    );
    return () => frames.forEach(cancelAnimationFrame);
  }, [pathname]);

  return (
    <div aria-live="polite" className="sr-only">
      {message}
    </div>
  );
}
