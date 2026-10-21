import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import {
  DirectionalLight,
  DoubleSide,
  Shape,
  ShapeGeometry,
  type Mesh,
  type MeshBasicMaterial,
} from "three";
import type { GameLayout } from "../../engine/types";
import { Crowd } from "../../three/Crowd";
import { crowdColors } from "../../three/crowdKit";
import { Floodlight } from "../../three/Floodlight";
import { SETTINGS } from "../../three/settings";
import { tokenColor } from "../../three/tokens";
import {
  Boards,
  CourtLines,
  Flat,
  HawkEyeMark,
  seatOnStands,
  Stands,
  type StandSide,
  type Wall,
} from "../../three/venue";
import { COURT, netHeightAt, sideSign } from "./court";
import type { WorldState } from "./world";

/** Where the fences stand: from the middle of the court to the side fence and the back fence (m). */
const FENCE = { x: COURT.doubles + COURT.runoff.side, z: COURT.half + COURT.runoff.back } as const;
/** Behind you the floor and the side walls run on this far past the back fence, to the near stand (the camera stands in this gap). */
const NEAR_Z = FENCE.z + 16;
/** The walls: how tall (m), how thick, and how tall the volt band on top is. */
const WALL = { height: 2.5, thick: 0.25, band: 0.14 } as const;
/** The three walls (the near side is open to the camera): the far one, and one down each side. */
const WALLS: readonly Wall[] = [
  { at: [0, -FENCE.z], size: [FENCE.x * 2, WALL.thick] },
  { at: [-FENCE.x, (NEAR_Z - FENCE.z) / 2], size: [WALL.thick, NEAR_Z + FENCE.z] },
  { at: [FENCE.x, (NEAR_Z - FENCE.z) / 2], size: [WALL.thick, NEAR_Z + FENCE.z] },
];
/** The stands: a gap beyond the wall, then steps of this tread and rise. */
const STANDS = { gap: 5, tiers: 8, tread: 1, rise: 0.7 } as const;
/** Each stand in the world: the way it faces away from the court (radians about y), where its front edge starts, its width. */
const SIDES: readonly StandSide[] = (() => {
  const back = FENCE.x + STANDS.gap + STANDS.tiers * STANDS.tread;
  return [
    { turn: Math.PI, edge: [0, -(FENCE.z + STANDS.gap)], width: back * 2 },
    { turn: 0, edge: [0, NEAR_Z], width: back * 2 },
    { turn: Math.PI / 2, edge: [FENCE.x + STANDS.gap, 0], width: (FENCE.z + STANDS.gap) * 2 },
    { turn: -Math.PI / 2, edge: [-(FENCE.x + STANDS.gap), 0], width: (FENCE.z + STANDS.gap) * 2 },
  ];
})();
const FLOODLIGHTS = [
  [-26, 0, -34],
  [26, 0, -34],
  [-26, 0, 30],
  [26, 0, 30],
] as const;
const FLOODLIGHT_HEIGHT = 24;
/** The stands are smaller than a cricket ground's, so they seat this share of the layout's crowd. */
const CROWD_SHARE = 0.4;
/** The net hangs from the tape (m thick) between its posts. */
const TAPE = 0.06;
/** Heights above the floor (m): each layer sits a hair above the one under it. */
const LAYER = { court: 0.002, line: 0.004, glow: 0.006, mark: 0.008 } as const;
/** The line texture's detail (texels per metre on the court): a 5 cm line is about 9 texels wide on the stage, 4 on a phone. */
const LINE_TEXELS: Record<GameLayout, number> = { stage: 186, column: 93 };
/** The court's size as the lines are drawn (m, width by depth): the doubles court. */
const COURT_SIZE = [COURT.doubles * 2, COURT.half * 2] as const;
/** The open-side glow's strongest opacity. */
const GLOW_OPACITY = 0.18;

/** One crowd seat: a random step of a random stand, facing the court. */
const seat = seatOnStands(SIDES, STANDS);

function palette() {
  const night = tokenColor("--ref-night");
  const court = tokenColor("--ref-court-hard");
  return {
    court,
    // The run-off is a shade darker than the court: the court's blue a third of the way toward its deep blue.
    runoff: court.clone().lerp(tokenColor("--ref-court-deep"), 0.45),
    line: tokenColor("--ref-floodlight"),
    volt: tokenColor("--ref-volt"),
    wall: tokenColor("--ref-line-3"),
    stand: tokenColor("--ref-line-3"),
    net: night,
    tape: tokenColor("--ref-white"),
    post: tokenColor("--ref-mast"),
    lamp: tokenColor("--ref-lamp"),
    sky: tokenColor("--ref-led-white"),
    floor: tokenColor("--ref-court-deep"),
  };
}

/**
 * The court's markings (baselines, doubles and singles sidelines, service lines, the centre service line, the centre
 * marks), laid out for `CourtLines`. Each line lies inside the outer edge of its measure (ITF sizes are to the outside
 * of the line).
 */
function drawLines(rect: (x: number, z: number, width: number, depth: number) => void) {
  const w = COURT.line;
  for (const k of [-1, 1]) {
    rect(0, k * (COURT.half - w / 2), COURT.doubles * 2, w);
    rect(0, k * (COURT.service - w / 2), COURT.singles * 2, w);
    rect(k * (COURT.doubles - w / 2), 0, w, COURT.half * 2);
    rect(k * (COURT.singles - w / 2), 0, w, COURT.half * 2);
    rect(0, k * (COURT.half - 0.05), w, 0.1);
  }
  rect(0, 0, w, COURT.service * 2);
}

