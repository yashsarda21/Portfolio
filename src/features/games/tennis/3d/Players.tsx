import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, type RefObject } from "react";
import type { Object3D } from "three";
import type { GameLayout } from "../../engine/types";
import { makeAthlete, type Athlete } from "../../three/athlete";
import { disposeCast, poseCast } from "../../three/cast";
import { useGroundSpots } from "../../three/groundSpots";
import { SETTINGS } from "../../three/settings";
import { tokenColor } from "../../three/tokens";
import { ACTORS, type ActorId } from "./court";
import { makeTennisProps } from "./props";
import type { TennisAssets } from "./scene";
import type { WorldState } from "./world";

/** Yash's left hand and his root: where the ball sits while he holds it (the ball reads them each frame). */
export interface YashHand {
  hand: Object3D;
  root: Object3D;
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
    () => () =>
      disposeCast(
        ACTORS.map((id) => cast.athletes[id]),
        cast.props,
        assets,
      ),
    [cast, assets],
  );

  useFrame(() => {
    const w = world.current;
    if (w) poseCast(cast.athletes, w.shotlist.actors, w.elapsed());
  });

  return (
    <>
      {ACTORS.map((id) => (
        <primitive key={id} object={cast.athletes[id].root} />
      ))}
    </>
  );
}
