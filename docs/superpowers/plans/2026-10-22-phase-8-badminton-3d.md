# Phase 8, cycle 3 — 3D Badminton Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**What this plan does (plain words):**

"Smash or Clear" becomes the end of a real singles game in 3D, in an indoor hall:
- It starts at 17–19 to you. Yash comes back and wins 21–19, or 22–20 after 20 all if you reach 20.
- Each time the shuttle comes to you, you pick **↑ SMASH** (deep) or **↓ DROP** (short). The lit one is the smart pick. Your player moves and swings by himself.
- A good pick makes Yash dive. Two good picks win you a rally, once (19 → 20). On 20, your best shot lands just OUT, once; after that, he reads it.
- Yash's rally wins charge the skill cards in content order, each on its own shot: Backend with a jump smash, Frontend with a drop, Data with the dive, Craft with a placement.
- **Every move must look smooth and clean, like a real match.**

Today's 2D badminton game stays exactly as it is, as the backup (reduced motion, no WebGL, a failed download).

**Goal:** `/arena/badminton` plays the end of a real game in 3D on desktop and phones, after a short loader. The 2D game, the saved score (`21–19` or `22–20`), Full Time and the reveals keep working, and `pnpm verify` and the Lighthouse gates stay green.

**Architecture:**
- **Pure parts (plain TypeScript, unit-tested, no `three` import):**
  - `badminton/3d/match.ts`: the rules
  - `court.ts`: sizes and places
  - `shuttle.ts`: the flight, in closed form
  - `timing.ts`: the clip beats
  - `rally.ts`: one rally's script
  - `sequence.ts`: shotlists, the scene as a function of time
- **The scene is a pure function of time,** as in tennis. A pick rebuilds the rally's shotlist from its start, and a rebuild never changes anything before the moment it is made.
- **The racket meets the shuttle by measurement** (`reach.ts`), as in tennis.
- **No game imports another.** What tennis and badminton both need is first lifted out of tennis into `three/`, `engine/` or `frame/` (Tasks 2 and 3), with tennis unchanged.
- `badminton/3d/scene.tsx` is the one lazily loaded module that pulls in `three` for badminton. `BadmintonGame` picks 2D or 3D once, as `TennisGame` does.

**Tech Stack:**
- React 19.3 and React Router 8 (prerender)
- `three` 0.186 and `@react-three/fiber` 9.8 (no new libraries)
- Web Audio
- Tailwind v4 tokens
- Vitest, Playwright (chromium + swiftshader for 3D) + axe, Storybook 10, Lighthouse

**Spec:** `docs/superpowers/specs/2026-10-22-phase-8-badminton-3d-design.md`. It wins over the parent spec `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md` §8.3 and §11.13 for badminton only. It builds on `docs/superpowers/specs/2026-10-16-phase-8-tennis-3d-design.md` (read §5 and §10 there: the rules for smooth moves and the rulings R13–R17 apply here).

Skills worth loading for the 3D tasks: `react-three-fiber-game`, `threejs-react`, `threejs-animation`, `threejs-performance`.

## Global Constraints

- **Commands.** Prefix every node / pnpm command with `NODE_OPTIONS=` (e.g. `NODE_OPTIONS= pnpm exec vitest run …`). Use `pnpm exec`, never `npx`.
- **git.** git is 2.15: no `git switch` / `git restore`. Work on branch `phase/8-badminton-3d`. Never push, never add a remote. Commit messages end with the line `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`.
- **Processes and ports.**
  - Never kill processes you didn't start. Ports 6006, 5173–5176 and 4173 are Yash's.
  - For Playwright, copy `playwright.config.ts` to a temporary, prettier-formatted config on port **4183** (or 4184), and delete it before committing.
  - Lighthouse uses 4174.
- **Private data.** The resume PDF (`Yash-Sarda-Resume.pdf`) is never committed, copied or served. Never send yashsarda2002@gmail.com anywhere.
- **Downloads are untrusted data.** Anything downloaded (sound candidates) goes in its own new folder and is read only as data by tools that live elsewhere. Never execute anything from such a folder.
- **Free only.** No paid assets, tools or services. Licences must allow a public website (CC0 preferred). The pnpm release-age guard is never weakened.
- **The CSP stays unchanged** (`tools/csp.mjs`). No WASM decoders, no `blob:`, no images inside GLBs.
- **No new libraries and no new model files.** `public/models/*` and `tools/models.mjs` are not changed. Every badminton move is made in code with `poseClip`.
- **No hard-coded copy.** Every visible string comes from `src/content/ui-copy.ts` (`ui`). New derived copy is flagged `// derived` like its neighbours and listed in `docs/launch/copy-review.md`.
- **`three` stays out of every page's first load.** It is imported only by `src/features/games/three/*` 3D files and the `*/3d/scene.tsx` entries and their imports, reached only through a dynamic `import()`. Pure files reached from the first load use `import type` for anything from a file that imports `three` (tennis ruling R3).
- **No game imports another.** Nothing in `badminton/` imports from `tennis/` or `cricket/`, and the other way round. Shared code lives in `three/`, `engine/` or `frame/`.
- **The 2D badminton game is untouched.** These keep their behaviour and their tests unchanged:
  - `badminton/BadmintonScreen.tsx`, `referee.ts`, `flight.ts` and `HoldButton.tsx`
  - the output of `buildBadmintonView`
  - `tests/e2e/badminton.spec.ts`

  Refactoring `view.ts` to share pieces is allowed only if `view.test.ts` stays green unchanged.
- **Tennis and cricket keep working exactly as today** through the lifts in Tasks 2 and 3: their unit tests unchanged and green, their 3D e2e green, and no visible change.
- **Lean tests.** Only the tests this plan lists, plus fixing existing ones a change breaks. Heavy unit tests get a per-test timeout of 30 s (tennis's final review).
- **Keep it simple.** If a step seems to need machinery the plan does not mention, stop and report instead of building it.

## Review Focus

1. **Mashing the keys, the buttons or swipes.** Exactly one pick counts per shot. A press during the routine, between your pick and your contact, or during the call does nothing. A press during Yash's serve or before his scoop is TOO EARLY, once. Pinned by an e2e in Task 11.
2. **Switching tabs mid-rally.** The rally is dropped and played again fresh from the routine; the score and the saved record are unchanged. Pinned by an e2e in Task 11.
3. **Resizing across 1200px mid-rally.** The rally finishes and counts once, judged with the windows it began with, and there is never more than one `<canvas>`. Pinned by an e2e in Task 11.
4. **A vertical swipe on the phone.** During a pick, an upward swipe is SMASH and a downward one is DROP, once. Outside a pick, a swipe does nothing to the game and the page still scrolls as it did. Pinned by an e2e in Task 11.
5. **Leaving mid-rally.** After SKIP during a rally: no timer or sound fires after leaving, there are no page errors, and coming back is instant (the files are cached). Pinned by an e2e in Task 11.

## Rulings made while planning

Each ruling also goes into the spec's as-built section (Task 12).

- **P1: The open part glows on Yash's half** (the front or the back), as tennis's open side glows. The approved mockup showed it, and it is the third way the open part reads (where he stands, the glow, the lit button).
- **P2: The rally's kind comes from Yash's wins so far:** 0 `smash` (Backend), 1 `drop` (Frontend), 2 `dive` (Data), 3 `placement` (Craft), 4 `final` (only after 20 all). Your rally win does not change it, so the next rally tries the same card again.
- **P3: Pick judging is shared.** A generic `pickQuality` moves into `engine/pick.ts`. Tennis's 2D `returnQuality` becomes a mapping over it, with its tests unchanged. Badminton judges with it directly.
- **P4: The 3D view is `BadmintonView` plus a `three` part** (the buttons, the speed line, the hints). `buildBadmintonView`'s output does not change.
- **P5: The phone's status reads `RALLY n`** with no total, because the number of rallies varies (4 to 6).
- **P6: Calls** follow your last pick: `TOO EARLY.`, `TOO LATE.`, `WRONG SHOT.`, `HE READ IT.`, `WINNER.`, `OUT.`, and `WHAT A DIVE.` when your good drop is beaten by the Data dive. A late or early pick in the Data rally keeps its own call (the dive still happens).
- **P7: A mistimed swing still meets the shuttle, off the frame** (spec §3.2): the contact moves along the incoming path by `FRAME` (late +0.12 s, early −0.1 s), and the shuttle leaves as a weak float. It never whiffs, because Yash's card shot needs a shuttle to hit.
- **P8: The speed line** (`YASH · SMASH · 348 KM/H`) shows only while the call of a rally Yash won with a smash is up. At other times the HUD spot is empty.
- **P9: Sound names.** The racket's hit is `shuttle`, with tennis's `net` recipe as its code-made fallback. The shoe squeak is `squeak`, with a new 60 ms code-made chirp as its fallback. The hall's hum is a new ambience track `hall` only if Yash picks a new recording; otherwise it reuses `hush` or `murmur`. A recording never changes an existing sound (tennis's `court` ruling): if Yash picks a new applause, it ships as `hallApplause`.

