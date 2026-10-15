import type { SoundName } from "./audio";

/**
 * The sound slots, made in code with the Web Audio API (spec §4.6, P1): no audio files. Each recipe builds a
 * few short-lived nodes, starts them at `at`, stops every source by its cap, and connects the result to `out`.
 * Everything is dry, quiet and short; the provider's master gain sits on top of these levels.
 */

/** The parts of an audio context the recipes use, so a test can hand in a fake. */
export type SynthContext = Pick<
  BaseAudioContext,
  | "createOscillator"
  | "createGain"
  | "createBiquadFilter"
  | "createBufferSource"
  | "createBuffer"
  | "sampleRate"
  | "currentTime"
>;

/** Builds one sound into `out`, starting at `at` (the context's clock, in seconds). */
export type Recipe = (ctx: SynthContext, out: AudioNode, at: number) => void;

/** The level of the master gain every recipe plays through. */
export const MASTER_GAIN = 0.35;
/** The loudest any recipe's envelope gets (before the master gain). */
export const PEAK = 0.9;

/** An exponential ramp cannot start or end at zero, so "silence" is this. */
const FLOOR = 0.001;

const noiseBuffers = new WeakMap<SynthContext, AudioBuffer>();

/** One second of white noise per context, made once. (Allowed here: this is the shell, not a referee.) */
function noiseBuffer(ctx: SynthContext): AudioBuffer {
  let buffer = noiseBuffers.get(ctx);
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < data.length; i++) data[i] = Math.random() * 2 - 1;
    noiseBuffers.set(ctx, buffer);
  }
  return buffer;
}

/** A gain that rises from silence to `level` over `attack`, then falls exponentially to silence by `end`. */
function envelope(
  ctx: SynthContext,
  out: AudioNode,
  at: number,
  level: number,
  attack: number,
  end: number,
): GainNode {
  const gain = ctx.createGain();
  gain.gain.setValueAtTime(FLOOR, at);
  gain.gain.linearRampToValueAtTime(level, at + attack);
  gain.gain.exponentialRampToValueAtTime(FLOOR, at + end);
  gain.connect(out);
  return gain;
}

/** White noise for `duration` seconds into `to`. Returns the source (to loop it, if it must outlast a second). */
function noise(ctx: SynthContext, to: AudioNode, at: number, duration: number) {
  const source = ctx.createBufferSource();
  source.buffer = noiseBuffer(ctx);
  source.connect(to);
  source.start(at);
  source.stop(at + duration);
  return source;
}

function filter(
  ctx: SynthContext,
  type: BiquadFilterType,
  frequency: number,
  q: number,
  to: AudioNode,
) {
  const node = ctx.createBiquadFilter();
  node.type = type;
  node.frequency.value = frequency;
  node.Q.value = q;
  node.connect(to);
  return node;
}

/** A tone for `duration` seconds that glides from `from` to `to` Hz over `glide` seconds (no glide if equal). */
function tone(
  ctx: SynthContext,
  type: OscillatorType,
  { from, to = from, glide = 0 }: { from: number; to?: number; glide?: number },
  into: AudioNode,
  at: number,
  duration: number,
) {
  const osc = ctx.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, at);
  if (to !== from) osc.frequency.exponentialRampToValueAtTime(to, at + glide);
  osc.connect(into);
  osc.start(at);
  osc.stop(at + duration);
  return osc;
}

/** Bat on ball: a short crack of band-passed noise over a dull thud. */
const bat: Recipe = (ctx, out, at) => {
  const crack = envelope(ctx, out, at, PEAK * 0.8, 0.002, 0.09);
  noise(ctx, filter(ctx, "bandpass", 2200, 1.2, crack), at, 0.1);
  const thud = envelope(ctx, out, at, PEAK * 0.4, 0.002, 0.06);
  tone(ctx, "sine", { from: 140, to: 70, glide: 0.06 }, thud, at, 0.08);
};

