import { cn } from "@/lib/cn";

export function FloodlightMast({
  "data-part": part,
  className,
}: {
  "data-part"?: string;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-part={part}
      className={cn("pointer-events-none absolute h-75 w-0.5 scene-mast", className)}
    />
  );
}
