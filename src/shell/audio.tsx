import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { safeStorage } from "@/lib/storage";
import {
  AMBIENCE,
  GAME_FILES,
  GAME_LEVELS,
  RECORDED,
  type AmbienceTrack,
  type GameRecording,
} from "./gameSound";
import { SHOW_FILES, SHOW_LEVELS, cueEnd, type ShowCue, type ShowSoundName } from "./showSound";
import { MASTER_GAIN, RECIPES } from "./synth";

export type SoundName =
  | "crowd"
  | "floodlight"
  | "bat"
  | "net"
  | "smash"
  | "clap"
  | "bounce"
  | "ooh"
  | "hit"
  | "court"
  | "applause"
  | "shuttle"
  | "squeak";

interface AudioApi {
  enabled: boolean;
  unlocked: boolean;
  toggle(): void;
  /** Call from a user gesture (ENTER THE ARENA, the sound toggle, a game's first input): browsers block audio before one. */
  unlock(): void;
  play(name: SoundName): void;
  /**
   * Plays a show (`showSchedule`): recorded clunks and a crowd, each placed on the audio clock from `startAt`, the
   * `performance.now()` moment the show's animations began (default: now). A clunk whose time has already passed,
   * because the file was still decoding, is skipped, never played late. Needs an unlock and the sound on.
   */
  playShow(schedule: readonly ShowCue[], startAt?: number): void;
  /**
   * Starts fetching the show's recordings (the bytes only: no sound context is made, so no gesture is needed), so
   * they are ready when a show plays. Cheap to call again: each file is fetched once.
   */
  prefetchShow(): void;
  /** Fades the show out over `fadeMs` (default 300): SKIP, leaving the page, switching tabs. */
  stopShow(fadeMs?: number): void;
  /**
   * Starts fetching the recordings of these game sounds (the bytes only, like `prefetchShow`); each is decoded once
   * there is a context, so it is ready by the first ball. Until then a sound plays its code-made recipe.
   */
  prefetchSounds(names: readonly (SoundName | AmbienceTrack)[]): void;
  /**
   * The stadium's hum under a game: `true` asks for it, `false` fades it out (leaving). It plays only once sound is
   * unlocked by a gesture and on, fades in then, and fades out while the sound is off or the tab is hidden. `track`
   * is the venue's own hum (default the cricket crowd's `"murmur"`); asking for another one fades the first out.
   */
  ambience(on: boolean, track?: AmbienceTrack): void;
}

/** Every recording: the show's two and the games'. */
const FILES = { ...SHOW_FILES, ...GAME_FILES } as const;
type RecordingName = keyof typeof FILES;

/** The hum: whether a game wants it, which track, and its bus and loop while it plays. */
interface Ambience {
  wanted: boolean;
  track: AmbienceTrack;
  /** The track that is playing (it may differ from `track` while the old one fades out). */
  playing: AmbienceTrack | null;
  bus: GainNode | null;
  source: AudioBufferSourceNode | null;
}

/** A show in flight: its own bus (so it can be faded as one) and everything playing through it. */
interface ActiveShow {
  bus: GainNode | null;
  sources: AudioBufferSourceNode[];
  stopped: boolean;
}

const AudioCtx = createContext<AudioApi | null>(null);
const KEY = "arena:audio";
/** The same sound asked for again within this many seconds is ignored, so rapid repeats cannot pile up and clip. */
const MIN_GAP_S = 0.06;

/**
 * A limiter wired to the speakers: sounds that overlap cannot add up past full scale and clip. Null where the
 * browser has no compressor, and the master gain then feeds the speakers directly.
 */
function limiterFor(ctx: AudioContext): AudioNode | null {
  try {
    const limiter = ctx.createDynamicsCompressor();
    limiter.threshold.value = -6;
    limiter.knee.value = 0;
    limiter.ratio.value = 20;
    limiter.attack.value = 0.003;
    limiter.release.value = 0.1;
    limiter.connect(ctx.destination);
    return limiter;
  } catch {
    return null;
  }
}

/** The loudness of the crowd (gain 0 to 1) at `t` seconds into its cue: rising, held, then falling away. */
function crowdLevel(cue: ShowCue, t: number): number {
  const rise = cue.fadeIn ?? 0;
  const hold = cue.holdUntil ?? cue.at + rise;
  const fall = cue.fadeOut ?? 0;
  if (t < cue.at) return 0;
  if (t < cue.at + rise) return (t - cue.at) / rise;
  if (t < hold || fall <= 0) return t < hold ? 1 : 0;
  return Math.max(0, 1 - (t - hold) / fall);
}

