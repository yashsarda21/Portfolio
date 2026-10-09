import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Tell tailwind-merge about the Arena scales so it groups our utilities correctly.
const twMerge = extendTailwindMerge<"type-recipe" | "surface">({
  extend: {
    theme: {
      // `leading-auto` is the Arena token for the font's own line box (theme.css).
      leading: ["auto"],
      shadow: [
        "board",
        "card-3d",
        "toast",
        "holo",
        "glow-ring",
        "glow-cta",
        "glow-cursor",
        "glow-power",
        "glow-volt-sm",
        "glow-volt-md",
        "glow-volt-lg",
        "bank-lg",
        "bank-sm",
        "bank-mini",
        "inset-cabinet",
      ],
      ease: ["follow", "snap", "swing", "entrance", "standard", "absorb"],
      blur: ["beam", "glass", "soft"],
    },
    classGroups: {
      // Each `type-*` utility sets a full type recipe, so two of them always conflict.
      "type-recipe": [{ type: [(value: string) => value.length > 0] }],
      // glass / glass-solid / bar each set the surface background, so only one applies.
      surface: ["glass", "glass-solid", "bar"],
    },
    conflictingClassGroups: {
      // A later type recipe replaces earlier font classes it would override anyway.
      "type-recipe": ["font-family", "font-size", "font-weight", "leading", "tracking"],
    },
  },
});

/** Merge class names; later Tailwind classes override earlier conflicting ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
