import { cn } from "@/lib/cn";
import { Glass } from "../primitives/Glass";

/**
 * What the panel shows. The games' `GameSpotlight` (features/games/engine/spotlight.ts) is this same shape; the
 * design system cannot import it (spec §4.2). The exit's timing (starts 4050 ms in, lasts 450) is in motion.css.
 */
export type SpotlightContent =
  | { kind: "unlock"; eyebrow: string; title: string; line: string; to: "left" | "right" }
  | { kind: "yours"; text: string };

const EXIT = {
  left: "animate-spotlight-left",
  right: "animate-spotlight-right",
  up: "animate-spotlight-up",
} as const;

/**
 * What a point put in the centre of a game (owner, 2026-11-07). Yash's point: a glass panel with a volt edge and one
 * soft glow pulse, the card's eyebrow, its title big and one line (the project's result), which for its last 450 ms
 * shrinks to 60% and moves toward its card (`to`; the phone's column: up to its chip under the top bar) while fading out. The visitor's
 * point: the words alone, in volt, like the old call. The parent places it and gives it the width it may fill; a long
 * title wraps onto balanced lines. Decorative, because the announcer speaks it. To play it again for the next point,
 * give it a new `key`.
 */
export function Spotlight({
  spotlight,
  size,
  className,
}: {
  spotlight: SpotlightContent;
  size: "stage" | "column";
  className?: string;
}) {
  // The words of the visitor's point are the old call's size; Yash's unlock is a panel, so its title is a step down.
  const call = size === "stage" ? "type-call" : "type-call-sm";
  const title = size === "stage" ? "type-d2" : "type-d3";
  if (spotlight.kind === "yours") {
    return (
      <div
        aria-hidden="true"
        data-kind="yours"
        data-size={size}
        className={cn("animate-pop text-center text-balance text-volt glow-call", call, className)}
      >
        {spotlight.text}
      </div>
    );
  }
  return (
    <div
      aria-hidden="true"
      data-kind="unlock"
      data-size={size}
      data-to={size === "column" ? "up" : spotlight.to}
      className={cn(
        "flex justify-center",
        EXIT[size === "column" ? "up" : spotlight.to],
        className,
      )}
    >
      <Glass
        // Near-opaque, so the court's lines never show through the words (the bar's dark fill, 90%).
        surface="none"
        edge="volt"
        elevation="toast"
        className={cn(
          "flex animate-spotlight-in flex-col items-center gap-2 border bg-bar px-6 py-5 text-center",
          size === "stage"
            ? "max-w-190 gap-3 px-10 py-7"
            : // A phone held sideways is short: the eyebrow goes and the title and line are tighter, to fit above the thumb.
              "mx-4 max-w-[calc(100%-2rem)] short:gap-0.5 short:px-4 short:py-2",
        )}
      >
        <span className={cn("type-mono-label text-volt", size === "column" && "short:hidden")}>
          {spotlight.eyebrow}
        </span>
        <span
          className={cn(
            "text-balance text-floodlight glow-call",
            title,
            size === "column" && "short:text-2xl",
          )}
        >
          {spotlight.title}
        </span>
        <span className="line-clamp-2 type-body text-balance text-dim short:line-clamp-1">
          {spotlight.line}
        </span>
      </Glass>
    </div>
  );
}