/** The net: a dark see-through panel hung from a white tape that follows `netHeightAt`, with a post at each end. */
function Net({ c }: { c: ReturnType<typeof palette> }) {
  const geometry = useMemo(() => {
    const p = COURT.net.postX;
    const top = (x: number) => netHeightAt(x);
    const polygon = (points: [number, number][]) => {
      const shape = new Shape();
      points.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
      return shape;
    };
    const panel = polygon([
      [-p, 0],
      [p, 0],
      [p, top(p)],
      [0, top(0)],
      [-p, top(-p)],
    ]);
    const tape = polygon([
      [-p, top(-p) - TAPE],
      [0, top(0) - TAPE],
      [p, top(p) - TAPE],
      [p, top(p)],
      [0, top(0)],
      [-p, top(-p)],
    ]);
    return { panel: new ShapeGeometry(panel), tape: new ShapeGeometry(tape) };
  }, []);
  useEffect(
    () => () => {
      geometry.panel.dispose();
      geometry.tape.dispose();
    },
    [geometry],
  );
  return (
    <group>
      <mesh geometry={geometry.panel} renderOrder={1}>
        <meshBasicMaterial
          color={c.net}
          transparent
          opacity={0.45}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={geometry.tape} position={[0, 0, 0.002]}>
        <meshBasicMaterial color={c.tape} side={DoubleSide} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh key={k} position={[k * COURT.net.postX, COURT.net.post / 2, 0]} castShadow>
          <cylinderGeometry args={[0.05, 0.05, COURT.net.post, 8]} />
          <meshStandardMaterial color={c.post} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** The open side's glow on Yash's half; it follows the shotlist. */
function Glow({
  world,
  c,
}: {
  world: RefObject<WorldState | null>;
  c: ReturnType<typeof palette>;
}) {
  const glow = useRef<Mesh>(null);
  useFrame(() => {
    const w = world.current;
    const g = glow.current;
    if (!w || !g) return;
    const on = w.shotlist.glow(w.elapsed());
    g.visible = on !== null;
    if (on) {
      g.position.x = sideSign(on.side) * (COURT.singles / 2);
      (g.material as MeshBasicMaterial).opacity = GLOW_OPACITY * on.strength;
    }
  });
  return (
    <mesh
      ref={glow}
      visible={false}
      rotation-x={-Math.PI / 2}
      position={[0, LAYER.glow, -COURT.half / 2]}
    >
      <planeGeometry args={[COURT.singles, COURT.half]} />
      <meshBasicMaterial color={c.volt} transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/** The lit court, the net, the walls, the stands and crowd, the floodlights, and the two marks. Colours are all tokens. */
export function Arena({
  layout,
  world,
}: {
  layout: GameLayout;
  world: RefObject<WorldState | null>;
}) {
  const settings = SETTINGS[layout];
  const c = useMemo(() => palette(), []);
  const crowd = useMemo(() => crowdColors(), []);
  const sun = useMemo(() => {
    const light = new DirectionalLight(c.lamp, 3);
    light.position.set(-14, 30, 22);
    light.target.position.set(0, 0, 0);
    light.castShadow = settings.shadows;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow.camera, {
      left: -13,
      right: 13,
      top: 15,
      bottom: -15,
      near: 10,
      far: 80,
    });
    light.shadow.bias = -0.0004;
    light.shadow.normalBias = 0.02;
    light.shadow.camera.updateProjectionMatrix();
    return light;
  }, [c, settings.shadows]);
  useEffect(() => () => sun.dispose(), [sun]);

  return (
    <group>
      <hemisphereLight args={[c.sky, c.floor, 1.6]} />
      <primitive object={sun} />
      <primitive object={sun.target} />

      <Flat
        at={[0, (NEAR_Z - FENCE.z) / 2]}
        size={[FENCE.x * 2, NEAR_Z + FENCE.z]}
        y={0}
        color={c.runoff}
      />
      <Flat
        at={[0, 0]}
        size={[COURT.doubles * 2, COURT.half * 2]}
        y={LAYER.court}
        color={c.court}
      />
      <CourtLines
        layout={layout}
        size={COURT_SIZE}
        texels={LINE_TEXELS}
        draw={drawLines}
        color={c.line}
        y={LAYER.line}
      />

      <Net c={c} />
      <Boards walls={WALLS} height={WALL.height} band={WALL.band} color={c.wall} volt={c.volt} />
      <Stands
        sides={SIDES}
        tiers={STANDS.tiers}
        tread={STANDS.tread}
        rise={STANDS.rise}
        color={c.stand}
      />
      <Crowd
        count={Math.round(settings.crowd * CROWD_SHARE)}
        colors={crowd}
        seat={seat}
        up={() => world.current?.crowdUp ?? false}
      />
      {FLOODLIGHTS.map((at) => (
        <Floodlight
          key={`${at[0]}:${at[2]}`}
          at={at}
          aim={[0, 0, 0]}
          height={FLOODLIGHT_HEIGHT}
          color={c.lamp}
        />
      ))}
      <Glow world={world} c={c} />
      <HawkEyeMark world={world} color={c.volt} y={LAYER.mark} />
    </group>
  );
}
