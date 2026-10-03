import { cn } from "@/lib/cn";

const SIZE = { 6: "size-1.5", 8: "size-2", 10: "size-2.5" } as const;

/** Live signal dot — the only place live-red appears (never a fill). */
export function LiveDot({
  size = 8,
  pulse = false,
  className,
}: {
  size?: 6 | 8 | 10;
  pulse?: boolean;
  className?: string;
}) {
  return (
    <span
      aria-hidden="true"
      className={cn(
        "inline-block shrink-0 rounded-full bg-live",
        SIZE[size],
        pulse && "animate-live-pulse",
        className,
      )}
    />
  );
}
