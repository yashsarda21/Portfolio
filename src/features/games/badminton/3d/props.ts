import {
  BufferGeometry,
  CircleGeometry,
  CylinderGeometry,
  DoubleSide,
  Float32BufferAttribute,
  Group,
  Matrix4,
  Mesh,
  MeshStandardMaterial,
  Object3D,
  SphereGeometry,
  TorusGeometry,
  Vector3,
  type Color,
  type Material,
} from "three";
import type { Athlete } from "../../three/athlete";
import type { BoneKey } from "../../three/rig";
import type { Vec3 } from "../../three/track";
import { DRAWN, SHUTTLE } from "./shuttle";

/**
 * The racket's sizes (m, spec §5.3 #6): its whole length, the head's outer size (along the shaft, across), the shaft's
 * and the frame's tube radius, and the handle.
 */
export const RACKET = {
  length: 0.665,
  head: [0.23, 0.2],
  shaft: 0.0035,
  frame: 0.006,
  grip: { radius: 0.013, length: 0.2 },
} as const;

/**
 * How the right fist holds it (a handshake grip): the shaft passes through the fist `at` m up the handle from the
 * butt, at `fist` in the hand's frame (its y runs to the knuckles, +z is the thumb's side and −x the palm). The shaft
 * leans `lean` degrees from the thumb's way toward the knuckles, as the handle lies across the closed fist, and the
 * strings face the way the palm does, turned `spin` degrees about the shaft (the face is the palm's extension).
 */
export const HOLD = {
  at: 0.07,
  fist: [-0.03, 0.075, 0] as Vec3,
  lean: 45,
  spin: 0,
} as const;

/** Where the sweet spot (the string bed's centre) is along the shaft, from the butt (m). */
const SWEET = RACKET.length - RACKET.head[0] / 2;

export interface BadmintonPropColors {
  /** Yash's headband, wristband, and racket shaft and frame. */
  volt: Color;
  /** The handles. */
  dark: Color;
  /** Your racket shaft and frame, the strings and the shuttle. */
  light: Color;
}

/** Where the cork's back is (m, along −z from its middle), and the skirt's radius where the quills go in. */
const CORK_BACK = -0.011;
const QUILL = SHUTTLE.cork * 0.85;
/** The skirt's radius `z` m along the shuttle (z from the cork's back to the rim). */
const skirtAt = (z: number) =>
  QUILL + ((SHUTTLE.skirt - QUILL) * (CORK_BACK - z)) / (CORK_BACK - SHUTTLE.cork + SHUTTLE.length);

/** The shuttle's skirt: 16 feathers, each a flat vane that widens to a rounded tip, from the cork's back to the rim. */
function featherSkirt(): BufferGeometry {
  const s = SHUTTLE;
  // The rim, along −z from the cork's middle.
  const rim = s.cork - s.length;
  const n = 16;
  const pos: number[] = [];
  const at = (angle: number, r: number, z: number) => [Math.cos(angle) * r, Math.sin(angle) * r, z];
  for (let i = 0; i < n; i++) {
    const a = (i / n) * Math.PI * 2;
    // Each vane spans most of its share of the circle at the rim, less at the quill (a small gap between them).
    const half = (Math.PI / n) * 0.8;
    const b0 = at(a - half * 0.35, QUILL, CORK_BACK);
    const b1 = at(a + half * 0.35, QUILL, CORK_BACK);
    const t0 = at(a - half, s.skirt, rim + 0.006);
    const t1 = at(a + half, s.skirt, rim + 0.006);
    const tip = at(a, s.skirt, rim);
    pos.push(...b0, ...t0, ...t1, ...b0, ...t1, ...b1, ...t0, ...tip, ...t1);
  }
  const g = new BufferGeometry();
  g.setAttribute("position", new Float32BufferAttribute(pos, 3));
  g.computeVertexNormals();
  return g;
}

/**
 * The badminton kit the free body lacks, built from simple shapes (spec §5.3 #6, §5.4): the racket fixed to the right
 * hand, the shuttle, and Yash's bands. Sizes are metres; places are in each bone's own frame, measured on the rest pose.
 */
