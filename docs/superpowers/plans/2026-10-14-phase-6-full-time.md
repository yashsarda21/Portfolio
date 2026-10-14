# Phase 6 — Yash Always Wins + Full Time Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**What this plan does (plain words):**

Yash changed Phase 6 on 2026-10-14: *"it is my portfolio so I will [win] every time."* So:
- **The visitor can never beat Yash.** The hidden 1-in-100 win is removed from cricket, tennis and badminton. Perfect play still loses, narrowly.
- **No Giant Killer, no Locker Room, no achievements.** The win screen, the hidden room, the Hub's "Hidden achievements" box, the locked Giant Killer trophy and the "I beat you." message all go.
- **One "Full Time" page at the end of the matchday** (`/arena/full-time`). After all three venues are played, the visitor sees the Giant Killer layout from the design, flipped:
  - the scoreboard reads **YOU 0 · 3 YASH**
  - the big line is a grade from how they played across all three games: **GOOD TRY.**, **NICE EFFORT.** or **SO CLOSE.**
  - an encouraging line, a Team Up card, and PLAY AGAIN / SEE THE PLAYER CARD / BACK TO THE HUB
- **Getting there:** once all three venues are played, every game's end shows **SEE FULL TIME**, and the Hub's index lists **Full Time**. Opening the page early shows "NOT YET." with the next venue to play.
- **Team Up** fills its message with "Good game, Yash." once the visitor has played any game.
- **Trophy Room** shows Yash's five real trophies.

**Goal:**
- No code path lets the visitor win.
- `/arena/full-time` matches the Easter-Egg artboard's layout within 2 % (a story fed the artboard's own words).
- Every finished game saves how close it came.
- The Hub, Trophy Room and Team Up carry no trace of the win path.
- axe is clean, the Lighthouse budget is met, and `pnpm verify` is green.

**Architecture:**
- **Games (Task 1):**
  - The three referees lose their `won` branch and the `Luck` roll for it. Tennis keeps `Luck` for the serve's side and toss.
  - A shared `perfectShare` (engine) measures how close each game came.
  - `useMatchResult` saves `{ score, form }` and returns `{ offerHighlight, fullTime }` (`EndFlags`). `buildGameEnd` turns `fullTime` into SEE FULL TIME.
- **Match record:**
  - Each venue keeps its **best** form. A `yashWins` count replaces `record.{yash,you}`.
  - The achievements, Locker Room and prefill fields go. `sanitizeRecord` migrates old records (persist version 2, same `arena:v1` key).
- **Full Time (Task 2):** a new feature, `src/features/full-time/`, in the Hub's pattern:
  - pure `gradeFor` and `buildFullTimeView`
  - a screen that reads the record (waits for `useRecordReady`, H5)
  - a page with the 1440×900 stage from `lg` and a derived column below it
  - generic design-system parts (`IconToast`, `ResultBoard`) with stories
- **Cleanup (Tasks 3–4):**
  - Hub: the FULL TIME rail box replaces Hidden achievements, the index gains a Full Time link, and the record chip reads YOU 0.
  - Team Up: the prefill.
  - The routes and content of the win path are removed.
  - Trophy Room: five trophies, with the locked kind gone from the design system.

**Tech Stack:** React 19, React Router 8 (prerender, `ssr:false`), Tailwind v4 Arena tokens, Zustand persist, Vitest + Testing Library, Playwright (+ fake clock) + axe + pixelmatch, Storybook 10, Lighthouse.

**Spec:** `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md`. This phase **changes the spec by owner decision**. Task 5 records that change in a new §11.14 and in the rows it replaces:
- §8 Outcome
- §8.1–8.3 win clauses
- §9.1 forced-win journey
- §10 phase 6 row
- §11.3
- H6–H8
- T3
- G4–G6, G8, G16
- §12 Locker Room / Giant Killer rows

Until then, the rulings below are binding where they differ from the spec.

