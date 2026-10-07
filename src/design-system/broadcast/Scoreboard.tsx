import { createContext, useContext } from "react";
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { MonoLabel } from "../primitives/Text";

/**
 * Named for where the board's shape comes from.
 * landing: Main (header 53, footer 71, three columns). intro: the Intro board (header 48 and footer 64 on the
 * board's own ground, the content placed freely between them). compact: Mobile-Landing (header 38, two columns).
 */
export type ScoreboardSize = "landing" | "intro" | "compact";

const SizeContext = createContext<ScoreboardSize>("landing");

/** A per-size record where the landing and the intro (the wide boards) share one value and compact has its own. */
function wideOr<T>(wide: T, compact: T): Record<ScoreboardSize, T> {
  return { landing: wide, intro: wide, compact };
}

const ROOT = wideOr("shadow-board", "shadow-board-compact");

function Root({
  size = "landing",
  className,
  children,
}: {
  size?: ScoreboardSize;
  className?: string;
  children: ReactNode;
}) {
  return (
    <SizeContext value={size}>
      <div
        className={cn(
          "relative flex flex-col overflow-hidden border border-line-strong bg-board led-dots",
          ROOT[size],
          className,
        )}
      >
        {children}
      </div>
    </SizeContext>
  );
}

interface PartProps {
  className?: string;
  children: ReactNode;
}

const HEADER: Record<ScoreboardSize, string> = {
  landing: "h-13.25 px-7 type-mono-eyebrow",
  intro: "absolute inset-x-0 top-0 z-5 h-12 bg-board px-7 type-mono-eyebrow",
  compact: "h-9.5 px-3.5 type-mono-label",
};

function Header({ className, children }: PartProps) {
  return (
    <div
      className={cn(
        "flex shrink-0 items-center justify-between border-b border-board-line text-scout",
        HEADER[useContext(SizeContext)],
        className,
      )}
    >
      {children}
    </div>
  );
}

const BODY = wideOr("gap-3.5", "gap-2.5 px-3.5 py-6.5");

function Body({ className, children }: PartProps) {
  return (
    <div
      className={cn(
        "flex flex-1 flex-col items-center justify-center",
        BODY[useContext(SizeContext)],
        className,
      )}
    >
      {children}
    </div>
  );
}

const TITLE: Record<ScoreboardSize, string> = {
  landing: "type-hero",
  intro: "type-hero-sm",
  compact: "type-hero-stack",
};

/** The big LED name. Renders a span; pass as="h1" where it is the page heading. */
function Title<T extends ElementType = "span">({
  as,
  className,
  children,
  ...rest
}: PolymorphicProps<T>) {
  const Comp: ElementType = as ?? "span";
  return (
    <Comp className={cn(TITLE[useContext(SizeContext)], "text-led glow-led", className)} {...rest}>
      {children}
    </Comp>
  );
}

// Padding-left equal to the tracking keeps wide-tracked, centred text optically centred. The Intro's
// subtitle is left-aligned, so it takes none.
const SUBTITLE: Record<ScoreboardSize, string> = {
  landing: "pl-[0.42em] type-sub",
  intro: "type-sub-lg",
  compact: "pl-[0.38em] type-sub-sm",
};

function Subtitle({ className, children }: PartProps) {
  return (
    <span className={cn(SUBTITLE[useContext(SizeContext)], "text-volt glow-volt", className)}>
      {children}
    </span>
  );
}

const FOOTER: Record<ScoreboardSize, string> = {
  landing: "h-17.75 grid-cols-3",
  intro: "absolute inset-x-0 bottom-0 z-5 h-16 grid-cols-3 bg-board",
  compact: "h-12 grid-cols-2",
};

function Footer({ className, children }: PartProps) {
  return (
    <div
      className={cn(
        "grid shrink-0 border-t border-board-line",
        FOOTER[useContext(SizeContext)],
        className,
      )}
    >
      {children}
    </div>
  );
}

const VALUE_TONE = { primary: "text-floodlight", volt: "text-volt", label: "text-scout" } as const;
const VALUE_TYPE: Record<ScoreboardSize, string> = {
  landing: "type-score-lg",
  intro: "type-score-md",
  compact: "type-d5",
};
// On the compact board the two cells split the width: the first has a divider, both are centred.
const ALIGN = wideOr<Record<"start" | "center" | "end", string>>(
  {
    start: "gap-3.5 px-7",
    center: "gap-3.5 justify-center border-x border-board-line",
    end: "gap-3.5 justify-end px-7",
  },
  {
    start: "gap-2 justify-center border-r border-board-line",
    center: "gap-2 justify-center border-x border-board-line",
    end: "gap-2 justify-center",
  },
);

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
  align?: "start" | "center" | "end";
}) {
  const size = useContext(SizeContext);
  return (
    <div className={cn("flex items-center", ALIGN[size][align], className)}>
      <MonoLabel tone="dim" variant={size === "compact" ? "mono-tag" : "mono-label"}>
        {label}
      </MonoLabel>
      <span className={cn(VALUE_TYPE[size], VALUE_TONE[tone])}>{value}</span>
    </div>
  );
}

/**
 * A light that crosses the board. It lives inside it (the board clips it) and rests invisible: the boot
 * (animate-boot-scan) or a timeline runs it. band: Main's 90px-high band sweeping down. bar: the Intro's
 * 90px-wide bar leading the entrance, between the header and footer.
 */
function Scan({ variant, className }: { variant: "band" | "bar"; className?: string }) {
  return (
    <div
      aria-hidden="true"
      data-part="scan"
      className={cn(
        "pointer-events-none absolute opacity-0",
        variant === "band"
          ? "inset-x-0 top-0 h-22.5 scene-scan-band"
          : "top-12 bottom-16 left-0 z-2 w-22.5 scene-scan-bar",
        className,
      )}
    />
  );
}

/**
 * The Intro board's power-up and impact rings (L14): two glow layers whose opacity a timeline tweens,
 * instead of animating the board's box-shadow. They draw outside the board, which clips its children, so
 * place Power NEXT TO the board, on the board's own box (same position and size classes). A board without
 * Power rests on its own shadow (the Landing).
 */
function Power({ className }: { className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute", className)}>
      <div
        aria-hidden="true"
        data-part="board-on"
        className="absolute inset-0 opacity-0 shadow-board-on"
      />
      <div
        aria-hidden="true"
        data-part="board-hit"
        className="absolute inset-0 opacity-0 shadow-board-hit"
      />
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
  Scan,
  Power,
});
