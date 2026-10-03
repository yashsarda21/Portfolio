# Phase 0D — Stage, Shell Services, Transitions & Routes Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**What this plan does (plain words):** turns the component library into a real, clickable site.

- **Routes:** all 16 pages of the site map exist, pre-rendered as HTML. They show "coming in phase N" placeholders.
- **The Stage:** cinematic screens are drawn at 1440×900 and scaled to fit any laptop or monitor, with the stadium filling the edges.
- **The volt broadcast wipe** plays between pages.
- **Shell services** sit behind every page:
  - the commentary line queue
  - crowd audio (silent until sound files are added)
  - your visitors' saved match record
- **The homepage** becomes a static preview of the Landing, built from real components (Phase 3 adds the cinematic intro on top) and compared against your artboard.

**Goal:** A navigable, pre-rendered app shell where every route renders, transitions work with keyboard focus management and reduced motion, `/` matches `Main@1440x900` within 3%, and `pnpm verify` stays green. This completes Phase 0.

**Architecture:**
- `src/shell/` holds site-wide services as React context, with small stable hooks:
  - `useArenaTransition`
  - `useCommentary`
  - `useAudio`
  - `useMatchRecord` (Zustand, persisted to versioned, failure-safe `localStorage`)
- `ArenaLink` wraps React Router's `Link`. It plays the wipe, then navigates; without JS it is a normal link.
- `Stage` (design system) scales a 1440×900 layer by `--stage-scale`. An inline `<head>` script sets the variable before first paint, so there is no flash.
- Routes are thin: meta from UI copy plus one feature screen.
- Content validation moves to build time (a Vite plugin), so Zod never ships to visitors.

**Tech Stack:** React 19, React Router 8 (framework mode, `prerender: true`), Tailwind v4 Arena tokens, GSAP 3 core, Zustand 5 (`persist`), Vitest, Playwright + axe, `expectMatchesArtboard`.

**Spec:** `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md`:
- §4.3 rendering
- §4.4 Stage
- §4.5 routes
- §4.6 shell services
- §7 motion
- §11.1 accessibility

Carry-over: `docs/superpowers/plans/phase-0-carryover.md`, the 0D rows:
- build-time content validation
- replacing the placeholder home
- ArenaBackdrop full-bleed layering

**Scope decisions:**
- Every page except `/` is a placeholder; Phases 1–6 replace them.
- The tunnel-push transition is a light version (scale + blur, then wipe). Phase 4 refines it with the Hub camera.
- No sound files exist yet. The audio system ships complete with empty slots.

## Global Constraints

All Phase 0A–0C constraints apply:
- Arena tokens only.
- **Literal class strings.**
- **Type-recipe overrides go in a separate `cn()` argument after the `type-*` class.** Prettier reorders literal strings, and `cn` drops overrides that land before the recipe.
- No raw hex, `rgb()` or `cubic-bezier()` in TS/TSX.
- No arbitrary type sizes.
- No inline `var(--color-*)`.
- Polymorphic `as`.
- `className` merged via `cn`.
- Mono ≥11px, contrast ≥4.5:1, volt focus ring, reduced motion respected.
- Every design-system component gets a story and a barrel export.
- Commits end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Branch `phase/0-foundation`. Git 2.15 (no `switch`/`restore`).

New for 0D:
- **Folder rules:**
  - `app/routes/*` only compose: `meta` via `pageMeta(key)` plus one feature screen.
  - `src/shell` may import `design-system`, `content` and `lib`.
  - `src/features/*` may import `shell`, `design-system`, `content` and `lib`.
  - `design-system` never imports `shell`.
- **No visible copy in components or routes.** Every string comes from `src/content` (`ui` copy or resume content).
- **Zod stays out of the client bundle:** only `src/content/schema.ts`, the content tests and the Vite config may import `zod` or the schema.
- **Lean testing:**
  - unit tests for service logic (storage, match record, commentary, audio)
  - e2e for every route rendering with JS off
  - axe on every route
  - the transition and focus flow
  - Stage scaling
  - the `/` fidelity diff

## Review Focus

1. **Keyboard and screen-reader navigation:** after any client navigation (wipe, reduced-motion or back/forward), focus lands on the new page's `<h1>` and the page title is announced. Test: Task 6 `routes.spec.ts` "focus moves to the new heading".
2. **Storage can fail:** private mode or blocked storage must never break the site. The record simply doesn't persist. Tests: Task 2 `storage.test.ts`, `matchRecord.test.ts`.
3. **Modified clicks are untouched:** Cmd/Ctrl/Shift/middle-click on an `ArenaLink` opens a new tab normally, with no wipe and no `preventDefault`. Test: Task 5 `ArenaLink.test.tsx`.
4. **No-JS and crawlers:** every route's pre-rendered HTML contains its heading and working `href`s. Test: Task 6 `routes.spec.ts` "renders without JavaScript".
5. **Stage fits any viewport:** at 1280×720 the stage is 1152×720 and centred. Below 768px it's hidden and the mobile placeholder shows. Test: Task 6 `routes.spec.ts` "stage scales to fit".

---

## File map

```
src/lib/storage.ts + storage.test.ts                                    (Task 1)
src/lib/motion.ts                                                       (Task 1)
src/design-system/tokens/motion.css                                     (Task 1: fade/rise/pop presets)
vite.config.ts, src/content/index.ts, eslint.config.js                  (Task 1: build-time content check, zod restriction)
src/shell/matchRecord.ts + matchRecord.test.ts                          (Task 2)
src/shell/audio.tsx + audio.test.tsx                                    (Task 2)
src/shell/commentary.tsx + commentary.test.tsx                          (Task 3)
src/design-system/layout/Stage.tsx, stageScript.ts, Stage.stories.tsx   (Task 4)
src/design-system/scene/ArenaBackdrop.tsx (bleed prop)                  (Task 4)
src/shell/transition.tsx, ArenaLink.tsx + ArenaLink.test.tsx            (Task 5)
src/shell/RouteAnnouncer.tsx, QuickViewChip.tsx, ArenaShell.tsx         (Task 5)
src/shell/routes.ts, src/shell/meta.ts                                  (Task 6)
src/content/ui-copy.ts                                                  (Task 6: routes, landing, shell copy)
src/features/placeholder/PlaceholderScreen.tsx                          (Task 6)
src/features/landing-preview/LandingPreview.tsx                         (Task 6)
app/root.tsx, app/routes.ts, app/routes/*.tsx (16 files)                (Task 6)
tests/e2e/routes.spec.ts                                                (Task 6)
```

Execution batching (orchestrator): run A = Tasks 1–3 (logic), run B = Tasks 4–5 (Stage + transitions), run C = Task 6 (routes, screens, e2e, fidelity).

---

### Task 1: Storage, motion presets, build-time content validation

**Files:**
- Create: `src/lib/storage.ts`, `src/lib/storage.test.ts`, `src/lib/motion.ts`
- Modify: `src/design-system/tokens/motion.css`, `vite.config.ts`, `src/content/index.ts`, `eslint.config.js`, `package.json` (gsap), `docs/superpowers/plans/phase-0-carryover.md`

**Interfaces:**
- `safeStorage: { get(key: string): string | null; set(key: string, value: string): void; remove(key: string): void }`. Never throws. Behaves as empty when `window` is missing (prerender) or storage throws.
- `safeJSONStorage`: a Zustand `StateStorage`-compatible object (`getItem/setItem/removeItem`) built on `safeStorage`.
- `gsap` (re-export) and `prefersReducedMotion(): boolean` from `@/lib/motion`.
- CSS `animate-fade`, `animate-rise`, `animate-pop`. Delay via the `--d` custom property, e.g. `style={{ "--d": "0.3s" }}`.
- `@/content` exports `content` (typed, no runtime parse). `parseContent`/`ContentError` are no longer exported from the barrel; tests import `./schema` directly. The Vite plugin `arena-content-check` validates `content.json` on every dev start and build.

- [ ] **Step 1: Failing storage test**

