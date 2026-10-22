import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import {
  BackSide,
  BoxGeometry,
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
import { COURT, netHeightAt } from "./court";
import type { WorldState } from "./world";

/** Where the boards stand: from the middle of the court to the side boards and the back boards (m). */
const RING = { x: COURT.doubles + COURT.runoff.side, z: COURT.half + COURT.runoff.back } as const;
/** The LED boards: how tall (m), how thick, and how tall the volt band on top is. */
const BOARD = { height: 0.6, thick: 0.1, band: 0.035 } as const;
/** The boards all round the run-off (the camera looks over the near one). */
const BOARDS: readonly Wall[] = [
  { at: [0, -RING.z], size: [RING.x * 2, BOARD.thick] },
  { at: [0, RING.z], size: [RING.x * 2, BOARD.thick] },
  { at: [-RING.x, 0], size: [BOARD.thick, RING.z * 2] },
  { at: [RING.x, 0], size: [BOARD.thick, RING.z * 2] },
];
/** The stands, a gap beyond the boards: steps of this tread and rise (m). */
const STANDS = { gap: 1.2, tiers: 8, tread: 1, rise: 0.7 } as const;
/** The stands on the two long sides and the far end (the camera stands behind the near end, with no stand there). */
const SIDES: readonly StandSide[] = (() => {
  const back = RING.x + STANDS.gap + STANDS.tiers * STANDS.tread;
  return [
    { turn: Math.PI, edge: [0, -(RING.z + STANDS.gap)], width: back * 2 },
    { turn: Math.PI / 2, edge: [RING.x + STANDS.gap, 0], width: (RING.z + STANDS.gap) * 2 },
    { turn: -Math.PI / 2, edge: [-(RING.x + STANDS.gap), 0], width: (RING.z + STANDS.gap) * 2 },
  ];
})();
/** The hall floor runs this far (m) past the near boards, to under the camera. */
const FLOOR_NEAR = 30;
/** The floor's half-width (m): out to the back of the side stands. */
const FLOOR_X = RING.x + STANDS.gap + STANDS.tiers * STANDS.tread;
/** The ceiling's height (m): well over the serve's peak (about 4.65 m), so nothing clips. */
const CEILING = 12;
/** The ceiling's light panels: rows along the hall (x of each row), the z of each panel along it, and a panel's size (m). */
const PANELS = { rows: [-4.5, 0, 4.5], z: [-10, -5, 0, 5, 10], size: [1.4, 0.12, 3] } as const;
/** The mat is the court plus this margin all round (m). */
const MAT_MARGIN = 0.5;
/** Seats the stands hold, as a share of the layout's crowd. */
const CROWD_SHARE = 0.4;
/** The net's tape (m thick) and how deep the mesh hangs below it (m, BWF). */
const TAPE = 0.075;
const NET_DEPTH = 0.76;
/** Heights above the floor (m): each layer sits a hair above the one under it. */
const LAYER = { mat: 0.002, line: 0.004, glow: 0.006, mark: 0.008 } as const;
/** The line texture's detail (texels per metre on the court): a 4 cm line is about 7 texels wide on the stage, 4 on a phone. */
const LINE_TEXELS: Record<GameLayout, number> = { stage: 186, column: 93 };
/** The court as the lines are drawn (m, width by depth): the doubles court. */
const COURT_SIZE = [COURT.doubles * 2, COURT.half * 2] as const;
/** The open part's glow, its strongest opacity. */
const GLOW_OPACITY = 0.2;

/** One crowd seat: a random step of a random stand, facing the court. */
const seat = seatOnStands(SIDES, STANDS);

function palette() {
  return {
    floor: tokenColor("--ref-hall-surround").lerp(tokenColor("--ref-night"), 0.3),
    mat: tokenColor("--ref-court-hall").lerp(tokenColor("--ref-volt"), 0.035),
    line: tokenColor("--ref-white"),
    volt: tokenColor("--ref-volt"),
    board: tokenColor("--ref-mast"),
    stand: tokenColor("--ref-stand-hi"),
    net: tokenColor("--ref-night"),
    tape: tokenColor("--ref-white"),
    post: tokenColor("--ref-line-hover"),
    lamp: tokenColor("--ref-lamp"),
    sky: tokenColor("--ref-led-white"),
    ceiling: tokenColor("--ref-night"),
  };
}

/**
 * The court's markings, laid out for `CourtLines` (BWF): the back lines, the doubles and singles sidelines, the short
 * service lines, the doubles long service lines and the centre lines. Each line lies inside the outer edge of its
 * measure (BWF sizes are to the outside of the line).
 */
function drawLines(rect: (x: number, z: number, width: number, depth: number) => void) {
  const w = COURT.line;
  for (const k of [-1, 1]) {
    rect(0, k * (COURT.half - w / 2), COURT.doubles * 2, w);
    rect(0, k * (COURT.shortService - w / 2), COURT.doubles * 2, w);
    rect(0, k * (COURT.half - COURT.longDoubles - w / 2), COURT.doubles * 2, w);
    rect(k * (COURT.doubles - w / 2), 0, w, COURT.half * 2);
    rect(k * (COURT.singles - w / 2), 0, w, COURT.half * 2);
    // The centre line, from the short service line to the back line.
    rect(0, (k * (COURT.shortService + COURT.half)) / 2, w, COURT.half - COURT.shortService);
  }
}

/** The net: a dark see-through mesh hung from a white tape that follows `netHeightAt`, with a post at each end. */
function Net({ c }: { c: ReturnType<typeof palette> }) {
  const geometry = useMemo(() => {
    const p = COURT.net.postX;
    const top = (x: number) => netHeightAt(x);
    const low = top(0) - NET_DEPTH;
    const polygon = (points: [number, number][]) => {
      const shape = new Shape();
      points.forEach(([x, y], i) => (i === 0 ? shape.moveTo(x, y) : shape.lineTo(x, y)));
      return shape;
    };
    return {
      panel: new ShapeGeometry(
        polygon([
          [-p, low],
          [p, low],
          [p, top(p)],
          [0, top(0)],
          [-p, top(-p)],
        ]),
      ),
      tape: new ShapeGeometry(
        polygon([
          [-p, top(-p) - TAPE],
          [0, top(0) - TAPE],
          [p, top(p) - TAPE],
          [p, top(p)],
          [0, top(0)],
          [-p, top(-p)],
        ]),
      ),
      post: new BoxGeometry(0.06, COURT.net.post, 0.06),
    };
  }, []);
  useEffect(
    () => () => {
      geometry.panel.dispose();
      geometry.tape.dispose();
      geometry.post.dispose();
    },
    [geometry],
  );
  return (
    <group>
      <mesh geometry={geometry.panel} renderOrder={1}>
        <meshBasicMaterial
          color={c.net}
          transparent
          opacity={0.5}
          side={DoubleSide}
          depthWrite={false}
        />
      </mesh>
      <mesh geometry={geometry.tape} position={[0, 0, 0.002]}>
        <meshBasicMaterial color={c.tape} side={DoubleSide} />
      </mesh>
      {[-1, 1].map((k) => (
        <mesh
          key={k}
          geometry={geometry.post}
          position={[k * COURT.net.postX, COURT.net.post / 2, 0]}
          castShadow
        >
          <meshStandardMaterial color={c.post} roughness={0.5} />
        </mesh>
      ))}
    </group>
  );
}

/** The open part's glow on Yash's half: the back half (deep) or the front half (short); it follows the shotlist. */
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
      g.position.z = on.part === "deep" ? (-COURT.half * 3) / 4 : -COURT.half / 4;
      (g.material as MeshBasicMaterial).opacity = GLOW_OPACITY * on.strength;
    }
  });
  return (
    <mesh ref={glow} visible={false} rotation-x={-Math.PI / 2} position={[0, LAYER.glow, 0]}>
      <planeGeometry args={[COURT.singles * 2, COURT.half / 2]} />
      <meshBasicMaterial color={c.volt} transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}

