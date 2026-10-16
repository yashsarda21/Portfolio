import { Color, Vector3, type AnimationClip } from "three";
import { applyClips, makeAthlete, type AthleteAssets } from "../../three/athlete";
import type { Vec3 } from "./court";
import { makeTennisProps } from "./props";
import { SERVE_CLIP, STROKE_CLIP } from "./timing";

/** Where each stroke's racket sweet spot is at contact, and Yash's left hand at the toss and the bounce: body frame, from the feet. */
export interface Reach {
  serve: Vec3;
  forehand: Vec3;
  backhand: Vec3;
  toss: Vec3;
  bounce: Vec3;
}

/**
 * Measured once, on the real body with the real clips: a throwaway athlete at the origin facing +z is posed at each beat
 * and the sweet spot (or the left hand) is read off. The rally script stands each player so this point is where the ball
 * is at contact, so the strings meet the ball exactly (spec §5.2 #3).
 */
export function measureReach(assets: AthleteAssets, clips: readonly AnimationClip[]): Reach {
  // Never drawn: any colours do.
  const grey = new Color();
  const props = makeTennisProps({ volt: grey, dark: grey, light: grey });
  const a = makeAthlete(assets, { shirt: grey, trousers: grey, shoes: grey, eyes: grey }, clips);
  const sweet = props.racket(a);
  const read = (clip: string, time: number, what: "sweet" | "handL"): Vec3 => {
    applyClips(a, [{ clip, time, weight: 1, loop: false }]);
    a.root.updateMatrixWorld(true);
    const p = (what === "sweet" ? sweet : a.bone("handL")).getWorldPosition(new Vector3());
    return [p.x, p.y, p.z];
  };
  const reach: Reach = {
    serve: read("serve", SERVE_CLIP.contact, "sweet"),
    forehand: read("forehand", STROKE_CLIP.contact, "sweet"),
    backhand: read("backhand", STROKE_CLIP.contact, "sweet"),
    toss: read("serve", SERVE_CLIP.toss, "handL"),
    bounce: read("bounceBall", 0, "handL"),
  };
  props.dispose();
  a.materials.forEach((m) => m.dispose());
  return reach;
}
