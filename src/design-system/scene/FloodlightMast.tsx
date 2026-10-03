import { cn } from "@/lib/cn";

export function FloodlightMast({ className }: { className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute h-75 w-0.5 scene-mast", className)}
    />
  );
}
