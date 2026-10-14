import { cn } from "@/lib/cn";

/**
 * The big call after an input ("SIX.", "DOT BALL."): 120px on the stage, 64px on the phone's column, popping in.
 * It has no box of its own: the parent places it and gives it the width it may fill. A call that is wider than that
 * wraps onto balanced lines ("BACK LINE. / STILL HIS."), at the same size; one that fits stays on one line. Decorative, because the announcer speaks the call.
 * To play the pop again for the next call, give it a new `key`.
 */
export function CallOverlay({
  call,
  tone,
  size,
  className,
}: {
  call: string;
  /** volt: a call for you (DOT BALL, PERFECT WEIGHT); floodlight: his (FOUR, SIX). */
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
        "animate-pop text-center text-balance glow-call",
        size === "stage" ? "type-call" : "type-call-sm",
        tone === "volt" ? "text-volt" : "text-floodlight",
        className,
      )}
    >
      {call}
    </div>
  );
}
