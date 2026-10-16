import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, type RefObject } from "react";
import { CanvasTexture, Mesh, MeshBasicMaterial, PlaneGeometry } from "three";
import type { GameLayout } from "../../engine/types";
import { applyClips, makeAthlete, type Athlete } from "../../three/athlete";
import { SETTINGS } from "../../three/settings";
import { tokenColor } from "../../three/tokens";
import { sampleTrack } from "../../three/track";
import { ACTORS, type ActorId } from "./field";
import { makeProps } from "./props";
import type { CricketAssets } from "./scene";
import type { WorldState } from "./world";

/** A soft dark spot under each player where there are no shadows (the column): a round fade, used as an alpha map. */
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

/** Each player where the shotlist puts them now: place, heading and pose. */
function movePlayers(athletes: Record<ActorId, Athlete>, w: WorldState) {
  const t = w.elapsed();
  for (const id of ACTORS) {
    const a = athletes[id];
    const s = sampleTrack(w.shotlist.actors[id], t);
    a.root.position.set(...s.position);
    a.root.rotation.y = s.face;
    applyClips(a, s.clips);
  }
}

/** The seven players, made once, each moved every frame from the shotlist on screen. */
export function Players({
  assets,
  world,
  layout,
}: {
  assets: CricketAssets;
  world: RefObject<WorldState | null>;
  layout: GameLayout;
}) {
  const shadows = SETTINGS[layout].shadows;
  const cast = useMemo(() => {
    const eyes = tokenColor("--ref-night");
    const shoes = tokenColor("--ref-floodlight");
    const dark = tokenColor("--surface-panel");
    const yashKit = { shirt: dark, trousers: dark, shoes, eyes };
    const fieldKit = { shirt: tokenColor("--ref-floodlight"), trousers: dark, shoes, eyes };
    const props = makeProps({
      volt: tokenColor("--ref-volt"),
      dark: tokenColor("--ref-stand-hi"),
      light: tokenColor("--ref-floodlight"),
      willow: tokenColor("--ref-stump"),
    });
    const athletes = {} as Record<ActorId, Athlete>;
    for (const id of ACTORS) {
      const a = makeAthlete(assets, id === "yash" ? yashKit : fieldKit, assets.clips);
      if (id === "yash") props.batter(a);
      else if (id === "keeper") props.keeper(a);
      else props.fielder(a);
      athletes[id] = a;
    }
    return { athletes, props };
  }, [assets]);
  const spot = useMemo(() => {
    if (shadows) return null;
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
  }, [shadows]);
  useEffect(() => {
    if (!spot) return;
    const meshes = ACTORS.map((id) => {
      const m = new Mesh(spot.geometry, spot.material);
      m.position.y = 0.012;
      cast.athletes[id].root.add(m);
      return m;
    });
    return () => {
      meshes.forEach((m) => m.removeFromParent());
      spot.texture.dispose();
      spot.geometry.dispose();
      spot.material.dispose();
    };
  }, [spot, cast]);
  useEffect(
    () => () => {
      cast.props.dispose();
      for (const id of ACTORS) {
        cast.athletes[id].materials.forEach((m) => m.dispose());
        cast.athletes[id].mixer.stopAllAction();
      }
      // The body's geometry (shared by every clone) and its skin are kept for the visit, but this canvas's renderer
      // has hooked itself onto them: disposing frees its copies and lets it go. The next canvas uploads them again.
      assets.body.scene.traverse((o) => (o as Mesh).geometry?.dispose());
      assets.skin.dispose();
    },
    [cast, assets],
  );

  useFrame(() => {
    const w = world.current;
    if (w) movePlayers(cast.athletes, w);
  });

  return (
    <>
      {ACTORS.map((id) => (
        <primitive key={id} object={cast.athletes[id].root} />
      ))}
    </>
  );
}
