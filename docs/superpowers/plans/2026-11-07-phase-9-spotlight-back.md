# Phase 9: Yash's Work in the Spotlight + a Back Button — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** In all three games, every point Yash wins puts what it unlocks (a career innings, a project and its impact, a skill group) big in the centre of the screen for 4.5 s with a sound and a glow, then slides it to its card's place; a point the visitor wins says "WELL PLAYED."-style words; the shot words (WINNER, OUT, WRONG SIDE, HE READ IT, SIX, ...) are gone. Every page after the Landing and the Intro gets a BACK button.

**Architecture:** One shared view field, `spotlight`, replaces each game's `call`; one design-system component, `Spotlight`, replaces `CallOverlay` in the six stage/column files; one constant, `SPOTLIGHT_MS`, sets how long the screens hold before the next point. The back button is one design-system button plus one shell hook, placed in each page's existing top bar.

**Tech Stack:** React 19, React Router, Tailwind, Vitest, Playwright, Storybook (as every phase).

**Spec:** the "Design" section below (owner decisions 2026-11-07, in chat; no separate spec file). Branch `phase/9-spotlight` from `main`.

## Design (owner decisions, 2026-11-07)

Why: the games exist to show Yash to the visitor. Today the loud centre words describe the shot ("WINNER.", "WRONG SIDE.", "HE READ IT.") and mean little, while the card with his work sits small at the side and is missed. The owner wants the visitor to leave remembering **the projects he built and the impact they had**.

Owner's words, as decided:
1. When Yash wins a point, **the project name and its impact, big in the centre**. It stays **4–5 s**, then **goes to the left or right side, where the cards already are**. Add a **sound** and **highlight it a little** (a glow).
2. When the visitor wins a point: **"good point" / "well played"** style words.
3. Same idea for all three games (the owner's three screenshots: cricket's stadium screen, tennis's highlight card, badminton's attribute toasts).
4. A **back button**: the visitor can go back to the previous page from any page.

Calls made by me (Claude), for the owner to check:
- C1. The centre panel shows the card's own eyebrow, then the title, then one line: tennis `HIGHLIGHT 02 · SF` / `KUDO BOARD` / the project's **`winner`** text (its result, the impact) from `content.json`; cricket `INNINGS 01 · ACADEMY` / `PICT, PUNE` / role · span; badminton `ATTRIBUTE CHARGED · RALLY 1` / `BACKEND` / its chips (Java · Spring Boot · JUnit).
- C2. All shot words go, including TOO LATE / TOO EARLY and cricket's SIX / FOUR / DOT BALL. A point with nothing to unlock and no visitor win (tennis's GAME point) shows nothing; the end panel follows as today.
- C3. The visitor's words rotate by how many points the visitor has won: `WELL PLAYED.`, `GOOD POINT.`, `NICE ONE.` (then round again).
- C4. Hold: `SPOTLIGHT_MS = 4500` when something is unlocked; the visitor's words keep each game's current call time. The last 450 ms of the 4500 are the exit: the panel shrinks to 60% and moves toward its card's side (tennis: that card's `side`; badminton and cricket: right; the phone column: down to the chip) while fading out. The side card for that unlock appears only once the spotlight has left.
- C5. Sound: a new short synthesised "reveal" chime (no file, no licence question), played the moment the spotlight appears. Glow: the existing `glow-call` look on the panel's volt border, one soft pulse.
- C6. The 2D backup games get the same spotlight and hold (so the 2D fair-play bound `MAX_GAME_MS` goes from 15 000 to 30 000). The reduced-motion auto-rally is unchanged apart from losing the shot words.
- C7. Commentary lines (bottom-left bar) stay as they are.
- C8. Back button: `← BACK` at the left of each top bar, before the breadcrumb; the phone shows `←` alone, named "Back". It goes to the previous page when the visitor came from inside the site, else to the Hub (from the Hub itself: to Home). Not on Home or the Intro. Games, content pages, Scout, Full Time, the Hub and 404 all get it.

## Global Constraints

- Copy lives in `src/content/ui-copy.ts` only; mark new strings `// derived` as the file does.
- Touch targets ≥ 44 px; mono text ≥ 11 px on screen (the existing e2e floors stay green).
- The spotlight is `aria-hidden`; the game's announcer speaks the unlock (as today, minus the shot words).
- Reduced motion: the spotlight appears and fades, it never slides or pulses.
- Yash always wins; no visitor-win copy beyond C3.
- `pnpm verify` green; no new dependencies.

## Review Focus

