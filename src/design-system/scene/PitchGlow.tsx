import { cn } from "@/lib/cn";

export function PitchGlow({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute scene-pitch-glow", className)}
    />
  );
}