`src/lib/storage.test.ts`:
```ts
import { afterEach, describe, expect, it, vi } from "vitest";
import { safeStorage } from "./storage";

describe("safeStorage", () => {
  afterEach(() => vi.restoreAllMocks());

  it("round-trips values", () => {
    safeStorage.set("arena:test", "1");
    expect(safeStorage.get("arena:test")).toBe("1");
    safeStorage.remove("arena:test");
    expect(safeStorage.get("arena:test")).toBeNull();
  });

  it("never throws when storage is blocked", () => {
    vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("SecurityError");
    });
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => safeStorage.set("k", "v")).not.toThrow();
    expect(safeStorage.get("k")).toBeNull();
  });
});
```
Run: `pnpm test src/lib/storage.test.ts`. Expected: FAIL (module missing).

- [ ] **Step 2: Implement storage and motion helpers**

`src/lib/storage.ts`:
```ts
/** localStorage that never throws (private mode, blocked storage, prerender). Spec §4.6. */
function store(): Storage | null {
  try {
    return typeof window === "undefined" ? null : window.localStorage;
  } catch {
    return null;
  }
}

export const safeStorage = {
  get(key: string): string | null {
    try {
      return store()?.getItem(key) ?? null;
    } catch {
      return null;
    }
  },
  set(key: string, value: string): void {
    try {
      store()?.setItem(key, value);
    } catch {
      /* storage unavailable — the site works without it */
    }
  },
  remove(key: string): void {
    try {
      store()?.removeItem(key);
    } catch {
      /* ignore */
    }
  },
};

/** Zustand persist-compatible storage on top of safeStorage. */
export const safeJSONStorage = {
  getItem: (name: string) => safeStorage.get(name),
  setItem: (name: string, value: string) => safeStorage.set(name, value),
  removeItem: (name: string) => safeStorage.remove(name),
};
```

`src/lib/motion.ts`:
```ts
export { gsap } from "gsap";

/** True when the visitor asked for reduced motion (always false during prerender). */
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
```
Install: `pnpm add gsap`. Run the storage test. Expected: pass.

- [ ] **Step 3: Motion presets**

Append to `src/design-system/tokens/motion.css`:
```css
/* Entrance presets (spec §7 CSS layer). Stagger with --d: style={{ "--d": "0.3s" }}. */
@keyframes fade-in {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@keyframes rise-in {
  from {
    opacity: 0;
    transform: translateY(18px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@keyframes pop-in {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  60% {
    opacity: 1;
    transform: scale(1.04);
  }
  100% {
    opacity: 1;
    transform: scale(1);
  }
}
@utility animate-fade {
  animation: fade-in 1s ease-out both;
  animation-delay: var(--d, 0s);
}
@utility animate-rise {
  animation: rise-in 0.9s var(--ease-follow) both;
  animation-delay: var(--d, 0s);
}
@utility animate-pop {
  animation: pop-in var(--dur-pop) var(--ease-follow) both;
  animation-delay: var(--d, 0s);
}
```

- [ ] **Step 4: Build-time content validation (carry-over 0D)**

`vite.config.ts`:
```ts
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, type Plugin } from "vite";
import raw from "./src/content/content.json";
import { parseContent } from "./src/content/schema";

/** Validates content.json at dev start and build, so the client bundle never needs Zod (spec §6). */
function contentCheck(): Plugin {
  return {
    name: "arena-content-check",
    buildStart() {
      parseContent(raw);
    },
  };
}

export default defineConfig({
  plugins: [contentCheck(), tailwindcss(), reactRouter()],
  resolve: { tsconfigPaths: true },
});
```

`src/content/index.ts`:
```ts
import raw from "./content.json";
import type { Content } from "./schema";

/**
 * Resume content. Validated at build time by the `arena-content-check` Vite plugin
 * and by schema.test.ts, so no runtime parsing (and no Zod) ships to visitors.
 */
export const content = raw as unknown as Content;

export type { Content, SkillLevel } from "./schema";
export * from "./format";
export * from "./selectors";
export { ui } from "./ui-copy";
export type { UiCopy } from "./ui-copy";
```
Note: the `import type` from `./schema` is erased at build time, so Zod isn't bundled.

Verify the build fails on bad content: temporarily delete one `name` in `content.json`, run `pnpm build`, and expect a failure naming `matchHighlights.N.name`. Then restore the file with `git checkout -- src/content/content.json`. Paste both outputs in your report.

`eslint.config.js`: add a block that forbids Zod and the schema outside the content layer. Keep this block's patterns merged with the existing restricted imports for those folders. Flat config merges rules by replacement, so if the same rule key already exists for a glob, add these groups to it instead of overriding it:
```js
  {
    files: ["app/**/*.{ts,tsx}", "src/features/**/*.{ts,tsx}", "src/shell/**/*.{ts,tsx}", "src/design-system/**/*.{ts,tsx}"],
    rules: {
      "no-restricted-imports": [
        "error",
        {
          paths: [{ name: "zod", message: "Zod is build-time only (content schema)." }],
          patterns: [{ group: ["@/content/schema", "**/content/schema"], message: "Import from @/content; the schema is build/test-only." }],
        },
      ],
    },
  },
```
Then run `pnpm lint` and fix any merge conflict with the existing per-folder `no-restricted-imports` rules. Each folder must keep its old groups plus these.

- [ ] **Step 5: Verify and commit**

Tick carry-over 0D "Validate content at build time…".
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build
git add -A
git commit -m "feat: safe storage, motion presets, build-time content validation

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Match record store and audio service

**Files:** create `src/shell/matchRecord.ts` + `matchRecord.test.ts`, and `src/shell/audio.tsx` + `audio.test.tsx`. Add the dependency `zustand`.

**Interfaces:**
- `type Venue = "cricket" | "tennis" | "badminton"`
- `useMatchRecord`: a Zustand hook. It is persisted under `arena:v1` (version 1) with `skipHydration: true`. State:
  ```ts
  {
    venuesPlayed: Venue[];
    lastScores: Partial<Record<Venue, string>>;
    sectionsSeen: string[];
    record: { yash: number; you: number };
    achievements: string[];
    lockerRoomUnlocked: boolean;
    teamUpPrefill: string | null;
    completeMatch(m: { venue: Venue; score: string; winner: "yash" | "you"; prefill?: string }): void;
    markSeen(section: string): void;
    reset(): void;
  }
  ```
- `MatchRecordHydrator`: renders nothing. It rehydrates from storage after mount, which avoids hydration mismatches.
- Audio:
  - `type SoundName = "crowd" | "floodlight" | "bat" | "net" | "smash"`
  - `SOUND_FILES: Partial<Record<SoundName, string>>`, empty for now.
  - `AudioProvider`.
  - `useAudio(): { enabled: boolean; unlocked: boolean; toggle(): void; unlock(): void; play(name: SoundName): void }`
  - Mute preference persisted under `arena:audio`. Default enabled.
  - `play` is a no-op unless enabled, unlocked and the file is listed.

- [ ] **Step 1: Failing tests**

`src/shell/matchRecord.test.ts`:
```ts
import { beforeEach, describe, expect, it, vi } from "vitest";
import { useMatchRecord } from "./matchRecord";

describe("match record", () => {
  beforeEach(() => useMatchRecord.getState().reset());

  it("records a played venue, its score and Yash's win", () => {
    useMatchRecord.getState().completeMatch({ venue: "cricket", score: "14*", winner: "yash" });
    const s = useMatchRecord.getState();
    expect(s.venuesPlayed).toEqual(["cricket"]);
    expect(s.lastScores.cricket).toBe("14*");
    expect(s.record).toEqual({ yash: 1, you: 0 });
    expect(s.lockerRoomUnlocked).toBe(false);
  });

  it("a visitor win unlocks the Giant Killer achievement, Locker Room and Team Up prefill", () => {
    useMatchRecord.getState().completeMatch({ venue: "tennis", score: "BOWLED", winner: "you", prefill: "I beat you." });
    const s = useMatchRecord.getState();
    expect(s.record).toEqual({ yash: 0, you: 1 });
    expect(s.achievements).toContain("giant-killer");
    expect(s.lockerRoomUnlocked).toBe(true);
    expect(s.teamUpPrefill).toBe("I beat you.");
  });

  it("does not duplicate venues or seen sections", () => {
    const { completeMatch, markSeen } = useMatchRecord.getState();
    completeMatch({ venue: "cricket", score: "6*", winner: "yash" });
    completeMatch({ venue: "cricket", score: "10*", winner: "yash" });
    markSeen("career");
    markSeen("career");
    const s = useMatchRecord.getState();
    expect(s.venuesPlayed).toEqual(["cricket"]);
    expect(s.lastScores.cricket).toBe("10*");
    expect(s.sectionsSeen).toEqual(["career"]);
  });

  it("keeps working when storage throws", () => {
    vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("QuotaExceededError");
    });
    expect(() => useMatchRecord.getState().markSeen("scout")).not.toThrow();
    expect(useMatchRecord.getState().sectionsSeen).toContain("scout");
    vi.restoreAllMocks();
  });
});
```

