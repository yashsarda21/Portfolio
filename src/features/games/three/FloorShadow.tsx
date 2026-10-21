import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import type { Mesh, MeshBasicMaterial } from "three";
import { tokenColor } from "./tokens";
import type { Vec3 } from "./track";

/**
 * A soft dark disc on the floor under a flying thing. `at` is read every frame: where the thing is, or null while it
 * is out of sight (the disc hides). `radius` (m) is the disc's size, `opacity` how dark it is at the floor, and
 * `fadeBy` the height (m) at which it has faded away. Draw it after whatever sets `at`, so it reads this frame's place.
 */
export function FloorShadow({
  at,
  radius,
  opacity,
  fadeBy,
}: {
  at: () => Vec3 | null;
  radius: number;
  opacity: number;
  fadeBy: number;
}) {
  const spot = useRef<Mesh>(null);
  const night = useMemo(() => tokenColor("--ref-night"), []);
  useFrame(() => {
    const s = spot.current;
    if (!s) return;
    const p = at();
    s.visible = p !== null;
    if (!p) return;
    s.position.set(p[0], 0.01, p[2]);
    (s.material as MeshBasicMaterial).opacity =
      opacity * Math.max(0, 1 - Math.max(0, p[1]) / fadeBy);
  });
  return (
    <mesh ref={spot} visible={false} rotation-x={-Math.PI / 2}>
      <circleGeometry args={[radius, 16]} />
      <meshBasicMaterial color={night} transparent opacity={0} depthWrite={false} />
    </mesh>
  );
}
