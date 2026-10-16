import type { SoundName } from "./audio";

/**
 * The game sounds that are recordings (public/audio, CC0, credited in CREDITS.md), picked by Yash by ear: the bat on
 * the ball, the crowd's "ooh" at a play-and-miss, the cheer for a boundary and the game's end, and the stadium's hum
 * under the 3D cricket game. The other game sounds stay made in code (synth.ts).
 */
export const GAME_FILES = {
  bat: "/audio/bat.mp3",
  ooh: "/audio/ooh.mp3",
  cheer: "/audio/cheer.mp3",
  murmur: "/audio/murmur.mp3",
} as const;

export type GameRecording = keyof typeof GAME_FILES;

/** Which game sound plays which recording, once it has loaded (the code-made one until then, or if it cannot load). */
export const RECORDED: Partial<Record<SoundName, Exclude<GameRecording, "murmur">>> = {
  bat: "bat",
  ooh: "ooh",
  crowd: "cheer",
};

/** How loud each recording plays into the master gain (0 to 1). */
export const GAME_LEVELS: Record<GameRecording, number> = {
  bat: 0.9,
  ooh: 0.7,
  cheer: 0.8,
  murmur: 0.3,
};

/** The hum: how long it takes to come up and to fall away (s). Its file is a seamless 8 s loop. */
export const AMBIENCE = { fadeIn: 2, fadeOut: 0.6 } as const;
