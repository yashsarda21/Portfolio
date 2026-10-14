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
  /** Call from the first user gesture (e.g. ENTER THE ARENA) — browsers block audio before that. */
  unlock(): void;
  play(name: SoundName): void;
}

const AudioCtx = createContext<AudioApi | null>(null);
const KEY = "arena:audio";

/** The five sounds are made in code, not loaded (spec §4.6, P1); see `synth.ts` for the recipes. */
export function AudioProvider({ children }: { children: ReactNode }) {
  // Starts enabled so prerender and first client render match; the saved mute is applied after mount.
  const [enabled, setEnabled] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const enabledRef = useRef(true);
  const ctxRef = useRef<AudioContext | null>(null);
  const masterRef = useRef<GainNode | null>(null);

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

  const toggle = useCallback(() => {
    const next = !enabledRef.current;
    enabledRef.current = next;
    safeStorage.set(KEY, next ? "on" : "off");
    setEnabled(next);
    setMaster(next);
  }, [setMaster]);

  /** Browsers start a context suspended until a gesture; iOS can suspend it again. A refusal stays silent. */
  const wake = useCallback((ctx: AudioContext) => {
    try {
      if (ctx.state === "suspended") void ctx.resume().catch(() => {});
    } catch {
      /* stay silent */
    }
  }, []);

  const unlock = useCallback(() => {
    setUnlocked(true);
    if (typeof window === "undefined") return;
    if (ctxRef.current) return wake(ctxRef.current);
    try {
      const ctx = new window.AudioContext();
      const master = ctx.createGain();
      master.gain.value = enabledRef.current ? MASTER_GAIN : 0;
      master.connect(ctx.destination);
      ctxRef.current = ctx;
      masterRef.current = master;
      wake(ctx);
    } catch {
      /* no Web Audio, or the browser refused: stay silent */
    }
  }, [wake]);

  const play = useCallback(
    (name: SoundName) => {
      const ctx = ctxRef.current;
      const master = masterRef.current;
      if (!enabledRef.current || !ctx || !master) return;
      try {
        wake(ctx);
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
