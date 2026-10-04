import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState, type ReactNode } from "react";
import { CabinetGlass } from "./CabinetGlass";
import { Plinth } from "./Plinth";
import { ShelfLight } from "./ShelfLight";
import { Spotlight } from "./Spotlight";
import { Trophy, type TrophyKind } from "./Trophy";

const meta: Meta = { title: "Scene/Trophy Room" };
export default meta;

/** Trophy colours exist only inside the trophy zone, so every story draws in one. */
function Zone({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <div data-zone="trophy" className={`bg-ground ${className ?? ""}`}>
      {children}
    </div>
  );
}

const LABELS: Partial<Record<TrophyKind, string>> = { medal: "99.5", plaque: "PAPER" };
const KINDS: TrophyKind[] = ["cup", "medal", "plaque", "pennant", "round", "locked"];

/** All six figures, each on its plinth (the locked outline has its own dashed base). */
export const Kinds: StoryObj = {
  render: () => (
    <Zone className="grid grid-cols-3 gap-10 p-10">
      {KINDS.map((kind) => (
        <figure key={kind} className="flex flex-col items-center gap-3">
          <Trophy kind={kind} label={LABELS[kind]} />
          <figcaption className="type-mono-tag text-scout">{kind}</figcaption>
        </figure>
      ))}
    </Zone>
  ),
};

/** The lit trophy (lead, 220x300), the shelf's others (support) and the lower shelf (md). */
export const Spotlights: StoryObj = {
  render: () => (
    <Zone className="flex gap-6 p-6">
      {(
        [
          ["lead · lg", "lead", "lg"],
          ["support · lg", "support", "lg"],
          ["support · md", "support", "md"],
        ] as const
      ).map(([name, intensity, size], i) => (
        <figure key={name} className="flex flex-col items-center gap-3">
          <div className="relative flex h-80 w-60 items-end justify-center pb-4">
            <Spotlight intensity={intensity} size={size} index={i} />
            <Trophy kind="cup" className="relative" />
          </div>
          <figcaption className="type-mono-tag text-scout">{name}</figcaption>
        </figure>
      ))}
    </Zone>
  ),
};

const SHELF_ONE: { kind: TrophyKind; label?: string; name: string }[] = [
  { kind: "cup", name: "750+ PROBLEMS SOLVED" },
  { kind: "medal", label: "99.5", name: "99.5 PERCENTILE" },
  { kind: "plaque", label: "PAPER", name: "PUBLISHED RESEARCH" },
];
const SHELF_TWO: typeof SHELF_ONE = [
  { kind: "pennant", name: "DISTINCTION" },
  { kind: "round", name: "SYSTEM DESIGN BLOGS" },
  { kind: "locked", name: "GIANT KILLER" },
];

function Shelf({
  items,
  size,
  offset,
  lit,
  spinning,
  className,
}: {
  items: typeof SHELF_ONE;
  size: "lg" | "md";
  offset: number;
  lit?: number;
  spinning?: boolean;
  className: string;
}) {
  return (
    <div className={`absolute inset-x-0 grid grid-cols-3 ${className}`}>
      {items.map(({ kind, label, name }, i) => (
        <div key={name} className="relative flex flex-col items-center justify-end gap-3.5 pb-4">
          {kind === "locked" ? null : (
            <Spotlight intensity={lit === i ? "lead" : "support"} size={size} index={offset + i} />
          )}
          <Trophy kind={kind} label={label} spinning={spinning && lit === i} className="relative" />
          <span className="type-d5 text-floodlight">{name}</span>
        </div>
      ))}
    </div>
  );
}

function Cabinet({ spinning = false }: { spinning?: boolean }) {
  return (
    <Zone className="p-6">
      <div className="relative h-150 w-200 overflow-hidden border border-line bg-linear-180 from-cabinet-hi to-cabinet-lo shadow-inset-cabinet">
        <CabinetGlass />
        <Shelf
          items={SHELF_ONE}
          size="lg"
          offset={0}
          lit={0}
          spinning={spinning}
          className="top-0 h-77.5"
        />
        <ShelfLight className="top-77" />
        <Shelf items={SHELF_TWO} size="md" offset={3} className="top-80.5 bottom-0" />
      </div>
    </Zone>
  );
}

/** A two-shelf cabinet: spotlights drop one after another, a shelf light under each, glass in front. */
export const MiniCabinet: StoryObj = { render: () => <Cabinet /> };

/** The lit trophy on a turntable (12s); reduced motion leaves it standing still. */
export const Turntable: StoryObj = {
  render: function Render() {
    const [spinning, setSpinning] = useState(true);
    return (
      <div className="flex flex-col gap-4">
        <button
          type="button"
          aria-pressed={spinning}
          onClick={() => setSpinning((s) => !s)}
          className="w-max border border-line-strong px-4 py-2 type-mono-label text-floodlight"
        >
          {spinning ? "TURNTABLE ON" : "TURNTABLE OFF"}
        </button>
        <Cabinet spinning={spinning} />
      </div>
    );
  },
};

/** The plinths alone, at both heights. */
export const Plinths: StoryObj = {
  render: () => (
    <Zone className="flex items-end gap-6 p-6">
      <Plinth size="lg" />
      <Plinth size="md" />
    </Zone>
  ),
};
