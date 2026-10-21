import { useFrame, useThree } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import { CanvasTexture, DoubleSide, type Color, type Group, type Object3D } from "three";
import type { GameLayout } from "../engine/types";
import type { Vec3 } from "./track";

/** The pieces of an indoor venue that tennis and badminton share: the floor, the court's lines, the walls, the stands. */

/** How sharply the lines stay at the far end of the court, where the view is almost along the floor. */
const LINE_ANISOTROPY = 8;
/** The volt band sits this far (m) above the wall's top, so their top faces are not in the same plane. */
const BAND_LIFT = 0.01;
/** The Hawk-Eye ellipse's size (m, width by depth): drawn `drawn` times as large, because at 0.3 m it is a dozen pixels from the broadcast view. */
const MARK = { width: 0.3, depth: 0.18, drawn: 2 } as const;

/** A flat, lit rectangle on the floor: `at` its centre (x, z), `size` its width by depth. */
export function Flat({
  at,
  size,
  y,
  color,
}: {
  at: readonly [number, number];
  size: readonly [number, number];
  y: number;
  color: Color;
}) {
  return (
    <mesh rotation-x={-Math.PI / 2} position={[at[0], y, at[1]]} receiveShadow>
      <planeGeometry args={size} />
      <meshStandardMaterial color={color} roughness={0.85} />
    </mesh>
  );
}

/**
 * The court's markings as ONE texture on one plane, not a dozen thin meshes. A line a few centimetres wide is under a
 * pixel wide from the broadcast view, and as geometry it shimmers: it breaks into dashes and crawls as the camera pans.
 * As a texture it is mipmapped and anisotropically filtered, so far away it fades smoothly instead of flickering. The
 * canvas holds only the coverage (white where there is line); the plane's colour is the line token.
 *
 * `size` is the court's width by depth (m); `texels` the detail per layout (texels per metre: a 5 cm line should be a
 * few texels wide). `draw` lays the lines out: it is given `rect(x, z, width, depth)`, a rectangle by its centre and
 * size in metres from the court's middle. Pass a `draw` and `size` that do not change between renders.
 */
