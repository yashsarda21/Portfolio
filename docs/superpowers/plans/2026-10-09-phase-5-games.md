# Phase 5 — Games Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**What this plan does (plain words):**

**Three real games** at `/arena/cricket`, `/arena/tennis` and `/arena/badminton`, replacing the "coming in Phase 5" pages:
- **Cricket, Bowl at Me** (your working prototype, made exact):
  - A cursor sweeps across the length meter.
  - You release with Space, Enter, a click, or a tap on the phone.
  - Yash bats three balls. The calls are DOT BALL, FOUR, SIX, or (about 1 in 100) BOWLED HIM.
  - Every ball unlocks one innings on the STADIUM SCREEN: Deutsche Bank SE1, the internship, then the PICT academy.
- **Tennis, Return of Serve:**
  - Yash serves three times, faster each time (178, 186, 194 km/h).
  - The open side lights up. Pick it with ← → or a click (swipe or tap on the phone) before the bounce.
  - Every return puts one project courtside, in the order QF → SF → FINAL.
- **Badminton, Smash or Clear:**
  - Hold to charge the power meter and release to play: SMASH, CLEAR or DROP.
  - There are four rallies up to match point at 20–19.
  - Every rally charges one skill group: Backend, Frontend, Data, then Craft.

**Every game also has:**
- **Score bug and COMM:** the score bug in the top bar and the COMM line on desktop.
- **Always on screen:** SKIP TO … and QUICK VIEW.
- **The call:** a big "SIX." or "ACE." after each input.
- **The verdict and the end:**
  - A 2-second verdict.
  - Then the end buttons: see the full page, or play again.
  - After a win, CLAIM … goes to the Giant Killer page (built in Phase 6).
- **Saved progress:** your result is saved, so the Hub shows **PLAYED · 14\* NOT OUT** and REMATCH.
- **After two losses at the same venue:** the end offers **WATCH THE HIGHLIGHT INSTEAD**.
- **Reduced motion:** the game becomes a 3-second auto-rally, then everything is revealed.
- **Phone and iPad:** a one-thumb layout, like your Mobile-Game board. The score is at the top, SKIP and QUICK VIEW are near it, the latest reveal is in a chip, and a big thumb button sits at the bottom.

**Goal:** the three game routes match their drawn states within 2 % (logged deviations masked):
- **Boards:** `Cricket-Play@1440x900`, `Tennis-Play@1440x900`, `Badminton-Play@1440x900` and `Mobile-Game@390x844`.
- **Referees:**
  - pure and unit-tested, including a forced win, a forced loss and the 1 % maths
  - every input reveals content
  - results are saved to the match record and shown on the Hub
- **Checks:** axe clean, Lighthouse budget met, `pnpm verify` green.

**Architecture:**
- **Referee and look (spec §8).** Each game has a **referee** (plain TypeScript, no React: "given the game so far and this input, what happens?") and a **look**. The referees live in `src/features/games/{cricket,tennis,badminton}/referee.ts`. Shared maths sits beside them in `src/features/games/engine/`: the clock, luck, beats and the session's loss count.
- **View builder per game.** A pure `build<Game>View(…)` turns content, copy and a referee state into everything shown. The page components hold no logic and no strings. This is the Hub's pattern.
- **One shared game frame** in `src/features/games/frame/`, so the three games never repeat their chrome:
  - **`GameStage`:** HUD with breadcrumb, score-bug slot, Quick View and sound, plus COMM bottom-left and SKIP bottom-right.
  - **`GameColumn`:** the phone's top row, reveal chip, Quick View, field and thumb zone.
  - **`GameEnd`** and **`GameAnnouncer`**.
  - **Runtime hooks:** `useGameClock` (one rAF clock drives both the meter you see and the hit check), `useGameKeys`, `useTimers` and `useMatchResult`.
- **New generic design-system pieces**, prop-driven and with stories:
  - **scene:** `GameBackdrop` (turf / court / hall × stage / column), `TrackingRing`, `TracerPath`
  - **broadcast:** `TimingMeter`, `PowerMeter`, `BallTracker`, `CallOverlay`, `AimZone`, `RevealList` (+ chip), `CourtsideCard`, `AttributeToast`, `LEDMarquee`
- **Same split as the Hub:**
  - `<Stage from="lg">` holds the 1440×900 board. The game column holds phones and tablets.
  - CSS shows exactly one of them, so the prerendered HTML never flashes the wrong layout.
  - Both layouts render from the same game state, so a resize mid-game keeps the game.

**Tech Stack:** React 19, React Router 8 (prerender, `ssr:false`), Tailwind v4 Arena tokens, Zustand persist (the match record), GSAP 3 core (lazy via `loadGsap()`, for the ball and shuttle flights), Vitest + Testing Library, Playwright (+ its fake clock) + axe + pixelmatch, Lighthouse.

**Spec:** `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md`:
- §1 (done = 1440×900 + 390×844)
- §2 D2
- §4.4 (Stage)
- §4.5 (game routes; `/arena/giant-killer` reached only after a win)
- §4.6 (transitions; commentary; audio slots `bat` / `net` / `smash`; match record)
- §5.3 (composites: TimingMeter, PowerMeter, AimZone, BallTracker, CallOverlay, RevealSlots, CourtsideCard, AttributeToast; scene HawkEye / tracer)
- §7 (ball / shuttle arcs = GSAP swing; reduced motion; perf rules)
- **§8, §8.1, §8.2, §8.3 (the rules: binding)**
- §9.1 (journeys: Landing → Intro → Hub → Cricket → reveals → Career; Skip on every game; forced-win path; reduced motion; keyboard only)
- §10 phase 5 row
- §11.1 A2, A4, A5, A7, A8
- §11.2 #8, #9, #13, #24, #26
- §11.3 (Tennis and Badminton wins route to Giant Killer)
- §11.11 L11 (phones silent)

**Measuring tape (builders read these):**
- `design/handoff/design-source/Cricket-Play.dc.html` (the working prototype: layout, algorithm, lines), `Tennis-Play.dc.html`, `Badminton-Play.dc.html`, `Mobile-Game.dc.html`, `Game-System.dc.html`. Every coordinate below comes from them.
- `design/handoff/README.md` §5 (game loop, fair play, the 1 %)
- `docs/superpowers/specs/2026-10-03-arena-design-audit.md`:
  - §3.6 rows 56–62 (TimingMeter, BallTracker, CallOverlay, PowerMeter, AimZone, TrackingRing / TracerPath, LEDMarquee)
  - §6.1 (cricket algorithm and its gaps), §6.6 (tennis / badminton gaps)
  - §7.1 copy rows Cricket-Play, Tennis-Play, Badminton-Play, Mobile
  - §9 the "Game" row
  - §10 risks 1, 7
- References: `design/references/{Cricket-Play,Tennis-Play,Badminton-Play}@1440x900.png`, `design/references/Mobile-Game@390x844.png`

**Carry-over absorbed** (`docs/superpowers/plans/phase-0-carryover.md`; Task 8 ticks them):
- "Academy innings number is `careers.length + 1`; revisit with a third role (Phase 5, cricket)" → Task 5: the over reveals the first two career innings, then the academy (G7), and is unit-tested with three careers.
- "ScoreBug cell padding is 16px here vs 14px on the artboard (Phase 5)" → Task 3: `ScoreBug.Cell pad="tight"` (14) for tennis and badminton; cricket keeps 16, as drawn.
- "A2: the small ScoreBug uses an 11px mono floor where the artboard has 10px (keep 11px, log)" → logged in §11.13 (Task 8).
- "Count-up has no controlled trigger …" → ruling G14 (game digits snap; the row moves to Phase 6).
- "The Hub's PLAY / REMATCH go to placeholders …" and "agree the score string format" → Tasks 5–7 and G8.

---

## Rulings for Yash to confirm

