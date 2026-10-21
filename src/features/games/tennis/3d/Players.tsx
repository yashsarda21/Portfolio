import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, type RefObject } from "react";
import type { Mesh, Object3D } from "three";
import type { GameLayout } from "../../engine/types";
import { applyClips, makeAthlete, type Athlete } from "../../three/athlete";
import { useGroundSpots } from "../../three/groundSpots";
import { SETTINGS } from "../../three/settings";
import { tokenColor } from "../../three/tokens";
import { sampleTrack } from "../../three/track";
import { ACTORS, type ActorId } from "./court";
import { makeTennisProps } from "./props";
import type { TennisAssets } from "./scene";
import type { WorldState } from "./world";

/** Yash's left hand and his root: where the ball sits while he holds it (the ball reads them each frame). */
export interface YashHand {
  hand: Object3D;
  root: Object3D;
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

/** The two players in their kits, made once, each moved every frame from the shotlist on screen. */
export function Players({
  assets,
  world,
  layout,
  onYash,
}: {
  assets: TennisAssets;
  world: RefObject<WorldState | null>;
  layout: GameLayout;
  /** Told Yash's hand when he is made, and null when he is let go. */
  onYash: (yash: YashHand | null) => void;
}) {
  const shadows = SETTINGS[layout].shadows;
  const cast = useMemo(() => {
    const eyes = tokenColor("--ref-night");
    const shoes = tokenColor("--ref-floodlight");
    const dark = tokenColor("--surface-panel");
    const kits = {
      yash: { shirt: dark, trousers: dark, shoes, shorts: true, eyes },
      you: {
        shirt: tokenColor("--ref-floodlight"),
        trousers: tokenColor("--ref-text-2"),
        shoes,
        shorts: true,
        eyes,
      },
    };
    const props = makeTennisProps({
      volt: tokenColor("--ref-volt"),
      dark: tokenColor("--ref-stand-hi"),
      light: tokenColor("--ref-floodlight"),
    });
    const athletes = {} as Record<ActorId, Athlete>;
    for (const id of ACTORS) {
      const a = makeAthlete(assets, kits[id], assets.clips);
      props.racket(a, id === "yash" ? "volt" : "light");
      if (id === "yash") {
        props.headband(a);
        props.wristband(a);
      }
      athletes[id] = a;
    }
    return { athletes, props };
  }, [assets]);
  const roots = useMemo(() => ACTORS.map((id) => cast.athletes[id].root), [cast]);
  useGroundSpots(!shadows, roots);
  useEffect(() => {
    const yash = cast.athletes.yash;
    onYash({ hand: yash.bone("handL"), root: yash.root });
    return () => onYash(null);
  }, [cast, onYash]);
  useEffect(
    () => () => {
      cast.props.dispose();
      for (const id of ACTORS) {
        cast.athletes[id].materials.forEach((m) => m.dispose());
        cast.athletes[id].mixer.stopAllAction();
      }
      // The body's geometry (shared by both players) and its skin are kept for the visit, but this canvas's renderer
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