/** The dark ceiling with rows of lit panels (never in the camera's view, but it closes the hall over the serve's arc). */
function Ceiling({ c }: { c: ReturnType<typeof palette> }) {
  return (
    <group position={[0, CEILING, 0]}>
      <mesh rotation-x={-Math.PI / 2}>
        <planeGeometry args={[FLOOR_X * 2, FLOOR_NEAR + RING.z + 12]} />
        <meshBasicMaterial color={c.ceiling} side={BackSide} />
      </mesh>
      {PANELS.rows.flatMap((x) =>
        PANELS.z.map((z) => (
          <mesh key={`${x}:${z}`} position={[x, -0.1, z]}>
            <boxGeometry args={PANELS.size} />
            <meshStandardMaterial color={c.lamp} emissive={c.lamp} emissiveIntensity={2.5} />
          </mesh>
        )),
      )}
    </group>
  );
}

/** The lit hall: mat, lines, net, boards, stands and crowd, the ceiling's lights, the open part's glow and the mark. */
export function Hall({
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
    // The one light that casts shadows: from straight above the court, a little toward the camera's left.
    const light = new DirectionalLight(c.lamp, 3.5);
    light.position.set(-3, 24, 5);
    light.target.position.set(0, 0, 0);
    light.castShadow = settings.shadows;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow.camera, {
      left: -6,
      right: 6,
      top: 10,
      bottom: -10,
      near: 10,
      far: 40,
    });
    light.shadow.bias = -0.0004;
    light.shadow.normalBias = 0.02;
    light.shadow.camera.updateProjectionMatrix();
    return light;
  }, [c, settings.shadows]);
  useEffect(() => () => sun.dispose(), [sun]);

  return (
    <group>
      <hemisphereLight args={[c.sky, c.floor, 1.5]} />
      <primitive object={sun} />
      <primitive object={sun.target} />

      <Flat
        at={[0, (FLOOR_NEAR - RING.z) / 2]}
        size={[FLOOR_X * 2, FLOOR_NEAR + RING.z]}
        y={0}
        color={c.floor}
      />
      <Flat
        at={[0, 0]}
        size={[COURT_SIZE[0] + MAT_MARGIN * 2, COURT_SIZE[1] + MAT_MARGIN * 2]}
        y={LAYER.mat}
        color={c.mat}
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
      <Boards
        walls={BOARDS}
        height={BOARD.height}
        band={BOARD.band}
        color={c.board}
        volt={c.volt}
      />
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
      <Ceiling c={c} />
      <Glow world={world} c={c} />
      <HawkEyeMark world={world} color={c.volt} y={LAYER.mark} />
    </group>
  );
}
