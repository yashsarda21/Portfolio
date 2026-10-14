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
import { MASTER_GAIN, RECIPES } from "./synth";

export type SoundName = "crowd" | "floodlight" | "bat" | "net" | "smash";

interface AudioApi {
  enabled: boolean;
  unlocked: boolean;
  toggle(): void;
  /** Call from a user gesture (ENTER THE ARENA, the sound toggle, a game's first input): browsers block audio before one. */
  unlock(): void;
  play(name: SoundName): void;
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

/** The five sounds are made in code, not loaded (spec §4.6, P1); see `synth.ts` for the recipes. */
export function AudioProvider({ children }: { children: ReactNode }) {
  // Starts enabled so prerender and first client render match; the saved mute is applied after mount.
  const [enabled, setEnabled] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const enabledRef = useRef(true);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);
  const lastPlayed = useRef<Partial<Record<SoundName, number>>>({});

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
    } catch {
      /* no Web Audio, or the browser refused: stay silent */
    }
  }, [wake]);

  /** Turning the sound on is itself a gesture, so a game reached directly can be turned on without first visiting the Landing. */
  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    safeStorage.set(KEY, next ? "on" : "off");
    setEnabled(next);
    if (next) unlock();
    setMaster(next);
  }, [setMaster, unlock]);

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
        RECIPES[name](ctx, master, ctx.currentTime + 0.005);
      } catch {
        /* a sound that cannot play is a missing sound, not an error */
      }
    },
    [wake],
  );

  const api = useMemo(
    () => ({ enabled, unlocked, toggle, unlock, play }),
    [enabled, unlocked, toggle, unlock, play],
  );
  return <AudioCtx.Provider value={api}>{children}</AudioCtx.Provider>;
}

export function useAudio(): AudioApi {
  const api = useContext(AudioCtx);
  if (!api) throw new Error("useAudio must be used inside <AudioProvider>");
  return api;
}
