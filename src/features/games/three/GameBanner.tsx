import { Glass } from "@/design-system";
import { cn } from "@/lib/cn";

/** What the banner says: why this game is worth playing. */
export interface BannerCopy {
  eyebrow: string;
  headline: string;
  line: string;
}

/**
 * The banner a 3D game shows while its scene downloads (and for a moment after, so it can be read): a quiet glass
 * panel with a volt edge, the eyebrow, what the game reveals big, one plain line and the thin progress bar. It is
 * not a heading (each game page has exactly one h1, a screen reader's); the bar carries the accessible name. It never
 * takes a tap. When the game appears, `leaving` fades it out (no fade for reduced motion) and takes it out of reach.
 * The fill only grows by `transform: scaleX`, so nothing re-lays-out. The parent places it.
 */
export function GameBanner({
  copy,
  label,
  progress,
  size,
  leaving = false,
  className,
}: {
  copy: BannerCopy;
  /** The progress bar's accessible name. */
  label: string;
  /** 0 to 1. */
  progress: number;
  size: "stage" | "column";
  leaving?: boolean;
  className?: string;
}) {
  const fraction = Math.min(1, Math.max(0, progress));
  return (
    <div
      data-part="banner"
      data-size={size}
      data-leaving={leaving ? "" : undefined}
      inert={leaving}
      className={cn(
        "ease-out pointer-events-none flex w-full justify-center transition-[opacity,visibility] duration-300 motion-reduce:transition-none",
        leaving && "invisible opacity-0",
        className,
      )}
    >
      <Glass
        // Fully opaque (the point's panel is 90%): the scene's lines never show through the words.
        surface="none"
        edge="volt"
        elevation="toast"
        className={cn(
          "flex flex-col items-center border bg-ground text-center",
          size === "stage"
            ? "w-160 gap-3 px-10 py-8"
            : "mx-4 w-full max-w-[calc(100%-2rem)] gap-2 px-5 py-6 short:gap-1 short:py-3",
        )}
      >
        <span className="type-mono-label text-volt">{copy.eyebrow}</span>
        <span
          className={cn(
            "text-balance text-floodlight glow-call",
            size === "stage" ? "type-d1" : "type-d2s short:type-d3",
          )}
        >
          {copy.headline}
        </span>
        <span className="type-body text-balance text-dim short:hidden">{copy.line}</span>
        <div
          role="progressbar"
          aria-label={label}
          aria-valuemin={0}
          aria-valuemax={100}
          aria-valuenow={Math.round(fraction * 100)}
          className="mt-2 h-1 w-full overflow-hidden bg-line-strong"
        >
          <div
            data-part="fill"
            className="h-full origin-left bg-volt will-change-transform"
            style={{ transform: `scaleX(${fraction})` }}
          />
        </div>
      </Glass>
    </div>
  );
}
