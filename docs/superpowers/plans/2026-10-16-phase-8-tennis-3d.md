# Phase 8, cycle 2 — 3D Tennis Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**What this plan does (plain words):**

"Return of Serve" becomes a real game of tennis in 3D:
- Yash serves one service game on a floodlit centre court. The score runs 15, 30, 40, GAME.
- Each point is a rally of at most 4 shots. You pick the open side (← / →) for each of your shots. Your player runs and swings by himself.
- You can win at most 2 points. Once you have 30, your best shot lands just OUT.
- Yash's points unlock the projects: QF at 15, SF at 30, FINAL at 40.
- **Every shot must look smooth and clean, like a real match** (the owner's top ask with "keep it simple").

Today's 2D tennis game stays exactly as it is, only as the backup (reduced motion, no WebGL, failed download).

**Goal:** `/arena/tennis` plays one real service game in 3D on desktop and phones, after a short loader. The 2D game, the saved score `GAME YASH`, Full Time and the reveals keep working, and `pnpm verify` and the Lighthouse gates stay green.

**Architecture:**
- **Pure parts (plain TypeScript, unit-tested, no `three` import):**
  - `tennis/3d/match.ts`: the rules (points, the 30 cap, how a point ends)
  - `court.ts`: sizes and places
  - `ball.ts`: flight maths, solved in closed form so each ball meets the racket exactly
  - `timing.ts`: the clip beats every other file lines up on
  - `rally.ts`: one point's script (who hits where and when)
  - `sequence.ts`: shotlists, the scene as a function of time
- **The scene is a pure function of time,** as in cricket. A decision (your pick) rebuilds the point's shotlist from its start. The rebuild never changes anything before the moment it is made (unit-tested), so nothing pops.
- **The racket meets the ball by measurement, not by eye.** When the files load, each stroke's sweet spot at contact is measured on the real body (`reach.ts`). The script places each player so their sweet spot sits exactly where the ball is at contact.
- **Shared 3D plumbing** in `three/` (from cycle 1, plus what this plan lifts out of cricket). `tennis/3d/scene.tsx` is the one lazily loaded module that pulls in `three` for tennis.
- **The screen** (`Tennis3DScreen`) owns the phases, the timers and the rules. `TennisGame` picks 2D or 3D once, as `CricketGame` does.

**Tech Stack:**
- React 19.3 and React Router 8 (prerender)
- `three` 0.186 and `@react-three/fiber` 9.8 (no new libraries)
- Web Audio
- Tailwind v4 tokens
- Vitest, Playwright (chromium + swiftshader for 3D) + axe, Storybook 10, Lighthouse

**Spec:** `docs/superpowers/specs/2026-10-16-phase-8-tennis-3d-design.md`. It wins over the parent spec `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md` §8, §8.2 and §11.13 for tennis only. It builds on cycle 1's `docs/superpowers/specs/2026-10-15-phase-8-cricket-3d-design.md`.

Skills worth loading for the 3D tasks: `react-three-fiber-game`, `threejs-react`, `threejs-animation`, `threejs-performance`.

## Global Constraints

- **Commands.** Every node / pnpm command is prefixed `NODE_OPTIONS=` (e.g. `NODE_OPTIONS= pnpm exec vitest run …`). Use `pnpm exec`, never `npx`.
- **git.** git is 2.15: no `git switch` / `git restore`. Work on branch `phase/8-tennis-3d`. Never push, never add a remote. Commit messages end with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Processes and ports.**
  - Never kill processes you didn't start. Ports 6006, 5173–5176 and 4173 are Yash's.
  - For Playwright, copy `playwright.config.ts` to a temporary, prettier-formatted config on port **4183** (or 4184), and delete it before committing.
  - Lighthouse uses 4174.
- **Private data.** The resume PDF (`Yash-Sarda-Resume.pdf`) is never committed, copied or served. Never send yashsarda2002@gmail.com anywhere.
- **Downloads are untrusted data.** Anything downloaded (sound candidates) goes in its own new folder and is read only as data by tools that live elsewhere. Never execute anything from such a folder.
- **Free only.** No paid assets, tools or services. Licences must allow a public website (CC0 preferred).
- **The CSP stays unchanged** (`tools/csp.mjs`). No WASM decoders, no `blob:`, no images inside GLBs.
- **No new libraries.** No new model files either: `public/models/*` and `tools/models.mjs` are not changed, and every tennis move is made in code with `poseClip`.
- **No hard-coded copy.** Every visible string comes from `src/content/ui-copy.ts` (`ui`). New derived copy is flagged `// derived` like its neighbours and listed in `docs/launch/copy-review.md`.
- **`three` stays out of every page's first load.** It is imported only by `src/features/games/three/*` 3D files and the two `*/3d/scene.tsx` entries and their imports, reached only through a dynamic `import()`.
- **The 2D tennis game is untouched.** These keep their behaviour and their tests unchanged:
  - `tennis/TennisScreen.tsx`, `tennis/referee.ts` and `tennis/flight.ts`
  - the output of `buildTennisView`
  - `tests/e2e/tennis.spec.ts`

  Refactoring `view.ts` to share pieces is allowed only if `view.test.ts` stays green unchanged.
- **Cricket keeps working exactly as today** through the lifts in Task 2.
- **Lean tests.** Only the tests this plan lists, plus fixing existing ones a change breaks.
- **Keep it simple.** If a step seems to need machinery the plan does not mention, stop and report instead of building it.

## Review Focus

1. **Mashing the keys or the halves.**
   - Exactly one input counts per shot. A press during the routine, between your pick and your contact, or during the call does nothing.
   - A press during the toss or before Yash's rally hit is TOO EARLY, once.
   - Pinned by an e2e in Task 10.
2. **Switching tabs mid-point.** The point is dropped and played again fresh from Yash's routine; the score and the saved record are unchanged. Pinned by an e2e in Task 10.
3. **Resizing across 1200px mid-point.**
   - The point finishes and counts once, judged with the windows it began with.
   - There is never more than one `<canvas>` in the page.
   - Pinned by an e2e in Task 10.
4. **A failed download.** A 404 on a model file gives today's 2D tennis game, with no console errors. Pinned by an e2e in Task 10.
5. **Leaving mid-point.** After SKIP during a rally:
   - no timer or sound fires after leaving, and there are no page errors
   - coming back is instant (the files are cached)

   Pinned by an e2e in Task 10.

## Rulings made while planning

Each ruling also goes into the spec's as-built section (Task 11).

- **The window closes 0.2 s before contact** (spec §3.3, updated before this plan): a real swing needs that long, so the forward swing starts when the window closes. The ball's flight to your contact is the window plus 0.2 s.
- **The bounce's up-speed is solved per shot.** The spec says the court keeps "about 75 %" of the up-speed. Each ball must meet a racket at a set height and a set time, so the kept up-speed (`kv`) is solved for each shot, and the solver keeps it between 0.5 and 0.9: flat serves skid low, topspin kicks high. The court keeps 62 % of the speed along it (`KH`, "about 60 %").
- **The court bounce's sound is named `court`, not `bounce`.** Cricket's code-made pitch bounce is already named `bounce`. A recording under that name would change cricket's sound too.
- **The hum does not dip for the serve.** It is already quiet (−24 LUFS); the hush comes from the silence between hits and the applause after each point. Keep it simple.

---

## File structure

| File | Responsibility | Task |
|---|---|---|
| scratchpad `tennis-sound-candidates/` | 2–3 CC0 options per new sound, for Yash to pick (not committed) | 1 |
| `src/features/games/three/loadOnce.ts` (+test) | The download kept for the visit (from `CricketGame`) | 2 |
| `src/features/games/three/assets.ts` | Fetch body, moves and skin with progress; build clips and bounds in small tasks (from cricket `scene.tsx`) | 2 |
| `src/features/games/three/useThreeScreen.ts` | The 3D screen plumbing: shown, drawn, the show timeout, the hum, the scene element (from `Cricket3DScreen`) | 2 |
| `src/features/games/three/Crowd.tsx`, `three/crowdKit.ts` | The instanced crowd, seated by a function the venue gives; the seeded random; the crowd palette (from cricket `Stadium.tsx`) | 2 |
| `src/features/games/three/Floodlight.tsx` | One floodlight mast with its lamp panel (from cricket `Stadium.tsx`) | 2 |
| `src/features/games/three/groundSpots.ts` | The soft dark spot under each player on the column (from cricket `Players.tsx`) | 2 |
| `src/features/games/three/kitMaterial.ts`, `rig.ts` | `Kit.shorts`: shorts that end above the knee | 2 |
| `src/features/games/cricket/*` | Switched to the lifted pieces; no visible change | 2 |
| `src/features/games/tennis/3d/match.ts` (+test) | The 3D game's rules | 3 |
| `src/features/games/tennis/view.ts` (+test) | `buildTennis3dView` beside `buildTennisView`, sharing its pieces | 3 |
| `src/content/ui-copy.ts`, `docs/launch/copy-review.md` | The 3D tennis copy; the Hub's tennis duration and blurb | 3 |
| `src/features/games/tennis/3d/court.ts` | Sizes, places, the camera | 4 |
| `src/features/games/tennis/3d/ball.ts` (+test) | Ball flight: to a contact, to a bounce, into the net | 4 |
| `src/features/games/tennis/3d/timing.ts` | The clip beats (contact, commit, toss) | 5 |
| `src/features/games/tennis/3d/moves.ts` | The tennis key poses and `buildTennisClips` | 5 |
| `src/features/games/tennis/3d/props.ts` | Racket (with its sweet spot), headband | 5 |
| `src/features/games/tennis/3d/reach.ts` | Measures each stroke's sweet spot at contact on the real body | 5 |
| `src/features/games/three/athlete.ts` | `CLIP_PACE`: the free run clips' ground speed | 5 |
| `src/features/games/tennis/3d/PoseLab.stories.tsx` | Dev-only story: each move alone, any time, any view | 5 |
| `src/features/games/tennis/3d/rally.ts` (+test) | One point's script from its setup and the decisions so far | 6 |
| `src/features/games/three/track.ts` (+test) | `Move.turn`: a heading eased over time (cricket unchanged) | 7 |
| `src/features/games/tennis/3d/sequence.ts` (+test) | Shotlists: ready, a point, the walk between points, GAME | 7 |
| `src/features/games/tennis/3d/{Arena,Players,scene}.tsx`, `world.ts` | The 3D court; `scene.tsx` is the lazy entry | 8 |
| `src/features/games/tennis/3d/PointLab.stories.tsx` | Dev-only story: a full point plays, for the owner checkpoint | 8 |
| `src/shell/{audio.tsx,gameSound.ts,synth.ts}`, `public/audio/*` | Yash's picks: `hit`, `court`, `applause`, the tennis hum | 9 |
| `src/features/games/tennis/{Tennis3DScreen,TennisGame}.tsx` | The 3D game and the one 2D/3D choice | 10 |
| `src/features/games/tennis/{TennisPage,TennisStage,TennisColumn}.tsx` | The `three` prop | 10 |
| `app/routes/arena.tennis.tsx` | Renders `TennisGame` | 10 |
| `tests/e2e/support/three.ts`, `tests/e2e/support/cricket3d.ts` | Shared 3D e2e helpers (moved out of cricket's) | 10 |
| `tests/e2e/tennis-3d.spec.ts`, `tests/e2e/smoke.spec.ts`, `tests/e2e/webkit-smoke.spec.ts` | 3D browser tests, first-load guard | 10 |
| `tools/lighthouse.mjs`, docs | Tennis gated with WebGL off, 3D reported; as-built notes | 11 |

---

### Task 1: Sound candidates for Yash to pick

No code. It runs first so Yash can listen while the next tasks are built. His picks are shipped in Task 9.

**Files:**
- Create (not committed): `/private/tmp/claude-501/-Users-sardap-Documents-github-portfolio/c8ac2dd0-453b-4ce9-a3cd-389ad19e1373/scratchpad/tennis-sound-candidates/` (each download first lands in its own empty folder inside it, `raw/<name>/`)

- [ ] **Step 1: Find candidates on freesound.org.** CC0 only (check each sound page's licence line). Use the public HQ preview MP3s (the originals need a login), as cycle 1 did (`public/audio/CREDITS.md`).

| Group | Files | What to look for |
|---|---|---|
| `hit` | 3 | A tennis ball off strings: a clean "pock", short tail, no voice |
| `court` | 3 | A tennis ball bouncing once on a hard court |
| `applause` | 2–3 | Polite tennis applause after a point, 2–4 s |
| `ooh` | 1–2 new | A crowd's short "ooh" (today's `public/audio/ooh.mp3` is option 1, copied in as `ooh-1.mp3`) |
| `hush` | 1–2 new | A quiet tennis crowd hum that can loop (today's `public/audio/murmur.mp3` is option 1, copied in as `hush-1.mp3`) |

- [ ] **Step 2: Trim each candidate to what would ship.** Use ffmpeg from the scratchpad, with the downloads only as input files:
  - `hit` and `court`: 0.2–0.4 s, peak-normalised about -1.5 dBFS
  - `applause`: about 3 s, -16 LUFS, a short fade in and out
  - `ooh`: about 1.5 s, -16 LUFS
  - `hush`: an 8 s seamless loop, -24 LUFS

  Name them `hit-1.mp3`, `hit-2.mp3` and so on.

- [ ] **Step 3: Write `README.md` in the folder.** A table per group: file, one line on how it sounds, source page URL, author, licence, original name, trim. Then a top pick per group with one line why.

- [ ] **Step 4: Report.** List the folder path and the top picks. **The controller then asks Yash to listen and pick** (an owner checkpoint that does not block Tasks 2–8).

---

### Task 2: Lift the shared 3D pieces out of cricket (cricket unchanged)

**Files:**
- Create:
  - `src/features/games/three/loadOnce.ts`, `loadOnce.test.ts`
  - `src/features/games/three/assets.ts`
  - `src/features/games/three/useThreeScreen.ts`
  - `src/features/games/three/Crowd.tsx`, `crowdKit.ts`
  - `src/features/games/three/Floodlight.tsx`
  - `src/features/games/three/groundSpots.ts`
- Modify:
  - `src/features/games/three/kitMaterial.ts`, `rig.ts`
  - `src/features/games/cricket/CricketGame.tsx`, `Cricket3DScreen.tsx`
  - `src/features/games/cricket/3d/scene.tsx`, `Stadium.tsx`, `Players.tsx`

**Interfaces:**
- Produces:
  - `loadOnce<T>(start: (onProgress: (f: number) => void) => Promise<T>): (onProgress: (f: number) => void) => Promise<T>`
  - `assets.ts`:
    - `nextTask(): Promise<void>`
    - `AthleteFiles { body: GLTF; moves: AnimationClip[]; skin: Texture }`
    - `loadAthleteFiles(onProgress): Promise<AthleteFiles>`
    - `prepareAthlete(files, buildClips: (rest, moves) => AnimationClip[]): Promise<{ body: GLTF; clips: AnimationClip[]; skin: Texture }>`
  - `useThreeScreen.ts`:
    - `SceneProps<A, W> { assets: A; world: RefObject<W | null>; layout: GameLayout; onShown?(): void; onDrawn?(): void }`
    - `Loaded3d<A, W> { Scene: ComponentType<SceneProps<A, W>>; assets: A }`
    - `useThreeScreen({ gate, world, layout, audio }) → { ready: boolean; drawn: boolean; scene: ReactNode | null }`
  - `Crowd.tsx`: `Crowd({ count, colors, seat, up })`, where `seat(rand: () => number, at: Object3D): void` places one instance and `up(): boolean` asks it to stand
  - `crowdKit.ts`: `seeded(seed)`, `crowdColors()`
  - `Floodlight.tsx`: `Floodlight({ at: Vec3, aim: Vec3, height: number, color: Color })`
  - `groundSpots.ts`: `useGroundSpots(on: boolean, roots: readonly Object3D[])`
  - `Kit` gains `shorts?: boolean`, and `KIT_REGIONS` gains `shorts` (m)

- [ ] **Step 1: Write the failing `loadOnce` test.**

```ts
import { describe, expect, it, vi } from "vitest";
import { loadOnce } from "./loadOnce";

describe("loadOnce", () => {
  it("starts once and gives every caller the same promise; progress goes to the latest caller", async () => {
    let report: (f: number) => void = () => {};
    let done: (v: string) => void = () => {};
    const start = vi.fn((onProgress: (f: number) => void) => {
      report = onProgress;
      return new Promise<string>((resolve) => (done = resolve));
    });
    const load = loadOnce(start);
    const a = vi.fn();
    const b = vi.fn();
    const first = load(a);
    const second = load(b);
    expect(start).toHaveBeenCalledTimes(1);
    report(0.5);
    expect(a).not.toHaveBeenCalled();
    expect(b).toHaveBeenCalledWith(0.5);
    done("files");
    await expect(first).resolves.toBe("files");
    await expect(second).resolves.toBe("files");
  });
  it("forgets a failed download, so the next call tries again", async () => {
    const start = vi
      .fn<(onProgress: (f: number) => void) => Promise<string>>()
      .mockRejectedValueOnce(new Error("404"))
      .mockResolvedValueOnce("files");
    const load = loadOnce(start);
    await expect(load(() => {})).rejects.toThrow("404");
    await expect(load(() => {})).resolves.toBe("files");
    expect(start).toHaveBeenCalledTimes(2);
  });
});
```

- [ ] **Step 2: Run it, see it fail, then implement `loadOnce.ts`.**

```ts
/**
 * A download kept for the visit once started (cycle 1 spec §6.2): a rematch or coming back is instant, and coming back
 * while it is still running joins it rather than starting it again. A failed one is forgotten, so the next visit tries
 * again. Progress goes to the latest caller waiting on it.
 */
export function loadOnce<T>(start: (onProgress: (fraction: number) => void) => Promise<T>) {
  let pending: Promise<T> | null = null;
  let progressTo: (fraction: number) => void = () => {};
  return (onProgress: (fraction: number) => void): Promise<T> => {
    progressTo = onProgress;
    pending ??= start((fraction) => progressTo(fraction)).catch((error: unknown) => {
      pending = null;
      throw error;
    });
    return pending;
  };
}
```

Run: `NODE_OPTIONS= pnpm exec vitest run src/features/games/three/loadOnce.test.ts`. Expected: PASS.

- [ ] **Step 3: `CricketGame` uses it.** Replace the module's `pending` / `progressTo` / `loadCricket3d` with:

```ts
/** three.js and the scene arrive only through this dynamic import, never in a page's first load. */
const loadCricket3d = loadOnce(async (onProgress) => {
  const m = await import("./3d/scene");
  return { Scene: m.CricketScene, assets: await m.loadCricketAssets(onProgress) };
});
```

- [ ] **Step 4: `assets.ts`.** Move out of `cricket/3d/scene.tsx`:
  - the three-file fetch with its progress (the mean of each file's share), and the skin's settings (`SRGBColorSpace`, `flipY = false`, `RepeatWrapping`), as `loadAthleteFiles(onProgress) → { body, moves: moves.animations, skin }`
  - `nextTask`
  - the two start-up steps, each in a task of its own, as `prepareAthlete(files, buildClips)`:
    1. `buildClips(restPose(files.body.scene), files.moves)`
    2. `computeBoundingSphere` on every skinned mesh

  `loadCricketAssets(onProgress)` becomes:

```ts
export async function loadCricketAssets(onProgress: (fraction: number) => void): Promise<CricketAssets> {
  const files = await loadAthleteFiles(onProgress);
  return prepareAthlete(files, buildCricketClips);
}
```

- [ ] **Step 5: `useThreeScreen.ts`.** Move from `Cricket3DScreen` the 3D plumbing that is not cricket's:
  - the `shown` state
  - the per-layout `drawn` state (reset when the layout changes)
  - the `THREE_SHOW_TIMEOUT_MS` effect that calls `gate.fail`
  - the hum effect (`audio.ambience(true)` while ready, `false` on cleanup)
  - the `ThreeBoundary`-wrapped `<loaded.Scene … />` element

```ts
export interface SceneProps<A, W> {
  assets: A;
  world: RefObject<W | null>;
  layout: GameLayout;
  onShown?: () => void;
  onDrawn?: () => void;
}
export interface Loaded3d<A, W> {
  Scene: ComponentType<SceneProps<A, W>>;
  assets: A;
}

/**
 * The part of a 3D game's screen that is the same for every venue: the scene mounts hidden while its shaders compile
 * (the loader stays up), then it is shown and the game takes input for the rest of the visit. `drawn` is this
 * canvas's own: the board's backdrop stays over a new canvas until its first frame is on it (a resize across 1200px
 * mounts a new one). Once the files are in, the scene gets THREE_SHOW_TIMEOUT_MS to show, or the 2D game takes over.
 * The stadium hums under it while it is on screen.
 */
export function useThreeScreen<A, W>({
  gate,
  world,
  layout,
  audio,
}: {
  gate: ThreeGate<Loaded3d<A, W>>;
  world: RefObject<W | null>;
  layout: GameLayout;
  audio: { ambience(on: boolean): void };
}): { ready: boolean; drawn: boolean; scene: ReactNode | null } {
  // … the code moved from Cricket3DScreen, unchanged in behaviour
}
```

  `Cricket3DScreen` calls `useThreeScreen({ gate, world, layout, audio: live.current.audio })`. `Cricket3d` becomes `Loaded3d<CricketAssets, WorldState>`, and `CricketScene` takes `SceneProps<CricketAssets, WorldState>`.

- [ ] **Step 6: `Crowd.tsx`, `crowdKit.ts`, `Floodlight.tsx`, `groundSpots.ts`.** Move `seeded`, `figures`, the crowd colours (the token list in `palette().crowd`, as `crowdColors()`), the `Crowd` component, one floodlight tower, and the column's ground spot (`blob` + the effect that adds a spot under each root) out of cricket's `Stadium.tsx` / `Players.tsx`. Generalise only where tennis needs it:
  - **`Crowd`** takes `seat(rand, at)`: it sets one instance's position and rotation. Cricket passes its oval seating, `STANDS` and `centreZ` from today's loop. It also takes `up()`; cricket passes `() => world.current?.crowdUp ?? false`.
  - **`Floodlight`** takes `at` (the mast's foot), `aim` (what its panel faces), `height` and the lamp colour. It draws today's cylinder mast and emissive panel. Cricket maps its four `towers` to it.
  - **`useGroundSpots(on, roots)`** is today's `spot` memo plus the effect, for any list of athlete roots.

- [ ] **Step 7: Shorts.**
  - Measure the knee: the `calf_l` bone's rest-pose world height, from `public/models/athlete.glb`'s JSON with a throwaway script in the scratchpad.
  - In `KIT_REGIONS`, add `shorts` = knee height + 0.08, with a comment saying how it was measured.
  - In `kitMaterial`, `Kit` gains `shorts?: boolean` and the shader a `uShorts` uniform: the trousers colour runs from `kit.shorts ? uShorts : uAnkle` up to `uHip`; between the ankle and the shorts it is skin; the shoes stay below the ankle. Keep `customProgramCacheKey = () => "kit"` (one program for every kit).

- [ ] **Step 8: Check cricket is unchanged.**
  1. Run `NODE_OPTIONS= pnpm exec vitest run src/features/games`, then typecheck and lint.
  2. Run the cricket 3D e2e once on the temporary config: `NODE_OPTIONS= pnpm exec playwright test tests/e2e/cricket-3d.spec.ts --project=desktop-3d -c <temp config>`. Expected: all PASS.
  3. Take one screenshot of `/arena/cricket` at 1440×900 after the 3D shows. It should match today's (same crowd, lights and players).

- [ ] **Step 9: Commit.** `refactor(three): lift the download, the asset loading, the 3D screen plumbing, the crowd, the floodlight and the ground spots out of cricket; kits can wear shorts (Phase 8 tennis T2)`

---

### Task 3: The rules and the 3D view (pure)

**Files:**
- Create: `src/features/games/tennis/3d/match.ts`, `match.test.ts`
- Modify:
  - `src/features/games/tennis/view.ts`, `view.test.ts`
  - `src/content/ui-copy.ts`
  - `docs/launch/copy-review.md`

**Interfaces:**
- Consumes: `returnQuality`, `PERFECT_SHARE`, `TOUCH_STRETCH`, `ReturnPick`, `Side`, `TennisReturn` from `tennis/referee.ts`; `Quality`, `GameLayout` from `engine/types.ts`.
- Produces:
  - `match.ts`:
    - constants: `YOUR_CAP`, `GAME_AT`, `POINT_NAMES`, `WINDOW_MS`, `SERVE_KMH_3D`, `TENNIS_3D_BEATS`
    - types: `Hit`, `PointCall`, `Point`, `MatchState`, `Court`
    - `MATCH_START`
    - functions: `yashPoints`, `yourPoints`, `matchOver`, `windowMs`, `serveKmh`, `judge`, `decidePoint`, `playPoint`, `scoreOf`, `unlockedOf`, `allInputs`, `courtOf`
  - `view.ts`:
    - `Tennis3dPhase = "ready" | "toss" | "window" | "struck" | "rally" | "called" | "verdict" | "end"`
    - `LIVE_3D: readonly Tennis3dPhase[]` = `["toss", "window", "rally"]`
    - `buildTennis3dView(content, ui, routes, state: MatchState, at: { phase: Tennis3dPhase; open: Side | null } & EndFlags): TennisView`

- [ ] **Step 1: Write the failing `match.test.ts`.**

```ts
import { describe, expect, it } from "vitest";
import type { TennisReturn } from "../referee";
import {
  courtOf,
  decidePoint,
  MATCH_START,
  matchOver,
  playPoint,
  scoreOf,
  serveKmh,
  unlockedOf,
  windowMs,
  yashPoints,
  yourPoints,
  type MatchState,
} from "./match";

const ace: TennisReturn = { q: "miss", call: "ace" };
const early: TennisReturn = { q: "miss", call: "early" };
const wrong: TennisReturn = { q: "miss", call: "wrong" };
const clean: TennisReturn = { q: "perfect", call: "clean" };
const good: TennisReturn = { q: "good", call: "returned" };

const play = (points: TennisReturn[][]): MatchState =>
  points.reduce((s, inputs) => playPoint(s, inputs), MATCH_START);

describe("one point (spec §3.2)", () => {
  it("ends within 4 shots, with the call for how it ended", () => {
    const s = MATCH_START;
    expect(decidePoint(s, [ace])).toMatchObject({ winner: "yash", call: "ace", shots: 1 });
    expect(decidePoint(s, [early])).toMatchObject({ winner: "yash", call: "early", shots: 1 });
    expect(decidePoint(s, [wrong])).toMatchObject({ winner: "yash", call: "wrong", shots: 3 });
    expect(decidePoint(s, [good, ace])).toMatchObject({ winner: "yash", call: "late", shots: 3 });
    expect(decidePoint(s, [good, early])).toMatchObject({ winner: "yash", call: "early", shots: 3 });
    expect(decidePoint(s, [good, wrong])).toMatchObject({ winner: "yash", call: "wrong", shots: 4 });
    expect(decidePoint(s, [clean, good])).toMatchObject({ winner: "you", call: "winner", shots: 4 });
  });
  it("needs your second shot after a good return", () => {
    expect(() => decidePoint(MATCH_START, [good])).toThrow();
  });
  it("once you have 30, your best shot is OUT", () => {
    const at30 = play([[clean, clean], [good, good]]);
    expect(yourPoints(at30)).toBe(2);
    expect(decidePoint(at30, [clean, clean])).toMatchObject({ winner: "yash", call: "out", shots: 4 });
  });
});

describe("the game (spec §3.3)", () => {
  it("no input at all: four aces, 40–0, GAME", () => {
    const s = play([[ace], [ace], [ace], [ace]]);
    expect(matchOver(s)).toBe(true);
    expect(scoreOf(s)).toEqual(["40", "0"]);
    expect(s.points.map((p) => p.call)).toEqual(["ace", "ace", "ace", "ace"]);
  });
  it("perfect play: you win two points, then four OUTs: 40–30, GAME", () => {
    const s = play(Array.from({ length: 6 }, () => [clean, clean]));
    expect(s.points.map((p) => p.call)).toEqual(["winner", "winner", "out", "out", "out", "out"]);
    expect(matchOver(s)).toBe(true);
    expect(scoreOf(s)).toEqual(["40", "30"]);
  });
  it("Yash always wins and you never pass 30, whatever is played", () => {
    const options = [[ace], [early], [wrong], [good, ace], [good, wrong], [clean, good], [good, clean]];
    let seed = 7;
    const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
    for (let game = 0; game < 300; game++) {
      let s = MATCH_START;
      while (!matchOver(s)) s = playPoint(s, options[Math.floor(rand() * options.length)]!);
      expect(yashPoints(s)).toBe(4);
      expect(yourPoints(s)).toBeLessThanOrEqual(2);
      for (const p of s.points) expect(p.shots).toBeLessThanOrEqual(4);
    }
  });
  it("a finished game takes no more points", () => {
    const s = play([[ace], [ace], [ace], [ace]]);
    expect(playPoint(s, [clean, clean])).toBe(s);
  });
  it("Yash's points unlock the projects at 15, 30 and 40", () => {
    expect(unlockedOf(play([[clean, clean]]))).toBe(0);
    expect(unlockedOf(play([[ace]]))).toBe(1);
    expect(unlockedOf(play([[ace], [ace], [ace]]))).toBe(3);
    expect(unlockedOf(play([[ace], [ace], [ace], [ace]]))).toBe(3);
  });
  it("serves from the deuce court on even points and the ad court on odd ones", () => {
    expect(courtOf(MATCH_START)).toBe("deuce");
    expect(courtOf(play([[ace]]))).toBe("ad");
  });
  it("the windows shrink and the serve speeds up as Yash's score rises; the column gets 25% longer", () => {
    expect(windowMs("serve", MATCH_START, "stage")).toBe(1000);
    expect(windowMs("rally", MATCH_START, "stage")).toBe(1100);
    const at40 = play([[ace], [ace], [ace]]);
    expect(windowMs("serve", at40, "stage")).toBe(700);
    expect(windowMs("rally", at40, "column")).toBe(1000);
    expect(serveKmh(MATCH_START)).toBe(178);
    expect(serveKmh(at40)).toBe(196);
  });
});
```

- [ ] **Step 2: Run it, see it fail, then implement `match.ts`.**

```ts
import type { GameLayout } from "../../engine/types";
import {
  returnQuality,
  TOUCH_STRETCH,
  type ReturnPick,
  type Side,
  type TennisReturn,
} from "../referee";

/** T2: the most points you can win (you reach 30 at most). */
export const YOUR_CAP = 2;
/** Yash wins the game on his fourth point (15, 30, 40, GAME). */
export const GAME_AT = 4;
export const POINT_NAMES = ["0", "15", "30", "40"] as const;
/** §3.3: each window (ms), by Yash's points before the point (0, 15, 30, 40). */
export const WINDOW_MS = { serve: [1000, 900, 800, 700], rally: [1100, 1000, 900, 800] } as const;
export const SERVE_KMH_3D = [178, 184, 190, 196] as const;
/** The call holds this long before the next point's routine; the first point waits `firstMs` after the 3D shows. */
export const TENNIS_3D_BEATS = { callMs: 1800, firstMs: 1500 } as const;

/** Which of Yash's hits a window follows. */
export type Hit = keyof typeof WINDOW_MS;
/** How a point ended (§3.2). */
export type PointCall = "ace" | "early" | "wrong" | "late" | "winner" | "out";
export type Court = "deuce" | "ad";
export interface Point {
  winner: "yash" | "you";
  call: PointCall;
  /** Shots played, the serve included: 1, 3 or 4 (T3). */
  shots: 1 | 3 | 4;
  /** Your inputs in this point (1 or 2), as judged. */
  inputs: TennisReturn[];
}
export interface MatchState {
  points: Point[];
}
export const MATCH_START: MatchState = { points: [] };

export const yashPoints = (s: MatchState) => s.points.filter((p) => p.winner === "yash").length;
export const yourPoints = (s: MatchState) => s.points.filter((p) => p.winner === "you").length;
export const matchOver = (s: MatchState) => yashPoints(s) >= GAME_AT;
const step = (s: MatchState) => Math.min(yashPoints(s), GAME_AT - 1);

/** The window for an input (ms): it shrinks as Yash's score rises; the column (touch) gets 25 % longer. */
export const windowMs = (hit: Hit, s: MatchState, layout: GameLayout) =>
  WINDOW_MS[hit][step(s)]! * (layout === "column" ? TOUCH_STRETCH : 1);
export const serveKmh = (s: MatchState) => SERVE_KMH_3D[step(s)]!;
/** One pick, judged exactly as the 2D game judges a return (right side, in time, the first 40 % perfect). */
export const judge = (pick: ReturnPick, open: Side, window: number): TennisReturn =>
  returnQuality(pick, open, window);

/** How the point ends, from your inputs: a miss ends it at once; two good shots win it, unless you already have 30. */
export function decidePoint(s: MatchState, inputs: readonly TennisReturn[]): Point {
  const [first, second] = inputs;
  if (!first) throw new Error("a point needs your return");
  const missed = (r: TennisReturn, n: 1 | 2): Point => {
    const call: PointCall =
      r.call === "ace" ? (n === 1 ? "ace" : "late") : r.call === "early" ? "early" : "wrong";
    const shots = n === 1 ? (call === "wrong" ? 3 : 1) : call === "wrong" ? 4 : 3;
    return { winner: "yash", call, shots, inputs: [...inputs] };
  };
  if (first.q === "miss") return missed(first, 1);
  if (!second) throw new Error("a good return needs your second shot");
  if (second.q === "miss") return missed(second, 2);
  return yourPoints(s) < YOUR_CAP
    ? { winner: "you", call: "winner", shots: 4, inputs: [...inputs] }
    : { winner: "yash", call: "out", shots: 4, inputs: [...inputs] };
}

export const playPoint = (s: MatchState, inputs: readonly TennisReturn[]): MatchState =>
  matchOver(s) ? s : { points: [...s.points, decidePoint(s, inputs)] };
/** YASH first, as the bug reads: "40", "30". Yash's GAME shows as 40 with the status GAME YASH. */
export const scoreOf = (s: MatchState): [string, string] => [
  POINT_NAMES[step(s)]!,
  POINT_NAMES[Math.min(yourPoints(s), POINT_NAMES.length - 1)]!,
];
/** How many projects are on the big screen: one per Yash point, three at most (T5). */
export const unlockedOf = (s: MatchState) => Math.min(yashPoints(s), 3);
export const allInputs = (s: MatchState) => s.points.flatMap((p) => p.inputs);
/** Even points from the deuce court (Yash's right), odd from the ad court. */
export const courtOf = (s: MatchState): Court => (s.points.length % 2 === 0 ? "deuce" : "ad");
```

  Note `scoreOf`: Yash's `step` caps at 3 ("40"), so a finished game reads 40–x with the status GAME YASH. Run the test. Expected: PASS.

- [ ] **Step 3: Copy.** In `ui-copy.ts`:
  - `games.tennis` gains:

    ```ts
    three: {
      loading: "PREPARING THE COURT",
      how: "Pick the open side as he hits.",
      progress: "HIS POINTS UNLOCK THE HIGHLIGHTS",
      point: "POINT",
      gamePoint: "GAME POINT",
      calls: { late: "TOO LATE.", winner: "WINNER.", out: "OUT." },
      comm: {
        yourPoint: "Your point. He'll remember that.",
        out: "Hawk-Eye says out. By a whisker.",
        gamePoint: "Game point. He's done this before.",
        game: "Game, Yash. Still undefeated.",
      },
    }, // derived (Phase 8)
    ```

  - The Hub's tennis venue: `duration: "~40s"` (derived, Phase 8).
  - The blurb becomes "Return my serve. Every point I win puts a project on the big screen." (derived, Phase 8).
  - Add every new line to `docs/launch/copy-review.md` under a "Phase 8 tennis (derived)" heading.

- [ ] **Step 4: Write the failing `view.test.ts` cases for `buildTennis3dView`.** Add a `describe("buildTennis3dView")` using the existing fixture content (`tennis.fixture.ts` / the test's own content) with:
  1. **Before any point:**
     - the bug reads `0` / `0` and status `POINT 1`
     - `cards` is empty and `call` is null
     - `serving` ends in `178 KM/H`
     - with `open: "left"` in phase `window`, the left aim is `open: true` and its `name` ends with `open court`
  2. **After `[ace]`:**
     - the bug reads `15` / `0`
     - one card (QF)
     - in phase `called`, `call.text` is `ACE.`, tone `floodlight`, and `comm` is `ui.games.tennis.comm.missed`
  3. **After `[clean, clean]`:**
     - the bug reads `0` / `15`, with no card
     - in phase `called`, `call.text` is `WINNER.`, tone `volt`, and `comm` is `three.comm.yourPoint`
  4. **After three Yash points:** status `GAME POINT`, three cards, marquee `ALL THREE ON THE BIG SCREEN`.
  5. **After four aces:**
     - status `GAME YASH`, `saved` `GAME YASH`
     - `end` not null in phase `end`
     - `comm` is `three.comm.game`
  6. **After `[clean, clean], [good, good]`, then an OUT point** (Yash 15, you 30): `call.text` `OUT.`, `comm` is `three.comm.out`.

- [ ] **Step 5: Implement `buildTennis3dView`.** In `view.ts`, extract from `buildTennisView` the pieces both builders use:
  - the card list for the first `n` highlights: `highlightCards(content, ui, n, tagFor(i))`
  - the aim builder for an open side: `aimsFor(ui, open)`
  - the marquee for `n` unlocked: `marqueeFor(ui, highlights, n, matchPoint: boolean)`

  `buildTennisView` keeps exactly its output (its tests stay green unchanged). Then:

  - `buildTennis3dView` returns a `TennisView`:
    - `chrome`, `heading`, `instructions` (with `how: three.how`) and `end` / `saved` as `buildTennisView` builds them
    - `bug`:
      - `yash` / `you` from `scoreOf`
      - `status`: `GAME YASH` when over, `GAME POINT` at Yash 40, else `POINT n` (n = points played + 1)
      - `statusPhone` is the same
    - `serving`: `YASH · SERVING · <serveKmh> KM/H`
    - `returned`: the number of points played (the call's key)
    - `aims`: `aimsFor(ui, at.phase === "window" ? at.open : null)`
    - `cards`: `highlightCards(…, unlockedOf(state), …)`, tag `POINT <k>`, where k is the point that unlocked it
    - `latest`: the newest card
    - `progress`: `three.progress`, with bars by `unlockedOf`
    - `marquee`: `marqueeFor(…, unlockedOf(state), false)`
    - `call` (in `called` / `verdict` / `end`):
      - the text comes from `ui.games.tennis.calls` for `ace` / `early` / `wrong`, and from `three.calls` for `late` / `winner` / `out`
      - the tone is `volt` for `winner`, else `floodlight`
    - `comm`, first match wins:
      1. the entrance line before any point
      2. `three.comm.game` when over
      3. `three.comm.out`
      4. `three.comm.yourPoint` for your point
      5. `three.comm.gamePoint` when Yash has just reached 40
      6. `ui.games.tennis.comm.missed` for `ace`
      7. otherwise `ui.games.tennis.comm.shipped`
    - `announce`: `announceWith("<call> <yash>–<you>." + (an unlock: " Highlight 0n unlocked: <title>, <line>"), over ? "Game yash" : null)`

  Run `NODE_OPTIONS= pnpm exec vitest run src/features/games/tennis`. Expected: PASS (old and new).

- [ ] **Step 6: Commit.** `feat(tennis): the 3D game's rules (real points, the 30 cap, four shots at most) and its view (Phase 8 tennis T3)`

---

### Task 4: The court and the ball's flight (pure)

**Files:**
- Create: `src/features/games/tennis/3d/court.ts`, `src/features/games/tennis/3d/ball.ts`, `src/features/games/tennis/3d/ball.test.ts`

**Interfaces:**
- Produces:
  - `court.ts`:
    - types: `Vec3` (re-exported from `three/track`), `ActorId = "yash" | "you"`, `CameraPose`
    - constants: `ACTORS`, `COURT`, `GRAVITY`, `BALL_RADIUS`, `FACE`, `SERVE_SPOT`, `RECEIVE_SPOT`, `BOX`, `YASH_BASE`, `YOUR_BASE`, `CAMERA`
    - functions: `sideSign(side)`, `netHeightAt(x)`, `toWorld(spot, face, offset)`, `feetFor(contact, face, offset)`
  - `ball.ts`:
    - constants: `KH`, `BOUNCE_ON`, `SPIN`, `NET_CLEAR`, `RUN_ON_S`, `FENCE`
    - `BallPath`
    - functions: `shotTo(from, to, bounceZ, flight, spin)`, `toBounce(from, at, flight, spin)`, `intoNet(from, at, flight)`

- [ ] **Step 1: `court.ts`.**

```ts
import type { Side } from "../referee";
import type { Vec3 } from "../../three/track";

export type { Vec3 };
export type ActorId = "yash" | "you";
export const ACTORS: readonly ActorId[] = ["yash", "you"];
export interface CameraPose {
  position: Vec3;
  target: Vec3;
}

/**
 * ITF sizes (m), each to the outside of its line. y is up; z runs from Yash's baseline (−) through the net (0) to yours
 * (+); x is your right as the camera sees it (the camera is behind you, looking down the court).
 */
export const COURT = {
  half: 11.885,
  singles: 4.115,
  doubles: 5.485,
  service: 6.4,
  line: 0.05,
  net: { centre: 0.914, post: 1.07, postX: 6.4 },
  /** From the baseline to the back fence, and from the doubles line to the side fence. */
  runoff: { back: 6.4, side: 3.66 },
} as const;
export const GRAVITY = 9.81;
export const BALL_RADIUS = 0.033;
/** Headings (radians, 0 faces +z): Yash faces you, you face him. */
export const FACE: Record<ActorId, number> = { yash: 0, you: Math.PI };
/** +1 for your right, −1 for your left. */
export const sideSign = (side: Side) => (side === "right" ? 1 : -1);
/** The tape's height at `x` (m): 0.914 in the middle, rising to 1.07 at the posts. */
export const netHeightAt = (x: number) =>
  COURT.net.centre + (COURT.net.post - COURT.net.centre) * Math.min(1, Math.abs(x) / COURT.net.postX);

/** Where Yash stands to serve: right of the centre mark (his right is −x) on the deuce court, left on the ad court. */
export const SERVE_SPOT = { deuce: [-0.9, 0, -12.2], ad: [0.9, 0, -12.2] } as const satisfies Record<string, Vec3>;
/** Where you wait for the serve: the deuce box is on your right. */
export const RECEIVE_SPOT = { deuce: [2.4, 0, 13.4], ad: [-2.4, 0, 13.4] } as const satisfies Record<string, Vec3>;
/** The service box each serve must land in (x and z ranges, to the outside of the lines). */
export const BOX = {
  deuce: { x: [0, COURT.singles], z: [0, COURT.service] },
  ad: { x: [-COURT.singles, 0], z: [0, COURT.service] },
} as const;
/** Where each player recovers to between shots: this deep, this far to the side he covers. */
export const YASH_BASE = { z: -12.6, cover: 1.5 } as const;
export const YOUR_BASE = { z: 13.2, cover: 0.6 } as const;

/** A point in the body's frame (x its left, y up, z its front) from a player standing at `spot` facing `face`, in the world. */
export function toWorld(spot: Vec3, face: number, offset: Vec3): Vec3 {
  const c = Math.cos(face);
  const s = Math.sin(face);
  return [spot[0] + offset[0] * c + offset[2] * s, spot[1] + offset[1], spot[2] - offset[0] * s + offset[2] * c];
}
/** Where a player facing `face` must stand so that `offset` (his racket's sweet spot) is at `contact`. */
export function feetFor(contact: Vec3, face: number, offset: Vec3): Vec3 {
  const at = toWorld([0, 0, 0], face, offset);
  return [contact[0] - at[0], 0, contact[2] - at[2]];
}

/**
 * The broadcast view: high behind your baseline, down the court. The column frames the same view a little higher
 * (`tilt`, degrees down), clear of the thumb zone. `pan` is how much of the ball's recent x the target follows. `game`
 * is where the camera has pushed in to at GAME. Tuned by eye in Task 8.
 */
export const CAMERA = {
  tv: { position: [0, 7.6, 25.5], target: [0, 0.6, -3] } as CameraPose,
  fov: { stage: 30, column: 44 },
  tilt: { stage: 0, column: 4 },
  pan: 0.25,
  game: { position: [0, 4.2, 6], target: [0, 1.2, -12] } as CameraPose,
} as const;
```

- [ ] **Step 2: Write the failing `ball.test.ts`.**

```ts
import { describe, expect, it } from "vitest";
import { BALL_RADIUS, netHeightAt, type Vec3 } from "./court";
import { FENCE, intoNet, KH, NET_CLEAR, shotTo, SPIN, toBounce, type BallPath } from "./ball";

const close = (a: Vec3, b: Vec3, d = 1e-6) => a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, -Math.log10(d)));
/** The centre's height over the tape as it crosses the net. */
function clearance(path: BallPath) {
  for (let t = 0; t < path.reach; t += 0.001) {
    const [x, y, z] = path.at(t);
    const [, , z2] = path.at(t + 0.001);
    if (Math.sign(z) !== Math.sign(z2)) return y - netHeightAt(x);
  }
  return null;
}

describe("shotTo: the ball reaches the racket exactly", () => {
  // A serve from the deuce court (racket at 2.7 m) and a rally ball, at the slowest and fastest flights the game uses.
  const cases: { name: string; from: Vec3; to: Vec3; bounceZ: number; flights: number[]; spin: number }[] = [
    { name: "serve", from: [-1.15, 2.7, -11.75], to: [2.6, 0.95, 14.2], bounceZ: 5.5, flights: [0.9, 1.45], spin: SPIN.serve },
    { name: "rally", from: [3.0, 0.95, -13.4], to: [-2.4, 0.95, 13.6], bounceZ: 9.0, flights: [1.0, 1.575], spin: SPIN.rally },
  ];
  for (const c of cases)
    for (const flight of c.flights)
      it(`${c.name} in ${flight} s: at the contact on time, one bounce first, over the net, a real bounce`, () => {
        const path = shotTo(c.from, c.to, c.bounceZ, flight, c.spin);
        close(path.at(flight), c.to);
        expect(path.reach).toBe(flight);
        expect(path.bounces[0]!).toBeLessThan(flight);
        expect(path.bounces[1] ?? Infinity).toBeGreaterThan(flight);
        expect(path.bounce![2]).toBeCloseTo(c.bounceZ, 6);
        expect(path.bounce![1]).toBeCloseTo(BALL_RADIUS, 6);
        expect(clearance(path)!).toBeGreaterThanOrEqual(NET_CLEAR);
        expect(path.kv).toBeGreaterThan(0.5);
        expect(path.kv).toBeLessThan(0.9);
      });
  it("the post-bounce run keeps KH of the speed along the court", () => {
    const p = shotTo(cases[1]!.from, cases[1]!.to, 9, 1.2, SPIN.rally);
    const t = p.bounces[0]!;
    const before = (p.at(t)[2] - p.at(t - 0.01)[2]) / 0.01;
    const after = (p.at(t + 0.01)[2] - p.at(t)[2]) / 0.01;
    expect(after / before).toBeCloseTo(KH, 2);
  });
});

describe("toBounce and intoNet", () => {
  it("lands exactly where and when it is told, then runs on and never passes the fence", () => {
    const p = toBounce([2.4, 0.95, 13.6], [4.115 + BALL_RADIUS + 0.04, -8.6], 0.8, SPIN.rally);
    close(p.at(0.8), [4.115 + BALL_RADIUS + 0.04, BALL_RADIUS, -8.6]);
    expect(p.bounces[0]).toBeCloseTo(0.8, 6);
    expect(p.bounces.length).toBeGreaterThan(1);
    for (let t = 0; t <= p.end; t += 0.01) {
      const [x, y, z] = p.at(t);
      expect(Math.abs(z)).toBeLessThanOrEqual(FENCE.z + 1e-6);
      expect(Math.abs(x)).toBeLessThanOrEqual(FENCE.x + 1e-6);
      expect(y).toBeGreaterThanOrEqual(BALL_RADIUS - 1e-6);
    }
  });
  it("into the net: meets it at the height asked, then drops on the hitter's side and comes to rest", () => {
    const p = intoNet([-1.5, 0.95, 13.2], [1.2, 0.55], 0.45);
    close(p.at(0.45), [1.2, 0.55, 0]);
    for (let t = 0.46; t <= p.end; t += 0.01) expect(p.at(t)[2]).toBeGreaterThan(0);
    const [, y] = p.at(p.end);
    expect(y).toBeCloseTo(BALL_RADIUS, 3);
  });
  it("moves smoothly: no jump over 0.5 m between frames 1/120 s apart", () => {
    const p = shotTo([3.0, 0.95, -13.4], [-2.4, 0.95, 13.6], 9.0, 1.2, SPIN.rally);
    for (let t = 0; t < p.end; t += 1 / 120) {
      const a = p.at(t);
      const b = p.at(t + 1 / 120);
      expect(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])).toBeLessThan(0.5);
    }
  });
});
```

- [ ] **Step 3: Run it, see it fail, then implement `ball.ts`.** This is the closed-form solution the plan's numbers were checked against: every serve and rally flight the game uses lands in, clears the net, and bounces with a vertical keep of 0.5–0.9.

```ts
import { BALL_RADIUS, COURT, GRAVITY, netHeightAt, type Vec3 } from "./court";

/** What the hard court keeps of the ball's speed along it at a bounce (the up-speed is solved per shot: `kv`). */
export const KH = 0.62;
/** The up-speed kept at the bounces after the first (a ball running on after the point). */
export const BOUNCE_ON = 0.7;
/** Extra downward pull (m/s²): topspin on rally shots; serves fly flat. */
export const SPIN = { serve: 0, rally: 4 } as const;
/** Every ball over the net clears the tape by at least this (m). */
export const NET_CLEAR = 0.15;
/** How long a ball runs on after its contact or its bounce (s); it is hidden when the point ends. */
export const RUN_ON_S = 1.6;
/** The fences: a ball that reaches one stops going along and drops. */
export const FENCE = { z: COURT.half + COURT.runoff.back, x: COURT.doubles + COURT.runoff.side } as const;

export interface BallPath {
  /** When it reaches its target (s from the hit): the racket, its bounce, or the net. */
  readonly reach: number;
  /** When it has run on long enough for the point to be called (s). */
  readonly end: number;
  /** Where the ball's centre is `t` s after the hit (clamped to [0, end]). */
  at(t: number): Vec3;
  /** Every time it meets the court (s from the hit). */
  readonly bounces: readonly number[];
  /** Where it first meets the court, or null (into the net before any bounce). */
  readonly bounce: Vec3 | null;
  /** The up-speed kept at its first bounce: 0.5–0.9 looks like a real hard court. */
  readonly kv: number;
}

interface Arc {
  t0: number;
  p: Vec3;
  v: Vec3;
  g: number;
}
const floor = BALL_RADIUS;
const along = (a: Arc, t: number): Vec3 => {
  const d = t - a.t0;
  return [a.p[0] + a.v[0] * d, a.p[1] + a.v[1] * d - (a.g * d * d) / 2, a.p[2] + a.v[2] * d];
};
const toFence = (pos: number, vel: number, limit: number) =>
  vel === 0 ? Infinity : (Math.sign(vel) * limit - pos) / vel;

/** The ball after `start`: bouncing on the court (keeping BOUNCE_ON up, KH along), dropping at a fence, then at rest. */
function runOn(start: Arc, until: number): { arcs: Arc[]; bounces: number[] } {
  const arcs: Arc[] = [];
  const bounces: number[] = [];
  let arc = start;
  for (let k = 0; k < 16 && arc.t0 < until; k++) {
    arcs.push(arc);
    if (arc.g === 0) break;
    const vy = arc.v[1];
    const down = (vy + Math.sqrt(vy * vy + 2 * arc.g * (arc.p[1] - floor))) / arc.g;
    const fence = Math.min(toFence(arc.p[2], arc.v[2], FENCE.z), toFence(arc.p[0], arc.v[0], FENCE.x));
    if (fence > 1e-9 && fence < down) {
      arc = { t0: arc.t0 + fence, p: along(arc, arc.t0 + fence), v: [0, vy - arc.g * fence, 0], g: arc.g };
      continue;
    }
    const at = arc.t0 + down;
    const p = along(arc, at);
    bounces.push(at);
    const up = -BOUNCE_ON * (vy - arc.g * down);
    arc =
      up < 0.5
        ? { t0: at, p: [p[0], floor, p[2]], v: [0, 0, 0], g: 0 }
        : { t0: at, p: [p[0], floor, p[2]], v: [arc.v[0] * KH, up, arc.v[2] * KH], g: arc.g };
  }
  return { arcs, bounces };
}

function pathOf(arcs: Arc[], bounces: number[], reach: number, end: number, kv: number): BallPath {
  return {
    reach,
    end,
    bounces,
    kv,
    bounce: bounces.length > 0 ? pointAt(arcs, bounces[0]!) : null,
    at: (t) => pointAt(arcs, Math.min(Math.max(t, 0), end)),
  };
}
function pointAt(arcs: Arc[], t: number): Vec3 {
  let a = arcs[0]!;
  for (const arc of arcs) if (arc.t0 <= t) a = arc;
  return along(a, t);
}

/**
 * A ball from `from` (a racket at contact) to `to` (the next racket at contact), arriving in exactly `flight` s, with
 * one bounce on the way at depth `bounceZ` on the straight line between them (balls fly straight, seen from above).
 * The times before and after the bounce follow from the distances (the court keeps KH of the speed along it); the
 * up-speed the bounce keeps (`kv`) is what puts the ball at the racket's height on time. The ball runs on past `to`
 * for RUN_ON_S (a miss).
 */
export function shotTo(from: Vec3, to: Vec3, bounceZ: number, flight: number, spin: number): BallPath & { kv: number } {
  const g = GRAVITY + spin;
  const f = (bounceZ - from[2]) / (to[2] - from[2]);
  const bounce: Vec3 = [from[0] + (to[0] - from[0]) * f, floor, bounceZ];
  const d1 = Math.hypot(bounce[0] - from[0], bounce[2] - from[2]);
  const d2 = Math.hypot(to[0] - bounce[0], to[2] - bounce[2]);
  const t1 = flight / (1 + d2 / (KH * d1));
  const t2 = flight - t1;
  const v: Vec3 = [(bounce[0] - from[0]) / t1, (floor - from[1] + (g * t1 * t1) / 2) / t1, (bounce[2] - from[2]) / t1];
  const down = v[1] - g * t1;
  const up = (to[1] - floor + (g * t2 * t2) / 2) / t2;
  const first: Arc = { t0: 0, p: from, v, g };
  const after = runOn({ t0: t1, p: bounce, v: [v[0] * KH, up, v[2] * KH], g }, flight + RUN_ON_S);
  return pathOf([first, ...after.arcs], [t1, ...after.bounces], flight, flight + RUN_ON_S, up / -down);
}

/** A ball that lands exactly at `at` (x, z) after `flight` s, then runs on: a winner, an OUT, or Yash's put-away. */
export function toBounce(from: Vec3, at: readonly [number, number], flight: number, spin: number): BallPath {
  const g = GRAVITY + spin;
  const v: Vec3 = [(at[0] - from[0]) / flight, (floor - from[1] + (g * flight * flight) / 2) / flight, (at[1] - from[2]) / flight];
  const first: Arc = { t0: 0, p: from, v, g };
  const down = v[1] - g * flight;
  const after = runOn({ t0: flight, p: [at[0], floor, at[1]], v: [v[0] * KH, -BOUNCE_ON * down, v[2] * KH], g }, flight + RUN_ON_S);
  return pathOf([first, ...after.arcs], [flight, ...after.bounces], flight, flight + RUN_ON_S, BOUNCE_ON);
}

/** A ball into the net: it meets the net at `at` (x, height) after `flight` s, then drops on the hitter's side. */
export function intoNet(from: Vec3, at: readonly [number, number], flight: number): BallPath {
  const g = GRAVITY + SPIN.rally;
  const v: Vec3 = [(at[0] - from[0]) / flight, (at[1] - from[1] + (g * flight * flight) / 2) / flight, -from[2] / flight];
  const first: Arc = { t0: 0, p: from, v, g };
  const back = Math.sign(from[2]);
  const drop = runOn({ t0: flight, p: [at[0], at[1], 0.04 * back], v: [0, Math.min(0, v[1] - g * flight) * 0.2, 0.6 * back], g }, flight + RUN_ON_S);
  return pathOf([first, ...drop.arcs], drop.bounces, flight, flight + RUN_ON_S, BOUNCE_ON);
}
```

  The net-crossing check in the test uses `netHeightAt`, so `ball.ts` needs no net code of its own. The planner (Task 6) only asks for shots the test cases cover.

- [ ] **Step 4: Run the test.** Expected: PASS. If a case fails, fix the maths, not the numbers in the test (the numbers were checked).

- [ ] **Step 5: Commit.** `feat(tennis): the court in metres and the ball's flight, solved to meet each racket on time (Phase 8 tennis T4)`

---

### Task 5: The moves, the racket and the reach (Opus builder, high effort)

The heart of the owner's ask: **every shot looks smooth and clean, like a real match** (spec §5). This is a visual task, tuned by looking. The controller reviews screenshots before the task is accepted.

**Files:**
- Create:
  - `src/features/games/tennis/3d/timing.ts`
  - `src/features/games/tennis/3d/moves.ts`
  - `src/features/games/tennis/3d/props.ts`
  - `src/features/games/tennis/3d/reach.ts`
  - `src/features/games/tennis/3d/PoseLab.stories.tsx`
- Modify: `src/features/games/three/athlete.ts` (`CLIP_PACE`)

**Interfaces:**
- Consumes:
  - `poseClip`, `PoseKey` (smooth)
  - `BONES`, `LIBRARY_CLIPS`
  - `makeAthlete`, `applyClips`, `restPose`
  - `loadAthleteFiles`, `prepareAthlete` (Task 2)
  - `Kit.shorts` (Task 2)
- Produces:
  - `timing.ts` (pure):

```ts
/** Yash's serve routine: bounces before the serve, each this long (s); fewer on the first point. */
export const ROUTINE = { bounces: 3, first: 2, period: 0.55 } as const;
/** The serve clip: the toss leaves his left hand at `toss`, the racket meets the ball at `contact`, done at `end` (s). */
export const SERVE_CLIP = { toss: 0.3, contact: 1.05, end: 1.9 } as const;
/** A ground stroke: the forward swing starts at `commit`, meets the ball at `contact`, done at `end` (s). */
export const STROKE_CLIP = { commit: 0.4, contact: 0.6, end: 1.3 } as const;
/** Your window closes when the forward swing must start: this long before contact (spec §3.3). */
export const SWING_LEAD = STROKE_CLIP.contact - STROKE_CLIP.commit;
/** A missed swing meets the ball's place this long after it went by (late), or before it came (early). */
export const MISS = { late: 0.25, early: 0.3 } as const;
/** The stretch (beaten): the racket is at full reach this far into the clip. */
export const STRETCH_CLIP = { reach: 0.35, end: 1.1 } as const;
/** The split-step when the other player hits, and the side shuffle's ground speed at clip speed 1 (m/s). */
export const SPLIT_CLIP = { end: 0.3 } as const;
export const SHUFFLE_PACE = 1.8;
/** The fist pump at GAME. */
export const FIST_PUMP_CLIP = { end: 1.4 } as const;
export type TennisClip =
  | "idle" | "walk" | "jog" | "sprint" | "crouch"
  | "ready" | "split" | "shuffleL" | "shuffleR" | "bounceBall" | "serve"
  | "forehand" | "backhand" | "stretchF" | "stretchB" | "fistPump";
export type Stroke = "forehand" | "backhand";
```

  - `moves.ts`:
    - `MOVE_KEYS: Record<MadeClip, readonly PoseKey<BoneKey>[]>`
    - `buildTennisClips(rest, moves): AnimationClip[]`, with the same shape as cricket's `buildCricketClips`
  - `props.ts`:
    - `TennisPropColors { volt: Color; dark: Color; light: Color }`
    - `makeTennisProps(colors: TennisPropColors)`, with `.racket(a, throat: "volt" | "light")` returning the sweet-spot `Object3D`, `.headband(a)`, `.wristband(a)` and `.dispose()`
    - `RACKET` sizes
  - `reach.ts`:
    - `Reach { serve: Vec3; forehand: Vec3; backhand: Vec3; toss: Vec3; bounce: Vec3 }`, every value in the body's frame from the feet
    - `measureReach(assets, clips): Reach`
  - `athlete.ts`: `CLIP_PACE: { walk: number; jog: number; sprint: number }`, the ground speed (m/s) of each free run clip at speed 1, measured

- [ ] **Step 1: `timing.ts`.** Exactly as above.

- [ ] **Step 2: The racket and bands (`props.ts`).** Code-built, sizes in metres, parented to bones as cricket's `props.ts` does (divide by the bone's world scale):
  - **Racket (0.685 m long):**
    - a grip and throat (cylinders along the hand's grip axis) through the right fist
    - an oval head frame (a flattened `TorusGeometry`, about 0.29 × 0.24 m)
    - a string bed (a thin oval plane, light, `opacity` 0.35, `depthWrite: false`)
    - an empty `Object3D` named `sweetSpot` at the centre of the string bed, returned by `.racket(a)`
    - frame colour `--ref-stand-hi` (dark) with a volt throat for Yash, light for you
  - **Bands:** a volt headband on Yash, and a volt wristband on his right wrist.
  - Set `castShadow` on the racket.

- [ ] **Step 3: The key poses (`moves.ts`).** Every move the free pack lacks, as `PoseKey` lists (degrees from rest per bone, plus hips in metres in the body's frame), in cricket's `shots.ts` format. Read `src/features/games/cricket/3d/shots.ts` first: same rig, same axis conventions, and its comments say how the angles were worked out. **Every key moves the whole body**: feet, knees, hips turn, trunk rotation, both shoulders and arms, and the head looking at the ball. Both players are right-handed.

| Clip | Length | Keys (in order) |
|---|---|---|
| `ready` (loop) | 1.2 s | knees bent, weight forward on the balls of the feet, racket in front at waist height held by both hands, a small sway back and forth |
| `split` | 0.3 s | a small hop: up onto the toes, land wide with knees bent |
| `shuffleL` / `shuffleR` (loops) | 0.6 s | side steps facing the net: lead foot steps out, trail foot closes, never crossing; racket held in front |
| `bounceBall` (loop) | `ROUTINE.period` | at the baseline, side-on, left hand pushes the ball down at 0 and catches it at `ROUTINE.period`; knees give a little |
| `serve` | `SERVE_CLIP.end` | stance side-on; both arms drop together; the left arm lifts and releases the toss at `SERVE_CLIP.toss`; trophy position (knees bent, racket up behind the head, left arm pointing up); racket drop behind the back; up and through to full reach at `SERVE_CLIP.contact`; the follow-through across the body, landing on the left foot inside the baseline (hips move forward about 0.6 m); recover |
| `forehand` | `STROKE_CLIP.end` | ready, then unit turn (shoulders turn sideways, racket back); backswing loop at about `STROKE_CLIP.commit` (racket low behind); the forward swing low to high; contact in front of the front hip at `STROKE_CLIP.contact`, arm extended, head still; follow-through over the left shoulder; recover to ready |
| `backhand` (two-handed) | `STROKE_CLIP.end` | the same phases on the left side, both hands on the grip, shoulders turned the other way, contact in front of the right hip |
| `stretchF` / `stretchB` | `STRETCH_CLIP.end` | a long lunge to the forehand (right) / backhand (left) side, racket at full reach at `STRETCH_CLIP.reach`, the ball not met; recover |
| `fistPump` | `FIST_PUMP_CLIP.end` | racket hand down, left fist pumps twice at chest height, a small step |

  - `buildTennisClips(rest, moves)` builds them with `poseClip(name, keys, rest.bones, BONES, rest.hips, { smooth: true })`, plus the free clips renamed to our names (idle, walk, jog, sprint, crouch), exactly as `buildCricketClips` does.
  - **Timing:** the keys sit on the `timing.ts` beats, so contact always lines up. A held key holds.

- [ ] **Step 4: `CLIP_PACE`.** Measure the free run clips' ground speed with a throwaway script in the scratchpad: over one loop at speed 1, the planted foot's backward travel ÷ the time it is planted. Write `CLIP_PACE` in `athlete.ts` with a comment saying how it was measured.

- [ ] **Step 5: `reach.ts`.**

```ts
import { Color, Vector3, type AnimationClip } from "three";
import { applyClips, makeAthlete, type AthleteAssets } from "../../three/athlete";
import type { Vec3 } from "./court";
import { makeTennisProps } from "./props";
import { SERVE_CLIP, STROKE_CLIP } from "./timing";

/** Where each stroke's racket sweet spot is at contact, and Yash's left hand at the toss and the bounce: body frame, from the feet. */
export interface Reach {
  serve: Vec3;
  forehand: Vec3;
  backhand: Vec3;
  toss: Vec3;
  bounce: Vec3;
}

/**
 * Measured once, on the real body with the real clips: a throwaway athlete at the origin facing +z is posed at each beat
 * and the sweet spot (or the left hand) is read off. The rally script stands each player so this point is where the ball
 * is at contact, so the strings meet the ball exactly (spec §5.2 #3).
 */
export function measureReach(assets: AthleteAssets, clips: readonly AnimationClip[]): Reach {
  // Never drawn: any colours do.
  const grey = new Color();
  const props = makeTennisProps({ volt: grey, dark: grey, light: grey });
  const a = makeAthlete(assets, { shirt: grey, trousers: grey, shoes: grey, eyes: grey }, clips);
  const sweet = props.racket(a);
  const read = (clip: string, time: number, what: "sweet" | "handL"): Vec3 => {
    applyClips(a, [{ clip, time, weight: 1, loop: false }]);
    a.root.updateMatrixWorld(true);
    const p = (what === "sweet" ? sweet : a.bone("handL")).getWorldPosition(new Vector3());
    return [p.x, p.y, p.z];
  };
  const reach: Reach = {
    serve: read("serve", SERVE_CLIP.contact, "sweet"),
    forehand: read("forehand", STROKE_CLIP.contact, "sweet"),
    backhand: read("backhand", STROKE_CLIP.contact, "sweet"),
    toss: read("serve", SERVE_CLIP.toss, "handL"),
    bounce: read("bounceBall", 0, "handL"),
  };
  props.dispose();
  a.materials.forEach((m) => m.dispose());
  return reach;
}
```

- [ ] **Step 6: The Pose Lab story** (`Dev/Tennis Pose Lab`, dev only, like cricket's).
  - It loads the assets (`loadAthleteFiles` + `prepareAthlete(files, buildTennisClips)`), then draws in a `GameCanvas`:
    - a plain court floor (`--ref-court-hard`) with the baseline
    - one athlete in Yash's kit (shorts) with racket and bands, at the origin facing +z
  - `args`:
    - `clip`: every `TennisClip`
    - `t`: a range slider, 0 to the clip's length
    - `playing`: loops in real time
    - `view`: `front` / `side` / `back` / `tv`
    - `layout`: `stage` / `column`
  - At `forehand` / `backhand` / `serve` it draws a small volt sphere at the measured `Reach` point, so contact can be checked: at the contact time the sphere sits in the strings.
  - The story id starts with `dev-`, so the story a11y test skips it.

- [ ] **Step 7: Look at it, and iterate before reporting.**
  1. Save screenshots, with a throwaway Playwright script against Storybook on 4184, to `.superpowers/sdd/2026-10-16-phase-8-tennis-3d/shots/moves/`:
     - for `serve`, `forehand`, `backhand`: each key time, from the side and the front
     - `ready`, `split`, `shuffleL`, `stretchF`
     - `bounceBall` at 0 and half a period
  2. Tune until:
     - each stroke reads as that stroke to a tennis fan
     - nothing clips through the body
     - the feet stay planted where they should
     - the racket face looks square to the ball at contact
  3. Write in the report the measured `Reach` values and `CLIP_PACE`. The controller reviews the screenshots and may send poses back.

- [ ] **Step 8: Unit tests, typecheck, lint; commit.** `feat(tennis): the tennis moves from key poses (serve, forehand, two-handed backhand, footwork), the racket, and the measured reach (Phase 8 tennis T5)`

---

### Task 6: One point's script (pure)

**Files:**
- Create: `src/features/games/tennis/3d/rally.ts`, `rally.test.ts`

**Interfaces:**
- Consumes:
  - `match.ts` (Task 3)
  - `court.ts`, `ball.ts` (Task 4)
  - `timing.ts`, the `Reach` type (Task 5)
- Produces:

```ts
export interface PointSetup {
  court: Court;
  first: boolean;            // the game's first point (a shorter routine)
  capped: boolean;           // you already have 30: your best shot is OUT
  windows: { serve: number; rally: number }; // s, the layout applied (fixed for the point)
  open: [Side, Side];        // the open side at Yash's serve, and at his rally shot
  draws: number[];           // 6 numbers in [0, 1): placement variety
}
export interface Decision { r: TennisReturn; side: Side | null; at: number /* s from the point's start */ }
export interface Decided { first?: Decision; second?: Decision }
export interface Swing {
  by: ActorId;
  kind: "serve" | Stroke | "stretch";
  side?: Side;               // stretch only: which way (your view)
  contact: number;           // s from the point's start: when the racket is (or would be) at the ball's place
  spot: Vec3;                // feet at contact
  meets: boolean;
  miss?: "late" | "early";
}
export interface Flight { start: number; path: BallPath }
export interface Recover { by: ActorId; start: number; end: number; to: Vec3 }
export interface Window { opens: number; commits: number; open: Side }
export interface PointScript {
  setup: PointSetup;
  serveClipAt: number; tossAt: number; serveAt: number;
  windows: Window[];
  swings: Swing[];
  flights: Flight[];
  recovers: Recover[];
  /** Your contacts (your shots that meet the ball), for the hit sound and the phone's buzz. */
  contacts: number[];
  /** When the point's last ball is done and the call comes; null while an input is still to come. */
  end: number | null;
  /** The Hawk-Eye mark of an OUT ball, and when it lands. */
  mark: { at: Vec3; from: number } | null;
}
export function setupPoint(s: MatchState, layout: GameLayout, luck: Luck): PointSetup;
export function scriptPoint(setup: PointSetup, decided: Decided, reach: Reach): PointScript;
```

The constants live in `rally.ts`; they were checked against `ball.ts`'s maths:

```ts
/** The serve bounces this deep in the box. */
export const SERVE_BOUNCE_Z = 5.5;
/** Where you take the serve (|z|): deeper for a slower serve, so it never loops. */
export const serveDepth = (flight: number) => clamp(14.2 + (flight - 1.2) * 1.5, 13.6, 15.0);
/** Where you take Yash's rally ball, and where it bounces (|z|), by its flight. */
export const rallyDepth = (flight: number) => clamp(13.4 + (flight - 1.0) * 3, 13.4, 15.4);
export const rallyBounce = (flight: number) => clamp(9.0 - (flight - 1.0) * 2, 7.6, 9.4);
/** Your return's flight to Yash (s), and its bounce (|z|): a perfect one is quicker and deeper. */
export const RETURN = { good: { flight: 1.2, bounce: 9.0 }, perfect: { flight: 1.05, bounce: 9.6 } } as const;
/** Yash takes your return here (|z|). */
export const YASH_CONTACT_Z = 13.2;
/** Your last shot and Yash's put-away, to their bounce (s). */
export const FINAL = { good: 0.85, perfect: 0.75, yash: 0.8 } as const;
/** An OUT lands this far clear of the line (m, the ball's edge past the line's outside edge). */
export const OUT_BY = { min: 0.02, max: 0.05 } as const;
/** Into the net: how long it takes, and where it meets the net (height). */
export const NET_SHOT = { flight: 0.45, height: 0.55 } as const;
/** The call comes this long after the point's last ball. */
export const CALL_AFTER_S = 0.9;
/** A player recovers (side shuffle) from this long after his shot, taking this long. */
export const RECOVER = { after: 0.45, takes: 0.9 } as const;
```

- [ ] **Step 1: Write the failing `rally.test.ts`.**
  - Use a fixture `Reach` in the body's frame (the right side is −x), for example:
    - `serve [-0.25, 2.7, 0.45]`
    - `forehand [-0.85, 0.95, 0.55]`
    - `backhand [0.8, 0.9, 0.5]`
    - `toss [0.25, 1.55, 0.35]`
    - `bounce [0.15, 0.95, 0.4]`
  - Use `setup(...)` helpers that build `PointSetup`s directly (no luck), across both courts, both open sides, every draw at 0, 0.5 and 0.999, and every window the game can have (desktop and column, each Yash score).

  Cases:
  1. **The serve is good:**
     - the serve flight starts at `serveAt` from Yash's racket (`toWorld(SERVE_SPOT[court], FACE.yash, reach.serve)`)
     - its first bounce lies inside `BOX[court]` by at least 0.1 m
     - it is at your racket's place at `serveAt + windows.serve + SWING_LEAD`
  2. **Every contact is exact:** for each `Swing` that `meets`:
     - `toWorld(spot, FACE[by], reach[kind])` equals the ball's position (the flight in the air at that moment) at `contact`, within 1 mm
     - the swing's `kind` is the stroke whose spot is nearer where the player stood
  3. **No impossible run:** each player's distance between consecutive spots, divided by the time between them minus `STROKE_CLIP.end − STROKE_CLIP.contact`, stays under 7.5 m/s.
  4. **Shots per point match the rules:**
     - `scriptPoint` with each `Decided` gives flights (contacts + the serve) consistent with `decidePoint`'s `shots`: ace / early → 1, wrong (first) → 3, late / early (second) → 3, wrong (second) → 4, winner / out → 4
     - `end` is a number once decided, and null while pending
  5. **The windows:**
     - `windows[0]` opens at `serveAt` and commits `windows.serve` later, with `open` = `setup.open[0]`
     - after a good first input, `windows[1]` opens at Yash's rally contact
  6. **Your winner lands in, OUT lands out by `OUT_BY`:**
     - capped + two good inputs → the last flight's first bounce is beyond a line by `OUT_BY`, and `mark` sits there
     - not capped → inside the singles court on the picked side
  7. **A rebuild never changes the past:**
     - for a pending first input vs each resolution made at time `d.at`, every flight that starts before `d.at` is the same object data (same start, same `at(t)` for t < `d.at`)
     - every swing with `contact < d.at` is unchanged
     - the same holds for the second input

- [ ] **Step 2: Run it, see it fail, then implement `rally.ts`.** The algorithm (`scriptPoint`); all times are in s from the point's start:
  1. **The routine.**
     - `bounces = setup.first ? ROUTINE.first : ROUTINE.bounces`
     - `serveClipAt = bounces × ROUTINE.period`
     - `tossAt = serveClipAt + SERVE_CLIP.toss`
     - `serveAt = serveClipAt + SERVE_CLIP.contact`
     - `S = toWorld(SERVE_SPOT[court], FACE.yash, reach.serve)`
  2. **The serve.**
     - `flight1 = windows.serve + SWING_LEAD`
     - `C1x = courtSign × lerp(1.2, 4.6, draws[0])` (courtSign: deuce +1, ad −1)
     - `C1z = serveDepth(flight1)`
     - pick your stroke for `C1` from `RECEIVE_SPOT[court]`, then `C1 = [C1x, reach[stroke].y, C1z]`
     - `serve = shotTo(S, C1, SERVE_BOUNCE_Z, flight1, SPIN.serve)`; push the flight (`start: serveAt`) and Yash's swing `{ by: "yash", kind: "serve", contact: serveAt, spot: SERVE_SPOT[court], meets: true }`
     - Yash recovers from `serveAt + 0.5` for `RECOVER.takes` to `[−sideSign(open[0]) × YASH_BASE.cover, 0, YASH_BASE.z]`
     - push window 0 (`opens: serveAt`, `commits: serveAt + windows.serve`)
  3. **Pending first input:** push your swing (meets) and return with `end: null`.
  4. **First input missed:**
     - **late:** your swing `{ meets: false, miss: "late" }`
     - **early:** your swing `{ meets: false, miss: "early" }`
     - in both cases `end = contact1 + CALL_AFTER_S`, with the serve running on
     - **wrong:** you hit (meets). Your return goes to the side Yash covers, `C2 = [sideSign(side) × 1.6, h, −YASH_CONTACT_Z]` (shot 2 below). Then Yash's put-away: `toBounce(C2, [−sign(your recover x) × 3.3, 9.2], FINAL.yash, SPIN.rally)`. You stretch toward it (`kind: "stretch"`, meets false) at its nearest moment. `end = put-away bounce + CALL_AFTER_S`.
  5. **Your return (shot 2).**
     - `C2`:
       - on the open side when you picked it: `[sideSign(side) × lerp(2.6, 3.6, draws[2]), h, −YASH_CONTACT_Z]`
       - else the covered side, as above
     - `ret = shotTo(C1, C2, −RETURN[q].bounce, RETURN[q].flight, SPIN.rally)`
     - you recover from `contact1 + RECOVER.after` to `[sign(C1x) × YOUR_BASE.cover, 0, YOUR_BASE.z]`
     - Yash's swing at `yashAt = contact1 + RETURN[q].flight` (stroke picked from his recover spot)
  6. **Yash's rally shot (shot 3).**
     - `flight3 = windows.rally + SWING_LEAD`
     - `C3x = sideSign(draws[3] < 0.5 ? "left" : "right") × lerp(1.0, 3.2, draws[4])`
     - `C3z = rallyDepth(flight3)`
     - `s3 = shotTo(C2, C3, rallyBounce(flight3), flight3, SPIN.rally)`
     - Yash recovers from `yashAt + RECOVER.after` to `[−sideSign(open[1]) × YASH_BASE.cover, 0, YASH_BASE.z]`
     - push window 1 (`opens: yashAt`, `commits: yashAt + windows.rally`)
     - **pending second input:** your swing (meets), `end: null`
  7. **The second input:**
     - **late / early:** swing missed as in 4; `end = contact3 + CALL_AFTER_S`
     - **wrong:** you hit; `intoNet(C3, [sideSign(side) × 1.2, NET_SHOT.height], NET_SHOT.flight)`; `end = contact3 + NET_SHOT.flight + CALL_AFTER_S`
     - **good / perfect, not capped:** `toBounce(C3, [sideSign(side) × lerp(2.8, 3.6, draws[5]), −(perfect ? 10.6 : 9.8)], FINAL[q], SPIN.rally)`
     - **capped:** the same toward an OUT:
       - `draws[5] < 0.5`: sideline `[sideSign(side) × (COURT.singles + BALL_RADIUS + by), −8.6]`
       - else the baseline: `[sideSign(side) × 2.6, −(COURT.half + BALL_RADIUS + by)]`
       - `by = lerp(OUT_BY.min, OUT_BY.max, draws[1])`, and `mark = { at: bounce, from: contact3 + FINAL[q] }`
     - in both final cases:
       - Yash chases: a `stretch` swing toward the bounce, 45 % of the way from his recover spot, at the bounce time
       - `end = bounce time + CALL_AFTER_S`

  **Stroke choice:** for a contact `C` and the player's current spot `P`, compute `feetFor(C, FACE[by], reach.forehand)` and `feetFor(C, FACE[by], reach.backhand)`; the nearer to `P` wins. Each `Swing.spot` is that `feetFor`, so the sweet spot lands on the ball (case 2).

  **`setupPoint(s, layout, luck)`:**

```ts
{
  court: courtOf(s),
  first: s.points.length === 0,
  capped: yourPoints(s) >= YOUR_CAP,
  windows: {
    serve: windowMs("serve", s, layout) / 1000,
    rally: windowMs("rally", s, layout) / 1000,
  },
  open: [luck() < 0.5 ? "left" : "right", luck() < 0.5 ? "left" : "right"],
  draws: Array.from({ length: 6 }, luck),
}
```

  Run the test. Expected: PASS. A failing contact or run case means a geometry constant needs care. Change the constant (and say why in a comment), never the test's tolerance.

- [ ] **Step 3: Commit.** `feat(tennis): one point's script: where each ball goes, who hits it when and from where, and the racket on the ball (Phase 8 tennis T6)`

---

### Task 7: The shotlists (pure)

**Files:**
- Create: `src/features/games/tennis/3d/sequence.ts`, `sequence.test.ts`
- Modify: `src/features/games/three/track.ts`, `track.test.ts`

**Interfaces:**
- Consumes:
  - `rally.ts` (Task 6)
  - `timing.ts`, `Reach`, `CLIP_PACE` (Task 5)
  - `track.ts`
- Produces:
  - `track.ts`: `Move.turn?: number`, the seconds over which the heading eases to `face` from `start` (default 0: instant, as today)
  - `sequence.ts`:

```ts
export type Track = ActorTrack<TennisClip>;
export type Sound = "hit" | "court" | "applause" | "ooh";
export interface Cue { at: number; sound: Sound }
export interface Shotlist {
  end: number;
  ball(t: number): Vec3 | null;
  /** Who holds the ball in his left hand at `t` (the scene puts it at that hand), or null. */
  held(t: number): ActorId | null;
  actors: Record<ActorId, Track>;
  camera(t: number): CameraPose;
  /** The open side's glow on Yash's half while a window is open: its side and strength (0 to 1). */
  glow(t: number): { side: Side; strength: number } | null;
  mark: { at: Vec3; from: number } | null;
  cues: Cue[];
  /** When your racket meets the ball: the phone buzzes. */
  buzz: number[];
}
export function readyShotlist(setup: PointSetup, reach: Reach): Shotlist;
export function pointShotlist(script: PointScript, reach: Reach): Shotlist;
export function walkShotlist(after: Shotlist, next: PointSetup | null): Shotlist; // null: GAME (fist pump, camera push)
```

- [ ] **Step 1: Write the failing `track.test.ts` case:** a move `{ start: 1, end: 2, to: [1, 0, 0], face: Math.PI / 2, turn: 0.2 }` from face 0 gives face 0 at t 1, π/4 at t 1.1, π/2 at t 1.2 and after. It takes the shorter way round (from 3 to −3 radians goes through π, not 0). Then implement: in `sampleTrack`, when a move has `face` and `turn`, ease linearly from the heading before it over `turn` seconds, the short way round. The existing cases stay green.

- [ ] **Step 2: Write the failing `sequence.test.ts`.** Use the same fixture `Reach` and setups as `rally.test.ts`:
  1. **The ball:**
     - during the routine it moves between the bounce spot (`toWorld(SERVE_SPOT, 0, reach.bounce)` projected to the floor) and the hand, with `held` null
     - from the routine's end to `tossAt`, `held(t)` is `"yash"`
     - from `tossAt` it rises from `toWorld(…, reach.toss)` and is at the serve contact at `serveAt`
     - after `serveAt`, `ball(t)` follows the flights
     - it is null after `end`
  2. **Clips line up with contacts:** for every swing that `meets`, the actor's sampled clip at `contact` (the top-weight clip) is that stroke (or `serve`), at clip time `STROKE_CLIP.contact` (`SERVE_CLIP.contact`) within 1/60 s.
  3. **No snapping:** for each actor, sampled every 1/60 s across the point:
     - the clip weights always sum to 1
     - position steps stay under 0.2 m per frame
     - the heading changes under 0.35 rad per frame
  4. **Feet do not slide:** while a `jog` or `sprint` clip has weight 1, its playback speed × `CLIP_PACE[clip]` equals the actor's ground speed within 10 %. Side shuffles use `SHUFFLE_PACE` the same way.
  5. **Late and early swings miss:**
     - `miss: "late"`: the stroke's clip time at the ball's contact moment is earlier than `STROKE_CLIP.contact` by about `MISS.late`
     - `"early"`: later, by about `MISS.early`
  6. **A rebuild never changes the past:** a pending vs a resolved shotlist sampled at every 1/60 s before the decision gives the same ball, actors and camera.
  7. **Cues:**
     - a `hit` at each meeting contact and the serve
     - a `court` at each bounce before `end`
     - an `ooh` at an OUT's bounce
     - an `applause` at `end − 0.3` unless the point ends the game
  8. **`walkShotlist(after, next)`:**
     - both players walk from where `after` left them to `next`'s spots (Yash to `SERVE_SPOT[next.court]`, you to `RECEIVE_SPOT[next.court]`) within `TENNIS_3D_BEATS.callMs`, facing their walk, then face the net
     - with `next` null, Yash plays `fistPump` and the camera moves toward `CAMERA.game`

- [ ] **Step 3: Implement `sequence.ts`.** The point shotlist from a `PointScript`:

  **Each actor's track.**
  - **Start:** home is its point start (Yash `SERVE_SPOT[court]`, you `RECEIVE_SPOT[court]`), face `FACE[id]`.
  - **Yash's routine:** `bounceBall` looping from 0; `serve` at `serveClipAt` (fade 0.15).
  - **Your opening clips:** `ready` looping from 0; `split` at `serveAt` (fade 0.1).
  - **For each swing, in time order:**
    1. **The run.** It starts at `max(the opponent's hit + SPLIT_CLIP.end, when the last thing ended)` and arrives at `contact − STROKE_CLIP.contact + 0.1`. Under 1 m is a side shuffle (`shuffleL` / `shuffleR` by direction, facing the net, speed = ground speed / `SHUFFLE_PACE`). Otherwise `jog` (under 4 m/s) or `sprint`, at speed = ground speed / `CLIP_PACE[clip]`. The player turns toward the run (`turn` 0.15) and back to `FACE[id]` as he arrives (`turn` 0.2).
    2. **The stroke clip**, by how the swing meets the ball:

       | Swing | Clip timing |
       |---|---|
       | meets | starts at `contact − STROKE_CLIP.contact` (fade 0.2) |
       | `miss: "late"` | starts the same; from the commit time (`contact − SWING_LEAD`) a held segment (`from: STROKE_CLIP.commit`, `speed: 0`, fade 0.05), then from `commit + MISS.late` it plays on (`from: STROKE_CLIP.commit`, fade 0.05) |
       | `miss: "early"` | starts at `contact − STROKE_CLIP.contact − MISS.early` |
       | `stretch` | `stretchF` / `stretchB` timed so `STRETCH_CLIP.reach` falls at `contact`, the run ending there |

    3. **The recovery:** its move with a shuffle clip, then `ready` looping.
  - **The serve's swing** is the `serve` clip already placed.

  **Everything else.**
  - **Ball:** the routine, held, toss, then the flight in the air at `t` (the latest flight whose `start ≤ t`, at `path.at(t − start)`); null after `end`.
  - **Glow:** during each window from `opens` to `commits + SWING_LEAD`, `{ side: open, strength }` rising over 0.15 s.
  - **Camera:** `CAMERA.tv`, with the target's x set to `CAMERA.pan` × the mean of the ball's x at t, t−0.15, t−0.3, t−0.45 and t−0.6 (null counts as 0). This is a pure function of time; it never jumps.
  - **Cues and buzz:** as in case 7. `buzz` is `script.contacts`.

  **`readyShotlist(setup, reach)`:** both at their spots in `ready` / `bounceBall`, the ball held by Yash, the camera `tv`.

- [ ] **Step 4: Run the tests.** Expected: PASS.

- [ ] **Step 5: Commit.** `feat(tennis): shotlists: the routine, the strokes on their contacts, the footwork, the ball, the camera and the cues (Phase 8 tennis T7)`

---

### Task 8: The 3D court and the owner's moves checkpoint

The visual task: tune it by looking at screenshots and a video. The controller reviews them, then the **owner checkpoint**: Yash sees the moves and a full point before the game is wired.

**Files:**
- Create:
  - `src/features/games/tennis/3d/world.ts`
  - `src/features/games/tennis/3d/Arena.tsx`
  - `src/features/games/tennis/3d/Players.tsx`
  - `src/features/games/tennis/3d/scene.tsx`
  - `src/features/games/tennis/3d/PointLab.stories.tsx`

**Interfaces:**
- Consumes:
  - `GameCanvas`, `Crowd`, `Floodlight`, `useGroundSpots`, `loadAthleteFiles`, `prepareAthlete`, `SceneProps` (Task 2)
  - `court.ts` (Task 4)
  - `moves.ts`, `props.ts`, `reach.ts` (Task 5)
  - `rally.ts` (Task 6)
  - `sequence.ts` (Task 7)
- Produces:
  - `world.ts` (no `three` import): `export interface WorldState { shotlist: Shotlist; elapsed(): number; crowdUp: boolean }`, where `crowdUp` is set by the screen at GAME
  - `scene.tsx` (the lazy entry):
    - `TennisAssets { body; clips; skin; reach: Reach }`
    - `loadTennisAssets(onProgress): Promise<TennisAssets>`: `loadAthleteFiles`, then `prepareAthlete(files, buildTennisClips)`, then `measureReach` in a task of its own
    - `TennisScene(props: SceneProps<TennisAssets, WorldState>)`

- [ ] **Step 1: `Arena.tsx`.** Built from simple shapes; every colour comes from a token (add a `--ref-*` token beside the others only if none fits, and say so in the report).
  - **The surface:**
    - the court inside the doubles lines in `--ref-court-hard`
    - the run-off around it a shade darker, out to the fences
    - every line 0.05 m wide in `--ref-floodlight`: baselines, singles and doubles sidelines, service lines, centre service line, centre marks
  - **The net:** a dark translucent panel shaped to `netHeightAt`, with a white tape along the top, and posts at ±`COURT.net.postX`.
  - **Around it:**
    - dark back and side walls (2.5 m) at the fences, with a volt band along their top
    - tiered stands on all four sides beyond the walls
    - the `Crowd`, seated on those tiers by a `seat` function, standing at GAME (`up: () => world.current?.crowdUp ?? false`)
    - four `Floodlight` masts at the corners
  - **Lights:** a hemisphere light, and one directional light that casts shadows only when `SETTINGS[layout].shadows` (a tight shadow camera around the court).
  - **The open-side glow:** a volt translucent plane over Yash's half on the open side (x 0 to ±`COURT.singles`, z 0 to −`COURT.half`). Each frame it reads `shotlist.glow(t)`; its opacity is 0.18 × strength.
  - **The Hawk-Eye mark:** a flat volt ellipse ring (0.3 × 0.18 m, readable from the TV view) at `shotlist.mark.at` from `mark.from`.

- [ ] **Step 2: `Players.tsx`.**
  - **The two athletes:**
    - **Yash:** shirt and shorts `--surface-panel`, white shoes, `shorts: true`, the racket with a volt throat, the headband and the wristband
    - **You:** shirt `--ref-floodlight`, shorts `--ref-text-2`, white shoes, `shorts: true`, the racket
  - **Each frame:** `sampleTrack` → position, face, `applyClips`, as cricket's `Players` does.
  - **Ground spots:** `useGroundSpots(!shadows, roots)`.
  - **Clean-up:** dispose as cricket does.

- [ ] **Step 3: `scene.tsx`.**
  - **`Ball`:**
    - a sphere at twice the real radius in `--ref-volt` (with a little emissive)
    - placed at `shotlist.ball(t)`, or at Yash's left-hand bone (+ a 4 cm offset toward the palm) while `held(t)` is `"yash"`, or hidden
    - a soft dark disc on the floor under it, fading with height
  - **`CameraRig`:** each frame, from `shotlist.camera(t)` and `CAMERA.tilt[layout]`.
  - **`TennisScene`:** `GameCanvas` + `Arena` + `Players` + `Ball` + `CameraRig`.

- [ ] **Step 4: The Point Lab story** (`Dev/Tennis Point`, dev only).
  - It loads the assets, then plays a scripted point in real time, looping.
  - `args`:
    - `scenario`: `ace`, `early`, `wrongReturn`, `late`, `intoNet`, `winner`, `out`
    - `layout`
    - `court`
    - `t`: a paused time; empty means playing
  - The scenario builds a `PointSetup` (its windows from the first point's) and the `Decided` that scenario needs, then `pointShotlist(scriptPoint(…), assets.reach)`.

- [ ] **Step 5: Look at it.**
  1. Save screenshots to `.superpowers/sdd/2026-10-16-phase-8-tennis-3d/shots/court/`:
     - stage 1440×900 and column 390×844
     - the routine, the toss, the serve contact, your return contact, Yash's rally contact, your last contact
     - a glow frame and the OUT mark
  2. Tune `CAMERA` until:
     - the stage shows the whole court with Yash at the far baseline clear of the HUD
     - you are in the foreground
     - the column shows the same court above the thumb zone
  3. Record two videos of the `winner` and `out` scenarios at 1440×900 and one at 390×844, with Playwright `recordVideo` (a throwaway script in the scratchpad, against Storybook on 4184, headless Chromium with its GPU) to `.superpowers/sdd/2026-10-16-phase-8-tennis-3d/videos/`.
  4. Iterate before reporting.

- [ ] **Step 6: Unit tests, typecheck, lint; commit.** `feat(tennis): the 3D court: the arena, the players in their kits, the ball, the camera, and the dev point lab (Phase 8 tennis T8)`

- [ ] **Step 7: OWNER CHECKPOINT.** The controller sends Yash:
  - the moves screenshots (Task 5)
  - the court screenshots
  - the videos

  He approves them or asks for changes. **Changes go to a builder** (Opus, high effort, for moves), and the checkpoint repeats. Task 10 does not start until he approves.

---

### Task 9: Sounds: Yash's picks

**Files:**
- Modify:
  - `src/shell/audio.tsx`, `src/shell/gameSound.ts`, `src/shell/synth.ts` (+ their tests where a list is asserted)
  - `public/audio/CREDITS.md`
- Create: `public/audio/` files for Yash's picks only

**Interfaces:**
- Produces:
  - `SoundName` gains `"hit" | "court" | "applause"`
  - `RECIPES` gains code-made fallbacks:
    - `hit: net`
    - `court: bounce`
    - `applause: crowd`
  - `RECORDED` maps:
    - `hit` → `"hit"`
    - `court` → `"court"`
    - `applause` → `"applause"`
  - `ooh` keeps `"ooh"` unless Yash picked a new one: a new file replaces `ooh.mp3` (one ooh for both games)
  - `ambience(on: boolean, track?: "murmur" | "hush")`: default `"murmur"`, so cricket is unchanged; `GAME_FILES` gains `hush` only if Yash picked a new hum

- [ ] **Step 1: Ship the picks.** Copy Yash's picked files from the candidates folder to `public/audio/` under their final names (`hit.mp3`, `court.mp3`, `applause.mp3`, and `hush.mp3` / a replaced `ooh.mp3` if picked). Add their rows to `CREDITS.md` in its format. Add each to `GAME_FILES` and `GAME_LEVELS`: hit 0.9, court 0.6, applause 0.7, hush 0.3.
- [ ] **Step 2: The names, the fallbacks and the hum's track.**
  1. Extend `SoundName`, `RECIPES` and `RECORDED` as above.
  2. `ambience` takes the track; it fades the current one out if the track changes.
  3. `useThreeScreen` (Task 2) gains an optional `hum` prop, passed to `ambience`.
  4. Update any test that lists the sound names.
- [ ] **Step 3: Unit tests, typecheck, lint; commit.** `feat(sound): the tennis hit, the court bounce and the applause (CC0, picked by Yash); the hum can be a venue's own (Phase 8 tennis T9)`

---

### Task 10: The 3D game: the screen, the one 2D/3D choice, the controls

**Files:**
- Create:
  - `src/features/games/tennis/Tennis3DScreen.tsx`
  - `src/features/games/tennis/TennisGame.tsx`
  - `tests/e2e/support/three.ts`
  - `tests/e2e/tennis-3d.spec.ts`
- Modify:
  - `src/features/games/tennis/TennisPage.tsx`, `TennisStage.tsx`, `TennisColumn.tsx`
  - `tests/e2e/support/cricket3d.ts` (import the moved helpers)
  - `app/routes/arena.tennis.tsx`
  - `tests/e2e/smoke.spec.ts`, `tests/e2e/webkit-smoke.spec.ts`

**Interfaces:**
- Consumes: everything above.
- Produces: `TennisGame` (the route's component).

- [ ] **Step 1: `TennisGame.tsx`.**

```ts
/** three.js and the scene arrive only through this dynamic import, never in a page's first load. */
const loadTennis3d = loadOnce(async (onProgress) => {
  const m = await import("./3d/scene");
  return { Scene: m.TennisScene, assets: await m.loadTennisAssets(onProgress) };
});

/** Tennis in 3D, or today's 2D game for reduced motion, no WebGL, or a failed download (spec T8). */
export function TennisGame() {
  const reduced = useMediaQuery(MEDIA.reducedMotion);
  const gate = useThreeGate({ reduced, load: loadTennis3d });
  return gate.status === "off" ? <TennisScreen /> : <Tennis3DScreen gate={gate} />;
}
```

  The route renders `TennisGame`.

- [ ] **Step 2: `TennisPage`, `TennisStage`, `TennisColumn` take `three?: TennisThree`.** This follows cricket's `CricketThree`:

```ts
export interface TennisThree {
  status: ThreeStatus;
  drawn: boolean;
  progress: number;
  scene: ReactNode | null;
  layout: GameLayout;
  /** The aim buttons take a pick (toss, window, rally). */
  live: boolean;
  loading: string;
}
```

  - **`TennisPage`:** `phase` becomes `TennisPhase | Tennis3dPhase`. It passes the scene to the layout on screen only, and `three.status` to `GamePage`.
  - **`TennisStage` with `three`:**
    - the scene replaces the backdrop (`scene`, `sceneHidden`, `sceneDrawn`)
    - the tracers, the tracking ring and the serving tag at their board spots are not drawn
    - the two `AimZone`s sit side by side, centred, just above the progress bars (`live` from `three.live`)
    - the serving line (`view.serving`) is a `PlayerTag` centred under the instructions panel
    - while loading, a `GameLoader` (`three.loading`, `three.progress`) holds the aim zones' place, so nothing moves when they appear
    - the courtside cards, the LED marquee, the call and the end stay as they are
  - **`TennisColumn` with `three`:**
    - the scene fills the screen behind everything; only the call is drawn on the field
    - while loading, the thumb zone keeps the controls' place, unseen, with the loader over them (as `CricketColumn` does)
    - the swipe on the court and the ← / → halves call `onPick` while `three.live`
  - **Without `three`:** both are exactly as today.

- [ ] **Step 3: `Tennis3DScreen.tsx`.** It follows `Cricket3DScreen`'s shape.
  - **The session.** `useGameSession({ venue: "tennis", start, build })`, where `build` is `buildTennis3dView` with the content, copy and routes given, and the run is:

```ts
interface Run extends EndFlags {
  game: MatchState;
  phase: Tennis3dPhase;
  /** The open side while a window is open. */
  open: Side | null;
}
```

  - **Refs:**
    - `world` (`WorldState`)
    - the point in play: `{ setup, decided, script, next: MatchState | null }`
    - the game clock: `useGameClock(root, { running: ready })`, as cricket's (its `elapsed()` drives the shotlist)
  - **`useThreeScreen`:** with `hum: "hush"` (or `"murmur"` if that was Yash's pick).
  - **`beginPoint()`:**
    1. If the tab is hidden, wait (as the 2D game does).
    2. `setup = setupPoint(game, layout, Math.random)`, `decided = {}`.
    3. `script = scriptPoint(setup, decided, assets.reach)`.
    4. `show(pointShotlist(script, reach))`, with the clock restarted.
    5. `stage(script, 0)`, then `commit({ phase: "ready", open: null })`.
  - **`stage(script, now)`:** clear the timers, then schedule from `now`:
    - `"toss"` at `tossAt`
    - for each window not yet decided:
      - at `opens`: `commit({ phase: "window", open })`
      - at `commits`: resolve that input with no pick (late)
    - after a good first input:
      - `"struck"` at once
      - `"rally"` at your contact (`script.contacts[0]`)
    - the cues after `now`, each `audio.play(sound)` (with the `ooh` / `applause` / `hit` / `court` names)
    - the buzz times on the phone (`navigator.vibrate?.(15)`)
    - `land` at `script.end` when it is a number
  - **`pick(side)`**, read from `latest`. First `audio.unlock()`. Then by phase:
    - `"toss"` / `"rally"`: resolve the next input as **early** (`atMs = −1`)
    - `"window"`: resolve with `atMs = (clock.elapsed() / 1000 − window.opens) × 1000`
    - any other phase: ignore
  - **`resolve(i, side, atMs)`:**
    1. `r = judge({ side, atMs }, setup.open[i], setup.windows[i === 0 ? "serve" : "rally"] × 1000)`.
    2. Record `decided[i]`, with `at` = the clock now.
    3. Rebuild `script` and `show` it (the same clock).
    4. If the point is now decided (`r.q === "miss"` or `i === 1`): `next = playPoint(game, inputs)` and `commit({ phase: "struck", open: null })`. Otherwise commit `"struck"` too: `stage` turns it into `"rally"` at your contact.
    5. `stage(script, now)`.
  - **`land()`:** `commit({ game: next, phase: "called", open: null })`, then say the comm (desktop). Then:
    - **over:** `session.finish(next, { score: view.saved, form: perfectShare(allInputs(next)) }, {}, { cheer: true })`, set `world.current.crowdUp = true`, and show `walkShotlist(shotlist, null)` (GAME: the fist pump, the push-in). A rematch sets `crowdUp` back to false.
    - **otherwise:** show `walkShotlist(shotlist, setupPoint(next, …))` and `timers.after(TENNIS_3D_BEATS.callMs, beginPoint)`. That setup is the next point's, so `beginPoint` uses it instead of drawing a new one.
  - **The first point** comes `TENNIS_3D_BEATS.firstMs` after the scene is shown and the page's wipe is done (as the 2D's `serveOnArrival`).
  - **A rematch:** `session.again` (score 0–0), `show(readyShotlist(…))`, then `beginPoint` after `TELL_MS`.
  - **A hidden tab** (Review Focus 2): during a point (`phase` toss / window / struck / rally, or ready with a point shown):
    - clear the timers and drop the point (`decided` and `next` thrown away)
    - show `readyShotlist`, set phase `"ready"`, mark `waiting`
    - the visible tab calls `beginPoint` again
    - nothing is saved
  - **Keys:** `useGameKeys({ down: { ArrowLeft: () => pick("left"), ArrowRight: () => pick("right") } }, { active: ready && [...LIVE_3D, "struck"].includes(run.phase) })`. `struck` is listed so a press there is swallowed (not a page scroll), and `pick` ignores it.
  - **Arrival:** `useArrival({ line: content.commentary.entrance[0]!, spoken: desktop, reduced: false, warm: false })`.
  - **The page:** `<TennisPage view={view} phase={run.phase} onPick={pick} onAgain={again} rootRef={root} three={{ status, drawn, progress, scene, layout, live: LIVE_3D.includes(run.phase), loading: ui.games.tennis.three.loading }} />`.

- [ ] **Step 4: E2E helpers.**
  - Move `open3d`, `jump` and `untilPhase` from `support/cricket3d.ts` to `support/three.ts` (`untilPhase` gains a `maxMs` default of 20 000). `cricket3d.ts` re-exports them, so `cricket-3d.spec.ts` is unchanged.
  - Add to `three.ts`:
    - `pickOpen(page)`: the stage presses the arrow of the aim zone whose `data-state` is `open`; the phone taps that half
    - `pickWrong(page)`: the other side

- [ ] **Step 5: Write `tests/e2e/tennis-3d.spec.ts`** (the desktop-3d and mobile-3d projects run it). Copy the error watcher and the `expect` timeouts from `cricket-3d.spec.ts`. Tests:
  1. **The loader, then one canvas.**
     - Hold `models/moves.glb` (route) and see the progress bar (`three.loading`).
     - Release it, wait for `data-three=ready`; there is exactly one `canvas`.
     - The aim buttons (stage) or halves (phone) are visible, and the bounding boxes of SKIP and the score bug did not move.
  2. **No input:** four aces.
     - `forceLuck(0.2)`, `open3d`, then `untilPhase(["end"], 60_000)`.
     - The saved record's tennis score is `GAME YASH`, and the bug reads `40` / `0`.
     - No page errors.
  3. **Perfect play:** 40–30.
     - `forceLuck(0.2)` (every open side is left).
     - Loop until `end`: in `window`, press ←; otherwise jump 250.
     - The calls seen include `WINNER.` twice and `OUT.`; the bug reads `40` / `30`; saved `GAME YASH`.
  4. **TOO EARLY, once (Review Focus 1).**
     - In `toss`, press ← three times fast: the call is `TOO EARLY.`, and the bug shows one point played (15–0).
     - In `struck`, a press does nothing (the phase and the bug are unchanged).
  5. **A hidden tab drops the point (Review Focus 2).**
     - Mid-point (in `window`), make the tab hidden (as the cricket spec does), then visible.
     - The point plays again from `ready`; the bug is unchanged; nothing is saved until the game ends.
  6. **A resize across 1200px mid-point** (desktop-3d only, Review Focus 3).
     - In `window`, set the viewport to 390×844, press the open half, and finish the point.
     - It counts once (the bug moves by one point); there is never more than one canvas.
  7. **A failed download (Review Focus 4).** A 404 on `models/athlete.glb` gives the 2D game (`data-three=off`, the 2D aim zones play a serve), with no page errors apart from the 404.
  8. **Leaving mid-point (Review Focus 5).**
     - SKIP during a rally lands on Match Highlights with no page errors, and no `audio.play` after leaving (spy as the cricket spec does).
     - Going back shows `data-three=ready` within 5 s (cached).
  9. **Accessibility:** `expectNoA11yViolations` on the 3D page in `window`.

- [ ] **Step 6: The first-load guards.**
  - `smoke.spec.ts`: `/arena/tennis first-load chunks do not contain three`, as cricket's.
  - `webkit-smoke.spec.ts`: tennis gets the same longer thumb timeout as cricket.

- [ ] **Step 7: Run everything once.**
  1. `NODE_OPTIONS= pnpm verify`.
  2. The 3D projects on the temporary config: `--project=desktop-3d --project=mobile-3d` for `tennis-3d.spec.ts` and `cricket-3d.spec.ts`.
  3. `tennis.spec.ts` on the 2D projects.

  Expected: all PASS. (Known flaky under parallel load: `intro.spec` ~293 and `hub.spec` card-lift ~656; re-run those alone before calling them failures.)

- [ ] **Step 8: Commit.** `feat(tennis): the 3D game: a real service game, the open side to pick, the 2D game kept as the backup (Phase 8 tennis T10)`

---

### Task 11: Lighthouse and the as-built notes

**Files:**
- Modify:
  - `tools/lighthouse.mjs`
  - `docs/superpowers/specs/2026-10-16-phase-8-tennis-3d-design.md`
  - `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md` (§8.2 pointer)

- [ ] **Step 1: `lighthouse.mjs`.** Move `/arena/tennis` from the plain list to cricket's shape:
  - gated desktop and mobile runs with `NO_3D`
  - two reported-only 3D runs with `SWIFTSHADER`
- [ ] **Step 2: Run Lighthouse** (port 4174, after `pnpm build`). Gates: desktop performance ≥ 90, phone ≥ 80, accessibility 100, best practices and SEO ≥ 90, FCP ≤ 1500 ms, CLS ≤ 0.1. If a gate fails, find the cause (a layout shift when the 3D arrives, a long task at start-up) and fix it, as cycle 1 §9.3 did. Never loosen a gate.
- [ ] **Step 3: The as-built section** in the tennis spec (§10), in cycle 1 §9's style:
  - the Lighthouse table
  - the sizes (the tennis scene chunk; the models are shared)
  - the camera values
  - the measured `Reach` and `CLIP_PACE`
  - the rulings in plain words
- [ ] **Step 4: The parent spec.** Add a pointer at the top of the parent spec's §8.2 to the tennis 3D spec, as §8.1 has for cricket.
- [ ] **Step 5: Commit.** `docs: Phase 8 tennis as built (Lighthouse, sizes, camera, reach)`
