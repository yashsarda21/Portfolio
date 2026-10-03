import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
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

interface PartProps {
  className?: string;
  children: ReactNode;
}

function Header({ className, children }: PartProps) {
  return (
    <div
      className={cn(
        "flex h-13.25 shrink-0 items-center justify-between border-b border-board-line px-7 type-mono-eyebrow text-scout",
        className,
      )}
    >
      {children}
    </div>
  );
}

function Body({ className, children }: PartProps) {
  return (
    <div className={cn("flex flex-1 flex-col items-center justify-center gap-3.5", className)}>
      {children}
    </div>
  );
}

/** The big LED name. Renders a span; pass as="h1" where it is the page heading. */
function Title<T extends ElementType = "span">({
  as,
  className,
  children,
  ...rest
}: PolymorphicProps<T>) {
  const Comp: ElementType = as ?? "span";
  return (
    <Comp className={cn("type-hero text-led glow-led", className)} {...rest}>
      {children}
    </Comp>
  );
}

function Subtitle({ className, children }: PartProps) {
  // Padding-left equal to the tracking keeps wide-tracked text optically centred.
  return (
    <span className={cn("pl-[0.42em] type-sub text-volt glow-volt", className)}>{children}</span>
  );
}

function Footer({ className, children }: PartProps) {
  return (
    <div className={cn("grid h-17.75 shrink-0 grid-cols-3 border-t border-board-line", className)}>
      {children}
    </div>
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
  className,
}: {
  className?: string;
  label: string;
  value: ReactNode;
  tone?: keyof typeof VALUE_TONE;
  align?: keyof typeof ALIGN;
}) {
  return (
    <div className={cn("flex items-center gap-3.5", ALIGN[align], className)}>
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
