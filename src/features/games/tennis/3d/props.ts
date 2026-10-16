import {
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  TorusGeometry,
  Vector3,
  type BufferGeometry,
  type Color,
  type Material,
} from "three";
import type { Athlete } from "../../three/athlete";
import type { BoneKey } from "../../three/rig";
import type { Vec3 } from "./court";

/**
 * The racket's sizes (m). Along the shaft they are measured from where it passes through the right fist: the butt
 * below it (−), the string bed's centre (the sweet spot) and the tip above it.
 */
export const RACKET = {
  length: 0.685,
  /** The head's outer size: across the strings, and along the shaft. */
  head: { width: 0.24, length: 0.29 },
  butt: -0.075,
  sweet: 0.465,
  tip: 0.61,
  /** The handle's and the throat's radius. */
  grip: 0.017,
  throat: 0.011,
  /** Where the handle crosses the throat. */
  neck: 0.19,
  /** The frame's tube. */
  frame: 0.009,
  /**
   * Where the shaft passes through the right fist, in the hand's frame (its y runs to the knuckles, +z is the thumb's
   * side and −x the palm), and how far (degrees) the shaft leans from the thumb's way toward the knuckles, as the handle
   * lies across a closed fist. The strings' forehand face looks the way the palm does, turned `spin` degrees about the
   * shaft (a semi-western grip: the strings face the net at a forehand contact with the wrist laid back, not bent double).
   */
  fist: [-0.03, 0.075, 0] as Vec3,
  lean: 40,
  spin: -30,
} as const;

export interface TennisPropColors {
  /** Yash's headband, wristband and racket throat. */
  volt: Color;
  /** The racket frames. */
  dark: Color;
  /** Your racket throat and the strings. */
  light: Color;
}

/**
 * The tennis kit the free body lacks, built from simple shapes and fixed to its bones (spec §5.2 #6). Sizes are metres;
 * places are in each bone's own frame, measured on the rest pose: the head's y is up and z its face; a forearm's y runs
 * to the wrist; a hand's y runs to the knuckles and +z is the thumb's side.
 */
export function makeTennisProps(c: TennisPropColors) {
  const flat = (color: Color, roughness = 0.5) => new MeshStandardMaterial({ color, roughness });
  const m = {
    volt: flat(c.volt, 0.45),
    dark: flat(c.dark, 0.35),
    light: flat(c.light, 0.6),
    strings: new MeshStandardMaterial({
      color: c.light,
      roughness: 0.8,
      transparent: true,
      opacity: 0.35,
      depthWrite: false,
      side: DoubleSide,
    }),
  };
  const r = RACKET;
  // The head's oval: a ring as wide as the head, stretched along the shaft.
  const stretch = r.head.length / r.head.width;
  const ring = r.head.width / 2 - r.frame;
  const g = {
    // The racket, in its own frame: y along the shaft (butt to tip), z out of the forehand face.
    handle: new CylinderGeometry(r.grip, r.grip * 0.95, r.neck - r.butt, 8).translate(
      0,
      (r.butt + r.neck) / 2,
      0,
    ),
    throat: new CylinderGeometry(r.throat, r.throat, r.tip - r.head.length - r.neck, 6).translate(
      0,
      (r.neck + r.tip - r.head.length) / 2,
      0,
    ),
    head: new TorusGeometry(ring, r.frame, 6, 32).scale(1, stretch, 1).translate(0, r.sweet, 0),
    strings: new CircleGeometry(ring - 0.004, 24).scale(1, stretch, 1).translate(0, r.sweet, 0),
    // Around the head above the brow, and around the right forearm just short of the wrist.
    headband: new TorusGeometry(0.088, 0.014, 6, 24).rotateX(Math.PI / 2),
    wristband: new CylinderGeometry(0.036, 0.036, 0.055, 12),
  } satisfies Record<string, BufferGeometry>;

  const mesh = (geometry: BufferGeometry, material: Material, shadow = true) => {
    const x = new Mesh(geometry, material);
    x.castShadow = shadow;
    return x;
  };
  /** Fixes `o` to a bone at `at` (its frame), undoing the bone's world scale so sizes stay in metres. */
  const fix = (a: Athlete, key: BoneKey, o: Object3D, at: Vec3) => {
    const bone = a.bone(key);
    a.root.updateMatrixWorld(true);
    o.position.set(...at);
    o.scale.divide(bone.getWorldScale(new Vector3()));
    bone.add(o);
  };

  return {
    /**
     * The racket in the right fist: the handle and throat along the shaft, the oval head and its see-through strings.
     * Yash's throat is volt; yours is light. Returns the sweet spot (the string bed's centre), an empty point that
     * moves with the racket.
     */
    racket(a: Athlete, throat: "volt" | "light" = "light"): Object3D {
      const racket = new Group();
      racket.add(mesh(g.handle, m.dark), mesh(g.throat, m[throat]), mesh(g.head, m.dark));
      racket.add(mesh(g.strings, m.strings, false));
      const sweetSpot = new Object3D();
      sweetSpot.name = "sweetSpot";
      sweetSpot.position.set(0, r.sweet, 0);
      racket.add(sweetSpot);
      // The racket's frame in the hand's: the shaft leans from the thumb (z) toward the knuckles (y), and the
      // forehand face looks out of the palm (−x), turned `spin` about the shaft.
      const lean = (r.lean * Math.PI) / 180;
      const shaft = new Vector3(0, Math.sin(lean), Math.cos(lean));
      const face = new Vector3(-1, 0, 0).applyAxisAngle(shaft, (r.spin * Math.PI) / 180);
      racket.quaternion.setFromRotationMatrix(
        new Matrix4().makeBasis(new Vector3().crossVectors(shaft, face), shaft, face),
      );
      fix(a, "handR", racket, r.fist);
      return sweetSpot;
    },
    /** Yash's volt headband. */
    headband(a: Athlete) {
      fix(a, "head", mesh(g.headband, m.volt), [0, 0.13, 0.015]);
    },
    /** Yash's volt wristband, on his racket arm. */
    wristband(a: Athlete) {
      fix(a, "foreArmR", mesh(g.wristband, m.volt), [-0.01, 0.215, 0]);
    },
    dispose() {
      Object.values(g).forEach((x) => x.dispose());
      Object.values(m).forEach((x) => x.dispose());
    },
  };
}
export type TennisProps = ReturnType<typeof makeTennisProps>;
