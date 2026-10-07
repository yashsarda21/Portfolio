import { cn } from "@/lib/cn";

export function PitchGlow({
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
      className={cn("pointer-events-none absolute scene-pitch-glow", className)}
    />
  );
}
