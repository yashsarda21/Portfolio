/** The body's bones by what they are (the rig's names: the Quaternius Universal rig, shared by the body and the moves). */
export const BONES = {
  hips: "pelvis",
  spine: "spine_01",
  spineMid: "spine_02",
  chest: "spine_03",
  neck: "neck_01",
  head: "Head",
  shoulderL: "clavicle_l",
  upperArmL: "upperarm_l",
  foreArmL: "lowerarm_l",
  handL: "hand_l",
  shoulderR: "clavicle_r",
  upperArmR: "upperarm_r",
  foreArmR: "lowerarm_r",
  handR: "hand_r",
  thighL: "thigh_l",
  shinL: "calf_l",
  footL: "foot_l",
  thighR: "thigh_r",
  shinR: "calf_r",
  footR: "foot_r",
} as const;
export type BoneKey = keyof typeof BONES;

/** Our names for the free clips we ship (their names in the pack). tools/models.mjs repeats this list: keep the two in step. */
export const LIBRARY_CLIPS = {
  idle: "Idle_Loop",
  walk: "Walk_Loop",
  jog: "Jog_Fwd_Loop",
  sprint: "Sprint_Loop",
  // No longer played (the keeper and slip wait in poses made in code); dropping it means re-running tools/models.mjs.
  crouch: "Crouch_Idle_Loop",
} as const;

export const MODEL_FILES = {
  body: "/models/athlete.glb",
  skin: "/models/athlete-skin.jpg",
  moves: "/models/moves.glb",
} as const;

/**
 * Measured at intake (tools/models.mjs, then a throwaway script): the body's rest-pose (T-pose, arms along +-x) heights and
 * reach, in its own units (metres), for painting the kit. The mesh's `position` attribute is still float metres in the rest pose.
 */
export const KIT_REGIONS = {
  // foot_l bone y is 0.0865; a little above it.
  ankle: 0.12,
  // pelvis bone y.
  hip: 0.949,
  // neck_01 bone y.
  neck: 1.52,
  // |x| a little short of lowerarm_l (x 0.463): sleeves to just above the elbow (halfway along the upper arm, 0.3375,
  // left skin showing on top of the shoulders once the arms come down).
  sleeve: 0.42,
  // calf_l bone's rest-pose world height (the knee) is 0.5424, found by composing the node transforms in
  // public/models/athlete.glb's JSON with a throwaway script; the hem sits 0.08 above it.
  shorts: 0.622,
} as const;

/** Turns the model to face +z (0 if it already does): the toes (ball_l - foot_l) and the eyes both point to +z at rest. */
export const MODEL_YAW = 0;
/** Turns the model's units to metres (1 if already metres): the bounding box is 1.82 high and the root's scale is 1. */
export const MODEL_SCALE = 1;