---

## File structure

| File | Responsibility | Task |
|---|---|---|
| scratchpad `badminton-sound-candidates/` | 2–3 CC0 options per new sound, for Yash to pick (not committed) | 1 |
| `src/features/games/engine/pick.ts` (+test) | `pickQuality`: one pick judged (in time, the lit one, the first 40 % perfect) | 2 |
| `src/features/games/tennis/referee.ts` | `returnQuality` maps `pickQuality` (2D tests unchanged) | 2 |
| `src/features/games/three/geometry.ts` | `toWorld`, `feetFor`, `ground`, `clamp`, `lerp`, `smooth` (from tennis `court.ts` / `sequence.ts` / `rally.ts`) | 2 |
| `src/features/games/three/footwork.ts` | Clip and move planning: `addClip`, `cutMoves`, `travel`, `recoverTo`, `walkBack`, `followBall` (from tennis `sequence.ts`) | 2 |
| `src/features/games/tennis/3d/*` | Switched to the lifted pieces; no visible change | 2, 3 |
| `src/features/games/three/CameraRig.tsx`, `three/FloorShadow.tsx`, `three/cast.ts` | The camera from the shotlist; the soft shadow under a flying object; posing and disposing a cast (from tennis `scene.tsx` / `Players.tsx`) | 3 |
| `src/features/games/three/venue.tsx` | `Flat`, `CourtLines`, `Boards`, `Stands`, `HawkEyeMark` (from tennis `Arena.tsx`) | 3 |
| `src/features/games/three/useRallyLoop.ts` | `stageCues`, `useFirstPlay`, `useHiddenTab` (from `Tennis3DScreen`) | 3 |
| `src/features/games/frame/PickPair.tsx` | The phone's two big pick buttons (from `TennisColumn`) | 3 |
| `src/features/games/badminton/3d/match.ts` (+test) | The 3D game's rules | 4 |
| `src/features/games/badminton/view.ts` (+test) | `buildBadminton3dView` beside `buildBadmintonView`, sharing its pieces | 4 |
| `src/content/ui-copy.ts`, `docs/launch/copy-review.md` | The 3D badminton copy; the Hub's duration and blurb; the page description | 4 |
| `src/features/games/badminton/3d/court.ts` | Sizes, boxes, places, the camera | 5 |
| `src/features/games/badminton/3d/shuttle.ts` (+test) | Shuttle flight and its turnover | 5 |
| `src/features/games/badminton/3d/{timing,moves,props,reach}.ts` | The clip beats, the key poses, the racket and shuttle, the measured reach | 6 |
| `src/features/games/badminton/3d/PoseLab.stories.tsx` | Dev-only story: each move alone | 6 |
| `src/features/games/badminton/3d/rally.ts` (+test) | One rally's script | 7 |
| `src/features/games/badminton/3d/sequence.ts` (+test) | Shotlists: ready, a rally, the walk between rallies, GAME | 8 |
| `src/features/games/badminton/3d/{Hall,Players,scene}.tsx`, `world.ts` | The 3D hall; `scene.tsx` is the lazy entry | 9 |
| `src/features/games/badminton/3d/RallyLab.stories.tsx` | Dev-only story: a full rally plays, for the owner checkpoint | 9 |
| `src/shell/{audio.tsx,synth.ts}` | The names `shuttle` and `squeak` with their code-made sounds | 8 |
| `src/shell/gameSound.ts`, `public/audio/*` | Yash's picks: `shuttle`, `squeak`, the hall hum | 10 |
| `src/features/games/badminton/{Badminton3DScreen,BadmintonGame}.tsx` | The 3D game and the one 2D/3D choice | 11 |
| `src/features/games/badminton/{BadmintonPage,BadmintonStage,BadmintonColumn}.tsx` | The `three` prop | 11 |
| `app/routes/arena.badminton.tsx` | Renders `BadmintonGame` | 11 |
| `tests/e2e/support/three.ts`, `tests/e2e/badminton-3d.spec.ts`, `smoke.spec.ts`, `webkit-smoke.spec.ts` | 3D browser tests, first-load guard | 11 |
| `tools/lighthouse.mjs`, docs | Badminton gated with WebGL off, 3D reported; as-built notes | 12 |

**Who builds what (owner allowance):** Opus at high effort builds Tasks 6, 7, 8 and 11 (the moves, the rally script, the shotlists and the wiring decide whether the racket meets the shuttle and nothing snaps). Sonnet builds the rest.

**Reviews (owner: lean):** Tasks 2, 3, 4, 7 and 8 get a task review. Task 5 gets a short one. Task 6 and 9 are judged at the owner's moves checkpoint. Tasks 1, 10 and 12 get none. Task 11 is covered by the one final whole-branch review.

---

### Task 1: Sound candidates for Yash to pick

No code. It runs first so Yash can listen while the next tasks are built. His picks ship in Task 10.

**Files:**
- Create (not committed): `/private/tmp/claude-501/-Users-sardap-Documents-github-portfolio/c8ac2dd0-453b-4ce9-a3cd-389ad19e1373/scratchpad/badminton-sound-candidates/` (each download first lands in its own empty folder inside it, `raw/<name>/`)