`src/shell/audio.test.tsx`:
```tsx
import { act, renderHook } from "@testing-library/react";
import type { ReactNode } from "react";
import { describe, expect, it } from "vitest";
import { AudioProvider, useAudio } from "./audio";

const wrapper = ({ children }: { children: ReactNode }) => <AudioProvider>{children}</AudioProvider>;

describe("audio service", () => {
  it("defaults to enabled but locked until a user gesture", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    expect(result.current.enabled).toBe(true);
    expect(result.current.unlocked).toBe(false);
  });

  it("toggling persists the preference", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.toggle());
    expect(result.current.enabled).toBe(false);
    expect(localStorage.getItem("arena:audio")).toBe("off");
  });

  it("play is a safe no-op with no sound files", () => {
    const { result } = renderHook(() => useAudio(), { wrapper });
    act(() => result.current.unlock());
    expect(() => result.current.play("crowd")).not.toThrow();
  });
});
```
Run both. Expected: FAIL.

- [ ] **Step 2: Implement**

`src/shell/matchRecord.ts`:
```ts
import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { safeJSONStorage } from "@/lib/storage";

export type Venue = "cricket" | "tennis" | "badminton";

interface MatchRecordData {
  venuesPlayed: Venue[];
  lastScores: Partial<Record<Venue, string>>;
  sectionsSeen: string[];
  record: { yash: number; you: number };
  achievements: string[];
  lockerRoomUnlocked: boolean;
  teamUpPrefill: string | null;
}

interface MatchRecordActions {
  completeMatch(m: { venue: Venue; score: string; winner: "yash" | "you"; prefill?: string }): void;
  markSeen(section: string): void;
  reset(): void;
}

const initial: MatchRecordData = {
  venuesPlayed: [],
  lastScores: {},
  sectionsSeen: [],
  record: { yash: 0, you: 0 },
  achievements: [],
  lockerRoomUnlocked: false,
  teamUpPrefill: null,
};

/** The visitor's saved progress (spec §4.6). Works without storage; just doesn't persist. */
export const useMatchRecord = create<MatchRecordData & MatchRecordActions>()(
  persist(
    (set) => ({
      ...initial,
      completeMatch: ({ venue, score, winner, prefill }) =>
        set((s) => {
          const won = winner === "you";
          return {
            venuesPlayed: s.venuesPlayed.includes(venue) ? s.venuesPlayed : [...s.venuesPlayed, venue],
            lastScores: { ...s.lastScores, [venue]: score },
            record: { yash: s.record.yash + (won ? 0 : 1), you: s.record.you + (won ? 1 : 0) },
            achievements: won && !s.achievements.includes("giant-killer") ? [...s.achievements, "giant-killer"] : s.achievements,
            lockerRoomUnlocked: s.lockerRoomUnlocked || won,
            teamUpPrefill: won && prefill ? prefill : s.teamUpPrefill,
          };
        }),
      markSeen: (section) =>
        set((s) => (s.sectionsSeen.includes(section) ? s : { sectionsSeen: [...s.sectionsSeen, section] })),
      reset: () => set({ ...initial }),
    }),
    { name: "arena:v1", version: 1, storage: createJSONStorage(() => safeJSONStorage), skipHydration: true },
  ),
);
```
Add to the same file:
```ts
import { useEffect } from "react";

/** Mount once in the shell: loads the saved record after hydration (no SSR mismatch). */
export function MatchRecordHydrator() {
  useEffect(() => {
    void useMatchRecord.persist.rehydrate();
  }, []);
  return null;
}
```
(Keep all imports at the top of the file.)

`src/shell/audio.tsx`:
```tsx
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
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
  const [enabled, setEnabled] = useState(() => safeStorage.get(KEY) !== "off");
  const [unlocked, setUnlocked] = useState(false);
  const ctxRef = useRef<AudioContext | null>(null);
  const buffers = useRef(new Map<SoundName, AudioBuffer>());

  const toggle = useCallback(() => {
    setEnabled((on) => {
      safeStorage.set(KEY, on ? "off" : "on");
      return !on;
    });
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

  const api = useMemo(() => ({ enabled, unlocked, toggle, unlock, play }), [enabled, unlocked, toggle, unlock, play]);
  return <AudioCtx.Provider value={api}>{children}</AudioCtx.Provider>;
}

export function useAudio(): AudioApi {
  const api = useContext(AudioCtx);
  if (!api) throw new Error("useAudio must be used inside <AudioProvider>");
  return api;
}
```
Note: `useState(() => safeStorage.get(KEY) !== "off")` reads storage during the first client render. During prerender storage is null, so the value is `true`. If the visitor muted, the first hydrated render differs (it only affects the toggle label, and React patches it). Accept that, or hydrate the preference in an effect. Prefer the effect: start with `true` and `useEffect(() => setEnabled(safeStorage.get(KEY) !== "off"), [])`. Do the effect version.

`pnpm add zustand`. Run the tests. Expected: pass.

- [ ] **Step 3: Commit**
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "feat(shell): persisted match record and audio service

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Commentary service

**Files:** create `src/shell/commentary.tsx` + `commentary.test.tsx`.

**Interfaces:**
- `CommentaryProvider`.
- `useCommentary(): { current: { line: string; state: "in" | "out" } | null; say(line: string, opts?: { interrupt?: boolean }): void; clear(): void }`. Rules (spec §4.6):
  1. One line at a time. Each line holds 4000ms, then exits over 300ms.
  2. While a line shows, only the **latest** pending line is kept.
  3. `interrupt: true` (screens use it on mount) starts the exit immediately and shows the new line next.
  4. Saying the line already showing does nothing.
- `CommentarySlot({ tag: string; className? })`:
  - Renders the visual `CommentaryBar` (`aria-hidden`, `state` passed through, hidden below 768px).
  - Also renders an always-mounted `sr-only` `aria-live="polite"` region holding the current line.

- [ ] **Step 1: Failing test**

`src/shell/commentary.test.tsx`:
```tsx
import { act, render, renderHook, screen } from "@testing-library/react";
import type { ReactNode } from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CommentaryProvider, CommentarySlot, useCommentary } from "./commentary";

const wrapper = ({ children }: { children: ReactNode }) => <CommentaryProvider>{children}</CommentaryProvider>;

describe("commentary service", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => vi.useRealTimers());

  it("holds a line for 4s, then exits and clears", () => {
    const { result } = renderHook(() => useCommentary(), { wrapper });
    act(() => result.current.say("Still not out."));
    expect(result.current.current).toEqual({ line: "Still not out.", state: "in" });
    act(() => vi.advanceTimersByTime(4000));
    expect(result.current.current?.state).toBe("out");
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.current).toBeNull();
  });

  it("keeps only the latest pending line and shows it next", () => {
    const { result } = renderHook(() => useCommentary(), { wrapper });
    act(() => {
      result.current.say("A");
      result.current.say("B");
      result.current.say("C");
    });
    expect(result.current.current?.line).toBe("A");
    act(() => vi.advanceTimersByTime(4300));
    expect(result.current.current).toEqual({ line: "C", state: "in" });
  });

  it("interrupt swaps the line after a short exit", () => {
    const { result } = renderHook(() => useCommentary(), { wrapper });
    act(() => result.current.say("Old"));
    act(() => result.current.say("New", { interrupt: true }));
    expect(result.current.current).toEqual({ line: "Old", state: "out" });
    act(() => vi.advanceTimersByTime(300));
    expect(result.current.current).toEqual({ line: "New", state: "in" });
  });

  it("mirrors the line into a polite live region", () => {
    function Speaker() {
      const { say } = useCommentary();
      return <button onClick={() => say("Career high score updated.")}>speak</button>;
    }
    render(
      <CommentaryProvider>
        <Speaker />
        <CommentarySlot tag="COMM" />
      </CommentaryProvider>,
    );
    act(() => screen.getByText("speak").click());
    const live = document.querySelector('[aria-live="polite"]')!;
    expect(live).toHaveTextContent("Career high score updated.");
  });
});
```
Run it. Expected: FAIL.

