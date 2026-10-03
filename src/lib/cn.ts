import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Our `type-*` utilities each set a full type recipe, so two of them always conflict.
const twMerge = extendTailwindMerge<"type-recipe">({
  extend: {
    classGroups: {
      "type-recipe": [{ type: [(value: string) => value.length > 0] }],
    },
  },
});

/** Merge class names; later Tailwind classes override earlier conflicting ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
