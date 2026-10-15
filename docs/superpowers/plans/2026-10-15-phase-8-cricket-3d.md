# Phase 8, cycle 1 — 3D Cricket Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**What this plan does (plain words):**

"Bowl at Me" becomes a 3D game:
- You pick a line (OFF / MIDDLE / LEG), press BOWL, and your bowler runs in while the crowd claps on each stride.
- You press again to release at the final leap.
- The ball flies at a real speed and bounces.
- Yash, a right-handed 3D batter, plays a shot that fits the ball and matches the commentary line.
- The camera follows the ball to the rope.

The rules, scores, reveals and Full Time stay exactly as they are. Today's 2D game stays only for three cases: reduced motion, no WebGL, or a failed download.

**Owner's biggest ask: keep it simple.** Fewest moving parts, no extras.

**Goal:** `/arena/cricket` plays the three-ball over in 3D on desktop and phones, after a short loader, with the referee untouched, and `pnpm verify` and the Lighthouse gates stay green.

**Architecture:**
- **Pure parts (plain TypeScript, unit-tested, no `three` import):**
  - `cricket/3d/field.ts`: places and sizes
  - `delivery.ts`: from your inputs to a ball
  - `ball.ts`: flight maths
  - `director.ts`: Yash's shot
  - `sequence.ts`: who moves where and when, as a function of time
  - `three/track.ts`: sampling a timeline
- **3D parts:** `three/` holds the shared plumbing (canvas, athlete, kit material, pose clips). `cricket/3d/scene.tsx` is the one lazily loaded module that pulls in `three`.
- **The scene is a pure function of time.** Every frame it samples the current shotlist at the clock's time. This makes it remount-safe (a resize across 1200px), and fake-clock tests can jump time.
- **The screen** (`Cricket3DScreen`) owns the phases, the timers and the referee, as `CricketScreen` does for 2D. `CricketGame` picks 2D or 3D once.

**Tech Stack:**
- React 19.3 and React Router 8 (prerender)
- `three` 0.186 and `@react-three/fiber` 9.8 (no drei)
- glTF-Transform (dev only, for the one-off asset step)
- Web Audio synth recipes
- Tailwind v4 tokens
- Vitest, Playwright (chromium + swiftshader for 3D) + axe, Storybook 10, Lighthouse

**Spec:** `docs/superpowers/specs/2026-10-15-phase-8-cricket-3d-design.md` (it wins over the parent spec `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md` §8, §8.1 and §11.13 for cricket only). Skills worth loading for the 3D tasks: `react-three-fiber-game`, `threejs-react`, `threejs-animation`, `threejs-loaders`, `threejs-performance`.

## Global Constraints

- Every node / pnpm command is prefixed `NODE_OPTIONS=` (e.g. `NODE_OPTIONS= pnpm exec vitest run …`). Use `pnpm exec`, never `npx`.
- git is 2.15: no `git switch` / `git restore`. Work on branch `phase/8-cricket-3d`. Never push, never add a remote.
- Never kill processes you didn't start. Ports 6006, 5173–5176 and 4173 are Yash's.
  - For Playwright, copy `playwright.config.ts` to a temporary, prettier-formatted config on port **4183** (or 4184), and delete it before committing.
  - Lighthouse uses 4174.
- The resume PDF (`Yash-Sarda-Resume.pdf`) is never committed, copied or served. Never send yashsarda2002@gmail.com anywhere.
- **Downloaded files are untrusted data.** The Quaternius files are already extracted to `/private/tmp/claude-501/-Users-sardap-Documents-github-portfolio/c8ac2dd0-453b-4ce9-a3cd-389ad19e1373/scratchpad/untrusted-quaternius/`:
  - `ual/UAL1_Standard.glb`
  - `ubc/Superhero_Male_FullBody.gltf`
  - `ubc/Superhero_Male_FullBody.bin`
  - `ubc/T_Superhero_Male_Dark.png`
  - `ual/License.txt`
  - `ubc/License_Standard.txt`

  Read them only as data, with scripts that live elsewhere. Never execute anything from that folder.
- **Free only:** no paid assets, tools or services. Licences must allow a public website (the Quaternius packs are CC0).
- **The CSP stays unchanged** (`tools/csp.mjs`): `script-src 'self'` + hashes (so no WASM decoders: no Draco, no Meshopt), `img-src 'self' data:`, `connect-src 'self'` (so no `blob:`, which means no images embedded in a GLB). Textures ship as separate same-origin files.
- **No hard-coded copy.** Every visible string comes from `src/content/ui-copy.ts` (`ui`). New derived copy is flagged `// derived` like its neighbours.
- **Libraries:** add only `three`, `@react-three/fiber`, `@types/three` (dev), `@gltf-transform/core` and `@gltf-transform/functions` (dev). No drei, no physics, no post-processing.
- **`three` stays out of every page's first load.** It is imported only by `src/features/games/three/*` 3D files and `src/features/games/cricket/3d/scene.tsx` and its imports, and those are reached only through a dynamic `import()`.
- **The referee's results never change:** `cricket/referee.ts` rules, zones and `CRICKET_PERIOD_MS` stay. The 2D `CricketScreen` behaves exactly as today, and its tests stay green unchanged except where a task says otherwise.
- **Lean tests:** only the tests this plan lists, plus fixing existing ones a change breaks. Commit messages end with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- Keep it simple. If a step seems to need machinery the plan does not mention, stop and report instead of building it.

## Review Focus

1. **Mashing the button.** Space / BOWL pressed twice fast, or held: exactly one run-up starts, presses before the meter moves are ignored, and one press during the sweep releases one ball. A press during the flight or the call does nothing. Pinned by an e2e in Task 7.
2. **Switching tabs mid-ball.** During the run-up or the flight, the ball is cancelled and not counted (BALL n OF 3 unchanged, nothing saved). Coming back, you press BOWL again. Pinned by an e2e in Task 7.
3. **Resizing across 1200px mid-ball.** The canvas moves to the other layout, the ball finishes and is counted once, and there is never more than one `<canvas>` in the page. Pinned by an e2e in Task 7.
4. **A failed or slow download.** A 404 on a model file, or 20s without finishing, gives today's 2D game, with no console errors. Pinned by a unit test in Task 1 and an e2e in Task 7.
5. **Leaving mid-ball.** SKIP during a flight: no timer or sound fires after leaving, there are no page errors, and coming back is instant (files cached). Pinned by an e2e in Task 7.

---

## File structure

| File | Responsibility | Task |
|---|---|---|
| `src/features/games/three/support.ts` | `canUse3d()` (WebGL2 check) | 1 |
| `src/features/games/three/useThreeGate.ts` (+test) | One decision per visit: `loading` → `ready` / `off`, progress, 20s cap, `fail()` | 1 |
| `src/features/games/three/GameLoader.tsx` (+story) | The broadcast-style loader with a real progress bar | 1 |
| `src/features/games/three/ThreeBoundary.tsx` | Error boundary: a 3D crash calls `fail()` | 1 |
| `src/design-system/layout/Stage.tsx` | New optional `underlay` (full-bleed, unscaled, under the stage) | 1 |
| `src/features/games/frame/GameStage.tsx`, `GameColumn.tsx`, `GamePage.tsx` | Optional `scene` (replaces the drawn backdrop); `GamePage` gets optional `three` → `data-three` | 1 |
| `playwright.config.ts` | Default projects run with WebGL off (2D); new `desktop-3d` / `mobile-3d` projects run `*-3d.spec.ts` with SwiftShader | 1 |
| `src/features/games/cricket/referee.ts` | `CricketAim`; `bowl(s, q, how?)` records `aim` and `full` | 2 |
| `src/features/games/cricket/3d/field.ts` | Metres, places, the aim camera | 2 |
| `src/features/games/cricket/3d/delivery.ts` (+test) | Speed, length and line from quality, `p` and line | 2 |
| `src/features/games/cricket/3d/ball.ts` (+test) | The delivery path, the shot paths, the rope | 2 |
| `src/features/games/cricket/3d/director.ts` (+test) | Yash's shot (fits the ball and the commentary) | 2 |
| `src/features/games/cricket/view.ts` (+test) | Commentary picks `beaten` / `sixFull` from `aim` / `full` | 2 |
| `src/features/games/three/track.ts` (+test) | Sample an actor's timeline: position, facing, clip weights | 3 |
| `src/features/games/cricket/3d/sequence.ts` (+test) | Shotlists: ready, run-up/ball, walk-back | 3 |
| `src/shell/synth.ts`, `src/shell/audio.tsx` (+tests) | Three new recipes: `clap`, `bounce`, `ooh` | 4 |
| `tools/models.mjs`, `public/models/*` | The one-off asset step and its outputs (+ `CREDITS.md`) | 5 |
| `src/features/games/three/rig.ts` (+asset test) | Bone names, clip names, kit regions, file paths | 5 |
| `src/features/games/three/{GameCanvas,settings,tokens,athlete,kitMaterial,poseClip}.ts(x)` (+poseClip test) | The 3D plumbing | 6 |
| `src/features/games/cricket/3d/{shots,props,Stadium,Players,scene}.tsx` | The cricket world; `scene.tsx` is the lazy entry | 6 |
| `src/features/games/cricket/3d/PoseLab.stories.tsx` | Dev-only story for tuning poses (not in automated tests) | 6 |
| `src/features/games/cricket/{useCricketCalls,Cricket3DScreen,CricketGame,LinePicker}.tsx` | The 3D game and the one 2D/3D choice | 7 |
| `src/features/games/cricket/{CricketPage,CricketStage,CricketColumn,CricketScreen}.tsx`, `view.ts` | 3D props, the controls builder, the shared `land` | 7 |
| `app/routes/arena.cricket.tsx` | Renders `CricketGame` | 7 |
| `tests/e2e/cricket-3d.spec.ts`, `tests/e2e/support/cricket3d.ts`, `tests/e2e/smoke.spec.ts`, `tests/e2e/webkit-smoke.spec.ts` | 3D browser tests, first-load guard | 7 |
| `tools/lighthouse.mjs`, docs | WebGL for Lighthouse, the run, as-built notes | 8 |

---

### Task 1: The 3D gate, the loader, and the host slots

**Files:**
- Modify: `package.json` (add `three` ^0.186.1, `@react-three/fiber` ^9.8.2; dev: `@types/three` matching three)
- Create: `src/features/games/three/support.ts`, `src/features/games/three/useThreeGate.ts`, `src/features/games/three/useThreeGate.test.ts`, `src/features/games/three/GameLoader.tsx`, `src/features/games/three/GameLoader.stories.tsx`, `src/features/games/three/ThreeBoundary.tsx`
- Modify: `src/design-system/layout/Stage.tsx`, `src/features/games/frame/GameStage.tsx`, `src/features/games/frame/GameColumn.tsx`, `src/features/games/frame/GamePage.tsx`, `playwright.config.ts`

**Interfaces:**
- Produces:
  - `canUse3d(): boolean`
  - `THREE_TIMEOUT_MS = 20_000`
  - `type ThreeStatus = "loading" | "ready" | "off"`
  - `useThreeGate<T>({ reduced, load }: { reduced: boolean; load: (onProgress: (fraction: number) => void) => Promise<T> }): ThreeGate<T>`, where `interface ThreeGate<T> { status: ThreeStatus; progress: number; value: T | null; fail(): void }`
  - `<GameLoader label progress size="stage" | "column" />`
  - `<ThreeBoundary onError>{children}</ThreeBoundary>`
  - `Stage` prop `underlay?: ReactNode`
  - `GameStage` / `GameColumn` prop `scene?: ReactNode`
  - `GamePage` prop `three?: ThreeStatus` → `data-three` on `<main>`

- [ ] **Step 1: Install the libraries.**
  Run: `NODE_OPTIONS= pnpm add three@^0.186.1 @react-three/fiber@^9.8.2 && NODE_OPTIONS= pnpm add -D @types/three`
  Check that `@react-three/fiber`'s peer range accepts our React (`>=19 <19.4`).

- [ ] **Step 2: Write `support.ts`.**

```ts
/** WebGL2 is what three.js and React Three Fiber need. Checked once, on a throwaway canvas, then released. */
export function canUse3d(): boolean {
  if (typeof document === "undefined") return false;
  try {
    const gl = document.createElement("canvas").getContext("webgl2");
    gl?.getExtension("WEBGL_lose_context")?.loseContext();
    return !!gl;
  } catch {
    return false;
  }
}
```

- [ ] **Step 3: Write the failing gate tests.** `useThreeGate.test.ts` (Vitest + `@testing-library/react` `renderHook`, fake timers; mock `./support` so `canUse3d` returns what each test needs):

