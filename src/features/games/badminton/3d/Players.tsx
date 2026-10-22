import { useFrame } from "@react-three/fiber";
import { useEffect, useMemo, type RefObject } from "react";
import type { Object3D } from "three";
import type { GameLayout } from "../../engine/types";
import { makeAthlete, type Athlete } from "../../three/athlete";
import { disposeCast, poseCast } from "../../three/cast";
import { useGroundSpots } from "../../three/groundSpots";
import { SETTINGS } from "../../three/settings";
import { tokenColor } from "../../three/tokens";
import type { Player } from "./match";
import { makeBadmintonProps } from "./props";
import type { BadmintonAssets } from "./scene";
import type { WorldState } from "./world";

const PLAYERS: readonly Player[] = ["yash", "you"];

/** Each player's left hand: where the shuttle hangs while he serves (the shuttle reads them each frame). */
export type LeftHands = Record<Player, Object3D>;

/**
 * The two players in their kits (Yash dark with the volt bands, you light; shorts and white shoes for both), each with
 * a racket, made once and moved every frame from the shotlist on screen.
 */
export function Players({
  assets,
  world,
  layout,
  onHands,
}: {
  assets: BadmintonAssets;
  world: RefObject<WorldState | null>;
  layout: GameLayout;
  /** Told both left hands when the players are made, and null when they are let go. */
  onHands: (hands: LeftHands | null) => void;
}) {
  const shadows = SETTINGS[layout].shadows;
  const cast = useMemo(() => {
    const eyes = tokenColor("--ref-night");
    const shoes = tokenColor("--ref-white");
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
    const props = makeBadmintonProps({
      volt: tokenColor("--ref-volt"),
      dark: tokenColor("--ref-stand-hi"),
      light: tokenColor("--ref-floodlight"),
    });
    const athletes = {} as Record<Player, Athlete>;
    for (const id of PLAYERS) {
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
  const roots = useMemo(() => PLAYERS.map((id) => cast.athletes[id].root), [cast]);
  useGroundSpots(!shadows, roots);
  useEffect(() => {
    onHands({
      yash: cast.athletes.yash.bone("handL"),
      you: cast.athletes.you.bone("handL"),
    });
    return () => onHands(null);
  }, [cast, onHands]);
  useEffect(
    () => () =>
      disposeCast(
        PLAYERS.map((id) => cast.athletes[id]),
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
      {PLAYERS.map((id) => (
        <primitive key={id} object={cast.athletes[id].root} />
      ))}
    </>
  );
}