- [ ] **Step 2: Implement**

`src/shell/commentary.tsx`:
```tsx
import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";
import { CommentaryBar } from "@/design-system";

const HOLD_MS = 4000; // --dur-comm-hold
const EXIT_MS = 300;

type Current = { line: string; state: "in" | "out" } | null;

interface CommentaryApi {
  current: Current;
  say(line: string, opts?: { interrupt?: boolean }): void;
  clear(): void;
}

const Ctx = createContext<CommentaryApi | null>(null);

export function CommentaryProvider({ children }: { children: ReactNode }) {
  const [current, setCurrent] = useState<Current>(null);
  const pending = useRef<string | null>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  const schedule = (fn: () => void, ms: number) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(fn, ms);
  };

  const exit = useCallback(() => {
    setCurrent((c) => (c ? { ...c, state: "out" } : c));
    schedule(() => {
      const next = pending.current;
      pending.current = null;
      if (next) {
        setCurrent({ line: next, state: "in" });
        schedule(exit, HOLD_MS);
      } else {
        setCurrent(null);
      }
    }, EXIT_MS);
  }, []);

  const say = useCallback(
    (line: string, opts?: { interrupt?: boolean }) => {
      setCurrent((c) => {
        if (!c) {
          schedule(exit, HOLD_MS);
          return { line, state: "in" };
        }
        if (c.line === line && c.state === "in") return c;
        pending.current = line;
        if (opts?.interrupt && c.state === "in") queueMicrotask(exit);
        return c;
      });
    },
    [exit],
  );

  const clear = useCallback(() => {
    pending.current = null;
    if (timer.current) clearTimeout(timer.current);
    setCurrent(null);
  }, []);

  useEffect(() => () => {
    if (timer.current) clearTimeout(timer.current);
  }, []);

  const api = useMemo(() => ({ current, say, clear }), [current, say, clear]);
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
}

export function useCommentary(): CommentaryApi {
  const api = useContext(Ctx);
  if (!api) throw new Error("useCommentary must be used inside <CommentaryProvider>");
  return api;
}

/** The on-screen lower-third plus a polite live region (spec §4.6). Position it with className. */
export function CommentarySlot({ tag, className }: { tag: string; className?: string }) {
  const { current } = useCommentary();
  return (
    <>
      {current ? (
        <CommentaryBar aria-hidden="true" tag={tag} line={current.line} state={current.state} className={className ? `max-md:hidden ${className}` : "max-md:hidden"} />
      ) : null}
      <div aria-live="polite" className="sr-only">
        {current?.state === "in" ? current.line : ""}
      </div>
    </>
  );
}
```
Notes for the implementer:
- Use `cn` from `@/lib/cn` for the className merge instead of the string concatenation above.
- The `setCurrent` updater calls `schedule`/`queueMicrotask` (side effects inside an updater). Under React strict mode updaters can run twice. If the tests or strict mode show double-scheduling, refactor so `say` reads current state from a ref (`currentRef`) and performs side effects outside the updater. Do that refactor up front; it is the correct design. Keep the test expectations exactly as written.

Run the tests. Expected: pass.

- [ ] **Step 3: Commit**
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "feat(shell): commentary queue with live-region mirror

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
(End of run A: `pnpm verify`.)

---

### Task 4: Stage (scaled 1440×900) and full-bleed backdrop

**Files:** create `src/design-system/layout/Stage.tsx`, `stageScript.ts` and `Stage.stories.tsx`. Modify `src/design-system/scene/ArenaBackdrop.tsx` (add `bleed`), `src/design-system/index.ts`, and `docs/superpowers/plans/phase-0-carryover.md`.

**Interfaces:**
- `STAGE_SCALE_SCRIPT: string`: an inline script that sets `--stage-scale = min(innerWidth/1440, innerHeight/900)` on `<html>` and updates it on resize.
- `Stage({ backdrop?: ReactNode; desktopOnly?: boolean; className?: string; children })`:
  - The root fills the viewport (`h-dvh w-full`) with a night ground, a full-bleed `SkyGlow` and `data-transition-scene`.
  - Inside is a centred 1440×900 layer scaled by `var(--stage-scale)` with `data-stage`. It holds the backdrop (absolute, beneath) and then `children`.
  - With `desktopOnly` (default true) the whole Stage is hidden below 768px.
- `ArenaBackdrop` gains `bleed?: boolean`. When true it drops its own ground and clipping (`overflow-visible bg-transparent`), so the scene extends into the letterbox.

- [ ] **Step 1: Implement**

`src/design-system/layout/stageScript.ts`:
```ts
/** Inline in <head> before first paint so the scaled stage never flashes at the wrong size (spec §4.4). */
export const STAGE_SCALE_SCRIPT =
  "(function(){var d=document.documentElement;function s(){d.style.setProperty('--stage-scale',String(Math.min(innerWidth/1440,innerHeight/900)))}s();addEventListener('resize',s)})();";
```

`src/design-system/layout/Stage.tsx`:
```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { SkyGlow } from "../scene/SkyGlow";

interface StageProps {
  /** Scene drawn beneath the UI in the same 1440×900 space (e.g. <ArenaBackdrop bleed />). */
  backdrop?: ReactNode;
  /** Hide below 768px — cinematic screens render a mobile layout instead (spec D2). */
  desktopOnly?: boolean;
  className?: string;
  children: ReactNode;
}

/** Fixed 1440×900 design space scaled to fit the viewport; the scene bleeds into the letterbox (spec §4.4). */
export function Stage({ backdrop, desktopOnly = true, className, children }: StageProps) {
  return (
    <div data-transition-scene className={cn("relative h-dvh w-full overflow-hidden bg-night", desktopOnly && "max-md:hidden", className)}>
      <SkyGlow />
      <div
        data-stage
        className="absolute top-1/2 left-1/2 h-225 w-360 [transform:translate(-50%,-50%)_scale(var(--stage-scale,1))]"
      >
        {backdrop ? <div className="absolute inset-0">{backdrop}</div> : null}
        <div className="relative h-full w-full">{children}</div>
      </div>
    </div>
  );
}
```

`ArenaBackdrop.tsx`: add the prop `bleed = false` (documented: "Let the scene extend past 1440×900 into the Stage letterbox"). Append `bleed && "overflow-visible bg-transparent"` to the root `cn(...)`, after the base classes. Tick the carry-over row "ArenaBackdrop full-bleed…".

`Stage.stories.tsx`:
```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArenaBackdrop } from "../scene/ArenaBackdrop";
import { Heading } from "../primitives/Text";
import { Stage } from "./Stage";

const meta: Meta = { title: "Layout/Stage", parameters: { layout: "fullscreen" } };
export default meta;

export const LandingStage: StoryObj = {
  render: () => (
    <Stage backdrop={<ArenaBackdrop bleed />}>
      <Heading level={1} className="absolute top-90 left-0 w-full text-center">
        STAGE 1440 × 900
      </Heading>
    </Stage>
  ),
};
```
Note: in Storybook the inline head script doesn't run, so `--stage-scale` falls back to 1. Add the script to `.storybook/preview-head.html` (`<script>` + the same string; copy it literally, with a comment pointing to `stageScript.ts`) so stories scale like the app.

Barrel: `export { Stage } from "./layout/Stage";` and `export { STAGE_SCALE_SCRIPT } from "./layout/stageScript";`.

- [ ] **Step 2: Commit**
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "feat(design-system): scaled 1440x900 Stage with full-bleed backdrop

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Transitions, ArenaLink, route announcer, Quick View chip, shell composition

**Files:** create `src/shell/transition.tsx`, `ArenaLink.tsx` + `ArenaLink.test.tsx`, `RouteAnnouncer.tsx`, `QuickViewChip.tsx` and `ArenaShell.tsx`.

