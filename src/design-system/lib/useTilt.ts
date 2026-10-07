import { useEffect, useRef, useState, type PointerEvent, type RefObject } from "react";

/** A press that moves farther than this is a drag, not a click. */
const DRAG_PX = 4;

interface Setters {
  rotationX: (v: number) => unknown;
  rotationY: (v: number) => unknown;
  y: (v: number) => unknown;
  kill: () => void;
}

function tiltAllowed(): boolean {
  if (typeof window === "undefined" || !window.matchMedia) return false;
  return (
    window.matchMedia("(pointer: fine)").matches &&
    !window.matchMedia("(prefers-reduced-motion: reduce)").matches
  );
}

const clamp = (n: number) => Math.max(-1, Math.min(1, n));

/**
 * Pointer tilt for a 3D card. Put the handlers on a still element (it measures itself) and `ref` on the
 * layer that tilts. Only for a fine pointer and without reduced motion; GSAP loads on the first move.
 * A press that travels more than 4px is a drag: `dragging` is true and `consumeDrag()` tells the click
 * handler to ignore the click that follows.
 */
export function useTilt(
  ref: RefObject<HTMLElement | null>,
  { max = 6, lift = 8 }: { max?: number; lift?: number } = {},
) {
  const [dragging, setDragging] = useState(false);
  const press = useRef<{ x: number; y: number } | null>(null);
  const dragged = useRef(false);
  const setters = useRef<Promise<Setters | null> | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);

  function load(): Promise<Setters | null> {
    setters.current ??= import("gsap")
      .then(({ gsap }) => {
        const el = ref.current;
        if (!el) return null;
        const opts = { duration: 0.4, ease: "power3.out" };
        return {
          rotationX: gsap.quickTo(el, "rotationX", opts),
          rotationY: gsap.quickTo(el, "rotationY", opts),
          y: gsap.quickTo(el, "y", opts),
          kill: () => gsap.killTweensOf(el),
        };
      })
      .catch(() => null);
    return setters.current;
  }

  // The click follows the pointer-up in the same task, so by the next tick the drag is over.
  function endPress() {
    press.current = null;
    clearTimeout(timer.current);
    timer.current = setTimeout(() => {
      dragged.current = false;
      setDragging(false);
    }, 0);
  }

  useEffect(
    () => () => {
      clearTimeout(timer.current);
      void setters.current?.then((s) => s?.kill());
    },
    [],
  );

  return {
    dragging,
    /** True once if the press that just ended was a drag (call it from the click handler). */
    consumeDrag(): boolean {
      const was = dragged.current;
      dragged.current = false;
      return was;
    },
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if (!tiltAllowed()) return;
      clearTimeout(timer.current);
      press.current = { x: e.clientX, y: e.clientY };
      dragged.current = false;
      setDragging(false);
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      if (!tiltAllowed()) return;
      const start = press.current;
      if (
        start &&
        !dragged.current &&
        Math.hypot(e.clientX - start.x, e.clientY - start.y) > DRAG_PX
      ) {
        dragged.current = true;
        setDragging(true);
      }
      const r = e.currentTarget.getBoundingClientRect();
      const nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1);
      const ny = clamp(((e.clientY - r.top) / r.height) * 2 - 1);
      void load().then((s) => {
        s?.rotationY(nx * max);
        s?.rotationX(-ny * max);
        s?.y(-lift);
      });
    },
    onPointerUp() {
      if (press.current) endPress();
    },
    onPointerLeave() {
      if (press.current) endPress();
      // Settle only if a tilt ever started; nothing to load otherwise.
      void setters.current?.then((s) => {
        s?.rotationY(0);
        s?.rotationX(0);
        s?.y(0);
      });
    },
  };
}
