import { useEffect, useRef } from "react";
import { cn } from "@/lib/cn";
import type { Polygon } from "./cones";

const REDUCED = "(prefers-reduced-motion: reduce)";
/** Dust is for the desktop stage: lg (1200px) and up (L12). */
const WIDE = "(min-width: 75rem)";
const SPECK_ALPHA = 0.15;

interface Speck {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

function inside(poly: Polygon, x: number, y: number): boolean {
  let hit = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) {
    const [xi, yi] = poly[i]!;
    const [xj, yj] = poly[j]!;
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) hit = !hit;
  }
  return hit;
}

/** A random point inside one of the polygons (fractions of the canvas), by rejection in its bounding box. */
function pointIn(regions: readonly Polygon[]): [number, number] {
  const poly = regions[Math.floor(Math.random() * regions.length)]!;
  const xs = poly.map((p) => p[0]);
  const ys = poly.map((p) => p[1]);
  const [x0, x1, y0, y1] = [Math.min(...xs), Math.max(...xs), Math.min(...ys), Math.max(...ys)];
  for (let i = 0; i < 40; i++) {
    const x = x0 + Math.random() * (x1 - x0);
    const y = y0 + Math.random() * (y1 - y0);
    if (inside(poly, x, y)) return [x, y];
  }
  return [(x0 + x1) / 2, (y0 + y1) / 2];
}

/**
 * Dust in the light beams (L12): one canvas as big as its parent, with up to `count` faint specks drifting
 * up and sideways inside the `regions` (polygons in fractions of the canvas). It is drawn only on a wide
 * screen with motion allowed, and rests while the tab is hidden; reduced motion or a narrow screen never starts it.
 */
export function Dust({
  count = 60,
  regions,
  className,
}: {
  count?: number;
  regions: readonly Polygon[];
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || regions.length === 0 || typeof window.matchMedia !== "function") return;
    const reduced = window.matchMedia(REDUCED);
    const wide = window.matchMedia(WIDE);
    const ctx = canvas.getContext("2d");

    let frame = 0;
    let last = 0;
    let specks: Speck[] = [];

    const spawn = (): Speck => {
      const [x, y] = pointIn(regions);
      return {
        x,
        y,
        vx: (Math.random() - 0.5) * 0.012,
        vy: -(0.004 + Math.random() * 0.012),
        size: 1 + Math.round(Math.random()),
      };
    };

    const tick = (now: number) => {
      frame = requestAnimationFrame(tick);
      const w = canvas.width;
      const h = canvas.height;
      const dt = Math.min(0.1, (now - last) / 1000 || 0);
      last = now;
      if (!ctx) return;
      ctx.clearRect(0, 0, w, h);
      for (let i = 0; i < specks.length; i++) {
        const s = specks[i]!;
        s.x += s.vx * dt;
        s.y += s.vy * dt;
        if (!regions.some((r) => inside(r, s.x, s.y))) specks[i] = spawn();
        ctx.fillRect(Math.round(s.x * w), Math.round(s.y * h), s.size, s.size);
      }
    };

    const stop = () => {
      if (frame) cancelAnimationFrame(frame);
      frame = 0;
    };
    const canRun = () => !reduced.matches && wide.matches && document.visibilityState !== "hidden";
    const start = () => {
      if (frame || !canRun()) return;
      const parent = canvas.parentElement;
      canvas.width = parent?.clientWidth || canvas.clientWidth || 1440;
      canvas.height = parent?.clientHeight || canvas.clientHeight || 900;
      if (ctx) {
        ctx.fillStyle = getComputedStyle(canvas).color;
        ctx.globalAlpha = SPECK_ALPHA;
      }
      if (specks.length === 0) specks = Array.from({ length: count }, spawn);
      last = performance.now();
      frame = requestAnimationFrame(tick);
    };
    const sync = () => {
      if (canRun()) start();
      else stop();
    };

    reduced.addEventListener("change", sync);
    wide.addEventListener("change", sync);
    document.addEventListener("visibilitychange", sync);
    sync();
    return () => {
      stop();
      reduced.removeEventListener("change", sync);
      wide.removeEventListener("change", sync);
      document.removeEventListener("visibilitychange", sync);
    };
  }, [count, regions]);

  return (
    <canvas
      ref={canvasRef}
      aria-hidden="true"
      data-part="dust"
      className={cn("pointer-events-none absolute inset-0 size-full text-led", className)}
    />
  );
}
