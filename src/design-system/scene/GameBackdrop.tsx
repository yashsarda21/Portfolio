import { useId } from "react";
import { cn } from "@/lib/cn";
import { CrowdTier } from "./CrowdTier";
import { FloodlightBank } from "./FloodlightBank";
import { SkyGlow } from "./SkyGlow";
import { VenueGlow } from "./VenueGlow";

type Venue = "turf" | "court" | "hall";
type Frame = "stage" | "column";

/** A court seen from behind the baseline, in the 1440x900 design space (Tennis-Play and Badminton-Play). */
interface CourtArt {
  surround: string;
  surface: string;
  /** Each line as x1, y1, x2, y2. The surface outline is drawn with them. */
  lines: ReadonlyArray<readonly [number, number, number, number]>;
  /** The column's crop: the court and its surround, wide enough to fill the screen's width when sliced from the top. */
  crop: string;
  /** The net: its top-left corner, width, full height (tape included) and mesh size. */
  net: { x: number; y: number; w: number; h: number; mesh: number };
  /** The hall's two net posts: `top` and `height`, 4 wide, at the net's two ends. */
  posts: { top: number; height: number; xs: readonly [number, number] } | null;
}

const COURT: Record<"court" | "hall", CourtArt> = {
  court: {
    surround: "500,330 940,330 1340,900 100,900",
    surface: "560,340 880,340 1240,880 200,880",
    lines: [
      [600, 340, 330, 880],
      [840, 340, 1110, 880],
      [565, 410, 875, 410],
      [440, 660, 1000, 660],
      [720, 410, 720, 660],
    ],
    crop: "100 330 1240 570",
    net: { x: 436, y: 462, w: 568, h: 44, mesh: 7 },
    posts: null,
  },
  hall: {
    surround: "560,290 880,290 1160,880 280,880",
    surface: "600,300 840,300 1100,860 340,860",
    lines: [
      [618, 300, 397, 860],
      [822, 300, 1043, 860],
      [591, 318, 849, 318],
      [521, 470, 919, 470],
      [460, 600, 980, 600],
      [358, 820, 1082, 820],
      [720, 300, 720, 470],
      [720, 600, 720, 860],
    ],
    crop: "280 290 880 590",
    net: { x: 490, y: 482, w: 460, h: 42, mesh: 6 },
    posts: { top: 470, height: 60, xs: [486, 950] },
  },
};

/** The court's polygons and lines (the SVG's children). The net follows in the column, where it scales with the court. */
function CourtShapes({ art }: { art: CourtArt }) {
  return (
    <>
      <polygon points={art.surround} className="game-fill-surround" />
      <polygon points={art.surface} className="game-fill-surface" />
      <g className="fill-none stroke-court-line" strokeWidth={2.5}>
        <polygon points={art.surface} />
        {art.lines.map(([x1, y1, x2, y2]) => (
          <line key={`${x1}-${y1}-${x2}-${y2}`} x1={x1} y1={y1} x2={x2} y2={y2} />
        ))}
      </g>
    </>
  );
}

/** The net as SVG, for the column: the tape on top of a dim mesh, and the hall's two posts. */
function CourtNet({ venue, art }: { venue: "court" | "hall"; art: CourtArt }) {
  const { x, y, w, h, mesh } = art.net;
  // Unique per instance: two backdrops on one page (a story, a resize) never share a pattern.
  const id = `game-mesh-${venue}-${useId().replace(/\W/g, "")}`;
  return (
    <>
      <defs>
        <pattern id={id} width={mesh} height={mesh} patternUnits="userSpaceOnUse" x={x} y={y + 4}>
          <path
            d={`M0.5 0V${mesh}M0 0.5H${mesh}`}
            className="fill-none stroke-white-a16"
            strokeWidth={1}
          />
        </pattern>
      </defs>
      <rect x={x} y={y + 4} width={w} height={h - 4} className="fill-ground-a35" />
      <rect x={x} y={y + 4} width={w} height={h - 4} fill={`url(#${id})`} />
      <rect x={x} y={y} width={w} height={4} className="fill-floodlight" />
      {art.posts?.xs.map((px) => (
        <rect
          key={px}
          x={px}
          y={art.posts!.top}
          width={4}
          height={art.posts!.height}
          className="fill-scout"
        />
      ))}
    </>
  );
}

