import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

interface CommentaryBarProps extends ComponentPropsWithRef<"div"> {
  tag: string;
  line: string;
  variant?: "overlay" | "inline";
  /** "out" fades the line away; the 0D commentary service flips it before unmounting. */
  state?: "in" | "out";
}

/**
 * Commentary lower-third. Purely visual — the 0D commentary service owns timing and the live region
 * (pass aria-hidden etc. through rest props).
 */
export function CommentaryBar({
  tag,
  line,
  variant = "overlay",
  state = "in",
  className,
  ...rest
}: CommentaryBarProps) {
  return (
    // data-commentary-bar: the one hook tests use to find (and mask) the bar; `data-state` is shared with Radix.
    <div
      data-commentary-bar=""
      data-state={state}
      className={cn("flex items-stretch", className)}
      {...rest}
    >
      <span
        className={cn(
          "flex items-center bg-volt type-mono-comm text-volt-ink",
          variant === "overlay" ? "px-3.5" : "px-3",
        )}
      >
        {tag}
      </span>
      <span
        key={line}
        data-state={state}
        className={cn(
          "flex animate-comm-in items-center type-comm text-text-1 transition duration-(--dur-hover) ease-follow",
          // Switches the entrance off so it cannot override the exit transition.
          "data-[state=out]:-translate-x-3 data-[state=out]:animate-none data-[state=out]:opacity-0",
          variant === "overlay" ? "glass px-4.5 py-2.5" : "bg-panel px-3.5 py-2.5",
        )}
      >
        {line}
      </span>
    </div>
  );
}
