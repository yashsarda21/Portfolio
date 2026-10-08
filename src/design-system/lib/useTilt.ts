import { useEffect, useRef, type PointerEvent, type RefObject } from "react";
import { loadGsap } from "@/lib/motion";
import { finePointer, motionAllowed } from "./motionGate";
import { usePressTracker } from "./pressTracker";

interface Setters {
  rotationX: (v: number) => unknown;
  rotationY: (v: number) => unknown;
  y: (v: number) => unknown;
  kill: () => void;
}

const clamp = (n: number) => Math.max(-1, Math.min(1, n));
const fingerLike = (e: PointerEvent) => e.pointerType === "touch" || e.pointerType === "pen";

/**
 * Pointer tilt for a 3D card. Spread `handlers` on a still element (it measures that element, so the box does not
 * turn under the pointer) and put `ref` on the layer that tilts. Only for a fine pointer and without reduced motion; GSAP loads on the first move.
 * A press that travels more than 4px is a drag: `consumeDrag()` tells the click handler to ignore the
 * click that follows. A drag stays a drag if the pointer leaves the card and comes back with the button
 * still held; it is forgotten at the next press, or at the first move with no button down.
 *
 * With `touch: true`, a finger or pen also tilts the card, but only while it presses: the card leans toward
 * the finger, carries `data-pressed` (CSS can lift it), and eases back on release or when a scroll takes the
 * touch over (`onPointerCancel`). Without it a touch is left alone, as before.
 */
export function useTilt(
  ref: RefObject<HTMLElement | null>,
  { max = 6, lift = 8, touch = false }: { max?: number; lift?: number; touch?: boolean } = {},
) {
  const press = usePressTracker();
  const setters = useRef<Promise<Setters | null> | null>(null);
  const touching = useRef(false);

  function load(): Promise<Setters | null> {
    setters.current ??= loadGsap()
      .then((gsap) => {
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

  /** A finger only counts when the page opted in; the mouse keeps the fine-pointer gate. */
  const allowed = (e: PointerEvent) =>
    touch && fingerLike(e) ? motionAllowed() : motionAllowed() && finePointer();

  function aim(e: PointerEvent<HTMLElement>) {
    const r = e.currentTarget.getBoundingClientRect();
    const nx = clamp(((e.clientX - r.left) / r.width) * 2 - 1);
    const ny = clamp(((e.clientY - r.top) / r.height) * 2 - 1);
    void load().then((s) => {
      s?.rotationY(nx * max);
      s?.rotationX(-ny * max);
      s?.y(-lift);
    });
  }

  function settle() {
    // Nothing to load if a tilt never started.
    void setters.current?.then((s) => {
      s?.rotationY(0);
      s?.rotationX(0);
      s?.y(0);
    });
  }

  function setPressed(on: boolean) {
    const el = ref.current;
    if (!el) return;
    if (on) el.dataset.pressed = "";
    else delete el.dataset.pressed;
  }

  function release() {
    touching.current = false;
    setPressed(false);
    settle();
  }

  useEffect(
    () => () => {
      void setters.current?.then((s) => s?.kill());
    },
    [],
  );

  const handlers = {
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if (!allowed(e)) return;
      press.begin(e.clientX, e.clientY);
      if (touch && fingerLike(e)) {
        touching.current = true;
        setPressed(true);
        aim(e);
      }
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      if (!allowed(e)) return;
      if (touch && fingerLike(e)) {
        if (!touching.current || !press.active || e.buttons === 0) return;
        press.track(e.clientX, e.clientY);
        aim(e);
        return;
      }
      // A press whose button was let go outside the card never saw its pointer-up: forget it.
      if (e.buttons === 0) press.forget();
      press.track(e.clientX, e.clientY);
      aim(e);
    },
    onPointerUp() {
      if (press.active) press.end();
      if (touching.current) release();
    },
    /** A scroll took the touch over: the press is void, so is its click. */
    onPointerCancel() {
      press.forget();
      release();
    },
    onPointerLeave() {
      // A press still held stays a press: coming back and letting go over the card must not flip it.
      setPressed(false);
      settle();
    },
  };

  return {
    /** True once if the press that just ended was a drag (call it from the click handler). */
    consumeDrag: () => press.consumeDrag(),
    /** The five pointer handlers, to spread onto the still element. */
    handlers,
  };
}
