import { cn } from "@/lib/cn";

interface CommentaryBarProps {
  tag: string;
  line: string;
  variant?: "overlay" | "inline";
  className?: string;
}

/** Commentary lower-third. Purely visual — the 0D commentary service owns timing and the live region. */
export function CommentaryBar({ tag, line, variant = "overlay", className }: CommentaryBarProps) {
  return (
    <div className={cn("flex items-stretch", className)}>
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
        className={cn(
          "flex animate-comm-in items-center type-comm text-text-1",
          variant === "overlay" ? "glass px-4.5 py-3" : "bg-panel px-3.5 py-2.5",
        )}
      >
        {line}
      </span>
    </div>
  );
}
