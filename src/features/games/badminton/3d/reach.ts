import { Color, Vector3, type AnimationClip } from "three";
import { applyClips, makeAthlete, type AthleteAssets } from "../../three/athlete";
import type { Vec3 } from "../../three/track";
import { makeBadmintonProps } from "./props";
import { DRAWN, SHUTTLE } from "./shuttle";
import {
  BLOCK_CLIP,
  DIVE_CLIP,
  JUMP_SMASH_CLIP,
  LIFT_CLIP,
  NET_CLIP,
  OVERHEAD_CLIP,
  SERVE_CLIP,
} from "./timing";

/**
 * Where each stroke's racket sweet spot is at contact, and where the server's shuttle hangs from his left hand as he
 * lets it go (`hold`, at SERVE_CLIP.drop): body frame, from the feet (x his left, y up, z his front).
 */
export interface Reach {
  serve: Vec3;
  overhead: Vec3;
  jumpSmash: Vec3;
  net: Vec3;
  lift: Vec3;
  block: Vec3;
  dive: Vec3;
  hold: Vec3;
}

/**
 * Where the left fingers pinch the feathers' rim, in the left hand's frame (its y runs to the knuckles, +x is the
 * palm and +z the thumb's side): under the fingers, near their middle.
 */
export const PINCH: Vec3 = [0.03, 0.105, 0.02];
/** The shuttle hangs cork down from the pinch: the cork's middle is this far below it (m, drawn size). */
export const HANG = (SHUTTLE.length - SHUTTLE.cork) * DRAWN;

/**
 * Measured once, on the real body with the real clips: a throwaway athlete at the origin facing +z is posed at each beat
 * and the sweet spot (or the pinch) is read off. The rally script stands each player so this point is where the
 * shuttle is at contact, so the strings meet the cork exactly (spec §5.3 #3).
 *
 * As measured with these clips (m; x his left, y up, z his front, from the feet):
 *
 * | | x | y | z |
 * |---|---|---|---|
 * | serve contact | −0.036 | 0.716 | 0.456 |
 * | overhead contact | −0.212 | 2.476 | 0.190 |
 * | jump smash contact | −0.223 | 2.896 | 0.419 |
 * | net shot contact | −0.187 | 1.366 | 1.612 |
 * | lift contact | −0.253 | 0.679 | 1.553 |
 * | block contact | 0.163 | 1.203 | 0.622 |
 * | dive contact | −0.215 | 0.239 | 2.782 |
 * | hold (the shuttle at the drop) | −0.038 | 1.100 | 0.455 |
 *
 * The serve's contact is below 1.15 m (the service rule); the shuttle let go at `hold` falls 0.381 m in the 0.3 s to
 * the contact (gravity with the flight's drag, shuttle.ts), onto the sweet spot within 4 mm.
 */
export function measureReach(assets: AthleteAssets, clips: readonly AnimationClip[]): Reach {
  // Never drawn: any colours do.
  const grey = new Color();
  const props = makeBadmintonProps({ volt: grey, dark: grey, light: grey });
  const a = makeAthlete(assets, { shirt: grey, trousers: grey, shoes: grey, eyes: grey }, clips);
  const sweet = props.racket(a);
  const read = (clip: string, time: number): Vec3 => {
    applyClips(a, [{ clip, time, weight: 1, loop: false }]);
    a.root.updateMatrixWorld(true);
    const p = sweet.getWorldPosition(new Vector3());
    return [p.x, p.y, p.z];
  };
  const reach: Reach = {
    serve: read("serve", SERVE_CLIP.contact),
    overhead: read("overhead", OVERHEAD_CLIP.contact),
    jumpSmash: read("jumpSmash", JUMP_SMASH_CLIP.contact),
    net: read("net", NET_CLIP.contact),
    lift: read("lift", LIFT_CLIP.contact),
    block: read("block", BLOCK_CLIP.contact),
    dive: read("dive", DIVE_CLIP.contact),
    hold: [0, 0, 0],
  };
  applyClips(a, [{ clip: "serve", time: SERVE_CLIP.drop, weight: 1, loop: false }]);
  a.root.updateMatrixWorld(true);
  const pinch = new Vector3(...PINCH).applyMatrix4(a.bone("handL").matrixWorld);
  reach.hold = [pinch.x, pinch.y - HANG, pinch.z];
  props.dispose();
  a.materials.forEach((m) => m.dispose());
  return reach;
}
