import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef, type RefObject } from "react";
import {
  CanvasTexture,
  CylinderGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  DirectionalLight,
  DoubleSide,
  InstancedMesh,
  LatheGeometry,
  MeshLambertMaterial,
  Object3D,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
  type BufferGeometry,
  type Color,
  type Group,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import type { GameLayout } from "../../engine/types";
import { SETTINGS } from "../../three/settings";
import { tokenColor } from "../../three/tokens";
import { LENGTH_Z } from "./delivery";
import { PITCH, ROPE } from "./field";
import type { WorldState } from "./world";

/** The stands: tiers from the front row to the back wall (m from the ground's centre), and how high each step rises. */
const STANDS = { from: 72, to: 95, tiers: 7, rise: 1.4 } as const;
const TOWER = { radius: 101, height: 46 } as const;
/** How far the crowd rises when it stands (ball 3), and how long it takes (s). */
const CROWD_RISE = { up: 0.25, seconds: 0.4 } as const;
const STUMP = { radius: 0.018, height: 0.711, apart: 0.114 } as const;
const LINE = 0.05;
const centreZ = ROPE.centre[2];

/** A small random sequence that is the same on every visit (the crowd's seats and shirts). */
function seeded(seed: number) {
  let s = seed;
  return () => {
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** One crowd instance: four seated people side by side, each a body and a darker head, a little different in shade. */
function figures(): BufferGeometry {
  const parts = [-0.75, -0.25, 0.25, 0.75].flatMap((x, k) => {
    const shade = [1, 0.82, 0.92, 0.75][k]!;
    const body = new CylinderGeometry(0.17, 0.22, 0.55, 5).toNonIndexed().translate(x, 0.3, 0);
    const head = new IcosahedronGeometry(0.11, 0).translate(x, 0.7, 0);
    return [
      [body, shade],
      [head, 0.32],
    ] as const;
  });
  for (const [geometry, shade] of parts) {
    const count = geometry.attributes.position!.count;
    geometry.setAttribute("color", new Float32BufferAttribute(new Array(count * 3).fill(shade), 3));
  }
  const row = mergeGeometries(parts.map(([geometry]) => geometry))!;
  parts.forEach(([geometry]) => geometry.dispose());
  return row;
}

/** Mown stripes across the outfield, drawn on a canvas (no image files). */
function stripes(a: Color, b: Color): CanvasTexture {
  const canvas = document.createElement("canvas");
  canvas.width = 64;
  canvas.height = 4;
  const ctx = canvas.getContext("2d")!;
  ctx.fillStyle = a.getStyle();
  ctx.fillRect(0, 0, 32, 4);
  ctx.fillStyle = b.getStyle();
  ctx.fillRect(32, 0, 32, 4);
  const texture = new CanvasTexture(canvas);
  texture.colorSpace = SRGBColorSpace;
  texture.wrapS = texture.wrapT = RepeatWrapping;
  // Stripes 7 m wide across the 200 m disc.
  texture.repeat.set(200 / 14, 1);
  return texture;
}

function palette() {
  return {
    outfieldA: tokenColor("--ref-outfield-a"),
    outfieldB: tokenColor("--ref-outfield-b"),
    pitch: tokenColor("--ref-pitch-near"),
    stump: tokenColor("--ref-stump"),
    line: tokenColor("--ref-floodlight"),
    volt: tokenColor("--ref-volt"),
    stand: tokenColor("--ref-mast"),
    mast: tokenColor("--ref-mast"),
    lamp: tokenColor("--ref-lamp"),
    sky: tokenColor("--ref-led-white"),
    turf: tokenColor("--ref-turf-deep"),
    // Mostly whites and greys under the lights, with some colour.
    crowd: [
      "--ref-floodlight",
      "--ref-floodlight",
      "--ref-text-2",
      "--ref-text-2",
      "--ref-scout-grey",
      "--ref-scout-grey",
      "--ref-dim",
      "--ref-dim",
      "--ref-line-hover",
      "--ref-stand-hi",
      "--ref-court-mid",
      "--ref-hall-mid",
      "--ref-volt",
      "--ref-live-red",
    ].map(tokenColor),
  };
}

/** The crowd: one instanced mesh of simple figures on the tiers; they stand up (rise) when `crowdUp`. */
function Crowd({
  count,
  colors,
  world,
}: {
  count: number;
  colors: Color[];
  world: RefObject<WorldState | null>;
}) {
  const group = useRef<Group>(null);
  const mesh = useMemo(() => {
    const crowd = new InstancedMesh(
      figures(),
      new MeshLambertMaterial({ vertexColors: true }),
      count,
    );
    const rand = seeded(7);
    const at = new Object3D();
    const tread = (STANDS.to - STANDS.from) / STANDS.tiers;
    for (let i = 0; i < count; i++) {
      const tier = Math.floor(rand() * STANDS.tiers);
      const r = STANDS.from + tread * (tier + 0.25 + rand() * 0.5);
      const a = rand() * Math.PI * 2;
      at.position.set(Math.cos(a) * r, STANDS.rise * (tier + 1), centreZ + Math.sin(a) * r);
      at.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
      at.updateMatrix();
      crowd.setMatrixAt(i, at.matrix);
      crowd.setColorAt(i, colors[Math.floor(rand() * colors.length)]!);
    }
    return crowd;
  }, [count, colors]);
  useEffect(
    () => () => {
      mesh.geometry.dispose();
      (mesh.material as MeshLambertMaterial).dispose();
      mesh.dispose();
    },
    [mesh],
  );
  useFrame((_, delta) => {
    const g = group.current;
    if (!g) return;
    const goal = world.current?.crowdUp ? CROWD_RISE.up : 0;
    const step = (Math.min(delta, 0.1) * CROWD_RISE.up) / CROWD_RISE.seconds;
    g.position.y += Math.max(-step, Math.min(step, goal - g.position.y));
  });
  return (
    <group ref={group}>
      <primitive object={mesh} />
    </group>
  );
}

/** The floodlit ground (spec §6.1), built from simple shapes; every colour comes from the design tokens. */
export function Stadium({
  layout,
  world,
}: {
  layout: GameLayout;
  world: RefObject<WorldState | null>;
}) {
  const settings = SETTINGS[layout];
  const c = useMemo(() => palette(), []);
  const outfield = useMemo(() => stripes(c.outfieldA, c.outfieldB), [c]);
  useEffect(() => () => outfield.dispose(), [outfield]);
  const stands = useMemo(() => {
    const tread = (STANDS.to - STANDS.from) / STANDS.tiers;
    const points = [new Vector2(STANDS.from, 0)];
    for (let k = 0; k < STANDS.tiers; k++) {
      const y = STANDS.rise * (k + 1);
      points.push(
        new Vector2(STANDS.from + tread * k, y),
        new Vector2(STANDS.from + tread * (k + 1), y),
      );
    }
    points.push(new Vector2(STANDS.to, STANDS.rise * (STANDS.tiers + 2.5)));
    return new LatheGeometry(points, 128);
  }, []);
  useEffect(() => () => stands.dispose(), [stands]);
  const sun = useMemo(() => {
    const light = new DirectionalLight(c.lamp, 2.2);
    light.position.set(-26, 46, 40);
    light.target.position.set(0, 0, 9);
    light.castShadow = settings.shadows;
    light.shadow.mapSize.set(2048, 2048);
    Object.assign(light.shadow.camera, {
      left: -12,
      right: 12,
      top: 26,
      bottom: -26,
      near: 20,
      far: 110,
    });
    light.shadow.bias = -0.0004;
    light.shadow.normalBias = 0.02;
    light.shadow.camera.updateProjectionMatrix();
    return light;
  }, [c, settings.shadows]);
  useEffect(() => () => sun.dispose(), [sun]);

  const ends = [0, PITCH.length];
  const towers = [45, 135, 225, 315].map((deg) => {
    const a = (deg * Math.PI) / 180;
    return [Math.cos(a) * TOWER.radius, Math.sin(a) * TOWER.radius + centreZ] as const;
  });
  return (
    <group>
      <hemisphereLight args={[c.sky, c.turf, 1.4]} />
      <primitive object={sun} />
      <primitive object={sun.target} />

      <mesh rotation-x={-Math.PI / 2} position={[0, 0, centreZ]} receiveShadow>
        <circleGeometry args={[100, 96]} />
        <meshStandardMaterial map={outfield} roughness={0.95} />
      </mesh>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0.004, PITCH.length / 2]} receiveShadow>
        <planeGeometry args={[PITCH.width, PITCH.length]} />
        <meshStandardMaterial color={c.pitch} roughness={0.9} />
      </mesh>
      {/* The length bands painted on the pitch: the yorker, and the good length. */}
      {(
        [
          [LENGTH_Z.yorker - 0.35, LENGTH_Z.yorker + 0.35],
          [5, 7],
        ] as const
      ).map(([from, to]) => (
        <mesh key={from} rotation-x={-Math.PI / 2} position={[0, 0.007, (from + to) / 2]}>
          <planeGeometry args={[PITCH.width, to - from]} />
          <meshBasicMaterial color={c.volt} transparent opacity={0.16} depthWrite={false} />
        </mesh>
      ))}
      {ends.map((z) => {
        const toward = z === 0 ? 1 : -1;
        return (
          <group key={z} position={[0, 0.009, z]}>
            {/* Popping crease, bowling crease, and the return creases. */}
            <mesh rotation-x={-Math.PI / 2} position={[0, 0, toward * PITCH.crease]}>
              <planeGeometry args={[3.66, LINE]} />
              <meshBasicMaterial color={c.line} />
            </mesh>
            <mesh rotation-x={-Math.PI / 2}>
              <planeGeometry args={[2.64, LINE]} />
              <meshBasicMaterial color={c.line} />
            </mesh>
            {[-1.32, 1.32].map((x) => (
              <mesh key={x} rotation-x={-Math.PI / 2} position={[x, 0, toward * 0.2]}>
                <planeGeometry args={[LINE, 2.44 + 0.4]} />
                <meshBasicMaterial color={c.line} />
              </mesh>
            ))}
            {[-1, 0, 1].map((k) => (
              <mesh key={k} position={[k * STUMP.apart, STUMP.height / 2, 0]} castShadow>
                <cylinderGeometry args={[STUMP.radius, STUMP.radius, STUMP.height, 8]} />
                <meshStandardMaterial color={c.stump} roughness={0.5} />
              </mesh>
            ))}
            {[-0.5, 0.5].map((k) => (
              <mesh
                key={k}
                position={[k * STUMP.apart, STUMP.height + 0.012, 0]}
                rotation-z={Math.PI / 2}
              >
                <cylinderGeometry args={[0.009, 0.009, STUMP.apart, 6]} />
                <meshStandardMaterial color={c.stump} roughness={0.5} />
              </mesh>
            ))}
          </group>
        );
      })}
      <mesh rotation-x={-Math.PI / 2} position={[ROPE.centre[0], 0.05, ROPE.centre[2]]}>
        <torusGeometry args={[ROPE.radius, 0.06, 6, 192]} />
        <meshBasicMaterial color={c.volt} />
      </mesh>

      <mesh geometry={stands} position={[0, 0, centreZ]}>
        <meshLambertMaterial color={c.stand} side={DoubleSide} flatShading />
      </mesh>
      <Crowd count={settings.crowd} colors={c.crowd} world={world} />
      {towers.map(([x, z]) => (
        <group key={`${x}:${z}`} position={[x, 0, z]} rotation-y={Math.atan2(-x, centreZ - z)}>
          <mesh position={[0, TOWER.height / 2, 0]}>
            <cylinderGeometry args={[0.35, 0.7, TOWER.height, 8]} />
            <meshLambertMaterial color={c.mast} />
          </mesh>
          <mesh position={[0, TOWER.height + 2, 0.6]} rotation-x={0.35}>
            <boxGeometry args={[11, 5, 0.6]} />
            <meshStandardMaterial color={c.lamp} emissive={c.lamp} emissiveIntensity={2.5} />
          </mesh>
        </group>
      ))}
    </group>
  );
}