/** Ball in the net: a soft rustle with a small low pluck. */
const net: Recipe = (ctx, out, at) => {
  const rustle = envelope(ctx, out, at, PEAK * 0.6, 0.004, 0.12);
  noise(ctx, filter(ctx, "bandpass", 1400, 0.8, rustle), at, 0.14);
  const pluck = envelope(ctx, out, at, PEAK * 0.25, 0.003, 0.05);
  tone(ctx, "triangle", { from: 320 }, pluck, at, 0.06);
};

/** A smash: a bright hiss of high-passed noise over a fast falling sweep. */
const smash: Recipe = (ctx, out, at) => {
  const hiss = envelope(ctx, out, at, PEAK * 0.5, 0.001, 0.15);
  noise(ctx, filter(ctx, "highpass", 3000, 0.7, hiss), at, 0.16);
  const sweep = envelope(ctx, out, at, PEAK * 0.3, 0.002, 0.08);
  tone(ctx, "sine", { from: 900, to: 300, glide: 0.08 }, sweep, at, 0.1);
};

/** The floodlights come on: a deep falling hum with a click as the switch goes. */
const floodlight: Recipe = (ctx, out, at) => {
  const hum = envelope(ctx, out, at, PEAK * 0.8, 0.005, 0.55);
  tone(ctx, "sine", { from: 70, to: 38, glide: 0.45 }, hum, at, 0.55);
  const click = envelope(ctx, out, at, PEAK * 0.15, 0.001, 0.03);
  noise(ctx, click, at, 0.04);
};

/** The crowd: a swell of low, softly wobbling noise that rises, holds and fades. */
const crowd: Recipe = (ctx, out, at) => {
  const swell = ctx.createGain();
  swell.gain.setValueAtTime(FLOOR, at);
  swell.gain.linearRampToValueAtTime(PEAK * 0.5, at + 0.4);
  swell.gain.setValueAtTime(PEAK * 0.5, at + 1.1);
  swell.gain.exponentialRampToValueAtTime(FLOOR, at + 1.6);
  swell.connect(out);
  const wobble = filter(ctx, "bandpass", 700, 0.7, swell);
  const body = filter(ctx, "lowpass", 1200, 0.7, wobble);
  const murmur = noise(ctx, body, at, 1.6);
  murmur.loop = true;
  // A slow oscillator sways the band's centre, so it breathes like many voices.
  const sway = ctx.createGain();
  sway.gain.value = 250;
  sway.connect(wobble.frequency);
  tone(ctx, "sine", { from: 1.3 }, sway, at, 1.6);
};

/** One hand-clap from the crowd: a short pat of band-passed noise, soft because many follow in a row. */
const clap: Recipe = (ctx, out, at) => {
  const pat = envelope(ctx, out, at, PEAK * 0.35, 0.002, 0.06);
  noise(ctx, filter(ctx, "bandpass", 1400, 1.5, pat), at, 0.06);
};

/** The ball on the pitch: a dull thud under a short, low tick. */
const bounce: Recipe = (ctx, out, at) => {
  const thud = envelope(ctx, out, at, PEAK * 0.45, 0.002, 0.05);
  tone(ctx, "sine", { from: 110, to: 60, glide: 0.05 }, thud, at, 0.05);
  const tick = envelope(ctx, out, at, PEAK * 0.2, 0.002, 0.03);
  noise(ctx, filter(ctx, "lowpass", 800, 1, tick), at, 0.03);
};

/** A crowd "ooh": a swell of low noise with a soft, vowel-like hum that sags a little in pitch. */
const ooh: Recipe = (ctx, out, at) => {
  const breath = envelope(ctx, out, at, PEAK * 0.5, 0.15, 0.9);
  noise(ctx, filter(ctx, "lowpass", 600, 0.7, breath), at, 0.9);
  const hum = envelope(ctx, out, at, PEAK * 0.15, 0.15, 0.9);
  const vowel = filter(ctx, "bandpass", 500, 1, hum);
  tone(ctx, "sine", { from: 220, to: 198, glide: 0.9 }, vowel, at, 0.9);
  tone(ctx, "sine", { from: 330, to: 297, glide: 0.9 }, vowel, at, 0.9);
};

export const RECIPES: Record<SoundName, Recipe> = {
  bat,
  net,
  smash,
  floodlight,
  crowd,
  clap,
  bounce,
  ooh,
};
