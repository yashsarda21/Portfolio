import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import {
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  Shape,
  ShapeGeometry,
  type Group,
  type Mesh,
  type MeshBasicMaterial,
  type Object3D,
} from "three";
import type { GameLayout } from "../../engine/types";
import { Crowd } from "../../three/Crowd";
import { crowdColors } from "../../three/crowdKit";
import { Floodlight } from "../../three/Floodlight";
import { SETTINGS } from "../../three/settings";
import { tokenColor } from "../../three/tokens";
import { COURT, netHeightAt, sideSign } from "./court";
import type { WorldState } from "./world";

/** Where the fences stand: from the middle of the court to the side fence and the back fence (m). */
const FENCE = { x: COURT.doubles + COURT.runoff.side, z: COURT.half + COURT.runoff.back } as const;
/** Behind you the floor and the side walls run on this far past the back fence, to the near stand (the camera stands in this gap). */
const NEAR_Z = FENCE.z + 16;
/**
 * `lift` raises the volt band a hair above the wall's top, so their top faces are not in the same plane: two faces in one
 * plane take turns winning the depth test, which shows as a dashed, crawling edge along the whole top of the wall.
 */
const WALL = { height: 2.5, thick: 0.25, band: 0.14, lift: 0.01 } as const;
/** The stands: a gap beyond the wall, then steps of this tread and rise. */
const STANDS = { gap: 5, tiers: 8, tread: 1, rise: 0.7 } as const;
/** Each stand in the world: the way it faces away from the court (radians about y), where its front edge starts, its width. */
const SIDES = (() => {
  const back = FENCE.x + STANDS.gap + STANDS.tiers * STANDS.tread;
  return [
    { turn: Math.PI, edge: [0, -(FENCE.z + STANDS.gap)], width: back * 2 },
    { turn: 0, edge: [0, NEAR_Z], width: back * 2 },
    { turn: Math.PI / 2, edge: [FENCE.x + STANDS.gap, 0], width: (FENCE.z + STANDS.gap) * 2 },
    { turn: -Math.PI / 2, edge: [-(FENCE.x + STANDS.gap), 0], width: (FENCE.z + STANDS.gap) * 2 },
  ] as const;
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
/** How sharply the lines stay at the far end of the court, where the view is almost along the floor. */
const LINE_ANISOTROPY = 8;
/**
 * The open-side glow's strongest opacity, and the Hawk-Eye ellipse's size (m, width by depth): drawn `drawn` times as large,
 * because at 0.3 m it is a dozen pixels from the broadcast view.
 */
const GLOW_OPACITY = 0.18;
const MARK = { width: 0.3, depth: 0.18, drawn: 2 } as const;

/** One crowd seat: a random step of a random stand, facing the court. Sets position and rotation fully (the object is reused). */
const seatOnStands = (rand: () => number, at: Object3D) => {
  const side = SIDES[Math.floor(rand() * SIDES.length)]!;
  const tier = Math.floor(rand() * STANDS.tiers);
  const across = (rand() - 0.5) * side.width;
  const back = STANDS.tread * (tier + 0.25 + rand() * 0.5);
  const c = Math.cos(side.turn);
  const s = Math.sin(side.turn);
  at.position.set(
    side.edge[0] + across * c + back * s,
    STANDS.rise * (tier + 1),
    side.edge[1] - across * s + back * c,
  );
  at.rotation.set(0, side.turn + Math.PI, 0);
};

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

/** A flat, lit rectangle on the floor: `at` its centre (x, z), `size` its width by depth. */
function Flat({
  at,
  size,
  y,
  color,
}: {
  at: readonly [number, number];
  size: readonly [number, number];
  y: number;
  color: ReturnType<typeof tokenColor>;
}) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[at[0], y, at[1]]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

/**
 * The court's markings (baselines, doubles and singles sidelines, service lines, the centre service line, the centre
 * marks) as ONE texture on one plane, not a dozen thin meshes. A line a few centimetres wide is under a pixel wide from
 * the broadcast view, and as geometry it shimmers: it breaks into dashes and crawls as the camera pans. As a texture
 * it is mipmapped and anisotropically filtered, so far away it fades smoothly instead of flickering. The canvas holds
 * only the coverage (white where there is line); the plane's colour is the line token.
 */
function CourtLines({
  layout,
  color,
  y,
}: {
  layout: GameLayout;
  color: ReturnType<typeof tokenColor>;
  y: number;
}) {
  const gl = useThree((s) => s.gl);
  const texture = useMemo(() => {
    const per = LINE_TEXELS[layout];
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(COURT.doubles * 2 * per);
    canvas.height = Math.round(COURT.half * 2 * per);
    const g = canvas.getContext("2d")!;
    g.fillStyle = "black"; // a coverage mask, not a palette colour
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = "white";
    const w = COURT.line;
    // A rectangle by its centre (x, z) and size, in metres from the court's middle. Each line lies inside the outer
    // edge of its measure (ITF sizes are to the outside of the line).
    const rect = (x: number, z: number, width: number, depth: number) =>
      g.fillRect(
        (x - width / 2 + COURT.doubles) * per,
        (z - depth / 2 + COURT.half) * per,
        width * per,
        depth * per,
      );
    for (const k of [-1, 1]) {
      rect(0, k * (COURT.half - w / 2), COURT.doubles * 2, w);
      rect(0, k * (COURT.service - w / 2), COURT.singles * 2, w);
      rect(k * (COURT.doubles - w / 2), 0, w, COURT.half * 2);
      rect(k * (COURT.singles - w / 2), 0, w, COURT.half * 2);
      rect(0, k * (COURT.half - 0.05), w, 0.1);
    }
    rect(0, 0, w, COURT.service * 2);
    const t = new CanvasTexture(canvas);
    t.anisotropy = Math.min(LINE_ANISOTROPY, gl.capabilities.getMaxAnisotropy());
    return t;
  }, [layout, gl]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, y, 0]} renderOrder={-1}>
      <planeGeometry args={[COURT.doubles * 2, COURT.half * 2]} />
      <meshBasicMaterial
        color={color}
        alphaMap={texture}
        transparent
        depthWrite={false}
        polygonOffset
        polygonOffsetFactor={-1}
        polygonOffsetUnits={-1}
      />
    </mesh>
  );
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

/** The four dark walls at the fences, each with a volt band along its top. */
function Walls({ c }: { c: ReturnType<typeof palette> }) {
  const walls = [
    { at: [0, -FENCE.z], size: [FENCE.x * 2, WALL.thick] },
    { at: [-FENCE.x, (NEAR_Z - FENCE.z) / 2], size: [WALL.thick, NEAR_Z + FENCE.z] },
    { at: [FENCE.x, (NEAR_Z - FENCE.z) / 2], size: [WALL.thick, NEAR_Z + FENCE.z] },
  ] as const;
  return (
    <>
      {walls.map(({ at, size }) => (
        <group key={`${at[0]}:${at[1]}`} position={[at[0], 0, at[1]]}>
          <mesh position={[0, WALL.height / 2, 0]}>
            <boxGeometry args={[size[0], WALL.height, size[1]]} />
            <meshLambertMaterial color={c.wall} />
          </mesh>
          <mesh position={[0, WALL.height - WALL.band / 2 + WALL.lift, 0]}>
            <boxGeometry args={[size[0] + 0.02, WALL.band, size[1] + 0.02]} />
            <meshBasicMaterial color={c.volt} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** The tiers of the four stands: each step a box from the floor to its top (the crowd sits on those tops). */
function Stands({ c }: { c: ReturnType<typeof palette> }) {
  return (
    <>
      {SIDES.map((side) => (
        <group key={side.turn} position={[side.edge[0], 0, side.edge[1]]} rotation-y={side.turn}>
          {Array.from({ length: STANDS.tiers }, (_, k) => {
            const height = STANDS.rise * (k + 1);
            return (
              <mesh key={k} position={[0, height / 2, STANDS.tread * (k + 0.5)]}>
                <boxGeometry args={[side.width, height, STANDS.tread]} />
                <meshLambertMaterial color={c.stand} flatShading />
              </mesh>
            );
          })}
        </group>
      ))}
    </>
  );
}

/** The open side's glow on Yash's half, and the Hawk-Eye ellipse where an OUT ball landed; both follow the shotlist. */
function Marks({
  world,
  c,
}: {
  world: RefObject<WorldState | null>;
  c: ReturnType<typeof palette>;
}) {
  const glow = useRef<Mesh>(null);
  const mark = useRef<Group>(null);
  useFrame(() => {
    const w = world.current;
    const g = glow.current;
    const m = mark.current;
    if (!w || !g || !m) return;
    const t = w.elapsed();
    const on = w.shotlist.glow(t);
    g.visible = on !== null;
    if (on) {
      g.position.x = sideSign(on.side) * (COURT.singles / 2);
      (g.material as MeshBasicMaterial).opacity = GLOW_OPACITY * on.strength;
    }
    // A mark from the point before (the call's walk starts its own clock) is already down.
    const at = w.shotlist.mark;
    m.visible = at !== null && (t >= at.from || at.from > w.shotlist.end);
    if (at) m.position.set(at.at[0], LAYER.mark, at.at[2]);
  });
  return (
    <>
      <mesh
        ref={glow}
        visible={false}
        rotation-x={-Math.PI / 2}
        position={[0, LAYER.glow, -COURT.half / 2]}
      >
        <planeGeometry args={[COURT.singles, COURT.half]} />
        <meshBasicMaterial color={c.volt} transparent opacity={0} depthWrite={false} />
      </mesh>
      <group
        ref={mark}
        visible={false}
        rotation-x={-Math.PI / 2}
        scale={[(MARK.width * MARK.drawn) / 2, (MARK.depth * MARK.drawn) / 2, 1]}
      >
        <mesh>
          <ringGeometry args={[0.62, 1, 32]} />
          <meshBasicMaterial color={c.volt} side={DoubleSide} depthWrite={false} />
        </mesh>
        <mesh>
          <circleGeometry args={[0.62, 32]} />
          <meshBasicMaterial
            color={c.volt}
            side={DoubleSide}
            transparent
            opacity={0.4}
            depthWrite={false}
          />
        </mesh>
      </group>
    </>
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
      <CourtLines layout={layout} color={c.line} y={LAYER.line} />

      <Net c={c} />
      <Walls c={c} />
      <Stands c={c} />
      <Crowd
        count={Math.round(settings.crowd * CROWD_SHARE)}
        colors={crowd}
        seat={seatOnStands}
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
      <Marks world={world} c={c} />
    </group>
  );
}