/** Cricket-Play: the bowler's end looking down the pitch at Yash, who bats at the far end. */
function TurfStage() {
  return (
    <>
      <SkyGlow data-part="sky" y="30%" w="70%" h="50%" alpha={0.14} />
      <CrowdTier
        data-part="crowd"
        className="-inset-x-15 top-37.5 h-50 [--crowd-peak:45%] game-crowd-peak"
      />
      <FloodlightBank data-part="bank-1" size="game" className="top-17.5 left-42.5" />
      <FloodlightBank data-part="bank-2" size="game" className="top-17.5 right-42.5" />
      <div
        data-part="outfield"
        className="absolute inset-x-0 top-75 bottom-0 game-outfield-fade game-outfield"
      />
      <div data-part="vignette" className="absolute inset-x-0 top-75 bottom-0 game-vignette" />
      <div data-part="pitch" className="absolute inset-x-0 top-79.5 bottom-0 game-pitch" />
      <div
        data-part="crease-far"
        className="absolute top-83.75 left-171.75 h-0.5 w-16.5 bg-white/80"
      />
      <div
        data-part="crease-near"
        className="absolute top-197.5 left-143.75 h-0.75 w-72.5 bg-white/85"
      />
      <div data-part="stumps-far" className="absolute top-77 left-178 flex gap-1">
        <span className="h-6.5 w-0.75 game-stump" />
        <span className="h-6.5 w-0.75 game-stump" />
        <span className="h-6.5 w-0.75 game-stump" />
      </div>
      <svg
        data-part="zones"
        viewBox="0 0 1440 900"
        className="pointer-events-none absolute inset-0 size-full"
      >
        <polygon points="689,365 751,365 756,400 684,400" className="fill-volt-a16" />
        <polygon points="692,346 748,346 750,360 690,360" className="fill-volt/55" />
      </svg>
      <div
        data-part="bat"
        className="absolute top-71.5 left-179 h-10 w-2 origin-bottom -rotate-22 shadow-bat game-bat"
      />
      <div data-part="stumps-near" className="absolute top-197.5 left-149 flex gap-2.75 opacity-85">
        <span className="h-30 w-1.75 game-stump-near" />
        <span className="h-30 w-1.75 game-stump-near" />
        <span className="h-30 w-1.75 game-stump-near" />
      </div>
    </>
  );
}

/** Tennis-Play: the court from behind the baseline, a lit crowd above the far end. The LED board is a broadcast part. */
function CourtStage() {
  const art = COURT.court;
  return (
    <>
      <VenueGlow data-part="venue" y="60%" w="70%" h="55%" alpha={0.55} />
      <SkyGlow data-part="sky" w="60%" h="40%" alpha={0.14} />
      <CrowdTier
        data-part="crowd"
        className="-inset-x-15 top-30 h-50 opacity-60 [--crowd-peak:50%] game-crowd-peak"
      />
      <svg
        data-part="court"
        viewBox="0 0 1440 900"
        className="pointer-events-none absolute inset-0 size-full"
      >
        <CourtShapes art={art} />
      </svg>
      <div
        data-part="net"
        className="absolute top-115.5 left-109 box-border h-11 w-142 border-t-4 border-floodlight game-net"
      />
    </>
  );
}