**Interfaces:**
- Transitions:
  - `TransitionProvider`.
  - `useArenaTransition(): { go(to: string, kind?: "wipe" | "tunnel"): Promise<void>; busy: boolean }`.
  - `go` plays the cover half of the wipe (240ms), navigates, waits for the next route to settle, then plays the reveal half (240ms). Total 480ms = `--dur-wipe`.
  - `tunnel` first scales and blurs `[data-transition-scene]` for 300ms.
  - With reduced motion, `go` navigates immediately and plays no overlay.
  - Calls made while `busy` are ignored.
- `WipeOverlay` (rendered by the provider): a fixed, `aria-hidden`, full-screen layer with a skewed (−18°) volt bar and a centred YS mark. It's invisible unless animating, and marked `data-wipe`.
- `ArenaLink`: React Router `LinkProps` plus `transition?: "wipe" | "tunnel" | "none"` (default `"wipe"`).
  - A plain left-click without modifier keys calls `preventDefault()` and runs `go()`.
  - Anything else (modifier keys, middle click, `transition="none"`, an already-prevented event) behaves as a normal `Link`.
- `RouteAnnouncer`: after every client navigation (not the first load), it waits two frames, then:
  - focuses the first `main h1` (adding `tabindex="-1"`, `preventScroll`)
  - writes `document.title` into an `sr-only` `aria-live="assertive"` region
- `QuickViewChip({ className? })`: `HUDButton` rendered as an `ArenaLink` to `ROUTES.scout`, labelled `ui.hud.quickView`.
- `ArenaShell({ children })`, in this order:
  1. `AudioProvider`
  2. `CommentaryProvider`
  3. `TransitionProvider` (renders `WipeOverlay`)
  4. `MatchRecordHydrator`
  5. `RouteAnnouncer`
  6. `children`

- [ ] **Step 1: Failing ArenaLink test**

`src/shell/ArenaLink.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { createMemoryRouter, RouterProvider } from "react-router";
import { describe, expect, it, vi } from "vitest";
import { ArenaLink } from "./ArenaLink";

const go = vi.fn(() => Promise.resolve());
vi.mock("./transition", () => ({ useArenaTransition: () => ({ go, busy: false }) }));

function setup() {
  const router = createMemoryRouter([{ path: "/", element: <ArenaLink to="/career">Career</ArenaLink> }]);
  render(<RouterProvider router={router} />);
  return screen.getByRole("link", { name: "Career" });
}

describe("ArenaLink", () => {
  it("keeps a real href for no-JS and crawlers", () => {
    expect(setup()).toHaveAttribute("href", "/career");
  });

  it("plain click runs the wipe transition", async () => {
    go.mockClear();
    await userEvent.click(setup());
    expect(go).toHaveBeenCalledWith("/career", "wipe");
  });

  it("modified clicks are left to the browser", async () => {
    go.mockClear();
    const link = setup();
    await userEvent.keyboard("{Meta>}");
    await userEvent.click(link);
    await userEvent.keyboard("{/Meta}");
    expect(go).not.toHaveBeenCalled();
  });
});
```
Run it. Expected: FAIL.

- [ ] **Step 2: Implement**

`src/shell/transition.tsx`:
```tsx
import { createContext, useCallback, useContext, useMemo, useRef, useState, type ReactNode } from "react";
import { useNavigate } from "react-router";
import { BrandLockup } from "@/design-system";
import { ui } from "@/content";
import { gsap, prefersReducedMotion } from "@/lib/motion";

type Kind = "wipe" | "tunnel";
interface TransitionApi {
  go(to: string, kind?: Kind): Promise<void>;
  busy: boolean;
}

const Ctx = createContext<TransitionApi | null>(null);
const nextFrame = () => new Promise<void>((r) => requestAnimationFrame(() => r()));

export function TransitionProvider({ children }: { children: ReactNode }) {
  const navigate = useNavigate();
  const [busy, setBusy] = useState(false);
  const busyRef = useRef(false);
  const bar = useRef<HTMLDivElement>(null);
  const mark = useRef<HTMLDivElement>(null);

  const go = useCallback(
    async (to: string, kind: Kind = "wipe") => {
      if (busyRef.current) return;
      if (prefersReducedMotion() || !bar.current || !mark.current) {
        await navigate(to);
        return;
      }
      busyRef.current = true;
      setBusy(true);
      try {
        const scene = document.querySelector<HTMLElement>("[data-transition-scene]");
        if (kind === "tunnel" && scene) {
          await gsap.to(scene, { scale: 1.06, filter: "blur(6px)", duration: 0.3, ease: "power2.in" });
        }
        // Cover: volt bar sweeps in at 18°, YS flashes mid-wipe (spec §6 broadcast wipe).
        await gsap
          .timeline()
          .set(bar.current, { xPercent: -130, autoAlpha: 1 })
          .to(bar.current, { xPercent: 0, duration: 0.24, ease: "power2.in" })
          .to(mark.current, { autoAlpha: 1, duration: 0.08 }, "-=0.06");
        await navigate(to);
        await nextFrame();
        await nextFrame();
        // Reveal.
        await gsap
          .timeline()
          .to(mark.current, { autoAlpha: 0, duration: 0.08 })
          .to(bar.current, { xPercent: 130, duration: 0.24, ease: "power2.out" }, "<")
          .set(bar.current, { autoAlpha: 0 });
      } finally {
        busyRef.current = false;
        setBusy(false);
      }
    },
    [navigate],
  );

  const api = useMemo(() => ({ go, busy }), [go, busy]);
  return (
    <Ctx.Provider value={api}>
      {children}
      <div aria-hidden="true" data-wipe className="pointer-events-none fixed inset-0 z-50 overflow-hidden">
        <div ref={bar} className="invisible absolute -inset-y-10 -left-1/4 w-[150vw] -skew-x-[18deg] bg-volt opacity-0" />
        <div ref={mark} className="invisible absolute inset-0 grid place-items-center opacity-0">
          <BrandLockup mark={ui.brand.mark} size="lg" className="scale-200 [&>span:first-child]:border-volt-ink [&>span:first-child]:text-volt-ink" />
        </div>
      </div>
    </Ctx.Provider>
  );
}

export function useArenaTransition(): TransitionApi {
  const api = useContext(Ctx);
  if (!api) throw new Error("useArenaTransition must be used inside <TransitionProvider>");
  return api;
}
```
Implementer notes:
- `await navigate(to)`: React Router data routers return a Promise from `navigate`. If v8 returns `void`, the two `nextFrame()` calls still let the new route commit. Verify in the e2e test that the h1 of the new page is present before the reveal finishes.
- Confirm GSAP `autoAlpha` toggles `visibility`/`opacity` over the Tailwind `invisible opacity-0` initial classes.
- If `-skew-x-[18deg]`, `w-[150vw]` or `scale-200` aren't generated, use the equivalent arbitrary property syntax (`[transform:skewX(-18deg)]`).

`src/shell/ArenaLink.tsx`:
```tsx
import type { MouseEvent } from "react";
import { Link, type LinkProps } from "react-router";
import { useArenaTransition } from "./transition";

type ArenaLinkProps = LinkProps & { transition?: "wipe" | "tunnel" | "none" };

/** A router Link that plays the broadcast wipe. Without JS (or with modifier keys) it's a normal link. */
export function ArenaLink({ to, transition = "wipe", onClick, ...rest }: ArenaLinkProps) {
  const { go } = useArenaTransition();
  const handle = (e: MouseEvent<HTMLAnchorElement>) => {
    onClick?.(e);
    if (e.defaultPrevented || transition === "none") return;
    if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
    if (typeof to !== "string") return;
    e.preventDefault();
    void go(to, transition);
  };
  return <Link to={to} onClick={handle} {...rest} />;
}
```

