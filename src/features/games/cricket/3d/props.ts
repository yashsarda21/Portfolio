import {
  BoxGeometry,
  CylinderGeometry,
  Mesh,
  MeshStandardMaterial,
  SphereGeometry,
  Vector3,
  type BufferGeometry,
  type Color,
  type Material,
} from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import type { Athlete } from "../../three/athlete";
import type { BoneKey } from "../../three/rig";
import type { Vec3 } from "./field";

/** Where the bat's handle passes through the right fist: this far along the hand's y (toward the knuckles). */
export const BAT_FIST = 0.075;

export interface PropColors {
  /** Yash's helmet. */
  volt: Color;
  /** The keeper's helmet, the grilles and the bat's grip. */
  dark: Color;
  /** Pads, gloves and caps. */
  light: Color;
  /** The bat's blade. */
  willow: Color;
}

/**
 * The kit the free body lacks, built from simple shapes and fixed to its bones (spec §6.1). Sizes are metres; places
 * are in each bone's own frame, measured on the rest pose: the head's y is up and z its face; a shin's y runs down
 * to the ankle and its -z is the front; a hand's y runs to the knuckles and +z is the thumb's side.
 */
export function makeProps(c: PropColors) {
  const flat = (color: Color, roughness = 0.6) => new MeshStandardMaterial({ color, roughness });
  const m = {
    volt: flat(c.volt, 0.35),
    dark: flat(c.dark, 0.5),
    light: flat(c.light, 0.7),
    willow: flat(c.willow, 0.6),
  };
  const g = {
    // The bat (0.88 m): the handle through both fists along the hand's z, the blade beyond the thumb, its face the
    // way the knuckles point (the hand's y).
    handle: new CylinderGeometry(0.018, 0.018, 0.32, 8).rotateX(Math.PI / 2).translate(0, 0, -0.12),
    blade: new RoundedBoxGeometry(0.108, 0.05, 0.56, 1, 0.012).translate(0, 0, 0.32),
    glove: new RoundedBoxGeometry(0.08, 0.14, 0.11, 1, 0.025),
    keeperGlove: new RoundedBoxGeometry(0.1, 0.2, 0.17, 1, 0.04),
    pad: new RoundedBoxGeometry(0.17, 0.56, 0.08, 2, 0.03),
    helmet: new SphereGeometry(0.125, 16, 10, 0, Math.PI * 2, 0, Math.PI * 0.58),
    peak: new BoxGeometry(0.2, 0.012, 0.07),
    bar: new BoxGeometry(0.19, 0.012, 0.012),
    cap: new SphereGeometry(0.118, 14, 8, 0, Math.PI * 2, 0, Math.PI * 0.5),
    brim: new BoxGeometry(0.17, 0.01, 0.09),
  } satisfies Record<string, BufferGeometry>;

  const add = (
    a: Athlete,
    key: BoneKey,
    geometry: BufferGeometry,
    material: Material,
    at: Vec3,
    tilt: Vec3 = [0, 0, 0],
  ) => {
    const bone = a.bone(key);
    a.root.updateMatrixWorld(true);
    const mesh = new Mesh(geometry, material);
    mesh.position.set(...at);
    mesh.rotation.set(...tilt);
    mesh.scale.divide(bone.getWorldScale(new Vector3()));
    mesh.castShadow = true;
    bone.add(mesh);
  };
  const helmet = (a: Athlete, shell: Material) => {
    add(a, "head", g.helmet, shell, [0, 0.085, -0.005]);
    add(a, "head", g.peak, shell, [0, 0.13, 0.125], [0.2, 0, 0]);
    for (const y of [0.0, 0.035, 0.07]) add(a, "head", g.bar, m.dark, [0, y, 0.14]);
  };
  const pads = (a: Athlete) => {
    add(a, "shinL", g.pad, m.light, [0, 0.16, -0.09]);
    add(a, "shinR", g.pad, m.light, [0, 0.16, -0.09]);
  };
  const cap = (a: Athlete) => {
    add(a, "head", g.cap, m.light, [0, 0.11, 0]);
    add(a, "head", g.brim, m.light, [0, 0.12, 0.14], [0.15, 0, 0]);
  };

  return {
    /** Yash: the volt helmet, pads, gloves and the bat in his right (bottom) hand. */
    batter(a: Athlete) {
      helmet(a, m.volt);
      pads(a);
      add(a, "handL", g.glove, m.light, [0, 0.065, 0.005]);
      add(a, "handR", g.glove, m.light, [0, 0.065, 0.005]);
      add(a, "handR", g.handle, m.dark, [0, BAT_FIST, 0]);
      add(a, "handR", g.blade, m.willow, [0, BAT_FIST, 0]);
    },
    /** The keeper: a dark helmet, pads and big gloves. */
    keeper(a: Athlete) {
      helmet(a, m.dark);
      pads(a);
      add(a, "handL", g.keeperGlove, m.light, [0, 0.075, 0.01]);
      add(a, "handR", g.keeperGlove, m.light, [0, 0.075, 0.01]);
    },
    /** The bowler and the fielders: a cap. */
    fielder(a: Athlete) {
      cap(a);
    },
    dispose() {
      Object.values(g).forEach((x) => x.dispose());
      Object.values(m).forEach((x) => x.dispose());
    },
  };
}
export type Props = ReturnType<typeof makeProps>;
