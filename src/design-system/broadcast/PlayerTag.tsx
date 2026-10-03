import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LiveDot } from "./LiveDot";

/** On-field pill: "YASH · ON STRIKE · 14*". */
export function PlayerTag({
  live = true,
  children,
  className,
}: {
  live?: boolean;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-2 glass px-2.5 py-1.5 type-mono-tag text-floodlight",
        className,
      )}
    >
      {live ? <LiveDot size={6} /> : null}
      {children}
    </span>
  );
}
