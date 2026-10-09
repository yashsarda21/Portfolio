import { cn } from "@/lib/cn";

type Tone = "volt" | "floodlight" | "scout";
const TONE: Record<Tone, string> = {
  volt: "text-volt",
  floodlight: "text-floodlight",
  scout: "text-scout",
};

interface PowerMeterProps {
  /** In power %, counted from the bottom (the units the referee uses): the smash zone starts at `smashFrom`, the divider sits at `dividerAt`. */
  zones: { smashFrom: number; dividerAt: number };
  /** The stage's legend, top to bottom. A note is its lines. */
  legend: readonly { name: string; note: readonly string[]; tone: Tone }[];
  size: "stage" | "column";
  className?: string;
}

/**
 * The vertical power meter (Badminton-Play). Decorative. The fill is the CSS variable `--power` (0 to 1 of the
 * track), read from an ancestor and drawn by `scaleY` from the bottom, so it never lays out. The stage is 46x360
 * with its legend beside it; the column is the track alone, 28 wide, as tall as its parent.
 */
export function PowerMeter({ zones, legend, size, className }: PowerMeterProps) {
  const stage = size === "stage";
  const track = (
    <div
      className={cn(
        "relative border border-line-strong bg-inset",
        stage ? "h-full w-11.5 shrink-0" : "h-full w-7",
      )}
    >
      <span
        data-part="smash"
        className="absolute inset-x-0 top-0 border-b border-dashed border-volt bg-volt-a16"
        style={{ height: `${100 - zones.smashFrom}%` }}
      />
      <span
        data-part="divider"
        className="absolute inset-x-0 h-px bg-line-3"
        style={{ top: `${100 - zones.dividerAt}%` }}
      />
      {/* As drawn: 4px in from the sides and the floor, as tall as the track (it never gets there: the charge stops at 86%). */}
      <span
        data-part="fill"
        className="absolute inset-x-1 bottom-1 h-full origin-bottom bg-linear-to-t from-scout to-floodlight shadow-glow-power will-change-transform"
        style={{ transform: "scaleY(var(--power, 0))" }}
      />
    </div>
  );
  if (!stage) {
    return (
      <div aria-hidden="true" data-size={size} className={cn("h-full w-7", className)}>
        {track}
      </div>
    );
  }
  return (
    <div aria-hidden="true" data-size={size} className={cn("flex h-90 gap-4", className)}>
      {track}
      <div className="flex flex-col justify-between py-1.5">
        {legend.map((zone) => (
          <div key={zone.name} className="flex flex-col gap-1">
            <span className={cn("type-title-legend", TONE[zone.tone])}>{zone.name}</span>
            <span className="type-caption text-text-2">
              {zone.note.map((line, i) => (
                <span key={line}>
                  {i > 0 ? <br /> : null}
                  {line}
                </span>
              ))}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