```ts
import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import * as support from "./support";
import { THREE_TIMEOUT_MS, useThreeGate } from "./useThreeGate";

describe("useThreeGate", () => {
  beforeEach(() => vi.useFakeTimers());
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("starts loading, reports progress, then is ready with the value", async () => {
    vi.spyOn(support, "canUse3d").mockReturnValue(true);
    let report!: (f: number) => void;
    let resolve!: (v: string) => void;
    const load = (onProgress: (f: number) => void) =>
      new Promise<string>((r) => ((report = onProgress), (resolve = r)));
    const { result } = renderHook(() => useThreeGate({ reduced: false, load }));
    expect(result.current.status).toBe("loading");
    act(() => report(0.4));
    expect(result.current.progress).toBe(0.4);
    await act(async () => resolve("world"));
    expect(result.current).toMatchObject({ status: "ready", progress: 1, value: "world" });
  });

  it("is off at once with reduced motion, and never loads", () => {
    vi.spyOn(support, "canUse3d").mockReturnValue(true);
    const load = vi.fn(() => new Promise<never>(() => {}));
    const { result } = renderHook(() => useThreeGate({ reduced: true, load }));
    expect(result.current.status).toBe("off");
    expect(load).not.toHaveBeenCalled();
  });

  it("is off at once without WebGL2", () => {
    vi.spyOn(support, "canUse3d").mockReturnValue(false);
    const load = vi.fn(() => new Promise<never>(() => {}));
    const { result } = renderHook(() => useThreeGate({ reduced: false, load }));
    expect(result.current.status).toBe("off");
    expect(load).not.toHaveBeenCalled();
  });

  it("is off when the load fails", async () => {
    vi.spyOn(support, "canUse3d").mockReturnValue(true);
    const { result } = renderHook(() =>
      useThreeGate({ reduced: false, load: () => Promise.reject(new Error("404")) }),
    );
    await act(async () => {});
    expect(result.current.status).toBe("off");
  });

  it("is off after THREE_TIMEOUT_MS, and a late value is ignored", async () => {
    vi.spyOn(support, "canUse3d").mockReturnValue(true);
    let resolve!: (v: string) => void;
    const { result } = renderHook(() =>
      useThreeGate({ reduced: false, load: () => new Promise<string>((r) => (resolve = r)) }),
    );
    act(() => vi.advanceTimersByTime(THREE_TIMEOUT_MS));
    expect(result.current.status).toBe("off");
    await act(async () => resolve("late"));
    expect(result.current.status).toBe("off");
  });

  it("fail() turns a ready gate off", async () => {
    vi.spyOn(support, "canUse3d").mockReturnValue(true);
    const { result } = renderHook(() =>
      useThreeGate({ reduced: false, load: () => Promise.resolve(1) }),
    );
    await act(async () => {});
    act(() => result.current.fail());
    expect(result.current.status).toBe("off");
  });
});
```

- [ ] **Step 4: Run the tests to see them fail.**
  Run: `NODE_OPTIONS= pnpm exec vitest run src/features/games/three/useThreeGate.test.ts`
  Expected: FAIL, because `useThreeGate` doesn't exist yet.

- [ ] **Step 5: Implement `useThreeGate.ts`.**
  - The first render is `{ status: "loading", progress: 0, value: null }` on the server and the client alike, so hydration matches the prerender.
  - One effect, keyed on `reduced`:
    - With reduced motion, or when `!canUse3d()`, the status becomes `off` and nothing loads.
    - Otherwise it calls the latest `load` (held in a ref). Progress only ever goes up.
    - Resolve → `ready` / 1 / value. Reject or `THREE_TIMEOUT_MS` → `off`.
    - Anything that arrives after the effect's cleanup, or after the timeout, is ignored.
  - `fail()` (stable) sets `off`.
  - The project lints with `eslint-plugin-react-hooks` v7. If its `set-state-in-effect` rule flags the synchronous "off" path, derive "off for reduced or no WebGL" during render instead (e.g. a `useSyncExternalStore` read of `canUse3d`, as `lib/useMediaQuery` reads media queries), so the effect only sets state from async callbacks. Keep the tests unchanged.

- [ ] **Step 6: Run the tests to see them pass.**
  Run: `NODE_OPTIONS= pnpm exec vitest run src/features/games/three/useThreeGate.test.ts`
  Expected: 6 passed.

- [ ] **Step 7: Write `GameLoader.tsx`, `ThreeBoundary.tsx` and the story.**
  - `GameLoader({ label, progress, size })`: a `role="progressbar"` element with:
    - `aria-label={label}`
    - `aria-valuemin={0}`, `aria-valuemax={100}`, `aria-valuenow={Math.round(progress * 100)}`
    - the label as a design-system `MonoLabel`
    - a thin bar whose fill grows by `transform: scaleX(progress)` only (no layout animation), volt on the panel line colour

    Reuse an existing design-system bar if one fits (look at `SegmentBar` and `ProgressSteps` first). `size` sets the width: the stage uses the meter's width; the column is full width.
  - `ThreeBoundary`: a small class error boundary that renders nothing on error and calls `onError` once from `componentDidCatch`.
  - Story `Features/Games/Three` → `Loader` at progress 0.35, in both sizes.
  - Neither file imports `three`.

- [ ] **Step 8: Add the host slots.**
  - `Stage`: a new optional `underlay` rendered as `<div className="absolute inset-0">{underlay}</div>` right after `SkyGlow` and before `[data-stage]`. It's full-bleed and unscaled, so a canvas there fills the viewport.
  - `GameStage({ …, scene? })`: when `scene` is set, pass it as `underlay` and pass no `backdrop`. Otherwise it's exactly today's `GameBackdrop`.
  - `GameColumn({ …, scene? })`: when `scene` is set, render it in the outer full-width div (`absolute inset-0`, before the centred box) and omit `GameBackdrop`. Otherwise nothing changes.
  - `GamePage({ …, three? })`: adds `data-three={three}` on `<main>` when given.

- [ ] **Step 9: Add the test projects.** In `playwright.config.ts`:
  - The `desktop` and `mobile` projects get `launchOptions: { args: ["--disable-3d-apis"] }` and `testIgnore: [/webkit-smoke/, /-3d\.spec/]`. All existing specs keep testing the 2D game.
  - Add `desktop-3d` (same as `desktop`) and `mobile-3d` (same as `mobile`), each with `testMatch: /-3d\.spec/` and `launchOptions: { args: ["--enable-unsafe-swiftshader", "--use-angle=swiftshader"] }`.
  - Comment each with one line of why.

- [ ] **Step 10: Typecheck, lint, the unit tests and one e2e smoke.**
  Run, each prefixed `NODE_OPTIONS=`: `pnpm typecheck && pnpm lint && pnpm exec vitest run src/features/games src/design-system/layout`
  Then use the temporary config on 4183: `pnpm exec playwright test -c <temp> tests/e2e/cricket.spec.ts --project=desktop`
  Expected: all green. The 2D cricket is unchanged.

- [ ] **Step 11: Commit.**
  `git add -A && git commit -m "feat(games): the 3D gate, the loader, and a scene slot under the stage and the column (Phase 8 T1)"` (with the attribution line).

---

### Task 2: Cricket rules for 3D: delivery, ball flight and Yash's shot (pure)

**Files:**
- Modify: `src/features/games/cricket/referee.ts`, `src/features/games/cricket/referee.test.ts`, `src/features/games/cricket/view.ts`, `src/features/games/cricket/view.test.ts`, `src/content/ui-copy.ts`
- Create: `src/features/games/cricket/3d/field.ts`, `delivery.ts`, `delivery.test.ts`, `ball.ts`, `ball.test.ts`, `director.ts`, `director.test.ts`

**Interfaces:**
- Consumes: `Quality` (`../engine/types`), `CricketCall`, `CRICKET_PERIOD_MS`.
- Produces:
  - `CricketAim`
  - `bowl(s, q, how?)`
  - `Vec3` (re-exported from `three/track.ts` in Task 3; here define `export type Vec3 = readonly [x: number, y: number, z: number]` in `field.ts`. Task 3 moves it to `track.ts` and `field.ts` re-exports it)
  - every `field.ts` constant below
  - `Delivery`, `planDelivery`
  - `Path`, `DeliveryPath`, `ShotPath`, `deliveryPath`, `shotPath`, `heading`, `toRope`, `groundTimeAt`
  - `BatShot`, `ShotKind`, `Shot`, `pickShot`

- [ ] **Step 1: Write the failing referee test.** Add to `referee.test.ts`:

```ts
it("records the line and a late release when given (3D), and judges exactly as before", () => {
  const s = bowl(CRICKET_START, "perfect", { aim: "off", full: false });
  expect(s.balls[0]).toMatchObject({ call: "dot", runs: 0, aim: "off", full: false });
  expect(bowl(CRICKET_START, "perfect").balls[0]).not.toHaveProperty("aim");
});
```

- [ ] **Step 2: Implement.** In `referee.ts`:
  - add `export type CricketAim = "off" | "middle" | "leg";`
  - add to `CricketBall`: `/** 3D only: the line it was bowled on and whether it was released late. */ aim?: CricketAim; full?: boolean;`
  - make `bowl(s, q, how?: { aim: CricketAim; full: boolean })` spread `how` into the new ball; the rest is unchanged
  - run `NODE_OPTIONS= pnpm exec vitest run src/features/games/cricket/referee.test.ts` and expect it to pass

- [ ] **Step 3: Write `field.ts`.**

```ts
import type { CricketAim } from "../referee";

/** Metres and seconds. +z runs from Yash's stumps (z 0) to the bowler's (z 20.12); +x is the right of the TV picture, the leg side of a right-handed batter (Yash); y is up. */
export type Vec3 = readonly [x: number, y: number, z: number];
export interface CameraPose {
  position: Vec3;
  target: Vec3;
}
export type ActorId = "yash" | "bowler" | "keeper" | "slip" | "cover" | "midwicket" | "fineLeg";

export const PITCH = { length: 20.12, width: 3.05, crease: 1.22 } as const;
export const GRAVITY = 9.81;
export const BALL_RADIUS = 0.036;
/** Where the ball leaves the bowler's hand (right arm, over the wicket). */
export const RELEASE: Vec3 = [0.35, 2.2, 18.9];
/** Where the bat meets the ball, along the pitch. */
export const CONTACT_Z = 1.6;
/** Where the keeper takes a ball that beats the bat. */
export const KEEPER_TAKE_Z = -12.4;
/** The boundary rope: a circle on the ground around the pitch's middle. */
export const ROPE = { centre: [0, 0, PITCH.length / 2] as Vec3, radius: 65 };
/** The bowler's mark, and where his run-up leaps. */
export const MARK: Vec3 = [0.6, 0, 31];
export const JUMP_Z = 20.2;
/** The line at the bat for each choice (m): just outside off stump, middle, on the pads. */
export const LINE_X: Record<CricketAim, number> = { off: -0.15, middle: 0, leg: 0.12 };

export const ACTORS: readonly ActorId[] = ["yash", "bowler", "keeper", "slip", "cover", "midwicket", "fineLeg"];
/** The fielders who may chase a drive (the keeper never leaves his place). */
export const FIELDERS: readonly ActorId[] = ["slip", "cover", "midwicket", "fineLeg"];
export const HOME: Record<ActorId, Vec3> = {
  yash: [0.35, 0, 1.0],
  bowler: MARK,
  keeper: [-0.4, 0, -13],
  slip: [-2.4, 0, -13.5],
  cover: [-17, 0, 12],
  midwicket: [16, 0, 13],
  fineLeg: [14, 0, -24],
};
/** From ball 2 on, these two have walked in this far toward Yash (the rhythm, spec §3.3). */
export const WALK_IN = { who: ["cover", "midwicket"] as readonly ActorId[], metres: 4 };

/** Where an actor stands before ball `ball` (0 to 2). */
export function homeOf(id: ActorId, ball: number): Vec3 {
  const h = HOME[id];
  if (ball < 1 || !WALK_IN.who.includes(id)) return h;
  const [bx, , bz] = HOME.yash;
  const d = Math.hypot(bx - h[0], bz - h[2]);
  const f = WALK_IN.metres / d;
  return [h[0] + (bx - h[0]) * f, 0, h[2] + (bz - h[2]) * f];
}

/** The way an actor faces at rest (radians; 0 faces +z, the bowler's end; PI/2 faces +x). */
export function faceOf(id: ActorId): number {
  if (id === "yash") return -Math.PI / 2; // side-on, chest to the off side
  if (id === "bowler") return Math.PI;
  if (id === "keeper" || id === "slip") return 0;
  const [hx, , hz] = HOME[id];
  const [bx, , bz] = HOME.yash;
  return Math.atan2(bx - hx, bz - hz);
}

/** The TV view from behind the bowler (tuned in Task 6 against the stage and the column), and each layout's lens. */
export const CAMERA = {
  aim: { position: [0, 6.2, 42], target: [0, 0.9, 2] } as CameraPose,
  fov: { stage: 20, column: 34 },
};
```

