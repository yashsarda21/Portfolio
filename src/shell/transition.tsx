import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useLocation, useNavigate, type NavigateOptions } from "react-router";
import { BrandLockup } from "@/design-system";
import { ui } from "@/content";
import { gsap, prefersReducedMotion } from "@/lib/motion";

type Kind = "wipe" | "tunnel";
interface TransitionApi {
  go(to: string, kind?: Kind, options?: NavigateOptions): Promise<void>;
  busy: boolean;
}

const Ctx = createContext<TransitionApi | null>(null);
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const { key: locationKey } = useLocation();
  // Latest location key, readable from inside go() after awaits (back/forward can land mid-cover).
  const locationKeyRef = useRef(locationKey);
  useEffect(() => {
    locationKeyRef.current = locationKey;
  }, [locationKey]);
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const bar = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);

  const go = useCallback(
    async (to: string, kind: Kind = "wipe", options?: NavigateOptions) => {
      if (busyRef.current) return;
      // Reduced motion: navigate instantly, no crossfade (spec §11.5).
      if (prefersReducedMotion() || !bar.current || !mark.current) {
        await navigate(to, options);
        return;
      }
      busyRef.current = true;
      setBusy(true);
      const startKey = locationKeyRef.current;
      try {
        const scene = document.querySelector<HTMLElement>("[data-transition-scene]");
        if (kind === "tunnel" && scene) {
          await gsap.to(scene, {
            scale: 1.06,
            filter: "blur(6px)",
            duration: 0.3,
            ease: "power2.in",
          });
        }
        // Cover: volt bar sweeps in at 18°, YS flashes mid-wipe (spec §6 broadcast wipe).
        await gsap
          .timeline()
          .set(bar.current, { xPercent: -130, autoAlpha: 1 })
          .to(bar.current, { xPercent: 0, duration: 0.24, ease: "power2.in" })
          .to(mark.current, { autoAlpha: 1, duration: 0.08 }, "-=0.06");
        // Back/forward during the cover already moved the visitor: don't push the old target on top.
        if (locationKeyRef.current === startKey) await navigate(to, options);
        await nextFrame();
        await nextFrame();
        // Reveal.
        await gsap
          .timeline()
          .to(mark.current, { autoAlpha: 0, duration: 0.08 })
          .to(bar.current, { xPercent: 130, duration: 0.24, ease: "power2.out" }, "<")
          .set(bar.current, { autoAlpha: 0 });
      } finally {
        // Whatever happened above (interrupted, rejected), leave nothing covering or transformed.
        gsap.set([bar.current, mark.current].filter(Boolean), { autoAlpha: 0 });
        const scenes = document.querySelectorAll<HTMLElement>("[data-transition-scene]");
        if (scenes.length > 0) gsap.set(scenes, { clearProps: "transform,filter" });
        busyRef.current = false;
        setBusy(false);
      }
    },
    [navigate],
  );

  const api = useMemo(() => ({ go, busy }), [go, busy]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div
        aria-hidden="true"
        data-wipe
        className="pointer-events-none fixed inset-0 z-50 overflow-hidden"
      >
        <div
          ref={bar}
          className="invisible absolute -inset-y-10 -left-1/4 w-[150vw] -skew-x-[18deg] bg-volt opacity-0"
        />
        <div ref={mark} className="invisible absolute inset-0 grid place-items-center opacity-0">
          <BrandLockup
            mark={ui.brand.mark}
            size="lg"
            className="scale-200 [&>span:first-child]:border-volt-ink [&>span:first-child]:text-volt-ink"
          />
        </div>
      </div>
    </Ctx.Provider>
  );
}

export function useArenaTransition(): TransitionApi {
  const api = useContext(Ctx);
  if (!api) throw new Error("useArenaTransition must be used inside <TransitionProvider>");
  return api;
}
