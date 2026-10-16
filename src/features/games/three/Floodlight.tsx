import { useMemo } from "react";
import type { Color } from "three";
import { tokenColor } from "./tokens";
import type { Vec3 } from "./track";

/**
 * One floodlight tower: a mast standing at `at` (its foot), and a glowing panel near the top facing `aim` (tilted a
 * little down). `height` is the mast's (m); `color` is the lamp's.
 */
export function Floodlight({
  at,
  aim,
  height,
  color,
}: {
  at: Vec3;
  aim: Vec3;
  height: number;
  color: Color;
}) {
  const mast = useMemo(() => tokenColor("--ref-mast"), []);
  return (
    <group position={[at[0], at[1], at[2]]} rotation-y={Math.atan2(aim[0] - at[0], aim[2] - at[2])}>
      <mesh position={[0, height / 2, 0]}>
        <cylinderGeometry args={[0.35, 0.7, height, 8]} />
        <meshLambertMaterial color={mast} />
      </mesh>
      <mesh position={[0, height + 2, 0.6]} rotation-x={0.35}>
        <boxGeometry args={[11, 5, 0.6]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2.5} />
      </mesh>
    </group>
  );
}