- [ ] **Step 4: Write the failing delivery tests** (`delivery.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { LINE_X } from "./field";
import { LENGTH_Z, planDelivery, SPEED_KMH } from "./delivery";

const at = (v: number) => () => v;

describe("planDelivery", () => {
  it("a perfect ball is a yorker on the chosen line, at 142 to 145 km/h", () => {
    const d = planDelivery({ quality: "perfect", p: 0.5, line: "off" }, at(0.5));
    expect(d.pitchZ).toBe(LENGTH_Z.yorker);
    expect(d.x).toBe(LINE_X.off);
    expect(d.speedKmh).toBeGreaterThanOrEqual(142);
    expect(d.speedKmh).toBeLessThanOrEqual(145);
  });
  it("an early miss is short, a late miss is a full toss", () => {
    expect(planDelivery({ quality: "miss", p: 0, line: "middle" }, at(0.5)).pitchZ).toBe(LENGTH_Z.short);
    expect(planDelivery({ quality: "miss", p: 1, line: "middle" }, at(0.5)).pitchZ).toBeNull();
  });
  it("a late good ball is fuller than the yorker spot, never past the bat", () => {
    const z = planDelivery({ quality: "good", p: 0.64, line: "leg" }, at(0.5)).pitchZ!;
    expect(z).toBeLessThan(LENGTH_Z.yorker);
    expect(z).toBeGreaterThanOrEqual(LENGTH_Z.fullest);
  });
  it("speeds stay inside their band at both ends of the random source", () => {
    for (const q of ["perfect", "good", "miss"] as const)
      for (const r of [0, 0.999]) {
        const s = planDelivery({ quality: q, p: 0.5, line: "middle" }, at(r)).speedKmh;
        expect(s).toBeGreaterThanOrEqual(SPEED_KMH[q][0]);
        expect(s).toBeLessThanOrEqual(SPEED_KMH[q][1]);
      }
  });
  it("a full toss has no seam", () => {
    expect(planDelivery({ quality: "miss", p: 0.9, line: "off" }, at(0.9)).seam).toBe(0);
  });
});
```

- [ ] **Step 5: Implement `delivery.ts`.**

```ts
import type { Quality } from "../../engine/types";
import type { CricketAim } from "../referee";
import { LINE_X } from "./field";

/** Speed-gun bands (km/h) by timing quality (spec §4.2). */
export const SPEED_KMH: Record<Quality, readonly [number, number]> = {
  perfect: [142, 145],
  good: [132, 138],
  miss: [120, 128],
};
/** How far (m) a ball may stray sideways from the chosen line. */
export const SCATTER_M: Record<Quality, number> = { perfect: 0, good: 0.08, miss: 0.2 };
/** Where balls pitch (z, m): the yorker at the meter's centre, the shortest at its left end, never fuller than `fullest`. */
export const LENGTH_Z = { yorker: 2.0, short: 11.0, fullest: 1.7 } as const;
/** The largest sideways nudge (m) off the seam, by the time the ball reaches the bat. */
export const SEAM_M = 0.1;

export interface Delivery {
  speedKmh: number;
  /** Where it pitches; null for a full toss (a late miss). */
  pitchZ: number | null;
  /** Its line at the bat before the seam (m; negative is the off side). */
  x: number;
  seam: number;
  line: CricketAim;
}

/** A ball from your release: `p` is the meter's place (0 to 1, centre 0.5), `quality` the referee's judgement of it. */
export function planDelivery(
  { quality, p, line }: { quality: Quality; p: number; line: CricketAim },
  rand: () => number = Math.random,
): Delivery {
  const [lo, hi] = SPEED_KMH[quality];
  const speedKmh = Math.round(lo + rand() * (hi - lo));
  const late = p > 0.5;
  const pitchZ =
    quality === "miss" && late
      ? null
      : late
        ? Math.max(LENGTH_Z.fullest, LENGTH_Z.yorker - (p - 0.5) * 2)
        : LENGTH_Z.yorker + ((0.5 - p) / 0.5) * (LENGTH_Z.short - LENGTH_Z.yorker);
  const x = LINE_X[line] + (rand() * 2 - 1) * SCATTER_M[quality];
  const seam = pitchZ === null ? 0 : (rand() * 2 - 1) * SEAM_M;
  return { speedKmh, pitchZ, x, seam, line };
}
```

  Run `NODE_OPTIONS= pnpm exec vitest run src/features/games/cricket/3d/delivery.test.ts` and expect 5 passed.

- [ ] **Step 6: Write the failing ball tests** (`ball.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { BALL_RADIUS, CONTACT_Z, RELEASE, ROPE } from "./field";
import type { Delivery } from "./delivery";
import { deliveryPath, shotPath } from "./ball";

const ball = (over: Partial<Delivery> = {}): Delivery => ({
  speedKmh: 140,
  pitchZ: 2,
  x: 0,
  seam: 0,
  line: "middle",
  ...over,
});
const fromRope = (p: readonly number[]) =>
  Math.hypot(p[0]! - ROPE.centre[0], p[2]! - ROPE.centre[2]);

describe("deliveryPath", () => {
  it("leaves the hand, pitches where planned, and meets the bat", () => {
    const path = deliveryPath(ball({ pitchZ: 6, seam: 0.05 }));
    expect(path.at(0)).toEqual(RELEASE);
    const bounce = path.at(path.bounceAt!);
    expect(bounce[1]).toBeCloseTo(BALL_RADIUS, 3);
    expect(bounce[2]).toBeCloseTo(6, 3);
    const bat = path.at(path.duration);
    expect(bat[2]).toBeCloseTo(CONTACT_Z, 3);
    expect(bat[0]).toBeCloseTo(0.05, 3);
  });
  it("takes about half a second at 120 to 145 km/h", () => {
    for (const speedKmh of [120, 145]) {
      const d = deliveryPath(ball({ speedKmh })).duration;
      expect(d).toBeGreaterThan(0.4);
      expect(d).toBeLessThan(0.7);
    }
  });
  it("a full toss never comes below knee height before the bat", () => {
    const path = deliveryPath(ball({ pitchZ: null }));
    expect(path.bounceAt).toBeNull();
    for (let t = 0; t <= path.duration; t += 0.02) expect(path.at(t)[1]).toBeGreaterThan(0.5);
  });
  it("carries on past the bat to the keeper when asked", () => {
    const path = deliveryPath(ball({ x: -0.15 }), -12.4);
    expect(path.at(path.duration)[2]).toBeCloseTo(-12.4, 3);
  });
});

describe("shotPath", () => {
  const from = [0, 0.4, CONTACT_Z] as const;
  it("a drive stays on the ground and crosses the rope", () => {
    const path = shotPath("drive", -45, from);
    for (let t = 0; t <= path.duration; t += 0.05) expect(path.at(t)[1]).toBeLessThan(0.5);
    expect(fromRope(path.at(path.boundaryAt!))).toBeCloseTo(ROPE.radius, 1);
    expect(fromRope(path.at(path.duration))).toBeGreaterThan(ROPE.radius);
  });
  it("a loft and a pull climb high and land beyond the rope", () => {
    for (const [kind, bearing] of [["loft", 0], ["pull", 70]] as const) {
      const path = shotPath(kind, bearing, from);
      let top = 0;
      for (let t = 0; t <= path.duration; t += 0.05) top = Math.max(top, path.at(t)[1]);
      expect(top).toBeGreaterThan(12);
      expect(fromRope(path.at(path.duration))).toBeGreaterThan(ROPE.radius + 5);
    }
  });
  it("a dug-out ball dies within two metres", () => {
    const path = shotPath("dugOut", 0, from);
    expect(path.boundaryAt).toBeNull();
    const end = path.at(path.duration);
    expect(Math.hypot(end[0] - from[0], end[2] - from[2])).toBeLessThan(2);
  });
});
```

- [ ] **Step 7: Implement `ball.ts`.**

```ts
import { BALL_RADIUS, CONTACT_Z, GRAVITY, RELEASE, ROPE, type Vec3 } from "./field";
import type { Delivery } from "./delivery";
import type { BatShot } from "./director";

export interface Path {
  readonly duration: number;
  at(t: number): Vec3;
}
export interface DeliveryPath extends Path {
  /** Seconds from the release to the bounce; null for a full toss. */
  readonly bounceAt: number | null;
}
export interface ShotPath extends Path {
  /** When it crosses the rope (FOUR) or lands in the stands (SIX); null for a dot. */
  readonly boundaryAt: number | null;
}

/** What the pitch keeps of the ball's speed: up and along. */
export const BOUNCE = { vertical: 0.45, horizontal: 0.9 } as const;
/** A full toss reaches the bat at this height (m). */
export const FULL_TOSS_Y = 0.9;
/** A ground shot: speed off the bat (m/s), slowing (m/s²), and its little hop (m/s up). */
export const GROUND = { speed: 28, decel: 1.5, hop: 1.2 } as const;
/** An aerial shot: launch angle, and how far past the rope it lands (m). */
export const AIR = { angleDeg: 35, intoStands: 12 } as const;
/** A ball dug out: it trickles toward the bowler and stops. */
export const DEAD = { speed: 4, decel: 6, duration: 1.0 } as const;

const lerp = (a: number, b: number, f: number) => a + (b - a) * f;
const fall = (y0: number, vy: number, t: number) => y0 + vy * t - (GRAVITY * t * t) / 2;
const clampT = (t: number, d: number) => Math.min(Math.max(t, 0), d);
const rad = (deg: number) => (deg * Math.PI) / 180;

/** The unit (x, z) direction of a bearing: 0 is straight back past the bowler (+z), +90 square on the leg side (+x). */
export const heading = (bearing: number): readonly [number, number] => [
  Math.sin(rad(bearing)),
  Math.cos(rad(bearing)),
];

/** Metres from `from` along `dir` to the rope. */
export function toRope(from: Vec3, dir: readonly [number, number]): number {
  const ox = from[0] - ROPE.centre[0];
  const oz = from[2] - ROPE.centre[2];
  const b = dir[0] * ox + dir[1] * oz;
  const c = ox * ox + oz * oz - ROPE.radius * ROPE.radius;
  return -b + Math.sqrt(b * b - c);
}

/** Seconds a ground shot takes to run `s` metres. */
export const groundTimeAt = (s: number) =>
  (GROUND.speed - Math.sqrt(Math.max(0, GROUND.speed ** 2 - 2 * GROUND.decel * s))) / GROUND.decel;

/** The ball from the hand to `endZ` (default: the bat), pitching at the delivery's length; past the bat it carries on along the same line. */
export function deliveryPath(d: Delivery, endZ = CONTACT_Z): DeliveryPath {
  const v = d.speedKmh / 3.6;
  const [rx, ry, rz] = RELEASE;
  const batX = d.x + d.seam;
  if (d.pitchZ === null) {
    const xAt = (z: number) => lerp(rx, batX, (rz - z) / (rz - CONTACT_Z));
    const toBat = Math.hypot(batX - rx, rz - CONTACT_Z) / v;
    const vy = (FULL_TOSS_Y - ry + (GRAVITY * toBat * toBat) / 2) / toBat;
    const ex = xAt(endZ);
    const T = Math.hypot(ex - rx, rz - endZ) / v;
    return {
      duration: T,
      bounceAt: null,
      at: (t) => {
        const s = clampT(t, T);
        return [lerp(rx, ex, s / T), Math.max(BALL_RADIUS, fall(ry, vy, s)), lerp(rz, endZ, s / T)];
      },
    };
  }
  const pz = d.pitchZ;
  const bx = lerp(rx, d.x, (rz - pz) / (rz - CONTACT_Z));
  const t1 = Math.hypot(bx - rx, rz - pz) / v;
  const vy1 = (BALL_RADIUS - ry + (GRAVITY * t1 * t1) / 2) / t1;
  const vyOut = -(vy1 - GRAVITY * t1) * BOUNCE.vertical;
  const ex = lerp(bx, batX, (pz - endZ) / (pz - CONTACT_Z));
  const t2 = Math.hypot(ex - bx, pz - endZ) / (v * BOUNCE.horizontal);
  const T = t1 + t2;
  return {
    duration: T,
    bounceAt: t1,
    at: (t) => {
      const s = clampT(t, T);
      if (s <= t1) return [lerp(rx, bx, s / t1), fall(ry, vy1, s), lerp(rz, pz, s / t1)];
      const u = s - t1;
      return [lerp(bx, ex, u / t2), Math.max(BALL_RADIUS, fall(BALL_RADIUS, vyOut, u)), lerp(pz, endZ, u / t2)];
    },
  };
}

/** The ball off the bat from `from`, along `bearing` (degrees). */
export function shotPath(kind: BatShot, bearing: number, from: Vec3): ShotPath {
  const dir = heading(bearing);
  const along = (s: number, y: number): Vec3 => [from[0] + dir[0] * s, y, from[2] + dir[1] * s];
  if (kind === "dugOut") {
    const stop = DEAD.speed / DEAD.decel;
    return {
      duration: DEAD.duration,
      boundaryAt: null,
      at: (t) => {
        const s = Math.min(clampT(t, DEAD.duration), stop);
        return along(DEAD.speed * s - (DEAD.decel * s * s) / 2, BALL_RADIUS);
      },
    };
  }
  if (kind === "loft" || kind === "pull") {
    const a = rad(AIR.angleDeg);
    const v = Math.sqrt(((toRope(from, dir) + AIR.intoStands) * GRAVITY) / Math.sin(2 * a));
    const vh = v * Math.cos(a);
    const vy = v * Math.sin(a);
    const T = (vy + Math.sqrt(vy * vy + 2 * GRAVITY * from[1])) / GRAVITY;
    return {
      duration: T,
      boundaryAt: T,
      at: (t) => {
        const s = clampT(t, T);
        return along(vh * s, Math.max(BALL_RADIUS, fall(from[1], vy, s)));
      },
    };
  }
  const ropeAt = groundTimeAt(toRope(from, dir));
  const T = ropeAt + 0.5;
  return {
    duration: T,
    boundaryAt: ropeAt,
    at: (t) => {
      const s = clampT(t, T);
      return along(
        GROUND.speed * s - (GROUND.decel * s * s) / 2,
        Math.max(BALL_RADIUS, fall(Math.max(from[1], BALL_RADIUS), GROUND.hop, s)),
      );
    },
  };
}
```

  Run `NODE_OPTIONS= pnpm exec vitest run src/features/games/cricket/3d/ball.test.ts` and expect 7 passed. If a number in a test disagrees with the maths, fix the maths, not the test. Report any test you believe is wrong to the controller.

- [ ] **Step 8: Write the failing director tests** (`director.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { BEARINGS, pickShot } from "./director";
import type { Delivery } from "./delivery";

const d = (line: Delivery["line"], pitchZ: number | null = 2): Delivery => ({
  speedKmh: 140,
  pitchZ,
  x: 0,
  seam: 0,
  line,
});
const r = () => 0.5;
const within = (v: number, [a, b]: readonly [number, number]) => v >= a && v <= b;

describe("pickShot (spec §4.3: what you see matches the commentary)", () => {
  it("a dot on an OFF line is beaten; on MIDDLE or LEG it is dug out", () => {
    expect(pickShot({ call: "dot", q: "perfect", last: false }, d("off"), r).kind).toBe("beaten");
    expect(pickShot({ call: "dot", q: "perfect", last: false }, d("middle"), r).kind).toBe("dugOut");
    expect(pickShot({ call: "dot", q: "perfect", last: false }, d("leg"), r).kind).toBe("dugOut");
  });
  it("a four is a drive whose direction fits the line", () => {
    const off = pickShot({ call: "four", q: "good", last: false }, d("off"), r);
    const leg = pickShot({ call: "four", q: "good", last: false }, d("leg"), r);
    const mid = pickShot({ call: "four", q: "good", last: false }, d("middle"), r);
    expect(off.kind).toBe("drive");
    expect(within(off.bearing, BEARINGS.coverDrive)).toBe(true);
    expect(within(leg.bearing, BEARINGS.legDrive)).toBe(true);
    expect(within(Math.abs(mid.bearing), BEARINGS.straight)).toBe(true);
  });
  it("a perfect ball 3 is flicked off the toes for four", () => {
    const s = pickShot({ call: "four", q: "perfect", last: true }, d("off"), r);
    expect(s.kind).toBe("flick");
    expect(within(s.bearing, BEARINGS.flick)).toBe(true);
  });
  it("a six off a short ball is a pull; off a full toss a loft", () => {
    expect(pickShot({ call: "six", q: "miss", last: false }, d("middle", 11), r).kind).toBe("pull");
    expect(pickShot({ call: "six", q: "miss", last: true }, d("leg", null), r)).toMatchObject({ kind: "loft" });
  });
});
```

- [ ] **Step 9: Implement `director.ts`.**

```ts
import type { Quality } from "../../engine/types";
import type { CricketCall } from "../referee";
import type { Delivery } from "./delivery";

export type BatShot = "dugOut" | "drive" | "flick" | "pull" | "loft";
export type ShotKind = BatShot | "beaten";
export interface Shot {
  kind: ShotKind;
  /** Degrees: 0 straight back past the bowler, + toward the leg side (+x). */
  bearing: number;
}

/** The direction ranges (degrees) a shot is picked inside. */
export const BEARINGS = {
  coverDrive: [-55, -40],
  straight: [6, 14],
  legDrive: [40, 55],
  flick: [45, 60],
  pull: [60, 80],
  loftOff: [-25, -15],
  loftStraight: [0, 10],
  loftLeg: [15, 25],
} as const satisfies Record<string, readonly [number, number]>;

/**
 * Yash's answer to a ball (spec §4.3). The referee's call never changes; the shot is the one its commentary line
 * describes, and only the exact direction is random.
 */
export function pickShot(
  { call, q, last }: { call: CricketCall; q: Quality; last: boolean },
  d: Delivery,
  rand: () => number = Math.random,
): Shot {
  const pick = ([a, b]: readonly [number, number]) => a + rand() * (b - a);
  const either = (range: readonly [number, number]) => (rand() < 0.5 ? -1 : 1) * pick(range);
  const byLine = (off: readonly [number, number], middle: readonly [number, number], leg: readonly [number, number]) =>
    d.line === "off" ? pick(off) : d.line === "leg" ? pick(leg) : either(middle);
  if (call === "dot") return { kind: d.line === "off" ? "beaten" : "dugOut", bearing: 0 };
  if (call === "four") {
    if (last && q === "perfect") return { kind: "flick", bearing: pick(BEARINGS.flick) };
    return { kind: "drive", bearing: byLine(BEARINGS.coverDrive, BEARINGS.straight, BEARINGS.legDrive) };
  }
  if (d.pitchZ !== null) return { kind: "pull", bearing: pick(BEARINGS.pull) };
  return { kind: "loft", bearing: byLine(BEARINGS.loftOff, BEARINGS.loftStraight, BEARINGS.loftLeg) };
}
```

  Run the director tests and expect 4 passed.

- [ ] **Step 10: Make the commentary match (view + copy).**
  - In `ui-copy.ts` under `games.cricket.comm`, add:

    ```ts
    beaten: "Beaten! Missed off stump by a whisker.", // derived (Phase 8)
    sixFull: "Full toss. Thank you very much.", // derived (Phase 8)
    ```

  - In `view.ts`, replace `copy.comm[last.line]` with `commFor(copy.comm, last)`, where:

    ```ts
    /** The line for a ball: as the referee says, except a 3D dot on an OFF line (beaten) and a 3D full toss for six (spec §4.3). */
    function commFor(comm: UiCopy["games"]["cricket"]["comm"], ball: CricketBall): string {
      if (ball.call === "dot" && ball.aim === "off") return comm.beaten;
      if (ball.line === "six" && ball.full) return comm.sixFull;
      return comm[ball.line];
    }
    ```

  - Add two `view.test.ts` cases: a 3D perfect ball on OFF gives `comm.beaten`; a 3D miss with `full: true` on ball 1 gives `comm.sixFull`. A 2D ball (no `aim`) keeps `comm.dot` / `comm.six`.
  - If a copy catalogue or copy-review list exists (`docs/launch/copy-review.md`), add the two derived lines to it.

- [ ] **Step 11: Run the cricket unit tests, typecheck and lint.**
  Run: `NODE_OPTIONS= pnpm exec vitest run src/features/games/cricket src/content && NODE_OPTIONS= pnpm typecheck && NODE_OPTIONS= pnpm lint`
  Expected: green.

- [ ] **Step 12: Commit.** `feat(cricket): 3D delivery, ball flight and Yash's shot, as pure maths; commentary matches the shot (Phase 8 T2)`

---

### Task 3: The timeline: shotlists for the ready state, the ball and the walk back (pure)

**Files:**
- Create: `src/features/games/three/track.ts`, `src/features/games/three/track.test.ts`, `src/features/games/cricket/3d/sequence.ts`, `src/features/games/cricket/3d/sequence.test.ts`
- Modify: `src/features/games/cricket/3d/field.ts` (import `Vec3` from `../../three/track` and re-export it)

**Interfaces:**
- Consumes: everything from Task 2.
- Produces:
  - `track.ts`: `Vec3`, `ClipSeg<C>`, `Move`, `ActorTrack<C>`, `ClipSample<C>`, `ActorSample<C>`, `CROSSFADE_S`, `lerp3`, `sampleTrack`
  - `sequence.ts`: `CricketClip`, `Track`, `Sound`, `Cue`, `Shotlist`, `BallPlan`, `RUNUP`, `LEAP_AT`, `RUNUP_END`, `RELEASE_AFTER`, `SHOT_CONTACT`, `WALK_BACK_S`, `clapTimes`, `standing`, `readyShotlist`, `ballShotlist`, `walkBackShotlist`

- [ ] **Step 1: Write the failing track tests** (`track.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { CROSSFADE_S, sampleTrack, type ActorTrack } from "./track";

const track: ActorTrack = {
  home: [0, 0, 0],
  face: 0,
  clips: [
    { clip: "run", start: 0, loop: true, speed: 2 },
    { clip: "bowl", start: 1, from: 0.1 },
  ],
  moves: [
    { start: 0, end: 1, to: [0, 0, 10] },
    { start: 1, end: 2, to: [4, 0, 10], ease: "in", face: 1.5 },
  ],
};

describe("sampleTrack", () => {
  it("plays one clip at full weight, at its speed", () => {
    expect(sampleTrack(track, 0.5).clips).toEqual([{ clip: "run", time: 1, weight: 1, loop: true }]);
  });
  it("crossfades into the next clip over CROSSFADE_S, weights summing to 1", () => {
    const { clips } = sampleTrack(track, 1 + CROSSFADE_S / 2);
    expect(clips.map((c) => c.clip)).toEqual(["bowl", "run"]);
    expect(clips[0]!.weight + clips[1]!.weight).toBeCloseTo(1);
    expect(clips[0]!.time).toBeCloseTo(0.1 + CROSSFADE_S / 2);
  });
  it("moves along each walk in turn, with its easing and facing", () => {
    expect(sampleTrack(track, 0.5).position).toEqual([0, 0, 5]);
    const mid = sampleTrack(track, 1.5);
    expect(mid.position[0]).toBeCloseTo(1); // ease "in": 0.5² of 4 m
    expect(mid.face).toBe(1.5);
    expect(sampleTrack(track, 9).position).toEqual([4, 0, 10]);
  });
  it("before the first clip, holds its first frame", () => {
    const late = { ...track, clips: [{ clip: "idle", start: 2 }] };
    expect(sampleTrack(late, 1).clips).toEqual([{ clip: "idle", time: 0, weight: 1, loop: false }]);
  });
});
```

- [ ] **Step 2: Implement `track.ts`.**

```ts
export type Vec3 = readonly [x: number, y: number, z: number];

/** One clip on an actor's timeline, from `start` (s) until the next one starts. */
export interface ClipSeg<C extends string = string> {
  clip: C;
  start: number;
  /** Seconds into the clip at `start` (default 0). */
  from?: number;
  /** Playback speed (default 1). */
  speed?: number;
  loop?: boolean;
}
/** A walk from wherever the actor is to `to`, from `start` to `end` (moves do not overlap and are in order). */
export interface Move {
  start: number;
  end: number;
  to: Vec3;
  ease?: "linear" | "in" | "out";
  /** The heading to face from `start` (radians, 0 faces +z); unchanged when left out. */
  face?: number;
}
export interface ActorTrack<C extends string = string> {
  home: Vec3;
  face: number;
  clips: ClipSeg<C>[];
  moves: Move[];
}
export interface ClipSample<C extends string = string> {
  clip: C;
  time: number;
  weight: number;
  loop: boolean;
}
export interface ActorSample<C extends string = string> {
  position: Vec3;
  face: number;
  clips: ClipSample<C>[];
}

/** How long one clip takes to hand over to the next. */
export const CROSSFADE_S = 0.15;

const clamp01 = (v: number) => Math.min(1, Math.max(0, v));
const EASE = {
  linear: (f: number) => f,
  in: (f: number) => f * f,
  out: (f: number) => 1 - (1 - f) * (1 - f),
};
export const lerp3 = (a: Vec3, b: Vec3, f: number): Vec3 => [
  a[0] + (b[0] - a[0]) * f,
  a[1] + (b[1] - a[1]) * f,
  a[2] + (b[2] - a[2]) * f,
];

const sampleClip = <C extends string>(seg: ClipSeg<C>, t: number, weight: number): ClipSample<C> => ({
  clip: seg.clip,
  time: (seg.from ?? 0) + Math.max(0, t - seg.start) * (seg.speed ?? 1),
  weight,
  loop: seg.loop ?? false,
});

/** Where an actor is at `t`, which way it faces, and its clips with their weights (the newest first). */
export function sampleTrack<C extends string>(track: ActorTrack<C>, t: number): ActorSample<C> {
  let position = track.home;
  let face = track.face;
  for (const m of track.moves) {
    if (t < m.start) break;
    if (m.face !== undefined) face = m.face;
    const f = m.end > m.start ? clamp01((t - m.start) / (m.end - m.start)) : 1;
    position = lerp3(position, m.to, EASE[m.ease ?? "linear"](f));
  }
  let i = -1;
  for (let k = 0; k < track.clips.length; k++) if (track.clips[k]!.start <= t) i = k;
  const clips: ClipSample<C>[] = [];
  if (i < 0) {
    const first = track.clips[0];
    if (first) clips.push(sampleClip(first, first.start, 1));
  } else {
    const current = track.clips[i]!;
    const w = i > 0 ? clamp01((t - current.start) / CROSSFADE_S) : 1;
    clips.push(sampleClip(current, t, w));
    if (w < 1) clips.push(sampleClip(track.clips[i - 1]!, t, 1 - w));
  }
  return { position, face, clips };
}
```

  Note: when `t` is inside a move, `position` (where the actor stood when that move began) is the previous move's `to`, because moves never overlap. Run the track tests and expect 4 passed.

- [ ] **Step 3: Write the failing sequence tests** (`sequence.test.ts`):

```ts
import { describe, expect, it } from "vitest";
import { sampleTrack } from "../../three/track";
import { deliveryPath } from "./ball";
import type { Delivery } from "./delivery";
import { CAMERA, homeOf, JUMP_Z, MARK } from "./field";
import {
  ballShotlist,
  clapTimes,
  LEAP_AT,
  RELEASE_AFTER,
  RUNUP,
  SHOT_CONTACT,
  walkBackShotlist,
} from "./sequence";

const delivery: Delivery = { speedKmh: 140, pitchZ: 4, x: -0.15, seam: 0, line: "off" };
const plan = (kind: "drive" | "beaten" | "loft" | "dugOut", bearing = -45) => ({
  ball: 0,
  delivery: kind === "loft" ? { ...delivery, pitchZ: null } : delivery,
  shot: { kind, bearing },
  pressAt: 1.7,
});

describe("clapTimes", () => {
  it("one clap per stride, from the start of the run-up, closer together as he speeds up", () => {
    const t = clapTimes();
    expect(t).toHaveLength(RUNUP.strides);
    expect(t[0]).toBe(0);
    expect(t.at(-1)!).toBeLessThan(LEAP_AT);
    const gaps = t.slice(1).map((v, i) => v - t[i]!);
    for (let i = 1; i < gaps.length; i++) expect(gaps[i]!).toBeLessThan(gaps[i - 1]!);
  });
});

describe("ballShotlist", () => {
  it("before the release press, the bowler runs in to the leap and there is no ball", () => {
    const s = ballShotlist(0, null);
    expect(s.ball(1)).toBeNull();
    expect(sampleTrack(s.actors.bowler, LEAP_AT).position[2]).toBeCloseTo(JUMP_Z);
    expect(s.cues.filter((c) => c.sound === "clap")).toHaveLength(RUNUP.strides);
  });
  it("a drive: the bat meets the ball at contact, a bat cue there, the crowd at the rope, the camera follows", () => {
    const p = plan("drive");
    const s = ballShotlist(0, p);
    const release = p.pressAt + RELEASE_AFTER;
    const contact = release + deliveryPath(delivery).duration;
    const shot = s.actors.yash.clips.find((c) => c.clip === "drive")!;
    expect(shot.start).toBeCloseTo(contact - SHOT_CONTACT.drive);
    expect(s.ball(contact)).toEqual(deliveryPath(delivery).at(deliveryPath(delivery).duration));
    expect(s.cues).toContainEqual({ at: contact, sound: "bat" });
    expect(s.cues.some((c) => c.sound === "crowd" && c.at > contact)).toBe(true);
    expect(s.cues.some((c) => c.sound === "clap")).toBe(false);
    expect(s.camera(contact + 1)).not.toEqual(CAMERA.aim);
    expect(s.end).toBeGreaterThan(contact);
  });
  it("beaten: an ooh, no bat, the keeper takes it, the camera stays on the aim view", () => {
    const s = ballShotlist(0, plan("beaten", 0));
    expect(s.cues.some((c) => c.sound === "bat")).toBe(false);
    expect(s.cues.some((c) => c.sound === "ooh")).toBe(true);
    expect(s.actors.keeper.clips.some((c) => c.clip === "keeperTake")).toBe(true);
    expect(s.camera(s.end)).toEqual(CAMERA.aim);
    expect(s.ball(s.end)).toBeNull();
  });
  it("a drive sends the nearest fielder to dive, and he never reaches the ball's line", () => {
    const s = ballShotlist(0, plan("drive", -45));
    const diver = (["cover", "midwicket", "fineLeg", "slip"] as const).find((id) =>
      s.actors[id].clips.some((c) => c.clip === "dive"),
    );
    expect(diver).toBe("cover");
  });
});

const expectNear = (a: readonly number[], b: readonly number[]) =>
  a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, 6));

describe("walkBackShotlist", () => {
  it("everyone ends at their place for the next ball; the bowler back at his mark", () => {
    const prev = ballShotlist(0, plan("drive"));
    const s = walkBackShotlist(prev, 1);
    expectNear(sampleTrack(s.actors.bowler, s.end).position, MARK);
    expectNear(sampleTrack(s.actors.cover, s.end).position, homeOf("cover", 1));
    expectNear(s.camera(s.end).position, CAMERA.aim.position);
    expectNear(s.camera(s.end).target, CAMERA.aim.target);
  });
});
```

- [ ] **Step 4: Implement `sequence.ts`.**

```ts
import { CRICKET_PERIOD_MS } from "../referee";
import { lerp3, sampleTrack, type ActorTrack, type Move, type Vec3 } from "../../three/track";
import { deliveryPath, groundTimeAt, heading, shotPath } from "./ball";
import type { Delivery } from "./delivery";
import type { Shot } from "./director";
import {
  ACTORS,
  CAMERA,
  FIELDERS,
  JUMP_Z,
  KEEPER_TAKE_Z,
  MARK,
  faceOf,
  homeOf,
  type ActorId,
  type CameraPose,
} from "./field";

export type CricketClip =
  | "idle" | "walk" | "jog" | "sprint" | "crouch" | "stance" | "bowl"
  | "dugOut" | "beaten" | "drive" | "flick" | "pull" | "loft" | "keeperTake" | "dive";
export type Track = ActorTrack<CricketClip>;
export type Sound = "clap" | "bounce" | "bat" | "ooh" | "crowd";
export interface Cue {
  at: number;
  sound: Sound;
}
/** Everything on the field as a function of time (s from its start). */
export interface Shotlist {
  end: number;
  ball(t: number): Vec3 | null;
  actors: Record<ActorId, Track>;
  camera(t: number): CameraPose;
  cues: Cue[];
}
export interface BallPlan {
  ball: number;
  delivery: Delivery;
  shot: Shot;
  /** When you pressed release (s from the run-up's start). */
  pressAt: number;
}

/** The run-up: the approach, then the meter's one sweep (today's crossing speed), and the strides in it. */
export const RUNUP = { approach: 1.2, sweep: CRICKET_PERIOD_MS / 1000, strides: 8 } as const;
/** The final leap: the meter's centre. */
export const LEAP_AT = RUNUP.approach + RUNUP.sweep / 2;
/** The meter's end: no press by now is released as a full toss. */
export const RUNUP_END = RUNUP.approach + RUNUP.sweep;
/** The bowling action lets go this long after it starts; each bat shot meets the ball this far into its clip. */
export const RELEASE_AFTER = 0.3;
export const SHOT_CONTACT: Record<Shot["kind"], number> = {
  dugOut: 0.3, beaten: 0.3, drive: 0.35, flick: 0.3, pull: 0.3, loft: 0.4,
};
export const DIVE_REACH = 0.35;
export const RUN_SPEED = 7;
export const CHASE_WITHIN = 15;
export const WALK_BACK_S = 2.6;
export const RESET_S = 2.0;
export const CAMERA_BLEND_S = 0.5;
export const SETTLE_S = 0.4;
export const FOLLOW = { behind: 14, ground: 8, air: 12, lag: 0.2 } as const;

const smooth = (f: number) => {
  const c = Math.min(1, Math.max(0, f));
  return c * c * (3 - 2 * c);
};
const blend = (a: CameraPose, b: CameraPose, f: number): CameraPose => ({
  position: lerp3(a.position, b.position, f),
  target: lerp3(a.target, b.target, f),
});
const aim = () => CAMERA.aim;
const restClip = (id: ActorId): CricketClip =>
  id === "yash" ? "stance" : id === "keeper" || id === "slip" ? "crouch" : "idle";

/** Everyone in place before ball `ball` (0 to 2), in their waiting moves. */
export function standing(ball: number): Record<ActorId, Track> {
  const all = {} as Record<ActorId, Track>;
  for (const id of ACTORS)
    all[id] = { home: homeOf(id, ball), face: faceOf(id), clips: [{ clip: restClip(id), start: 0, loop: true }], moves: [] };
  return all;
}

export const readyShotlist = (ball: number): Shotlist => ({
  end: 0, ball: () => null, actors: standing(ball), camera: aim, cues: [],
});

/** One clap per stride; his run eases in to the leap, so they come closer together. */
export const clapTimes = () =>
  Array.from({ length: RUNUP.strides }, (_, k) => LEAP_AT * Math.sqrt(k / RUNUP.strides));

const APPROACH: Move[] = [
  { start: 0, end: LEAP_AT, to: [MARK[0], 0, JUMP_Z], ease: "in" },
  { start: LEAP_AT, end: RUNUP_END, to: [MARK[0], 0, JUMP_Z - 0.8] },
];

/** The fielder nearest a drive's line sprints to cut it off and dives, always just short (a FOUR beats him). */
function chase(actors: Record<ActorId, Track>, bearing: number, from: Vec3, contact: number) {
  const [dx, dz] = heading(bearing);
  let best: { id: ActorId; s: number; d: number } | null = null;
  for (const id of FIELDERS) {
    const h = actors[id].home;
    const s = (h[0] - from[0]) * dx + (h[2] - from[2]) * dz;
    const d = Math.abs((h[0] - from[0]) * dz - (h[2] - from[2]) * dx);
    if (s >= 5 && d < CHASE_WITHIN && (!best || d < best.d)) best = { id, s, d };
  }
  if (!best) return;
  const h = actors[best.id].home;
  const q: Vec3 = [from[0] + dx * best.s, 0, from[2] + dz * best.s];
  const toQ = Math.hypot(q[0] - h[0], q[2] - h[2]);
  const tc = contact + groundTimeAt(best.s);
  const go = contact + 0.15;
  const runFor = Math.max(0, tc - DIVE_REACH - go);
  const reach = Math.min((RUN_SPEED * runFor) / toQ, (toQ - 1.2) / toQ);
  const face = Math.atan2(q[0] - h[0], q[2] - h[2]);
  const a = actors[best.id];
  a.clips.push({ clip: "sprint", start: go, loop: true }, { clip: "dive", start: tc - DIVE_REACH }, { clip: "idle", start: tc + 1.2, loop: true });
  a.moves = [
    { start: go, end: tc - DIVE_REACH, to: lerp3(h, q, Math.max(0, reach)), face },
    { start: tc - DIVE_REACH, end: tc + 0.15, to: lerp3(h, q, Math.max(0, reach) + 0.8 / toQ), ease: "out" },
  ];
}

/** Ball `ball`: the run-up and, once you have pressed release, the ball, Yash's shot, the chase and the camera. */
export function ballShotlist(ball: number, plan: BallPlan | null): Shotlist {
  const actors = standing(ball);
  actors.bowler.clips = [{ clip: "sprint", start: 0, loop: true }];
  actors.bowler.moves = [...APPROACH];
  if (!plan)
    return {
      end: RUNUP_END, ball: () => null, actors, camera: aim,
      cues: clapTimes().map((at) => ({ at, sound: "clap" as const })),
    };

  const { delivery, shot, pressAt } = plan;
  const release = pressAt + RELEASE_AFTER;
  const atPress = sampleTrack(actors.bowler, pressAt).position;
  actors.bowler.clips.push({ clip: "bowl", start: pressAt }, { clip: "idle", start: release + 1.0, loop: true });
  actors.bowler.moves = [
    { start: 0, end: pressAt, to: atPress },
    { start: release, end: release + 0.8, to: [atPress[0], 0, atPress[2] - 3], ease: "out" },
  ];

  const toBat = deliveryPath(delivery);
  const contact = release + toBat.duration;
  actors.yash.clips.push({ clip: shot.kind, start: contact - SHOT_CONTACT[shot.kind] }, { clip: "idle", start: contact + 1.2, loop: true });
  const cues: Cue[] = [];
  if (toBat.bounceAt !== null) cues.push({ at: release + toBat.bounceAt, sound: "bounce" });

  if (shot.kind === "beaten") {
    const past = deliveryPath(delivery, KEEPER_TAKE_Z);
    const take = release + past.duration;
    actors.keeper.clips.push({ clip: "keeperTake", start: take - 0.25 }, { clip: "crouch", start: take + 1.0, loop: true });
    cues.push({ at: contact, sound: "ooh" });
    return {
      end: take + 0.6 + SETTLE_S,
      ball: (t) => (t >= release && t <= take ? past.at(t - release) : null),
      actors, camera: aim, cues,
    };
  }

  const from = toBat.at(toBat.duration);
  const after = shotPath(shot.kind, shot.bearing, from);
  const flightEnd = contact + after.duration;
  const ballAt = (t: number): Vec3 | null =>
    t < release ? null : t < contact ? toBat.at(t - release) : t <= flightEnd ? after.at(t - contact) : null;
  cues.push({ at: contact, sound: "bat" });
  if (after.boundaryAt !== null) cues.push({ at: contact + after.boundaryAt, sound: "crowd" });
  if (shot.kind === "drive" || shot.kind === "flick") chase(actors, shot.bearing, from, contact);

  const [dx, dz] = heading(shot.bearing);
  const lift = shot.kind === "pull" || shot.kind === "loft" ? FOLLOW.air : FOLLOW.ground;
  const camera = (t: number): CameraPose => {
    if (shot.kind === "dugOut" || t <= contact) return aim();
    const now = Math.min(t, flightEnd);
    const lead = ballAt(now) ?? from;
    const lag = ballAt(Math.max(contact, now - FOLLOW.lag)) ?? from;
    const follow: CameraPose = {
      position: [lag[0] - dx * FOLLOW.behind, lag[1] + lift, lag[2] - dz * FOLLOW.behind],
      target: lead,
    };
    return blend(aim(), follow, smooth((t - contact) / CAMERA_BLEND_S));
  };
  return { end: flightEnd + SETTLE_S, ball: ballAt, actors, camera, cues };
}

/** After a ball: everyone walks back to their places for ball `next`, the bowler jogs to his mark, the camera returns. */
export function walkBackShotlist(prev: Shotlist, next: number): Shotlist {
  const actors = standing(next);
  for (const id of ACTORS) {
    const was = sampleTrack(prev.actors[id], prev.end);
    const to = homeOf(id, next);
    const a = actors[id];
    a.home = was.position;
    a.face = was.face;
    const far = Math.hypot(to[0] - was.position[0], to[2] - was.position[2]) > 0.3;
    if (!far) {
      if (id === "yash") a.clips = [{ clip: "idle", start: 0, loop: true }, { clip: "stance", start: 1.6, loop: true }];
      continue;
    }
    const dur = id === "bowler" ? WALK_BACK_S : RESET_S;
    a.clips = [{ clip: id === "bowler" ? "jog" : "walk", start: 0, loop: true }, { clip: restClip(id), start: dur, loop: true }];
    a.moves = [
      { start: 0, end: dur, to, face: Math.atan2(to[0] - was.position[0], to[2] - was.position[2]) },
      { start: dur, end: dur, to, face: faceOf(id) },
    ];
  }
  const from = prev.camera(prev.end);
  return {
    end: WALK_BACK_S, ball: () => null, actors,
    camera: (t) => blend(from, aim(), smooth(t / 1.0)),
    cues: [],
  };
}
```

  Run `NODE_OPTIONS= pnpm exec vitest run src/features/games/three src/features/games/cricket/3d` and expect all passed. The drive test expects `cover` to dive for a −45° drive from the off line. If the maths picks another fielder, check `chase` before touching the test.

- [ ] **Step 5: Typecheck, lint, commit.** `feat(cricket): the 3D timeline: run-up, ball, chase, camera and walk back as functions of time (Phase 8 T3)`

---

### Task 4: Three new game sounds, made in code

**Files:**
- Modify: `src/shell/synth.ts`, `src/shell/audio.tsx` (`SoundName`), `src/shell/synth.test.ts` (only if it lists the recipes by hand)

**Interfaces:**
- Produces: `SoundName` gains `"clap" | "bounce" | "ooh"`, and `RECIPES` gains the three. `cricket/3d/sequence.ts`'s `Sound` names must all be `SoundName`s; add a type-level check in `sequence.ts`:

  ```ts
  import type { SoundName } from "@/shell/audio";
  const _sounds: Sound extends SoundName ? true : never = true;
  ```

- [ ] **Step 1: Add the recipes**, in the style of the existing ones (`envelope`, `noise`, `filter`, `tone`; levels under `PEAK`; every source stopped by its cap):
  - `clap`: one crowd hand-clap. Band-passed noise (about 1.4 kHz, Q 1.5), 2ms attack, gone by 60ms, level `PEAK * 0.35` (soft; many come in a row).
  - `bounce`: the ball on the pitch. A dull thud (sine 110 → 60 Hz over 50ms, `PEAK * 0.45`) under a short low-passed tick of noise (800 Hz, `PEAK * 0.2`, 30ms).
  - `ooh`: a crowd "ooh". Low-passed noise (600 Hz, Q 0.7) swelling over 150ms and fading by 900ms (`PEAK * 0.5`), with a soft vowel-like hum: two sines at 220 and 330 Hz through a band-pass at 500 Hz, `PEAK * 0.15`, falling 10% in pitch over the sound.
- [ ] **Step 2:** Make sure the existing `synth.test.ts` and `audio.test.tsx` cover the new recipes automatically: every recipe stays under `PEAK`, stops its sources, and respects mute. If they iterate `RECIPES`, nothing to add; if not, add the three to their lists.
- [ ] **Step 3:** Run `NODE_OPTIONS= pnpm exec vitest run src/shell` and expect green. Then typecheck and lint.
- [ ] **Step 4: Commit.** `feat(sound): a clap, a bounce and a crowd ooh, made in code (Phase 8 T4)`

---

### Task 5: The asset step: the athlete, the skin and the moves

**Files:**
- Modify: `package.json` (dev: `@gltf-transform/core`, `@gltf-transform/functions`)
- Create: `tools/models.mjs`, `public/models/athlete.glb`, `public/models/athlete-skin.jpg`, `public/models/moves.glb`, `public/models/CREDITS.md`, `src/features/games/three/rig.ts`, `src/features/games/three/rig.test.ts`

**Interfaces:**
- Produces (`rig.ts`):

```ts
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
/** Our names for the free clips we ship (their names in the pack). */
export const LIBRARY_CLIPS = {
  idle: "Idle_Loop",
  walk: "Walk_Loop",
  jog: "Jog_Fwd_Loop",
  sprint: "Sprint_Loop",
  crouch: "Crouch_Idle_Loop",
} as const;
export const MODEL_FILES = {
  body: "/models/athlete.glb",
  skin: "/models/athlete-skin.jpg",
  moves: "/models/moves.glb",
} as const;
/** Measured at intake (Step 3): the body's rest-pose heights and reach in its own units, for painting the kit. */
export const KIT_REGIONS = { ankle: 0, hip: 0, neck: 0, sleeve: 0 }; // ← real values from Step 3
/** Turns the model to face +z (0 if it already does), and its units to metres (1 if already metres). */
export const MODEL_YAW = 0; // ← from Step 3
export const MODEL_SCALE = 1; // ← from Step 3
```

  The `← from Step 3` values are filled in with measured numbers in Step 3. The committed file contains numbers only, no arrows.
  - If `Sword_Idle` / `Sword_Attack` turn out to be a better base for the stance and the bat shots (Task 6 decides), Task 6 adds them to `LIBRARY_CLIPS` and re-runs `tools/models.mjs`.

- [ ] **Step 1: Add glTF-Transform.** Run: `NODE_OPTIONS= pnpm add -D @gltf-transform/core @gltf-transform/functions`.

- [ ] **Step 2: Write `tools/models.mjs`.** It's a Node script run by hand once (not part of the build). Its comment header names its inputs and outputs.
  - Usage: `node tools/models.mjs <folder holding ubc/ and ual/>` (the untrusted folder, read as data only).
  - **Body:**
    1. Read `ubc/Superhero_Male_FullBody.gltf` with `NodeIO`.
    2. Remove every texture and image, and every material's texture slots.
    3. Keep the three meshes (body, eyes, eyebrows) and the skin.
    4. `prune()`, `dedup()`, `quantize()` (`KHR_mesh_quantization`: three reads it with no decoder).
    5. Write `public/models/athlete.glb`.
  - **Moves:**
    1. Read `ual/UAL1_Standard.glb`.
    2. Keep only the animations whose names are the values of `LIBRARY_CLIPS` (the script reads them from a small constant list it shares with `rig.ts`; repeat the five names, with a comment pointing to `rig.ts`).
    3. Remove the mesh, its materials and the skin, keeping the joint nodes the animations target.
    4. `resample()`, `prune()`.
    5. Write `public/models/moves.glb`.
  - **Skin:** `sips -s format jpeg -s formatOptions 80 -Z 1024 <ubc/T_Superhero_Male_Dark.png> --out public/models/athlete-skin.jpg` (macOS built-in). Run it from the script with `execFileSync`, with the paths passed as arguments.
  - Run it: `NODE_OPTIONS= node tools/models.mjs /private/tmp/claude-501/-Users-sardap-Documents-github-portfolio/c8ac2dd0-453b-4ce9-a3cd-389ad19e1373/scratchpad/untrusted-quaternius`.

- [ ] **Step 3: Measure the rig and fill in `rig.ts`.** Write a throwaway script in the scratchpad's `scripts/` folder (not in the repo) that reads `athlete.glb` with glTF-Transform and prints:
  - the bind-pose bounding box
  - the world-space rest positions of `foot_l`, `pelvis`, `neck_01` and `upperarm_l` / `lowerarm_l`
  - the root's scale
  - which way the body faces

  Set:
  - `MODEL_SCALE` so the body is about 1.8m tall
  - `MODEL_YAW` so it faces +z
  - `KIT_REGIONS` (ankle a little above the foot bone, hip at the pelvis, neck at `neck_01`, sleeve halfway along the upper arm, in the body's own units) — these are what the kit material compares the rest-pose `position` attribute against

  Write the numbers into `rig.ts` with a one-line comment each on how they were measured.

- [ ] **Step 4: Write `rig.test.ts`** (Vitest; read the GLBs from disk with a tiny GLB-JSON reader, no three):

```ts
import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BONES, LIBRARY_CLIPS } from "./rig";

/** The JSON chunk of a .glb. */
function gltfJson(path: string) {
  const b = readFileSync(path);
  return JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString("utf8"));
}
const body = gltfJson("public/models/athlete.glb");
const moves = gltfJson("public/models/moves.glb");
const nodeNames = (j: { nodes: { name?: string }[] }) => new Set(j.nodes.map((n) => n.name));

describe("the shipped models (spec §6.1, CSP-safe)", () => {
  it("the body has every bone we pose, no images, and needs no decoder", () => {
    for (const name of Object.values(BONES)) expect(nodeNames(body)).toContain(name);
    expect(body.images ?? []).toEqual([]);
    for (const ext of body.extensionsRequired ?? []) expect(ext).toBe("KHR_mesh_quantization");
  });
  it("the moves are exactly our clips, on the same bone names", () => {
    expect(moves.animations.map((a: { name: string }) => a.name).sort()).toEqual(
      Object.values(LIBRARY_CLIPS).sort(),
    );
    for (const name of Object.values(BONES)) expect(nodeNames(moves)).toContain(name);
    expect(moves.meshes ?? []).toEqual([]);
  });
  it("stays small", () => {
    expect(statSync("public/models/athlete.glb").size).toBeLessThan(700_000);
    expect(statSync("public/models/moves.glb").size).toBeLessThan(1_500_000);
    expect(statSync("public/models/athlete-skin.jpg").size).toBeLessThan(300_000);
  });
});
```

- [ ] **Step 5: Credits.** Write `public/models/CREDITS.md` in the style of `public/audio/CREDITS.md`, covering:
  - each pack's name and author (Quaternius)
  - the licence (CC0 1.0)
  - the pack's page (https://quaternius.itch.io/universal-base-characters, https://quaternius.itch.io/universal-animation-library)
  - which files came from which, and what was changed (textures removed, clips trimmed, the skin resized to 1024px JPEG)
- [ ] **Step 6:** Run `NODE_OPTIONS= pnpm exec vitest run src/features/games/three/rig.test.ts` and expect 3 passed. Check that `pnpm build` copies `public/models` into `build/client/models`.
- [ ] **Step 7: Commit.** `feat(games): the free CC0 athlete, skin and moves, trimmed for the web; the rig map (Phase 8 T5)`. Never commit anything from the untrusted folder except these processed outputs.

---

### Task 6: The 3D world: canvas, athletes, kits, cricket shots, stadium

This is the visual task: tune it by looking at screenshots. The controller reviews them.

**Files:**
- Create:
  - `src/features/games/three/settings.ts`
  - `src/features/games/three/tokens.ts`
  - `src/features/games/three/GameCanvas.tsx`
  - `src/features/games/three/poseClip.ts`, `src/features/games/three/poseClip.test.ts`
  - `src/features/games/three/kitMaterial.ts`
  - `src/features/games/three/athlete.ts`
  - `src/features/games/cricket/3d/shots.ts`
  - `src/features/games/cricket/3d/props.ts`
  - `src/features/games/cricket/3d/Stadium.tsx`
  - `src/features/games/cricket/3d/Players.tsx`
  - `src/features/games/cricket/3d/scene.tsx`
  - `src/features/games/cricket/3d/world.ts`
  - `src/features/games/cricket/3d/PoseLab.stories.tsx`
- Modify: `.storybook/main.ts` (serve `public/models` at `/models`)

**Interfaces:**
- Consumes: `rig.ts` (Task 5), `sequence.ts` / `track.ts` / `field.ts` (Tasks 2–3).
- Produces:
  - `world.ts` (no `three` import, so the screen can import it statically):

    ```ts
    import type { Shotlist } from "./sequence";
    /** What the scene draws each frame: the shotlist on screen, its clock (s), and whether the crowd stands (ball 3). */
    export interface WorldState { shotlist: Shotlist; elapsed(): number; crowdUp: boolean }
    ```

  - `scene.tsx` (the lazy entry):

    ```ts
    export interface CricketAssets { body: GLTF; moves: AnimationClip[]; skin: Texture }
    export function loadCricketAssets(onProgress: (fraction: number) => void): Promise<CricketAssets>;
    export function CricketScene(props: { assets: CricketAssets; world: RefObject<WorldState>; layout: GameLayout }): JSX.Element;
    ```

- [ ] **Step 1: Write the failing `poseClip` test, then implement it.** `poseClip(name, keys, rest, bones)` turns key poses into an `AnimationClip`:
  - one `QuaternionKeyframeTrack` per `BoneKey` in `bones` (**every** bone gets a track, so nothing from an earlier clip is left behind)
  - each key's quaternion = `rest[bone] × fromEuler(XYZ degrees)`, where a bone a key leaves out has the rest rotation in that key
  - the duration is the last key's `at`

  Test: two keys (`at` 0 and 1), `hips` turned `[90, 0, 0]` at 1, identity rest. The track `pelvis.quaternion` has times `[0, 1]`, and its second value is close to `[0.7071, 0, 0, 0.7071]`. Every bone has a track.

```ts
import { AnimationClip, Euler, Quaternion, QuaternionKeyframeTrack } from "three";

export type Rotation = readonly [x: number, y: number, z: number];
export interface PoseKey<B extends string> {
  at: number;
  /** Degrees (XYZ) each bone turns from its rest rotation; a bone left out is at rest. */
  pose: Partial<Record<B, Rotation>>;
}
const DEG = Math.PI / 180;

/** A clip from key poses, for the moves the free pack lacks (spec B8). Every bone gets a track. */
export function poseClip<B extends string>(
  name: string,
  keys: readonly PoseKey<B>[],
  rest: Record<B, Quaternion>,
  bones: Record<B, string>,
): AnimationClip {
  const times = keys.map((k) => k.at);
  const tracks = (Object.keys(bones) as B[]).map(
    (b) =>
      new QuaternionKeyframeTrack(
        `${bones[b]}.quaternion`,
        times,
        keys.flatMap((k) => {
          const [x, y, z] = k.pose[b] ?? [0, 0, 0];
          return rest[b].clone().multiply(new Quaternion().setFromEuler(new Euler(x * DEG, y * DEG, z * DEG))).toArray();
        }),
      ),
  );
  return new AnimationClip(name, keys.at(-1)?.at ?? 0, tracks);
}
```

- [ ] **Step 2: `settings.ts` and `tokens.ts`.**
  - `SETTINGS: Record<GameLayout, { dpr: number; shadows: boolean; crowd: number; antialias: boolean }>`:
    - stage: dpr 2, shadows true, crowd 2400, antialias true
    - column: dpr 1.5, shadows false, crowd 1200, antialias false
  - `tokenColor(name: string): Color` reads `getComputedStyle(document.documentElement).getPropertyValue(name)` into a `three` `Color`, so every scene colour comes from the design tokens (e.g. `--color-night`, `--color-volt`, `--color-floodlight`, `--color-panel`, `--ref-outfield-a`, `--ref-outfield-b`, `--ref-pitch-near`, `--ref-pitch-far`, `--ref-stump`). No hex values in scene code.

- [ ] **Step 3: `GameCanvas.tsx`.** The R3F `Canvas` for both layouts, `aria-hidden`, `className="absolute inset-0"`, with:
  - `dpr={[1, SETTINGS[layout].dpr]}`
  - `shadows={SETTINGS[layout].shadows}`
  - `gl={{ antialias, powerPreference: "high-performance" }}`
  - `camera={{ fov: CAMERA.fov[layout], near: 0.1, far: 500, position: CAMERA.aim.position }}`
  - the scene background set to `tokenColor("--color-night")`
  - children

  R3F stops drawing on its own while the tab is hidden (requestAnimationFrame pauses), so there's no extra code for that.

- [ ] **Step 4: `kitMaterial.ts`.** `kitMaterial(skin: Texture, kit: { shirt: Color; trousers: Color })` returns a `MeshStandardMaterial` (map = skin) patched with `onBeforeCompile`:
  - vertex: declare `varying vec3 vRest;` and set `vRest = position;` right after `#include <begin_vertex>` (the rest-pose position before skinning)
  - fragment: after `#include <map_fragment>`:
    - if `vRest.y > uHip && vRest.y < uNeck && abs(vRest.x) < uSleeve`, then `diffuseColor.rgb = uShirt`
    - else if `vRest.y > uAnkle && vRest.y <= uHip`, then `diffuseColor.rgb = uTrousers`

    The uniforms come from `KIT_REGIONS` and the kit.
  - Swap `x` for the axis the arms lie along if Task 5's measurement says so.
  - Set `customProgramCacheKey` to include `"kit"`, so three compiles one program for all kits.

- [ ] **Step 5: `athlete.ts`.** `makeAthlete(assets, kit, clips)` → `{ root, mixer, actions, bone(key) }`:
  - `SkeletonUtils.clone(assets.body.scene)` (from `three/addons/utils/SkeletonUtils.js`)
  - scale by `MODEL_SCALE`; an inner group turned by `MODEL_YAW`, so the outer `root` faces +z
  - every mesh gets the kit material: eyes and eyebrows get flat dark/white `MeshStandardMaterial`s; nothing else needs textures
  - `castShadow` on the body
  - an `AnimationMixer` with one action per clip, all `play()`ed at weight 0
  - `applyClips(athlete, samples: ClipSample[])`: zeroes every action's weight, then for each sample sets `weight`, and `time` = `loop ? sample.time % duration : Math.min(sample.time, duration)`, then calls `mixer.update(0)`

- [ ] **Step 6: `props.ts`.** Code-built, flat-coloured meshes, sized in metres (divide by the bone's world scale when parenting):
  - the bat (blade + handle) parented to `handR`
  - a helmet (sphere cap + grille) on `head`
  - pads (two rounded boxes) on `shinL` / `shinR`
  - gloves (small boxes) on both hands
  - a cap for the bowler and the fielders on `head`
  - for the keeper: a helmet, pads and big gloves

  Colours come from tokens: helmet volt for Yash and dark for the keeper; pads, gloves and caps light.

- [ ] **Step 7: `shots.ts`.** Key poses for each clip the free pack lacks:
  - `stance`: side-on, knees bent, bat grounded behind the back foot
  - `bowl`: the gather, the front-arm reach, the release at `RELEASE_AFTER`, the follow-through
  - `dugOut`: bat jammed down in front of the toes at `SHOT_CONTACT.dugOut`
  - `beaten`: a forward push that passes over/inside the line at `SHOT_CONTACT.beaten`
  - `drive`: front foot to the pitch of the ball, high elbow, bat through the line at `SHOT_CONTACT.drive`, high finish
  - `flick`: wrists rolling the bat face to leg at `SHOT_CONTACT.flick`
  - `pull`: back foot, horizontal bat swung to leg at `SHOT_CONTACT.pull`
  - `loft`: a full swing under the ball at `SHOT_CONTACT.loft`, a big finish
  - `keeperTake`: gloves together, rising from the crouch
  - `dive`: a full-length sideways dive reaching at `DIVE_REACH`

  Every pose is mirrored for a right-hander, as spec §4.3 assumes. Keys sit at the contact times named above, so the bat meets the ball exactly. Each clip lasts 0.8 to 1.4s.
  - `buildCricketClips(rest)` returns them, plus the library clips renamed to our names (`idle`, `walk`, `jog`, `sprint`, `crouch`).
  - Where a library clip already looks like the move (e.g. `Sword_Idle` for the stance, `Sword_Attack` for the drive), you may base the clip on it (re-timed so contact lands on `SHOT_CONTACT`) instead of key poses. Add it to `LIBRARY_CLIPS` and re-run `tools/models.mjs`, and note it in the report.

- [ ] **Step 8: `Stadium.tsx`.** Built from simple shapes, colours from tokens:
  - a ground disc (radius 100) with mown stripes from `--ref-outfield-a/-b` (a `CanvasTexture` of stripes; no image files)
  - the pitch (3.05 × 20.12) in `--ref-pitch-near`
  - crease lines
  - two translucent volt bands on the pitch: the yorker band around z `LENGTH_Z.yorker` and the good-length band around z 5–7
  - stumps and bails at both ends
  - the rope (a thin torus at `ROPE`)
  - tiered stands from radius 72 to 95
  - one `InstancedMesh` crowd of simple low-poly figures (count from `SETTINGS`), coloured from a small token palette, whose instances rise by 0.25m when `world.current.crowdUp`
  - four floodlight towers with emissive panels
  - lights:
    - one `DirectionalLight` that casts shadows only when `SETTINGS[layout].shadows` (shadow map 2048, a tight shadow camera around the pitch)
    - a `HemisphereLight`
    - on the column, a soft dark blob under each player instead of shadows

- [ ] **Step 9: `Players.tsx` and `scene.tsx`.**
  - `Players` makes the seven athletes once:
    - kits: Yash dark (`--color-panel` shirt and trousers); everyone else a light shirt (`--color-floodlight`) and dark trousers
    - props attached
  - On every frame (`useFrame`), for each actor:
    1. `const s = sampleTrack(world.current.shotlist.actors[id], world.current.elapsed())`
    2. set `root.position` from `s.position`
    3. set `root.rotation.y = s.face`
    4. `applyClips(athlete, s.clips)`
  - The ball: a white sphere drawn at 3× the real radius so it reads on screen. Each frame it is placed at `shotlist.ball(t)`, or hidden when null.
  - The camera: each frame it is set from `shotlist.camera(t)` (`position`, then `lookAt(target)`).
  - `scene.tsx` exports:
    - `loadCricketAssets(onProgress)`: `GLTFLoader` for the two GLBs and `TextureLoader` for the skin, all three in parallel; progress = the mean of each file's `loaded / total`; `skin.colorSpace = SRGBColorSpace`, `flipY = false`
    - `CricketScene`: `GameCanvas` + `Stadium` + `Players` + the ball + the camera
  - Nothing outside `three/` and `cricket/3d/` imports `three` or `@react-three/fiber`.

- [ ] **Step 10: The Pose Lab story** (`Dev/Cricket Pose Lab`, dev only).
  - It loads the assets, then renders `CricketScene` at a fixed time: `args`: `shot` (each `ShotKind`), `line`, `t` (a range slider 0–8s), `layout` (`stage` / `column`); the world is `ballShotlist(0, plan)`, frozen at `t`.
  - Serve the models in Storybook: `.storybook/main.ts` `staticDirs: ["./static", { from: "../public/models", to: "/models" }]`.
  - Keep it out of automated story tests: if `tests/stories/*` enumerate every story from `index.json`, skip ids starting with `dev-` there (one line, with a comment).

- [ ] **Step 11: Look at it.** Use a throwaway Playwright script (in the scratchpad, against Storybook's static build or a temporary story server on 4184) and save screenshots to `.superpowers/sdd/2026-10-15-phase-8-cricket-3d/shots/`:
  - stage 1440×900 and column 390×844
  - aim view (t 0)
  - mid run-up
  - release
  - contact for every shot kind
  - a follow frame for a four and a six
  - the walk back

  Tune `CAMERA.aim` / `fov` until the stage shows the bowler in the foreground and Yash, the stumps and the keeper between the left and right panels (x 336–1044 of 1440), and the column shows the same above the thumb zone. Tune the poses until each shot reads as that shot. Iterate before reporting. The controller reviews the screenshots and may send poses back.

- [ ] **Step 12: Unit tests, typecheck, lint; commit.** Run `NODE_OPTIONS= pnpm exec vitest run src/features/games`, then typecheck and lint. Commit `feat(cricket): the 3D world: athletes in painted kits, cricket shots from key poses, the floodlit stadium (Phase 8 T6)`.

---

### Task 7: The 3D game: run-up, release, controls, the one 2D/3D choice

**Files:**
- Create:
  - `src/features/games/cricket/useCricketCalls.ts`
  - `src/features/games/cricket/Cricket3DScreen.tsx`
  - `src/features/games/cricket/CricketGame.tsx`
  - `src/features/games/cricket/LinePicker.tsx`, `LinePicker.stories.tsx`
  - `tests/e2e/cricket-3d.spec.ts`
  - `tests/e2e/support/cricket3d.ts`
- Modify:
  - `src/features/games/cricket/CricketScreen.tsx` (use `useCricketCalls`; behaviour unchanged)
  - `CricketPage.tsx`, `CricketStage.tsx`, `CricketColumn.tsx`
  - `view.ts` (+test): the phase `"runup"`, `buildCricket3dControls`
  - `src/content/ui-copy.ts`
  - `src/features/games/tennis/view.ts` (the `kmh` move)
  - `app/routes/arena.cricket.tsx`
  - `tests/e2e/smoke.spec.ts`, `tests/e2e/webkit-smoke.spec.ts`

**Interfaces:**
- Consumes: `useThreeGate`, `GameLoader`, `ThreeBoundary`, the host slots (Task 1); `bowl(s, q, how)`, `planDelivery`, `pickShot` (Task 2); `ballShotlist`, `readyShotlist`, `walkBackShotlist`, `RUNUP`, `RUNUP_END`, `Cue` (Task 3); `WorldState`, `loadCricketAssets`, `CricketScene` (Task 6).
- Produces:
  - `CricketGame` (the route's component)
  - `useCricketCalls(session) → { land(next: CricketState, o: { callMs: number; bat: boolean }): void }`
  - `CricketPhase` gains `"runup"`
  - `CRICKET_3D_BEATS = { calledMs: 3000 }` (in `referee.ts` beside `CRICKET_BEATS`)

- [ ] **Step 1: Copy.** In `ui-copy.ts`:
  - `games.cricket` gains:

    ```ts
    release: "RELEASE · SPACE", // derived (Phase 8)
    releasePhone: "TAP TO RELEASE", // derived (Phase 8)
    line: { label: "LINE", keys: "← →", off: "OFF", middle: "MIDDLE", leg: "LEG" }, // derived (Phase 8)
    loading: "PREPARING THE PITCH", // derived (Phase 8)
    how3d: "Pick a line, run in, and release when the marker hits the yorker zone. Every ball you bowl — dot ball or six — unlocks an innings of my career.", // derived (Phase 8)
    ```

  - Move `games.tennis.kmh` to `games.kmh` and update its use in `tennis/view.ts`.
  - The Hub's cricket fixture `duration: "~10s"` becomes `"~30s"` (spec B4).
  - Add the new derived strings to `docs/launch/copy-review.md` if it lists derived copy.

- [ ] **Step 2: The view.**
  - `CricketPhase` gains `"runup"`. `buildCricketView` treats it like `"flight"`: no call, the same bug and the same slots.
  - Add a pure `buildCricket3dControls(ui, { phase, aim, speedKmh })` →

    ```ts
    {
      lines: { label: string; keys: string; options: { id: CricketAim; label: string; pressed: boolean }[] };
      bowl: { label: string; labelPhone: string };
      speed: string | null;
      loading: string;
      how: string;
    }
    ```

    - `bowl` uses `release` / `releasePhone` during `"runup"`, else `bowl` / `bowlPhone`
    - `speed` is `"143 KM/H"` (with `ui.games.kmh`) or null
    - `how` is `how3d`

  - Add one `view.test.ts` case for the run-up labels and one for the speed text.

- [ ] **Step 3: `useCricketCalls`.**
  - Move `land` from `CricketScreen` into `useCricketCalls(session)`, parametrised by `{ callMs, bat }`:
    - `bat: false` skips `audio.play("bat")` (3D plays it at the contact cue)
    - `callMs` is how long `"called"` holds before `"ready"`
  - `CricketScreen` calls `land(next, { callMs: CRICKET_BEATS.callMs, bat: true })`. Its behaviour and its tests are unchanged.

- [ ] **Step 4: `LinePicker`.**
  - A `role="group"` with `aria-label={lines.label}` holding three design-system `Button`s (or the closest existing toggle look), each:
    - `aria-pressed`
    - at least 44px tall
    - `data-game-control`
    - `aria-disabled` (not `disabled`) when not choosable
  - Clicking one calls `onLine(id)`. A small `MonoLabel` shows `label · keys` on the stage size.
  - Story: `Features/Games/Cricket` → `LinePicker` with MIDDLE pressed, in both sizes.

- [ ] **Step 5: Wire the page.**
  - `CricketPage`, `CricketStage` and `CricketColumn` take one optional prop:

    ```ts
    three?: {
      status: ThreeStatus;
      progress: number;
      scene: ReactNode | null; // only for the visible layout
      controls: Cricket3dControls;
      onLine(line: CricketAim): void;
    }
    ```

  - **Without `three`, they render exactly as today** (the 2D parity tests guard this).
  - With `three`:
    - `CricketPage` passes `three.status` to `GamePage` (`data-three`), and the scene to the stage when `desktop` and to the column otherwise. **Exactly one layout gets the scene**, so there is one canvas.
    - **Loading:** the 2D board and marks as today, with `GameLoader` (`controls.loading`, `progress`) in place of the meter and BOWL.
    - **Ready:**
      - the layout's `scene` replaces the backdrop; the tracer, rings, pitch labels, tags and the 2D ball are not rendered
      - the BOWL block shows, top to bottom: `LinePicker`, the speed line (a `MonoLabel` that keeps its height with `invisible` while null), the `TimingMeter`, and `BowlButton` with the `controls.bowl` labels, enabled in `"ready"` and `"runup"`
      - the left panel's `how` is `controls.how`

- [ ] **Step 6: `Cricket3DScreen`.** Build it with this shape, adapting only names to the code:

```tsx
interface Run extends EndFlags {
  game: CricketState;
  phase: CricketPhase;
  aim: CricketAim;
  speedKmh: number | null;
}
const START: Run = { game: CRICKET_START, phase: "ready", aim: "middle", speedKmh: null, ...NO_END_FLAGS };
const sweepAt = (ms: number) => Math.min(1, Math.max(0, (ms - RUNUP.approach * 1000) / CRICKET_PERIOD_MS));

export function Cricket3DScreen({ gate }: { gate: ThreeGate<Cricket3d> }) {
  const session = useGameSession({ venue: "cricket", start: START, build });
  const { run, latest, commit, view, timers, live, desktop, layout, say } = session;
  const ready = gate.status === "ready";
  const root = useRef<HTMLElement>(null);
  const meterAt = useRef(0);
  const clock = useGameClock(root, {
    cssVar: "--meter",
    value: (ms) => (latest.current.phase === "runup" ? sweepAt(ms) : latest.current.phase === "ready" ? 0 : meterAt.current),
    running: ready,
  });
  const world = useRef<WorldState>({ shotlist: readyShotlist(0), elapsed: () => clock.elapsed() / 1000, crowdUp: false });
  const { land } = useCricketCalls(session);
  const show = (shotlist: Shotlist, restart = true) => {
    world.current.shotlist = shotlist;
    if (restart) clock.restart();
  };
  const cue = (cues: Cue[], now: number) =>
    cues.forEach((c) => timers.after(Math.max(0, (c.at - now) * 1000), () => live.current.audio.play(c.sound)));

  const startRunup = () => {
    const ball = latest.current.game.balls.length;
    meterAt.current = 0;
    world.current.crowdUp = ball === CRICKET_BALLS - 1;
    commit({ phase: "runup", speedKmh: null });
    const runup = ballShotlist(ball, null);
    show(runup);
    cue(runup.cues, 0);
    timers.after(RUNUP_END * 1000, release); // no press by the end: released as a full toss
  };

  const release = () => {
    if (latest.current.phase !== "runup") return;
    const ms = clock.elapsed();
    if (ms < RUNUP.approach * 1000) return; // the meter has not started: the press is ignored
    timers.clear(); // the claps stop, the auto-release is cancelled
    const p = sweepAt(ms);
    meterAt.current = p;
    const { game, aim } = latest.current;
    const quality = lengthQuality(p, live.current.layout);
    const next = bowlBall(game, quality, { aim, full: p > 0.5 });
    const index = game.balls.length;
    const delivery = planDelivery({ quality, p, line: aim });
    const shot = pickShot({ call: next.balls.at(-1)!.call, q: quality, last: index === CRICKET_BALLS - 1 }, delivery);
    const ball = ballShotlist(index, { ball: index, delivery, shot, pressAt: ms / 1000 });
    show(ball, false); // the run-up and the ball share one clock
    commit({ phase: "flight", speedKmh: delivery.speedKmh });
    if (!live.current.desktop) navigator.vibrate?.(20);
    cue(ball.cues, ms / 1000);
    timers.after((ball.end - ms / 1000) * 1000, () => {
      land(next, { callMs: CRICKET_3D_BEATS.calledMs, bat: false });
      show(walkBackShotlist(ball, Math.min(next.balls.length, CRICKET_BALLS - 1)));
    });
  };

  const press = () => {
    live.current.audio.unlock();
    if (!ready) return;
    if (latest.current.phase === "ready") startRunup();
    else release();
  };
  const step = (by: -1 | 1) => {
    if (latest.current.phase !== "ready") return;
    const i = LINES.indexOf(latest.current.aim);
    commit({ aim: LINES[Math.min(LINES.length - 1, Math.max(0, i + by))]! });
  };
  const pickLine = (aim: CricketAim) => latest.current.phase === "ready" && commit({ aim });

  // Review Focus 2: a hidden tab cancels a ball in its run-up or flight; it is bowled again fresh.
  useEffect(() => {
    const onVisibility = () => {
      if (document.visibilityState !== "hidden") return;
      const phase = latest.current.phase;
      if (phase !== "runup" && phase !== "flight") return;
      timers.clear();
      commit({ phase: "ready", speedKmh: null });
      show(readyShotlist(latest.current.game.balls.length));
    };
    document.addEventListener("visibilitychange", onVisibility);
    return () => document.removeEventListener("visibilitychange", onVisibility);
  }, []);

  const again = () =>
    session.again(() => {
      world.current.crowdUp = false;
      show(readyShotlist(0));
      if (desktop) say(ui.games.cricket.comm.start, { interrupt: true });
    });

  useGameKeys(
    { down: { " ": press, Enter: press, ArrowLeft: () => step(-1), ArrowRight: () => step(1) } },
    { active: ready && (run.phase === "ready" || run.phase === "runup") },
  );
  useArrival({ line: ui.games.cricket.comm.start, spoken: desktop, reduced: false });

  const controls = buildCricket3dControls(ui, { phase: run.phase, aim: run.aim, speedKmh: run.speedKmh });
  const Scene = gate.value?.Scene;
  const scene =
    ready && Scene ? (
      <ThreeBoundary onError={gate.fail}>
        <Scene assets={gate.value!.assets} world={world} layout={layout} />
      </ThreeBoundary>
    ) : null;
  return (
    <CricketPage
      view={view}
      phase={run.phase}
      onBowl={press}
      onAgain={again}
      rootRef={root}
      three={{ status: gate.status, progress: gate.progress, scene, controls, onLine: pickLine }}
    />
  );
}
```

  Notes:
  - `LINES` is `["off", "middle", "leg"] as const` in `referee.ts` beside `CricketAim`.
  - `bowlBall` is the referee's `bowl`, imported under that name.
  - `Cricket3d` is `{ Scene: typeof CricketScene; assets: CricketAssets }` as a **type-only** import.
  - The effect's empty dependency list follows the project's ref pattern. If the hooks lint rule objects, read `commit` / `timers` from the session's refs, as `useAutoRally` does.

- [ ] **Step 7: `CricketGame` and the route.**

```tsx
const loadCricket3d = (onProgress: (f: number) => void) =>
  import("./3d/scene").then(async (m) => ({ Scene: m.CricketScene, assets: await m.loadCricketAssets(onProgress) }));

/** Cricket in 3D, or today's 2D game for reduced motion, no WebGL, or a failed download (spec §6.2). */
export function CricketGame() {
  const reduced = useMediaQuery(MEDIA.reducedMotion);
  const gate = useThreeGate({ reduced, load: loadCricket3d });
  return gate.status === "off" ? <CricketScreen /> : <Cricket3DScreen gate={gate} />;
}
```

  `app/routes/arena.cricket.tsx` renders `<CricketGame />`.

- [ ] **Step 8: Write the 3D browser tests.**
  - `tests/e2e/support/cricket3d.ts`:
    - `open3d(page, url)`: `freezeClock`, `goto`, `waitForHydration`, wait (real time, up to 30s) for `[data-game][data-three=ready]`, then `pauseClock`
    - `jump(page, ms)`: `page.clock.fastForward(ms)` in steps of 250ms. The scene is a function of time, so jumps are safe, and they keep SwiftShader from drawing hundreds of frames.
    - `bowlAt(page, range)`: press Space (run-up), jump to `RUNUP.approach`, `stepUntil` `--meter` is inside `range`, press Space
    - `untilPhase(page, phases)`: jump until `data-phase` is in `phases`
  - `tests/e2e/cricket-3d.spec.ts` (runs in `desktop-3d` and `mobile-3d`), each test watching for page errors and expecting none:
    1. **Loads and shows one canvas:** `data-three` becomes `ready`; there is exactly one `canvas`; no `[data-part=ball]`; axe passes (`expectNoA11yViolations`).
    2. **A full over:**
       - ← (or a tap on OFF), then `bowlAt(perfect)` → DOT, and the desktop COMM reads `comm.beaten`
       - `bowlAt(good)` → FOUR
       - `bowlAt([0, 0.15])` (early: short) → SIX
       - the end buttons appear; the stored cricket result is `10* NOT OUT` with form 1/3; BALL n OF 3 counts as expected along the way
    3. **Review Focus 1:** Space, Space at once → still `runup`; after the approach one Space releases; Space during `flight` and `called` changes nothing; exactly one ball is counted.
    4. **Review Focus 2:** mid run-up, set `document.visibilityState` to `"hidden"` (`Object.defineProperty` + dispatch `visibilitychange`) → `data-phase` is `ready` and the ball count is unchanged.
    5. **Review Focus 3** (desktop-3d only): mid-flight, `setViewportSize(1024, 768)` → still one canvas; the ball lands and is counted once.
    6. **Review Focus 4:** `page.route("**/models/athlete.glb", (r) => r.fulfill({ status: 404 }))` → no canvas; the 2D BOWL button appears; one 2D ball can be bowled (reuse `release` from `support/cricket.ts`).
    7. **Review Focus 5:** mid-flight, click SKIP → the career page; no page errors; go back → `data-three=ready` within 2s of real time.
  - The mobile project plays one ball by tapping (not the whole over), to keep it fast.
  - `smoke.spec.ts`: add `/arena/cricket first-load chunks do not contain three`, modelled on the GSAP check, marking three chunks by the string `"THREE.WebGLRenderer"` and asserting that at least one such chunk exists.
  - `webkit-smoke.spec.ts`: the cricket case waits up to 30s for a thumb button (the 3D loader holds the thumb zone until ready).

- [ ] **Step 9: Run them.** With the temporary config on 4183:
  - `NODE_OPTIONS= pnpm exec playwright test -c <temp> tests/e2e/cricket-3d.spec.ts --project=desktop-3d --project=mobile-3d`
  - then the whole e2e suite once: `NODE_OPTIONS= pnpm exec playwright test -c <temp>`

  Expected: all green. Also run `NODE_OPTIONS= pnpm exec vitest run`, typecheck and lint.

- [ ] **Step 10: Screenshots for the controller.**
  - Stage 1440×900 and column 390×844:
    - loading
    - ready (aim)
    - mid run-up (meter moving, RELEASE label)
    - a four's follow
    - the call
    - the end
  - Save them in the SDD `shots/` folder.

- [ ] **Step 11: Commit.** `feat(cricket): the 3D game: pick a line, run in, release on the leap; 2D only for reduced motion, no WebGL or a failed load (Phase 8 T7)`

---

### Task 8: Lighthouse, the bundle, and the as-built notes

**Files:**
- Modify: `tools/lighthouse.mjs`, `docs/superpowers/specs/2026-10-15-phase-8-cricket-3d-design.md` (an "As built" section), `docs/superpowers/plans/phase-0-carryover.md`

- [ ] **Step 1: WebGL for Lighthouse.** Add `"--enable-unsafe-swiftshader", "--use-angle=swiftshader"` to the base `chromeFlags` in `tools/lighthouse.mjs`, so `/arena/cricket` loads its 3D the way a real device does. Without it, headless Chrome may have no WebGL and Lighthouse would measure the 2D fallback. Comment why.
- [ ] **Step 2: Build and measure.**
  Run: `NODE_OPTIONS= pnpm build && NODE_OPTIONS= pnpm lighthouse` (on port 4174).
  Gates for `/arena/cricket`:
  - desktop performance ≥ 0.90, accessibility 1.0, best practices ≥ 0.9, SEO ≥ 0.9, FCP ≤ 1500ms, CLS ≤ 0.1
  - mobile performance ≥ 0.80

  The other pages must stay where Phase 7 left them. **If the phone score is under 0.80, stop and report the numbers and the top opportunities to the controller.** Do not change loading strategy on your own (Yash owns this gate).
- [ ] **Step 3: Record the sizes:**
  - the gzip/brotli size of the lazy 3D chunk(s)
  - the sizes of the three model files
  - the total bytes a first cricket visit downloads after first paint
- [ ] **Step 4: As-built notes.** Append to the design doc an "As built" section:
  - the Lighthouse table
  - the sizes
  - the final `CAMERA` values
  - any clip based on a library move
  - any ruling the controller made during the build (from the ledger)

  In `phase-0-carryover.md`, tick the Phase 8 cricket rows and close the m-12 row with: "Closed: the 3D scene is one canvas element, so the restyled DOM does not grow; the clock still writes `--meter` on `<main>`."
- [ ] **Step 5: The full gate.** Run `NODE_OPTIONS= VERIFY=1 pnpm verify` with the temporary port config (or each step of `verify` against 4183). Expected: green.
- [ ] **Step 6: Commit.** `docs+perf(cricket): Lighthouse with WebGL, sizes and the as-built notes (Phase 8 T8)`
