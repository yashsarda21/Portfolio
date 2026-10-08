import { useEffect, useRef, type PointerEvent, type RefObject } from "react";
import { EASE, loadGsap } from "@/lib/motion";
import { motionAllowed } from "./motionGate";
import { orbitAngle } from "./orbit";
import { usePressTracker } from "./pressTracker";

type Gsap = Awaited<ReturnType<typeof loadGsap>>;
type Mode = "sway" | "drag" | "rest";

interface Options {
  /** Degrees the idle sway turns either way. */
  sway?: number;
  /** Seconds for a full there-and-back sway. */
  period?: number;
  /** The most a drag turns the plate, in degrees. */
  drag?: number;
  /** Seconds of stillness before the sway comes back. */
  resumeAfter?: number;
  /** Off below the desktop stage, and for nothing else. */
  enabled?: boolean;
}

/**
 * Idle sway and drag-to-orbit for a plate (the Hub's arc of cards). Put the handlers and `ref` on the plate, give it
 * `touch-pan-y` (a sideways finger orbits, an up/down swipe still scrolls) and `transform-3d`. The plate carries
 * `data-orbit="sway" | "drag" | "rest"`. Runs whenever motion is allowed, with a mouse or a finger. GSAP loads on mount.
 * A pointer move (or a touch) pauses the sway; it resumes `resumeAfter` s after the last one. A press that travels
 * past 4px, on anything but a link or button, turns the plate by that distance (at most `drag` degrees) and it eases
 * back on release. `consumeDrag()` tells a click handler to ignore the click that follows such a drag.
 */
export function useOrbit(
  plateRef: RefObject<HTMLElement | null>,
  { sway = 6, period = 40, drag = 15, resumeAfter = 4, enabled = true }: Options = {},
) {
  const press = usePressTracker();
  const gsapRef = useRef<Gsap | null>(null);
  const swayTween = useRef<ReturnType<Gsap["fromTo"]> | null>(null);
  const turn = useRef<((v: number) => unknown) | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const held = useRef(false); // a visitor is touching the plate: the sway waits
  const recentre = useRef(false); // the sway tween was killed by a drag and must start again from 0
  const origin = useRef({ x: 0, width: 0, id: -1 });

  function setMode(mode: Mode) {
    const el = plateRef.current;
    if (el && el.dataset.orbit !== mode) el.dataset.orbit = mode;
  }

  function startSway(gsap: Gsap, plate: HTMLElement) {
    const tween = gsap.fromTo(
      plate,
      { rotationY: -sway },
      { rotationY: sway, duration: period / 2, ease: "sine.inOut", yoyo: true, repeat: -1 },
    );
    tween.progress(0.5); // the middle of the swing: straight
    swayTween.current = tween;
  }

  function resume() {
    const plate = plateRef.current;
    const gsap = gsapRef.current;
    if (!plate || !gsap || press.active) return; // still pressing: the release will arm it again
    held.current = false;
    if (recentre.current) {
      gsap.killTweensOf(plate);
      startSway(gsap, plate);
      recentre.current = false;
    }
    swayTween.current?.play();
    setMode("sway");
  }

  /** Pause the sway and (re)arm its return. */
  function hold() {
    held.current = true;
    swayTween.current?.pause();
    setMode("rest");
    clearTimeout(timer.current);
    timer.current = setTimeout(resume, resumeAfter * 1000);
  }

  function endDrag() {
    const plate = plateRef.current;
    const gsap = gsapRef.current;
    turn.current = null;
    if (plate && gsap) {
      gsap.killTweensOf(plate);
      gsap.to(plate, { rotationY: 0, duration: 0.6, ease: EASE.follow });
      recentre.current = true;
    }
    setMode("rest");
    clearTimeout(timer.current);
    timer.current = setTimeout(resume, resumeAfter * 1000);
  }

  function finish() {
    if (!press.active && !held.current) return;
    const wasDrag = turn.current !== null;
    if (press.active) press.end();
    if (wasDrag) endDrag();
    else hold();
  }

  useEffect(() => {
    const plate = plateRef.current;
    if (!enabled || !plate || !motionAllowed()) {
      setMode("rest");
      return;
    }
    let dead = false;
    loadGsap()
      .then((gsap) => {
        if (dead) return;
        gsapRef.current = gsap;
        startSway(gsap, plate);
        if (held.current) swayTween.current?.pause();
        else setMode("sway");
      })
      .catch(() => {});
    return () => {
      dead = true;
      clearTimeout(timer.current);
      const gsap = gsapRef.current;
      if (gsap) {
        swayTween.current?.kill();
        gsap.killTweensOf(plate);
        gsap.set(plate, { clearProps: "transform" });
      }
      gsapRef.current = null;
      swayTween.current = null;
      turn.current = null;
      held.current = false;
      recentre.current = false;
      setMode("rest");
    };
    // The sway's numbers are read once per start; plateRef and the helpers are stable in effect.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [enabled, sway, period]);

  return {
    /** True once if the press that just ended was a drag (call it from a click handler). */
    consumeDrag: () => press.consumeDrag(),
    onPointerDown(e: PointerEvent<HTMLElement>) {
      if (!enabled || !motionAllowed()) return;
      const onControl = !!(e.target as Element).closest("a,button");
      // A finger on anything pauses the sway. A press on a control never turns the plate (it is a click).
      if (!onControl) {
        press.begin(e.clientX, e.clientY);
        // The plate's width is read once per press, never while moving.
        origin.current = {
          x: e.clientX,
          width: e.currentTarget.getBoundingClientRect().width,
          id: e.pointerId,
        };
      }
      if (!onControl || e.pointerType === "touch") hold();
    },
    onPointerMove(e: PointerEvent<HTMLElement>) {
      if (!enabled || !motionAllowed()) return;
      if (press.active && e.pointerId === origin.current.id && e.buttons > 0) {
        if (!press.track(e.clientX, e.clientY)) return;
        const gsap = gsapRef.current;
        const plate = plateRef.current;
        if (!gsap || !plate) return;
        if (!turn.current) {
          // The drag starts: the sway's tween steps aside, and the plate follows the pointer.
          clearTimeout(timer.current);
          gsap.killTweensOf(plate);
          recentre.current = true;
          turn.current = gsap.quickTo(plate, "rotationY", { duration: 0.3, ease: "power3.out" });
          setMode("drag");
          // A mouse keeps hold of the drag when it leaves the plate. A finger already has the touch.
          if (e.pointerType !== "touch") e.currentTarget.setPointerCapture?.(e.pointerId);
        }
        turn.current(orbitAngle(e.clientX - origin.current.x, origin.current.width, drag));
        return;
      }
      // Only a mouse that is merely moving pauses the sway (a finger does it by pressing).
      if (e.pointerType !== "touch" && !press.active && e.buttons === 0) hold();
    },
    onPointerUp() {
      finish();
    },
    onPointerCancel() {
      press.forget();
      finish();
    },
    onPointerLeave(e: PointerEvent<HTMLElement>) {
      if (e.currentTarget.hasPointerCapture?.(e.pointerId)) return;
      if (turn.current) {
        press.end();
        endDrag();
      }
    },
  };
}
