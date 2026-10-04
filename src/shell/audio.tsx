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

export type SoundName = "crowd" | "floodlight" | "bat" | "net" | "smash";

/** Drop files in public/audio/ and list them here (spec §4.6). Empty = silent slots. */
export const SOUND_FILES: Partial<Record<SoundName, string>> = {};

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

export function AudioProvider({ children }: { children: ReactNode }) {
  // Starts enabled so prerender and first client render match; the saved mute is applied after mount.
  const [enabled, setEnabled] = useState(true);
  const [unlocked, setUnlocked] = useState(false);
  const enabledRef = useRef(true);
  const ctxRef = useRef<AudioContext | null>(null);
  const buffers = useRef(new Map<SoundName, AudioBuffer>());

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
  }, []);

  const unlock = useCallback(() => {
    setUnlocked(true);
    if (typeof window === "undefined" || ctxRef.current || !("AudioContext" in window)) return;
    ctxRef.current = new AudioContext();
  }, []);

  const play = useCallback(
    (name: SoundName) => {
      const url = SOUND_FILES[name];
      const ctx = ctxRef.current;
      if (!enabled || !unlocked || !url || !ctx) return;
      const start = (buffer: AudioBuffer) => {
        const src = ctx.createBufferSource();
        src.buffer = buffer;
        src.connect(ctx.destination);
        src.start();
      };
      const cached = buffers.current.get(name);
      if (cached) return start(cached);
      fetch(url)
        .then((r) => r.arrayBuffer())
        .then((data) => ctx.decodeAudioData(data))
        .then((buffer) => {
          buffers.current.set(name, buffer);
          start(buffer);
        })
        .catch(() => {
          /* missing or undecodable file: stay silent */
        });
    },
    [enabled, unlocked],
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
