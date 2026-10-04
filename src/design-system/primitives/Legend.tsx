import { cn } from "@/lib/cn";

type Swatch = "volt" | "floodlight" | "dim";

const SWATCH: Record<Swatch, string> = {
  volt: "bg-volt",
  floodlight: "bg-floodlight",
  dim: "bg-dim",
};

interface LegendProps {
  items: { label: string; swatch: Swatch }[];
  className?: string;
}

export function Legend({ items, className }: LegendProps) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4.5 gap-y-2", className)}>
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-2">
          <span aria-hidden="true" className={cn("h-2 w-4.5", SWATCH[item.swatch])} />
          <span className="type-mono-tag leading-auto text-scout">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
