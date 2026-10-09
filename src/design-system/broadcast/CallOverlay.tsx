import { cn } from "@/lib/cn";

/**
 * The big call after an input ("SIX.", "DOT BALL."): 120px on the stage, 64px on the phone's column, popping in.
 * It has no box of its own: the parent places and centres it. Decorative, because the announcer speaks the call.
 * To play the pop again for the next call, give it a new `key`.
 */
export function CallOverlay({
  call,
  tone,
  size,
  className,
}: {
  call: string;
  /** volt: a call for you (DOT BALL, BOWLED HIM); floodlight: his (FOUR, SIX). */
  tone: "volt" | "floodlight";
  size: "stage" | "column";
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-tone={tone}
      data-size={size}
      className={cn(
        "animate-pop text-center glow-call",
        size === "stage" ? "type-call" : "type-call-sm",
        tone === "volt" ? "text-volt" : "text-floodlight",
        className,
      )}
    >
      {call}
    </div>
  );
}
