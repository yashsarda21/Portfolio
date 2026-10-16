import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, type RefObject } from "react";
import type { Mesh } from "three";
import type { GameLayout } from "../../engine/types";
import { applyClips, makeAthlete, type Athlete } from "../../three/athlete";
import { useGroundSpots } from "../../three/groundSpots";
import { SETTINGS } from "../../three/settings";
import { tokenColor } from "../../three/tokens";
import { sampleTrack } from "../../three/track";
import { ACTORS, type ActorId } from "./field";
import { makeProps } from "./props";
import type { CricketAssets } from "./scene";
import type { WorldState } from "./world";

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
  const roots = useMemo(() => ACTORS.map((id) => cast.athletes[id].root), [cast]);
  useGroundSpots(!shadows, roots);
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
