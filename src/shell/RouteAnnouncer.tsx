import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

/** After client navigation: focus the new <h1> and announce the page title (spec §4.6, §11.1). */
export function RouteAnnouncer() {
  const { pathname } = useLocation();
  const first = useRef(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const h1 = document.querySelector<HTMLElement>("main h1");
        if (h1) {
          h1.setAttribute("tabindex", "-1");
          h1.focus({ preventScroll: true });
        }
        setMessage(document.title);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [pathname]);

  return (
    <div aria-live="assertive" className="sr-only">
      {message}
    </div>
  );
}