/** Badminton-Play: an indoor hall under one warm lamp, its beam falling on the court. */
function HallStage() {
  const art = COURT.hall;
  return (
    <>
      <VenueGlow data-part="venue" y="55%" w="50%" h="60%" alpha={0.45} />
      <div data-part="roof" className="absolute inset-x-0 top-0 h-30 game-roof-ribs" />
      <div
        data-part="beam"
        className="absolute top-0 left-130 h-225 w-100 game-hall-beam scene-cone-down"
      />
      <div
        data-part="lamp"
        className="absolute -top-1.5 left-172.5 h-4 w-15 game-lamp shadow-lamp"
      />
      <CrowdTier
        data-part="crowd"
        className="-inset-x-15 top-37.5 h-40 opacity-60 [--crowd-peak:50%] game-crowd-peak"
      />
      <svg
        data-part="court"
        viewBox="0 0 1440 900"
        className="pointer-events-none absolute inset-0 size-full"
      >
        <CourtShapes art={art} />
      </svg>
      <div
        data-part="net"
        className="absolute top-120.5 left-122.5 box-border h-10.5 w-115 border-t-4 border-floodlight [--mesh:6px] game-net"
      />
      <div data-part="post" className="absolute top-117.5 left-121.5 h-15 w-1 bg-scout" />
      <div data-part="post" className="absolute top-117.5 left-237.5 h-15 w-1 bg-scout" />
    </>
  );
}

/** Mobile-Game: the pitch rising away from the thumb, in the phone's screen. All numbers are the 390x844 board's. */
function TurfColumn() {
  return (
    <>
      <SkyGlow data-part="sky" y="20%" w="100%" h="40%" alpha={0.14} />
      <div
        data-part="outfield"
        className="absolute inset-x-0 top-50 bottom-0 game-outfield [--edge:28%] [--stripe:40px]"
      />
      <div
        data-part="pitch"
        className="absolute inset-x-0 top-52.5 bottom-0 game-pitch [--foot:34%] [--top:46%]"
      />
      <div data-part="stumps-far" className="absolute top-49.5 left-1/2 -ml-2.25 flex gap-0.75">
        <span className="h-4.5 w-0.5 game-stump" />
        <span className="h-4.5 w-0.5 game-stump" />
        <span className="h-4.5 w-0.5 game-stump" />
      </div>
      <div
        data-part="length"
        className="absolute top-58 left-1/2 -ml-4.75 h-1.5 w-9.5 bg-volt/55"
      />
    </>
  );
}

/** The stage's court, cropped to the court and sliced to the column's width, from 200px down like the turf. The net and lines scale with it. */
function CourtColumn({ venue }: { venue: "court" | "hall" }) {
  const art = COURT[venue];
  return (
    <>
      <SkyGlow data-part="sky" y="20%" w="100%" h="40%" alpha={0.14} />
      <div className="absolute inset-x-0 top-50 bottom-0">
        <svg
          data-part="court"
          viewBox={art.crop}
          preserveAspectRatio="xMidYMin slice"
          className="size-full"
        >
          <CourtShapes art={art} />
          <CourtNet venue={venue} art={art} />
        </svg>
      </div>
    </>
  );
}

/**
 * The scene behind a game: cricket's turf, tennis's court or badminton's hall, as the 1440x900 stage (Cricket-Play,
 * Tennis-Play, Badminton-Play) or as the phone's column (Mobile-Game; the court and the hall are derived from the
 * stage). Decorative, and it fills its parent. The markers, tracers, boards and cards sit above it.
 */
export function GameBackdrop({
  venue,
  frame,
  className,
}: {
  venue: Venue;
  frame: Frame;
  className?: string;
}) {
  return (
    <div
      aria-hidden="true"
      data-venue={venue}
      data-frame={frame}
      className={cn("pointer-events-none absolute inset-0 overflow-hidden bg-ground", className)}
    >
      {frame === "stage" ? (
        venue === "turf" ? (
          <TurfStage />
        ) : venue === "court" ? (
          <CourtStage />
        ) : (
          <HallStage />
        )
      ) : venue === "turf" ? (
        <TurfColumn />
      ) : (
        <CourtColumn venue={venue} />
      )}
    </div>
  );
}
