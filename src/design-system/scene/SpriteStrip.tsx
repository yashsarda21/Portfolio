import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { cn } from "@/lib/cn";

type SpriteStripProps = {
  /** The strip image: `frames` equal frames laid side by side. */
  src: string;
  frames?: number;
  /** Hold the image in `--sprite` and draw nothing: no request is made until a class sets `background-image: var(--sprite)` (the Intro's gate, `intro-turn`). */
  deferred?: boolean;
} & Omit<ComponentPropsWithoutRef<"div">, "children">;

/**
 * One frame of a horizontal sprite strip, scaled to this box (a 16-frame strip in a 560x451 box is 8960x451).
 * It shows frame 0; whoever plays it moves background-position (see framePosition in @/lib/sprite) and may
 * mirror the frame in a `data-frame` attribute. Decorative unless the caller gives it a role and a label.
 */
export function SpriteStrip({
  src,
  frames = 16,
  deferred = false,
  className,
  style,
  ...rest
}: SpriteStripProps) {
  const strip: CSSProperties = {
    ...(deferred
      ? ({ "--sprite": `url("${src}")` } as CSSProperties)
      : { backgroundImage: `url("${src}")` }),
    backgroundSize: `${frames * 100}% 100%`,
    backgroundRepeat: "no-repeat",
    backgroundPosition: "0 0",
  };
  return (
    <div
      className={cn("pointer-events-none", className)}
      style={{ ...strip, ...style }}
      {...rest}
    />
  );
}
