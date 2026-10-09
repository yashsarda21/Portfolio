import { cn } from "@/lib/cn";

type Range = [number, number];

/** A zone's inline position, in % of the track. Rounded so 53.5 - 46.5 reads 7%, not 7.000000000000007%. */
function span([from, to]: Range) {
  const pct = (n: number) => `${Math.round(n * 1000) / 1000}%`;
  return { left: pct(from), width: pct(to - from) };
}

interface TimingMeterProps {
  /** The stage's row above the track: where the cursor starts, the target zone (volt), where it ends. */
  labels?: { start: string; target: string; end: string };
  /** In % of the track: the good zone (volt .22) and the perfect zone (volt) inside it. */
  zones: { good: Range; perfect: Range };
  size: "stage" | "column";
  className?: string;
}

/**
 * The horizontal timing meter (Cricket-Play, Mobile-Game). Decorative: the announcer and the buttons carry the
 * game. The cursor's place is the CSS variable `--meter` (0 to 1), read from an ancestor (the game's clock writes it
 * on the game root); the cursor moves by transform only. The stage has a labels row and a glass track 18 high with
 * a 4x34 cursor; the column has no labels, a 16 high panel track and a 4x30 cursor.
 */
export function TimingMeter({ labels, zones, size, className }: TimingMeterProps) {
  const stage = size === "stage";
  return (
    <div
      aria-hidden="true"
      data-size={size}
      className={cn("flex w-full flex-col gap-3.5", className)}
    >
      {stage && labels ? (
        <div className="flex justify-between type-mono-label text-scout">
          <span>{labels.start}</span>
          <span className="text-volt">{labels.target}</span>
          <span>{labels.end}</span>
        </div>
      ) : null}
      <div
        className={cn(
          "relative w-full",
          stage ? "h-4.5 glass" : "h-4 border border-line-strong bg-panel",
        )}
      >
        <span
          data-part="good"
          className="absolute inset-y-0 bg-volt-a22"
          style={span(zones.good)}
        />
        <span
          data-part="perfect"
          className="absolute inset-y-0 bg-volt"
          style={span(zones.perfect)}
        />
        {/* 2px wider on each side so the cursor at 0 and 1 is not cut; only sideways is clipped. */}
        <div className="pointer-events-none absolute -inset-x-0.5 inset-y-0 overflow-x-clip">
          <div
            data-part="cursor"
            className="absolute inset-x-0.5 inset-y-0 will-change-transform"
            style={{ transform: "translateX(calc(var(--meter, 0) * 100%))" }}
          >
            <span
              className={cn(
                "absolute -top-2 -left-0.5 w-1 bg-white shadow-glow-cursor",
                stage ? "h-8.5" : "h-7.5",
              )}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
