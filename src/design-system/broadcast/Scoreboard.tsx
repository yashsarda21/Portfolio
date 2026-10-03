import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { MonoLabel } from "../primitives/Text";

function Root({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div
      className={cn(
        "relative flex flex-col overflow-hidden border border-line-strong bg-board led-dots shadow-board",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Header({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-13.25 shrink-0 items-center justify-between border-b border-board-line px-7 type-mono-eyebrow text-scout">
      {children}
    </div>
  );
}

function Body({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center gap-3.5">{children}</div>;
}

function Title({ children }: { children: ReactNode }) {
  return <span className="type-hero text-led glow-led">{children}</span>;
}

function Subtitle({ children }: { children: ReactNode }) {
  // Padding-left equal to the tracking keeps wide-tracked text optically centred.
  return <span className="pl-[0.42em] type-sub text-volt glow-volt">{children}</span>;
}

function Footer({ children }: { children: ReactNode }) {
  return (
    <div className="grid h-17.75 shrink-0 grid-cols-3 border-t border-board-line">{children}</div>
  );
}

const VALUE_TONE = { primary: "text-floodlight", volt: "text-volt", label: "text-scout" } as const;
const ALIGN = {
  start: "px-7",
  center: "justify-center border-x border-board-line",
  end: "justify-end px-7",
} as const;

function FooterCell({
  label,
  value,
  tone = "primary",
  align = "start",
}: {
  label: string;
  value: ReactNode;
  tone?: keyof typeof VALUE_TONE;
  align?: keyof typeof ALIGN;
}) {
  return (
    <div className={cn("flex items-center gap-3.5", ALIGN[align])}>
      <MonoLabel tone="dim">{label}</MonoLabel>
      <span className={cn("type-score-lg", VALUE_TONE[tone])}>{value}</span>
    </div>
  );
}

/** The LED stadium scoreboard (Landing, Intro, mobile landing). Size it with className. */
export const Scoreboard = Object.assign(Root, {
  Header,
  Body,
  Title,
  Subtitle,
  Footer,
  FooterCell,
});
