import type { SoundName } from "./audio";

/**
 * The game sounds that are recordings (public/audio, CC0, credited in CREDITS.md), picked by Yash by ear: the bat on
 * the ball, the crowd's "ooh" at a play-and-miss, the cheer for a boundary and the game's end, the stadium's hum
 * under the 3D cricket game, the 3D tennis game's racket hit, court bounce, applause and hum, and the 3D badminton
 * game's shuttle hit, shoe squeak and hall hum (its applause is tennis's). The other game sounds stay made in code (synth.ts).
 */
export const GAME_FILES = {
  bat: "/audio/bat.mp3",
  ooh: "/audio/ooh.mp3",
  cheer: "/audio/cheer.mp3",
  murmur: "/audio/murmur.mp3",
  hit: "/audio/hit.mp3",
  court: "/audio/court.mp3",
  applause: "/audio/applause.mp3",
  hush: "/audio/hush.mp3",
  shuttle: "/audio/shuttle.mp3",
  squeak: "/audio/squeak.mp3",
  hall: "/audio/hall.mp3",
} as const;

export type GameRecording = keyof typeof GAME_FILES;
/** The recordings that loop under a game as its hum: cricket's crowd murmur, tennis's hush, badminton's hall. */
export const AMBIENCE_TRACKS = ["murmur", "hush", "hall"] as const;
export type AmbienceTrack = (typeof AMBIENCE_TRACKS)[number];

/** Which game sound plays which recording, once it has loaded (the code-made one until then, or if it cannot load). */
export const RECORDED: Partial<Record<SoundName, Exclude<GameRecording, AmbienceTrack>>> = {
  bat: "bat",
  ooh: "ooh",
  crowd: "cheer",
  hit: "hit",
  court: "court",
  applause: "applause",
  shuttle: "shuttle",
  squeak: "squeak",
};

/** How loud each recording plays into the master gain (0 to 1). */
export const GAME_LEVELS: Record<GameRecording, number> = {
  bat: 0.9,
  ooh: 0.7,
  cheer: 0.8,
  murmur: 0.3,
  hit: 0.9,
  court: 0.6,
  applause: 0.7,
  hush: 0.3,
  shuttle: 0.9,
  squeak: 0.5,
  hall: 0.3,
};

/** The hum: how long it takes to come up and to fall away (s). Its file is a seamless 8 s loop. */
export const AMBIENCE = { fadeIn: 2, fadeOut: 0.6 } as const;