| # | Decision | Why | Easy to flip? |
|---|---|---|---|
| G1 | **Layouts.**<br>• From 1200 px: the drawn 1440×900 stage.<br>• Phones **and iPads**: the one-thumb column, from your Mobile-Game board. On a tablet it is centred (max 640 px) and one size step up, as on the Hub, Landing and Intro.<br>• Keys work on the column too (an iPad with a keyboard). | Same as H1 / D-7. A 1024 px stage would shrink the meter labels to ~8 px. | Medium |
| G2 | **One clock.**<br>• A single `requestAnimationFrame` clock moves the meter and also decides the hit, so what you see is what is judged (fixes the prototype's drift, audit §6.1).<br>• The meter moves by `transform` only.<br>• While the tab is hidden the clock pauses, and a tennis serve in flight is served again. | Spec §8 game clock. | — |
| G3 | **Controls.**<br>• **Cricket:** Space / Enter / click BOWL · SPACE; on the phone, tap TAP TO BOWL.<br>• **Tennis:** ← → or click a side; on the phone, swipe left / right on the court, or tap the big ← / → halves of the thumb zone (derived).<br>• **Badminton:** hold Space or press and hold HOLD · RELEASE; on the phone, press and hold the big button (derived).<br>**Key rules (A8):**<br>• Keys listen **only while a game is waiting for you**.<br>• They are ignored in fields and with Ctrl / Cmd / Alt.<br>• Space / Enter on a focused link or button does that control's own job, never also a shot. | Spec §8 input; README fair play; A8. | Yes |
| G4 | **Cricket = your prototype, verbatim.**<br>• Zones: desktop perfect ±3.5 %, good ±12 %. Phone perfect ±5 %, good ±14 % ("wider on touch", as drawn).<br>• Balls 1–2: perfect → DOT BALL, good → FOUR, miss → SIX.<br>• Ball 3: BOWLED HIM only if all three were perfect **and** the 12 % luck roll lands. Otherwise FOUR / FOUR / SIX.<br>• All 7 commentary lines verbatim. | Spec §8.1, §11.2 #26. | — |
| G5 | **Tennis details (derived where spec §8.2 is silent):**<br>• Before each serve the open side is drawn at random. It lights up 0.3 s later, then Yash's toss lasts a random 0.4–0.9 s.<br>• Your reaction window runs **from the hit**: 900 / 700 / 500 ms (+25 % on the phone layout).<br>• Correct side in the first 40 % = perfect; correct side in time = good; wrong side, too late or **too early (before the hit)** = miss. Too early stops key-mashing.<br>• Calls: CLEAN RETURN. / RETURNED. / ACE. / WRONG SIDE. / TOO EARLY.<br>• Serve 3: Yash's winner clips the line (ON THE LINE.) unless all three were perfect and the luck roll lands (RETURN WINNER.).<br>• **Score bug:** a story told in tennis points. The serves are played at 15–15, 30–15 and **40–30** (your artboard's rally 3), and the game ends GAME YASH (or BROKE SERVE on a win). | Spec §8.2 leaves these open. Real tennis points can't come out of 3 returns cleanly, so the bug narrates. | Yes |
| G6 | **Badminton details (derived where spec §8.3 is silent):**<br>• The meter fills 8 % → 86 % linearly and bounces while held.<br>• Release zones (as drawn): SMASH top 20 %, CLEAR 20–60 %, DROP bottom 40 %.<br>• The "perfect weight" band is 20–26 % (6 % tall, inside DROP) and is **not drawn** (your artboard has none; only the call PERFECT WEIGHT. tells you).<br>• Score: 17–19 → 18 → 19 → **20–19 MATCH POINT** (your artboard). A loss ends 21–19. The 1 % win is the drop that gets through at 20–19: the bug reads 20–20 and the call is IT GETS THROUGH. | Spec §8.3; artboard. | Yes |
| G7 | **What each input reveals:**<br>• **Cricket:** innings 01 (current role), 02 (internship), then the academy. With a third role later: the first two innings, then the academy.<br>• **Tennis:** QF → SF → FINAL courtside cards with each project's content `line` (your artboard's shorter blurbs differ: content wins, §11.2).<br>• **Badminton:** Backend → Frontend → Data → Craft (content order, §11.2 #8). Each toast shows the group's shot and its **shipped** skills as chips (this matches your drawn Java · Spring Boot · JUnit and Oracle · SQL). Upcoming groups read `UP NEXT · RALLY n` / `RALLY n`, never LOCKED (§11.2 #24).<br>• Cricket's `INNINGS 02 · LOCKED / BOWL BALL 2` rows stay **as drawn** (no spec change there). | Spec §8, §11.2. | Yes |
| G8 | **Verdict, end and saving:**<br>• After the last input, the call holds for 2 s (the verdict), then the end buttons appear.<br>• **Loss:** SEE THE FULL SCORECARD / BOWL AGAIN (cricket, your prototype). Tennis: SEE MATCH HIGHLIGHTS / REMATCH. Badminton: SEE PLAYER ATTRIBUTES / REMATCH.<br>• **Win:** CLAIM YOUR WICKET (prototype); tennis CLAIM YOUR BREAK; badminton CLAIM YOUR POINT. The claim goes to `/arena/giant-killer`.<br>• The result is saved **the moment it is known**, even if you leave during the verdict.<br>• **Saved scores (shown on the Hub as `PLAYED · <score>`):** cricket `14* NOT OUT` / `0 OUT` (a win is always dot, dot, wicket); tennis `GAME YASH` / `BROKE SERVE`; badminton `21–19` / `20–20`.<br>• A win also unlocks the Locker Room, adds the Giant Killer achievement and saves the Team Up prefill "I beat you." (Phase 6 reads it). | Spec §8 outcome; README loop "Verdict 2s → Continue"; carry-over "agree the score string". | Yes (copy) |
| G9 | **"Watch the highlight instead":** after your 2nd loss at the same venue in one visit, the end's main button becomes WATCH THE HIGHLIGHT INSTEAD (→ that venue's page: Career, Highlights or Attributes). Play-again stays beside it. | README fair play. "One visit" = until the page reloads. | Yes |
| G10 | **Reduced motion:**<br>• No live game. On arrival a 3 s **auto-rally** plays: the inputs resolve one by one with no movement (things swap instantly), each reveal appears, then the verdict and end buttons.<br>• It plays out as Yash's win and is saved like any loss (cricket's auto over is 4, 6, 4 = `14* NOT OUT`).<br>• REMATCH replays it. | Spec §7, §8 fair play. | Yes |
| G11 | **Fair play and accessibility:**<br>• SKIP and QUICK VIEW are visible and ≥ 44 px on every game layout. On the phone QUICK VIEW sits right-aligned under the reveal chip (A5: the board has none).<br>• The game pictures are hidden from screen readers. The buttons are real buttons.<br>• A polite live region reads each call plus what it revealed, **on phones too** (the reveals are content).<br>• Each game has one `h1`: BOWL AT ME (visible, as drawn), RETURN OF SERVE (visible, the instruction pill's label), SMASH OR CLEAR (screen-reader only: the board draws no title). The phone layout's `h1` is screen-reader only.<br>• With prompt play every game ends inside 15 s (unit-tested from the beat constants). Nothing is ever auto-played for you in cricket or badminton. | README fair play; A5, A7. | — |
| G12 | **Commentary (desktop only, L11):**<br>• **Cricket:** your prototype's lines.<br>• **Tennis and badminton:** the content lexicon (entrance, yashWins, visitorWins) plus the drawn lines ("Another project shipped. He's not letting up." / "Match point. He's done this before."), and a few **derived lines flagged for your review** (listed in Task 1). | Spec §6, §12. | Yes (copy) |
| G13 | **Phone extras (derived):**<br>• The big call ("SIX.") also shows on the phone, smaller. It is the only feedback there (the board draws none).<br>• Haptic: a 20 ms vibration on release where the device supports it (not with reduced motion). | Mobile-Game hint "HAPTIC ON RELEASE". | Yes |
| G14 | **No count-up in games.** Score digits swap with the 200 ms snap (README "score digits"). The "controlled count-up" carry-over moves to Phase 6 (Locker Room record). | Spec §7; YAGNI. | Yes |
| G15 | **Sound hooks:** bat (cricket hit), net (tennis return), smash (badminton). They stay silent until audio files arrive in Phase 7. | Spec §4.6 audio slots. | Yes |
| G16 | **The win goes to `/arena/giant-killer`,** which is still the placeholder until Phase 6 builds the Giant Killer screen. | Phase split. | — |
| G17 | **Lighthouse on the three game routes (desktop):** performance ≥ 90, accessibility 100, best practices ≥ 0.9, SEO ≥ 0.9, FCP ≤ 1.5 s, CLS ≤ 0.1 (the Hub's gates). | Spec §9.1. | Yes |
| G18 | **Pixel parity:**<br>• Cricket: the **live route** at 1440×900 (the fresh state *is* the board; the test freezes the clock).<br>• Tennis, Badminton and Mobile-Game: **stories** in their drawn mid-game states.<br>• Logged masks:<br>&nbsp;&nbsp;– tennis: the card blurbs (content wins) and the serve speed (194 at rally 3 vs the drawn 186)<br>&nbsp;&nbsp;– badminton: the toast column (content order, three charged at 20–19, UP NEXT copy) and the drawn "WIN RALLY 3"<br>&nbsp;&nbsp;– phone: the added QUICK VIEW chip and the 9–10 px → 11 px text (A2) | Drawn states are mid-game. | — |

---

## Global Constraints

All Phase 0–4 constraints apply:
- **Styling:**
  - Arena tokens only; literal class strings.
  - **No pixel fitting in feature code** (`src/features/styleRules.test.ts` guard).
  - Stage screens place parts at **artboard coordinates** with spacing-scale classes (e.g. `top-27.5 left-9`).
  - **Check that no existing type recipe, token, shadow, utility or component matches before adding one** (`src/design-system/tokens/catalog.ts`; earlier phases merged duplicates). Reuse `ScoreBug`, `PlayerTag`, `SkipChip`, `Breadcrumb`, `HUD`, `Glass`, `Button`, `Chip`, `MediaSlot`, `KeyboardHint`, `animate-pop`, `FloodlightBank`, `CrowdTier`, `SkyGlow`, `mono-fit`. A new merge that moves a value by more than ~2 % is logged in the spec (Task 8).
  - No raw hex / rgb / cubic-bezier in TS/TSX, no arbitrary type sizes, no inline `var(--color-*)`. GSAP eases come from `src/lib/motion.ts` (`EASE`). ESLint already rejects raw `shadow-[`, `blur-[` and `drop-shadow-[`. SVG scene art takes colours from tokens (`fill="var(--…)"` semantic / scene tokens or `currentColor`), never literals.
  - Any font override next to a `type-*` class is a **separate `cn()` argument after the type class** (carry-over convention).
- **Accessibility:**
  - Mono ≥ 11 px on screen (A2; on the stage, floored labels use `mono-fit` so they keep their drawn width). Contrast ≥ 4.5:1. Volt focus ring (A3). Targets ≥ 44 px.
  - Nothing invisible is focusable or clickable.
  - Exactly one rendered `<h1>` at every width.
  - Scenes and game visuals are `aria-hidden`; controls are real `<button>`s with names that contain their visible text (WCAG 2.5.3).
- **No visible copy in components or routes.** New strings go in `src/content/ui-copy.ts` under `ui.games` (Task 1, exact strings). Lines from `content.commentary` are read from content. Design-system components take every word as a prop.
- **Folder rules:**
  - features import shell / design-system / content / lib / assets
  - design-system imports nothing from content / shell / features
  - features never import each other. `src/features/games/` is **one** feature: its subfolders import each other with **relative** paths (`../engine/clock`), never `@/features/…`.
- **Referees are pure:**
  - no React, no DOM, no timers, no `Math.random`
  - randomness arrives as a `Luck` parameter, whose default (`Math.random`) is applied only in the screen components
  - copy is never inside a referee (referees return keys; view builders turn them into words)
- **Motion:**
  - GSAP is core only, never imported at module top level, always `await loadGsap()`. Every tween is killed on unmount and on rematch.
  - Animate only `transform` and `opacity`. No layout reads inside a rAF loop.
  - Game keys and pointer listeners attach **only while the game waits for an input** and detach on leave.
- **Match record:** written only through `useMatchRecord.getState().completeMatch(…)`, via `useMatchResult` (Task 4), exactly once per finished game. Storage key stays `arena:v1`.
- **Never touch** `Yash-Sarda-Resume.pdf`. `player.resumePdf` stays `null`.
- **Lean testing:**
  - unit tests for every referee and pure helper (zones, windows, scores, luck, beats, auto-rally scripts, view builders) and for the hooks (fake timers and rAF)
  - component tests only for the interactive design-system pieces (`AimZone`, `RevealList` states)
  - parity: one route (cricket) and three stories
  - e2e driven by Playwright's fake clock (`page.clock`) and a stubbed `Math.random` (`addInitScript`), never by real-time sleeps
  - no snapshot tests
- **Git and environment:**
  - git 2.15 (no `switch` / `restore`). Branch `phase/5-games` (already created from `main` at `09511bf`).
  - Builder commits end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
  - Ports: tests use 4173 / 6007. **Never kill processes you didn't start**: 6006 and 5173–5176 are Yash's.
  - The host is often heavily loaded: re-run timeouts with `--workers=2`, never weaken an assertion.

## Review Focus

1. **Racing and doubled inputs.** For each of these, one input = exactly one ball / return / rally:
   - Space held down (key repeat); Space pressed while the BOWL button has focus (native click + key); a click and a key in the same frame
   - pressing during the flight, the call, the verdict, or while a page transition covers the screen
   - REMATCH pressed while a flight or a timer is pending (no stale timer fires into the new game)
   - leaving mid-game: no record written, no console error, no listener left on `window`

   Tests: Task 4 unit (`useGameKeys`, `useTimers`), Task 5 e2e.
2. **Time going wrong.**
   - The tab hidden mid-meter or mid-serve: the clock pauses. The meter resumes where it was, and the serve is served again (it is never judged on time spent hidden).
   - A slow frame (the rAF stalls 200 ms) never shifts the judged position away from the drawn one by more than the frame gap: the hit reads the clock, not the frame.

   Tests: Task 4 unit (`createGameClock`, `useGameClock`), Task 6 e2e (hidden mid-serve).
3. **Resize or rotate across 1200 px mid-game.**
   - The game state carries over (same ball / serve / rally, same reveals).
   - Exactly one layout is visible.
   - Cricket's judged zones switch to the layout now shown.
   - No console error; no tween is left on an unmounted node.

   Tests: Task 5 e2e.
4. **Storage blocked or the write failing.**
   - The game still plays to the end, and the end buttons work.
   - Each finished game is recorded exactly once: a rematch records a second game, and a re-render records nothing.

   Tests: Task 4 unit (`useMatchResult`), Task 5 e2e (blocked storage).
5. **Viewport extremes.** At 2560×1080, 1440×900, 1366×768, 1280×720, 1200×800, 1199×800, 1024×768, 768×1024, 390×844, 375×667 and 360×640, for each game:
   - no horizontal scroll
   - exactly one rendered `<h1>`
   - rendered mono ≥ 11 px
   - SKIP and QUICK VIEW visible, ≥ 44 px tall, never overlapping
   - on the column, the thumb button and the meter fully on screen without scrolling (375×667, 360×640)
   - on the stage, nothing wraps that the board draws on one line (`mono-fit`)

   Tests: a shared viewport helper (Task 4) used by Tasks 5–7.

---

## Task 1: Games data (copy, engine maths, three referees), no UI

**Files:**
- Modify: `src/content/ui-copy.ts` (add `ui.games`, add `ui.glyph.prev`)
- Modify: `src/lib/breakpoints.ts` (add `MEDIA.reducedMotion`); `src/features/hub/HubStage.tsx` (its local `REDUCED_MOTION` constant uses `MEDIA.reducedMotion`)
- Create:
  - `src/features/games/engine/{types,luck,clock,beats,session}.ts` (+ `luck.test.ts`, `clock.test.ts`, `beats.test.ts`, `session.test.ts`)
  - `src/features/games/cricket/referee.ts` (+ `referee.test.ts`)
  - `src/features/games/tennis/referee.ts` (+ `referee.test.ts`)
  - `src/features/games/badminton/referee.ts` (+ `referee.test.ts`)

**Interfaces:**
- Produces (later tasks use these exact names):
  - `engine/types.ts`: `type Quality = "perfect" | "good" | "miss"`, `type Luck = () => number`, `type Winner = "yash" | "you"`, `type GameLayout = "stage" | "column"`
  - `engine/luck.ts`: `LUCK_ODDS = 0.12`, `luckyWin(perfectStreak: boolean, luck: Luck): boolean`, `winChance(perfectRate: number, inputs: number): number`
  - `engine/clock.ts`: `pingPong(elapsedMs: number, periodMs: number): number`, `createGameClock(now?: () => number): GameClock` with `GameClock = { start(): void; pause(): void; resume(): void; elapsed(): number; running(): boolean }`
  - `engine/beats.ts`: `VERDICT_MS = 2000`, `AUTO_RALLY_MS = 3000`, `MAX_GAME_MS = 15000`, `autoRallyTimes(inputs: number, totalMs?: number): number[]`
  - `engine/session.ts`: `OFFER_AFTER_LOSSES = 2`, `noteLoss(venue: Venue): number`, `resetLosses(): void`
  - The cricket, tennis and badminton referees: the exports in Steps 4–6.
  - `MEDIA.reducedMotion = "(prefers-reduced-motion: reduce)"`

- [ ] **Step 1: Copy.** Add to `ui` in `src/content/ui-copy.ts` (exact strings; parts are joined by the view builders, never retyped). Add `prev: "←"` to `ui.glyph`.

  Lines marked `// derived` are flagged for Yash (G12); the rest are drawn or from the prototype.

```ts
  games: {
    /** The score bug's group name for screen readers. */
    bug: "Score",
    yash: "YASH",
    you: "YOU",
    rally: "RALLY",
    unlocked: "UNLOCKED",
    /** G9: after two losses at one venue. */
    highlight: "WATCH THE HIGHLIGHT INSTEAD",
    /** Saved for Team Up on a win (spec §8 outcome; Phase 6 reads it). */
    prefill: "I beat you.",
    /** Shown by the column under the reveal chip until the first reveal (derived). */
    firstReveal: "EVERY INPUT UNLOCKS SOMETHING",
    cricket: {
      title: "BOWL AT ME",
      headline: "3 BALLS. ONE BATTER WHO HATES GETTING OUT.",
      how: "Release when the marker hits the yorker zone. Every ball you bowl — wicket or six — unlocks an innings of my career.",
      screen: "STADIUM SCREEN",
      innings: "INNINGS",
      locked: "LOCKED",
      bowlBall: "BOWL BALL",
      meter: { short: "SHORT", yorker: "YORKER", full: "FULL TOSS" },
      pitch: { yorker: "YORKER", good: "GOOD LENGTH" },
      onStrike: "ON STRIKE",
      bowling: "BOWLING",
      away: "YOU BOWLING",
      ball: "BALL",
      of: "OF",
      over: "OVER COMPLETE",
      notOutMark: "*",
      notOut: "NOT OUT",
      out: "OUT",
      bowl: "BOWL · SPACE",
      bowlPhone: "TAP TO BOWL",
      touchHint: "WIDER YORKER ZONE ON TOUCH · HAPTIC ON RELEASE",
      calls: { dot: "DOT BALL.", four: "FOUR.", six: "SIX.", bowled: "BOWLED HIM." },
      comm: {
        start: "Your ball. Let's see what you've got.",
        dot: "Yorker. Dug out. I respect that.",
        four: "On a length. Still found the gap.",
        six: "Too short. That one is going on the highlight reel.",
        lastPerfect: "Perfect yorker. Flicked off the toes anyway. Still not out.",
        lastGood: "Good ball. Better shot. Career high score updated.",
        lastSix: "Into the second tier. Still not out.",
        bowled: "Middle stump. Okay… you got me. That doesn't happen often.",
      },
      see: "SEE THE FULL SCORECARD",
      again: "BOWL AGAIN",
      claim: "CLAIM YOUR WICKET",
      skip: "SKIP TO CAREER STATS",
    },
    tennis: {
      title: "RETURN OF SERVE",
      how: "Pick the open side before the bounce.",
      keys: "← →",
      tap: "or tap a side.",
      phoneHint: "SWIPE OR TAP THE OPEN SIDE", // derived
      serving: "SERVING",
      kmh: "KM/H",
      aim: {
        left: "LEFT",
        right: "RIGHT",
        open: "OPEN COURT",
        /** Accessible names (the artboard's aria-labels): "Return to the left", "Return to the right — open court". */
        to: { left: "Return to the left", right: "Return to the right" },
        openName: "open court",
        dash: "—",
      },
      progress: "EACH RETURN UNLOCKS A HIGHLIGHT",
      highlight: "HIGHLIGHT",
      recording: "[SCREEN RECORDING]",
      marquee: {
        highlights: "MATCH HIGHLIGHTS",
        shipped: "ANOTHER PROJECT SHIPPED",
        isNext: "IS NEXT",
        matchPoint: "MATCH POINT",
        allIn: "ALL THREE ON THE BIG SCREEN", // derived
      },
      status: { game: "GAME YASH", broke: "BROKE SERVE" }, // derived
      calls: {
        clean: "CLEAN RETURN.",
        returned: "RETURNED.",
        ace: "ACE.",
        wrong: "WRONG SIDE.",
        early: "TOO EARLY.",
        line: "ON THE LINE.",
        winner: "RETURN WINNER.",
      }, // derived
      comm: {
        // start: content.commentary.entrance[0]
        shipped: "Another project shipped. He's not letting up.",
        missed: "Ace. The project ships anyway.", // derived
        line: "Clipped the line. Still undefeated.", // derived
      },
      see: "SEE MATCH HIGHLIGHTS", // derived
      claim: "CLAIM YOUR BREAK", // derived
      skip: "SKIP TO MATCH HIGHLIGHTS",
    },
    badminton: {
      title: "SMASH OR CLEAR",
      power: "SHOT POWER",
      shots: {
        smash: { name: "SMASH", note: ["Top 20%. Fast,", "but he reads it."] },
        clear: { name: "CLEAR", note: ["Push him", "to the back line."] },
        drop: { name: "DROP", note: ["Soft. Risky.", "Very satisfying."] },
      },
      hold: "HOLD · RELEASE",
      phoneHint: "PRESS AND HOLD · LET GO TO PLAY", // derived
      reading: "READING YOUR GRIP",
      you: "YOU",
      charged: "ATTRIBUTE CHARGED",
      upNext: "UP NEXT",
      matchPoint: "MATCH POINT",
      status: { game: "GAME YASH", saved: "SAVED" }, // derived
      calls: {
        smash: "HE READS IT.",
        clear: "BACK LINE. STILL HIS.",
        drop: "AT THE NET. STILL HIS.",
        perfect: "PERFECT WEIGHT.",
        through: "IT GETS THROUGH.",
      }, // derived
      comm: {
        start: "Your serve. He's reading your grip.", // derived
        rally: "He reads it. Another attribute charged.", // derived
        perfect: "Perfect weight. He still got there.", // derived
        matchPoint: "Match point. He's done this before.",
        // final loss: content.commentary.yashWins[0]; a win: content.commentary.visitorWins[0]
      },
      see: "SEE PLAYER ATTRIBUTES", // derived
      claim: "CLAIM YOUR POINT", // derived
      skip: "SKIP TO PLAYER ATTRIBUTES",
    },
  },
```

- [ ] **Step 2: Failing engine tests.**
  - **`clock.test.ts`:**
    - `pingPong(0, 1100) === 0`, `pingPong(550, 1100) === 0.5`, `pingPong(1100, 1100) === 1`, `pingPong(1650, 1100) === 0.5`, `pingPong(2200, 1100) === 0`
    - negative input never leaves [0, 1]
    - `createGameClock(fakeNow)`: `elapsed()` is 0 before `start()`; after start it counts; `pause()` freezes it; `resume()` continues from the frozen value (hidden time never counts); `running()` follows the state
  - **`luck.test.ts`:**
    - `luckyWin(false, () => 0) === false` **and the luck function is not called** (a spy)
    - `luckyWin(true, () => 0.11) === true`; `luckyWin(true, () => 0.12) === false`
    - `winChance(1, 3) === 0.12`
    - **The 1 % maths:** a player perfect on 8 % of overs, `winChance(0.08 ** (1 / 3), 3)`, gives ≈ 0.0096 (`toBeCloseTo(0.0096, 4)`)
  - **`beats.test.ts`:**
    - `autoRallyTimes(3)` → `[750, 1500, 2250]`; `autoRallyTimes(4)` → `[600, 1200, 1800, 2400]`
    - every value < `AUTO_RALLY_MS`
  - **`session.test.ts`:**
    - `noteLoss("cricket")` → 1 → 2
    - `noteLoss("tennis")` → 1 (venues are counted apart)
    - `resetLosses()` clears

  Run: `pnpm exec vitest run src/features/games/engine`. Expected: FAIL (modules missing).

- [ ] **Step 3: Engine implementation.**
```ts
// engine/types.ts
export type Quality = "perfect" | "good" | "miss";
/** A random number in [0, 1). Injected so tests can force a win or a loss (spec §8 luck roll). */
export type Luck = () => number;
export type Winner = "yash" | "you";
/** Which layout the visitor sees: the 1440×900 stage, or the one-thumb column (phones and tablets). */
export type GameLayout = "stage" | "column";

// engine/luck.ts
export const LUCK_ODDS = 0.12;
/** The 1 %: only a perfect streak rolls, and the roll must land under 12 %. Luck is not consumed otherwise. */
export function luckyWin(perfectStreak: boolean, luck: Luck): boolean {
  return perfectStreak && luck() < LUCK_ODDS;
}
/** P(win) for a player who is perfect with probability `perfectRate` on each of `inputs` inputs. */
export function winChance(perfectRate: number, inputs: number): number {
  return perfectRate ** inputs * LUCK_ODDS;
}

// engine/clock.ts
/** 0 → 1 → 0: a marker that sweeps the track one way every `periodMs` (the artboards' `alternate` sweep). */
export function pingPong(elapsedMs: number, periodMs: number): number {
  const t = (((elapsedMs / periodMs) % 2) + 2) % 2;
  return t <= 1 ? t : 2 - t;
}
export interface GameClock { start(): void; pause(): void; resume(): void; elapsed(): number; running(): boolean }
/** Game time: starts at 0, stands still while paused (a hidden tab), so the meter and the judge read the same value. */
export function createGameClock(now: () => number = () => performance.now()): GameClock {
  let origin = 0;
  let frozen: number | null = 0;
  return {
    start() { origin = now(); frozen = null; },
    pause() { if (frozen === null) frozen = now() - origin; },
    resume() { if (frozen !== null) { origin = now() - frozen; frozen = null; } },
    elapsed() { return frozen ?? now() - origin; },
    running() { return frozen === null; },
  };
}

// engine/beats.ts
/** The call holds this long before the end buttons (README loop: Verdict 2s). */
export const VERDICT_MS = 2000;
/** Reduced motion: the whole game is replaced by this (spec §8 fair play). */
export const AUTO_RALLY_MS = 3000;
/** README fair play: no game runs longer than 15 s with prompt play. */
export const MAX_GAME_MS = 15000;
/** When each auto-rally input resolves: evenly spaced inside the 3 s. */
export function autoRallyTimes(inputs: number, totalMs = AUTO_RALLY_MS): number[] {
  return Array.from({ length: inputs }, (_, i) => ((i + 1) * totalMs) / (inputs + 1));
}

// engine/session.ts
import type { Venue } from "@/shell/matchRecord";
/** G9: losses at each venue in this visit (until the page reloads), for the "watch the highlight" offer. */
export const OFFER_AFTER_LOSSES = 2;
const losses = new Map<Venue, number>();
export function noteLoss(venue: Venue): number {
  const n = (losses.get(venue) ?? 0) + 1;
  losses.set(venue, n);
  return n;
}
export function resetLosses(): void { losses.clear(); }
```
  Run the engine tests: PASS.

- [ ] **Step 4: Cricket referee (TDD).** Failing tests first (`cricket/referee.test.ts`):
  - **`lengthQuality` boundaries:**
    - `(0.5, "stage")` → perfect
    - `(0.5 + 0.0349, "stage")` → perfect; `(0.5 + 0.035, "stage")` → good
    - `(0.5 - 0.1199, "stage")` → good; `(0.5 + 0.12, "stage")` → miss
    - `(0.5 + 0.049, "column")` → perfect; `(0.5 + 0.139, "column")` → good; `(0, "column")` → miss
  - **Balls 1–2:** perfect → `{ call: "dot", runs: 0, forYou: true, line: "dot" }`, good → `four`, 4, `four`; miss → `six`, 6, `six`.
  - **Ball 3, forced win:** perfect × 3 with `luck = () => 0` → `call: "bowled"`, `won: true`, `cricketWinner` = `"you"`.
  - **Ball 3, forced loss:** perfect × 3 with `luck = () => 0.5` → `four` / `lastPerfect`, `won: false`, winner `"yash"`.
  - **Ball 3 lines:** good → `four` / `lastGood`; miss → `six` / `lastSix`.
  - **Luck is never rolled** unless the streak is perfect: a spy is never called for `[perfect, good, perfect]`.
  - **After the over,** `bowl` returns the same state.
  - **`cricketRuns`:** `[good, miss, good]` → 14 (the Hub artboard's `14*`).
  - **Auto-rally:** `CRICKET_AUTO` played in order gives runs 14 and winner `"yash"`.
  - **The 1 % (Monte Carlo):** `seeded(42)` from `src/lib/seeded.ts` as luck; an always-perfect player wins between 10 % and 14 % of 20 000 overs.
  - **Fair play:** `CRICKET_BALLS * (CRICKET_PERIOD_MS + CRICKET_BEATS.flightMs + CRICKET_BEATS.callMs) + VERDICT_MS <= MAX_GAME_MS`.

  Implementation (`cricket/referee.ts`):
```ts
import { luckyWin } from "../engine/luck";
import type { Luck, Quality, Winner, GameLayout } from "../engine/types";

export const CRICKET_BALLS = 3;
/** The cursor crosses the meter once every 1.1 s (the prototype). */
export const CRICKET_PERIOD_MS = 1100;
/** Distance from the meter's centre (track 0–1) that still counts, as drawn: the stage, and the wider touch column. */
export const CRICKET_ZONES: Record<GameLayout, { perfect: number; good: number }> = {
  stage: { perfect: 0.035, good: 0.12 },
  column: { perfect: 0.05, good: 0.14 },
};
/** The ball's flight to the batter, then how long the call holds before the next ball. */
export const CRICKET_BEATS = { flightMs: 450, callMs: 1200 } as const;
/** G10: the reduced-motion over (FOUR, SIX, FOUR = 14*). */
export const CRICKET_AUTO: Quality[] = ["good", "miss", "good"];

export type CricketCall = "dot" | "four" | "six" | "bowled";
export type CricketLine = "dot" | "four" | "six" | "lastPerfect" | "lastGood" | "lastSix" | "bowled";
export interface CricketBall { q: Quality; call: CricketCall; runs: 0 | 4 | 6; forYou: boolean; line: CricketLine }
export interface CricketState { balls: CricketBall[]; won: boolean }
export const CRICKET_START: CricketState = { balls: [], won: false };

export function lengthQuality(p: number, layout: GameLayout): Quality {
  const d = Math.abs(p - 0.5);
  const zone = CRICKET_ZONES[layout];
  return d < zone.perfect ? "perfect" : d < zone.good ? "good" : "miss";
}

export const cricketOver = (s: CricketState) => s.balls.length >= CRICKET_BALLS;
export const cricketRuns = (s: CricketState) => s.balls.reduce((sum, b) => sum + b.runs, 0);
export const cricketWinner = (s: CricketState): Winner | null =>
  cricketOver(s) ? (s.won ? "you" : "yash") : null;

/** One ball (audit §6.1, verbatim rules). Balls 1–2 judge the length; ball 3 is a FOUR or SIX unless the 1 % lands. */
export function bowl(s: CricketState, q: Quality, luck: Luck): CricketState {
  if (cricketOver(s)) return s;
  const last = s.balls.length === CRICKET_BALLS - 1;
  if (last && luckyWin(q === "perfect" && s.balls.every((b) => b.q === "perfect"), luck)) {
    return { balls: [...s.balls, { q, call: "bowled", runs: 0, forYou: true, line: "bowled" }], won: true };
  }
  const ball: CricketBall =
    q === "miss"
      ? { q, call: "six", runs: 6, forYou: false, line: last ? "lastSix" : "six" }
      : q === "good" || last
        ? { q, call: "four", runs: 4, forYou: false, line: last ? (q === "perfect" ? "lastPerfect" : "lastGood") : "four" }
        : { q, call: "dot", runs: 0, forYou: true, line: "dot" };
  return { balls: [...s.balls, ball], won: false };
}
```
  Run: PASS.

- [ ] **Step 5: Tennis referee (TDD).** Failing tests first:
  - **`windowFor`:** `(0,"stage")` 900, `(2,"stage")` 500, `(1,"column")` 875.
  - **`newServe` with `luck = () => 0`:** open `"left"`, toss 400. With `() => 0.99`: open `"right"`, toss ≈ 895.
  - **`returnQuality` with `open = "right"` and `window = 900`:**
    - `{ side: "right", atMs: 0 }` → perfect / `clean`
    - `{ side: "right", atMs: 360 }` → perfect; `atMs: 361` → good / `returned`
    - `atMs: 900` → good; `atMs: 901` → miss / `ace`
    - `{ side: "left", atMs: 100 }` → miss / `wrong`
    - `{ side: "right", atMs: -1 }` → miss / `early`
    - `{ side: null, atMs: 900 }` → miss / `ace`
  - **`playReturn` serves 1–2:** the return is appended with its quality and call, `serve` is reset to `null`, and the luck spy is not called.
  - **Serve 3, forced win:** three perfect returns with luck `() => 0` → `call: "winner"`, `won: true`, `tennisWinner` = `"you"`.
  - **Serve 3, otherwise:** call is `line` and the winner is `"yash"`, even when perfect with luck 0.5.
  - **`playReturn` with no serve in play** returns the state unchanged.
  - **`tennisPoints(s)`:** `["15","15"]` before serve 1, `["30","15"]` before serve 2, `["40","30"]` before serve 3 and after the game.
  - **Auto-rally:** `TENNIS_AUTO` (each pick on the open side at 60 % of the window) gives good, good, then `line`, and winner `"yash"`.
  - **Fair play:** `sum over serves (TELL_MS + TOSS_MS.max + windowFor(i,"column") + TENNIS_BEATS.callMs) + VERDICT_MS <= MAX_GAME_MS`.

  Implementation (`tennis/referee.ts`):
```ts
import { luckyWin } from "../engine/luck";
import type { GameLayout, Luck, Quality, Winner } from "../engine/types";

export type Side = "left" | "right";
export const TENNIS_SERVES = 3;
export const SERVE_WINDOW_MS = [900, 700, 500] as const;
/** The column (touch) gets 25 % longer (spec §8.2). */
export const TOUCH_STRETCH = 1.25;
export const PERFECT_SHARE = 0.4;
export const SERVE_KMH = [178, 186, 194] as const;
/** The open side lights up this long after the serve begins; the toss then runs a random 0.4–0.9 s. */
export const TELL_MS = 300;
export const TOSS_MS = { min: 400, max: 900 } as const;
/** The returned ball's flight, then how long the call holds before the next serve. */
export const TENNIS_BEATS = { flightMs: 500, callMs: 1400 } as const;
/** G5: the bug narrates Yash's service game, YASH first: the points before each serve. */
export const TENNIS_POINTS = [["15", "15"], ["30", "15"], ["40", "30"]] as const;
/** G10: each auto return lands on the open side at 60 % of the window (good). */
export const TENNIS_AUTO_SHARE = 0.6;

export type TennisCall = "clean" | "returned" | "ace" | "wrong" | "early" | "line" | "winner";
export interface TennisServe { open: Side; tossMs: number }
export interface TennisReturn { q: Quality; call: TennisCall }
export interface TennisState { serve: TennisServe | null; returns: TennisReturn[]; won: boolean }
/** When the visitor picked, in ms after Yash's hit (negative: before it); `side: null` when the window ran out. */
export interface ReturnPick { side: Side | null; atMs: number }
export const TENNIS_START: TennisState = { serve: null, returns: [], won: false };

export const windowFor = (serve: number, layout: GameLayout) =>
  SERVE_WINDOW_MS[serve]! * (layout === "column" ? TOUCH_STRETCH : 1);
export const tennisOver = (s: TennisState) => s.returns.length >= TENNIS_SERVES;
export const tennisWinner = (s: TennisState): Winner | null =>
  tennisOver(s) ? (s.won ? "you" : "yash") : null;
export const tennisPoints = (s: TennisState) =>
  TENNIS_POINTS[Math.min(s.returns.length, TENNIS_SERVES - 1)]!;

/** The next serve: the open side and the toss are drawn from `luck` (the same source as the 1 % roll). */
export function newServe(s: TennisState, luck: Luck): TennisState {
  if (tennisOver(s)) return s;
  const open: Side = luck() < 0.5 ? "left" : "right";
  return { ...s, serve: { open, tossMs: TOSS_MS.min + luck() * (TOSS_MS.max - TOSS_MS.min) } };
}

export function returnQuality(pick: ReturnPick, open: Side, windowMs: number): TennisReturn {
  if (pick.side === null || pick.atMs > windowMs) return { q: "miss", call: "ace" };
  if (pick.atMs < 0) return { q: "miss", call: "early" };
  if (pick.side !== open) return { q: "miss", call: "wrong" };
  return pick.atMs <= windowMs * PERFECT_SHARE ? { q: "perfect", call: "clean" } : { q: "good", call: "returned" };
}

/** One return. Serve 3: Yash's winner clips the line unless the streak is perfect and the 1 % lands (spec §8.2). */
export function playReturn(s: TennisState, pick: ReturnPick, layout: GameLayout, luck: Luck): TennisState {
  if (!s.serve || tennisOver(s)) return s;
  const i = s.returns.length;
  const r = returnQuality(pick, s.serve.open, windowFor(i, layout));
  if (i < TENNIS_SERVES - 1) return { serve: null, returns: [...s.returns, r], won: false };
  const won = luckyWin(r.q === "perfect" && s.returns.every((x) => x.q === "perfect"), luck);
  return { serve: null, returns: [...s.returns, { q: r.q, call: won ? "winner" : "line" }], won };
}
```
  Run: PASS.

- [ ] **Step 6: Badminton referee (TDD).** Failing tests first:
  - **`powerAt`:** `powerAt(0)` 8, `powerAt(1400)` 86, `powerAt(700)` 47, `powerAt(2800)` 8.
  - **`shotFor`:** 80 → smash; 79.9 → clear; 40 → clear; 39.9 → drop; 8 → drop.
  - **`weightQuality`:** 20 → perfect; 26 → perfect; 19.9 → good; 26.1 → good; 85 → good (only the band is perfect).
  - **Rallies 1–3:** any power → Yash's point. Calls: smash / clear / drop, or `perfect` for a perfect drop. `badmintonScore` goes 17–19 → 18–19 → 19–19 → 20–19.
  - **Rally 4, forced win:** perfect drops on all four with luck `() => 0` → `through`, `won: true`, score `{ yash: 20, you: 20 }`, winner `"you"`.
  - **Rally 4, otherwise:** score `{ yash: 21, you: 19 }`, winner `"yash"`, and the call follows the shot.
  - **Luck is not rolled** unless the streak is perfect.
  - **`matchPoint(s)`** is true only before rally 4.
  - **Auto-rally:** `BADMINTON_AUTO` (`[50, 85, 30, 30]`) → clear, smash, drop, drop; 21–19; winner `"yash"`.
  - **Fair play:** `BADMINTON_RALLIES * (POWER.periodMs + BADMINTON_BEATS.flightMs + BADMINTON_BEATS.callMs) + VERDICT_MS <= MAX_GAME_MS`.

  Implementation (`badminton/referee.ts`):
```ts
import { pingPong } from "../engine/clock";
import { luckyWin } from "../engine/luck";
import type { Luck, Quality, Winner } from "../engine/types";

export const BADMINTON_RALLIES = 4;
/** Meter fill in % of its height, bottom up: 8 → 86 over 1.4 s, bouncing while held (spec §8.3). */
export const POWER = { from: 8, to: 86, periodMs: 1400 } as const;
/** As drawn: SMASH is the top 20 %, CLEAR 20–60 % from the top, DROP the bottom 40 %. */
export const SMASH_FROM = 80;
export const DROP_BELOW = 40;
/** G6: the "perfect weight" band (6 % tall, inside DROP). Not drawn. */
export const PERFECT_WEIGHT = { from: 20, to: 26 } as const;
export const BADMINTON_START = { yash: 17, you: 19 } as const;
/** The shuttle's flight, then how long the call holds before the next rally. */
export const BADMINTON_BEATS = { flightMs: 600, callMs: 1200 } as const;
/** G10: clear, smash, drop, drop (none perfect): 21–19. */
export const BADMINTON_AUTO = [50, 85, 30, 30] as const;

export type Shot = "smash" | "clear" | "drop";
export type BadmintonCall = Shot | "perfect" | "through";
export interface BadmintonRally { shot: Shot; q: Quality; call: BadmintonCall }
export interface BadmintonState { rallies: BadmintonRally[]; won: boolean }
export const BADMINTON_START_STATE: BadmintonState = { rallies: [], won: false };

export const powerAt = (elapsedMs: number) =>
  POWER.from + (POWER.to - POWER.from) * pingPong(elapsedMs, POWER.periodMs);
export const shotFor = (power: number): Shot =>
  power >= SMASH_FROM ? "smash" : power >= DROP_BELOW ? "clear" : "drop";
export const weightQuality = (power: number): Quality =>
  power >= PERFECT_WEIGHT.from && power <= PERFECT_WEIGHT.to ? "perfect" : "good";
export const badmintonOver = (s: BadmintonState) => s.rallies.length >= BADMINTON_RALLIES;
export const badmintonWinner = (s: BadmintonState): Winner | null =>
  badmintonOver(s) ? (s.won ? "you" : "yash") : null;
export const matchPoint = (s: BadmintonState) => s.rallies.length === BADMINTON_RALLIES - 1;
export function badmintonScore(s: BadmintonState): { yash: number; you: number } {
  const yashPoints = Math.min(s.rallies.length, BADMINTON_RALLIES - 1) + (badmintonOver(s) && !s.won ? 1 : 0);
  return { yash: BADMINTON_START.yash + yashPoints, you: BADMINTON_START.you + (s.won ? 1 : 0) };
}

/** One rally. Yash wins rallies 1–3 whatever you play; at 20–19 only a perfect drop after a perfect run, plus the 1 %, gets through. */
export function playRally(s: BadmintonState, power: number, luck: Luck): BadmintonState {
  if (badmintonOver(s)) return s;
  const shot = shotFor(power);
  const q = weightQuality(power);
  const call: BadmintonCall = q === "perfect" ? "perfect" : shot;
  if (!matchPoint(s)) return { rallies: [...s.rallies, { shot, q, call }], won: false };
  const won = luckyWin(q === "perfect" && s.rallies.every((r) => r.q === "perfect"), luck);
  return { rallies: [...s.rallies, { shot, q, call: won ? "through" : shot }], won };
}
```
  Run: PASS.

- [ ] **Step 7:**
  - Add `reducedMotion: "(prefers-reduced-motion: reduce)"` to `MEDIA` in `src/lib/breakpoints.ts`, and point `HubStage`'s local constant at it (one place for the query).
  - Run `pnpm typecheck && pnpm lint && pnpm exec vitest run src/features/games src/lib src/content`.
  - Commit `feat(games): referees, engine maths and game copy`.

---

## Task 2: Game scenes (cricket ground, tennis court, badminton hall, rings and tracers)

**Files:**
- Create: `src/design-system/scene/{GameBackdrop,TrackingRing,TracerPath}.tsx`, `src/design-system/scene/Game.stories.tsx`
- Modify:
  - `src/design-system/index.ts` (exports)
  - `src/design-system/tokens/tokens.css` / `scene.css` (only the colours no token has yet: check `catalog.ts` first)
  - `src/design-system/tokens/catalog.ts` (list new tokens)
- Test: `src/design-system/scene/Scene.test.tsx` (extend)

**Interfaces:**
- Produces:
  - `GameBackdrop({ venue: "turf" | "court" | "hall"; frame: "stage" | "column"; className? })`: decorative (`aria-hidden`), fills its parent. Stage frame: the 1440×900 design space (used as `<Stage backdrop>`). Column frame: whatever box it sits behind (the phone screen).
  - `TrackingRing({ who: "yash" | "you"; size: "stage" | "column"; className? })`: the ellipse marker (Yash: 2px volt + the ring glow; you: 2px floodlight).
  - `TracerPath({ d: string; viewBox: string; size: "stage" | "column"; draw?: number; className? })`: dashed volt SVG path (stage: 2.5 / "2 8"; column: 2 / "2 7"). `draw` ∈ [0, 1] (default 1) reveals the path from its start via `stroke-dashoffset` (`pathLength="1"`) so a flight can draw it.

- [ ] **Step 1: Read the three boards' scene markup** (everything above `<!-- HUD -->` in `Cricket-Play.dc.html`, `Tennis-Play.dc.html`, `Badminton-Play.dc.html`, and the field in `Mobile-Game.dc.html`).

  List each layer and match it to an existing scene part or token:
  - `SkyGlow` (the radial sky)
  - `CrowdTier` (the dotted crowd band, 7×6 dots, masked)
  - `FloodlightBank` (cricket's two 100×40 banks at top 70, glow `0 0 40px 12px … , 0 0 200px 70px …`: does an existing size match? if not, add a `game` size beside `card`)
  - the venue tokens (`data-venue`)

  Write the mapping in the report.

- [ ] **Step 2: `GameBackdrop` stage frame, per venue (exact board coordinates):**
  - **turf (Cricket-Play):**
    - sky `ellipse 70% 50% at 50% 30%`
    - crowd band top 150, height 200
    - banks at left 170 / right 170, top 70
    - outfield from top 300: stripes 46 px / 92 px, `clip-path: polygon(30% 0,70% 0,100% 100%,0 100%)`, mask 0.5 → 1 at 40 %; side vignette
    - pitch from top 318: `polygon(48.4% 0,51.6% 0,58% 100%,42% 100%)`, gradient
    - creases: 66×2 at (687,335) and 290×3 at (575,790)
    - Yash's stumps: three 3×26 at (712,308), gap 4
    - your stumps: three 7×120 at (596,790), gap 11, opacity .85
    - the SVG length zones: yorker polygon `692,346 748,346 750,360 690,360` fill volt .55; good-length polygon `689,365 751,365 756,400 684,400` fill volt .16
  - **court (Tennis-Play):**
    - sky (two radials)
    - crowd band top 120
    - the LED board slot (none here: the board is a broadcast part, Task 3)
    - SVG court polygons with surround `#0C2236`, surface `#16456E`, the lines `#E8EEF3` 2.5
    - net: 568×40 at (436,462), mesh 7 px, top 4 px floodlight
  - **hall (Badminton-Play):**
    - warm radial
    - roof stripes, top 120
    - the beam: 400×900 at x 520, `polygon(42% 0,58% 0,100% 100%,0 100%)`, warm .20 → .02
    - lamp: 60×16 at (690,-6)
    - crowd band top 150 height 160 (warm)
    - SVG court with surround `#14211C`, surface `#1F3A30`, lines `#ECEFF1`
    - net: 460×38 at (490,482), posts 4×60 at x 486 / 950, top 470
  - **SVG colours** come from tokens: add `--scene-court-*` / `--scene-hall-*` / `--scene-pitch-*` tokens where `catalog.ts` has none. **Reuse** the existing `scene-court-hard` / `scene-court-hall` values if they are the same colours (VenueArt).
  - Use `ArenaBackdrop`'s parts (`SkyGlow`, `CrowdTier`, `FloodlightBank`) rather than redrawing them.

- [ ] **Step 3: `GameBackdrop` column frame.**
  - **turf (Mobile-Game, 390×844, all relative to the box):**
    - sky `ellipse 100% 40% at 50% 20%`
    - outfield from top 200: stripes 40 / 80, `polygon(28% 0,72% 0,100% 100%,0 100%)`
    - pitch from top 210: `polygon(46% 0,54% 0,66% 100%,34% 100%)`
    - stumps: three 2×18 at (186,198), gap 3
    - the length band: 38×6 at (176,232), volt .55
  - **court and hall** (derived, no board): the stage SVG court cropped to the court and scaled to the column's width (`viewBox` around the court, `preserveAspectRatio="xMidYMin slice"`), top aligned 200 px down like the turf. The net and lines scale with it.
  - **Story `Scene/GameBackdrop`:** all six (venue × frame), the stage ones at 1440×900 inside `Stage`, the column ones in a 390×844 box.

- [ ] **Step 4: `TrackingRing` and `TracerPath`.**
  - **Sizes from the boards:**
    - Yash ring 60×16 (cricket) and 56×14 (tennis / badminton): pass `className` for the 56×14
    - you ring 72×18 (cricket) / 70×18 (badminton)
    - column ring 42×12
  - **The bounce ellipse** (`rx 12–18 ry 4–5`) is a `TracerPath` child option: `bounce?: { cx; cy; rx; ry; tone: "volt" | "floodlight" }`.
  - **Story:** a ring of each kind, plus the three drawn tracers:
    - cricket `M714 836 Q 716 560 719 352 Q 721 340 724 326` with bounce (719,353) 12/4 floodlight
    - tennis `M736 290 Q 700 420 640 640 Q 600 720 560 790` with bounce (640,640) 18/5 volt
    - badminton `M560 770 Q 640 40 790 330`
  - **The shuttle glyph** (badminton: a triangle and a dot rotated 40°) is part of the `TracerPath` story as a `ShuttleMark` export, in the same file.

- [ ] **Step 5: Test.** Extend `Scene.test.tsx`:
  - `GameBackdrop` renders `aria-hidden` with `data-venue` set
  - `TracerPath draw={0.5}` sets `stroke-dashoffset` 0.5 with `pathLength="1"`

- [ ] **Step 6:**
  - Screenshots for the orchestrator (in the SDD workspace `shots/`): the three stage backdrops next to the references (crop out the HUD and panels), and the column turf next to `Mobile-Game`.
  - `pnpm typecheck && pnpm lint && pnpm exec vitest run src/design-system`.
  - Commit `feat(scene): game backdrops, tracking rings and tracer paths`.

---

## Task 3: Game kit (meters, ball tracker, call, aim zone, reveals, courtside card, toast, marquee)

**Files:**
- Create in `src/design-system/broadcast/`: `TimingMeter.tsx`, `PowerMeter.tsx`, `BallTracker.tsx`, `CallOverlay.tsx`, `AimZone.tsx`, `RevealList.tsx`, `CourtsideCard.tsx`, `AttributeToast.tsx`, `LEDMarquee.tsx`, `Game.stories.tsx`, `Game.test.tsx`
- Modify:
  - `src/design-system/broadcast/ScoreBug.tsx` (`Cell pad`)
  - `src/design-system/index.ts`
  - `src/design-system/tokens/*.css` (only what no token / utility has: e.g. `@keyframes marquee`, the meter and toast slide-in; check `motion.css` first)
  - `src/design-system/tokens/catalog.ts`

**Interfaces** (all words are props, all state is `data-state`):
- **`TimingMeter({ labels?: { start: string; target: string; end: string }; zones: { good: [number, number]; perfect: [number, number] }; size: "stage" | "column"; className? })`:**
  - Zones are in % of the track.
  - The cursor's position is the CSS variable **`--meter`** (0–1) inherited from an ancestor (Task 4's clock writes it). The cursor moves by `transform` only: a full-width layer translated by `calc(var(--meter, 0) * 100%)`, with the 4 px cursor at its left edge.
  - **Stage:** labels row (mono 11 / .2em, target volt), glass track 18 h, cursor 4×34.
  - **Column:** no labels, track 16 h (`panel` + `line-strong` border), cursor 4×30.
  - `aria-hidden`.
- **`PowerMeter({ zones: { smashFrom: number; dividerAt: number }; legend: { name: string; note: string[]; tone: "volt" | "floodlight" | "scout" }[]; size: "stage" | "column"; className? })`:**
  - The fill height is the CSS variable **`--power`** (0–1 of the track), drawn with `transform: scaleY(var(--power))` from the bottom.
  - **Stage:** 46×360, the top zone (volt .16 + dashed volt bottom), the divider at 60 % (`line-strong`), and the legend column (display 26 / 900 + body 13 / 1.4).
  - **Column:** the track only, 28 wide, height from the parent, no legend.
  - `aria-hidden`.
- **`BallTracker({ balls: { label: string; state: "for" | "against" | "current" | "pending" }[] })`:** 52×52 cells, gap 8, display 22 / 800. The states are exactly audit row 57.
- **`CallOverlay({ call: string; tone: "volt" | "floodlight"; size: "stage" | "column"; className? })`:**
  - Display 120 / 900 / .04em (column: 64), text-shadow token, `animate-pop`.
  - The parent positions it; it has no box of its own.
  - `aria-hidden`: the announcer speaks.
- **`AimZone({ label: string; name: string; open: boolean; disabled?: boolean; onPick: () => void; className? })`:**
  - A `<button>` with `aria-label={name}`, 142×60, mono 11 / .16em.
  - `data-state="open"`: 1px solid volt, bg volt .12, volt text. Idle: 1px dashed floodlight .35, bg white .03, `scout` text.
  - Hover: bg volt .22. Disabled while no serve is in play.
- **`RevealList({ title: string; count: string; slots: RevealSlotProps[] })`** with `RevealSlotProps = { state: "open"; eyebrow: string; title: string; meta: string } | { state: "locked"; label: string; hint: string }`:
  - The STADIUM SCREEN panel: glass, padding 20, gap 12, rows divided by a `line` top border.
  - An open row pops in (`animate-pop`).
  - **`RevealChip({ eyebrow; title; meta })`** is the column's single reveal: panel solid .85, a volt .45 border, padding 12×14.
  - Both are real text (content), **not** `aria-hidden`.
- **`CourtsideCard({ eyebrow: string; tag: string; title: string; line: string; media: string; side: "left" | "right"; className? })`:**
  - Glass, 300 w, padding 18, gap 10, border volt .4, shadow token. `rotateY(32deg)` from its outer edge (left card: origin 0 50 %; right: −32°, origin 100 % 50 %) inside a 900 perspective.
  - The 110 h striped `MediaSlot` placeholder shows `media` (`[SCREEN RECORDING]`).
  - **Column variant:** none. The column uses `RevealChip`.
- **`AttributeToast(props)`:**
  - Props: `{ state: "charged"; eyebrow: string; tag: string; title: string; chips: string[]; accent?: boolean } | { state: "next" | "later"; label: string; hint: string }`.
  - Charged: glass, padding 16×18, display 30 / 900 title, `ChipList` of mono 12 chips (reuse `Chip`), slide-in 30 px from the right (600 ms ease-follow; a utility). `accent` = the volt .45 border (the newest charge).
  - next / later: a dashed `line-strong` row, mono 11 `text-dim` (A1).
- **`LEDMarquee({ items: { text: string; tone: "volt" | "floodlight" }[]; label?: string; className? })`:**
  - 600×30, bg `ground-deep`, a 1px `line` border, mono 12 / .24em, gap 60.
  - The items are rendered twice for a seamless 18 s linear loop. Under reduced motion it stands still at frame 0.
  - `aria-hidden` (the announcer and visible panels carry the information).
- **`ScoreBug.Cell`** gets `pad?: "wide" | "tight"` (16 / 14 px; default `wide`). `ScoreBug.Name` / `Away` / `Status` paddings stay.

- [ ] **Step 1: Failing tests (`Game.test.tsx`):**
  - **`AimZone`:**
    - it is a button named by `name`, and its text is `label`
    - `open` sets `data-state="open"`
    - a click calls `onPick`; `disabled` does not
  - **`RevealList`:**
    - open slots render eyebrow / title / meta text; locked slots render `label` / `hint`
    - the panel is not `aria-hidden`
  - **`TimingMeter`:**
    - the perfect zone's inline `left` / `width` equal the props (e.g. `46.5%`, `7%`)
    - the cursor layer's transform reads `--meter`
  - **`PowerMeter`:** the fill's transform reads `--power`.
  - **`BallTracker`:** four states map to four `data-state`s.

- [ ] **Step 2: Build the nine components** to the exact board values (Cricket-Play, Tennis-Play, Badminton-Play, Mobile-Game, audit §3.6). Reuse `Glass`, `Chip` / `ChipList`, `MediaSlot`, `animate-pop`, the type recipes; add a recipe only when none matches (record it in `catalog.ts`).

- [ ] **Step 3: Stories `Broadcast/Game`:**
  - every component in every state
  - `TimingMeter` stage and column at `--meter` 0, 0.5 and 1
  - `PowerMeter` at `--power` 0.08 and 0.86
  - `LEDMarquee` with the tennis board's four items
  - the three ScoreBugs as drawn:
    - cricket `YASH | 0* | BALL 1 OF 3 | YOU BOWLING`
    - tennis `•YASH | 40 | 30 | YOU | RALLY 3`
    - badminton `YASH | 20 | 19 | YOU | MATCH POINT (alert)`

- [ ] **Step 4:**
  - Screenshots of each story (orchestrator review).
  - `pnpm typecheck && pnpm lint && pnpm exec vitest run src/design-system && pnpm build-storybook`.
  - Commit `feat(broadcast): game kit (meters, tracker, call, aim zone, reveals, courtside card, toast, marquee)`.

---

## Task 4: Game frame and runtime (shared by all three games)

**Files:**
- Create:
  - `src/features/games/engine/{useGameClock,useGameKeys,useTimers,useMatchResult}.ts` (+ tests)
  - `src/features/games/frame/{GameStage,GameColumn,GameEnd,GameAnnouncer}.tsx`, `src/features/games/frame/chrome.ts` (+ `chrome.test.ts`)
  - `src/features/games/frame/Frame.stories.tsx`
- Create: `tests/e2e/support/game.ts` (shared e2e helpers)

**Interfaces:**
- Consumes: the Task 1 engine (`createGameClock`, `Winner`, `noteLoss`, `OFFER_AFTER_LOSSES`), Task 2–3 components, `useMatchRecord`, `useCommentary`, `CommentarySlot`, `useArenaTransition`, `ArenaLink`, `QuickViewChip`, `useAudio`, `MEDIA`, `useMediaQuery`.
- Produces:
  - **`useGameClock(target: RefObject<HTMLElement | null>, { cssVar: "--meter" | "--power"; value: (elapsedMs: number) => number; running: boolean }): { elapsed(): number; restart(): void }`:**
    - While `running`, a rAF loop writes `value(elapsed)` (a 0–1 number) to `target.style` under `cssVar`. `elapsed()` reads the same `GameClock`.
    - `restart()` sets it back to 0.
    - `document.visibilitychange` hidden → `clock.pause()`, visible → `resume()`.
    - Stopped and cleaned up on unmount or `running: false`; the variable keeps its last value.
  - **`useGameKeys({ down?: Record<string, (e: KeyboardEvent) => void>; up?: Record<string, (e: KeyboardEvent) => void> }, { active: boolean })`:**
    - Keys are `event.key` (`" "`, `"Enter"`, `"ArrowLeft"`, `"ArrowRight"`).
    - Listens on `window` only while `active`.
    - Ignores `e.repeat` (keydown), Ctrl / Cmd / Alt, typing targets (input, textarea, select, contenteditable), and **Space / Enter whose target is a link, a button or `[role=button]`** (that control does its own job).
    - Calls `preventDefault()` on the keys it handles (Space must not scroll).
  - **`useTimers(): { after(ms: number, fn: () => void): void; clear(): void }`:** every pending timer is cleared on `clear()` and on unmount.
  - **`useMatchResult(venue: Venue): { save(result: { score: string; winner: Winner }): { offerHighlight: boolean } }`:**
    - Writes `completeMatch({ venue, score, winner, prefill: winner === "you" ? ui.games.prefill : undefined })`.
    - On a Yash win it returns `offerHighlight: noteLoss(venue) >= OFFER_AFTER_LOSSES`.
    - A failing write (storage blocked) never throws out of `save`.
  - **`buildGameChrome(ui, routes, venue: Venue): GameChrome`** with `GameChrome = { breadcrumb: { mark: string; hubLabel: string; label: string; trail: string[]; to: string }; skip: { label: string; to: string }; content: string /* the venue's page: career / highlights / attributes */; commTag: string; audio: UiCopy["audio"]; heading: string /* ui.routes[venue].heading */ }`.
  - **`GameStage({ chrome: GameChrome; venue: "turf" | "court" | "hall"; bug: ReactNode; children: ReactNode })`:**
    - `<Stage from="lg" backdrop={<GameBackdrop venue frame="stage" />}>`
    - HUD: left `Breadcrumb as={ArenaLink}`; centre `bug`; right `QuickViewChip` + `AudioToggle variant="icon"`
    - `children` at board coordinates
    - `CommentarySlot` at `absolute bottom-9 left-9 z-8`
    - `SkipChip variant="game" as={ArenaLink}` at `absolute bottom-9 right-9 z-8`
  - **`GameColumn({ chrome; venue; bug: ReactNode; reveal: ReactNode; field?: ReactNode; thumb: ReactNode; heading: string })`:**
    - The phone and tablet layout: `max-lg:` only, `lg:hidden`. On tablets centred, `max-w-160`, one size step up, as `HubColumn` does.
    - Layers:
      - `GameBackdrop frame="column"`
      - an sr-only `h1` (`heading`)
      - top row: the bug left, `SkipChip` (`SKIP →`: `ui.hub.venue.skip` + the glyph) right, 44 px
      - the `reveal` slot under it (left / right 12, top 72)
      - `QuickViewChip`, right-aligned under the reveal slot (G11)
      - `field` (the in-field tags and rings)
      - the thumb zone at the bottom: gradient `ground` 0 → .92 at 30 %, padding `0 20 34`, plus `pb-[env(safe-area-inset-bottom)]` (A9), holding `thumb`
  - **`GameEnd({ primary: { label: string; to: string } | null; claim?: { label: string; to: string }; again?: { label: string; onClick: () => void }; size: "stage" | "column" })`:**
    - Stage: the prototype's skewed 62 h buttons. Primary volt link (`ArenaLink`, wipe), `again` a glass button.
    - Column: full-width stacked, the first 64 h.
    - Win: only `claim` (volt).
    - Focus moves to the first end button when it appears (keyboard users land on it).
  - **`GameAnnouncer({ line: string })`:** an sr-only `aria-live="polite"` region. It works on phones too (G11), and is separate from the COMM region.

- [ ] **Step 1: Failing hook tests** (Vitest fake timers; stub `requestAnimationFrame` with a manual frame pump, as `useOrbit.test.ts` does):
  - **`useGameClock`:**
    - after 550 ms of frames with `value = (t) => pingPong(t, 1100)`, the target's `--meter` is `0.5` and `elapsed()` is 550
    - `running: false` stops writing
    - a hidden tab for 5 s (`visibilityState` hidden + event) then visible: `elapsed()` grew only by the visible time
    - unmount cancels the frame (no write after unmount)
  - **`useGameKeys`:**
    - Space on `body` calls `down[" "]`, once with `repeat: true` ignored
    - Space with focus on a `<button>` does not; ArrowLeft with focus on a `<button>` does
    - Alt + Space does not; typing in an input does not
    - `active: false` removes the listeners (`window` has none: spy on `addEventListener` / `removeEventListener` pairs)
    - keyup calls `up[" "]`
  - **`useTimers`:** two `after`s, then `clear()` → neither fires; unmount → none fires.
  - **`useMatchResult`** (in-memory store, `resetLosses()` in `beforeEach`):
    - a Yash win increments `record.yash` and returns `offerHighlight` false then true
    - a visitor win sets `lockerRoomUnlocked`, `achievements: ["giant-killer"]`, `teamUpPrefill: "I beat you."`
    - with `localStorage.setItem` throwing it still returns and the store holds the result
  - **`buildGameChrome`:**
    - cricket → trail `["CRICKET GROUND"]`, skip `SKIP TO CAREER STATS` → `/career`, content `/career`
    - tennis → `/highlights`; badminton → `/attributes`
    - heading = `ui.routes.<venue>.heading`

  Run: FAIL.

- [ ] **Step 2: Implement** the four hooks and `chrome.ts`. `useGameKeys` shares the "typing target" test with `src/shell/useScreenShortcuts.ts`: move that selector to an exported `isTypingTarget(el)` in `src/shell/useScreenShortcuts.ts` and use it in both places (one definition). Run: PASS.

- [ ] **Step 3: `GameStage`, `GameColumn`, `GameEnd`, `GameAnnouncer`** as specified. The breadcrumb's hub label and label come from what `ContentPage` uses (`ui.placeholder.hub`, `ui.pages.breadcrumb`); the brand goes to `/arena` (as drawn: "HUB / CRICKET GROUND" links to the Hub).

- [ ] **Step 4: Story `Features/Games/Frame`:** a `GameStage` and a `GameColumn` with placeholder children (a cricket bug, an empty reveal chip, a dummy thumb button), plus `GameEnd` in its loss, offer and win shapes. It has a play function checking SKIP and QUICK VIEW are ≥ 44 px.

- [ ] **Step 5: `tests/e2e/support/game.ts`** (used by Tasks 5–7):
```ts
import type { Page } from "@playwright/test";
/** Every Math.random() in the page returns `value` (0 → the luck roll lands; 0.99 → it never does). */
export const forceLuck = (page: Page, value: number) =>
  page.addInitScript((v) => { Math.random = () => v; }, value);
/** Installs the fake clock before the page loads and pauses it right after load, so a test moves time itself. */
export async function freezeClock(page: Page) { await page.clock.install(); }
/** Steps the fake clock 10 ms at a time until `read()` satisfies `until` (max 5 s of game time). */
export async function stepUntil(page: Page, read: () => Promise<number>, until: (v: number) => boolean) {
  for (let t = 0; t < 5000; t += 10) {
    if (until(await read())) return;
    await page.clock.runFor(10);
  }
  throw new Error("stepUntil: condition never met");
}
/** The value of a CSS variable on the game root (`--meter` / `--power`). */
export const cssVar = (page: Page, name: string) =>
  page.locator("[data-game]").evaluate((el, n) => Number(getComputedStyle(el).getPropertyValue(n) || 0), name);
export const VIEWPORTS = [[2560,1080],[1440,900],[1366,768],[1280,720],[1200,800],[1199,800],[1024,768],[768,1024],[390,844],[375,667],[360,640]] as const;
```
  It also holds a shared `expectGameViewport(page)` check implementing Review Focus 5: no horizontal scroll, one rendered h1, mono ≥ 11 px, SKIP and QUICK VIEW ≥ 44 px and not overlapping, and on the column the thumb zone inside the viewport.

- [ ] **Step 6:**
  - Screenshots of the Frame story (stage and 390×844 column).
  - `pnpm typecheck && pnpm lint && pnpm exec vitest run src/features/games src/shell`.
  - Commit `feat(games): shared game frame, clock, keys, timers and result saving`.

---

## Task 5: Cricket, Bowl at Me (desktop and column)

**Files:**
- Create:
  - `src/features/games/cricket/{view,CricketStage,CricketColumn,CricketPage,CricketScreen}.tsx` (`view.ts` is plain TS), `cricket.fixture.ts`, `Cricket.stories.tsx`, `view.test.ts`
  - `tests/e2e/cricket.spec.ts`, `tests/stories/cricket.spec.ts`
- Modify: `app/routes/arena.cricket.tsx` (render `CricketScreen`; keep `pageMeta("cricket")`)

**Interfaces:**
- Consumes: the Task 1 cricket referee, Task 4 frame and hooks, `getInningsReveals`, `content.commentary`.
- Produces:
  - **`type CricketPhase = "ready" | "flight" | "called" | "verdict" | "end"`**
  - **`buildCricketView(content, ui, routes, state: CricketState, opts: { phase: CricketPhase; offerHighlight: boolean }): CricketView`**, which holds:
    - `chrome`
    - `bug`: `{ score: "0*"; meta: "BALL 1 OF 3" | "OVER COMPLETE"; away; metaPhone: "YOU BOWLING · 2/3" }`
    - `onStrike`: `"YASH · ON STRIKE · 0*"`
    - `balls` (`BallTracker` items: label `•`/`4`/`6`/`W` or the ball number; for = dots and wickets)
    - `screen`: `{ title; count: "0 / 3 UNLOCKED"; slots }`
    - `latest`: the newest open slot for the column chip, or null
    - `call`: `{ text; tone } | null`
    - `comm`: the line for the last ball, or `start`
    - `announce`: `"FOUR. Innings 02 unlocked: DEUTSCHE BANK, Graduate Analyst Intern, Jun – Jul 2023"`, or `""` before ball 1
    - `meter` (labels, stage and column zones as % from `CRICKET_ZONES`)
    - `bowl`: `{ label; labelPhone; hint }`
    - `end`: the `GameEnd` props: loss primary `see` → `/career` (or `highlight` when `offerHighlight`), again `BOWL AGAIN`; win claim → `/arena/giant-killer`
    - `saved`: `"14* NOT OUT" | "0 OUT"`
    - `heading`, `headline`, `how`, `pitch` labels
  - `artboardCricketView` (the fresh state) and `phoneArtboardCricketView` (after ball 1 = SIX: `6*`, `YOU BOWLING · 2/3`, innings 01 open)

- [ ] **Step 1: `view.test.ts` (failing):**
  - **Fresh:**
    - `0*`, `BALL 1 OF 3`, `0 / 3 UNLOCKED`
    - three locked slots `INNINGS 01 · LOCKED` / `BOWL BALL 1` …
    - the tracker: current 1, pending 2 and 3
    - comm `start`, no call
  - **After `[miss]`:** `6*`, `BALL 2 OF 3`, `YOU BOWLING · 2/3`, slot 1 open `INNINGS 01 · NOT OUT` / `DEUTSCHE BANK` / `Software Engineer 1 · Jul 2024 – now` (team uppercased as drawn), call `SIX.` floodlight, comm `six`.
  - **After `[perfect]`:** tracker cell 1 `•` for, call `DOT BALL.` volt.
  - **Over `[good, miss, good]`:**
    - `14*`, `OVER COMPLETE`, all three open, the third `INNINGS 03 · ACADEMY` / `PICT, PUNE`
    - saved `14* NOT OUT`
    - end primary `SEE THE FULL SCORECARD` → `/career` and `BOWL AGAIN`
    - with `offerHighlight` the primary is `WATCH THE HIGHLIGHT INSTEAD` → `/career`
  - **A win:** three perfect balls with luck 0 → dot, dot, W: score `0 OUT`, saved `0 OUT`, end claim `CLAIM YOUR WICKET` → `/arena/giant-killer`, comm `bowled`.
  - **A third career role** (a content fixture with three `careerStats`): the slots are innings 01, 02, then the academy (G7), never the third career.

  Run: FAIL. Implement `view.ts`, then run: PASS.

- [ ] **Step 2: `CricketStage`** (inside `GameStage venue="turf"`; every number is the board's):
  - **Bug:** `ScoreBug size="md"`: Name YASH, Cell score (wide pad), Meta, Away `YOU BOWLING`.
  - **Left panel:** `Glass as="section"` at `left-9 top-27.5 w-75 p-5 flex-col gap-3.5 z-5`, holding:
    - `h1` = `BOWL AT ME` in the mono 11 / .2em label style
    - the headline as a `p` (display 32 / 900 / .95)
    - the `BallTracker`
    - `how` (body 14 / 1.5)
  - **Right panel:** `RevealList` at `right-9 top-27.5 w-90 z-5`.
  - **Field (`aria-hidden`):**
    - the Yash `TrackingRing` at (690,322)
    - the bat (8×40 at (716,286), rotated −22°: a scene detail, put in `GameBackdrop` turf if it never moves; a `data-part="bat"` there)
    - `PlayerTag` `YASH · ON STRIKE · 0*` at (650,244)
    - the pitch labels YORKER (volt) / GOOD LENGTH at (762,346) / (766,378), mono 11 (A2: drawn 10)
    - your ring at (678,828) with `YOU · BOWLING` at (760,830)
    - the tracer (`TracerPath`)
  - **Call:** `CallOverlay` centred, top 420, z-6, when `view.call`.
  - **Meter group:** `absolute left-100 right-100 top-152.5 flex-col items-center gap-3.5 z-7`: the `TimingMeter size="stage"` and, below it, either the BOWL button or `GameEnd`.
    - **BOWL:** a volt skewed `Button`, 62 h, label `BOWL · SPACE`, with the ring pulse (`ring` keyframe; reuse if present). It is disabled outside `ready`.
  - **Stage text:** every mono label that the board draws on one line uses `mono-fit`.

- [ ] **Step 3: `CricketColumn`** (inside `GameColumn venue="turf"`):
  - **bug:** `ScoreBug size="sm"`: YASH, score, Meta `metaPhone`
  - **reveal:** `RevealChip` for `view.latest`, or nothing
  - **field:** the column ring (174,214) 42×12, the tag `YASH · ON STRIKE` at (222,212), the column tracer, the `CallOverlay size="column"` at a third of the height (G13)
  - **thumb:**
    - the `TimingMeter size="column"`
    - the hint (mono 11, `mono-fit` so it stays one line)
    - the 110 h full-width volt button `TAP TO BOWL` (no skew), disabled outside `ready`
    - or the column `GameEnd`

- [ ] **Step 4: `CricketPage({ view, phase })`:**
  - `<main id="main" data-game data-phase={phase}>` containing `<CricketStage>` and `<CricketColumn>`. `--meter` lives on this root, so both meters read it.
  - `<GameAnnouncer line={view.announce} />` after `main`.
  - No tab bar (the board draws none).

- [ ] **Step 5: `CricketScreen`** (the runtime):
  - **State:** `useState` holds `{ game: CricketState; phase: CricketPhase; offerHighlight: boolean }`. A `root` ref goes to `main`.
  - **Layout:** `layout = useMediaQuery(MEDIA.lg) ? "stage" : "column"`, and `reduced = useMediaQuery(MEDIA.reducedMotion)`.
  - **Clock:** `useGameClock(root, { cssVar: "--meter", value: (t) => pingPong(t, CRICKET_PERIOD_MS), running: phase === "ready" && !reduced })`.
  - **`release()`** (only in `ready`):
    1. `q = lengthQuality(pingPong(clock.elapsed(), CRICKET_PERIOD_MS), layout)`, then `next = bowl(game, q, Math.random)`.
    2. Set phase `flight`. With motion allowed, haptic `navigator.vibrate?.(20)` on the column.
    3. The ball flight tween (lazy GSAP, `EASE.swing`, `CRICKET_BEATS.flightMs`) moves a ball dot along the tracer to the bounce for that quality (yorker / good length / short), via `transform` in `onUpdate`.
    4. Then set the state, phase `called`, `audio.play("bat")` for a FOUR / SIX, `say(line)` (desktop only, by the commentary service).
    5. After `callMs`: next phase `ready`; or, when the over is done, `save({ score: view.saved, winner })` immediately, phase `verdict`, and after `VERDICT_MS` phase `end`.
  - **Keys:** `useGameKeys({ down: { " ": release, Enter: release } }, { active: phase === "ready" && !reduced })`. The buttons call `release` on click.
  - **Rematch** (`BOWL AGAIN`): `timers.clear()`, kill tweens, reset the state to `CRICKET_START`, phase `ready`, `clock.restart()`.
  - **Reduced motion (G10):** on mount (and on rematch), play `CRICKET_AUTO` at `autoRallyTimes(3)` with no flight, then save, verdict and end as above. The `data-phase` during it is `ready` / `called`.
  - **Arrival line:** say `comm.start` once on mount.
  - **`app/routes/arena.cricket.tsx`** renders `<CricketScreen />`.

- [ ] **Step 6: Stories `Features/Games/Cricket`:**
  - `Desktop` (fresh; play function: h1 `BOWL AT ME`, the BOWL button, SKIP)
  - `ArtboardParity` (fresh, `--meter: 0`)
  - `Phone` and `PhoneArtboardParity` (after ball 1 SIX, at 390×844)
  - `Lost` (end)
  - `Offer` (end with the highlight offer)
  - `Won` (claim)

  Parity in `tests/stories/cricket.spec.ts`: `PhoneArtboardParity` vs `Mobile-Game@390x844` ≤ 2 %. Mask:
  - the QUICK VIEW chip box (A5)
  - the reveal chip's eyebrow line and the tag (9–10 → 11 px, A2)

  Each mask is logged with its reason.

- [ ] **Step 7: e2e `tests/e2e/cricket.spec.ts`** (desktop and mobile projects):
  - **Route parity:** `freezeClock`, load `/arena/cricket` at 1440×900, wait for the COMM line to finish entering (`waitForFiniteAnimations`), then compare with `Cricket-Play@1440x900` ≤ 2 %. No mask beyond the A2 pitch labels (logged).
  - **Forced win:**
    1. `forceLuck(page, 0)` + `freezeClock`.
    2. For each ball: `stepUntil` `--meter` ∈ [0.49, 0.51], press Space, then run the clock past the call.
    3. Check BOWLED HIM., then CLAIM YOUR WICKET.
    4. Clicking it goes to `/arena/giant-killer`.
    5. `localStorage` `arena:v1` shows `record.you` 1, `lockerRoomUnlocked` true, `teamUpPrefill` "I beat you.", `lastScores.cricket` "0 OUT".
  - **Forced loss:**
    1. `forceLuck(page, 0.99)`, three perfect balls.
    2. Check `FOUR.` on ball 3, `SEE THE FULL SCORECARD` and BOWL AGAIN.
    3. Go to `/arena` (client navigation): the cricket card reads `PLAYED · 4* NOT OUT` and REMATCH.
  - **Watch the highlight (G9):** lose twice (BOWL AGAIN between). The second end shows `WATCH THE HIGHLIGHT INSTEAD` → `/career`.
  - **Every input reveals:** three misses → three open slots and three live announcements.
  - **Review Focus 1:**
    - Space with the BOWL button focused bowls once
    - holding Space (repeat) bowls once
    - Space during the flight / call does nothing
    - BOWL AGAIN mid-call, then waiting 3 s: still ball 1
  - **Review Focus 3:** bowl one ball at 1440×900, resize to 390×844: one layout visible, the chip shows innings 01, `2/3`; resize back; no console errors.
  - **Review Focus 4:** blocked storage (`localStorage.setItem` throws): the game ends and the end buttons work, with no console error.
  - **Reduced motion:** `emulateMedia({ reducedMotion: "reduce" })`: no BOWL button; after 3 s three slots are open, then the end. Saved `14* NOT OUT`.
  - **Keyboard only:** Tab reaches BOWL, SKIP and QUICK VIEW. At the end, focus is on the first end button.
  - **JS off:** SKIP and QUICK VIEW are plain working links. The page shows the fresh board.
  - **Leaving mid-game:** bowl, then click SKIP during the call. On `/career` no timer fires (no console errors), and the record has no cricket score.
  - **Viewports:** `expectGameViewport` at every `VIEWPORTS` size.
  - **axe:** clean at the fresh state, during a call, and at the end (desktop and 390×844).

- [ ] **Step 8:**
  - Screenshots for the orchestrator: fresh, a call, end lost, end won; 390×844 fresh and after ball 1; 1280×720 fresh.
  - Run unit, story and `tests/e2e/cricket.spec.ts` (`--workers=2` if loaded).
  - Commit `feat(cricket): bowl at me, desktop and one-thumb`.

---

## Task 6: Tennis, Return of Serve (desktop and column)

**Files:**
- Create:
  - `src/features/games/tennis/{view,TennisStage,TennisColumn,TennisPage,TennisScreen}.tsx` (`view.ts` plain TS), `tennis.fixture.ts`, `Tennis.stories.tsx`, `view.test.ts`
  - `tests/e2e/tennis.spec.ts`, `tests/stories/tennis.spec.ts`
- Modify: `app/routes/arena.tennis.tsx`

**Interfaces:**
- Consumes: the Task 1 tennis referee, `getHighlights` (QF → SF → F order), the Task 4 frame.
- Produces:
  - **`type TennisPhase = "ready" | "tell" | "toss" | "window" | "called" | "verdict" | "end"`**
  - **`buildTennisView(content, ui, routes, state: TennisState, opts: { phase: TennisPhase; offerHighlight: boolean }): TennisView`**, which holds:
    - `chrome`
    - `bug`: `{ yash: "40"; you: "30"; status: "RALLY 3" | "GAME YASH" | "BROKE SERVE"; statusPhone: "RALLY 3/3" }`
    - `serving`: `"YASH · SERVING · 194 KM/H"`
    - `aims`: two `AimZone` props; the open side reads `OPEN COURT →` / `← OPEN COURT` once the tell shows, idle `← LEFT` / `RIGHT →`; names `Return to the right — open court`
    - `cards`: the courtside cards so far: `HIGHLIGHT 01 · QF`, `RALLY 1`, the project name uppercased, its content `line`, `[SCREEN RECORDING]`, the side alternating left / right / left
    - `latest` (the column chip)
    - `progress`: label and three bars `done | current | todo`
    - `marquee` items (G5): `MATCH HIGHLIGHTS · 2 / 3 UNLOCKED`, `ANOTHER PROJECT SHIPPED` (after 1+), `MATCH POINT · THE FINAL IS NEXT` (2 done), or `QUARTER-FINAL IS NEXT` / `SEMI-FINAL IS NEXT`, or `ALL THREE ON THE BIG SCREEN`, then `CENTRE COURT`
    - `instructions`: `{ title; how; keys; tap; phoneHint }`
    - `call`, `comm`, `announce`, `end`, `saved`: `GAME YASH` / `BROKE SERVE`
  - `artboardTennisView`: rally 3 in play, open right, 2 returns (good, perfect), phase `tell`

- [ ] **Step 1: `view.test.ts` (failing).**
  - **Fresh:** `15` / `15` / `RALLY 1`, no cards, marquee `QUARTER-FINAL IS NEXT`, comm = `content.commentary.entrance[0]`.
  - **The artboard state:**
    - `40` / `30` / `RALLY 3`
    - cards QF (left) and SF (right) with content lines
    - marquee exactly the board's four items
    - progress done, done, current
    - aims: right open `OPEN COURT →`, left `← LEFT`
  - **Serve speed:** 194 at rally 3.
  - **The end:**
    - a loss: `GAME YASH`, saved `GAME YASH`, `SEE MATCH HIGHLIGHTS` / `REMATCH`
    - a win: `BROKE SERVE`, claim `CLAIM YOUR BREAK`
    - a miss reveals a card all the same
  - **The 2-loss offer** swaps the primary.

  Implement, then run: PASS.

- [ ] **Step 2: `TennisStage`** (inside `GameStage venue="court"`):
  - **Bug:** Name serving, Cell 40 (`pad="tight"`), Cell muted 30, Away `tone="line"` YOU, Status RALLY 3. At the end, Status alert for BROKE SERVE (a win) or volt for GAME YASH.
  - **Instruction pill:** `Glass` centred at top 96, padding 10×18, gap 18. Its `h1` is RETURN OF SERVE in the mono 11 / .2em style, followed by the `how` sentence with the volt `← →` and `tap`.
  - **`LEDMarquee`** at (420,246).
  - **Field (`aria-hidden`):** the Yash ring at (740,334); `PlayerTag` serving at (806,294); the serve `TracerPath`, drawn during the window (`draw` 0 → 1 over the window), with the bounce ring at its end; the returned ball's path after a pick.
  - **`AimZone`s** at (575,346) and (724,346). They are enabled during `tell` / `toss` / `window`: a pick before the hit is TOO EARLY (G5).
  - **`CourtsideCard`s** at left 40 / right 40, top 380.
  - **Progress:** centred at bottom 110: the label and three 84×6 bars (volt, volt, volt .35).
  - **`CallOverlay`** at top 420, z 6.
  - **`GameEnd`** centred at top 610.

- [ ] **Step 3: `TennisColumn`** (derived, G1 / G3):
  - **bug:** sm, YASH (serving) | 40 | 30 (muted) | Meta `RALLY 3/3`
  - **reveal:** `RevealChip` of the latest card (`HIGHLIGHT 02 · SF UNLOCKED` / name / line)
  - **field:**
    - the column court backdrop
    - the serving tag
    - the two aim zones over the court's service boxes, scaled to the column (the same `AimZone`, `className` sizes)
    - the call
  - **thumb:** the hint `SWIPE OR TAP THE OPEN SIDE`, plus two 110 h half-width buttons `←` / `→` (accessible names `Return to the left` / `Return to the right`, plus ` — open court` on the open one), or `GameEnd`.
  - **Swipe:** a horizontal swipe on the field area (`pointerdown` → `pointerup` with |dx| > 40 and |dx| > |dy|, touch / pen only) picks a side. `touch-action: pan-y` keeps vertical scrolling.

- [ ] **Step 4: `TennisPage` and `TennisScreen`.** Same shape as cricket. The runtime per serve:
  1. Phase `ready` → `newServe(state, Math.random)`.
  2. Phase `tell` (the open zone lights after `TELL_MS`).
  3. Phase `toss` for `serve.tossMs`.
  4. Phase `window`: the hit time is `clock.elapsed()` at its start. The tracer draws over `windowFor(i, layout)`.
  5. A pick at any time in tell / toss / window → `playReturn(state, { side, atMs: clock.elapsed() - hitAt }, layout, Math.random)`. An early pick has `atMs < 0`.
  6. No pick by the window's end → `{ side: null, atMs: window + 1 }`.
  7. Then phase `called` (`audio.play("net")` on a return; the say line), `TENNIS_BEATS.callMs`, the next serve; or `save`, verdict, end.

  **Other rules:**
  - **Keys:** ArrowLeft / ArrowRight while tell / toss / window.
  - **Hidden tab (Review Focus 2):** `visibilitychange` hidden during tell / toss / window cancels the serve (timers cleared, state `serve: null`). When visible again it serves anew from `ready`; that serve is not judged.
  - **Reduced motion:** `TENNIS_AUTO_SHARE` picks on the open side at `autoRallyTimes(3)`, no tracer.

- [ ] **Step 5: Stories `Features/Games/Tennis`:** `Desktop` (fresh), `ArtboardParity` (`artboardTennisView`, marquee at frame 0), `Phone`, `Lost`, `Won`.

  Parity: `ArtboardParity` vs `Tennis-Play@1440x900` ≤ 2 %. Masks (logged, G18):
  - the two card blurb boxes (content `line` vs the drawn short blurbs)
  - the serving tag (194 vs 186 KM/H)
  - the tracer only if the parity differs because the drawn tracer is mid-flight (prefer `draw={1}` in the parity state to match the board)

- [ ] **Step 6: e2e `tests/e2e/tennis.spec.ts`:**
  - **Forced win:**
    1. `forceLuck(0)`: every serve opens left, toss 400.
    2. For each serve: step the clock until `data-phase="window"`, press ArrowLeft at once (perfect).
    3. RETURN WINNER., then CLAIM YOUR BREAK → `/arena/giant-killer`. Record you 1.
  - **Forced loss:** `forceLuck(0.99)`: opens right. Return perfect three times → `ON THE LINE.`, GAME YASH, Hub card `PLAYED · GAME YASH`.
  - **Too early:** press during `toss` → `TOO EARLY.`, a card still revealed.
  - **No input:** run the clock 20 s → three ACE. calls, three cards, the end.
  - **Hidden mid-serve (Review Focus 2):** in `window`, set hidden (dispatch `visibilitychange` with `visibilityState` hidden via `addInitScript` override), run 5 s, set visible. The serve restarts (`data-phase` passes `tell` again) and no return was judged.
  - **Click and swipe:** a click on the open `AimZone` returns. At 390×844 a swipe right on the court picks right.
  - **Reduced motion:** three cards after 3 s, then the end.
  - **Viewports and axe:** as in cricket.

- [ ] **Step 7:**
  - Screenshots: fresh, window, a call, the artboard state, end; 390×844.
  - Run the tests.
  - Commit `feat(tennis): return of serve, desktop and one-thumb`.

---

## Task 7: Badminton, Smash or Clear (desktop and column)

**Files:**
- Create:
  - `src/features/games/badminton/{view,BadmintonStage,BadmintonColumn,BadmintonPage,BadmintonScreen}.tsx` (`view.ts` plain TS), `badminton.fixture.ts`, `Badminton.stories.tsx`, `view.test.ts`
  - `tests/e2e/badminton.spec.ts`, `tests/stories/badminton.spec.ts`
- Modify: `app/routes/arena.badminton.tsx`

**Interfaces:**
- Consumes: the Task 1 badminton referee, `getAttributeGroups` (content order), the Task 4 frame.
- Produces:
  - **`type BadmintonPhase = "ready" | "charging" | "flight" | "called" | "verdict" | "end"`**
  - **`buildBadmintonView(content, ui, routes, state, opts: { phase; offerHighlight }): BadmintonView`**, which holds:
    - `chrome`
    - `bug`: `{ yash: "20"; you: "19"; status: "RALLY 2" | "MATCH POINT" | "GAME YASH" | "SAVED"; alert: boolean; statusPhone }`. `alert` is true for MATCH POINT (A4) and for SAVED.
    - `meter` (the `PowerMeter` zones and legend from `ui.games.badminton.shots`; the SMASH legend volt, CLEAR floodlight, DROP scout)
    - `hold`: `{ label; phoneHint }`
    - `reading`: `"YASH · READING YOUR GRIP"`
    - `toasts`: four `AttributeToast` props:
      - charged: `ATTRIBUTE CHARGED · RALLY 1`, tag = the group's shot uppercased, title = the group name uppercased, chips = the group's `shipped` skills, `accent` on the newest
      - otherwise next `{ label: "DATA", hint: "UP NEXT · RALLY 3" }` and later `{ label: "CRAFT", hint: "RALLY 4" }`
    - `latest`, `call`, `comm` (rally 3 done → `matchPoint`), `announce`, `end`, `saved`: `21–19` / `20–20`
  - `artboardBadmintonView`: three rallies played (clear, smash, drop), match point, phase `ready`, `--power: 0.08`

- [ ] **Step 1: `view.test.ts` (failing):**
  - **Fresh:** `17` / `19` / `RALLY 1`, four toasts: next BACKEND `UP NEXT · RALLY 1`, later FRONTEND / DATA / CRAFT. Comm `start`.
  - **The artboard state:**
    - `20` / `19` / `MATCH POINT` alert
    - toasts BACKEND (chips Java, Spring Boot, JUnit), FRONTEND (React, Redux) and DATA (Oracle, SQL) charged, accent on DATA, then CRAFT `UP NEXT · RALLY 4`
    - comm `Match point. He's done this before.`
  - **The end:**
    - a loss: `21` / `19` / `GAME YASH`, saved `21–19`, `SEE PLAYER ATTRIBUTES` / `REMATCH`, comm `yashWins[0]`
    - a win: `20` / `20`, `SAVED`, `IT GETS THROUGH.`, claim `CLAIM YOUR POINT`, comm `visitorWins[0]`
  - **No LOCKED:** the word `LOCKED` never appears in any badminton view (§11.2 #24).

  Implement, then run: PASS.

- [ ] **Step 2: `BadmintonStage`** (inside `GameStage venue="hall"`):
  - **Bug:** the tight cells, Status per view.
  - **Power panel:** `Glass as="section"` at `left-9 top-30 w-62.5 p-5 flex-col gap-4 z-6`: `SHOT POWER` label, then a row gap 16 / h 360 of the `PowerMeter` and its legend, then the 56 h volt `HOLD · RELEASE` button.
  - **The hold button:**
    - `pointerdown` → `charge()` and `pointerup` / `pointercancel` / `lostpointercapture` → `release()` (pointer capture)
    - its own `onKeyDown` / `onKeyUp` for Space and Enter when focused (charge / release; key repeat ignored)
    - `aria-label` = its text
  - **Toast column:** at `right-9 top-30 w-85 flex-col gap-2.5 z-6`.
  - **Field (`aria-hidden`):** the Yash ring (762,334), `PlayerTag` reading at (826,350), your ring (530,762) with `YOU` at (612,762), the shuttle `TracerPath` and `ShuttleMark` (the flight tween moves the shuttle along the arc).
  - **Call and end:** `CallOverlay`; `GameEnd` under the power panel's button area, centred at top 610.
  - **h1:** an sr-only `h1` (SMASH OR CLEAR).

- [ ] **Step 3: `BadmintonColumn`** (derived):
  - **bug:** sm YASH | 20 | 19 | Status (`MATCH POINT` alert) or Meta `RALLY 2/4`
  - **reveal:** `RevealChip` of the latest charged group (`ATTRIBUTE CHARGED · RALLY 2` / FRONTEND / React · Redux)
  - **field:** the column hall court, and a slim `PowerMeter size="column"` (28 wide, 240 tall) at the right edge of the field above the thumb zone, with mono labels SMASH / DROP beside its top and bottom (mono 11)
  - **thumb:** the hint, plus a 110 h full-width press-and-hold button `HOLD · RELEASE` (same handlers), or `GameEnd`

- [ ] **Step 4: `BadmintonPage` and `BadmintonScreen`.** The runtime:
  1. `charge()` (only in `ready`): phase `charging`, `clock.restart()`, `useGameClock(root, { cssVar: "--power", value: (t) => powerAt(t) / 100, running: phase === "charging" })`.
  2. `release()` (only in `charging`): `power = powerAt(clock.elapsed())`, then `next = playRally(state, power, Math.random)`.
  3. Haptic (column, motion allowed).
  4. Phase `flight`: the shuttle tween over `flightMs`, `audio.play("smash")` for a smash.
  5. Phase `called`: set state, say the line, `callMs`.
  6. Then `ready`, or save / verdict / end.

  **Other rules:**
  - **Keys:** `down: { " ": charge }`, `up: { " ": release }`, active while `ready` / `charging`.
  - **Window blur while charging:** `blur` / hidden releases at the current power. A held key can never get stuck.
  - **Reduced motion:** `BADMINTON_AUTO` at `autoRallyTimes(4)`.

- [ ] **Step 5: Stories `Features/Games/Badminton`:** `Desktop` (fresh), `ArtboardParity`, `Phone`, `Lost`, `Won`.

  Parity vs `Badminton-Play@1440x900` ≤ 2 %. Masks (logged, G18): the toast column box (`right-9 top-30 w-85`, to the bottom of the fourth row). The board draws two charged and "WIN RALLY 3 / ARCHITECTURE": spec §8.3 and §11.2 #8 / #24.

- [ ] **Step 6: e2e `tests/e2e/badminton.spec.ts`:**
  - **Forced win:**
    1. `forceLuck(0)`.
    2. For each rally: keydown Space, `stepUntil` `--power` ∈ [0.215, 0.245], keyup Space, then run past the call.
    3. IT GETS THROUGH., then CLAIM YOUR POINT → `/arena/giant-killer`.
  - **Forced loss:** `forceLuck(0.99)` with the same perfect play → `21–19`, `GAME YASH`, Hub `PLAYED · 21–19`.
  - **Every rally reveals:** four smashes → four charged toasts and four announcements.
  - **Pointer hold:** press and hold the button with the mouse, release in CLEAR → `BACK LINE. STILL HIS.`
  - **Blur while charging:** keydown Space, `page.evaluate(() => window.dispatchEvent(new Event("blur")))` → a rally is played. The next keydown starts a new charge (nothing stuck).
  - **Reduced motion:** four toasts after 3 s, then the end.
  - **Viewports and axe:** as in cricket.

- [ ] **Step 7:**
  - Screenshots: fresh, charging, a call, the artboard state, end; 390×844.
  - Run the tests.
  - Commit `feat(badminton): smash or clear, desktop and one-thumb`.

---

## Task 8: Journeys, budgets, docs, carry-over

**Files:**
- Create: `tests/e2e/journeys.spec.ts` (or extend `smoke.spec.ts` if it already holds journeys; check first)
- Modify:
  - `tools/lighthouse.mjs`
  - `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md` (new §11.13; §12 rows; §11.6 if merges)
  - `docs/superpowers/plans/phase-0-carryover.md`
  - `src/shell/PlaceholderScreen.tsx` (only if it lists live phases)

- [ ] **Step 1: Journeys (spec §9.1):**
  - **Landing → Intro → Hub → Cricket → reveals → Career:**
    1. Click through with the fake clock and `forceLuck(0.99)`, playing three balls.
    2. Check SEE THE FULL SCORECARD → `/career`.
    3. Back at `/arena`: `1 OF 3 VENUES`, the cricket card PLAYED, the record `YASH 1 · YOU 0`.
  - **Skip on every game:** each SKIP goes to its page.
  - **Forced-win path:** the cricket win → `/arena/giant-killer` (placeholder), and the Hub index now lists the Locker Room.
  - **Keyboard only:** Hub `1` → cricket. Space × 3 with the clock stepped (any quality) → Tab to the end button → Enter → `/career`.
  - **Reduced motion:** Hub PLAY → the cricket auto-rally → the end.

- [ ] **Step 2: Lighthouse (G17).** Add `/arena/cricket`, `/arena/tennis` and `/arena/badminton` to `PAGES`, with `/arena`'s gates, in the shape the file uses. `pnpm build && pnpm lighthouse` must pass. Paste the table in the report.

- [ ] **Step 3: Spec §11.13 "Games (Phase 5)"**, the shape of §11.12:
  - G1–G18 as built
  - the referee rules (zones, windows, bands, beats, scores, saved score strings)
  - the design-system additions
  - the deviations the visual tests accept (exact mask boxes with reasons, A2 rows: the small ScoreBug's 11 px floor, the pitch labels, the phone text)
  - token merges > ~2 %
  - the Lighthouse numbers

  In §12, add rows for:
  - Mobile Tennis and Badminton (one-thumb: swipe / tap halves; press and hold), replacing those two from the "Mobile Career, Highlights, … Tennis, Badminton" row
  - the reduced-motion auto-rally
  - "watch the highlight"
  - the derived game copy (G5, G6, G8, G12)

- [ ] **Step 4: Carry-over.**
  - Tick the five absorbed rows (see the header) with their pointers.
  - Move "Count-up … controlled trigger" to Phase 6 with the G14 note.
  - Add any new rows the reviews produce.

- [ ] **Step 5:**
  - `pnpm verify` (stop only a `pnpm preview` you started; ask in the report if 4173 is busy).
  - Commit `docs(spec): section 11.13 for the games; journeys and lighthouse cover them`.

---

## Execution order and model

Sequential, one Sonnet 5.5 builder per task (1 → 8). The tasks share:
- the referees (1 → 5, 6, 7)
- the scenes and the kit (2, 3 → 4 → 5, 6, 7)
- the frame and the hooks (4 → 5, 6, 7)
- the e2e helpers (4 → 5–8)

After each task the orchestrator reviews the diff, with screenshots for Tasks 2–7. After Task 8:
1. An Opus 5.5 whole-phase review.
2. One fix wave.
3. Full `pnpm verify` + Lighthouse.
4. The progress meter.
5. Yash previews (`pnpm build && pnpm preview`, or the dev server) and OKs the merge.
6. Fast-forward to `main`.

## Self-review notes (orchestrator)

- **Spec coverage (phase 5 row and §8):**
  - engine: clock (Tasks 1, 4), input (Task 4 + per game), luck (Task 1), reveal on every input (Tasks 5–7 tests), fair play (G11, Task 1 beats test, Task 4 frame), outcome (Task 4 `useMatchResult`, Tasks 5–7 claim)
  - cricket §8.1 (Tasks 1, 5), tennis §8.2 (Tasks 1, 6), badminton §8.3 (Tasks 1, 7)
  - desktop and one-thumb mobile (Tasks 5–7)
  - verdicts (`VERDICT_MS`, Tasks 5–7)
  - "watch the highlight" (G9)
  - reduced-motion auto-rally (G10)
  - exit checks: referee unit tests incl. forced win and the 1 % (Task 1); journeys (Task 8); visual diffs of the drawn states (Tasks 5–7)
- **Accessibility rows:** A4 (badminton alert chip, Task 7), A5 (QUICK VIEW on the phone, Task 4), A7 (aria-hidden + announcer, Task 4), A8 (game keys, Task 4).
- **Carry-over rows:** all five are assigned (Tasks 3, 5, G8, G14, §11.13).
- **Placeholders:** none. The masks are named by box; their exact pixels are measured by the parity tests, by instruction.
- **Types:** these are used with the same names across Tasks 1, 4, 5, 6 and 7:
  - engine: `Quality`, `Luck`, `Winner`, `GameLayout`; `pingPong`, `createGameClock`, `luckyWin`, `winChance`; `VERDICT_MS`, `AUTO_RALLY_MS`, `MAX_GAME_MS`, `autoRallyTimes`; `noteLoss`, `OFFER_AFTER_LOSSES`
  - cricket: `CRICKET_*`, `bowl`, `lengthQuality`, `cricketRuns`, `cricketWinner`
  - tennis: `TENNIS_*`, `newServe`, `returnQuality`, `playReturn`, `windowFor`, `tennisPoints`, `tennisWinner`
  - badminton: `BADMINTON_*`, `POWER`, `powerAt`, `shotFor`, `weightQuality`, `playRally`, `badmintonScore`, `matchPoint`, `badmintonWinner`
  - frame and hooks: `useGameClock`, `useGameKeys`, `useTimers`, `useMatchResult`, `buildGameChrome`, `GameStage`, `GameColumn`, `GameEnd`, `GameAnnouncer`
  - `data-game` / `data-phase` (the root), `--meter` / `--power` (the CSS variables)
