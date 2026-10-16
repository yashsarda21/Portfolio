import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, useRef } from "react";
import {
  CylinderGeometry,
  Float32BufferAttribute,
  IcosahedronGeometry,
  InstancedMesh,
  MeshLambertMaterial,
  Object3D,
  type BufferGeometry,
  type Color,
  type Group,
} from "three";
import { mergeGeometries } from "three/addons/utils/BufferGeometryUtils.js";
import { seeded } from "./crowdKit";

/** How far the crowd rises when it stands, and how long it takes (s). */
const CROWD_RISE = { up: 0.25, seconds: 0.4 } as const;

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

/**
 * The crowd: one instanced mesh of simple figures. `seat` places one instance (set `at`'s position and rotation; it
 * draws what it needs from `rand`, the same sequence on every visit, before each shirt colour is picked); the crowd
 * stands up (rises) while `up()` is true. Pass a `seat` that does not change between renders.
 */
export function Crowd({
  count,
  colors,
  seat,
  up,
}: {
  count: number;
  colors: Color[];
  seat: (rand: () => number, at: Object3D) => void;
  up: () => boolean;
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
    for (let i = 0; i < count; i++) {
      seat(rand, at);
      at.updateMatrix();
      crowd.setMatrixAt(i, at.matrix);
      crowd.setColorAt(i, colors[Math.floor(rand() * colors.length)]!);
    }
    return crowd;
  }, [count, colors, seat]);
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
    const goal = up() ? CROWD_RISE.up : 0;
    const step = (Math.min(delta, 0.1) * CROWD_RISE.up) / CROWD_RISE.seconds;
    g.position.y += Math.max(-step, Math.min(step, goal - g.position.y));
  });
  return (
    <group ref={group}>
      <primitive object={mesh} />
    </group>
  );
}