export function makeBadmintonProps(c: BadmintonPropColors) {
  const flat = (color: Color, roughness = 0.5) => new MeshStandardMaterial({ color, roughness });
  const m = {
    volt: flat(c.volt, 0.45),
    dark: flat(c.dark, 0.4),
    light: flat(c.light, 0.45),
    strings: new MeshStandardMaterial({
      color: c.light,
      roughness: 0.8,
      transparent: true,
      opacity: 0.3,
      depthWrite: false,
      side: DoubleSide,
    }),
    feathers: new MeshStandardMaterial({ color: c.light, roughness: 0.85, side: DoubleSide }),
    cork: flat(c.light, 0.6),
  };
  const r = RACKET;
  const h = HOLD;
  const [headLong, headWide] = r.head;
  const neck = r.grip.length + 0.025;
  const headStart = r.length - headLong;
  // The head's oval: a ring as wide as the head, stretched along the shaft.
  const ring = headWide / 2 - r.frame;
  const stretch = (headLong / 2 - r.frame) / ring;
  // The racket, in its own frame: y along the shaft from where the fist holds it, z out of the forehand face.
  const along = (from: number, to: number) => (from + to) / 2 - h.at;
  const g = {
    handle: new CylinderGeometry(r.grip.radius * 0.95, r.grip.radius, r.grip.length, 8).translate(
      0,
      along(0, r.grip.length),
      0,
    ),
    // The cone from the handle into the shaft.
    cone: new CylinderGeometry(r.shaft, r.grip.radius * 0.8, neck - r.grip.length, 8).translate(
      0,
      along(r.grip.length, neck),
      0,
    ),
    shaft: new CylinderGeometry(r.shaft, r.shaft, headStart - neck + r.frame, 6).translate(
      0,
      along(neck, headStart + r.frame),
      0,
    ),
    head: new TorusGeometry(ring, r.frame, 6, 36)
      .scale(1, stretch, 1)
      .translate(0, SWEET - h.at, 0),
    strings: new CircleGeometry(ring - 0.003, 28)
      .scale(1, stretch, 1)
      .translate(0, SWEET - h.at, 0),
    // The shuttle, cork first along +z, its origin the cork's middle: a dome on a short drum, and the skirt.
    cork: new SphereGeometry(SHUTTLE.cork, 12, 8, 0, Math.PI * 2, 0, Math.PI / 2).rotateX(
      Math.PI / 2,
    ),
    drum: new CylinderGeometry(SHUTTLE.cork, SHUTTLE.cork * 0.95, -CORK_BACK, 12)
      .rotateX(Math.PI / 2)
      .translate(0, 0, CORK_BACK / 2),
    skirt: featherSkirt(),
    // The threads that bind the feathers, two thin bands around the skirt.
    band: new TorusGeometry(skirtAt(-0.028), 0.0012, 4, 16).translate(0, 0, -0.028),
    band2: new TorusGeometry(skirtAt(-0.042), 0.0012, 4, 16).translate(0, 0, -0.042),
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
     * The racket in the right fist (a handshake grip): the handle, the shaft, the oval head and its see-through
     * strings. Yash's shaft and frame are volt; yours are light. Returns the sweet spot (the string bed's centre), an empty point
     * that moves with the racket.
     */
    racket(a: Athlete, frame: "volt" | "light" = "light"): Object3D {
      const racket = new Group();
      racket.add(mesh(g.handle, m.dark), mesh(g.cone, m.dark), mesh(g.shaft, m[frame]));
      racket.add(mesh(g.head, m[frame]), mesh(g.strings, m.strings, false));
      const sweetSpot = new Object3D();
      sweetSpot.name = "sweetSpot";
      sweetSpot.position.set(0, SWEET - h.at, 0);
      racket.add(sweetSpot);
      // The racket's frame in the hand's: the shaft leans from the thumb (z) toward the knuckles (y), and the
      // face looks out of the palm (−x), turned `spin` about the shaft.
      const lean = (h.lean * Math.PI) / 180;
      const shaft = new Vector3(0, Math.sin(lean), Math.cos(lean));
      const face = new Vector3(-1, 0, 0).applyAxisAngle(shaft, (h.spin * Math.PI) / 180);
      racket.quaternion.setFromRotationMatrix(
        new Matrix4().makeBasis(new Vector3().crossVectors(shaft, face), shaft, face),
      );
      fix(a, "handR", racket, h.fist);
      return sweetSpot;
    },
    /** A shuttle (white cork, 16 feathers), drawn `DRAWN` times real size, pointing +z (cork first). */
    shuttle(): Group {
      const shuttle = new Group();
      shuttle.add(
        mesh(g.cork, m.cork, false),
        mesh(g.drum, m.cork, false),
        mesh(g.skirt, m.feathers, false),
        mesh(g.band, m.cork, false),
        mesh(g.band2, m.cork, false),
      );
      shuttle.scale.setScalar(DRAWN);
      return shuttle;
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
export type BadmintonProps = ReturnType<typeof makeBadmintonProps>;
