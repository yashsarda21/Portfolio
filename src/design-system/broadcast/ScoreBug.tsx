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

function Name({ serving = false, children }: { serving?: boolean; children: ReactNode }) {
  const size = useContext(SizeCtx);
  return (
    <span
      className={cn(
        "flex items-center gap-2 bg-floodlight text-ground",
        size === "md" ? "px-3.5 type-score" : "px-2.5 type-d5",
      )}
    >
      {serving ? <span aria-hidden="true" className="size-1.75 rounded-full bg-volt-deep" /> : null}
      {children}
    </span>
  );
}

function Cell({ muted = false, children }: { muted?: boolean; children: ReactNode }) {
  const size = useContext(SizeCtx);
  return (
    <span
      className={cn(
        "flex items-center bg-panel tabular-nums",
        size === "md" ? "px-4 type-score-num" : "px-3 type-score",
        muted ? "border-l border-line text-scout" : "text-floodlight",
      )}
    >
      {children}
    </span>
  );
}

function Meta({ children }: { children: ReactNode }) {
  const size = useContext(SizeCtx);
  return (
    <span
      className={cn(
        "flex items-center bg-line text-text-2",
        size === "md" ? "px-3.5 type-mono-tag" : "px-2.5 type-mono-xs",
      )}
    >
      {children}
    </span>
  );
}

function Away({ tone = "panel", children }: { tone?: "panel" | "line"; children: ReactNode }) {
  const size = useContext(SizeCtx);
  return (
    <span
      className={cn(
        "flex items-center text-scout",
        tone === "panel" ? "border-l border-line bg-panel" : "bg-line",
        size === "md" ? "px-3.5 type-score" : "px-2.5 type-d5",
      )}
    >
      {children}
    </span>
  );
}

function Status({ alert = false, children }: { alert?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "font-bold flex items-center gap-2 px-3 type-mono-tag",
        alert ? "bg-panel text-floodlight" : "bg-volt text-volt-ink",
      )}
    >
      {alert ? <LiveDot size={6} /> : null}
      {children}
    </span>
  );
}

/** The broadcast score bug (top-centre in every game). */
export const ScoreBug = Object.assign(Root, { Name, Cell, Meta, Away, Status });
