# Carry-over backlog from Phase 0A

Items found during Phase 0A reviews that belong to later plans. Each plan below must absorb its rows (and tick them here) before it is approved.

## 0B — Primitives
- [x] Decide and wire a Storybook a11y test runner (`@storybook/addon-vitest` or test-runner); `a11y: { test: "error" }` in `.storybook/preview.tsx` is inert until then. → Playwright + axe over storybook-static, `pnpm test:stories`
- [x] Inline styles in components/stories must use semantic vars or utilities, never `var(--color-*)` (those resolve at `:root` and ignore `data-venue` / `data-zone`).
- [x] Hand-written vendor-prefixed CSS pairs: `-webkit-` line first (the minifier keeps the last duplicate).
- [x] Investigate the pnpm peer-dependency WARN printed on `pnpm add` once. → only unmet peer is `eslint-plugin-jsx-a11y` wanting ESLint ≤9 (works on 10); nothing else.
- [ ] `eslint-plugin-jsx-a11y` peer range stops at ESLint 9 — re-check on next ESLint bump.
- [ ] Alias import violations are reported twice (alias rule + import-x zone) — optional tidy.

## 0C — Broadcast kit + scene
- [x] Add the ground alpha ramp (×4) and white ramp to ×6 (spec §5.1) when HUD/bars are built.

## 0D — Stage, shell, routes
- [x] Validate content at build time (prerender/Vite plugin) and ship plain typed JSON to the client, instead of parsing with Zod in the browser on every load.
- [x] Replace the placeholder home (and its `#top` link) with route placeholders.
- [x] ArenaBackdrop full-bleed: outer full-bleed layer (bg-night + sky) + inner 1440×900 layer scaled by --stage-scale, overflow visible.
- [ ] Pick the venue per route via `<ArenaBackdrop venue>` (turf / court / hall); the default is turf.
- [x] CommentaryBar: the commentary service owns the live region (pass `aria-hidden` through rest props) and flips `state="out"` before unmounting a line.