`src/shell/RouteAnnouncer.tsx`:
```tsx
import { useEffect, useRef, useState } from "react";
import { useLocation } from "react-router";

/** After client navigation: focus the new <h1> and announce the page title (spec §4.6, §11.1). */
export function RouteAnnouncer() {
  const { pathname } = useLocation();
  const first = useRef(true);
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const h1 = document.querySelector<HTMLElement>("main h1");
        if (h1) {
          h1.setAttribute("tabindex", "-1");
          h1.focus({ preventScroll: true });
        }
        setMessage(document.title);
      });
    });
    return () => {
      cancelAnimationFrame(raf1);
      cancelAnimationFrame(raf2);
    };
  }, [pathname]);

  return (
    <div aria-live="assertive" className="sr-only">
      {message}
    </div>
  );
}
```
Note: a heading focused via script would otherwise show the volt focus ring. Add to `base.css`: `h1[tabindex="-1"]:focus { outline: none; }`. A programmatic focus target isn't interactive, and the ring would look like a bug.

`src/shell/QuickViewChip.tsx`:
```tsx
import { HUDButton } from "@/design-system";
import { ui } from "@/content";
import { ArenaLink } from "./ArenaLink";
import { ROUTES } from "./routes";

export function QuickViewChip({ className }: { className?: string }) {
  return (
    <HUDButton as={ArenaLink} to={ROUTES.scout} className={className}>
      {ui.hud.quickView}
    </HUDButton>
  );
}
```
(`ROUTES` arrives in Task 6. Create `src/shell/routes.ts` now with the full map from Task 6 Step 1, so this compiles.)

`src/shell/ArenaShell.tsx`:
```tsx
import type { ReactNode } from "react";
import { AudioProvider } from "./audio";
import { CommentaryProvider } from "./commentary";
import { MatchRecordHydrator } from "./matchRecord";
import { RouteAnnouncer } from "./RouteAnnouncer";
import { TransitionProvider } from "./transition";

/** Site-wide services around every page (spec §4.6). */
export function ArenaShell({ children }: { children: ReactNode }) {
  return (
    <AudioProvider>
      <CommentaryProvider>
        <TransitionProvider>
          <MatchRecordHydrator />
          <RouteAnnouncer />
          {children}
        </TransitionProvider>
      </CommentaryProvider>
    </AudioProvider>
  );
}
```
Run the ArenaLink test. Expected: pass.

- [ ] **Step 3: Commit**
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "feat(shell): broadcast wipe transitions, ArenaLink, route announcer, shell composition

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
(End of run B: `pnpm build-storybook && pnpm test:stories`, then `pnpm verify`.)

---

### Task 6: Routes, placeholder screens, Landing preview, e2e

**Files:**
- Create:
  - `src/shell/routes.ts` (if not already made in Task 5) and `src/shell/meta.ts`
  - `src/features/placeholder/PlaceholderScreen.tsx`
  - `src/features/landing-preview/LandingPreview.tsx`
  - 16 route modules
  - `tests/e2e/routes.spec.ts`
- Modify: `src/content/ui-copy.ts`, `app/root.tsx`, `app/routes.ts`; delete `app/routes/home.tsx` (replaced by the new `home.tsx`); update `tests/e2e/smoke.spec.ts` and `tests/e2e/tokens.spec.ts` if they assert on old home markup.

**Interfaces:**
- `ROUTES: Record<RouteKey, string>`: route key to path.
- `RouteKey` = keys of `ui.routes`.
- `pageMeta(key: RouteKey)`: the `[{ title }, { name: "description", content }]` array that React Router's `meta` expects.
- `PlaceholderScreen({ route: RouteKey })`.
- `LandingPreview()`: desktop shows the Stage composition; below 768px the home `PlaceholderScreen` shows.

- [ ] **Step 1: Route map and copy**

`src/shell/routes.ts`:
```ts
import type { RouteKey } from "@/content";

/** Every page in the site map (spec §4.5). app/routes.ts must mirror these paths. */
export const ROUTES: Record<RouteKey, string> = {
  home: "/",
  intro: "/intro",
  arena: "/arena",
  cricket: "/arena/cricket",
  tennis: "/arena/tennis",
  badminton: "/arena/badminton",
  giantKiller: "/arena/giant-killer",
  career: "/career",
  highlights: "/highlights",
  attributes: "/attributes",
  trophies: "/trophies",
  card: "/card",
  teamUp: "/team-up",
  lockerRoom: "/locker-room",
  scout: "/scout",
  notFound: "/404",
};
```

Add to `src/content/ui-copy.ts` (inside `ui`; keep the existing keys). Also export `type RouteKey = keyof typeof ui.routes` and re-export it from `src/content/index.ts`.
```ts
  skipToContent: "Skip to content",
  comm: { tag: "COMM" },
  audio: { name: "Crowd audio", label: "CROWD", on: "ON", off: "OFF" },
  placeholder: {
    comingIn: "COMING IN PHASE",
    siteMap: "SITE MAP",
    hub: "HUB",
    comm: "The arena is still being built. Every venue opens soon.",
  },
  landing: {
    live: "LIVE · THE ARENA",
    player: "PLAYER 01 / 01",
    home: "HOME",
    status: "STATUS",
    undefeated: "UNDEFEATED",
    away: "AWAY",
    you: "YOU?",
    challenge: "Think you can beat me?",
    enter: "ENTER THE ARENA",
    enterSub: "INTERACTIVE · ~3 MIN",
    view: "VIEW PORTFOLIO",
    viewSub: "RECRUITER VIEW · 90 SEC",
    hint: "ENTER ↵ TO PLAY · Q FOR QUICK VIEW",
  },
  routes: {
    home: { title: "Yash Sarda — The Arena", description: "Software Engineer Yash Sarda's portfolio, built as a night-time sports arena. Play against him, or read the 90-second scouting report.", heading: "YASH SARDA", phase: 3 },
    intro: { title: "Player Introduction — The Arena", description: "Yash Sarda walks out under the floodlights.", heading: "PLAYER INTRODUCTION", phase: 3 },
    arena: { title: "Arena Hub — The Arena", description: "Choose your venue: cricket, tennis or badminton. Every game reveals real portfolio content.", heading: "CHOOSE YOUR VENUE", phase: 4 },
    cricket: { title: "Bowl at Me — Cricket Ground", description: "Bowl a three-ball over at Yash. Every ball unlocks an innings of his career.", heading: "BOWL AT ME", phase: 5 },
    tennis: { title: "Return of Serve — Centre Court", description: "Return Yash's serve. Every return puts a project on the big screen.", heading: "RETURN OF SERVE", phase: 5 },
    badminton: { title: "Smash or Clear — Badminton Hall", description: "Play four rallies. Each one charges a group of Yash's skills.", heading: "SMASH OR CLEAR", phase: 5 },
    giantKiller: { title: "Giant Killer — The Arena", description: "The rare result: you beat Yash.", heading: "GIANT KILLER", phase: 6 },
    career: { title: "Career Stats — Yash Sarda", description: "Yash Sarda's career scorecard: Software Engineer at Deutsche Bank since Jul 2024.", heading: "CAREER STATS", phase: 2 },
    highlights: { title: "Match Highlights — Yash Sarda", description: "Yash Sarda's best projects, played as a tournament run.", heading: "MATCH HIGHLIGHTS", phase: 2 },
    attributes: { title: "Player Attributes — Yash Sarda", description: "Yash Sarda's skills, shown by evidence: shipped, built or in the kit bag.", heading: "PLAYER ATTRIBUTES", phase: 2 },
    trophies: { title: "Trophy Room — Yash Sarda", description: "Achievements and education: 750+ problems solved, 99.5 percentile, published research.", heading: "TROPHY ROOM", phase: 2 },
    card: { title: "Player Card — Yash Sarda", description: "Yash Sarda's resume as a player card.", heading: "PLAYER CARD", phase: 2 },
    teamUp: { title: "Team Up — Contact Yash Sarda", description: "Challenge Yash: hire him, collaborate, or just say hello.", heading: "TEAM UP", phase: 2 },
    lockerRoom: { title: "Locker Room — The Arena", description: "The hidden room for giant killers only.", heading: "THE LOCKER ROOM", phase: 6 },
    scout: { title: "Scouting Report — Yash Sarda", description: "The 90-second read: who Yash is, what he builds, his stack, his projects and how to reach him.", heading: "SCOUTING REPORT", phase: 1 },
    notFound: { title: "Out of Bounds — The Arena", description: "This page is out of bounds.", heading: "OUT OF BOUNDS", phase: 7 },
  },
```
(Remove the old `hud.crowdOn` / `hud.soundOff` keys only if nothing references them; `ui.audio` replaces them.)