/**
 * The game sounds are made in code (spec §4.6, P1; see `synth.ts` for the recipes), except the few that are CC0
 * recordings (`gameSound.ts`): the bat, the "ooh", the cheer, the tennis hit, court bounce and applause, and the 3D
 * games' hums. The Home and Intro show is two more recordings. All live in public/audio, fetched ahead and decoded
 * once a gesture has made the context.
 */
export function AudioProvider({ children }: { children: ReactNode }) {
  // Starts enabled so prerender and first client render match; the saved mute is applied after mount.
  const [enabled, setEnabled] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const enabledRef = useRef(true);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const lastPlayed = useRef<Partial<Record<SoundName, number>>>({});
  const bytes = useRef<Partial<Record<RecordingName, Promise<ArrayBuffer | null>>>>({});
  const buffers = useRef<Partial<Record<RecordingName, Promise<AudioBuffer | null>>>>({});
  /** The decoded recordings, for the game sounds that play at once (no waiting on a promise). */
  const decoded = useRef<Partial<Record<RecordingName, AudioBuffer>>>({});
  /** The game recordings asked for so far: decoded as soon as there is a context. */
  const wanted = useRef(new Set<GameRecording>());
  const showRef = useRef<ActiveShow | null>(null);
  const ambienceRef = useRef<Ambience>({
    wanted: false,
    track: "murmur",
    playing: null,
    bus: null,
    source: null,
  });

  /** Every sound passes through this gain, so muting is one change and silences a sound already playing. */
  const setMaster = useCallback((on: boolean) => {
    const ctx = ctxRef.current;
    masterRef.current?.gain.setValueAtTime(on ? MASTER_GAIN : 0, ctx?.currentTime ?? 0);
  }, []);

  useEffect(() => {
    const saved = safeStorage.get(KEY) !== "off";
    enabledRef.current = saved;
    // Deliberate: syncing from localStorage (an external store) after mount keeps hydration identical.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setEnabled(saved);
  }, []);

  /** Browsers start a context suspended until a gesture; iOS can suspend it again. A refusal stays silent. */
  const wake = useCallback((ctx: AudioContext) => {
    try {
      if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    } catch {
      /* stay silent */
    }
  }, []);

  /** Fetches a recording's bytes once (no context needed); a failure is a missing sound and is tried again next time. */
  const fetchBytes = useCallback((name: RecordingName) => {
    let loading = bytes.current[name];
    if (!loading) {
      loading = (async () => {
        try {
          const response = await fetch(FILES[name]);
          return response.ok ? await response.arrayBuffer() : null;
        } catch {
          return null;
        }
      })().then((data) => {
        if (!data) delete bytes.current[name];
        return data;
      });
      bytes.current[name] = loading;
    }
    return loading;
  }, []);

  /** Decodes a recording once per context, from the prefetched bytes (or fetching them now). A failure stays silent. */
  const load = useCallback(
    (ctx: AudioContext, name: RecordingName) => {
      let loading = buffers.current[name];
      if (!loading) {
        loading = (async () => {
          try {
            const data = await fetchBytes(name);
            // decodeAudioData takes its input apart: give it a copy, so a failed decode can be tried again.
            return data ? await ctx.decodeAudioData(data.slice(0)) : null;
          } catch {
            return null;
          }
        })().then((buffer) => {
          if (!buffer) delete buffers.current[name];
          else if (ctxRef.current === ctx) decoded.current[name] = buffer;
          return buffer;
        });
        buffers.current[name] = loading;
      }
      return loading;
    },
    [fetchBytes],
  );

  /** The hum fades in, if a game wants it and it may play: unlocked (a context), the sound on, the tab in view. */
  const startAmbience = useCallback(() => {
    const ctx = ctxRef.current;
    const master = masterRef.current;
    const a = ambienceRef.current;
    if (!a.wanted || a.source || !ctx || !master || !enabledRef.current || document.hidden) return;
    const track = a.track;
    void load(ctx, track).then((buffer) => {
      if (!buffer || a.source || !a.wanted || a.track !== track) return;
      if (!enabledRef.current || document.hidden || ctxRef.current !== ctx) return;
      try {
        wake(ctx);
        const now = ctx.currentTime;
        const bus = ctx.createGain();
        bus.gain.setValueAtTime(0, now);
        bus.gain.linearRampToValueAtTime(GAME_LEVELS[track], now + AMBIENCE.fadeIn);
        bus.connect(master);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.loop = true;
        source.connect(bus);
        source.start(now);
        a.bus = bus;
        a.source = source;
        a.playing = track;
      } catch {
        /* no hum is a quiet stadium, not an error */
      }
    });
  }, [load, wake]);

  /** The hum fades out (it may be asked for again: it fades back in when it can play). */
  const stopAmbience = useCallback(() => {
    const a = ambienceRef.current;
    const ctx = ctxRef.current;
    const { bus, source } = a;
    a.bus = null;
    a.source = null;
    a.playing = null;
    if (!bus || !source || !ctx) return;
    try {
      const now = ctx.currentTime;
      bus.gain.cancelScheduledValues(now);
      bus.gain.setValueAtTime(bus.gain.value, now);
      bus.gain.linearRampToValueAtTime(0, now + AMBIENCE.fadeOut);
      source.stop(now + AMBIENCE.fadeOut + 0.05);
      source.onended = () => {
        source.disconnect();
        bus.disconnect();
      };
    } catch {
      /* cut when the context goes */
    }
  }, []);

  /** Call from a user gesture (a click or a key): the first call makes the context, every call wakes it if it slept. */
  const unlock = useCallback(() => {
    setUnlocked(true);
    if (typeof window === "undefined") return;
    if (ctxRef.current) return wake(ctxRef.current);
    try {
      const ctx = new window.AudioContext();
      const master = ctx.createGain();
      master.gain.value = enabledRef.current ? MASTER_GAIN : 0;
      master.connect(limiterFor(ctx) ?? ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
      wake(ctx);
      // The game recordings fetched ahead can be decoded now; the hum starts if a game is waiting for it.
      for (const name of wanted.current) void load(ctx, name);
      startAmbience();
    } catch {
      /* no Web Audio, or the browser refused: stay silent */
    }
  }, [wake, load, startAmbience]);

  /** Turning the sound on is itself a gesture, so a game reached directly can be turned on without first visiting the Landing. */
  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    safeStorage.set(KEY, next ? "on" : "off");
    setEnabled(next);
    if (next) unlock();
    setMaster(next);
    // Muting cuts every sound at once (the master gain); the hum fades on its own bus and comes back up when on again.
    if (next) startAmbience();
    else stopAmbience();
  }, [setMaster, unlock, startAmbience, stopAmbience]);

  const play = useCallback(
    (name: SoundName) => {
      const ctx = ctxRef.current;
      const master = masterRef.current;
      if (!enabledRef.current || !ctx || !master) return;
      try {
        wake(ctx);
        const last = lastPlayed.current[name];
        if (last !== undefined && ctx.currentTime - last < MIN_GAP_S) return;
        lastPlayed.current[name] = ctx.currentTime;
        const recording = RECORDED[name];
        const buffer = recording && decoded.current[recording];
        if (!recording || !buffer) return RECIPES[name](ctx, master, ctx.currentTime + 0.005);
        const out = ctx.createGain();
        out.gain.value = GAME_LEVELS[recording];
        out.connect(master);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(out);
        source.onended = () => {
          source.disconnect();
          out.disconnect();
        };
        source.start(ctx.currentTime + 0.005);
      } catch {
        /* a sound that cannot play is a missing sound, not an error */
      }
    },
    [wake],
  );

  const prefetchSounds = useCallback(
    (names: readonly (SoundName | AmbienceTrack)[]) => {
      if (typeof window === "undefined") return;
      for (const name of names) {
        const recording = name === "murmur" || name === "hush" ? name : RECORDED[name];
        if (!recording) continue;
        wanted.current.add(recording);
        void fetchBytes(recording);
        if (ctxRef.current) void load(ctxRef.current, recording);
      }
    },
    [fetchBytes, load],
  );

  const ambience = useCallback(
    (on: boolean, track: AmbienceTrack = "murmur") => {
      const a = ambienceRef.current;
      a.wanted = on;
      a.track = track;
      // Another track than the one playing: it fades out and the new one fades in.
      if (on && a.playing && a.playing !== track) stopAmbience();
      if (on) startAmbience();
      else stopAmbience();
    },
    [startAmbience, stopAmbience],
  );

  const prefetchShow = useCallback(() => {
    if (typeof window === "undefined") return;
    for (const name of Object.keys(SHOW_FILES) as ShowSoundName[]) void fetchBytes(name);
  }, [fetchBytes]);

  const stopShow = useCallback((fadeMs = 300) => {
    const show = showRef.current;
    const ctx = ctxRef.current;
    showRef.current = null;
    if (!show) return;
    show.stopped = true;
    if (!show.bus || !ctx) return;
    try {
      const now = ctx.currentTime;
      const end = now + fadeMs / 1000;
      const gain = show.bus.gain;
      gain.cancelScheduledValues(now);
      gain.setValueAtTime(gain.value, now);
      gain.linearRampToValueAtTime(0, end);
      for (const source of show.sources) source.stop(end + 0.02);
    } catch {
      /* a show that cannot be faded is cut when its files end */
    }
  }, []);

  const playShow = useCallback(
    (schedule: readonly ShowCue[], startAt?: number) => {
      const ctx = ctxRef.current;
      const master = masterRef.current;
      if (!enabledRef.current || !ctx || !master || schedule.length === 0) return;
      const origin = startAt ?? performance.now();
      stopShow(30);
      wake(ctx);
      const show: ActiveShow = { bus: null, sources: [], stopped: false };
      showRef.current = show;
      document.documentElement.dataset.showScheduled = String(schedule.length);
      // The bus exists before any file does, so both sounds join the same one and stopShow can fade it at any time.
      let bus: GainNode;
      try {
        bus = ctx.createGain();
        bus.gain.value = SHOW_LEVELS.bus;
        bus.connect(master);
        show.bus = bus;
      } catch {
        return;
      }
      /** Places one sound's cues the moment its own file is decoded (the small clunks never wait for the crowd). */
      const place = (sound: ShowSoundName, buffer: AudioBuffer | null) => {
        if (!buffer || show.stopped || ctxRef.current !== ctx || !enabledRef.current) return;
        try {
          // Where the show has got to by now (decoding took time), on the same clock the animations run on.
          const elapsed = (performance.now() - origin) / 1000;
          const now = ctx.currentTime;
          for (const cue of schedule) {
            if (cue.sound !== sound) continue;
            // Past its moment: a clunk is skipped, never played late; a crowd whose run is over has nothing to add.
            if (sound === "light" ? cue.at < elapsed : cueEnd(cue) <= elapsed) continue;
            const out = ctx.createGain();
            out.connect(bus);
            const source = ctx.createBufferSource();
            source.buffer = buffer;
            source.connect(out);
            if (sound === "light") {
              out.gain.value = SHOW_LEVELS.light;
              source.start(now + (cue.at - elapsed));
            } else {
              // Joins the swell where it has got to if decoding was slow; the crowd is steady noise, so nothing is missed.
              const end = cueEnd(cue);
              const from = Math.max(cue.at, elapsed);
              const rise = cue.at + (cue.fadeIn ?? 0);
              const hold = cue.holdUntil ?? rise;
              const at = (t: number) => now + (t - elapsed);
              const peak = SHOW_LEVELS.crowd;
              out.gain.setValueAtTime(crowdLevel(cue, from) * peak, at(from));
              if (rise > from) out.gain.linearRampToValueAtTime(peak, at(rise));
              if (hold > Math.max(from, rise)) out.gain.setValueAtTime(peak, at(hold));
              out.gain.linearRampToValueAtTime(0, at(end));
              source.start(at(from));
              source.stop(at(end) + 0.05);
            }
            source.onended = () => {
              source.disconnect();
              out.disconnect();
            };
            show.sources.push(source);
          }
        } catch {
          /* a show that cannot play is a silent show, not an error */
        }
      };
      for (const sound of new Set(schedule.map((cue) => cue.sound)))
        void load(ctx, sound).then((buffer) => place(sound, buffer));
    },
    [load, stopShow, wake],
  );

  // Switching tabs or minimising ends the show and fades the hum: nothing should roar from a page nobody is looking at.
  // Back in view, the hum comes up again if the game still wants it.
  useEffect(() => {
    const onVisibility = () => {
      if (document.hidden) {
        stopShow(300);
        stopAmbience();
      } else startAmbience();
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => {
      document.removeEventListener("visibilitychange", onVisibility);
      stopShow(0);
      stopAmbience();
    };
  }, [stopShow, startAmbience, stopAmbience]);

  const api = useMemo(
    () => ({
      enabled,
      unlocked,
      toggle,
      unlock,
      play,
      playShow,
      prefetchShow,
      stopShow,
      prefetchSounds,
      ambience,
    }),
    [
      enabled,
      unlocked,
      toggle,
      unlock,
      play,
      playShow,
      prefetchShow,
      stopShow,
      prefetchSounds,
      ambience,
    ],
  );
  return <AudioCtx.Provider value={api}>{children}</AudioCtx.Provider>;
}

export function useAudio(): AudioApi {
  const api = useContext(AudioCtx);
  if (!api) throw new Error("useAudio must be used inside <AudioProvider>");
  return api;
}