**Measuring tape (builders read these):**
- `design/handoff/design-source/Easter-Egg.dc.html` (every Full Time stage coordinate below comes from it) and `design/references/Easter-Egg@1440x900.png`
- `design/handoff/design-source/Hub.dc.html` (the rail's bottom box), `design/references/Hub@1440x900.png`
- `design/handoff/design-source/Trophy-Room.dc.html`, `design/references/Trophy-Room@1440x900.png`
- `docs/superpowers/plans/2026-10-09-phase-5-games.md` (how the games are built: rulings G1–G18)

**Carry-over:** the "Count-up controlled trigger (Phase 6, Locker Room record)" row in `docs/superpowers/plans/phase-0-carryover.md` closes unbuilt: there is no Locker Room and nothing else counts up (YAGNI). Task 5 ticks it with that note.

---

## Rulings for Yash to confirm

| # | Decision | Why | Easy to flip? |
|---|---|---|---|
| F1 | **Yash always wins.** The 1 % roll is removed from all three referees:<br>• **Cricket:** ball 3 is always FOUR or SIX (perfect → FOUR, "Perfect yorker. Flicked off the toes anyway. Still not out.").<br>• **Tennis:** serve 3 always clips the line (ON THE LINE.).<br>• **Badminton:** match point always goes to Yash, 21–19.<br>Tennis still draws the open side and the toss at random. | Owner decision 2026-10-14. | — |
| F2 | **Saved scores** (the Hub's `PLAYED · <score>`): cricket `<runs>* NOT OUT`, tennis `GAME YASH`, badminton `21–19`. The win strings (`0 OUT`, `BROKE SERVE`, `20–20`) go. | F1. | — |
| F3 | **The game end.** Unchanged (venue page + play again + the phone's BACK TO THE HUB) **until all three venues are played**. From then on, the main button is **SEE FULL TIME** → `/arena/full-time`, and play again stays beside it. SEE FULL TIME takes the place of WATCH THE HIGHLIGHT INSTEAD (G9) when both apply. The venue's page stays one tap away through SKIP. | Yash: "show the entire thing at the end only". | Yes |
| F4 | **How close you came.** Each finished game saves its **perfect share**: perfect inputs ÷ inputs (cricket 3 balls, tennis 3 returns, badminton 4 rallies). The record keeps the **best** per venue. Full Time averages the three:<br>• ≥ 0.6 → **SO CLOSE.**<br>• ≥ 0.2 → **NICE EFFORT.**<br>• otherwise → **GOOD TRY.**<br>The reduced-motion auto-rallies have no perfect inputs (GOOD TRY). | A single verdict from all three games. Perfect is the only quality the three games share a meaning for (badminton has no "miss"). | Yes (thresholds) |
| F5 | **Full Time page = the Easter-Egg artboard, flipped** (copy in Task 2, Step 1):<br>• toast: MATCHDAY COMPLETE · 3 OF 3 VENUES / FULL TIME<br>• scoreboard: **YOU 0 · 3 YASH**, with Yash's name on volt. The visitor's name is dim, **not struck through** (the artboard strikes the loser; we don't strike visitors).<br>• the grade as the `h1`, with its line under it<br>• the Team Up card (TEAM UP → `/team-up`)<br>• PLAY AGAIN (→ cricket) · SEE THE PLAYER CARD · BACK TO THE HUB<br>• COMM bottom-left, and SAVED TO YOUR RECORD bottom-right<br>• motion as drawn: toast drop, rises, dust, scoreboard glitch; all still under reduced motion | The drawn screen, reused. | Yes (copy) |
| F6 | **Opened early** (fewer than three venues played, or a first-time visitor): the same layout reads<br>• MATCHDAY IN PROGRESS · n OF 3 VENUES<br>• **YOU 0 · n YASH**<br>• **NOT YET.**<br>• "n of 3 venues played. The final whistle blows after all three."<br>• a card for the next unplayed venue (its name, blurb and PLAY)<br>• BACK TO THE HUB only<br>A returning visitor never sees a wrong-state flash (H5 `data-record-pending`). | No dead end, no spoiler. | Yes |
| F7 | **Phones and tablets (< 1200 px):**<br>• a derived single column: toast, scoreboard, `h1`, line, card (CTA full width), the links stacked, the note<br>• no COMM (phones stay silent, L11)<br>• tablets centred (max 640 px), one size step up, as on the Hub | No mobile artboard; the column pattern of the Hub and games. | Yes |
| F8 | **Hub:**<br>• The rail's bottom box (HIDDEN ACHIEVEMENTS) becomes **FULL TIME**: "The final whistle blows after all three venues." / "Final whistle. Your result is up." It keeps the same place and size.<br>• The index lists **Full Time** (tag RESULT, SEEN once opened) once all three venues are played, where the Locker Room used to appear.<br>• The record chip reads `YASH n · YOU 0`.<br>• The `visitorWins` COMM branch goes. | H6–H8 replaced. | Yes |
| F9 | **Trophy Room:** five trophies.<br>• Desktop: 3 on the top shelf, and the second shelf's two **centred**.<br>• Phone: 2 + 2, then the fifth centred.<br>The locked kind leaves the design system (`TrophyKind`, `Trophy`, stories) and the content schema (`length(5)`). | T3 replaced. | Yes |
| F10 | **Team Up prefill:** once the visitor has played any venue, an **empty, untouched** message field starts as "Good game, Yash." Nothing typed is ever replaced. It is derived from `venuesPlayed`, not stored. | Yash's pick. | Yes |
| F11 | **Old addresses** `/arena/giant-killer` and `/locker-room` are removed. They fall to the existing Out of Bounds page, which links every page including the Hub. The site has never been published, so no one holds those links. *(This replaces "send them to the Hub", which I mentioned earlier: a redirect would be code for a link nobody has.)* | YAGNI. | Yes |
| F12 | **Saved record:**<br>• Same key `arena:v1`, persist version 2.<br>• Old records keep venues, scores and sections seen. `record.yash` becomes `yashWins`. `record.you`, `achievements`, `lockerRoomUnlocked` and `teamUpPrefill` are dropped.<br>• A missing best form counts as 0. | Visitors of earlier builds (Yash's own browser) load cleanly. | — |
| F13 | **Lighthouse:** `/arena/full-time` joins with the Hub's gates: performance ≥ 90, accessibility 100, best practices ≥ 0.9, SEO ≥ 0.9, FCP ≤ 1.5 s, CLS ≤ 0.1. | §9.1. | Yes |
| F14 | **Pixel parity:**<br>• Full Time: a story fed the artboard's own words (`artboardView`) vs `Easter-Egg@1440x900` ≤ 2 % (mask: the YASH strike-through, F5).<br>• Hub: the rail's bottom box is masked (new words).<br>• Trophy Room: the second shelf is masked (centred two, no locked outline). | The real page's words differ by design. | — |

---

## Global Constraints

All Phase 0–5 constraints apply:
- **Styling:**
  - Arena tokens only; literal class strings.
  - **No pixel fitting in feature code** (`src/features/styleRules.test.ts` guard).
  - Stage screens place parts at **artboard coordinates** with spacing-scale classes (e.g. `top-37.5`).
  - **Check that no existing type recipe, token, shadow, keyframe, utility or component matches before adding one** (`src/design-system/tokens/catalog.ts`). Reuse `Glass`, `Button`, `Icon` (`trophy`), `Dust`, `Spotlight` / `LightCone` / `PitchGlow`, `CommentaryBar`, `ScreenColumn`, `Stage`, `rise-in`. A new merge that moves a value by more than ~2 % is logged in the spec (Task 5).
  - No raw hex / rgb / cubic-bezier in TS/TSX, no arbitrary type sizes, no inline `var(--color-*)`. ESLint rejects raw `shadow-[`, `blur-[`, `drop-shadow-[`. SVG art takes colours from tokens or `currentColor`.
  - Any font override next to a `type-*` class is a **separate `cn()` argument after the type class**.
- **Accessibility:**
  - Mono ≥ 11 px on screen (A2; `mono-fit` on the stage). Contrast ≥ 4.5:1. Volt focus ring (A3). Targets ≥ 44 px.
  - Nothing invisible is focusable or clickable.
  - Exactly one rendered `<h1>` at every width.
  - Scenes are `aria-hidden`. Link names contain their visible text (WCAG 2.5.3).
- **No visible copy in components or routes.** New strings go in `src/content/ui-copy.ts` (exact strings in each task). Design-system components take every word as a prop.
- **Folder rules:**
  - features import shell / design-system / content / lib / assets
  - design-system imports nothing from content / shell / features
  - features never import each other
  - `src/features/games/` is one feature (relative imports between its folders)
  - `src/features/full-time/` is a new feature: it reads the record through `@/shell/matchRecord`, **never** `@/features/games`
- **Referees are pure:** no React, no DOM, no timers, no `Math.random`. Copy is never inside a referee.
- **Motion:**
  - GSAP is core only, lazy, `await loadGsap()`. Full Time needs no GSAP: its entrance is CSS keyframes.
  - Animate only `transform` and `opacity`.
  - The global reduced-motion rule stills everything.
- **Match record:** written only through `useMatchRecord.getState().completeMatch(…)`, via `useMatchResult`, exactly once per finished game. The storage key stays `arena:v1`.
- **Never touch** `Yash-Sarda-Resume.pdf`. `player.resumePdf` stays `null`.
- **Lean testing:**
  - unit tests for every pure function (referees, `perfectShare`, `sanitizeRecord`, `gradeFor`, the view builders) and `useMatchResult`
  - component tests only for the new interactive pieces (none here are interactive beyond links)
  - parity: one Full Time story; update the Hub and Trophy masks
  - e2e on Playwright's fake clock, never real-time sleeps
  - no snapshot tests
  - **delete** tests that only exist for the win path; don't keep them skipped
- **Git and environment:**
  - Every node / pnpm command is prefixed `NODE_OPTIONS=` (the shell's value points at a missing preload). git 2.15 (no `switch` / `restore`).
  - Branch `phase/6-full-time` (already created from `main` at `fbf0ff5`).
  - Builder commits end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
  - **Ports:**
    - Tests use 4173 / 6007. If 4173 is busy (Yash's own server), run e2e through a temporary config on **4183** whose webServer is `sirv build/client --port 4183 --single` (or the project's preview equivalent).
    - **Never kill processes you didn't start**: 6006, 5173–5176 and 4173 belong to Yash.
  - The host is often heavily loaded: re-run timeouts with `--workers=2`, never weaken an assertion.

## Review Focus

1. **Old saved records.** A Phase 5 record (`record: {yash: 2, you: 1}`, `achievements: ["giant-killer"]`, `lockerRoomUnlocked: true`, `teamUpPrefill: "I beat you."`, no `bestForm`) or a malformed one loads without error. The expected result:
   - venues, scores and sections are kept
   - `yashWins` is 2
   - the Hub reads `YOU 0` and shows no Locker Room
   - Full Time grades the missing forms as 0

   Tests: Task 1 unit (`sanitizeRecord`), Task 3 e2e (seeded old record on `/arena`).
2. **Full Time opened directly**, in each of these states, shows the right state and never a flash of the other (H5):
   - with no record, with 1–2 venues, with all 3
   - with storage blocked
   - with JavaScript off (the prerendered "NOT YET." page with working links)

   Tests: Task 2 e2e.
3. **The game that completes the matchday while storage is blocked** still shows SEE FULL TIME (the in-memory record), and Full Time then shows the done state for that visit.

   Tests: Task 1 unit (`useMatchResult` with a throwing persist), Task 5 journey.
4. **Perfect play never wins.** With every input perfect and the old luck stub at 0 (`forceLuck(0)`), each game ends as Yash's win with its loss score, and nothing names a win (no CLAIM, no `/arena/giant-killer`).

   Tests: Task 1 unit (each referee) and one e2e per game.
5. **Full Time at viewport extremes** (2560×1080, 1440×900, 1366×768, 1280×720, 1200×800, 1199×800, 1024×768, 768×1024, 390×844, 375×667, 360×640, 844×390, 667×375):
   - no horizontal scroll
   - exactly one rendered `<h1>`; the longest headline (NICE EFFORT.) never overflows
   - mono ≥ 11 px
   - every link ≥ 44 px and on screen or reachable by scrolling

   Tests: Task 2 e2e.

---

## Task 1: Yash always wins (referees, record, game ends)

**Files:**
- Delete: `src/features/games/engine/luck.ts`, `src/features/games/engine/luck.test.ts`
- Create: `src/features/games/engine/form.ts`, `src/features/games/engine/form.test.ts`
- Modify:
  - engine: `src/features/games/engine/types.ts`, `useMatchResult.ts` (+ test), `useGameSession.ts`
  - referees: `src/features/games/{cricket,tennis,badminton}/referee.ts` (+ tests)
  - views and screens: `src/features/games/{cricket,tennis,badminton}/view.ts` (+ tests), `*Screen.tsx`, the stories that pass a win
  - frame: `src/features/games/frame/chrome.ts` (+ test), `GameEnd.tsx`, `Frame.stories.tsx`
  - shell and routes: `src/shell/matchRecord.ts` (+ test), `src/shell/routes.ts`, `app/routes.ts`
  - Hub, only to keep it compiling: `src/features/hub/{view.ts,view.test.ts,HubScreen.tsx,hub.fixture.ts}`
  - Create: `app/routes/arena.full-time.tsx` (placeholder until Task 2)
  - `src/content/ui-copy.ts`
  - e2e: `tests/e2e/{cricket,tennis,badminton,journeys}.spec.ts`, `tests/e2e/support/game.ts` (only what the win path used)

**Interfaces:**
- Consumes: the Phase 5 games as built.
- Produces (Tasks 2, 3 and 5 rely on these exact names):
  - `src/features/games/engine/form.ts`: `perfectShare(inputs: readonly { q: Quality }[]): number`
  - `src/shell/matchRecord.ts`:
    - `MatchRecordData = { venuesPlayed: Venue[]; lastScores: Partial<Record<Venue, string>>; bestForm: Partial<Record<Venue, number>>; sectionsSeen: string[]; yashWins: number }`
    - `completeMatch(m: { venue: Venue; score: string; form: number }): void`
    - `matchdayComplete(r: Pick<MatchRecordData, "venuesPlayed">): boolean`
    - `sanitizeRecord(raw: unknown): MatchRecordData`
  - `src/features/games/engine/useMatchResult.ts`:
    - `EndFlags = { offerHighlight: boolean; fullTime: boolean }`
    - `NO_END_FLAGS: EndFlags`
    - `useMatchResult(venue).save({ score, form }): EndFlags`
  - `ROUTES.fullTime === "/arena/full-time"`
  - `ui.routes.fullTime`, `ui.games.fullTime`

- [ ] **Step 1: Copy.** In `src/content/ui-copy.ts`:
  - **Add** to `ui.routes`, after `badminton`:
    ```ts
    fullTime: {
      title: "Full Time — The Arena",
      description: "Your matchday against Yash Sarda: the final score.",
      heading: "FULL TIME",
      phase: 6,
    },
    ```
  - **Add** to `ui.games`, after `highlight`:
    ```ts
    /** F3: the end's main button once all three venues are played. */
    fullTime: "SEE FULL TIME",
    ```
  - **Remove** the copy only the win path read:
    - `ui.games.prefill`
    - cricket: `wicket`, `out`, `calls.bowled`, `comm.bowled`, `claim`
    - tennis: `status.broke`, `calls.winner`, `claim`
    - badminton: `calls.through`, `claim`
    - any other key the TypeScript compiler / a grep shows has no reader once Steps 3–6 are done (e.g. `badminton.status.saved` if only the win read it)
  - Keep `ui.routes.giantKiller` / `lockerRoom` for now: Task 3 removes them with their routes.

- [ ] **Step 2: Failing tests: form and record.** Write `src/features/games/engine/form.test.ts`:
  ```ts
  import { describe, expect, it } from "vitest";
  import { perfectShare } from "./form";

  describe("perfectShare", () => {
    it("is the share of inputs played perfectly", () => {
      expect(perfectShare([{ q: "perfect" }, { q: "good" }, { q: "miss" }])).toBeCloseTo(1 / 3);
      expect(perfectShare([{ q: "perfect" }, { q: "perfect" }])).toBe(1);
      expect(perfectShare([{ q: "good" }, { q: "miss" }])).toBe(0);
    });
    it("is 0 for no inputs", () => {
      expect(perfectShare([])).toBe(0);
    });
  });
  ```
  In `src/shell/matchRecord.test.ts`, replace the win / achievement / prefill cases with:
  ```ts
  it("counts every finished game as Yash's win and keeps each venue's best form", () => {
    const s = useMatchRecord.getState();
    s.completeMatch({ venue: "cricket", score: "14* NOT OUT", form: 1 / 3 });
    s.completeMatch({ venue: "cricket", score: "4* NOT OUT", form: 0 });
    const r = useMatchRecord.getState();
    expect(r.yashWins).toBe(2);
    expect(r.lastScores.cricket).toBe("4* NOT OUT");
    expect(r.bestForm.cricket).toBeCloseTo(1 / 3);
    expect(r.venuesPlayed).toEqual(["cricket"]);
  });

  it("migrates a Phase 5 record: keeps venues, scores, sections and Yash's wins; drops the win path", () => {
    expect(
      sanitizeRecord({
        venuesPlayed: ["cricket", "tennis"],
        lastScores: { cricket: "0 OUT", tennis: "GAME YASH" },
        sectionsSeen: ["career", "lockerRoom"],
        record: { yash: 2, you: 1 },
        achievements: ["giant-killer"],
        lockerRoomUnlocked: true,
        teamUpPrefill: "I beat you.",
      }),
    ).toEqual({
      venuesPlayed: ["cricket", "tennis"],
      lastScores: { cricket: "0 OUT", tennis: "GAME YASH" },
      bestForm: {},
      sectionsSeen: ["career", "lockerRoom"],
      yashWins: 2,
    });
  });

  it("keeps only finite forms between 0 and 1, for real venues", () => {
    expect(
      sanitizeRecord({ bestForm: { cricket: 0.5, tennis: 7, badminton: "x", golf: 0.2 } }).bestForm,
    ).toEqual({ cricket: 0.5, tennis: 1 });
  });

  it("says when the matchday is complete", () => {
    expect(matchdayComplete({ venuesPlayed: ["cricket", "tennis"] })).toBe(false);
    expect(matchdayComplete({ venuesPlayed: ["badminton", "cricket", "tennis"] })).toBe(true);
  });
  ```
  - Update the file's other cases to the new shape: `yashWins` in place of `record.yash`; no `achievements`, `lockerRoomUnlocked`, `teamUpPrefill` or `record.you`.
  - The old `lastScores` value `"0 OUT"` is kept as stored: a string is a string. The Hub shows whatever was saved.

  Run: `NODE_OPTIONS= pnpm exec vitest run src/features/games/engine/form.test.ts src/shell/matchRecord.test.ts`. Expected: FAIL (missing module / fields).

- [ ] **Step 3: Form and record.** Create `src/features/games/engine/form.ts`:
  ```ts
  import type { Quality } from "./types";

  /** How close a game came (F4): the share of its inputs played perfectly, 0 to 1. Saved with the result. */
  export function perfectShare(inputs: readonly { q: Quality }[]): number {
    return inputs.length === 0 ? 0 : inputs.filter((i) => i.q === "perfect").length / inputs.length;
  }
  ```
  In `src/shell/matchRecord.ts`:
  - **Data:**
    - Replace the data shape with `MatchRecordData` exactly as in **Interfaces**. Doc `bestForm` as "each venue's best perfect share (F4)" and `yashWins` as "every finished game: the visitor never wins (F1)".
    - `initial` is `{ venuesPlayed: [], lastScores: {}, bestForm: {}, sectionsSeen: [], yashWins: 0 }`.
  - **`completeMatch({ venue, score, form })`:**
    - adds the venue once and sets `lastScores[venue] = score`
    - sets `bestForm[venue] = Math.max(s.bestForm[venue] ?? 0, form)`
    - adds 1 to `yashWins`
  - **`sanitizeRecord`:**
    - `bestForm` keeps venue keys with finite numbers, clamped to [0, 1]
    - `yashWins = count(r.yashWins ?? (r.record as {yash?: unknown} | undefined)?.yash)` (reuse the file's `count`)
    - drop everything else
  - **Persist:** `version: 2`; keep `migrate: (persisted) => sanitizeRecord(persisted)`.
  - **Add:**
    ```ts
    /** All three venues played: Full Time is open (F3, F6). */
    export const matchdayComplete = (r: Pick<MatchRecordData, "venuesPlayed">) =>
      VENUES.every((v) => r.venuesPlayed.includes(v));
    ```
  - **Keep the Hub compiling** (Task 3 finishes it): in `src/features/hub/view.ts`, `HubRecord` picks `"venuesPlayed" | "lastScores" | "sectionsSeen" | "yashWins"`; the chip value reads `record.yashWins` and `YOU 0`; the achievements line always shows its locked text; the Locker Room link is never listed; the `visitorWins` COMM branch goes. `HubScreen` selects `yashWins`. Fix only the Hub unit tests and fixtures this breaks.

  Run the Step 2 tests. Expected: PASS.

- [ ] **Step 4: Failing tests: referees.**
  - In each `referee.test.ts`, delete the forced-win cases and every `luck` argument to `bowl` / `playRally` / `playReturn`.
  - Delete `luck.test.ts`.
  - Add one "perfect play still loses" case per game:
  ```ts
  // cricket/referee.test.ts
  it("three perfect balls still end FOUR on the last: Yash is 4 not out (F1)", () => {
    let s = CRICKET_START;
    for (let i = 0; i < CRICKET_BALLS; i++) s = bowl(s, "perfect");
    expect(s.balls.map((b) => b.call)).toEqual(["dot", "dot", "four"]);
    expect(s.balls.at(-1)!.line).toBe("lastPerfect");
    expect(cricketRuns(s)).toBe(4);
    expect(cricketOver(s)).toBe(true);
  });

  // tennis/referee.test.ts
  it("three perfect returns: serve 3 still clips the line (F1)", () => {
    let s = TENNIS_START;
    for (let i = 0; i < TENNIS_SERVES; i++) {
      s = newServe(s, () => 0); // open: left
      s = playReturn(s, { side: "left", atMs: 1 }, "stage");
    }
    expect(s.returns.map((r) => r.call)).toEqual(["clean", "clean", "line"]);
    expect(s.returns.every((r) => r.q === "perfect")).toBe(true);
    expect(tennisOver(s)).toBe(true);
  });

  // badminton/referee.test.ts
  it("four perfect drops: match point still goes to Yash, 21–19 (F1)", () => {
    let s = BADMINTON_START_STATE;
    for (let i = 0; i < BADMINTON_RALLIES; i++) s = playRally(s, 23);
    expect(s.rallies.every((r) => r.q === "perfect")).toBe(true);
    expect(s.rallies.at(-1)!.call).toBe("drop");
    expect(badmintonScore(s)).toEqual({ yash: 21, you: 19 });
  });
  ```
  Run: `NODE_OPTIONS= pnpm exec vitest run src/features/games`. Expected: FAIL (signatures).

- [ ] **Step 5: Referees.**
  - **Cricket:**
    - `CricketState = { balls: CricketBall[] }`, `CRICKET_START = { balls: [] }`
    - `bowl(s, q)` without `luck`; the ball-3 branch that called `luckyWin` goes
    - `CricketCall = "dot" | "four" | "six"`; `CricketLine` loses `"bowled"`
    - `cricketWinner` is deleted
  - **Tennis:**
    - `TennisState = { serve; returns }` (no `won`)
    - `playReturn(s, pick, layout)` without `luck`; serve 3 is always `{ q: r.q, call: "line" }`
    - `TennisCall` loses `"winner"`; `tennisWinner` is deleted
    - `newServe(s, luck)` keeps `Luck`
  - **Badminton:**
    - `BadmintonState = { rallies }`
    - `playRally(s, power)`; at match point the call is the shot
    - `BadmintonCall` loses `"through"`
    - `badmintonScore` gives Yash the last point: `{ yash: 17 + rallies.length, you: 19 }` (so 21–19 at the end; keep it written from `BADMINTON_START` and `BADMINTON_RALLIES`)
    - `badmintonWinner` is deleted
  - **Engine:**
    - delete `engine/luck.ts`
    - in `engine/types.ts`, delete `Winner` and keep `Luck` (tennis uses it; re-word its doc: "the serve's side and toss")
  - Update each referee's doc comment to say Yash always wins (F1).
  - Run the referee tests. Expected: PASS.

- [ ] **Step 6: Failing tests: save and end.**
  - In `useMatchResult.test.ts`, replace the win cases with:
  ```ts
  it("saves the score and form, and says when the matchday is complete (F3)", () => {
    const { save } = setup("cricket");
    expect(save({ score: "14* NOT OUT", form: 0 })).toEqual({ offerHighlight: false, fullTime: false });
    setup("tennis").save({ score: "GAME YASH", form: 1 / 3 });
    expect(setup("badminton").save({ score: "21–19", form: 0.25 })).toEqual({
      offerHighlight: false,
      fullTime: true,
    });
    expect(useMatchRecord.getState().bestForm).toEqual({ cricket: 0, tennis: 1 / 3, badminton: 0.25 });
  });

  it("still ends the game when the record throws: no full time from a failed save", () => {
    vi.spyOn(useMatchRecord.getState(), "completeMatch").mockImplementation(() => {
      throw new Error("blocked");
    });
    expect(setup("cricket").save({ score: "14* NOT OUT", form: 0 })).toEqual({
      offerHighlight: false,
      fullTime: false,
    });
  });
  ```
  (Adapt `setup` to the file's existing helper. Keep the G9 "second loss offers the highlight" case, with `form` added.)
  - In `chrome.test.ts`, replace the win case with:
  ```ts
  it("offers SEE FULL TIME once the matchday is complete, ahead of the highlight (F3)", () => {
    const end = buildGameEnd(ui, ROUTES, chrome, {
      over: true, offerHighlight: true, fullTime: true, see: "SEE", again: "AGAIN",
    });
    expect(end).toEqual({
      primary: { label: ui.games.fullTime, to: ROUTES.fullTime },
      again: "AGAIN",
      hub: { label: ui.games.backToHub, to: ROUTES.arena },
    });
  });
  ```
  - Each `view.test.ts`:
    - delete the win cases
    - pass `{ phase, offerHighlight, fullTime }` (or `{ phase, ...NO_END_FLAGS }`)
    - assert the saved loss strings (`4* NOT OUT` after three perfect balls, `GAME YASH`, `21–19`)
    - assert no view text contains CLAIM, BOWLED, BROKE or GETS THROUGH

  Run: `NODE_OPTIONS= pnpm exec vitest run src/features/games`. Expected: FAIL.

- [ ] **Step 7: Save, session, end, views, screens.**
  - **`useMatchResult.ts`:**
    - export `EndFlags` and `NO_END_FLAGS = { offerHighlight: false, fullTime: false }`
    - `save({ score, form })` calls `completeMatch({ venue, score, form })` inside the existing try
    - it returns `{ offerHighlight: noteLoss(venue) >= OFFER_AFTER_LOSSES, fullTime }`, where `fullTime = matchdayComplete(useMatchRecord.getState())` is read inside the try after the save (false if the save threw)
    - drop the prefill
  - **`useGameSession.ts`:**
    - `SessionRun = { game: unknown; phase: string } & EndFlags`
    - `build: (game, at: { phase: R["phase"] } & EndFlags) => V`
    - `finish(next, result: { score: string; form: number }, extra = {})` commits `{ game: next, phase: "verdict", ...flags, ...extra }`
  - **Each screen:**
    - `interface Run { game; phase } & EndFlags`, `START = { game: …_START, phase: "ready", ...NO_END_FLAGS }`
    - `build(game, at)` passes `at` through
    - every `finish` call becomes `session.finish(next, { score: after.saved, form: perfectShare(next.balls /* returns, rallies */) })`
    - the `land` preview build passes `{ phase: "called", ...NO_END_FLAGS }`
    - remove every `luck` argument except tennis' `newServe`
  - **`chrome.ts`:**
    - `GameEndView = { primary: Link; again: string; hub: Link }` (no `claim`)
    - `buildGameEnd(ui, routes, chrome, { over, offerHighlight, fullTime, see, again })`
    - primary is `fullTime ? { label: ui.games.fullTime, to: routes.fullTime } : { label: offerHighlight ? ui.games.highlight : see, to: chrome.content }`
    - update its doc
  - **`GameEnd.tsx`:**
    - drop `claim`: the links are `[primary]`, and `again` is always present
    - simplify the size choice (`again` is never alone)
    - keep the focus rule and the column's BACK TO THE HUB
  - **Views:**
    - drop every `won` / `state.won` / `claim` branch
    - cricket's score is always `${runs}${copy.notOutMark}`, and `saved` is `${score} ${copy.notOut}`
    - cricket's ball label never shows a wicket
    - tennis' end status is always `copy.status.game`
    - the badminton bug is always `badmintonScore`
    - tennis / badminton end COMM lines that read `content.commentary.visitorWins` now read only the Yash line
  - **Routes:**
    - add `fullTime: "/arena/full-time"` to `ROUTES`, and `route("arena/full-time", "routes/arena.full-time.tsx")` to `app/routes.ts` after badminton
    - create `app/routes/arena.full-time.tsx` as a placeholder, in the shape of `app/routes/arena.giant-killer.tsx`, with `route="fullTime"`
  - **Stories:** stories that showed a won end (`Frame.stories.tsx`, the game stories) show a full-time end instead (`fullTime: true`), or are deleted if they duplicate.

  Run: `NODE_OPTIONS= pnpm exec vitest run` and `NODE_OPTIONS= pnpm exec tsc --noEmit`. Expected: PASS, no type errors.

- [ ] **Step 8: e2e.** In `tests/e2e/{cricket,tennis,badminton,journeys}.spec.ts`:
  - **Delete** the forced-win tests and the forced-win journey (Task 5 writes the Full Time journey).
  - **Replace** each with "perfect play still loses" (Review Focus 4), driven like the existing perfect-input tests with `forceLuck(page, 0)`:
    - **Cricket:** three perfect balls → the end shows SEE THE FULL SCORECARD, and `stored(page)` has `lastScores.cricket === "4* NOT OUT"`, `yashWins === 1`.
    - **Tennis:** three perfect returns → ON THE LINE., saved `GAME YASH`.
    - **Badminton:** four perfect drops → saved `21–19`.
    - In each: `expect(page.getByText(/CLAIM/)).toHaveCount(0)`.
  - **Add one test in `cricket.spec.ts`** (seed the record via `addInitScript` with tennis and badminton already played, in the existing storage-seeding style): finish an over → the main end button is SEE FULL TIME and goes to `/arena/full-time`.
  - **Keep `forceLuck`:** tennis still uses it for the open side. Remove only helpers that nothing calls any more.

  Run (4183 config if 4173 is busy): `NODE_OPTIONS= pnpm exec playwright test tests/e2e/cricket.spec.ts tests/e2e/tennis.spec.ts tests/e2e/badminton.spec.ts tests/e2e/journeys.spec.ts --workers=2`. Expected: PASS.

- [ ] **Step 9: Commit.**
  ```bash
  git add -A src app tests
  git commit -m "feat(games): Yash always wins; each game saves how close it came, and the matchday ends at SEE FULL TIME

  Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
  ```

---

## Task 2: The Full Time page

**Files:**
- Create:
  - feature: `src/features/full-time/{grade.ts,grade.test.ts,view.ts,view.test.ts,fullTime.fixture.ts,FullTimeScreen.tsx,FullTimePage.tsx,FullTimeStage.tsx,FullTimeColumn.tsx,FullTimePage.stories.tsx}`
  - design system: `src/design-system/broadcast/{IconToast.tsx,ResultBoard.tsx}` with a story file `src/design-system/broadcast/Result.stories.tsx`
  - tests: `tests/e2e/full-time.spec.ts`, `tests/stories/full-time.spec.ts`
- Modify:
  - `src/design-system/index.ts`, `src/design-system/tokens/catalog.ts` (+ `motion.css` only if a keyframe is missing)
  - `src/content/ui-copy.ts`
  - `app/routes/arena.full-time.tsx`
  - `src/shell/sections.ts` (+ test)
  - `src/shell/PlaceholderScreen.tsx` (`MAP` only if it lists routes by phase)

**Interfaces:**
- Consumes (Task 1):
  - `MatchRecordData`, `matchdayComplete`, `VENUES`, `useMatchRecord`, `useRecordReady` from `@/shell/matchRecord`
  - `ROUTES.fullTime`, `ui.routes.fullTime`
- Produces:
  - `gradeFor(bestForm: MatchRecordData["bestForm"]): Grade`, with `Grade = "goodTry" | "niceEffort" | "soClose"`
  - `FULL_TIME_GRADES = { soClose: 0.6, niceEffort: 0.2 } as const`
  - `buildFullTimeView(ui, routes, record: Pick<MatchRecordData, "venuesPlayed" | "bestForm">): FullTimeView`
  - `IconToast`, `ResultBoard` (design system)
  - `SECTIONS` gains `"fullTime"` (Task 3's index link is "seen" with it)

- [ ] **Step 1: Copy.** Add `ui.fullTime` to `src/content/ui-copy.ts`, after `ui.games`. Mark every string `// derived`:
  ```ts
  fullTime: {
    eyebrow: { done: "MATCHDAY COMPLETE", pending: "MATCHDAY IN PROGRESS" },
    /** The scoreboard's name for screen readers: "Final score: You 0, Yash 3". */
    board: "Final score",
    grades: {
      goodTry: { headline: "GOOD TRY.", line: "Three venues, three losses. He's had a lot of practice." },
      niceEffort: { headline: "NICE EFFORT.", line: "Three venues, three losses. But you made him work for it." },
      soClose: { headline: "SO CLOSE.", line: "Three venues, three losses. You had him worried there." },
    },
    pending: {
      headline: "NOT YET.",
      /** "1 of 3 venues played. The final whistle blows after all three." */
      of: "of",
      played: "venues played.",
      tail: "The final whistle blows after all three.",
    },
    teamUp: {
      eyebrow: "NEXT FIXTURE · OFF THE PITCH",
      title: "TEAM UP WITH YASH",
      body: "Hiring, building something, or just want a rematch? Send him a line.",
      cta: "TEAM UP",
    },
    next: { eyebrow: "NEXT VENUE", cta: "PLAY" },
    again: "PLAY AGAIN",
    card: "SEE THE PLAYER CARD",
    comm: {
      done: "The crowd's on its feet for the challenger.",
      pending: "Half-time. The rest of the matchday is waiting.",
    },
    note: "SAVED TO YOUR RECORD",
  },
  ```
  The `NEXT FIXTURE · OFF THE PITCH` eyebrow is written with the `·` glyph. If the file builds such lines from `ui.glyph.sep` elsewhere, store the two parts and join them in the view instead.

- [ ] **Step 2: Failing tests: grade and view.** `src/features/full-time/grade.test.ts`:
  ```ts
  import { describe, expect, it } from "vitest";
  import { FULL_TIME_GRADES, gradeFor } from "./grade";

  describe("gradeFor (F4)", () => {
    it("averages the three venues' best forms; a missing venue counts 0", () => {
      expect(gradeFor({})).toBe("goodTry");
      expect(gradeFor({ cricket: 1, tennis: 1 })).toBe("soClose"); // 2/3 ≥ 0.6
      expect(gradeFor({ cricket: 1 / 3, tennis: 1 / 3 })).toBe("niceEffort"); // 0.222
      expect(gradeFor({ cricket: 0.25, tennis: 0.25 })).toBe("goodTry"); // 0.1667 < 0.2
    });
    it("meets each threshold inclusively", () => {
      const at = (avg: number) => gradeFor({ cricket: avg, tennis: avg, badminton: avg });
      expect(at(FULL_TIME_GRADES.soClose)).toBe("soClose");
      expect(at(FULL_TIME_GRADES.niceEffort)).toBe("niceEffort");
    });
  });
  ```
  `src/features/full-time/view.test.ts` must cover:
  - **done** (all three played, forms 1/3 each):
    - toast eyebrow `MATCHDAY COMPLETE · 3 OF 3 VENUES`, title `FULL TIME`
    - board `{ home: { name: "YOU", score: "0" }, away: { name: "YASH", score: "3" }, winner: "away", label: "Final score: You 0, Yash 3" }`
    - headline `NICE EFFORT.`, its line
    - card Team Up → `/team-up`
    - links `PLAY AGAIN → /arena/cricket`, `SEE THE PLAYER CARD → /card`, `BACK TO THE HUB → /arena`
    - comm `done`
  - **pending with tennis played:**
    - eyebrow `MATCHDAY IN PROGRESS · 1 OF 3 VENUES`, board away score `1`
    - headline `NOT YET.`, line `1 of 3 venues played. The final whistle blows after all three.`
    - card eyebrow `NEXT VENUE`, title `CRICKET GROUND`, body = `ui.hub.venues.cricket.blurb`, cta `PLAY → /arena/cricket`
    - links = only BACK TO THE HUB; comm `pending`
  - **pending with cricket and tennis played:** the next venue is `BADMINTON HALL`.
  - **empty record:** pending, 0 played, next venue cricket.

  Run: `NODE_OPTIONS= pnpm exec vitest run src/features/full-time`. Expected: FAIL.

- [ ] **Step 3: Grade and view.** `src/features/full-time/grade.ts`:
  ```ts
  import { VENUES, type MatchRecordData } from "@/shell/matchRecord";

  export type Grade = "goodTry" | "niceEffort" | "soClose";
  /** F4: the average best perfect share across the three venues that earns each grade. */
  export const FULL_TIME_GRADES = { soClose: 0.6, niceEffort: 0.2 } as const;

  /** One verdict for the matchday: the three venues' best forms averaged (a venue not played counts 0). */
  export function gradeFor(bestForm: MatchRecordData["bestForm"]): Grade {
    const avg = VENUES.reduce((sum, v) => sum + (bestForm[v] ?? 0), 0) / VENUES.length;
    return avg >= FULL_TIME_GRADES.soClose
      ? "soClose"
      : avg >= FULL_TIME_GRADES.niceEffort
        ? "niceEffort"
        : "goodTry";
  }
  ```
  `src/features/full-time/view.ts`:
  - **The shape**, exported:
  ```ts
  export interface FullTimeView {
    state: "done" | "pending";
    toast: { eyebrow: string; title: string };
    board: {
      label: string;
      home: { name: string; score: string };
      away: { name: string; score: string };
      winner: "home" | "away";
    };
    headline: string;
    line: string;
    card: { eyebrow: string; title: string; body: string; cta: { label: string; to: string } };
    links: { label: string; to: string }[];
    comm: string;
    commTag: string;
    note: string;
  }
  ```
  - **How it's built:**
    - `done = matchdayComplete(record)`, and the played count is `VENUES.filter(v => record.venuesPlayed.includes(v)).length`
    - the eyebrow joins with `ui.glyph.sep` and `ui.hub.matchday.{of,venues}`
    - names come from `ui.hub.record.{you,yash}`
    - the board label is `${ui.fullTime.board}: ${sentence(you)} 0, ${sentence(yash)} ${n}` (title case, as in the test)
    - the next venue is the first of `VENUES` not played
    - pure: no React, no DOM, no storage

  Run the tests. Expected: PASS.

- [ ] **Step 4: Design-system parts.** First check `catalog.ts` and the broadcast folder for a toast or a board that already draws these; reuse one if it does, and say so in the report. Otherwise:
  - **`IconToast`** `{ icon: IconName; eyebrow: string; title: string; className?: string }` (Easter-Egg "achievement toast"):
    - a 64 px-wide volt tile holding the `Icon` (28 px, ink)
    - then a glass body (`Glass`), padding 12 / 22, gap 2: the eyebrow is mono 11 / .22em volt, the title is display 26 / 900 / .06em
    - the drawn drop shadow, from an existing shadow token
    - the eyebrow and title are real text (read by assistive tech); the icon is `aria-hidden`
  - **`ResultBoard`** `{ label: string; home: Side; away: Side; winner: "home" | "away"; glitch?: boolean }` with `Side = { name: string; score: string }` (Easter-Egg "flipped scoreboard"):
    - one row 64 px tall on the board ground with a line border
    - cells in order: home name, home score, away score (with a left border), away name; each is padded 22, display 900
    - names: 30 / .06em; scores: 40
    - the **winner's** name cell is volt with ink text; the winner's score is primary; the loser's name and score are dim (the drawn `#7D8893` / `#5D6670` tokens). No strike-through (F5).
    - `role="img"` with `aria-label={label}`, and its cells `aria-hidden`, so a screen reader hears one sentence
    - `glitch` adds the drawn 3.2 s `steps(1)` glitch loop
  - **Keyframes:** the artboard's `drop` (700 ms, `--ease-*` matching `cubic-bezier(.22,1,.36,1)`), `rise` (900 ms; check whether `rise-in` matches within ~2 %, and reuse it if so), `glitch` and `dust`. Use existing ones where they match (`Dust` already exists); add only the missing ones to `motion.css` + `catalog.ts`, with the global reduced-motion rule covering them.
  - **Stories:** `Result.stories.tsx` with both parts, the board as home-winner (the artboard) and away-winner (Full Time).
  - Export both from `src/design-system/index.ts`.

- [ ] **Step 5: Page.**
  - **`FullTimeStage`** (the 1440×900 stage, artboard coordinates, all `aria-hidden` scenery):
    - the single spotlight: a trapezoid cone at left 470 / top −40 / 500×980, volt fading down. Reuse `LightCone` / `Spotlight` if one draws it, else a scene part.
    - the floor glow ellipse at 420 / 740 / 600×120
    - four dust motes at the drawn spots (`Dust`)
    - toast centred at top 40; board centred at top 150 (glitch on)
    - the `h1` headline at top 270: display 150 / line-height .85 / 900, centred, the drawn volt text glow from a token; the line below it at 28 italic, 14 gap
    - the card at top 520, 720 wide, centred, padding 24 / 28, glass with a volt-a45 border: eyebrow / title 36 / body 15 on the left, the CTA as `Button` volt skewed 62 px with label 22 / .14em on the right
    - the links row at top 700: centred, gap 14, glass mono 12 / .16em, 50 px tall, padding 0 22
    - COMM bottom-left at 36 / 36 (`CommentaryBar`, the Hub's); the note bottom-right at 36 / 48, mono 12 / .14em dim
    - entrance delays as drawn: toast 0.4 s; headline 0.9 s; card 1.5 s; links 1.9 s
  - **`FullTimeColumn`** (F7):
    - inside `ScreenColumn` (tablets centred at max 640 px, one step up, as the Hub's column does)
    - stacked with the Hub column's gaps: toast (full width), board, `h1` (the Hub / games column heading recipe, never overflowing at 360 px: `text-balance`), line, card (CTA `bar-lg` full width under the text), links stacked (`bar`, secondary / ghost), note
    - no COMM
  - **`FullTimePage`:** `<Stage from="lg">` with the stage plus the column, CSS showing exactly one, exactly one `h1` rendered, as the games' `GamePage` does.
    - The record-bound parts carry `data-record-pending` while `ready` is false (H5): the toast's eyebrow, the board, the headline, the line, the card and the links.
    - The prerender (`ready=false`, empty record) is the "NOT YET." state.
  - **`FullTimeScreen`:**
    - reads `venuesPlayed` and `bestForm` with `useShallow`, plus `useRecordReady()`
    - builds the view with `useMemo`
    - on desktop says `view.comm` once ready (`useCommentary`, as `HubScreen` does)
  - **`app/routes/arena.full-time.tsx`** renders `<FullTimeScreen />` with `pageMeta("fullTime")`.
  - **`src/shell/sections.ts`:** add `"fullTime"` to `SECTIONS` (after `"scout"`), and update its test (`sectionForPath("/arena/full-time") === "fullTime"`).
  - **Fixture and stories:**
    - `fullTime.fixture.ts` exports `artboardView`: a `FullTimeView` holding the Easter-Egg's **own words**
      - toast `HIDDEN ACHIEVEMENT UNLOCKED` / `GIANT KILLER`
      - board home YOU 1, away YASH 0, winner home
      - headline `OKAY… YOU GOT ME.`, line `That doesn't happen often.`
      - card `NOW OPEN · ONLY FOR GIANT KILLERS` / `THE LOCKER ROOM` / its body / `ENTER`
      - links `TELL YASH YOU WON →`, `HE WANTS A REMATCH`, `BACK TO THE HUB`
      - comm `The crowd is on its feet. He's already asking for a rematch.`, note `TROPHY ADDED TO YOUR CABINET`

      It exists only so parity can measure the layout (F14). Say so in its doc comment.
    - It also exports `doneView(grade)` and `pendingView(n)` built with `buildFullTimeView` from seeded records.
    - `FullTimePage.stories.tsx`: Artboard, Done (each grade), Pending 0 / 2, plus 390×844 variants of Done and Pending.

- [ ] **Step 6: Tests.**
  - **`tests/stories/full-time.spec.ts`** (the existing story parity style):
    - the Artboard story vs `Easter-Egg@1440x900.png` ≤ 2 %, with the YASH strike-through box masked and logged
    - axe on Done and Pending at 1440 and 390
  - **`tests/e2e/full-time.spec.ts`** (Review Focus 2 and 5):
    - **No record:** NOT YET., 0 OF 3, the card goes to `/arena/cricket`.
    - **Seeded 2 venues:** NOT YET., the next venue named.
    - **Seeded 3 venues with forms:** the expected grade headline, YOU 0 · 3 YASH (via the board's label), TEAM UP → `/team-up`, PLAY AGAIN → `/arena/cricket`.
    - **Returning visitor with 3 venues:** the "NOT YET." words are never visible at any point (sample `page.getByText("NOT YET.")` visibility right after `goto` and after the record loads).
    - **Storage blocked** (the existing helper): renders NOT YET. without error.
    - **JavaScript off:** the page renders NOT YET. and BACK TO THE HUB is a working link.
    - **Viewports:** the 13 viewports of Review Focus 5 (reuse `VIEWPORTS` + the shared viewport checks from `tests/e2e/support/game.ts` where they fit; add the two short landscapes if absent): no horizontal scroll, one `h1`, mono ≥ 11 px, every link ≥ 44 px.
    - **Reduced motion:** the headline is visible at once (no rise).

  Run: `NODE_OPTIONS= pnpm exec vitest run`, `NODE_OPTIONS= pnpm build-storybook` + the stories spec, and the e2e file (4183 config if needed). Expected: PASS.

- [ ] **Step 7: Screenshots for review.** Save to the workspace `shots/` folder, through a temporary script on port 4183/4184:
  - 1440×900 Done (NICE EFFORT.) and Pending, after the entrance
  - 390×844 Done and Pending
  - 768×1024 Done
  - 360×640 Done, full page

  List the paths in the report.

- [ ] **Step 8: Commit.**
  ```bash
  git add -A src app tests
  git commit -m "feat(full-time): the matchday ends on Full Time, YOU 0 · 3 YASH with a grade for how close you came

  Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
  ```

---

## Task 3: Hub, Team Up and the win path's routes and content

**Files:**
- Modify:
  - Hub: `src/features/hub/{view.ts,view.test.ts,HubIndex.tsx,HubScreen.tsx,hub.fixture.ts,Hub.stories.tsx}`, `src/design-system/broadcast/IndexRail.tsx` (doc only), `src/design-system/broadcast/Hub.stories.tsx` / `Hub.test.tsx` (where they name achievements)
  - Team Up: `src/features/team-up/{ChallengeForm.tsx,view.ts,view.test.ts,TeamUpPage.fixture.ts}`
  - content: `src/content/{ui-copy.ts,content.json,schema.ts,schema.test.ts,selectors.test.ts}`
  - shell: `src/shell/{routes.ts,sections.ts,sections.test.ts,PlaceholderScreen.tsx}`
  - `app/routes.ts`
  - e2e: `tests/e2e/{hub,routes,team-up}.spec.ts`, `tests/stories/hub.spec.ts` (mask)
- Delete: `app/routes/arena.giant-killer.tsx`, `app/routes/locker-room.tsx`

**Interfaces:**
- Consumes:
  - Task 1: `MatchRecordData` (`yashWins`, `venuesPlayed`), `matchdayComplete`
  - Task 2: `SECTIONS` has `"fullTime"`, `ROUTES.fullTime`
- Produces: `HubRecord = Pick<MatchRecordData, "venuesPlayed" | "lastScores" | "sectionsSeen" | "yashWins">`; `HubView.fullTime: { label: string; text: string }` (replacing `achievements`).

- [ ] **Step 1: Copy and content.**
  - **`ui-copy.ts`:**
    - Remove `ui.routes.giantKiller`, `ui.routes.lockerRoom`, `ui.hub.index.links.lockerRoom` and `ui.hub.achievements`.
    - Add `ui.hub.index.links.fullTime: { label: "Full Time", tag: "RESULT" }` (derived), placed after `scout`.
    - Add `ui.hub.fullTime`:
    ```ts
    /** F8: the rail's bottom box, where the artboard draws HIDDEN ACHIEVEMENTS (derived). */
    fullTime: {
      label: "FULL TIME",
      pending: "The final whistle blows after all three venues.",
      done: "Final whistle. Your result is up.",
    },
    ```
    - Add `ui.pages.teamUp.prefill: "Good game, Yash."` (derived, F10).
  - **`content.json`:** remove the `"type": "locked"` trophy row and `commentary.visitorWins`.
  - **`schema.ts`:**
    - the trophy type enum loses `"locked"`, and `.length(6)` becomes `.length(5)`
    - `visitorWins` is removed
    - update `schema.test.ts` / `selectors.test.ts`; `getTrophies` loses its `locked` flag if the selector computes one (Task 4 consumes the result; keep the selector's other fields)
  - Leave `design/handoff/` untouched: it is the reference.

- [ ] **Step 2: Failing tests: Hub view.** In `src/features/hub/view.test.ts`:
  - Replace the achievement / Locker Room / `visitorWins` cases with:
  ```ts
  it("the rail's FULL TIME box waits for all three venues, then says the result is up (F8)", () => {
    const some = buildHubView(content, ui, ROUTES, { ...fresh, venuesPlayed: ["cricket"] });
    expect(some.fullTime).toEqual({ label: "FULL TIME", text: ui.hub.fullTime.pending });
    const all = buildHubView(content, ui, ROUTES, { ...fresh, venuesPlayed: ["cricket", "tennis", "badminton"] });
    expect(all.fullTime.text).toBe(ui.hub.fullTime.done);
  });

  it("lists Full Time in the index once the matchday is complete, SEEN once opened (F8)", () => {
    const keys = (r: HubRecord) => buildHubView(content, ui, ROUTES, r).index.links.map((l) => l.key);
    expect(keys({ ...fresh, venuesPlayed: ["cricket", "tennis"] })).not.toContain("fullTime");
    const done = { ...fresh, venuesPlayed: ["cricket", "tennis", "badminton"] as Venue[] };
    expect(keys(done).at(-1)).toBe("fullTime");
    const link = buildHubView(content, ui, ROUTES, { ...done, sectionsSeen: ["fullTime"] }).index.links.at(-1)!;
    expect(link).toMatchObject({ to: "/arena/full-time", tag: ui.hub.index.seen, seen: true });
  });

  it("the record chip always reads YOU 0", () => {
    expect(buildHubView(content, ui, ROUTES, { ...fresh, yashWins: 4 }).record.value).toBe("YASH 4 · YOU 0");
  });
  ```
  (`fresh` = the file's empty-record fixture, updated to the new `HubRecord`.)
  - Keep the COMM-by-progress cases (0 / 1 / 2 / 3 played).

  Run: `NODE_OPTIONS= pnpm exec vitest run src/features/hub`. Expected: FAIL.

- [ ] **Step 3: Hub.**
  - **`view.ts`:**
    - `HubRecord` as in Interfaces; `IndexKey` swaps `"lockerRoom"` for `"fullTime"`
    - the `INDEX` row becomes `{ key: "fullTime", seenWith: "fullTime", to: "fullTime" }`, filtered on `matchdayComplete(record)`
    - `ACHIEVEMENTS` is deleted; `achievements` becomes `fullTime: { label, text }`
    - the record value is `${hub.record.yash} ${record.yashWins} ${sep} ${hub.record.you} 0`
    - COMM is `comms[done] ?? hub.comm.none` (no `visitorWins`)
  - **`HubIndex.tsx`:** the footer renders `view.fullTime` (same `RailSection` + `Text`, same place: the artboard's box).
  - **`HubScreen.tsx`:** select `yashWins` in place of `record`, `achievements` and `lockerRoomUnlocked`.
  - Update `hub.fixture.ts` (the `artboardRecord`), the Hub stories, and the doc comments that mention achievements or the Locker Room. `IndexRail`'s `footer` doc becomes "Pinned to the bottom (the Hub's FULL TIME box)".
  - **Shell:**
    - `src/shell/sections.ts` drops `"lockerRoom"`
    - `src/shell/routes.ts` drops `giantKiller` and `lockerRoom`
    - `app/routes.ts` drops both lines, and their route files are deleted
    - `PlaceholderScreen`'s `MAP` gets no entry for them (check it compiles)
  - Run the Hub unit tests. Expected: PASS.

- [ ] **Step 4: Team Up prefill (F10).** Failing test first, in `src/features/team-up/view.test.ts` (or the file holding the form's pure helpers): add a pure helper in `form.ts`:
  ```ts
  /** F10: the message a visitor who has played starts with; only ever into an empty, untouched field. */
  export function prefillMessage(current: string, touched: boolean, played: boolean, prefill: string): string {
    return !touched && played && current === "" ? prefill : current;
  }
  ```
  Test cases:
  - played, untouched, empty → the prefill
  - not played → ""
  - touched (the visitor cleared it) → ""
  - typed text → kept

  In `ChallengeForm.tsx`:
  - read `venuesPlayed.length > 0` from `useMatchRecord` and `useRecordReady()`
  - once ready, set the message through `prefillMessage` in an effect
  - a `touched` ref flips on the first edit of the message field
  - after a send and "send another", the form resets to empty and the effect may prefill again (untouched)

  In `tests/e2e/team-up.spec.ts`, add:
  - a seeded played record → the message field reads "Good game, Yash."
  - no record → empty
  - clearing the field and blurring does not bring it back

- [ ] **Step 5: e2e and parity.**
  - **`tests/e2e/hub.spec.ts`:**
    - replace the achievements / Locker Room assertions
    - add a seeded **Phase 5 record** (Review Focus 1): `record: {yash: 2, you: 1}`, `achievements`, `lockerRoomUnlocked: true`, `teamUpPrefill`, 3 venues. Expected: the chip reads `YASH 2 · YOU 0`, the index has Full Time and no Locker Room, and no console error.
  - **`tests/e2e/routes.spec.ts`:** drop the two routes from its lists; `/locker-room` and `/arena/giant-killer` now render the Out of Bounds page (F11).
  - **`tests/stories/hub.spec.ts`:** mask the rail's bottom box (its words changed, F8). Log the box in the test with a one-line reason; Task 5 copies it into the spec.

  Run: `NODE_OPTIONS= pnpm exec vitest run` and the touched e2e and story specs. Expected: PASS.

- [ ] **Step 6: Commit.**
  ```bash
  git add -A src app tests
  git commit -m "feat(hub): FULL TIME replaces the hidden achievements; Team Up says good game; the win path's pages and copy go

  Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
  ```

---

## Task 4: Trophy Room with five trophies

**Files:**
- Modify:
  - Trophy Room: `src/features/trophies/{view.ts,view.test.ts,Cabinet.tsx,PlinthDetail.tsx,parts.test.tsx,TrophiesPage.fixture.ts,TrophiesPage.tsx}`
  - design system: `src/design-system/scene/{Trophy.tsx,Trophy.test.tsx,Trophy.stories.tsx}`
  - tests: `tests/e2e/trophies.spec.ts`, `tests/stories/trophies.spec.ts`

**Interfaces:**
- Consumes: Task 3's content (5 trophies, no `"locked"` type).
- Produces: `TrophyKind = "cup" | "medal" | "plaque" | "pennant" | "round"`; `TrophyView` without `locked`; the detail index reads `n / 5`.

- [ ] **Step 1: Failing tests.**
  - **`view.test.ts`:** five trophies, ids `trophy-1`…`trophy-5`, every one with a detail, `index` `"1 / 5"`…`"5 / 5"`, `defaultId` `trophy-1`.
  - **`parts.test.tsx`:**
    - no tab is disabled
    - the arrows move through all five
    - desktop: the cabinet has one shelf light between the shelves
    - phone: two shelf lights
  - **`Trophy.test.tsx`:** drop the locked kind cases.

  Run: `NODE_OPTIONS= pnpm exec vitest run src/features/trophies src/design-system/scene`. Expected: FAIL.

- [ ] **Step 2: Build.**
  - **Code:**
    - remove `locked` from `TrophyView`, `buildTrophiesView` (the `won` count is `all.length`), `Cabinet`'s `Cell` (no `disabled`, always a `Spotlight`) and `PlinthDetail`
    - remove the `"locked"` kind, its case and its `?` label from `Trophy.tsx` (and the `locked` cva variant)
    - update the stories ("All five figures")
  - **Layout (F9):**
    - **Desktop:** 3 on the top shelf, and the second shelf's **two centred** under them, keeping the drawn shelf heights and spotlight positions. For example, a 6-column grid where each cell spans 2 and the 4th starts at column 2, written as literal classes. Pick whatever reads cleanest, as long as the cells keep their drawn widths.
    - **Phone (2 per shelf):** the 5th is centred on its own shelf.
    - **Tablet:** follows the desktop or the phone rule, whichever the cabinet already uses there.
    - The `ShelfLight` placement logic still draws a bar after each full shelf but the last.

- [ ] **Step 3: Tests and parity.**
  - **`tests/e2e/trophies.spec.ts`:** five tabs, none disabled, every one selectable, the detail panel reads `5 / 5` on the last.
  - **`tests/stories/trophies.spec.ts`** and any route parity: mask the second shelf (the centred two, no locked outline) and log it with a reason.
  - Screenshots to `shots/`: 1440×900, 768×1024 and 390×844 of `/trophies`.

  Run: `NODE_OPTIONS= pnpm exec vitest run` and both specs. Expected: PASS.

- [ ] **Step 4: Commit.**
  ```bash
  git add -A src tests
  git commit -m "feat(trophies): the cabinet holds Yash's five trophies; the locked outline is gone

  Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
  ```

---

## Task 5: Journeys, budgets, docs, carry-over

**Files:**
- Modify:
  - tests and tools: `tests/e2e/journeys.spec.ts`, `tools/lighthouse.mjs`
  - docs: `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md`, `docs/superpowers/plans/phase-0-carryover.md`

- [ ] **Step 1: Journeys (§9.1, rewritten).** In `tests/e2e/journeys.spec.ts`:
  - Replace the forced-win journey with **the full matchday**:
    1. From the Hub, play cricket, tennis and badminton through on the fake clock (any quality; reuse the per-game helpers).
    2. After the third game, SEE FULL TIME → `/arena/full-time`, which shows YOU 0 · 3 YASH and a grade headline.
    3. TEAM UP → `/team-up`, whose message reads "Good game, Yash."
    4. Back at `/arena`, the index lists Full Time (SEEN).
  - Add **storage blocked** for the same journey (Review Focus 3): the third game's end still offers SEE FULL TIME, and Full Time shows the done state in that visit.
  - Keep the other journeys (the career path, SKIP, keyboard, reduced motion), updated for Task 1's shapes.

- [ ] **Step 2: Lighthouse (F13).**
  - Add `/arena/full-time` to `PAGES` in `tools/lighthouse.mjs`, with `/arena`'s gates, in the shape the file uses.
  - Run `NODE_OPTIONS= pnpm build && NODE_OPTIONS= pnpm lighthouse`. It must say the budget is met.
  - Paste the table in the report.

- [ ] **Step 3: Spec.** In `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md`:
  - **New §11.14 "Yash always wins and Full Time (Phase 6)"**, the shape of §11.13:
    - F1–F14 as built, opening with the owner decision (2026-10-14, Yash: "it is my portfolio so I will [win] every time")
    - the record migration
    - the design-system additions (`IconToast`, `ResultBoard`, any keyframes)
    - the masks the visual tests accept (exact boxes, with reasons)
    - token merges > ~2 %
    - the Lighthouse numbers
  - **Rows it replaces:** mark each as superseded by §11.14 with a one-line pointer. Don't delete the old text; strike it with `~~…~~` where it is a table cell, or add "(superseded, §11.14)":
    - §8 Outcome, §8.1–8.3 win clauses
    - §9.1 forced-win journey
    - §10 phase 6 row: "Full Time + cleanup: Yash always wins, the matchday ends on Full Time (YOU 0 · 3 YASH, graded), the Hub's FULL TIME box, Team Up prefill, five trophies", exit check "Full-matchday journey passes end to end"
    - §11.3, H6, H7, H8, T3, G4, G5, G6, G8, G16
    - the §12 Locker Room and Giant Killer trophy rows
  - **New §12 rows:**
    - the Full Time page (stage flipped from Easter-Egg; the derived column)
    - the Hub FULL TIME box
    - the Team Up prefill
    - the five-trophy cabinet layout

- [ ] **Step 4: Carry-over.** In `docs/superpowers/plans/phase-0-carryover.md`:
  - Tick the count-up row with "closed unbuilt: no Locker Room, nothing counts up (Phase 6, §11.14)".
  - Under "Phase 8 — 3D games", add: "The opponent is a Yash bot that always wins (owner decision 2026-10-14, §11.14): a 3D visitor win must never exist."
  - Add any rows the reviews produce.

- [ ] **Step 5: Verify and commit.**
  - Run `NODE_OPTIONS= pnpm verify`. If 4173 is busy, run its e2e step through the 4183 config, and say so in the report.
  - Commit:
  ```bash
  git add -A tests tools docs
  git commit -m "docs(spec): section 11.14, Yash always wins and the matchday ends at Full Time; journeys and lighthouse cover it

  Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
  ```

---

## Execution order and model

Sequential, one Sonnet 5.5 builder per task (1 → 5). The tasks share:
- **the record and `EndFlags`:** 1 → 2, 3, 5
- **`ROUTES.fullTime` and `SECTIONS.fullTime`:** 1, 2 → 3
- **content (5 trophies):** 3 → 4

After each task the orchestrator reviews the diff, with screenshots for Tasks 2 and 4. After Task 5:
1. An Opus 5.5 whole-phase review.
2. One fix wave.
3. Full `pnpm verify` + Lighthouse.
4. The progress meter.
5. Yash previews and OKs the merge.
6. Fast-forward to `main`.

## Self-review notes (orchestrator)

- **Owner decision coverage:**

  | Decision | Covered by |
  |---|---|
  | No visitor win | Task 1 (referees, views, end, e2e), Review Focus 4 |
  | No Giant Killer, Locker Room or achievements | Tasks 1 (copy, claim), 3 (routes, Hub, content), 4 (trophy) |
  | Full Time only at the end, YOU 0 · 3 YASH, a grade, the text on that page | Task 2; F3 + Task 1 (SEE FULL TIME) |
  | Team Up "Good game, Yash." | Task 3 |
  | Trophy spot removed | Task 4 |

- **Placeholders:** none. Copy is exact in each task. The Full Time stage coordinates are the artboard's, listed in Task 2, Step 5. The mask boxes are measured by the parity tests, by instruction.
- **Types used with the same names across tasks:**
  - games and record: `perfectShare`, `EndFlags`, `NO_END_FLAGS`, `MatchRecordData` (`bestForm`, `yashWins`), `matchdayComplete`, `completeMatch({ venue, score, form })`
  - routes and copy: `ROUTES.fullTime`, `ui.routes.fullTime`, `ui.games.fullTime`, `ui.fullTime`, `ui.hub.fullTime`, `ui.hub.index.links.fullTime`, `ui.pages.teamUp.prefill`, `SECTIONS` `"fullTime"`
  - Full Time: `gradeFor`, `FULL_TIME_GRADES`, `Grade`, `buildFullTimeView`, `FullTimeView`
  - design system: `IconToast`, `ResultBoard`
  - Hub and Team Up: `HubView.fullTime`, `prefillMessage`
- **Review Focus → tests:**

  | # | Tests |
  |---|---|
  | 1 | Task 1 unit + Task 3 e2e |
  | 2 | Task 2 e2e |
  | 3 | Task 1 unit + Task 5 journey |
  | 4 | Task 1 unit + e2e |
  | 5 | Task 2 e2e |
