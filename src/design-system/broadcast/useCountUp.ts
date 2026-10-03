import { useEffect, useState, type RefObject } from "react";

const DURATION = 900; // --dur-count

function inViewport(el: Element) {
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom >= 0;
}

/** Count up to `target` once the element scrolls into view. Never flickers prerendered values (spec §6). */
export function useCountUp(
  target: number,
  decimals: number,
  enabled: boolean,
  ref: RefObject<Element | null>,
): string {
  const [value, setValue] = useState(target);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (inViewport(el)) return;

    let raf = 0;
    let play: IntersectionObserver | undefined;
    // Zero the number while it is still just below the fold, so the reset is never seen…
    const arm = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        arm.disconnect();
        setValue(0);
        // …then count up once it is properly visible.
        play = new IntersectionObserver(
          ([e]) => {
            if (!e?.isIntersecting) return;
            play?.disconnect();
            const t0 = performance.now();
            const tick = (now: number) => {
              const p = Math.min(1, (now - t0) / DURATION);
              setValue(target * (1 - (1 - p) ** 3));
              if (p < 1) raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
          },
          { threshold: 0.4 },
        );
        play.observe(el);
      },
      { rootMargin: "0px 0px 25% 0px" },
    );
    arm.observe(el);
    return () => {
      arm.disconnect();
      play?.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, enabled, ref]);

  return value.toFixed(decimals);
}
