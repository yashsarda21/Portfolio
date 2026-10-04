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
- [ ] Replace the placeholder home (and its `#top` link) with route placeholders.
- [ ] ArenaBackdrop full-bleed: outer full-bleed layer (bg-night + sky) + inner 1440×900 layer scaled by --stage-scale, overflow visible.
- [ ] Pick the venue per route via `<ArenaBackdrop venue>` (turf / court / hall); the default is turf.
- [ ] CommentaryBar: the commentary service owns the live region (pass `aria-hidden` through rest props) and flips `state="out"` before unmounting a line.

## Before Phase 1's first pixel diff
- [ ] Log token merges that moved values >~2% in spec §11 (mobile glass .7/.8→.85, QV sticky bar .86→.9, Main/Intro glass .62/.10→.66/.09, Scoreboard border canonical #2A323C vs Main #232A33).
- [ ] Tall boards (QuickView 1440×3300): add viewport-sized crops or full-page comparison to `expectMatchesArtboard`; add a friendly "run `pnpm references`" missing-reference error; document that `diffImages` mutates its inputs.
- [ ] Font parity: references load Big Shoulders 600 and JetBrains Mono 500 but the app doesn't ship them — add the faces or log as deviation (affects Main, Mobile-Landing, QuickView, Trophy-Room).
- [ ] `Link.href` regex accepts `/\evil.com` — tighten to `^\/(?![\/\\])`.
- [ ] `test:visual-refs` overlaps `test:e2e` and starts the full webServer — drop or narrow it.

## Phase 1 / 2
- [ ] StatTile label tracking is .18em in the tile vs .20em on the artboard (Phase 1/2, first pixel diff of a stats board).
- [ ] StatTile `cell` tone lays out as a row in the artboard but as a column here (Phase 2, Player Card).
- [ ] Inline CommentaryBar line is 15px here vs 16px on the artboard (Phase 2, Team-Up).

## Phase 2 / 5
- [ ] Career `status` enum only allows NOT OUT / DEBUT — extend when a third role exists (Phase 2).
- [ ] Academy innings number is `careers.length + 1` — revisit with a third role (Phase 5, cricket).
- [ ] ScoreBug cell padding is 16px here vs 14px on the artboard (Phase 5).
- [ ] A2: the small ScoreBug uses an 11px mono floor where the artboard has 10px (Phase 5; keep 11px, log as a deviation).

## Phase 3
- [ ] Count-up has no controlled trigger for tiles already in view at mount (they show the final value); the intro sequence needs a way to start it.
- [ ] Main reference shows "SOFTWARE ENGINEER" with collapsed tracking (the `boot` keyframe end state, audit risk #11) — decide .42em design intent vs frozen end state; mask/log as deviation.
- [ ] Intro light cones: apply D-1 (beam apex aligned to each lamp's span; spec §11.4). Phase 0 already applies it to the Landing stadium cones.

## When a git remote is added (Phase 7 at latest)
- [ ] CI: add `permissions: contents: read`, a concurrency cancel group, and `if-no-files-found` on artifact upload; confirm the workflow passes on Ubuntu.

## Accepted (no action)
- References are not byte-identical between runs (Chromium raster noise); pixel diff uses tolerance — never hash-compare.
- Motion artboard's wipe bar is off-screen at frame 0 — Motion is a reference board, never pixel-diffed.
- With a stray `pnpm preview` on :4173, `pnpm verify` fails fast ("port already used") — stop stray previews before running verify.

## All later plans (convention found in 0C)
- [ ] Any font-weight / size / leading / tracking override that sits next to a `type-*` class must be passed as a **separate `cn()` argument after the type class** (e.g. `cn("type-mono-tag", "font-bold")`). Prettier's Tailwind class sorter reorders literal strings, and `cn`'s type-recipe conflict group then silently drops the override.