`src/shell/meta.ts`:
```ts
import { ui, type RouteKey } from "@/content";

/** <title> and description for a route (spec §4.5). */
export function pageMeta(key: RouteKey) {
  const r = ui.routes[key];
  return [{ title: r.title }, { name: "description", content: r.description }];
}
```

- [ ] **Step 2: Route table and modules**

`app/routes.ts`:
```ts
import { type RouteConfig, index, route } from "@react-router/dev/routes";

// Mirrors ROUTES in src/shell/routes.ts (spec §4.5).
export default [
  index("routes/home.tsx"),
  route("intro", "routes/intro.tsx"),
  route("arena", "routes/arena.tsx"),
  route("arena/cricket", "routes/arena.cricket.tsx"),
  route("arena/tennis", "routes/arena.tennis.tsx"),
  route("arena/badminton", "routes/arena.badminton.tsx"),
  route("arena/giant-killer", "routes/arena.giant-killer.tsx"),
  route("career", "routes/career.tsx"),
  route("highlights", "routes/highlights.tsx"),
  route("attributes", "routes/attributes.tsx"),
  route("trophies", "routes/trophies.tsx"),
  route("card", "routes/card.tsx"),
  route("team-up", "routes/team-up.tsx"),
  route("locker-room", "routes/locker-room.tsx"),
  route("scout", "routes/scout.tsx"),
  route("404", "routes/not-found.tsx"),
  route("*", "routes/catch-all.tsx"),
] satisfies RouteConfig;
```

Route module template. Every placeholder route has exactly this shape, with its own key and `+types` file. For example `app/routes/career.tsx`:
```tsx
import type { Route } from "./+types/career";
import { PlaceholderScreen } from "@/features/placeholder/PlaceholderScreen";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("career");

export default function Career() {
  return <PlaceholderScreen route="career" />;
}
```

Create the same for:

| File | Key |
|---|---|
| `intro.tsx` | `intro` |
| `arena.tsx` | `arena` |
| `arena.cricket.tsx` | `cricket` |
| `arena.tennis.tsx` | `tennis` |
| `arena.badminton.tsx` | `badminton` |
| `arena.giant-killer.tsx` | `giantKiller` |
| `highlights.tsx` | `highlights` |
| `attributes.tsx` | `attributes` |
| `trophies.tsx` | `trophies` |
| `card.tsx` | `card` |
| `team-up.tsx` | `teamUp` |
| `locker-room.tsx` | `lockerRoom` |
| `scout.tsx` | `scout` |
| `not-found.tsx` | `notFound` |
| `catch-all.tsx` | `notFound` (component name `CatchAll`) |

`app/routes/home.tsx`:
```tsx
import type { Route } from "./+types/home";
import { LandingPreview } from "@/features/landing-preview/LandingPreview";
import { pageMeta } from "@/shell/meta";

export const meta: Route.MetaFunction = () => pageMeta("home");

export default function Home() {
  return <LandingPreview />;
}
```

- [ ] **Step 3: Root**

`app/root.tsx`: keep the font preload. Add the stage script, the skip link and the shell:
```tsx
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import type { Route } from "./+types/root";
import displayFont from "@fontsource/big-shoulders-display/files/big-shoulders-display-latin-900-normal.woff2?url";
import { ui } from "@/content";
import { STAGE_SCALE_SCRIPT } from "@/design-system";
import { ArenaShell } from "@/shell/ArenaShell";
import "./app.css";

export const links: Route.LinksFunction = () => [
  { rel: "preload", href: displayFont, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <script dangerouslySetInnerHTML={{ __html: STAGE_SCALE_SCRIPT }} />
        <Meta />
        <Links />
      </head>
      <body>
        <a
          href="#main"
          className="sr-only z-50 bg-volt px-4 py-3 type-mono-md text-volt-ink focus:not-sr-only focus:fixed focus:top-4 focus:left-4"
        >
          {ui.skipToContent}
        </a>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return (
    <ArenaShell>
      <Outlet />
    </ArenaShell>
  );
}
```

- [ ] **Step 4: Placeholder screen**

`src/features/placeholder/PlaceholderScreen.tsx`:
```tsx
import { useEffect } from "react";
import { ui, type RouteKey } from "@/content";
import { BrandLockup, Glass, HUD, Heading, MonoLabel, Text } from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import { CommentarySlot, useCommentary } from "@/shell/commentary";
import { QuickViewChip } from "@/shell/QuickViewChip";
import { ROUTES } from "@/shell/routes";

const MAP: RouteKey[] = ["home", "intro", "arena", "cricket", "tennis", "badminton", "career", "highlights", "attributes", "trophies", "card", "teamUp", "scout"];

interface PlaceholderScreenProps {
  route: RouteKey;
  /** "div" when nested inside another page's <main> (e.g. the mobile half of the Landing preview). */
  as?: "main" | "div";
  /** Say the placeholder commentary line on mount. Off when the parent page owns commentary. */
  announce?: boolean;
}

/** Temporary page for routes built in later phases: shows the phase and the full site map. */
export function PlaceholderScreen({ route, as: Root = "main", announce = true }: PlaceholderScreenProps) {
  const copy = ui.routes[route];
  const { say } = useCommentary();
  useEffect(() => {
    if (announce) say(ui.placeholder.comm, { interrupt: true });
  }, [say, announce]);

  return (
    <Root id={Root === "main" ? "main" : undefined} className="relative flex min-h-dvh flex-col bg-ground">
      <HUD
        left={<BrandLockup as={ArenaLink} to={ROUTES.arena} mark={ui.brand.mark} label={ui.placeholder.hub} />}
        right={<QuickViewChip />}
      />
      <div className="flex flex-1 items-center justify-center px-(--gutter) py-10">
        <Glass pad="lg" className="flex w-full max-w-180 flex-col gap-5">
          <MonoLabel variant="mono-eyebrow" tone="volt">
            {ui.placeholder.comingIn} {copy.phase}
          </MonoLabel>
          <Heading level={1} variant="d2">
            {copy.heading}
          </Heading>
          <Text as="p" variant="body" tone="secondary">
            {copy.description}
          </Text>
          <nav aria-label={ui.placeholder.siteMap} className="flex flex-col gap-3">
            <MonoLabel>{ui.placeholder.siteMap}</MonoLabel>
            <ul className="flex flex-wrap gap-2">
              {MAP.map((key) => (
                <li key={key}>
                  <ArenaLink
                    to={ROUTES[key]}
                    aria-current={key === route ? "page" : undefined}
                    className="inline-flex h-11 items-center border border-line-strong px-3.5 type-mono-tag text-floodlight transition-colors hover:border-volt hover:text-volt aria-[current=page]:border-volt aria-[current=page]:text-volt"
                  >
                    {ui.routes[key].heading}
                  </ArenaLink>
                </li>
              ))}
            </ul>
          </nav>
        </Glass>
      </div>
      {announce ? <CommentarySlot tag={ui.comm.tag} className="absolute bottom-9 left-(--gutter)" /> : null}
    </Root>
  );
}
```

- [ ] **Step 5: Landing preview (desktop Stage plus mobile placeholder)**

`src/features/landing-preview/LandingPreview.tsx` uses Main artboard positions:
- HUD at top
- scoreboard at 270, 140 (902×374 outer)
- challenge line centred at y 556
- CTA pair centred at y ~618 (gap 22px)
- COMM at left 36, bottom 36
- hint at right 36, bottom 46