export function CourtLines({
  layout,
  size,
  texels,
  draw,
  color,
  y,
}: {
  layout: GameLayout;
  size: readonly [number, number];
  texels: Record<GameLayout, number>;
  draw: (rect: (x: number, z: number, width: number, depth: number) => void) => void;
  color: Color;
  y: number;
}) {
  const gl = useThree((s) => s.gl);
  const texture = useMemo(() => {
    const per = texels[layout];
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(size[0] * per);
    canvas.height = Math.round(size[1] * per);
    const g = canvas.getContext("2d")!;
    g.fillStyle = "black"; // a coverage mask, not a palette colour
    g.fillRect(0, 0, canvas.width, canvas.height);
    g.fillStyle = "white";
    draw((x, z, width, depth) =>
      g.fillRect(
        (x - width / 2 + size[0] / 2) * per,
        (z - depth / 2 + size[1] / 2) * per,
        width * per,
        depth * per,
      ),
    );
    const t = new CanvasTexture(canvas);
    t.anisotropy = Math.min(LINE_ANISOTROPY, gl.capabilities.getMaxAnisotropy());
    return t;
  }, [layout, gl, size, texels, draw]);
  useEffect(() => () => texture.dispose(), [texture]);
  return (
    <mesh rotation-x={-Math.PI / 2} position={[0, y, 0]} renderOrder={-1}>
      <planeGeometry args={[size[0], size[1]]} />
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

/** One wall: its centre on the floor (x, z) and its size (width by thickness along x, z), in metres. */
export interface Wall {
  at: readonly [number, number];
  size: readonly [number, number];
}

/**
 * Dark walls, each with a volt band along its top (`height`, `band` in m). The band is lifted a hair above the wall's top,
 * so their top faces are not in the same plane: two faces in one plane take turns winning the depth test, which shows as
 * a dashed, crawling edge along the whole top of the wall.
 */
export function Boards({
  walls,
  height,
  band,
  color,
  volt,
}: {
  walls: readonly Wall[];
  height: number;
  band: number;
  color: Color;
  volt: Color;
}) {
  return (
    <>
      {walls.map(({ at, size }) => (
        <group key={`${at[0]}:${at[1]}`} position={[at[0], 0, at[1]]}>
          <mesh position={[0, height / 2, 0]}>
            <boxGeometry args={[size[0], height, size[1]]} />
            <meshLambertMaterial color={color} />
          </mesh>
          <mesh position={[0, height - band / 2 + BAND_LIFT, 0]}>
            <boxGeometry args={[size[0] + 0.02, band, size[1] + 0.02]} />
            <meshBasicMaterial color={volt} />
          </mesh>
        </group>
      ))}
    </>
  );
}

/** One stand: the way it faces away from the court (radians about y), where its front edge starts (x, z), and its width (m). */
export interface StandSide {
  turn: number;
  edge: readonly [number, number];
  width: number;
}
/** The steps of a stand: how many, how deep each tread is and how much each rises (m). */
export interface StandSteps {
  tiers: number;
  tread: number;
  rise: number;
}

/** The tiers of the stands: each step a box from the floor to its top (the crowd sits on those tops). */
export function Stands({
  sides,
  tiers,
  tread,
  rise,
  color,
}: StandSteps & {
  sides: readonly StandSide[];
  color: Color;
}) {
  return (
    <>
      {sides.map((side) => (
        <group key={side.turn} position={[side.edge[0], 0, side.edge[1]]} rotation-y={side.turn}>
          {Array.from({ length: tiers }, (_, k) => {
            const height = rise * (k + 1);
            return (
              <mesh key={k} position={[0, height / 2, tread * (k + 0.5)]}>
                <boxGeometry args={[side.width, height, tread]} />
                <meshLambertMaterial color={color} flatShading />
              </mesh>
            );
          })}
        </group>
      ))}
    </>
  );
}

/**
 * Where one crowd seat goes: a random step of a random stand, facing the court. The returned function sets position and
 * rotation fully (the object is reused). Make it once, outside render (the crowd needs a `seat` that does not change).
 */
export const seatOnStands =
  (sides: readonly StandSide[], stands: StandSteps) => (rand: () => number, at: Object3D) => {
    const side = sides[Math.floor(rand() * sides.length)]!;
    const tier = Math.floor(rand() * stands.tiers);
    const across = (rand() - 0.5) * side.width;
    const back = stands.tread * (tier + 0.25 + rand() * 0.5);
    const c = Math.cos(side.turn);
    const s = Math.sin(side.turn);
    at.position.set(
      side.edge[0] + across * c + back * s,
      stands.rise * (tier + 1),
      side.edge[1] - across * s + back * c,
    );
    at.rotation.set(0, side.turn + Math.PI, 0);
  };

/**
 * The Hawk-Eye ellipse where an OUT ball landed, at height `y` (m): it follows `world`'s shotlist. A mark from the point
 * before (the call's walk starts its own clock) is already down.
 */
export function HawkEyeMark({
  world,
  color,
  y,
}: {
  world: RefObject<{
    shotlist: { mark: { at: Vec3; from: number } | null; end: number };
    elapsed(): number;
  } | null>;
  color: Color;
  y: number;
}) {
  const mark = useRef<Group>(null);
  useFrame(() => {
    const w = world.current;
    const m = mark.current;
    if (!w || !m) return;
    const t = w.elapsed();
    const at = w.shotlist.mark;
    m.visible = at !== null && (t >= at.from || at.from > w.shotlist.end);
    if (at) m.position.set(at.at[0], y, at.at[2]);
  });
  return (
    <group
      ref={mark}
      visible={false}
      rotation-x={-Math.PI / 2}
      scale={[(MARK.width * MARK.drawn) / 2, (MARK.depth * MARK.drawn) / 2, 1]}
    >
      <mesh>
        <ringGeometry args={[0.62, 1, 32]} />
        <meshBasicMaterial color={color} side={DoubleSide} depthWrite={false} />
      </mesh>
      <mesh>
        <circleGeometry args={[0.62, 32]} />
        <meshBasicMaterial
          color={color}
          side={DoubleSide}
          transparent
          opacity={0.4}
          depthWrite={false}
        />
      </mesh>
    </group>
  );
}