1. The last input both unlocks and ends the game (cricket ball 3; badminton's final rally when it charges the last group): the spotlight holds its full 4.5 s before the verdict/end panel appears, and the end panel never covers it.
2. The tab is hidden while a spotlight is up: on return there is no second spotlight, no lost card, and the next point starts once.
3. PLAY AGAIN (rematch) pressed while a spotlight is up: the spotlight and its timers are cleared; no stray card or chime.
4. The smallest phone (360×640) and a landscape phone: the spotlight fits inside the column, long titles (`AI INTERVIEW PLATFORM`) wrap balanced, and SKIP / QUICK VIEW stay visible and tappable above it.
5. A page opened directly (no history in the site): BACK goes to the Hub and never leaves the site.

---

### Task 1: The `Spotlight` component and the reveal chime

**Files:**
- Create: `src/design-system/broadcast/Spotlight.tsx`, `src/design-system/broadcast/Spotlight.stories.tsx`
- Modify: `src/design-system/index.ts` (export), `src/shell/synth.ts` (recipe), `src/shell/audio.tsx` (`SoundName` gets `"reveal"`), `src/shell/synth.test.ts`

**Interfaces:**
- Produces:
  ```ts
  // src/features/games/engine/spotlight.ts (created here so Task 2 and 3 share it)
  export type GameSpotlight =
    | { kind: "unlock"; eyebrow: string; title: string; line: string; to: "left" | "right" }
    | { kind: "yours"; text: string };
  export const SPOTLIGHT_MS = 4500;
  export const SPOTLIGHT_EXIT_MS = 450;
  /** How long a called point holds before the next one: SPOTLIGHT_MS for an unlock, else `callMs`. */
  export function holdFor(s: GameSpotlight | null, callMs: number): number;
  ```
  ```tsx
  export function Spotlight(props: {
    spotlight: GameSpotlight;
    size: "stage" | "column";
    className?: string;
  }): JSX.Element;
  ```
  `SoundName` includes `"reveal"`.

- [ ] **Step 1:** Unit test `holdFor`: unlock → 4500; yours → callMs; null → callMs. Synth test: `RECIPES.reveal` exists and schedules notes within 0.6 s (follow the existing synth test style).
- [ ] **Step 2:** Run `pnpm vitest run src/features/games/engine src/shell/synth.test.ts`: FAIL.
- [ ] **Step 3:** Write `spotlight.ts`; add a `reveal` recipe: two bright rising notes (a fifth apart), ~0.5 s total, at the level of the existing light sounds.
- [ ] **Step 4:** Write `Spotlight`. Unlock: a Glass panel, volt border with one `glow-call` pulse, `animate-pop` in; eyebrow (`type-mono-label`, volt), title (`type-call` on stage, `type-call-sm` on column, `text-balance`), line (`body`, max 2 lines). Exit: a CSS animation starting at `SPOTLIGHT_MS - SPOTLIGHT_EXIT_MS` moving toward `to` (column: always down), scale 0.6, opacity 0, `forwards`. Yours: the text alone, styled like today's volt `CallOverlay`, no panel. `aria-hidden`. `motion-reduce`: no pulse, no move, fade only.
- [ ] **Step 5:** Stories: `UnlockStage` (Kudo Board), `UnlockColumn`, `UnlockLongTitle` (AI Interview Platform), `Yours`.
- [ ] **Step 6:** Run the tests: PASS. Commit `feat(games): the Spotlight panel and the reveal chime`.

### Task 2: The views say `spotlight`, not `call`

**Files:**
- Modify: `src/features/games/tennis/view.ts`, `src/features/games/badminton/view.ts`, `src/features/games/cricket/view.ts`, their `view.test.ts` files, `src/content/ui-copy.ts`, `src/features/games/engine/beats.ts` (`MAX_GAME_MS = 30000`)

**Interfaces:**
- Consumes: `GameSpotlight` (Task 1).
- Produces: `TennisView.spotlight`, `BadmintonView.spotlight`, `CricketView.spotlight`: `GameSpotlight | null` (the `call` field is removed from all three). `ui.games.yours: readonly ["WELL PLAYED.", "GOOD POINT.", "NICE ONE."]`. Each view's `cards` / `toasts` / `screen.slots` leave out the newest unlock while its spotlight is up (phase `called` with an unlock spotlight).

- [ ] **Step 1:** Update the view tests (2D and 3D builders) to assert, for each game:
  - Yash's point that unlocks → `{ kind: "unlock", eyebrow, title, line, to }` with C1's values; e.g. tennis 3D after Yash's first point: `eyebrow` and `title` equal that point's new card's eyebrow and title, `line` = that project's `winner` from `content.matchHighlights`, `to` = that card's `side`.
  - Visitor's 1st, 2nd, 4th point → `WELL PLAYED.`, `GOOD POINT.`, `WELL PLAYED.`.
  - Tennis's game point → `spotlight: null`.
  - While the unlock's spotlight is up, `cards` has one fewer entry; in the next phase it is back.
  - `announce` contains none of the removed words (`WINNER`, `OUT`, `WRONG`, `TOO LATE`, `TOO EARLY`, `HE READ IT`, `SIX`, `FOUR`, `DOT BALL`).
- [ ] **Step 2:** Run `pnpm vitest run src/features/games`: FAIL.
- [ ] **Step 3:** Implement: replace each builder's `call` with `spotlight`; the announcer line keeps the score and the unlock sentence, with the visitor's words in place of the call on a visitor point. Remove the dead `calls` copy (2D and 3D) and any `FOR_YOU` set left unused; keep commentary copy.
- [ ] **Step 4:** Run: PASS. Commit `feat(games): views put the unlock in the spotlight; the visitor's point is WELL PLAYED`.

### Task 3: Wire the spotlight into the six screens and the six layouts

**Files:**
- Modify: `src/features/games/{tennis,badminton,cricket}/{*Stage,*Column}.tsx` (`CallOverlay` → `Spotlight`, same place, given the room it needs), `Tennis3DScreen.tsx`, `TennisScreen.tsx`, `Badminton3DScreen.tsx`, `BadmintonScreen.tsx`, `Cricket3DScreen.tsx`, `CricketScreen.tsx`, `cricket/cricketCalls.ts`, `tennis/3d/sequence.ts`, `badminton/3d/sequence.ts`; delete `CallOverlay` if nothing uses it.
- Test: the games' e2e specs (`tests/e2e/{tennis,badminton,cricket}.spec.ts`) and story specs that look for the removed words.

**Interfaces:**
- Consumes: `holdFor`, `SPOTLIGHT_MS`, `Spotlight`, `"reveal"` (Task 1); `view.spotlight` (Task 2).

- [ ] **Step 1:** e2e (desktop + mobile projects): in each 3D game, after Yash's first unlocking point the centre shows the unlock's title and line; it is gone and the side card is visible by `SPOTLIGHT_MS + 500` ms; no removed word ever appears (scan `body` text through one full game). Add Review Focus 1–4 as tests in the owning spec: last-input-ends-game hold, hidden tab during a spotlight (`page.evaluate` visibility as the existing hidden-tab tests do), rematch during a spotlight, 360×640 fit (inside the column, SKIP and QUICK VIEW visible).
- [ ] **Step 2:** Run the three specs: FAIL.
- [ ] **Step 3:** Each screen: wait `holdFor(view.spotlight, <its callMs>)` before the next point (tennis/badminton 3D `callMs`, cricket 3D `calledMs`, the 2D `callMs`); play `"reveal"` when an unlock spotlight appears. When the input that unlocks also ends the game, the verdict/end panel waits until the spotlight has left (Review Focus 1). The 3D walk between points keeps its length; after it, both players hold their waiting clip until the next point (check in `PointLab` / `RallyLab` that nobody freezes or slides during the hold).
- [ ] **Step 4:** Run the three specs and `pnpm vitest run src/features/games`: PASS. Screenshot each game's spotlight on the stage (1440×900) and the phone (390×844) for the controller.
- [ ] **Step 5:** Commit `feat(games): the spotlight holds, chimes, then goes to its card`.

### Task 4: The BACK button

**Files:**
- Create: `src/design-system/broadcast/BackButton.tsx`, `src/shell/useBack.ts`, `src/shell/useBack.test.ts`
- Modify: `src/shell/ContentPage.tsx` (all content pages + 404), `src/features/games/frame/GameStage.tsx`, `src/features/games/frame/GameColumn.tsx`, `src/features/quick-view/ScoutHeader.tsx`, `src/features/hub/HubStage.tsx`, `src/features/hub/HubColumn.tsx`, `src/features/full-time/FullTimeStage.tsx`, `src/features/full-time/FullTimeColumn.tsx`, `src/content/ui-copy.ts` (`ui.hud.back: "BACK"`, `ui.hud.backName: "Back"`)
- Test: `tests/e2e/back.spec.ts`

**Interfaces:**
- Produces: `useBack(fallback: string): () => void` (navigates `-1` when `useLocation().key !== "default"`, else `navigate(fallback)`); `BackButton({ onBack, label, name, className })`: HUDButton look, `←` + label, the label `max-md:sr-only`, ≥ 44 px.

- [ ] **Step 1:** Unit: `useBack` with a first entry (`key: "default"`) calls `navigate(fallback)`; after a navigation it calls `navigate(-1)`. e2e: `/arena` → click CAREER → BACK → URL is `/arena`; open `/career` directly → BACK → `/arena`; open `/arena` directly → BACK → `/`; a game page and `/scout` show BACK; `/` and `/intro` do not; the axe and keyboard sweeps stay green.
- [ ] **Step 2:** Run: FAIL.
- [ ] **Step 3:** Implement and place the button first in each top bar's left group (fallback `ROUTES.arena`; the Hub's is `ROUTES.home`). Keep the breadcrumb as it is.
- [ ] **Step 4:** Run the new tests plus `tests/e2e/keyboard-sweep.spec.ts` and the touched pages' artboard specs; where BACK lands inside a masked-free artboard region, add it to that test's logged boxes as previous owner changes were. PASS.
- [ ] **Step 5:** Commit `feat(shell): a BACK button on every page after the Intro`.

### Task 5: Finish

- [ ] Update `docs/superpowers/plans/phase-0-carryover.md` (Phase 9 rows done) and `docs/launch/copy-review.md` (new strings: the visitor's words, BACK).
- [ ] `pnpm verify` green. Commit `docs: Phase 9 as built`.
- [ ] One whole-branch review (Opus), at most one fix wave, then the owner plays it before the merge.
