import { useEffect, useMemo, type RefObject } from "react";
import {
  CanvasTexture,
  DirectionalLight,
  DoubleSide,
  LatheGeometry,
  RepeatWrapping,
  SRGBColorSpace,
  Vector2,
  type Color,
  type Object3D,
} from "three";
import type { GameLayout } from "../../engine/types";
import { Crowd } from "../../three/Crowd";
import { crowdColors } from "../../three/crowdKit";
import { Floodlight } from "../../three/Floodlight";
import { SETTINGS } from "../../three/settings";
import { tokenColor } from "../../three/tokens";
import { LENGTH_Z } from "./delivery";
import { PITCH, ROPE } from "./field";
import type { WorldState } from "./world";

/** The stands: tiers from the front row to the back wall (m from the ground's centre), and how high each step rises. */
const STANDS = { from: 72, to: 95, tiers: 7, rise: 1.4 } as const;
const TOWER = { radius: 101, height: 46 } as const;
const STUMP = { radius: 0.018, height: 0.711, apart: 0.114 } as const;
const LINE = 0.05;
const centreZ = ROPE.centre[2];

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
    lamp: tokenColor("--ref-lamp"),
    sky: tokenColor("--ref-led-white"),
    turf: tokenColor("--ref-turf-deep"),
  };
}

/** One crowd seat: a random place on the tiers round the oval, facing the middle. */
const seatOnTiers = (rand: () => number, at: Object3D) => {
  const tread = (STANDS.to - STANDS.from) / STANDS.tiers;
  const tier = Math.floor(rand() * STANDS.tiers);
  const r = STANDS.from + tread * (tier + 0.25 + rand() * 0.5);
  const a = rand() * Math.PI * 2;
  at.position.set(Math.cos(a) * r, STANDS.rise * (tier + 1), centreZ + Math.sin(a) * r);
  at.rotation.y = Math.atan2(-Math.cos(a), -Math.sin(a));
};

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
  const crowd = useMemo(() => crowdColors(), []);
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
    return [Math.cos(a) * TOWER.radius, 0, Math.sin(a) * TOWER.radius + centreZ] as const;
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
      <Crowd
        count={settings.crowd}
        colors={crowd}
        seat={seatOnTiers}
        up={() => world.current?.crowdUp ?? false}
      />
      {towers.map((at) => (
        <Floodlight
          key={`${at[0]}:${at[2]}`}
          at={at}
          aim={[0, 0, centreZ]}
          height={TOWER.height}
          color={c.lamp}
        />
      ))}
    </group>
  );
}