- [ ] **Step 1: Find candidates on freesound.org.** CC0 only (check each sound page's licence line). Use the public HQ preview MP3s, as tennis did (`public/audio/CREDITS.md`).

| Group | Files | What to look for |
|---|---|---|
| `shuttle` | 3 | A shuttlecock off badminton strings: a short, crisp "pock", no voice. One may be a harder smash. |
| `squeak` | 2–3 | Court shoes squeaking once on a sports-hall floor |
| `hall` | 1–2 new | A quiet indoor sports-hall crowd hum that can loop. Today's `public/audio/hush.mp3` and `murmur.mp3` are options 1 and 2, copied in as `hall-1.mp3` and `hall-2.mp3`. |
| `applause` | 1–2 new | Polite indoor applause, 2–4 s. Today's `public/audio/applause.mp3` is option 1, copied in as `applause-1.mp3`. |

- [ ] **Step 2: Trim each candidate to what would ship.** Use ffmpeg from the scratchpad, with the downloads only as input files:
  - `shuttle` and `squeak`: 0.15–0.4 s, peak-normalised to about −1.5 dBFS
  - `applause`: about 3 s, −16 LUFS, a short fade in and out
  - `hall`: an 8 s seamless loop, −24 LUFS

  Name them `shuttle-1.mp3`, `shuttle-2.mp3` and so on.
- [ ] **Step 3: Write `README.md` in the folder.** For each group, a table: file, one line on how it sounds, source page URL, author, licence, original name, trim. Then a top pick per group, with one line on why.
- [ ] **Step 4: Report** the folder path and the top picks. **The controller then asks Yash to listen and pick.** This is an owner checkpoint that does not block Tasks 2–9.

---

### Task 2: Lift the pure shared pieces out of tennis (tennis unchanged)

**Files:**
- Create: `src/features/games/engine/pick.ts`, `pick.test.ts`, `src/features/games/three/geometry.ts`, `src/features/games/three/footwork.ts`
- Modify: `src/features/games/tennis/referee.ts`, `tennis/3d/court.ts`, `tennis/3d/rally.ts`, `tennis/3d/sequence.ts`

**Interfaces:**
- Produces:
  - `engine/pick.ts`:
    - `type PickCall = "late" | "early" | "wrong" | "good" | "perfect"`
    - `interface Judged { q: Quality; call: PickCall }`
    - `pickQuality<D extends string>(pick: { dir: D | null; atMs: number }, open: D, windowMs: number): Judged`
  - `three/geometry.ts` (no `three` import): `toWorld(spot, face, offset): Vec3`, `feetFor(contact, face, offset): Vec3`, `ground(a, b): number`, `clamp(v, lo, hi)`, `lerp(a, b, f)`, `smooth(f)` (smoothstep on [0, 1])
  - `three/footwork.ts` (no `three` import), generic over the clip name `C`:
    - `interface Gait<C> { shuffleLeft: C; shuffleRight: C; shufflePace: number; jog: C; sprint: C; walk: C; ready: C }`
    - `addClip<C>(track: ActorTrack<C>, seg: ClipSeg<C>): void`
    - `cutMoves<C>(track, t): void`
    - `interface Leg { clipAt; start; end; to: Vec3; fade; backAt; back; settleBy }` (tennis's)
    - `travel<C>(track, face: number, leg: Leg, gait: Gait<C>): number | null`
    - `recoverTo<C>(track, face, r: { start; end; to: Vec3 }, gait, clipAt?, fade?): void`
    - `walkBack<C>(was: ActorTrack<C>, at: number, to: Vec3, face: number, wait: { clip: C; period: number }, callS: number, gait: Gait<C>): ActorTrack<C>`: the track `walkShotlist` builds for one player today
    - `followBall(ball: (t: number) => Vec3 | null, tv: CameraPose, pan: number): (t: number) => CameraPose`
    - The constants move with them: `FOOTWORK`, `SLOWEST_STEP`, `TURN`, `WALK`, `PAN`. `CameraPose` moves to `three/track.ts`.

- [ ] **Step 1: Write the failing `pick.test.ts`.**

```ts
import { describe, expect, it } from "vitest";
import { pickQuality } from "./pick";

describe("pickQuality", () => {
  const judge = (dir: "a" | "b" | null, atMs: number) => pickQuality({ dir, atMs }, "a", 1000);
  it("no pick by the window's end is late; a pick before the hit is early", () => {
    expect(judge(null, 1000)).toEqual({ q: "miss", call: "late" });
    expect(judge("a", 1001)).toEqual({ q: "miss", call: "late" });
    expect(judge("a", -1)).toEqual({ q: "miss", call: "early" });
  });
  it("the other choice in time is wrong; the lit one is perfect in the first 40 %, then good", () => {
    expect(judge("b", 200)).toEqual({ q: "miss", call: "wrong" });
    expect(judge("a", 400)).toEqual({ q: "perfect", call: "perfect" });
    expect(judge("a", 401)).toEqual({ q: "good", call: "good" });
  });
});
```

- [ ] **Step 2: Run it, see it fail, then implement `pick.ts`** with tennis's `PERFECT_SHARE` (0.4, moved here and re-exported from `tennis/referee.ts`). Rewrite `returnQuality` as a mapping of `pickQuality` (late → `ace`, early → `early`, wrong → `wrong`, perfect → `clean`, good → `returned`). Run: `NODE_OPTIONS= pnpm exec vitest run src/features/games/engine/pick.test.ts src/features/games/tennis`. Expected: PASS, with `referee.test.ts` unchanged.
- [ ] **Step 3: `geometry.ts`.** Move `toWorld` and `feetFor` out of `tennis/3d/court.ts` (which re-exports them), and the local `clamp`, `lerp`, `ground` and `smooth` copies out of `rally.ts` and `sequence.ts`.
- [ ] **Step 4: `footwork.ts`.** Move `addClip`, `cut` (as `cutMoves`), `travel`, `recover` (as `recoverTo`), the per-player body of `walkShotlist` (as `walkBack`) and `tvFollowing` (as `followBall`) out of `tennis/3d/sequence.ts`. Tennis passes its gait: `{ shuffleLeft: "shuffleL", shuffleRight: "shuffleR", shufflePace: SHUFFLE_PACE, jog: "jog", sprint: "sprint", walk: "walk", ready: "ready" }` and `FACE[id]`. `sequence.ts` re-exports the moved constants, so `sequence.test.ts` stays unchanged.
- [ ] **Step 5: Check tennis is unchanged.** Run `NODE_OPTIONS= pnpm exec vitest run src/features/games`, then `NODE_OPTIONS= pnpm exec tsc --noEmit` and `NODE_OPTIONS= pnpm exec eslint src/features/games`. Expected: all green, with no tennis test edited.
- [ ] **Step 6: Commit.** `refactor(games): lift pick judging, court geometry and footwork out of tennis for badminton (Phase 8 badminton T2)`

---

### Task 3: Lift the React and scene pieces out of tennis (tennis unchanged)

**Files:**
- Create: `src/features/games/three/CameraRig.tsx`, `three/FloorShadow.tsx`, `three/cast.ts`, `three/venue.tsx`, `three/useRallyLoop.ts`, `src/features/games/frame/PickPair.tsx`
- Modify: `tennis/3d/scene.tsx`, `tennis/3d/Players.tsx`, `tennis/3d/Arena.tsx`, `tennis/Tennis3DScreen.tsx`, `tennis/TennisColumn.tsx`

**Interfaces:**
- Produces:
  - `CameraRig({ world, layout, tilt, fov })`: `world: RefObject<{ shotlist: { camera(t: number): CameraPose }; elapsed(): number } | null>`, with `tilt` and `fov` as `Record<GameLayout, number>`
  - `FloorShadow({ at, radius, opacity, fadeBy })`: `at: () => Vec3 | null` read each frame; a soft dark disc on the floor that fades with height (tennis's ball shadow)
  - `cast.ts`:
    - `poseCast<Id extends string>(athletes: Record<Id, Athlete>, actors: Record<Id, ActorTrack>, t: number): void`
    - `disposeCast(athletes: Athlete[], props: { dispose(): void }, assets: AthleteAssets): void`
  - `venue.tsx`:
    - `Flat({ at, size, y, color })`
    - `CourtLines({ layout, size: [w, d], texels: Record<GameLayout, number>, draw: (rect: (x, z, w, d) => void) => void, color, y })`: the one mipmapped line texture
    - `Boards({ walls: { at, size }[], height, band, color, volt })`: walls with the volt band, lifted 1 cm
    - `Stands({ sides, tiers, tread, rise, color })` and `seatOnStands(sides, stands): (rand, at) => void`
    - `HawkEyeMark({ world, color, y })`: the ellipse where `world.current.shotlist.mark` says
  - `useRallyLoop.ts`:
    - `stageCues(list: { cues: readonly { at: number; sound: SoundName }[]; buzz: readonly number[] }, now: number, at: (s: number, fn: () => void) => void, live: RefObject<{ audio: { play(n: SoundName): void }; desktop: boolean }>): void`
    - `useFirstPlay({ ready, firstMs, begin, timers }): void`: the first rally `firstMs` after the scene shows and the page's wipe is done (m-7)
    - `useHiddenTab({ onHidden, onVisible }): void`
  - `PickPair({ aims: { key: string; arrow: string; name: string; open: boolean }[], live: boolean, onPick: (key: string) => void })`: tennis's phone ← / → buttons, as they are drawn today

- [ ] **Step 1: Move the pieces** named above out of the tennis files, generalised only where badminton needs it (sizes, the line drawing, the walls and the stands passed in). Tennis passes today's values.
- [ ] **Step 2: Check tennis is unchanged.**
  1. Run `NODE_OPTIONS= pnpm exec vitest run src/features/games`, typecheck and lint.
  2. Run `NODE_OPTIONS= pnpm exec playwright test tests/e2e/tennis-3d.spec.ts --project=desktop-3d --project=mobile-3d -c <temp config>`, and `tests/e2e/tennis.spec.ts --project=desktop`. Expected: all PASS.
  3. Take one screenshot of `/arena/tennis` at 1440×900 and at 390×844 after the 3D shows. Each must match the same moment on `main`.
- [ ] **Step 3: Commit.** `refactor(three): lift the camera rig, the floor shadow, the cast, the venue pieces, the rally loop and the phone's pick buttons out of tennis (Phase 8 badminton T3)`

---

### Task 4: The rules, the 3D view and the copy (pure)

**Files:**
- Create: `src/features/games/badminton/3d/match.ts`, `match.test.ts`
- Modify: `src/features/games/badminton/view.ts`, `view.test.ts`, `src/content/ui-copy.ts`, `docs/launch/copy-review.md`

**Interfaces:**
- Consumes: `pickQuality`, `Judged`, `PickCall` (Task 2); `TOUCH_STRETCH` (re-exported from `tennis/referee.ts` today: move it to `engine/pick.ts` in this task, and re-export it from the tennis referee)
- Produces (`badminton/3d/match.ts`):
  - `type Dir = "deep" | "short"`
  - `type Player = "yash" | "you"`
  - `type RallyKind = "smash" | "drop" | "dive" | "placement" | "final"`
  - `type RallyCall = "early" | "late" | "wrong" | "read" | "winner" | "out" | "dive"`
  - constants:
    - `START = { yash: 17, you: 19 }`
    - `YOUR_MAX = 20`
    - `KINDS: readonly RallyKind[] = ["smash", "drop", "dive", "placement", "final"]`
    - `WINDOW_MS = { first: [1300, 1200, 1100, 1000, 900], second: [1000, 950, 900, 850, 800] }`
    - `SMASH_KMH = { smash: 348, final: 365 }`
    - `BADMINTON_3D_BEATS = { callMs: 1800, firstMs: 1500 }`
  - `interface Rally { server: Player; kind: RallyKind; winner: Player; call: RallyCall; shots: 3 | 4 | 5 | 6; picks: Judged[]; card: number | null }`
  - `interface MatchState { rallies: Rally[] }`, `MATCH_START`
  - functions:
    - `scoreOf(s): { yash: number; you: number }`
    - `matchOver(s)`: Yash has at least 21 and leads by 2
    - `serverOf(s): Player`: the last rally's winner, Yash first
    - `boxOf(s): "right" | "left"`: the server's score even is right
    - `kindOf(s): RallyKind`: `KINDS[yash wins]`
    - `outUsed(s): boolean`
    - `windowMs(pick: 0 | 1, s, layout): number`
    - `smashKmh(kind): number | null`
    - `judge(pick: { dir: Dir | null; atMs: number }, open: Dir, windowMs): Judged`
    - `needsSecond(s, first: Judged): boolean`
    - `decideRally(s, picks: readonly Judged[]): Rally`
    - `playRally(s, picks): MatchState`
    - `chargedOf(s): number`: `min(yash wins, 4)`
    - `allPicks(s): Judged[]`
- Produces (`view.ts`):
  - `type Badminton3dPhase = "ready" | "serve" | "window" | "struck" | "rally" | "called" | "verdict" | "end"`
  - `LIVE_3D: readonly Badminton3dPhase[] = ["serve", "window", "rally"]`
  - `interface BadmintonAim { dir: Dir; arrow: "↑" | "↓"; label: string; name: string; open: boolean }`
  - `interface Badminton3dParts { aims: [BadmintonAim, BadmintonAim]; speed: string | null; how: string; keys: string; hint: { stage: string; phone: string }; progress: string; loading: string }`
  - `type Badminton3dView = BadmintonView & { three: Badminton3dParts }`
  - `buildBadminton3dView(content, ui, routes, state: MatchState, run: { phase: Badminton3dPhase; open: Dir | null } & EndFlags): Badminton3dView`

**How a rally is decided** (`decideRally`; spec §3.2–§3.3). `on20` means you are on 20. `extra` is 1 when you serve, else 0.

| Picks | Kind | On 20 | Winner | Call | Shots |
|---|---|---|---|---|---|
| first not good | any | any | Yash | its call (`late`, `early`, `wrong`) | 3 + extra |
| first good | `dive` | any | Yash | `dive` | 3 + extra |
| first good | `smash` / `final` | yes, and (OUT used or `final`) | Yash | `read` | 5 + extra |
| first good | `drop` / `placement` | yes, and OUT used | Yash | `read` | 3 + extra |
| first good, second not good | not `dive` | no read | Yash | the second's call | 5 + extra |
| both good | not `dive` | no | you | `winner` | 4 + extra |
| both good | not `dive` | yes, OUT unused, not `final` | Yash | `out` | 4 + extra |

- `needsSecond(s, first)` is true only for the last three rows.
- A Yash win charges card `yash wins before it` while it is under 4 (the OUT rally too). The `final` rally charges none.

- [ ] **Step 1: Write the failing `match.test.ts`.** The helpers and the first tests:

```ts
const P = (q: Quality, call: PickCall): Judged => ({ q, call });
const perfect = P("perfect", "perfect");
const wrong = P("miss", "wrong");
const late = P("miss", "late");
/** Plays a whole game, each pick chosen from the state. */
function playOut(pick: (s: MatchState) => Judged): MatchState {
  let s = MATCH_START;
  while (!matchOver(s)) {
    const a = pick(s);
    s = playRally(s, needsSecond(s, a) ? [a, pick(s)] : [a]);
  }
  return s;
}

it("no input: four rallies, 21–19; Backend, Frontend, Data and Craft charge in order", () => {
  const s = playOut(() => late);
  expect(scoreOf(s)).toEqual({ yash: 21, you: 19 });
  expect(s.rallies.map((r) => r.kind)).toEqual(["smash", "drop", "dive", "placement"]);
  expect(s.rallies.map((r) => r.card)).toEqual([0, 1, 2, 3]);
  expect(s.rallies.map((r) => r.shots)).toEqual([3, 3, 3, 3]);
});

it("perfect picks: 22–20 in six rallies: WINNER, OUT, HE READ IT, WHAT A DIVE, HE READ IT, HE READ IT", () => {
  const s = playOut(() => perfect);
  expect(scoreOf(s)).toEqual({ yash: 22, you: 20 });
  expect(s.rallies.map((r) => r.call)).toEqual(["winner", "out", "read", "dive", "read", "read"]);
  expect(s.rallies.map((r) => r.server)).toEqual(["yash", "you", "yash", "yash", "yash", "yash"]);
  expect(s.rallies.map((r) => r.kind)).toEqual(["smash", "smash", "drop", "dive", "placement", "final"]);
  expect(s.rallies.map((r) => r.card)).toEqual([null, 0, 1, 2, 3, null]);
  expect(s.rallies.map((r) => r.shots)).toEqual([4, 5, 3, 3, 3, 5]);
});
```

  The rest, by name and what each asserts:
  - `"whatever you press, Yash wins 21–19 or 22–20, you never pass 20, and a rally has at most 2 picks and 6 shots"`: a depth-first walk over every game where each pick is `perfect`, `wrong` or `late`. At each end: the score is `21–19` or `22–20`, at most one `out`, no `out` in a `final` rally, at most 6 rallies, every `shots` ≤ 6, every `picks.length` ≤ 2, and the cards charged are `[0, 1, 2, 3]` in order. Use a 30 s timeout.
  - `"a rally is yours only with two good picks, on 19, outside the Data rally"`: one rally from `MATCH_START` with `[perfect, perfect]` gives `you`. The same pair after three late rallies (the `dive` kind) is decided by `[perfect]` alone (`needsSecond` is false) and called `dive`.
  - `"the Data rally: a good, late or early pick brings the dive; a wrong one is blocked"`: from three late rallies, `[perfect]` → `dive`, `[late]` → `late`, and `[wrong]` → `wrong`, each Yash's with card 2.
  - `"real serving: the winner serves, from the right box on an even score"`: `serverOf(MATCH_START)` is `yash` and `boxOf` is `left` (17). After your rally: `you` and `right` (20).
  - `"windows shrink with Yash's wins and are 25 % longer on the column"`: `windowMs(0, MATCH_START, "stage")` is 1300, `windowMs(1, MATCH_START, "column")` is 1250, and after four Yash wins `windowMs(0, s, "stage")` is 900.
  - `"the speed gun reads only Yash's smashes"`: `smashKmh("smash")` is 348, `smashKmh("final")` is 365, and `smashKmh("drop")` is null.
- [ ] **Step 2: Run it, see it fail, implement `match.ts`, and see it pass.** Run: `NODE_OPTIONS= pnpm exec vitest run src/features/games/badminton/3d/match.test.ts`.
- [ ] **Step 3: The copy.** Add `ui.games.badminton.three` (all `// derived (Phase 8)`):

```ts
three: {
  loading: "PREPARING THE HALL",
  how: "Send it where he isn't: deep or short.",
  keys: "↑ ↓",
  hint: { stage: "↑ ↓ OR CLICK", phone: "TAP OR SWIPE ↑ ↓" },
  progress: "HIS RALLIES CHARGE THE ATTRIBUTES",
  aim: {
    deep: "SMASH",
    short: "DROP",
    open: "OPEN COURT",
    to: { deep: "Send it deep: smash", short: "Send it short: drop" },
    openName: "open court",
    dash: "—",
  },
  status: { yourMatchPoint: "YOUR MATCH POINT", all: "20 ALL" },
  calls: {
    early: "TOO EARLY.",
    late: "TOO LATE.",
    wrong: "WRONG SHOT.",
    read: "HE READ IT.",
    winner: "WINNER.",
    out: "OUT.",
    dive: "WHAT A DIVE.",
  },
  speed: "SMASH",
  comm: {
    smash: "Jump smash.",
    drop: "Drop shot. Dead at the net.",
    dive: "Full stretch. He gets everything back.",
    placement: "Court vision. Into the empty corner.",
    final: "Jump smash to finish it.",
    charged: "charged.",
    anyway: "charged anyway.",
    all: "Twenty all. Nerves of steel.",
  },
},
```

  Also:
  - The Hub's badminton card: `duration: "~40s"`, and `blurb: "Rally with me in 3D. Every rally I win charges one of my player attributes."`
  - The page description: `"Play the end of a badminton game against Yash. Every rally he wins charges a group of his skills."`
  - Reused, not copied: `ui.games.tennis.three.comm.yourPoint`, `.out` and `.game`, and `ui.games.badminton.matchPoint`, `.status.game` and `.upNext`.
  - List every new line in `docs/launch/copy-review.md` (update the header and footer counts).
- [ ] **Step 4: Write the failing view tests** in `view.test.ts` (the 2D tests are not touched):
  - `"3D: before the first rally the bug reads 17–19 and RALLY 1; nothing is called or charged"`
  - `"3D: the status reads MATCH POINT at 20–19 (alert), YOUR MATCH POINT at 17–20 (alert), 20 ALL at 20–20, and GAME YASH at the end"`
  - `"3D: the aims are ↓ DROP then ↑ SMASH; in a window the open one is lit, reads OPEN COURT and is named 'Send it deep: smash — open court'"`
  - `"3D: the toasts charge in content order, each eyebrow naming the rally that charged it; the next reads UP NEXT and the later ones their shot"`
  - `"3D: comm after a smash win is 'Jump smash. Backend charged.'; after the OUT, 'Hawk-Eye says out. By a whisker. Backend charged anyway.'"`
  - `"3D: the speed line reads YASH · SMASH · 348 KM/H only while a smash win is called"`
  - `"3D: saved is the real score: 21–19, or 22–20"`
  - `"3D: the announcement is the call and the score, then what was charged: 'TOO LATE. 18–19. Backend charged: Java, Spring Boot, JUnit.'"`
- [ ] **Step 5: Implement `buildBadminton3dView`.** It shares the chrome, the charged-toast mapping, the end and the announcer with `buildBadmintonView`. Lift a shared helper inside `view.ts` if one is needed, without changing the 2D output. `meter`, `hold` and `reading` keep the 2D's values; they are not drawn in 3D. Run: `NODE_OPTIONS= pnpm exec vitest run src/features/games/badminton`. Expected: PASS, with the 2D tests unchanged.
- [ ] **Step 6: Commit.** `feat(badminton): the 3D game's rules, view and copy (Phase 8 badminton T4)`

---

### Task 5: The court and the shuttle's flight (pure)

**Files:**
- Create: `src/features/games/badminton/3d/court.ts`, `shuttle.ts`, `shuttle.test.ts`

**Interfaces:**
- Produces (`court.ts`). Real sizes in m. y is up. z runs from Yash's back line (−) through the net (0) to yours (+). x is your right, as the camera sees it.
  - `COURT = { half: 6.7, singles: 2.59, doubles: 3.05, shortService: 1.98, longDoubles: 0.76, line: 0.04, net: { centre: 1.524, post: 1.55, postX: 3.05 }, runoff: { back: 2.0, side: 1.5 } }`
  - `GRAVITY = 9.81`
  - `FACE: Record<Player, number> = { yash: 0, you: Math.PI }`
  - `netHeightAt(x)`
  - `boxX(player: Player, box: "right" | "left"): number`: the sign of a player's box. Yash's right is −x, and your right is +x.
  - places (starting values, tuned by eye in Task 9):
    - `SERVE_SPOT_Z = 3.0`, `RECEIVE_Z = 3.5`, `BOX_X = 0.55`
    - `BASE_Z = 3.6`
    - `SET_Z: Record<Dir, number> = { deep: 2.6, short: 4.6 }`: where Yash stands when that part is open (forward leaves the back open)
    - `CONTACT_Z = { overhead: [4.6, 5.6], mid: [3.0, 4.0] }`
  - `CAMERA = { tv: { position: [0, 9.5, 15.5], target: [0, 1.0, -0.5] }, fov: { stage: 34, column: 50 }, tilt: { stage: 0, column: 4 }, pan: 0.2, game: { position: [0, 3.2, 4.5], target: [0, 1.2, -6] } }`
- Produces (`shuttle.ts`):
  - constants:
    - `TAU = 0.65` (the drag's time constant, s)
    - `NET_CLEAR = 0.1`, `NET_SKIM = 0.03`
    - `OUT_BY = { min: 0.02, max: 0.05 }`
    - `TURNOVER = 0.06`
    - `SHUTTLE = { length: 0.085, cork: 0.0135, skirt: 0.0325 }`
    - `DRAWN = 1.6`
  - `interface ShuttlePath { end: number; at(t: number): Vec3; velocity(t: number): Vec3; lands: Vec3 | null }`
  - `flyTo(from: Vec3, to: Vec3, flight: number): ShuttlePath`: through `to` at `flight`, then on along the same curve to the floor (`end` is its landing)
  - `flyToFloor(from: Vec3, land: readonly [x: number, z: number], flight: number): ShuttlePath`: lands at `land` at `flight`
  - `netGap(path: ShuttlePath): number | null`: height above the tape where it crosses z = 0 (null if it does not)
  - `heading(prev: ShuttlePath | null, path: ShuttlePath, t: number): Vec3`: the cork's direction, unit. It is the flight's direction, eased from the reverse of `prev`'s end over `TURNOVER`.

**The maths** (the builder's call allowed by spec §5.4, starting here). Drag in proportion to speed, closed form. With `k = 1 − e^(−t/τ)`:
- `x(t) = x0 + vx·τ·k`
- `y(t) = y0 + (vy + g·τ)·τ·k − g·τ·t`

Solving for the start velocity, given the end point at time `T`, with `K = 1 − e^(−T/τ)`:
- `vx = Δx / (τ·K)`
- `vy = (Δy + g·τ·T) / (τ·K) − g·τ`

- [ ] **Step 1: Write the failing `shuttle.test.ts`:**
  - `"flyTo reaches its point at its time"`: `at(flight)` is within 1 mm of `to` for a serve `[−0.55, 0.9, −3]` → `[0.4, 2.55, 5.4]` in 1.5 s.
  - `"it slows sharply and falls steeply"`: at the end of that serve, the speed is under 35 % of the start speed, and the fall is steeper than 60° from the floor.
  - `"a clear clears the net by NET_CLEAR or more"`: `netGap` is at least 0.1.
  - `"flyToFloor lands where and when it was solved to"`: `lands` and `at(flight)[1]` ≈ 0.
  - `"an OUT lands OUT_BY past the line's outer edge"`: landing at `COURT.half + OUT_BY.min` is past the back line.
  - `"the shuttle turns cork first within TURNOVER"`: `heading` at 0 points back along `prev`'s end. At `TURNOVER` it is within 2° of the new flight's direction.
- [ ] **Step 2: Implement `court.ts` and `shuttle.ts`.** Run: `NODE_OPTIONS= pnpm exec vitest run src/features/games/badminton/3d/shuttle.test.ts`. Expected: PASS.
- [ ] **Step 3: Commit.** `feat(badminton): the hall's court and the shuttle's flight (Phase 8 badminton T5)`

---

### Task 6: The moves, the racket, the shuttle and the reach (Opus builder, high effort)

The heart of the game: the owner's first ask is that every move looks smooth and clean.

**Files:**
- Create: `src/features/games/badminton/3d/timing.ts`, `moves.ts`, `props.ts`, `reach.ts`, `PoseLab.stories.tsx`

**Interfaces:**
- Consumes: `poseClip`, `BONES`, `LIBRARY_CLIPS` (`three/`), and tennis's `moves.ts` and `PoseLab.stories.tsx` as a pattern to read (never import them)
- Produces (`timing.ts`; starting values, which the builder may move to fit the poses, keeping `SWING_LEAD` at 0.2):

```ts
export const SERVE_CLIP = { drop: 0.25, contact: 0.55, end: 1.3 } as const; // the left hand lets go of the feathers at `drop`
export const OVERHEAD_CLIP = { commit: 0.45, contact: 0.65, end: 1.4 } as const; // clear, drop and smash share it
export const JUMP_SMASH_CLIP = { takeoff: 0.35, commit: 0.5, contact: 0.7, land: 0.95, end: 1.6 } as const;
export const NET_CLIP = { contact: 0.45, end: 1.2 } as const; // a lunge
export const LIFT_CLIP = { contact: 0.45, end: 1.2 } as const;
export const BLOCK_CLIP = { contact: 0.25, end: 0.9 } as const;
export const DIVE_CLIP = { launch: 0.15, contact: 0.4, floor: 0.6, up: 1.5, end: 1.8 } as const;
export const STRETCH_CLIP = { reach: 0.35, end: 1.1 } as const;
export const SPLIT_CLIP = { end: 0.3 } as const;
export const FIST_PUMP_CLIP = { end: 1.4 } as const;
export const SHUFFLE_PACE = 1.8;
/** A mistimed swing meets the shuttle off the frame this much later or earlier on its path (ruling P7). */
export const FRAME = { late: 0.12, early: 0.1 } as const;
export const SWING_LEAD = OVERHEAD_CLIP.contact - OVERHEAD_CLIP.commit;
export type BadmintonClip =
  | "idle" | "walk" | "jog" | "sprint" | "crouch"
  | "ready" | "split" | "shuffleL" | "shuffleR"
  | "serve" | "overhead" | "jumpSmash" | "net" | "lift" | "block" | "dive"
  | "stretchF" | "stretchB" | "fistPump";
export type Stroke = "serve" | "overhead" | "jumpSmash" | "net" | "lift" | "block" | "dive";
```

- Produces (`moves.ts`): `MOVE_KEYS: Record<made clip, readonly PoseKey<BoneKey>[]>` and `buildBadmintonClips(rest, moves): AnimationClip[]`. These are the moves of spec §5.2, keyed on the beats above:
  - The serve is a forehand underarm high serve: the shuttle is held by its feathers in the left hand and dropped, with contact below 1.15 m.
  - The overhead is side-on, with the racket arm back and the left arm pointing up. The same preparation serves the clear, the drop and the smash.
  - The jump smash takes off from both feet and lands with the scissor kick (the legs swap in the air).
  - The dive goes forward, low and full length. It lands on the forearms and chest, slides a little, and gets up through one knee to the ready stance by `up`.
  - The net shot is a front-foot lunge, heel first.
- Produces (`props.ts`):
  - `RACKET = { length: 0.665, head: [0.23, 0.2], shaft: 0.0035, frame: 0.006, grip: { radius: 0.013, length: 0.2 } }`
  - `makeBadmintonProps(c)`, giving `racket(a, frame)`, which returns the sweet-spot `Object3D`, plus `shuttle(): Group` and `dispose()`. The racket is held in the right hand with a handshake grip.
  - The shuttle is a white cork with a skirt of 16 feathers, `SHUTTLE`'s size, drawn ×`DRAWN`, pointing +z (cork first).
- Produces (`reach.ts`):
  - `interface Reach { serve; overhead; jumpSmash; net; lift; block; dive: Vec3; hold: Vec3 }`
  - `measureReach(assets, clips): Reach`, measured on the real body at each contact beat. `hold` is the left hand at `SERVE_CLIP.drop`.

- [ ] **Step 1: Write the key poses, the racket, the shuttle and `measureReach`**, following tennis's method: whole-body keys on the beats, the planted feet at the same place in each key, and the eyes on the shuttle. Check each move against spec §5.3's seven points.
- [ ] **Step 2: `PoseLab.stories.tsx`** (dev only, like tennis's): each move alone, scrubbable, from the TV view and from the side.
- [ ] **Step 3: Measure and record.** Print `measureReach` and add the values to the file's doc comment, as tennis's §10.5 has them. The overhead contact is at least 2.4 m high, the jump smash's at least 2.8 m, and the serve's at most 1.15 m.
- [ ] **Step 4: Check.** Run typecheck, lint, and `NODE_OPTIONS= pnpm exec vitest run src/features/games/three`. Open the Pose Lab on port 4184 and take a screenshot of each move at its contact beat.
- [ ] **Step 5: Commit.** `feat(badminton): the moves, the racket, the shuttle and the measured reach (Phase 8 badminton T6)`

---

### Task 7: One rally's script (pure, Opus builder)

**Files:**
- Create: `src/features/games/badminton/3d/rally.ts`, `rally.test.ts`

**Interfaces:**
- Consumes:
  - `MatchState`, `Dir`, `Judged`, `RallyKind`, `serverOf`, `boxOf`, `kindOf`, `outUsed`, `windowMs`, `scoreOf` (Task 4)
  - `COURT`, places, `FACE`, `boxX` (Task 5)
  - `flyTo`, `flyToFloor`, `ShuttlePath`, `OUT_BY` (Task 5)
  - the clip beats, `SWING_LEAD`, `FRAME`, `Stroke` (Task 6)
  - `Reach` as a type only (Task 6)
  - `feetFor`, `toWorld`, `lerp` (Task 2)
- Produces:
  - `interface RallySetup { server: Player; box: "right" | "left"; first: boolean; kind: RallyKind; on20: boolean; outUsed: boolean; windows: [number, number]; open: [Dir, Dir]; draws: number[] }`: the windows are in s with the layout applied, and `draws` is 8 numbers in [0, 1)
  - `setupRally(s, layout, luck): RallySetup`
    - `open[0]` is drawn, except `smash` and `final` (`"deep"`) and `dive` (`"short"`)
    - `open[1]` is `"deep"`: he is on the floor after his dive
  - `interface Decision { j: Judged; dir: Dir | null; at: number }`, `interface Decided { first?: Decision; second?: Decision }`
  - `interface Swing { by: Player; kind: Stroke | "stretch"; contact: number; spot: Vec3; face: number; meets: boolean; frame?: "late" | "early"; side?: "left" | "right" }`
  - `interface Flight { start: number; path: ShuttlePath }`
  - `interface Window { opens: number; commits: number; open: Dir }`
  - `interface RallyScript { setup; serveAt: number; windows: Window[]; swings: Swing[]; flights: Flight[]; recovers: { by: Player; start: number; end: number; to: Vec3 }[]; contacts: number[]; dive: number | null; end: number | null; mark: { at: Vec3; from: number } | null }`
  - `scriptRally(setup, decided, reach): RallyScript`

**The shots** (spec §3.2–§3.3). When you serve, two shots come first: your automatic high serve, then Yash's high clear. Yash's clear then stands in for his serve below.

1. **Yash's high serve** to your overhead contact (`CONTACT_Z.overhead`). Window 1 opens at its contact and commits `windows[0]` later. Yash recovers to `SET_Z[open[0]]`.
2. **Pick 1, not good:**
   - **Late or early:** your swing is off the frame (`FRAME`, ruling P7). The shuttle floats up weakly to `CONTACT_Z.mid` on his side. In the `dive` rally it dribbles just over the net instead (lands within 1 m of it).
   - **Wrong:** the shot you picked goes where he is waiting. In the `smash` and `final` rallies it floats up to `CONTACT_Z.mid` whatever you picked (spec §3.3).
   - Then Yash's **card shot** ends it, and you stretch for it as it goes by (as tennis's put-away):

| Kind | Yash's last shot |
|---|---|
| `smash`, `final` | `jumpSmash` to the floor away from you |
| `drop` | `overhead` drop, or a `net` tumbling shot if he is at the net. A `block` if your smash came at him. Lands within 1.2 m of the net. |
| `dive` | `dive` scoop tight over the net (after a frame dribble), or a `block` dead at the net (after a wrong smash) |
| `placement` | to the corner furthest from you, usually cross-court (`overhead` from the back, `lift` from the net, `block` from your smash) |

3. **Pick 1 good:**
   - **In the `dive` rally:** your drop beats him. He dives, and his scoop lands just over the net, out of your reach. That ends it.
   - **A read** (`on20`, and OUT used or `final`): he takes it comfortably and ends with his card shot. In `smash` and `final` that is three shots: a `block` to the net, your automatic weak `lift` to `CONTACT_Z.mid`, then his `jumpSmash`.
   - **Otherwise** he is stretched. Your drop gets a forward dive and your smash a side dive (the same `dive` clip, turned toward the shuttle). His scoop pops the shuttle up to your mid-court. Window 2 opens at the scoop and commits `windows[1]` later.
4. **Pick 2:**
   - **Good, not `on20`:** your smash lands in the empty court while he is down. You win.
   - **Good, `on20`:** it lands `OUT_BY` past the back line or a sideline (chosen from `draws`), and `mark` is set.
   - **Not good:** your shot floats up to `CONTACT_Z.mid`. He is up (`DIVE_CLIP.up`) and plays the card shot.

**Rules every script keeps** (each a test):
- `"the shuttle is at the striker's sweet spot at every contact"`: within 1 cm. Each `meets` swing's spot plus its reach, at its face, is where the flight is at that contact.
- `"every overhead flight clears the net by NET_CLEAR; net shots and scoops by NET_SKIM"`
- `"every flight from Yash to you reaches your contact at the window's end plus SWING_LEAD"`
- `"the serve's contact is below 1.15 m"`
- `"Yash is up from his dive before his next contact"`: his next contact is at least `DIVE_CLIP.up − DIVE_CLIP.contact` after the dive's, plus his move.
- `"a rebuild never changes the past"`: scripting with a decision at `at` gives the same flights and swings before `at` as without it.
- `"shots match the rules"`: for every path of Task 4's table, the number of contacts equals `decideRally`'s `shots`.
- `"the rally kinds end on their card shots"`: `smash` and `final` end on `jumpSmash`, and `dive` on `dive` or `block`, except a rally you win or the OUT.

- [ ] **Step 1: Write the failing `rally.test.ts`** with the eight tests above. Sweep every kind × each path of pick 1 and pick 2 (`perfect`, `wrong`, `late`, `early`), at both layouts, with a fixed `luck`. Use 30 s timeouts.
- [ ] **Step 2: Implement `rally.ts`** until they pass. Run: `NODE_OPTIONS= pnpm exec vitest run src/features/games/badminton/3d/rally.test.ts`.
- [ ] **Step 3: Commit.** `feat(badminton): one rally's script: serves, picks, the dive, the card shots (Phase 8 badminton T7)`

---

### Task 8: The shotlists (pure, Opus builder)

**Files:**
- Create: `src/features/games/badminton/3d/sequence.ts`, `sequence.test.ts`
- Modify: `src/shell/audio.tsx`, `src/shell/synth.ts` (the two new sound names and their code-made sounds)

**Interfaces:**
- Consumes: Task 7's script, the Task 2 footwork (`Gait`, `travel`, `recoverTo`, `walkBack`, `followBall`, `addClip`), `CAMERA` (Task 5), `heading` (Task 5), the beats (Task 6), and `BADMINTON_3D_BEATS` (Task 4)
- Produces:
  - `type Track = ActorTrack<BadmintonClip>`
  - `type Sound = "shuttle" | "squeak" | "applause" | "ooh"`, with `SOUNDS_ARE_NAMES` (tennis's compile-time check). This task adds `shuttle` and `squeak` to `SoundName` in `src/shell/audio.tsx`, with their code-made sounds in `synth.ts` (P9: `shuttle: net`, and `squeak` as a 60 ms sine sweep from 2.4 to 3.2 kHz at a low level). Task 10 adds only the recordings.
  - `interface Shotlist { end: number; shuttle(t): { at: Vec3; heading: Vec3 } | null; held(t): Player | null; actors: Record<Player, Track>; camera(t): CameraPose; glow(t): { part: Dir; strength: number } | null; mark: { at: Vec3; from: number } | null; cues: { at: number; sound: Sound }[]; buzz: number[] }`
  - `readyShotlist(setup): Shotlist`
  - `rallyShotlist(script, reach): Shotlist`
  - `walkShotlist(after: Shotlist, next: RallySetup | null): Shotlist`: GAME when `next` is null (fist pump, the camera pushes in)

**What the shotlist does:**
- **Moves:** the split step at the other's hit, then the run (the shared `travel`, with badminton's gait) arriving as the forward swing starts, then the stroke and the recovery. Tennis rulings R13 and R15 apply.
- **The dive:** it plays from where he stands, turned toward the shuttle. He stays where the slide leaves him (the clip's hips carry him, as tennis's serve landing does) and gets up there.
- **The held shuttle:** the server holds it in his left hand until `SERVE_CLIP.drop`. It then falls freely onto the racket at the serve's contact.
- **Sounds:**
  - `shuttle` at every contact
  - `squeak` at each lunge's plant, each sharp stop, and the dive's landing (at most one in any 0.3 s)
  - `ooh` at the Hawk-Eye mark
  - `applause` 0.3 s before the end of every rally except the one that ends the game
- **The glow** is on Yash's half, the open part (P1), from the window's opening until its commit plus `SWING_LEAD`, rising over 0.15 s.
- **The camera:** the TV view, panning with the shuttle (`followBall`).

- [ ] **Step 1: Write the failing `sequence.test.ts`:**
  - `"the shuttle is held, dropped onto the racket, then follows each flight"`
  - `"no clip snaps: every clip change has a fade of at least 0.05 s"`
  - `"no foot slides: a run's clip speed matches its ground speed (shuffle, jog or sprint pace)"`
  - `"the dive's player stays down until DIVE_CLIP.up, then ready"`
  - `"the cues: shuttle at every contact, ooh at the mark, applause before every end but the last"`
  - `"the glow lights the open part while a window is open"`
  - `"walkShotlist: both are at the next rally's places by the end of the call"`
  - `"a rebuild never changes the past"` (30 s timeout)
- [ ] **Step 2: Implement `sequence.ts`** until they pass. Run: `NODE_OPTIONS= pnpm exec vitest run src/features/games/badminton/3d/sequence.test.ts`.
- [ ] **Step 3: Commit.** `feat(badminton): the shotlists: footwork, the dive, the shuttle in hand, sounds and the camera (Phase 8 badminton T8)`

---

### Task 9: The 3D hall, the scene and the owner's moves checkpoint

**Files:**
- Create: `src/features/games/badminton/3d/Hall.tsx`, `Players.tsx`, `scene.tsx`, `world.ts`, `RallyLab.stories.tsx`
- Modify: `court.ts` (`CAMERA` and the places only, tuned by eye)

**Interfaces:**
- Consumes: Task 3's `CameraRig`, `FloorShadow`, `poseCast`, `disposeCast` and `venue.tsx`; `GameCanvas` (with `antialias`); `Crowd`; `useGroundSpots`; and Tasks 5–8
- Produces:
  - `world.ts`: `interface WorldState { shotlist: Shotlist; elapsed(): number; crowdUp: boolean }`
  - `scene.tsx`: `interface BadmintonAssets { body; clips; skin; reach: Reach }`, `loadBadmintonAssets(onProgress)`, `BadmintonScene(props: SceneProps<BadmintonAssets, WorldState>)`
  - `Players.tsx`: both players in tennis's kits (Yash dark with volt trims, you light, both in shorts, white shoes), each with a racket. Yash wears tennis's headband and wristband look, made in badminton's `props.ts`.

**The look** (spec §5.1, colours all tokens):
- a green court mat (`--ref-court-hall` as the start) on a dark hall floor (`--hall`)
- one mipmapped line texture with all of spec §5.1's lines
- the net with its white tape and the posts on the doubles sidelines
- LED boards 0.9 m high around the run-off, with the volt band
- stands on the two long sides and the far end, with the shared crowd (half on phones)
- a dark ceiling with rows of emissive light panels, a hemisphere light and one shadow-casting light from above, with no masts
- the shuttle with its `FloorShadow`, and the open part's glow
- the `HawkEyeMark`

- [ ] **Step 1: Build the hall, the players, the shuttle and the scene.** The shuttle is oriented by `heading`.
- [ ] **Step 2: `RallyLab.stories.tsx`** (dev only, like tennis's PointLab): any rally kind × any pick path plays on a loop, on the stage and on the column.
- [ ] **Step 3: Tune the camera and the places by eye.** The whole court, Yash's head and your whole body must be in frame on the stage at 1440×900, and above the thumb zone on the column at 390×844.
- [ ] **Step 4: Record the owner's checkpoint videos** on the GPU (Chromium with `--use-angle=metal --enable-gpu --ignore-gpu-blocklist`, tennis §10.7), desktop 1440×900 and phone 390×844:
  - a full rally with the dive (the `smash` kind, pick 1 good, pick 2 late)
  - the jump-smash rally (the `smash` kind, pick 1 late)

  Save them in the scratchpad, and report the paths and the measured frame rate.
- [ ] **Step 5: Check.** Run typecheck, lint, and `NODE_OPTIONS= pnpm exec vitest run src/features/games/badminton`.
- [ ] **Step 6: Commit.** `feat(badminton): the 3D hall, the players and the shuttle (Phase 8 badminton T9)`
- [ ] **Step 7: OWNER CHECKPOINT.** The controller shows Yash the Pose Lab screenshots and the two videos. Changes he asks for go to a builder (Opus for the moves) before Task 11.

---

### Task 10: Sounds: Yash's picks

**Files:**
- Modify: `src/shell/audio.tsx` (only for a new ambience track), `src/shell/gameSound.ts`, `public/audio/CREDITS.md`
- Create: `public/audio/shuttle.mp3`, `public/audio/squeak.mp3`, and `public/audio/hall.mp3` / `hallApplause.mp3` only if Yash picked new ones (ruling P9)

- [ ] **Step 1: Ship the picks** with the trims and levels of their candidates. Credit each in `CREDITS.md`.
- [ ] **Step 2: Wire the recordings.**
  - `GAME_FILES` and `RECORDED` gain `shuttle` and `squeak` (the names exist since Task 8). Their `GAME_LEVELS` are 0.9 and 0.5.
  - `AmbienceTrack` gains `hall` only if a new hum was picked.
- [ ] **Step 3: Check.** Run `NODE_OPTIONS= pnpm exec vitest run src/shell src/features/games/badminton`, typecheck and lint.
- [ ] **Step 4: Commit.** `feat(sound): the shuttle hit, the shoe squeak and the hall's hum (CC0, picked by Yash) (Phase 8 badminton T10)`

---

### Task 11: The 3D game: the screen, the one 2D/3D choice, the controls (Opus builder)

**Files:**
- Create: `src/features/games/badminton/Badminton3DScreen.tsx`, `BadmintonGame.tsx`, `tests/e2e/badminton-3d.spec.ts`
- Modify:
  - `BadmintonPage.tsx`, `BadmintonStage.tsx`, `BadmintonColumn.tsx`
  - `app/routes/arena.badminton.tsx`
  - `tests/e2e/support/three.ts`, `tests/e2e/smoke.spec.ts`, `tests/e2e/webkit-smoke.spec.ts`

**Interfaces:**
- Consumes: everything above, and Task 3's `useRallyLoop` and `PickPair`
- Produces:
  - `BadmintonThree { status; drawn; progress; scene; layout; live: boolean; parts: Badminton3dParts }`: tennis's `TennisThree` with the view's 3D parts
  - `BadmintonGame()`: `useThreeGate` with `loadOnce(() => import("./3d/scene"))`, giving `<BadmintonScreen />` when off and `<Badminton3DScreen gate={gate} />` otherwise

**The screen** follows `Tennis3DScreen` (read it first) with the shared hooks:
- **Phases:** `ready` → `serve` (Yash's serve clip, or your serve and his clear, under way; a pick is TOO EARLY) → `window` → `struck` → `rally` (after a good pick 1, until window 2 opens; a pick is TOO EARLY for pick 2) → `window` → `struck` → `called`, and on to the next rally or `verdict` → `end`.
- **Keys:** ↑ picks `deep`, ↓ picks `short`, only in `LIVE_3D` plus `struck` (a press in `struck` is swallowed and does nothing).
- **Saving:** the end is saved at once with `{ score: view.saved, form: perfectShare(allPicks(next)) }`, and the cheer plays.
- **The hum:** `useThreeScreen`'s `hum` is the hall's (P9).
- **Prefetch:** `shuttle`, `squeak`, `applause`, `ooh` and the hum.
- **Rematch:** no cut. The players walk from where GAME left them to the first rally's places (`walkShotlist`), the camera eases back to the TV view, and the score returns to 17–19 (spec §6.6, as tennis).

**The board:**
- **Stage:**
  - The scene replaces the backdrop once it is ready. The 2D art, rings, tag, tracer, power meter and HOLD button are not drawn.
  - The left `Glass` panel (the power meter's place) shows `parts.how` and `parts.keys`, in the style of tennis's instructions panel.
  - The two `AimZone`s (`↓ DROP`, `↑ SMASH`) sit together low in the centre, in tennis's place, with `parts.hint.stage` under them. While the 3D loads, the loader holds their place.
  - The speed line (`parts.speed`) is a `PlayerTag` in tennis's serving-line spot.
  - The toasts stay on the right.
- **Column:**
  - The scene fills the screen behind everything.
  - The thumb zone has `parts.hint.phone` and the shared `PickPair`.
  - The field takes a vertical swipe (touch or pen, more than 40px, more up or down than across): up is `deep` and down is `short`. While `three.live` the field is `touch-none`, otherwise `touch-pan-y`.

**The e2e** (`badminton-3d.spec.ts`, on the desktop-3d and mobile-3d projects, following `tennis-3d.spec.ts`; add `pickDir`, `pickOpenDir` and `pickWrongDir` to `support/three.ts`):
- [ ] **Step 1: Write the tests:**
  - `"the loader shows while the files download, then one canvas; nothing moves when the 3D arrives"`
  - `"no input: four rallies, 21–19, the four cards charged, and 21–19 saved"`
  - `"perfect play: WINNER at 17–20, then OUT, and 22–20 saved"`
  - `"Review Focus 1: mashing is TOO EARLY once; a press in the routine, the call or while your swing is under way does nothing"`
  - `"Review Focus 2: a hidden tab drops the rally; back, it is played again fresh and counts once"`
  - `"Review Focus 3: resizing across 1200px mid-rally keeps one canvas, and the rally counts once"` (desktop-3d only)
  - `"Review Focus 4: a swipe up in a window picks SMASH once; a swipe outside a window does nothing"` (mobile-3d only)
  - `"Review Focus 5: SKIP mid-rally leaves cleanly, no sound after, and coming back downloads nothing again"`
  - `"accessibility: the 3D page in a window has no violations"`
- [ ] **Step 2: Build the screen, the game, the board's `three` prop and the route** until they pass. Run: `NODE_OPTIONS= pnpm exec playwright test tests/e2e/badminton-3d.spec.ts --project=desktop-3d --project=mobile-3d -c <temp config>`.
- [ ] **Step 3: The first-load guard and the smoke tests.** `smoke.spec.ts` checks `/arena/badminton` too (no first-load chunk contains `three`). `webkit-smoke.spec.ts` gives badminton the 30 s thumb timeout the 3D games have. Run `tests/e2e/badminton.spec.ts`, `smoke.spec.ts` and `hub.spec.ts` on the `desktop` project. Expected: PASS, and the 2D badminton tests unchanged.
- [ ] **Step 4: Check everything once.** Run `NODE_OPTIONS= pnpm verify`. Expected: green, apart from the known flakes (`hub.spec` ~656, `intro.spec` ~293, `tennis.spec:668`). If one of those fails, re-run it alone and report.
- [ ] **Step 5: Commit.** `feat(badminton): the 3D game: the end of a real game, deep or short, the 2D game kept as the backup (Phase 8 badminton T11)`

---

### Task 12: Lighthouse and the as-built notes

**Files:**
- Modify: `tools/lighthouse.mjs`, `docs/superpowers/specs/2026-10-22-phase-8-badminton-3d-design.md` (a new §10 As built), `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md` (§8.3 points to the badminton spec, as §8.2 does to tennis's)

- [ ] **Step 1: Give badminton tennis's four Lighthouse runs:** gated with WebGL off (desktop with `{ ...FRESH, fcp: 1500, cls: 0.1 }`, plus phone), and 3D with SwiftShader, reported only. Run `LIGHTHOUSE_ONLY=/arena/badminton`. Expected: desktop performance at least 90, phone at least 80, accessibility 100, and best practices and SEO at least 90. If a gate fails, stop and report.
- [ ] **Step 2: Write §10 As built**, in tennis's §10 shape:
  - the Lighthouse table
  - the sizes (the scene chunk; the shared 3D chunk unchanged)
  - the camera
  - the measured reach
  - the moves and the sounds
  - the rulings P1–P9 and every ruling made while building, in plain words
  - what is known and left for later
- [ ] **Step 3: Commit.** `docs: Phase 8 badminton as built (Lighthouse, sizes, camera, reach, rulings)`
