import type { Mesh } from "three";
import { applyClips, type Athlete, type AthleteAssets } from "./athlete";
import { sampleTrack, type ActorTrack } from "./track";

/** Each athlete where its track puts it at `t` (s): place, heading and pose. */
export function poseCast<Id extends string>(
  athletes: Record<Id, Athlete>,
  actors: Record<Id, ActorTrack>,
  t: number,
): void {
  for (const id of Object.keys(athletes) as Id[]) {
    const a = athletes[id];
    const s = sampleTrack(actors[id], t);
    a.root.position.set(...s.position);
    a.root.rotation.y = s.face;
    applyClips(a, s.clips);
  }
}

/**
 * Lets a cast go: the props, then each athlete's own materials and mixer. The body's geometry (shared by every athlete)
 * and its skin are kept for the visit, but this canvas's renderer has hooked itself onto them: disposing frees its
 * copies and lets it go. The next canvas uploads them again.
 */
export function disposeCast(
  athletes: Athlete[],
  props: { dispose(): void },
  assets: AthleteAssets,
): void {
  props.dispose();
  for (const a of athletes) {
    a.materials.forEach((m) => m.dispose());
    a.mixer.stopAllAction();
  }
  assets.body.scene.traverse((o) => (o as Mesh).geometry?.dispose());
  assets.skin.dispose();
}
