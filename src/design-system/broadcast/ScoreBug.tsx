import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LiveDot } from "./LiveDot";

type Size = "md" | "sm";
const SizeCtx = createContext<Size>("md");

function Root({
  label,
  size = "md",
  children,
  className,
}: {
  label: string;
  size?: Size;
  children: ReactNode;
  className?: string;
}) {
  return (
    <SizeCtx.Provider value={size}>
      <div
        role="group"
        aria-label={label}
        className={cn("inline-flex items-stretch", size === "md" ? "h-11" : "h-10", className)}
      >
        {children}
      </div>
    </SizeCtx.Provider>
  );
}

interface PartProps {
  className?: string;
  children: ReactNode;
}

function Name({ serving = false, className, children }: PartProps & { serving?: boolean }) {
  const size = useContext(SizeCtx);
  return (
    <span
      className={cn(
        "flex items-center gap-2 bg-floodlight text-ground",
        size === "md" ? "px-3.5 type-score" : "px-2.5 type-d5",
        className,
      )}
    >
      {serving ? (
        // The ring keeps the dot readable (3:1) against the white chip.
        <span
          aria-hidden="true"
          className="size-1.75 rounded-full bg-volt-deep ring-1 ring-ground"
        />
      ) : null}
      {children}
    </span>
  );
}

function Cell({ muted = false, className, children }: PartProps & { muted?: boolean }) {
  const size = useContext(SizeCtx);
  return (
    <span
      className={cn(
        "flex items-center bg-panel tabular-nums",
        size === "md" ? "px-4 type-score-num" : "px-3 type-score",
        muted ? "border-l border-line text-scout" : "text-floodlight",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Meta({ className, children }: PartProps) {
  const size = useContext(SizeCtx);
  return (
    <span
      className={cn(
        "flex items-center bg-line text-text-2",
        size === "md" ? "px-3.5 type-mono-tag" : "px-2.5 type-mono-xs",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Away({ tone = "panel", className, children }: PartProps & { tone?: "panel" | "line" }) {
  const size = useContext(SizeCtx);
  return (
    <span
      className={cn(
        "flex items-center text-scout",
        tone === "panel" ? "border-l border-line bg-panel" : "bg-line",
        size === "md" ? "px-3.5 type-score" : "px-2.5 type-d5",
        className,
      )}
    >
      {children}
    </span>
  );
}

function Status({ alert = false, className, children }: PartProps & { alert?: boolean }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 px-3 type-mono-tag",
        // Its own argument, after the type recipe: cn drops a weight that precedes one, and
        // prettier's class sorter would move it to the front if it shared the string above.
        "font-bold",
        alert ? "bg-panel text-floodlight" : "bg-volt text-volt-ink",
        className,
      )}
    >
      {alert ? <LiveDot size={6} /> : null}
      {children}
    </span>
  );
}

/** The broadcast score bug (top-centre in every game). */
export const ScoreBug = Object.assign(Root, { Name, Cell, Meta, Away, Status });