- [ ] Phase 2: same-page hash links (e.g. `/trophies#academy`) are now left to the router by the ArenaLink bail-out (no wipe); verify on the real page.
- [x] Phase 3: tablet (768–1199) Stage shrinks 11px mono to ~6px; decide the tablet treatment. → §11.11 L1 + L2 (Landing column on tablets; Intro on the stage with the mono and body floors)
- [x] Phase 3: commentary live region on the mobile placeholders (speak or stay silent?). → §11.11 L11 (silent below 768px)
- [x] Phase 3 / 7: lazy-load GSAP (dynamic import in `go()` plus idle prefetch) and check Lighthouse. → Task 1 (`loadGsap` / `prefetchGsap`), §11.11 (Lighthouse results)
- [x] Phase 4 / 5: match record shape guard/merge, and migrate on a version bump (`arena:v1`). → Phase 4 Task 1 (`sanitizeRecord` in the persist `merge` and `migrate`; §11.12)
- [ ] Phase 7: the host must serve a real Out-of-Bounds HTML page with HTTP 404 (not the SPA fallback's 200); verify it.
- [ ] Phase 7: `og:image`, `og:url` and `<link rel="canonical">` from the production domain (env); Phase 1 ships og:title/description/type/site_name + twitter:card only.
- [ ] Phase 7: CSP needs build-time hashes for React Router's inline scripts and the stage-scale script.
- [ ] Optional: bidirectional check between `ROUTES` (src/shell/routes.ts) and `app/routes.ts`.

## Before Phase 1's first pixel diff
- [x] Log token merges that moved values >~2% in spec §11 (mobile glass .7/.8→.85, QV sticky bar .86→.9, Main/Intro glass .62/.10→.66/.09, Scoreboard border canonical #2A323C vs Main #232A33). → spec §11.6
- [x] Tall boards (QuickView 1440×3300): add viewport-sized crops or full-page comparison to `expectMatchesArtboard`; add a friendly "run `pnpm references`" missing-reference error; document that `diffImages` mutates its inputs. → `expectRegionMatchesArtboard` + renderer `*.regions.json` (Phase 1 Task 1)
- [x] Font parity: references load Big Shoulders 600 and JetBrains Mono 500 but the app doesn't ship them — add the faces or log as deviation (affects Main, Mobile-Landing, QuickView, Trophy-Room). → no artboard element uses them; renderer now loads only shipped weights
- [x] `Link.href` regex accepts `/\evil.com` — tighten to `^\/(?![\/\\])`.
- [x] `test:visual-refs` overlaps `test:e2e` and starts the full webServer — drop or narrow it.

## Phase 1 / 2
- [ ] StatTile label tracking is .18em in the tile vs .20em on the artboard (Phase 1/2, first pixel diff of a stats board).
- [ ] StatTile `cell` tone lays out as a row in the artboard but as a column here (Phase 2, Player Card).
- [ ] Inline CommentaryBar line is 15px here vs 16px on the artboard (Phase 2, Team-Up).

## Phase 2 / 5
- [ ] Career `status` enum only allows NOT OUT / DEBUT — extend when a third role exists (Phase 2).
- [x] Academy innings number is `careers.length + 1` — revisit with a third role (Phase 5, cricket). → the over reveals the first two career innings, then the academy; its slot number is its place, tested with three careers (`cricket/view.test.ts`, §11.13 G7)
- [x] ScoreBug cell padding is 16px here vs 14px on the artboard (Phase 5). → `ScoreBug.Cell pad="tight"` (14) for tennis and badminton; cricket keeps 16, as drawn (§11.13)
- [x] A2: the small ScoreBug uses an 11px mono floor where the artboard has 10px (Phase 5; keep 11px, log as a deviation). → logged in §11.13 (deviations)

## Phase 3
- [x] Main reference shows "SOFTWARE ENGINEER" with collapsed tracking (the `boot` keyframe end state, audit risk #11) — decide .42em design intent vs frozen end state; mask/log as deviation. → §11.11 L10 (.42em kept, box masked)
- [x] Intro light cones: apply D-1 (beam apex aligned to each lamp's span; spec §11.4). Phase 0 already applies it to the Landing stadium cones. → Task 2 (`cones.ts`), §11.11

## Phase 4
- [x] Hub tablet treatment (drawer, §12) and the stage mono floor at Hub scale (`--stage-mono-min`, §11.11 L2). → §11.12 H1, H2, H13 (`mono-fit`)

## Phase 5 / 6
- [x] Closed unbuilt: no Locker Room, nothing counts up (Phase 6, §11.14). Phase 6: Count-up has no controlled trigger for tiles already in view at mount (they show the final value). The Hub does not need one (H11: its 0 to 3 numbers fill as bars instead). The games do not need one either (ruling G14: score digits swap with the 200ms snap, §11.13); build it for the Locker Room record (Phase 6).
- [x] The Hub's PLAY / REMATCH go to `/arena/cricket`, `/arena/tennis`, `/arena/badminton`, which are still placeholders (Phase 5). The Hub's seeded states (`artboardRecord`) stand in for a real saved match until `completeMatch` is wired from the games. → the three games are built and call `completeMatch` the moment the result is known (`useMatchResult`, §11.13 G8); the journeys play cricket from the Hub and back (`tests/e2e/journeys.spec.ts`)
- [x] Phase 5: a played venue's last score (`PLAYED · <score>`) is whatever the game saves; agree the score string format with the game screens. → cricket `14* NOT OUT` / `0 OUT`, tennis `GAME YASH` / `BROKE SERVE`, badminton `21–19` / `20–20` (§11.13 G8)

## Phase 4 follow-ups (found in reviews)
- [ ] Body-floored rail labels ("Match Highlights", "Training Academy") may wrap to two lines at the 11px tag / laptop scales (accepted, §11.12 H13). Revisit if the rail is redrawn.
- [ ] `mono-fit` stops at zero tracking: a label whose drawn width needs negative tracking (11px / .14em at scale .8) is about 1% wider than drawn.
- [ ] `CommentarySlot` takes only `className`, so the Hub's COMM slot has no `data-record-pending` (nothing record-bound can show there; a line left on air by the previous page is not record-bound).
- [ ] The Hub route parity compares when the COMM line finishes entering (it stays 4s); on a very loaded host a later screenshot would differ only inside the COMM box.
- [ ] The Hub's content-page parity after the `tabbar-clearance` move was covered by `pnpm verify` at the Phase 4 exit; re-check it if `ContentLayout` changes again.
- [ ] Make the Hub backdrop parity meaningful (`tests/stories/scene.spec.ts` reports 0.0000 with most of the frame masked; near-black art passes pixelmatch's threshold almost regardless): use a luminance-stretched compare, or tight crops of the crowd strip and the grid.
- [ ] The prerendered `/arena` HTML has two `<h1>` (stage and column, one hidden by CSS), as the Landing does; one-h1 tests use the accessibility tree.

## Phase 5 follow-ups (found in reviews)
- [ ] The phone game column draws no route back to the Hub (the Mobile-Game board draws no tab bar); a visitor leaves through SKIP, QUICK VIEW or the browser's back. Decide in the final review whether the column gets a back chip.
- [ ] The game calls (`SIX.`, `ON THE LINE.`) stay on screen through the verdict and the end, behind the end buttons (all three games). Fade the call when the end buttons appear if it reads as clutter.
- [ ] `CourtMark` and the column's court placement use container query units (Safari 16+) and no `foreignObject`; spot-check the three game columns on a real Safari.
- [ ] Tennis's Yash ring is a pill (`rounded-full`) where the board draws a 50% ellipse (the same `TrackingRing` as cricket's; inside the 2% limit).
- [ ] Derived game copy (tennis `missed` / `line` COMM lines, badminton `start` / `rally` / `perfect` COMM lines, the phone hints, SEE / CLAIM labels, the `SAVED` and `GAME YASH` statuses) is flagged for Yash's review (§12).
- [ ] Phase 7: audio files for the `bat`, `net` and `smash` slots (the games call `audio.play(...)`; silent until then, ruling G15).

## Phase 6 follow-ups (found in reviews; none blocking)
- [x] Full Time's stage now has QUICK VIEW top-right (A5, "one tap away on every screen"; the artboard draws none): `FullTimeStage` uses the Hub's `HUD` + `QuickViewChip`, its box is masked in `tests/stories/full-time.spec.ts` (§11.14 deviations, parity 0.52%), and `tests/e2e/full-time.spec.ts` asserts it is visible and at least 44px tall at every viewport. Fixed in the Phase 6 fix wave.
- [ ] On a phone the Full Time toast eyebrow wraps to two lines ("MATCHDAY COMPLETE · " / "3 OF 3 VENUES"), by design (`text-balance`); look at it once on a real phone.
- [ ] The Full Time board's loser score uses `text-dim` (#7D8893), not the drawn #5D6670 (A1 bans decoration greys as text). Logged in §11.14; revisit if the design ever adds a text-safe dark grey.
- [x] `tests/e2e/hub.spec.ts` now seeds badminton's last score as `21–19`, as the game saves it (Phase 6 fix wave).
- [ ] Playwright quirk, not a page bug: with JavaScript off, a `click()` on a Full Time stage link during the 0.9s rise stalls ("not stable"); the JS-off test waits for finite animations first. Keep that wait in any new JS-off test of an animated page.
- [ ] Phase 7: add `/arena/full-time` to the sitemap and the OG tags check (it is a page like the Hub; the old `/arena/giant-killer` and `/locker-room` addresses must not appear).

## When a git remote is added (Phase 7 at latest)
- [ ] CI: add `permissions: contents: read`, a concurrency cancel group, and `if-no-files-found` on artifact upload; confirm the workflow passes on Ubuntu.

## Accepted (no action)
- References are not byte-identical between runs (Chromium raster noise); pixel diff uses tolerance — never hash-compare.
- Motion artboard's wipe bar is off-screen at frame 0 — Motion is a reference board, never pixel-diffed.
- With a stray `pnpm preview` on :4173, `pnpm verify` fails fast ("port already used") — stop stray previews before running verify.

## All later plans (convention found in 0C)
- [ ] Any font-weight / size / leading / tracking override that sits next to a `type-*` class must be passed as a **separate `cn()` argument after the type class** (e.g. `cn("type-mono-tag", "font-bold")`). Prettier's Tailwind class sorter reorders literal strings, and `cn`'s type-recipe conflict group then silently drops the override.

## Phase 8 — 3D games (owner request 2026-10-09; the project's last phase, after Phase 7)
- [ ] **Discuss in detail with Yash before planning Phase 8** (owner request 2026-10-14). Phase 5 games are rule-driven (fixed referee outcomes) with linear, scripted motion; Yash wants instead:
  - the **real game flow** of all three sports in 3D, with **players playing in real time** (not scripted beats);
  - the opponent as a **bot** that plays every time (owner's words: "my user as bot who will everytime" — confirm: Yash's bot that (almost) always wins, keeping the ~1 % rule?);
  - **Settled by the owner on 2026-10-14 (§11.14):** the bot always wins, with no 1 % rule. See the first row below.
  - natural, non-linear motion (physics-like ball and shuttle flight, animated full-body players, camera tracking).
  Open questions for that discussion: how the real-time play keeps "every input reveals content" and the 15 s fair-play bound; bot difficulty and the 1 % win; phones; reduced motion; what stays of the Phase 5 referees.
3D only for the three games (cricket, tennis, badminton); every other screen stays as built. React Three Fiber in the Stage backdrop slot (spec D1), with the 2D board as first paint and fallback.
- [ ] The opponent is a Yash bot that always wins (owner decision 2026-10-14, §11.14): a 3D visitor win must never exist. The 3D games keep saving a per-venue form (the share of perfect inputs, `bestForm`) so Full Time can still grade how close the visitor came.
- [ ] Cricket: realistic bowling speed and bounce; an animated 3D batsman holding the bat; natural full-body swings; aerial trajectories for sixes; ground-level fours; smooth camera tracking; responsive play.
- [ ] Tennis and badminton: the same 3D treatment (players, shot trajectories, camera).
- [ ] Skills to load (compatible with the stack): react-three-fiber-game, threejs-react, threejs-animation, threejs-loaders, threejs-camera, threejs-lighting, threejs-materials, threejs-performance; threejs-physics only if an engine is chosen over referee-driven paths.
- [ ] The game clock writes `--meter` / `--power` / `--serve` on `<main>` every frame, so style is recalculated for both layouts' whole subtree (cheap at today's DOM, but it grows with the scene). When the 3D scene arrives, have the clock target the two meters' nearest common wrapper, or register the properties (`@property --meter { syntax: "<number>"; inherits: true; initial-value: 0 }`) so only what reads them restyles (Phase 5 review m-12).
- [ ] Decide then: character source (Mixamo / CC0 / code-built), which screen sizes get 3D, the download and Lighthouse budget, parity against the 2D boards.
