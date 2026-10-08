import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";
import { FloodlightBank, type FloodlightBankSize } from "./FloodlightBank";

interface Court {
  width: number;
  height: number;
  tilt: number;
  /** How far the sidelines sit in from the left and right edges. */
  inset: number;
  /** The service lines: `from` the near and far ends, running `inset` in from each side. */
  service: { from: number; inset: number };
  /** The net: `top` from the far end, overhanging each side by `overhang`; `lifted` draws the tennis net's top cord. */
  net: { top: number; overhang: number; lifted: boolean };
  surface: "hard" | "hall";
}

const SURFACE = { hard: "scene-court-hard", hall: "scene-court-hall" } as const;

/** A court seen from above, lying back by `tilt`. The tennis and the badminton court are the same drawing. The parent sets perspective. */
function PerspectiveCourt({ width, height, tilt, inset, service, net, surface }: Court) {
  return (
    <div
      data-part="court"
      className={cn("relative mx-auto scene-art-tilt", SURFACE[surface])}
      style={{ width, height, "--art-tilt": `${tilt}deg` } as CSSProperties}
    >
      <span
        className="absolute inset-y-0 border-x-2 border-court-line"
        style={{ left: inset, right: inset }}
      />
      <span
        className="absolute border-y-2 border-court-line"
        style={{
          left: service.inset,
          right: service.inset,
          top: service.from,
          bottom: service.from,
        }}
      />
      <span
        data-part="net"
        className={cn("absolute scene-net", net.lifted && "scene-net-lifted")}
        style={{ left: -net.overhang, right: -net.overhang, top: net.top }}
      />
    </div>
  );
}

const TENNIS: Court = {
  width: 130,
  height: 240,
  tilt: 60,
  inset: 14,
  service: { from: 62, inset: 14 },
  net: { top: 119, overhang: 10, lifted: true },
  surface: "hard",
};
const BADMINTON: Court = {
  width: 110,
  height: 230,
  tilt: 60,
  inset: 10,
  service: { from: 80, inset: 0 },
  net: { top: 114, overhang: 8, lifted: false },
  surface: "hall",
};

interface SceneSpec {
  /** The ground's ellipse reach (--art-w / --art-h), where it is not the 70% 60% default. */
  ground: string;
  banks: ReadonlyArray<{ size: FloodlightBankSize; className: string }>;
  /** The roof arc and the warm beam under it (the hall). */
  hall: boolean;
  /** The perspective box the oval or court stands in. */
  stage: string;
  /** What stands in it: the cricket oval, or a court. */
  floor: "oval" | Court;
}

// Hub.dc.html's three venue pictures, 200px high. Class strings stay literal so Tailwind sees them.
const SCENES = {
  turf: {
    ground: "",
    banks: [
      { size: "card", className: "top-1.5 left-7.5" },
      { size: "card", className: "top-1.5 right-7.5" },
    ],
    hall: false,
    stage: "top-10 -bottom-15",
    floor: "oval",
  },
  court: {
    ground: "",
    banks: [{ size: "card-wide", className: "inset-x-0 top-1.5 mx-auto" }],
    hall: false,
    stage: "top-7.5 -bottom-10",
    floor: TENNIS,
  },
  hall: {
    ground: "[--art-w:60%] [--art-h:70%]",
    banks: [],
    hall: true,
    stage: "top-10 -bottom-10",
    floor: BADMINTON,
  },
} as const satisfies Record<"turf" | "court" | "hall", SceneSpec>;

/**
 * The picture at the head of a venue card: floodlights over a court, an oval or a hall, 200px high and as wide
 * as its box. It sets its own `data-venue`, so the ground takes the venue's colours. Decorative.
 */
export function VenueArt({
  scene,
  className,
}: {
  scene: "turf" | "court" | "hall";
  className?: string;
}) {
  const spec: SceneSpec = SCENES[scene];
  return (
    <div
      aria-hidden="true"
      data-venue={scene}
      className={cn(
        "pointer-events-none relative h-50 overflow-hidden scene-venue-art",
        spec.ground,
        className,
      )}
    >
      {spec.hall && (
        <>
          <div
            data-part="roof"
            className="absolute -inset-x-5 -top-30 h-55 [border-radius:50%] border-b-2 border-white-a10"
          />
          <div
            data-part="beam"
            className="absolute inset-x-0 top-0 mx-auto h-50 w-40 scene-hall-beam"
          />
        </>
      )}
      {spec.banks.map((bank) => (
        <FloodlightBank
          key={bank.className}
          data-part="bank"
          size={bank.size}
          className={bank.className}
        />
      ))}
      <div className={cn("absolute inset-x-0 perspective-court", spec.stage)}>
        {spec.floor === "oval" ? (
          <div
            data-part="oval"
            className="mx-auto flex h-55 w-70 scene-art-tilt items-center justify-center [border-radius:50%] scene-oval [--art-tilt:58deg]"
          >
            <span data-part="wicket" className="h-18.5 w-4.5 scene-wicket" />
          </div>
        ) : (
          <PerspectiveCourt {...spec.floor} />
        )}
      </div>
    </div>
  );
}
