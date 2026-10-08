import type { CSSProperties } from "react";
import { SpriteStrip } from "@/design-system";
import { cn } from "@/lib/cn";
import portraitRest from "@/assets/portrait-rest.webp?url";
import { RIG_STRIPS } from "@/assets/rig";
import { createPixels, type PixelColor } from "./pixels";

const PIXELS = createPixels();

const PIXEL_CLASS: Record<PixelColor, string> = {
  volt: "intro-pixel-volt",
  led: "intro-pixel-led",
  warm: "intro-pixel-warm",
};

// The motion trail behind the silhouette, in the trail box's own coordinates (Intro.dc.html): five streaks
// and six specks of light. Class strings stay literal so Tailwind sees them.
const TRAIL_STREAKS = [
  "top-30 right-0 h-0.75 w-165 bg-linear-90 from-volt/0 to-volt shadow-glow-volt-md",
  "top-44.5 right-7.5 h-0.5 w-125 bg-linear-90 from-ember/0 to-ember",
  "top-62.5 right-0 h-1.5 w-150 bg-linear-90 from-white/0 to-white/70 blur-soft",
  "top-82.5 right-10 h-0.5 w-105 bg-linear-90 from-volt/0 to-volt/80",
  "top-98.75 right-5 h-0.75 w-130 bg-linear-90 from-ember/0 to-ember/70",
] as const;
const TRAIL_SPECKS = [
  "top-24 right-17.5 size-1.5 bg-volt shadow-glow-volt-sm",
  "top-39 right-47.5 size-1 bg-white",
  "top-71.5 right-32.5 size-1.25 bg-ember",
  "top-54 right-77.5 size-1 bg-volt",
  "top-34 right-110 size-0.75 bg-white",
  "top-87.5 right-65 size-1 bg-volt",
] as const;

/** The head turn's first pose, tinted: volt for the nearer ghost, warm for the farther. */
const GHOST_TINT = ["intro-ghost-volt", "intro-ghost-warm"] as const;

/**
 * The silhouette and everything that moves with it on the wide board: the two after-images, the shock line, and
 * the mover (the trails behind the figure, the figure with its rest pose, head-turn strips, backlit shade and
 * face sweep, the anamorphic streak and glints, and the LED grid and scanlines over it), and the 90 pixels
 * that fly into the name. Place it inside the board; the timeline finds each piece by `data-part`.
 */
export function IntroFigure({ alt }: { alt: string }) {
  return (
    <>
      {GHOST_TINT.map((tint) => (
        <div
          key={tint}
          aria-hidden="true"
          data-part="ghost"
          className="pointer-events-none invisible absolute right-9 bottom-6 z-1 h-112.75 w-140"
        >
          {/* The rest pose, not the head turn's first frame: it is already on its way, so the ghosts never wait on the strips (L7). */}
          <img
            src={portraitRest}
            alt=""
            aria-hidden="true"
            decoding="async"
            className={cn("size-full", tint)}
          />
        </div>
      ))}

      <div
        aria-hidden="true"
        data-part="shock"
        className="pointer-events-none invisible absolute top-12 right-140 bottom-6 z-2 w-1.5 origin-left bg-linear-180 from-volt/0 via-volt to-volt/0 shadow-glow-volt-lg"
      />

      <div data-part="mover" className="hold-part absolute right-9 bottom-6 z-3 h-112.75 w-140">
        <div
          aria-hidden="true"
          data-part="trails"
          className="pointer-events-none invisible absolute top-0 -left-150 h-112.75 w-170"
        >
          {[...TRAIL_STREAKS, ...TRAIL_SPECKS].map((classes) => (
            <span key={classes} className={cn("absolute", classes)} />
          ))}
        </div>

        <div
          data-part="fig"
          role="img"
          aria-label={alt}
          className="absolute inset-0 intro-edge-mask"
        >
          <div data-part="idle" className="absolute inset-0">
            {/* The silhouette from the entrance, under strip A; it steps aside only if the head turn plays. */}
            <img
              data-part="rest"
              src={portraitRest}
              alt=""
              aria-hidden="true"
              className="absolute inset-0 size-full"
            />
            {RIG_STRIPS.map((src) => (
              <SpriteStrip
                key={src}
                deferred
                src={src}
                aria-hidden="true"
                data-part="turn"
                className="intro-turn absolute inset-0"
              />
            ))}
            {/* The backlit look over the lit figure; its opacity fades out as the lights come up. */}
            <img
              data-part="shade"
              src={portraitRest}
              alt=""
              aria-hidden="true"
              className="intro-shade absolute inset-0 size-full"
            />
            <div
              aria-hidden="true"
              data-part="sweep"
              className="absolute inset-0"
              style={{ "--mask": `url("${portraitRest}")` } as CSSProperties}
            />
          </div>
        </div>

        <div
          aria-hidden="true"
          data-part="streak"
          className="pointer-events-none invisible absolute top-41.25 left-15 z-2 h-0.5 w-115 origin-center intro-streak"
        />
        {(["left-61", "left-78.5"] as const).map((x) => (
          <div
            key={x}
            aria-hidden="true"
            data-part="glint"
            className={cn(
              "pointer-events-none invisible absolute top-40 z-2 size-3 rounded-full intro-glint",
              x,
            )}
          />
        ))}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-3 intro-led-grid"
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 z-3 intro-scanlines"
        />
      </div>

      {PIXELS.map((pixel, i) => (
        <span
          key={i}
          aria-hidden="true"
          data-part="pixel"
          className="pointer-events-none invisible absolute z-4 size-0 origin-top-left"
          style={{ left: pixel.x, top: pixel.y }}
        >
          <span
            className={cn("absolute", PIXEL_CLASS[pixel.color])}
            style={{ left: pixel.dx, top: pixel.dy, width: pixel.size, height: pixel.size }}
          />
        </span>
      ))}
    </>
  );
}
