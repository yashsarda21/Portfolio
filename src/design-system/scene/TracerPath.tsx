import type { ReactNode } from "react";
import { useId } from "react";
import { cn } from "@/lib/cn";

/** The ellipse where a ball lands. */
export interface TracerBounce {
  cx: number;
  cy: number;
  rx: number;
  ry: number;
  tone: "volt" | "floodlight";
}

// The dashes, in the path's own units: the stage's 2.5 wide with "2 8", the phone's 2 wide with "2 7".
const DASH = {
  stage: { width: 2.5, dash: "2 8" },
  column: { width: 2, dash: "2 7" },
} as const;

/**
 * The Hawk-Eye line: a dashed volt path drawn over the ground in the `viewBox`'s own coordinates (it fills its
 * parent, so give it the same box as the scene). `draw` reveals it from its start: 0 shows nothing and 1 the
 * whole path, so a flight can draw it as the ball goes. `drawVar` names a CSS custom property (0 to 1, set on an
 * ancestor) that the reveal follows instead, so a game's frame loop can draw the path with no re-render; `draw` is
 * its value where the property is not set. `slice` fills the box the way a cropped court does (`xMidYMin slice`),
 * for a `viewBox` that is a crop of a wider drawing. `bounce` adds the landing ellipse; `children` (a ShuttleMark,
 * say) are drawn in the same coordinates. Decorative.
 */
export function TracerPath({
  d,
  viewBox,
  size,
  draw = 1,
  drawVar,
  slice = false,
  bounce,
  children,
  className,
}: {
  d: string;
  viewBox: string;
  size: "stage" | "column";
  /** How much of the path is shown, 0 to 1 (default 1). */
  draw?: number;
  /** A CSS custom property that sets the reveal, e.g. "--serve"; `draw` where it is unset. */
  drawVar?: string;
  /** Scale to fill the box and crop, keeping the top and the middle (a `viewBox` cropped from a wider drawing). */
  slice?: boolean;
  bounce?: TracerBounce;
  children?: ReactNode;
  className?: string;
}) {
  // The dashes are in path units, so the reveal is a second, solid path in a mask: it alone is measured in
  // fractions (pathLength 1) and leaves the dash pattern alone.
  const maskId = `tracer-${useId().replace(/\W/g, "")}`;
  const [x, y, w, h] = viewBox.split(/\s+/).map(Number);
  const { width, dash } = DASH[size];
  return (
    <svg
      aria-hidden="true"
      viewBox={viewBox}
      preserveAspectRatio={slice ? "xMidYMin slice" : undefined}
      className={cn("pointer-events-none absolute inset-0 size-full", className)}
    >
      <mask id={maskId} maskUnits="userSpaceOnUse" x={x} y={y} width={w} height={h}>
        <path
          data-part="reveal"
          d={d}
          pathLength={1}
          strokeDasharray={1}
          strokeDashoffset={1 - draw}
          style={drawVar ? { strokeDashoffset: `calc(1 - var(${drawVar}, ${draw}))` } : undefined}
          strokeWidth={width * 3}
          className="fill-none stroke-white"
        />
      </mask>
      <path
        data-part="tracer"
        d={d}
        mask={`url(#${maskId})`}
        strokeWidth={width}
        strokeDasharray={dash}
        strokeLinecap="round"
        className="fill-none stroke-volt"
      />
      {bounce && (
        <ellipse
          data-part="bounce"
          cx={bounce.cx}
          cy={bounce.cy}
          rx={bounce.rx}
          ry={bounce.ry}
          strokeWidth={2}
          className={cn("fill-none", bounce.tone === "volt" ? "stroke-volt" : "stroke-floodlight")}
        />
      )}
      {children}
    </svg>
  );
}

/**
 * The shuttle as the badminton board draws it: a cone and a cork, tipped 40 degrees, with its cork at (x, y).
 * It is SVG: give it to a TracerPath as a child, in the path's coordinates.
 */
export function ShuttleMark({ x, y, angle = 40 }: { x: number; y: number; angle?: number }) {
  return (
    <g data-part="shuttle" transform={`translate(${x} ${y}) rotate(${angle})`}>
      <path d="M0 0 L -9 -20 L 9 -20 Z" opacity={0.9} className="fill-floodlight" />
      <circle cx={0} cy={2} r={4} className="fill-floodlight" />
    </g>
  );
}