```tsx
import { useEffect } from "react";
import { content, ui } from "@/content";
import { ArenaBackdrop, AudioToggle, BrandLockup, Button, HUD, HUDButton, KeyboardHint, LiveDot, Scoreboard, Stage, Text } from "@/design-system";
import { ArenaLink } from "@/shell/ArenaLink";
import { useAudio } from "@/shell/audio";
import { CommentarySlot, useCommentary } from "@/shell/commentary";
import { ROUTES } from "@/shell/routes";
import { PlaceholderScreen } from "../placeholder/PlaceholderScreen";

/** Static Landing composition (Phase 3 adds the floodlight boot + intro choreography). */
export function LandingPreview() {
  const audio = useAudio();
  const { say } = useCommentary();
  useEffect(() => say(content.commentary.entrance[0]!, { interrupt: true }), [say]);

  // One <main> for the page; desktop Stage and mobile placeholder are mutually exclusive by breakpoint.
  return (
    <main id="main">
      <div className="max-md:hidden">
        <Stage backdrop={<ArenaBackdrop bleed />}>
          <HUD
            className="absolute inset-x-0 top-0"
            left={<BrandLockup mark={ui.brand.mark} label={ui.brand.wordmark} />}
            right={
              <>
                <AudioToggle name={ui.audio.name} label={ui.audio.label} stateOn={ui.audio.on} stateOff={ui.audio.off} on={audio.enabled} onToggle={audio.toggle} />
                <HUDButton as={ArenaLink} to={ROUTES.arena}>
                  {ui.hud.skipIntro}
                </HUDButton>
              </>
            }
          />
          <Scoreboard className="absolute top-35 left-67.5 h-93.5 w-225.5">
            <Scoreboard.Header>
              <span className="flex items-center gap-2.5">
                <LiveDot pulse /> {ui.landing.live}
              </span>
              <span>{ui.landing.player}</span>
            </Scoreboard.Header>
            <Scoreboard.Body>
              <Scoreboard.Title as="h1">{content.player.name}</Scoreboard.Title>
              <Scoreboard.Subtitle>{content.player.title}</Scoreboard.Subtitle>
            </Scoreboard.Body>
            <Scoreboard.Footer>
              <Scoreboard.FooterCell label={ui.landing.home} value={content.player.name.split(" ")[0]!} />
              <Scoreboard.FooterCell label={ui.landing.status} value={ui.landing.undefeated} tone="volt" align="center" />
              <Scoreboard.FooterCell label={ui.landing.away} value={ui.landing.you} tone="label" align="end" />
            </Scoreboard.Footer>
          </Scoreboard>
          <div className="absolute inset-x-0 top-139 flex flex-col items-center gap-7.5">
            <Text as="p" variant="challenge" tone="body">
              {ui.landing.challenge}
            </Text>
            <div className="flex gap-5.5">
              <Button as={ArenaLink} to={ROUTES.intro} size="xl" subLabel={ui.landing.enterSub} onClick={audio.unlock}>
                {ui.landing.enter}
              </Button>
              <Button as={ArenaLink} to={ROUTES.scout} size="xl" variant="secondary" subLabel={ui.landing.viewSub}>
                {ui.landing.view}
              </Button>
            </div>
          </div>
          <CommentarySlot tag={ui.comm.tag} className="absolute bottom-9 left-9" />
          <KeyboardHint className="absolute right-9 bottom-11.5">{ui.landing.hint}</KeyboardHint>
        </Stage>
      </div>
      <div className="md:hidden">
        <PlaceholderScreen route="home" as="div" announce={false} />
      </div>
    </main>
  );
}
```
Implementer note: `content.player.name.split(" ")[0]` → "Yash" (uppercased by the type recipe), matching Main's "YASH". The heading check in e2e expects `ui.routes.home.heading` ("YASH SARDA"), which matches the scoreboard `h1` on desktop and the placeholder `h1` on mobile.

- [ ] **Step 6: E2E**

`tests/e2e/routes.spec.ts`:
```ts
import { expect, test } from "@playwright/test";
import { ui } from "../../src/content/ui-copy";
import { ROUTES } from "../../src/shell/routes";
import { expectNoA11yViolations } from "../support/a11y";
import { expectMatchesArtboard } from "../support/visual";

const entries = Object.entries(ROUTES) as [keyof typeof ROUTES, string][];

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });
  for (const [key, path] of entries) {
    test(`renders without JavaScript: ${path}`, async ({ page }) => {
      await page.goto(path);
      await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes[key].heading, { ignoreCase: true });
      await expect(page).toHaveTitle(ui.routes[key].title);
    });
  }
});

for (const [key, path] of entries) {
  test(`a11y: ${path}`, async ({ page }) => {
    await page.goto(path);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    await expectNoA11yViolations(page);
  });
  void key;
}

test("unknown paths show Out of Bounds", async ({ page }) => {
  await page.goto("/definitely-not-a-page");
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(ui.routes.notFound.heading, { ignoreCase: true });
});

test("focus moves to the new heading after a wipe navigation", async ({ page }) => {
  await page.goto(ROUTES.career);
  await page.getByRole("navigation", { name: ui.placeholder.siteMap }).getByRole("link", { name: ui.routes.highlights.heading }).click();
  await expect(page.locator("[data-wipe] > div").first()).toBeVisible();
  await expect(page).toHaveURL(ROUTES.highlights);
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
  await expect(page.locator("[data-wipe] > div").first()).toBeHidden();
});

test("reduced motion navigates without the wipe", async ({ page }) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto(ROUTES.career);
  await page.getByRole("navigation", { name: ui.placeholder.siteMap }).getByRole("link", { name: ui.routes.scout.heading }).click();
  await expect(page).toHaveURL(ROUTES.scout);
  await expect(page.locator("[data-wipe] > div").first()).toBeHidden();
  await expect(page.getByRole("heading", { level: 1 })).toBeFocused();
});

test("stage scales to fit", async ({ page }, testInfo) => {
  if (testInfo.project.name === "mobile") {
    await page.goto("/");
    await expect(page.locator("[data-stage]")).toBeHidden();
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    return;
  }
  await page.setViewportSize({ width: 1280, height: 720 });
  await page.goto("/");
  const box = (await page.locator("[data-stage]").boundingBox())!;
  expect(Math.round(box.width)).toBe(1152);
  expect(Math.round(box.height)).toBe(720);
  expect(Math.round(box.x)).toBe(64);
});

test("home matches the Main artboard", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Main is a 1440×900 board");
  await page.goto("/");
  await page.waitForTimeout(3800); // floodlight flicker settles
  const ratio = await expectMatchesArtboard(page, "Main", {
    maxDiffRatio: 0.03,
    maskRects: [
      { x: 560, y: 368, width: 320, height: 52 }, // subtitle tracking (carry-over, Phase 3)
      { x: 30, y: 815, width: 400, height: 60 }, // commentary line animates in
    ],
  });
  expect(ratio).toBeLessThanOrEqual(0.03);
});
```
Also update `tests/e2e/smoke.spec.ts`. Its heading assertion should use `ui.routes.home.heading`, and the JS-off test stays. Update `tokens.spec.ts`'s focus-ring test if the first Tab now lands on the skip link: assert the skip link gets the volt ring.

Run `pnpm build && pnpm test:e2e`. If "home matches Main" exceeds 3%, open the diff image and fix the composition from `design/handoff/design-source/Main.dc.html` positions. Up to 3 focused attempts, then report the ratio and the remaining differences.

- [ ] **Step 7: Verify, tick carry-over, commit**

Tick the carry-over 0D row "Replace the placeholder home…".
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm verify
git add -A
git commit -m "feat: route table, placeholder screens and static Landing preview on the Stage

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Phase 0D exit checklist (orchestrator)

- [ ] `pnpm verify` green. "home matches Main" ratio recorded.
- [ ] Orchestrator clicks through `pnpm preview` in a screenshot pass:
  - `/` desktop at 1440 and 1280
  - `/` mobile
  - one placeholder page
  - the wipe captured mid-transition
- [ ] One Opus review of 0D (with at most one fix wave), then Yash's merge OK. **Phase 0 complete**, then the Phase 1 (`/scout`) plan.

---

## Trivia: terms used in this plan

- **Route:** a URL path (like `/career`) mapped to the page that renders there.
- **Pre-render:** building each route's HTML at build time, so it loads instantly and works for crawlers and with JS off.
- **Context provider / hook:** React's way to share one service (like audio) with every page without passing it down by hand.
- **Zustand + persist:** a tiny state library that saves the visitor's match record in the browser and reloads it next visit.
- **Hydration:** when React takes over the pre-rendered HTML in the browser. Saved data loads after this to avoid mismatches.
- **Live region (`aria-live`):** invisible text that screen readers read out when it changes. It's how page changes and commentary are announced.
- **Letterbox:** the empty edges when a fixed-ratio picture is fitted to a different-shaped screen. Ours shows stadium, not black bars.
- **Vite plugin:** a hook into the build. Ours checks your content file every build so mistakes never ship.
