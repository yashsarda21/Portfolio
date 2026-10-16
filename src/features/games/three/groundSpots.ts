import { useEffect, useMemo } from "react";
import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry, type Object3D } from "three";
import { tokenColor } from "./tokens";

/** A soft dark spot under each athlete where there are no shadows (the column): a round fade, used as an alpha map. */
function blob() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d")!;
  const g = ctx.createRadialGradient(32, 32, 0, 32, 32, 32);
  g.addColorStop(0, tokenColor("--ref-floodlight").getStyle());
  g.addColorStop(1, tokenColor("--ref-night").getStyle());
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, 64, 64);
  return new CanvasTexture(canvas);
}

/**
 * While `on`, a soft dark spot rides under each root (an athlete's root, which stands on the floor). Pass a `roots` list
 * that does not change between renders.
 */
export function useGroundSpots(on: boolean, roots: readonly Object3D[]) {
  const spot = useMemo(() => {
    if (!on) return null;
    const texture = blob();
    return {
      texture,
      geometry: new PlaneGeometry(1.1, 1.1).rotateX(-Math.PI / 2),
      material: new MeshBasicMaterial({
        color: tokenColor("--ref-night"),
        alphaMap: texture,
        transparent: true,
        opacity: 0.55,
        depthWrite: false,
      }),
    };
  }, [on]);
  useEffect(() => {
    if (!spot) return;
    const meshes = roots.map((root) => {
      const m = new Mesh(spot.geometry, spot.material);
      m.position.y = 0.012;
      root.add(m);
      return m;
    });
    return () => {
      meshes.forEach((m) => m.removeFromParent());
      spot.texture.dispose();
      spot.geometry.dispose();
      spot.material.dispose();
    };
  }, [spot, roots]);
}
