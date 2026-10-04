import { cva } from "class-variance-authority";
import type { ComponentPropsWithRef, CSSProperties } from "react";
import { cn } from "@/lib/cn";

// Literal classes so Tailwind generates them. Sizes and alphas are the Trophy-Room artboard's:
// the lit trophy 220x300 at .30, the others 220x300 at .18 (top shelf) and 200x260 at .16 (second shelf).
const spotlight = cva(
  "pointer-events-none absolute top-0 left-1/2 scene-spot scene-cone-down animate-spot-drop",
  {
    variants: {
      size: {
        lg: "-ml-27.5 h-75 w-55",
        md: "-ml-25 h-65 w-50",
      },
      intensity: {
        lead: "[--spot-a:0.3]",
        support: "",
      },
      scale: { art: "", phone: "max-md:scene-zoom-sm max-md:origin-top" },
    },
    compoundVariants: [
      { intensity: "support", size: "lg", className: "[--spot-a:0.18]" },
      { intensity: "support", size: "md", className: "[--spot-a:0.16]" },
    ],
    defaultVariants: { intensity: "support", size: "lg", scale: "art" },
  },
);

type SpotlightProps = {
  /** lead: the lit trophy, brightest · support: the rest of the shelf. */
  intensity?: "lead" | "support";
  size?: "lg" | "md";
  /** art: the artboard's size at every width · phone: 80% below 768px, to sit over the phone's smaller trophy. */
  scale?: "art" | "phone";
  /** Position in the shelf: each cone drops 300ms after the one before. */
  index?: number;
} & Omit<ComponentPropsWithRef<"span">, "children">;

/**
 * A cone of warm light dropping from the top of a shelf onto a trophy. Put it first inside the
 * trophy's `relative` cell. Reduced motion shows it already lit. Decorative.
 */
export function Spotlight({
  intensity,
  size,
  scale,
  index = 0,
  className,
  style,
  ...rest
}: SpotlightProps) {
  return (
    <span
      aria-hidden="true"
      className={cn(spotlight({ intensity, size, scale }), className)}
      style={{ "--i": index, ...style } as CSSProperties}
      {...rest}
    />
  );
}
