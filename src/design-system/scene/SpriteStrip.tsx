import type { ComponentPropsWithoutRef, CSSProperties } from "react";
import { cn } from "@/lib/cn";

type SpriteStripProps = {
  /** The strip image: `frames` equal frames laid side by side. */
  src: string;
  frames?: number;
} & Omit<ComponentPropsWithoutRef<"div">, "children">;

/**
 * One frame of a horizontal sprite strip, scaled to this box (a 16-frame strip in a 560x451 box is 8960x451).
 * It shows frame 0; whoever plays it moves background-position (see framePosition in @/lib/sprite) and may
 * mirror the frame in a `data-frame` attribute. Decorative unless the caller gives it a role and a label.
 */
export function SpriteStrip({ src, frames = 16, className, style, ...rest }: SpriteStripProps) {
  const strip: CSSProperties = {
    backgroundImage: `url("${src}")`,
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
