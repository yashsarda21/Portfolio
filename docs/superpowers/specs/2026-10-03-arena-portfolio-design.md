# The Arena — Portfolio Build Spec

**Date:** 2026-10-03 · **Owner:** Yash Sarda · **Status:** Draft for review

**Companion file:** [`2026-10-03-arena-design-audit.md`](2026-10-03-arena-design-audit.md) holds every exact value from the designs: colours, sizes, keyframes, the 62-component inventory, and the copy lists. This spec makes the decisions. The audit is the measuring tape. When this spec says "per audit §3", the exact numbers live there.

**Design source:** the handoff package (README, `tokens.css`, `content.json`, 23 artboards, assets). In Phase 0 it moves from `temp_handoff/yash-sarda-arena-handoff/` to `design/handoff/`, minus the resume PDF.

---

## 1. Goal (in plain words)

Build Yash's portfolio as a night-time sports arena, matching the handoff designs as closely as possible. Visitors can play short games against Yash, and every game reveals real portfolio content.

**Who it's for:** recruiters first. Within 1–2 minutes they must know who Yash is, what he does, where, which stack, what he built, and how to contact him. `/scout` (Quick View) gives them that without any games. It is the link that goes on the resume.

**What "done" means:**
1. Every product screen matches its artboard at 1440×900 (desktop) and 390×844 (mobile). It passes the automatic screenshot comparison (§9), except for deviations logged in §11.
2. `/scout` is fully readable with JavaScript turned off.
3. Accessibility: every control is a real button or link, targets are at least 44px, text contrast is at least 4.5:1, keyboard works everywhere, and reduced-motion is respected.
4. Speed: landing text is visible in under 1.5s, and animation runs at 60fps on desktop.
5. No hard-coded copy. All text comes from content files (§6).

**Out of scope for now:** a WebGL 3D stadium (we leave a slot for it, §4.4), a backend or server, analytics, and a CMS.

---

## 2. Decisions made during brainstorming

| # | Question | Decision |
|---|---|---|
| D1 | How do we draw the stadium? | **CSS/DOM scenes + GSAP now**, with a `<Stage>` slot so a WebGL backdrop can replace them later without touching the UI. The artboards are drawn in CSS, so this reproduces them exactly. |
| D2 | How does it fit different screens? | **Hybrid.** Cinematic screens (Landing, Intro, Hub, 3 games, Giant Killer) are drawn on a fixed 1440×900 stage that scales to fit. Content screens (Career, Highlights, Attributes, Trophy Room, Player Card, Team Up, Quick View) use real responsive layout. Below 768px every screen uses its mobile layout. |
| D3 | Framework? | **Vite + React Router v7 (framework mode)** with every route pre-rendered to static HTML. React 19, TypeScript (strict), Tailwind v4, GSAP. Static hosting, defaulting to Vercel. |
| D4 | Build order? | Phases 0–7 (§10). Quick View comes right after the foundation because it has the most recruiter value. |
| D5 | Quality bar? | Unit tests, Storybook, screenshot comparison against the artboards, accessibility scans, journey tests, Lighthouse budgets, and GitHub Actions CI. |
| D6 | Open items? | Decided by the orchestrator (§11, §12). The phone-number PDF is never published, and accessibility wins over pixel-exactness. |
| D7 | Git workflow? | No pull requests. One local branch per phase (`phase/0-foundation`, …). It merges straight into `main` after Yash approves the phase. |

---

## 3. Tech stack

| Tool | Why |
|---|---|
| **pnpm** | Fast package manager with strict dependency rules |
| **Vite** | Dev server and bundler |
| **React Router v7 (framework mode)** | Routing plus pre-rendering every route to HTML at build time. We control navigation, which the wipe and tunnel transitions need. |
| **React 19 + TypeScript strict** | UI and type safety |
| **Tailwind CSS v4** | Styling, locked down to our tokens only (§5.2) |
| **GSAP 3 + `@gsap/react`** | Sequenced animations (intro, boot, wipes, ball arcs). Core only, with no plugins unless a screen needs one. |
| **class-variance-authority + tailwind-merge** | Component variants without repeated class strings |
| **@radix-ui/react-slot, @radix-ui/react-tabs** | Correct accessibility for "button that renders as a link" and selectable lists |
| **Zod** | Checks content files are valid when the site builds |
| **Zustand** (+ persist) | The visitor's match record and achievements, saved in the browser |
| **@fontsource** packages | Self-hosted Big Shoulders Display, Archivo and JetBrains Mono, trimmed to the weights actually used (audit §10 #24) |
| **Vitest + Testing Library** | Unit and component tests |
| **Storybook 9 (Vite)** | Design-system catalogue and review surface |
| **Playwright + @axe-core/playwright** | Journey tests, screenshot comparison, accessibility scans |
| **Lighthouse CI** | Performance and accessibility budgets |
| **ESLint (+ boundaries plugin) + Prettier** | Code style, and the folder rules in §4.2 |
| **GitHub Actions** | Runs every check on push (once a GitHub remote exists). Locally, one command, `pnpm verify`, runs the same checks. |

Supported browsers: latest two versions of Chrome, Edge, Firefox and Safari (16.4+), plus iOS Safari and Android Chrome.

---

## 4. Architecture

### 4.1 Folder layout

```
app/
  root.tsx              html shell, fonts, stage-scale script, providers
  routes.ts             route table (§4.5)
  routes/*.tsx          THIN: page meta + compose one feature screen. No logic.
src/
  design-system/        knows nothing about Yash, content or routes
    tokens/             tokens.css (single source of truth) + Tailwind @theme
    primitives/         Text, Heading, MonoLabel, Button, Icon, Glass, Chip, Field, RadioCard…
    broadcast/          ScoreBug, CommentaryBar, LiveDot, SegmentBar, StatTile, Scoreboard…
    scene/              SkyGlow, CrowdTier, LightCone, FloodlightBank, VenueGlow, Field, Court…
    layout/             Stage, Page, Container, HUD
    motion/             easing/duration tokens, CSS presets, GSAP setup, motion hooks
  content/              content.json, ui-copy.ts, Zod schemas, selector functions
  features/             one folder per screen (quick-view, career, …, games/{engine,cricket,tennis,badminton})
  shell/                site-wide services: audio, commentary, transitions, match record
  lib/                  storage, game clock, live-region announcer, cn()
design/handoff/         original design package (reference only, never imported by app code)
tools/                  artboard renderer for visual references (§9.3)
docs/superpowers/       specs and plans
```

### 4.2 Folder rules (enforced by ESLint, not by trust)

- `design-system/` imports nothing from `content/`, `features/`, `shell/` or `app/`.
- `features/` never import from each other. Shared things move down into `design-system/`, `shell/` or `lib/`.
- `app/routes/` only compose: meta tags plus one feature screen.
- Feature code contains **no raw colours, pixel sizes for colour or type, or easing curves**. Tokens only.

### 4.3 Rendering model

- Every route is **pre-rendered to static HTML** at build time, then React takes over in the browser ("hydration").
- Desktop vs mobile layout differences are done with **CSS breakpoints, not JavaScript**. Pre-rendered HTML can't know the visitor's screen size, so JS-based switching would flash the wrong layout.
- Heavy client-only parts load lazily, per route, after the page shows: games, intro sprite rig, GSAP timelines, dust particles.
- Breakpoints: `mobile <768`, `tablet 768–1199`, `desktop ≥1200`.

### 4.4 The `<Stage>` (cinematic screens)

- UI is written in a fixed **1440×900 coordinate space**, so artboard positions port 1:1.
- Scale = `min(viewportWidth/1440, viewportHeight/900)`.
- A tiny inline script in `<head>` sets `--stage-scale` before first paint. A `ResizeObserver` updates it after that. Result: no flash of a wrongly-sized stage.
- The **backdrop renders outside the scaled box at full bleed**, so empty edges show stadium, not black bars.
- API: `<Stage backdrop={<ArenaBackdrop venue="turf" />}>…UI…</Stage>`. The backdrop is the WebGL swap point (D1).
- Below 768px `<Stage>` isn't used. Cinematic screens render their mobile layout instead.
- Trade-off (accepted): browser zoom doesn't reflow stage screens. All their information is also reachable on fluid pages via Skip or Quick View.

### 4.5 Routes

| Route | Screen | Type |
|---|---|---|
| `/` | Landing (Main) | Cinematic |
| `/intro` | Player Introduction | Cinematic |
| `/arena` | Arena Hub | Cinematic (desktop) / fixtures list (mobile) |
| `/arena/cricket` · `/arena/tennis` · `/arena/badminton` | Games | Cinematic |
| `/arena/giant-killer` | Easter egg (only reached after a win; direct visits show a "not yet earned" state) | Cinematic |
| `/career` · `/highlights` · `/attributes` · `/trophies` (+`#academy`) · `/card` · `/team-up` | Content pages | Fluid |
| `/locker-room` | Hidden section (derived design, §12) | Fluid |
| `/scout` | Quick View | Fluid, works without JS |
| `*` | 404 "Out of bounds" (derived) | Fluid |

### 4.6 Site-wide services (`shell/`)

| Service | API | Behaviour |
|---|---|---|
| Transitions | `useTransition().go(to, 'wipe' \| 'tunnel')` | 1. Cover: volt bar at 18° over 480ms, YS mark flashes mid-wipe (tunnel push first scales and blurs the scene). 2. Navigate and wait for the next route's code to load. 3. Reveal. 4. Move focus to the new `<h1>` and announce the page title. Back/forward buttons skip the cover. Plain links still work without JS. Reduced motion uses a 150ms crossfade. |
| Commentary | `useCommentary().say(line)` | One line at a time: slides in, holds 4s, exits. Queue drops stale lines. Mirrored to an `aria-live="polite"` region. Hidden on mobile, as designed. |
| Audio | `useAudio()` | Web Audio wrapper. Unlocked by the first CTA click (the "ticket gate"). Mute is remembered. Sound slots (crowd bed, floodlight thud, bat crack, net cord, smash) stay silent until files are added to `public/audio/`. |
| Match record | `useMatchRecord()` | Zustand, saved to `localStorage` under a versioned key (`arena:v1`). Stores: venues played, last scores, sections seen, the visitor's wins and losses, achievements, Locker Room unlocked. If storage is blocked, everything still works; the record just isn't kept. Includes "reset my record". |

---

## 5. Design system

### 5.1 Tokens: three layers in one `tokens.css`

1. **Reference tokens:** the raw palette.
   - Base colours from the handoff `tokens.css`.
   - Alpha ramps that replace the audit's 142 one-off rgba values: volt ×8, white ×6, ground ×4.
   - Light families: sky, beam, bulb, crowd, warm.
   - Surfaces, scoreboard set and venue triples (audit Appendix A).
   - Any merge that moves a value by more than ~2% alpha is logged in §11.
2. **Semantic tokens:** roles that components use.
   - Text: `--text-primary`, `--text-secondary`, `--text-label`, `--text-dim`.
   - Surfaces: `--surface-ground`, `--surface-glass`, `--surface-inset`.
   - Borders: `--border-subtle`, `--border-control`, `--border-selected`.
   - Also `--accent` and `--focus-ring`.
3. **Context overrides**, which re-point semantic tokens by attribute or media query:
   - `[data-venue="turf|court|hall"]` sets `--venue-tint`, `--venue-mid`, `--venue-deep`, `--venue-glow`, `--venue-light`, `--venue-crowd` (audit §4 table).
   - `@media (max-width: 767px)` switches glass to solid panels with no blur, per the Responsive board.
   - `[data-zone="trophy"]` makes gold available. Gold is unavailable anywhere else.

Resolved token drift (audit §2.10):
- One glass recipe: 0.66 alpha, 0.09 border, 14px blur.
- One hover volt: `#E6FF7A`. Link hover uses `--volt-hover`.
- One empty-segment colour.
- One scoreboard set, from Intro, the newer design (audit §10 #22).

### 5.2 Tailwind v4 theme

- `@theme` exposes **only** our semantic tokens. Default palette, radius scale and fonts are reset (`--color-*: initial`, etc.), so off-system classes like `bg-blue-500` or `rounded-lg` don't exist.
- Typography utilities come from the consolidated type scale (audit §2.4, finalised in Phase 0): `text-d1…d6` (display), `text-label`/`text-meta` (mono), `text-body`/`text-body-sm`, `text-comm` (italic commentary). Each bundles size, line-height, letter-spacing and weight.
- Motion utilities: `ease-follow`, `ease-snap`, `ease-swing`, plus the audit's extra eases (entrance, standard, absorb). Durations include `duration-wipe` and `duration-count`.
- Spacing keeps Tailwind's 4px scale, plus named tokens for repeated design sizes: `--gutter` 36 desktop / 16 mobile, `--header-h` 76, control heights 44/52/62/78/110.
- `--radius: 0` everywhere. Broadcast graphics are square.

### 5.3 Component tiers (~40 components from 62 audited patterns)

| Tier | Components | Rules |
|---|---|---|
| **Primitives** | Text, Heading, MonoLabel, Button (`variant` primary/secondary/ghost, `size` S/M/L/XL, `skew` on/off, `subLabel`, `pulse`), IconButton, Icon (one 24-viewBox stroke set), Glass (`edge`, `elevation`, `solid`), Chip (`tone`), TextField, TextArea, RadioCard, KeyValue (`<dl>`), Legend, ProgressSteps | No content knowledge. No outside margins: parents control spacing. |
| **Broadcast kit** | BrandMark, Breadcrumb, HUD (left/centre/right slots + presets), HUDButton, QuickViewChip, AudioToggle, SkipChip, ScoreBug (compound: `.Name`, `.Cell`, `.Status`, with flipped and serving variants), CommentaryBar, LiveDot, PlayerTag, StatTile (count-up), SegmentBar, SkillRow, Scoreboard + LEDTexture, LEDMarquee, KeyboardHint | The signature pieces, built once and reused everywhere |
| **Scene** | SkyGlow, VenueGlow, CrowdTier, LightCone, FloodlightBank (`size`, `on`, `flicker`), FloodlightMast, Field, PitchStrip, Court (tennis/badminton), HallLamp, HawkEye (target zones, tracer path, tracking ring), Dust, StadiumFlash, ArenaBackdrop (composes the rest per venue) | Decorative only: `aria-hidden`, themed by `data-venue` |
| **Composites** | VenueCard, VenueFixture (mobile), FacilityTile, IndexRail, MobileTabBar, StickyBottomActions, SelectableList (scorecard rows and highlight reel, on Radix Tabs), BallByBall, ProblemApproachResult, MediaSlot, TrophyCabinet + Trophy, TrophyDetail, AcademyCard, PlayerCard, PortraitFrame, RevealSlots, AttributeToast, CourtsideCard, AchievementToast, UnlockPanel, ChannelCard, TimingMeter, PowerMeter, AimZone, BallTracker, CallOverlay | Built from the tiers above. Still prop-driven; features pass data in. |

**Conventions:**
- Variants come from `cva`, and classes are merged with `cn()` (tailwind-merge).
- `asChild` (Radix Slot) lets a Button render a router `Link` or an `<a>`.
- React 19 ref-as-prop.
- Component state is exposed as `data-state="selected|locked|played|…"`, so styling keys off attributes.
- Every component accepts `className`.
- Compound components where the anatomy has named parts (ScoreBug, Scoreboard, HUD).

**Accessibility baked into the system:**
- A single focus-visible ring (volt, 2px, 3px offset). On skewed CTAs it's drawn on a skewed pseudo-element, so it follows the parallelogram.
- Selectable lists use Radix Tabs (arrow keys, `aria-selected`).
- Team Up uses native radios inside fieldset/legend.
- AudioToggle has `aria-pressed`. Icon buttons have `aria-label`.
- SegmentBar exposes text ("Shipped in production"), never a percentage.
- StatTile announces only the final value.

**Storybook:** every component has a story for each variant and state listed in the audit. Stories are the first review surface for every design-system task.

---

## 6. Content

- `src/content/content.json` is the handoff file, extended where the audit found missing data:
  - Academy innings data for cricket ball 3.
  - Project `facts` (shot data).
  - Trophy descriptions and links for all 5 trophies. Only the cup has copy in the designs; the other 4 get **derived copy, flagged for Yash's review**.
  - Attribute group notes, and `media` slots.
- `src/content/ui-copy.ts` holds the ~300 interface strings found in the artboards (audit §7.1): button labels, venue blurbs, game copy, commentary lines per event, page eyebrows. Namespaced as `ui`, `venues`, `games`, `pages`.
- **Zod schemas validate both files at build time.** A missing or misspelled field stops the build with a clear message.
- **Selector functions** give screens ready-to-render data. Examples: `getCareerRows()`, `getHighlightsInRoundOrder()`, `getAttributeGroups()`, `getTrophies()`, `experienceSince()`, which turns `proSince: "2024-07"` into "since Jul 2024" at runtime. Screens never format raw data themselves.
- Copy conflicts are resolved in §11.2.

---

## 7. Motion

| Layer | Job | How |
|---|---|---|
| **CSS presets** | Micro-interactions and single-element entrances: fade, rise, pop, live pulse, segment fill (350ms, 40ms stagger), hover floodlight sweep (300ms), press scale 0.97, card lift 8px | Tailwind utilities and keyframes from motion tokens. Stagger uses a `--i` custom property. |
| **GSAP timelines** | Choreography: landing boot, Player Intro, broadcast wipe, tunnel push, count-ups (900ms, tabular digits), ball/shuttle arcs, card tilt (`quickTo`), Hub idle sway | Each timeline is a **factory function**, e.g. `createIntroTimeline(refs, { tier })`, built from **labels and relative positions, not absolute seconds**. Desktop, tablet and mobile variants are the same timeline at different speeds or with tracks removed (fixes audit §10 #12). |
| **Sprite rig** | Intro head turn: 3 strips × 16 frames, plus `rest.webp` poster | Stepped ease, chained by timeline labels. Strips (~2.2MB) preload **only after landing text paints**. |

**Timing sources:** landing follows the Main artboard. The intro follows the Intro artboard and README §6 table (the newer source wins on conflicts; audit §7.2 #16–18). Intro lengths: desktop ~6s, tablet 4s, mobile 2s (lights + name), reduced motion instant.

**Reduced motion:** every GSAP timeline has a reduced branch via `gsap.matchMedia()` (jump to end state, or 150ms crossfade). CSS animations are globally disabled. Games become the 3s auto-rally, then the reveal.

**Performance rules:**
- Animate only `transform` and `opacity` (blur only inside the intro).
- Set `will-change` only during a tween.
- One dust canvas (≤60 specks, desktop only, paused when the tab is hidden).
- No layout reads inside animation loops.

---

## 8. Game engine

**Split:** each game is a **referee** (plain TypeScript, no React: "given the game so far and this input, what happens?") and a **look** (the React screen that shows the referee's decision). Referees are tested on their own.

**Shared engine parts (`features/games/engine/`):**

| Part | Behaviour |
|---|---|
| Game clock | One `requestAnimationFrame` clock drives both the moving meter and the hit check. Fixes the cricket prototype drift (audit §10 #7). Restarts cleanly on rematch. |
| Input | Space / Enter / click / tap / press-and-hold / ← → / swipe. Listeners attach **only while a game is active** and detach on exit. |
| Luck roll | Injectable random source. Tests force win or lose. |
| Reveal | Every input reveals one piece of content, win or lose. Principle: information is never locked behind a game. |
| Fair play | Skip and Quick View always visible and ≥44px. No game over 15s. After 2 losses, offer "Watch the highlight instead". Game visuals are `aria-hidden`, and reveals are announced in a live region. Reduced motion means a 3s auto-rally, then all reveals. |
| Outcome | On a visitor win: record it, unlock the Locker Room and the Giant Killer trophy, prefill Team Up with "I beat you.", and route to `/arena/giant-killer`. "Rematch" returns to the venue just played. |

**Win odds:** P(win) ≈ P(perfect on every input) × 12% luck ≈ 8% × 12% ≈ **1%**. A win always means the visitor really played perfectly.

### 8.1 Cricket: Bowl at Me (from the working prototype)

- 3 balls. The meter cursor ping-pongs every 1.1s.
- Zones: perfect = centre ±3.5%, good = ±12% on desktop; mobile ±5% / ±14%, as drawn.
- Balls 1–2: perfect → DOT, good → FOUR, miss → SIX.
- Ball 3: if all three balls were perfect and luck < 0.12 → BOWLED HIM (visitor wins). Otherwise perfect/good → FOUR, miss → SIX.
- Reveals: innings 01 (current role), innings 02 (internship), innings 03 (PICT academy).
- Commentary lines verbatim from the prototype (audit §6.1).

### 8.2 Tennis: Return of Serve (rules designed from README)

- 3 serves. Before each serve, the open side is chosen randomly and shown as a subtle tell: a volt highlight on the open aim zone after a short delay.
- The visitor picks ← / → (click or swipe).
- Reaction window shrinks: 900ms, 700ms, 500ms (+25% on touch). The displayed serve speed rises: 178, 186, 194 km/h.
- Quality: correct side within the first 40% of the window = perfect; correct side in time = good; wrong side or too late = miss.
- Every serve reveals one project, in QF → SF → FINAL order, shown as a courtside card.
- Serve 3: Yash hits a winner that clips the line, unless all three returns were perfect and luck < 0.12.

### 8.3 Badminton: Smash or Clear (rules designed from README)

- 4 rallies. Hold to charge the vertical power meter, release to play. Meter fills 8% → 86% over 1.4s and ping-pongs while held.
- Zones (top to bottom, as drawn): SMASH top 20%, CLEAR 20–60%, DROP bottom 40%.
- Rallies 1–3: any release plays the rally, and Yash wins the point. Score climbs to 20–19. Quality: a release inside a narrow "perfect weight" band (a 6%-tall band inside the DROP zone) counts as perfect.
- Rally 4 (match point at 20–19): only a perfect-weight drop, after perfect rallies 1–3, plus luck < 0.12, gets through. Otherwise Yash reads it.
- Every rally reveals one skill group, in content order: **Backend (Smash), Frontend (Drop shot), Data (Defence), Craft (Court vision)**. Upcoming groups show "UP NEXT · RALLY n", never "locked".
- The MATCH POINT chip uses the corrected style in §11.1.

---

## 9. Testing and verification

### 9.1 Checks

| Check | Covers | When |
|---|---|---|
| Unit (Vitest) | Referees, content schemas, selectors, date helpers, storage, clock | Written first (TDD) for all logic |
| Component (Vitest + Testing Library) | Interactive components: tabs, radio cards, toggles, form validation | With each component |
| Storybook | Every design-system component, every variant and state | With each component |
| Visual (Playwright) | Each screen vs its artboard reference at 1440×900 and 390×844. Fails above a 2% pixel difference, with logged deviations masked out. Produces a diff image. | Every screen |
| Accessibility (axe) | Every route, desktop and mobile | Every screen |
| Journeys (Playwright) | Landing → Quick View; Landing → Intro → Hub → Cricket → reveals → Career; Skip on every game; forced-win path → Giant Killer → Locker Room; `/scout` with JS disabled; reduced-motion path; keyboard-only path | End of each phase |
| Lighthouse CI | Landing text <1.5s (FCP), performance ≥90 desktop, accessibility 100 | Phases 1, 3, 7 |

### 9.2 One command

`pnpm verify` runs typecheck, lint, unit, Storybook build, visual, axe and journeys. GitHub Actions runs the same command on push once a remote exists. Nothing merges to `main` while it's red.

### 9.3 Visual references

The artboards need a canvas runtime (`support.js`) that isn't in the handoff. Phase 0 builds `tools/render-artboards`: a small shim that
1. evaluates each artboard's `DCLogic.renderVals()`,
2. fills in the `{{…}}`, `<sc-for>` and `<sc-if>` templating,
3. waits for fonts and lets animations finish (or freezes them at their end state),
4. screenshots the result with Playwright.

Output: `design/references/<artboard>@<size>.png`. Interactive states not drawn in the artboards (e.g. ball 2 revealed) are covered by Storybook and journey tests, not pixel diffs.

**Risk:** if the shim can't render an artboard faithfully, that artboard is reviewed by eye, side by side, and noted in its phase plan.

---

## 10. Phases

Each phase gets its own detailed plan. Yash approves the plan before building starts, and approves a local preview (`pnpm preview`) before the phase merges to `main`.

| # | Phase | Delivers | Exit check |
|---|---|---|---|
| 0 | **Foundation** | Repo and tooling; handoff moved to `design/handoff/`; artboard reference renderer; tokens + Tailwind theme; self-hosted fonts; content layer + schemas + selectors; all primitives and broadcast kit with stories; scene primitives; Stage; HUD; shell services (transitions, commentary, audio, match record); motion presets + GSAP setup; route table with placeholder pages; `pnpm verify` | Storybook complete for these tiers; all checks green; placeholder routes pre-render |
| 1 | **Quick View `/scout`** | Desktop (fluid) and mobile layouts; sticky header + section nav; hero, career, highlights, attributes, trophies, academy, Team Up band; mobile sticky bottom actions and highlight scroller (with a visible scroll hint); JSON-LD Person; OG tags | Visual diff passes; works with JS off; axe clean; Lighthouse budget met |
| 2 | **Content pages** | Career (scorecard + ball-by-ball), Highlights (draw + replay + serve/rally/winner), Attributes, Trophy Room + Academy, Player Card (tilt, flip with derived back face, copy-link feedback), Team Up (form + success state), desktop and mobile | Visual diffs pass; form tests pass; axe clean |
| 3 | **Landing + Player Intro** | Floodlight flicker, scoreboard boot, CTAs, audio gate; full intro timeline with sprite rig; tablet/mobile/reduced variants; skip and replay | Visual diff of end states passes; timeline unit tests; Lighthouse FCP <1.5s |
| 4 | **Arena Hub** | Desktop venue arc (hover lift + cursor tilt ≤6°, idle sway, drag to orbit), index rail with "seen" tags, matchday progress, facilities, record chip; mobile fixtures list + 5-tab bar | Visual diffs pass; progress reflects the match record |
| 5 | **Games** | Engine + cricket, tennis, badminton (desktop and one-thumb mobile), reveals, verdicts, "watch the highlight" offer, reduced-motion auto-rally | Referee unit tests (incl. forced win and 1% maths); journeys; visual diffs of drawn states |
| 6 | **Giant Killer + Locker Room + achievements** | Easter egg sequence, trophy unlock in cabinet, Team Up prefill, Locker Room page | Forced-win journey passes end to end |
| 7 | **Hardening** | Audio wiring, final perf pass, full a11y audit (keyboard + screen reader spot check), SEO (meta, OG image, sitemap, robots, canonical from env), 404, Vercel production deploy | All budgets green; Opus final review; Yash sign-off |

**How builders work (every phase):**
1. The orchestrator writes the phase plan as small tasks with exact files, tests and the definition of done.
2. One Sonnet 5.5 builder per task. Independent tasks may run in parallel; tasks touching the same files run in sequence.
3. The builder writes tests first, builds, adds stories, runs `pnpm verify`, and commits to `phase/<n>-<name>`.
4. The orchestrator checks each task (checks green, matches the plan).
5. At phase end, an Opus 5.5 reviewer checks spec compliance, visual diffs, accessibility and code quality. Fixes go back to builders.
6. Yash reviews the local preview, then the branch merges into `main` (no PRs, per D7).

---

## 11. Deviations and resolutions

Every intentional difference from the artboards is listed here, so "exact" stays auditable. Visual tests mask exactly these.

### 11.1 Accessibility and rule fixes (accessibility wins, D6)

| # | Artboard | Change | Why |
|---|---|---|---|
| A1 | Text `#5D6670` (3.44:1), `#3A434C` (1.95:1) | Text uses `--text-dim` `#7D8893`. The originals stay for borders and decoration only. | Contrast ≥4.5:1 |
| A2 | Mobile mono 9–10px | Minimum 11px | Readability; README says 11–13px |
| A3 | No focus styles anywhere | Volt focus ring on every interactive element | Keyboard users |
| A4 | Badminton MATCH POINT: white on filled `#FF4D3D` (3.29:1) | Dark chip, white text, 6px live-red dot | Contrast, and "red is never a fill" |
| A5 | Quick View missing on Mobile-Game, Easter-Egg, Intro | QuickViewChip added | "One tap away on every screen" |
| A6 | Selectable lists are plain buttons; audio toggle has no state | Radix Tabs; `aria-pressed` | Screen readers |
| A7 | Games not hidden from screen readers; no live region | `aria-hidden` visuals + live announcements | README fair-play rule |
| A8 | Keyboard hints imply global keys ("Q", "1 2 3", "ENTER ↵") | Shortcuts only on Landing and Hub (desktop). Active only while that screen is shown, ignored while typing or with modifier keys. Removed elsewhere. | README "no global key handlers outside games"; WCAG 2.1.4 |
| A9 | Mobile StickyBottomActions | Adds safe-area bottom padding | iPhone home bar |
| A10 | Mobile QV highlights row has no scroll affordance | Edge fade + "SWIPE →" hint | Discoverability |
| A11 | `outline:none` on fields | Replaced with the focus ring plus a volt border | Keyboard users |

### 11.2 Copy and content conflicts (content.json wins unless noted)

| Audit §7.2 # | Resolution |
|---|---|
| 1 Kafka "PRO" | `kit` level (5 segments, grey), as content says |
| 2 Highlight wording | Content wording |
| 3 Highlight order | Rounds always display QF → SF → FINAL; Highlights page selects THE FINAL by default |
| 4 Career bullets | Content `ballByBall`. Quick View may show a shorter `summary` line per role, stored in content (not rewritten inline). |
| 5 Stack order | Content order |
| 6 Summary | Content `player.summary`. Player Card's first-person line added to content as `player.cardBio`. |
| 7 QV "Craft & tools" | Built from content: Craft group + `languages` + `kitBag` |
| 8 Badminton groups | Content groups: Backend, Frontend, Data, **Craft** |
| 9 Meter order | As drawn (SMASH top) |
| 10 Trophy subs | Content wording; Quick View shows all 5 trophies |
| 11 Record | Two different things. **"Career record 99–1"** is a brand line on Intro and Player Card (constant in ui-copy). **"Your record"** on the Hub is the visitor's real saved tally. The Hub chip label becomes "YOUR RECORD". |
| 12 Experience label | "SINCE JUL 2024" everywhere (mobile included). Player Card "SEASON" = current year, computed. |
| 13 Academy innings | Cricket ball 3 reveals the academy entry from `trainingAcademy`. The Career scorecard shows the academy as a third, selectable row (see P3). |
| 14 Location | Per-entry `location` |
| 15 Type scale | Consolidated scale (§5.2) replaces `--fs-h1`/`--fs-h2` |
| 16–18 Timings | Newest source wins (§7) |
| 19 Trophy motion | Spec: spotlight drop 400ms + 12s turntable on the selected trophy |
| 20 Card tilt | Spec: lift 8px + tilt toward cursor ≤6°, border to volt |
| 21 Live red fill | See A4 |
| 22 Italic challenge lines | **Kept as drawn.** These read as the arena "voice", so the design wins. |
| 23 Mono size | See A2 |
| 24 "WIN RALLY 3" lock | "UP NEXT · RALLY 3" (§8.3) |
| 25 Global keys | See A8 |
| 26 Perfect window | Prototype percentages (§8.1) |

### 11.3 Resolved gaps in navigation (audit §8.2)

- Trophy Room gets a forward CTA: "PLAYER CARD →".
- Team Up shows a success state after sending (§12).
- Tennis and Badminton wins route to Giant Killer. Its rematch goes to the venue just played.
- The Hub index adds Quick View, plus Locker Room once unlocked.

### 11.4 Owner-requested design corrections

| ID | Where | Change | Source |
|---|---|---|---|
| D-1 | Main/Intro light cones | Beam top edge starts exactly under its floodlight lamp (artboard draws it offset) | Owner request 2026-10-04 |

The `/` fidelity test (§9.1, 2% limit) masks exactly the two cone-top wedges where this differs from Main: left `x 106–184, y 120–262`, right `x 1255–1335, y 120–271` (never the scoreboard or the CTAs).

### 11.5 Behaviour decisions

| Where | Decision | Why |
|---|---|---|
| Reduced-motion navigation (§4.6) | Navigation is instant: no cover, no reveal, no crossfade. §4.6 said a 150ms crossfade; §7's "jump to end state" rule was chosen instead. | Fewer moving parts, nothing to get stuck; focus and the announcement still run. |

### 11.6 Token merges that moved a value by more than ~2% (§5.1)

| Artboard value | Token used | Where |
|---|---|---|
| Mobile glass `rgba(14,19,26,.7)` / `.8` | `--surface-glass-solid` `.85` | Mobile HUD buttons, mobile panels |
| QV sticky header `rgba(5,7,10,.86)` | `--surface-bar` `.9` | `/scout` header (desktop); mobile bar keeps `.92` (`ground-a92`) as drawn |
| Main/Intro glass `rgba(14,19,26,.62)` + border `.10` | one glass recipe `.66` + `.09` | All glass panels |
| Main scoreboard border `#232A33` | canonical `#2A323C` (Intro, the newer board) | Scoreboard |
| Mobile tab bar `rgba(10,13,17,.94)` | new `--surface-tabbar` (the board bezel `#0A0D11` at `.94`, exact) | `MobileTabBar` |
| Selected-row `rgba(215,255,63,.06)` | new `--ref-volt-a06` (exact) | `SelectableList` item |
| Replay placeholder stripes `#0B1118` / `#0F1720` | `--surface-inset` `#0B0F14` / `--surface-panel` `#0E141B` (each channel ≤5/255 off) | `MediaSlot` (`media-stripes`) |

### 11.7 Quick View `/scout` (Phase 1)

| ID | Decision | Why |
|---|---|---|
| R1 | Hero sentence = the artboard's wording, stored as `content.scout.summary` / `summaryShort` (not `player.summary`). Amends §11.2 #6 for `/scout` only. | Names employer and stack, which recruiters scan for. Still content, not code. |
| R2 | Projects list strongest first (FINAL → SF → QF), as drawn and labelled. §11.2 #3 applies to the Highlights reel. | The section is labelled "STRONGEST FIRST". |
| R3 | Below 768px `/scout` is the Mobile-QuickView layout; the sections the artboard doesn't draw continue in the same mobile style. The long career bullets and "MORE ON GITHUB" are mobile-hidden (GitHub stays reachable in the Team Up band). | D2: every screen has its mobile layout. |
| R4 | With `player.resumePdf: null`: hero CTA "REQUEST RESUME", band row "Request resume ↗" (mailto). Switches to "VIEW PLAYER CARD (PDF)" / "Resume (PDF) ↓" when a public PDF is set. | §12 security rule. Real-route region tests mask the CTA and resume row only. |
| R6 | Short labels added to content: `shortRole`, highlight `scoutTag` / `shortName` / `scoutShort`, academy `degreeShort`, `scout.craftAndTools`. Kudo Board and Power BI `scoutShort` lines are **derived copy, flagged for review**. | No hard-coded copy, exact drawn labels. |
| Content wording | Career bullets (`ballByBall`), stack order and the 5 trophy rows come from content (§11.2 #4, #5, #10), so the real page's Career/Trophies bodies differ in wording and height from the artboard. Layout parity for those blocks is proven by the artboard-copy fixture story (≤2%). | Content wins. |
| Visual masks | Mobile parity masks only: A2 lines (10→11px mono: eyebrow, chips, career dates, "2 INNINGS", round labels), A10 (SWIPE hint, scroller fade), and a strip at `y 734–766` where the continuing page (R3) shows through the bottom bar's fade. | Logged deviations only. |
| A2 compensation | The mobile 11px mono recipes (`type-mono-chip/date/round/meta/kicker`) use a 13px line box, the drawn 10px line box, so nothing below them moves. Hero chips use `0.09em` tracking at 11px (the drawn 1px), or the three chips wrap. | A2 keeps 11px text without shifting the layout |
| Fix-wave recipes | `type-mono-date` (career dates keep their drawn 0.12em) and `type-body-copy` (15px / 1.5, highlight card copy); shared `type-body-md` stays 1.45. Single-line labels copied from artboard spans with no line-height use the typed `leading="font"` prop on `Text` / `Heading` / `MonoLabel` (the `leading-auto` token, `line-height: normal`); a raw `leading-*` class is not allowed in a feature. | One rule in the design system, not per-element fitting |
| Font smoothing | App-wide `-webkit-font-smoothing: antialiased` removed: text now renders like the artboards (browser default). Fidelity is measured at browser default everywhere. | Exact match on macOS; the property has no effect elsewhere |
| Lighthouse gate | `pnpm lighthouse`: performance = median of 3 runs; accessibility, best practices and SEO = worst run. Desktop budget: performance ≥90, accessibility 100, best practices ≥90, SEO ≥90. | Performance varies run to run; the other categories are deterministic |

### 11.8 Content pages: Career and Highlights (Phase 2A)

Rulings, as built:

| ID | Decision | Why |
|---|---|---|
| P1 | The replay placeholder reads "<name> · REPLAY COMING SOON" (one `ui` string), not the artboard's "ADD A 10s SCREEN RECORDING". Stripes, REPLAY chip, round chip and progress bar as drawn. A real recording replaces it; its name is "<name> · REPLAY". | The artboard text is a note to the owner. |
| P2 | LIVE DEMO and FULL CASE STUDY rows appear only when content has `links.demo` / `links.caseStudy`. CODE ON GITHUB goes to `links.code`, else the GitHub profile. | The artboard links are dead `#` links. |
| P3 | Career adds a third row "03 · ACADEMY", a normal selectable row (a tab like the other two) whose detail panel shows the school, degree and honours, the CGPA and extra lines, and a "SEE IT IN THE TROPHY ROOM →" link to `/trophies#academy` where the stack chips sit on the innings panels. Its role is `trainingAcademy.degreeShort` ("B.Tech IT") so the row stays on one line; the panel and the Trophy Room show the full degree. (Revised 2026-10-04: first built as a link row, which owners expected to select.) | §11.2 #13: the cricket game reveals the academy innings. |
| P4 | The CLUB tile shows "DEUTSCHE" (`player.clubShort`). | The tile is too narrow for the full club name. |
| P5 | Tablet (768-1199): Career = title, tiles, then scorecard and detail stacked; below 1024 the scorecard rows are the three-line card. Highlights = draw and replay in two columns, shot data below. Phone: single column, solid panels, 16px gutters, 48px title, full-width unskewed next-venue bar, bottom tab bar (ARENA / CAREER / PROJECTS / SKILLS / TEAM UP). COMM is hidden on the phone. Below 1024 the breadcrumb keeps only the hub and the current page; the middle crumbs stay in the page for assistive tech. | §12 derived designs. |
| P6 | Content stays at most 1440 wide and centred; the backdrop fills the edges. On short screens the page scrolls. | Fluid pages must not stretch or clip. |

Rules added in this phase:

| ID | Rule | Why |
|---|---|---|
| L1 | **Links open in the same tab, as drawn.** Only a document (the resume PDF) opens a new tab, and says so (`ui.a11y.newTab`, read by screen readers). | WCAG G201; one rule for the whole site. |
| L2 | The next-venue button never wraps or shrinks (`Button size="s"`): on the phone it is the full-width 54px bar (`type-btn-bar`); the commentary beside it shrinks first. | Longest label ("NEXT VENUE · BADMINTON HALL →", 270px at 17px) fits at 360px. |
| L3 | A feature never fits pixels by hand. The font's own line box is `leading="font"`, uppercase is `caps`, content-box header bars are `PanelHeader`, chip boxes are `Chip size`, a size that changes on the phone is a recipe with its own `@media`. `src/features/styleRules.test.ts` fails the build on `leading-*`, `tracking-[`, `box-content`, `uppercase` or a `type-*` behind a breakpoint prefix. | One mechanism per concern. |
| L4 | Each venue's glows come from its artboard (`ContentPage` presets for turf, court and hall); a page only names its venue. | The artboards draw different glows. |

Design-system changes:

| Change | Detail |
|---|---|
| New recipes | `type-title-detail` (40/.95), `type-title-reel` (44/.9, 34 on the phone), `type-draw-name` (24/800/.02em), `type-body-deck` (17, 16 on the phone), `type-body-cell` (14/1.5, the drawn problem / approach / result rhythm), `type-d5-fluid` (the content-page YS mark: 18px, 16 on the phone). |
| Recipes extended | `type-d1` has its drawn phone step (48/.9; it replaces a separate page-title recipe); `type-d3` steps to 30px on the phone (the scorecard number). |
| Recipes removed (duplicates) | `type-title-page` (= `d1`), `type-mono-nav-bold` (= `mono-nav` + `font-bold`, in `LinkRow`), `type-body-line` (= `body` + `leading="font"`), `type-body-kind` (= `caption` + `leading="font"`), `type-body-ball` (14/1.42 replaced by `type-body-sm` 14/1.45: 0.42px per line). |
| Chip | `size` is `sm` / `md` / `lg` / `meta` / `code`; `sm` and `md` are content-box (30px / 32px plus borders, as drawn). A new `text` axis: `label` (uppercase mono) or `name` (a tool name as written). The `stack` and `stack-sm` sizes are gone. `ChipList` takes a visible `heading` that names the list. |
| New components | `PanelHeader` (the 44px / 48px header bar), `SelectableList.LinkRow` and `selectableRowVariants` (added, then removed 2026-10-04 when the academy row became a normal tab, so nothing uses a link row). `Text` gains `leading` and `caps`. |
| Tokens | `--ref-volt-a06` (selected row, exact) and `--surface-tabbar` (exact), see §11.6. |
| StatTile | Glass and volt labels use `type-mono-round` (.18em, the artboard's), not `.2em`. |
| HUDButton | Base line box is the font's own (`leading-auto`): the artboard's text sits on it; REMATCH and QUICK VIEW were 1px high. |
| KeyValueList stacked | Label `type-mono-xs` (11/.14em), value `type-body-sm`, 12px between items. |
| Breadcrumb / MediaSlot | `hubLabel` and `label` are required (no English in the component). The captions track label and language come from `ui.pages.highlights.captions`. |

Deviations from the artboards (visual tests mask or accept exactly these):

| Where | Deviation | Check |
|---|---|---|
| Real routes: COMM line | Animates in and out. Masked by its own hook, `[data-commentary-bar]`. | `/career`, `/highlights` fidelity |
| Real `/career`: academy row (and its panel, when selected) | P3. Masked. | `/career` fidelity |
| Real `/highlights`: placeholder label | P1. Masked (`tabpanel p`). | `/highlights` fidelity |
| Real `/highlights`: draw row of the final, kind line | "Published research · PICT" in content, "Published research" on the artboard. Masked. | `/highlights` fidelity |
| Real `/highlights`: shot-data links area | P2. Masked rect `x 1120, y 605, 268 x 170`. | `/highlights` fidelity |
| Highlights, 1200 and up | The gap before the shot data is 22px like the other gap; the artboard's is 24px (its draw is content-box, so the 2px border is added to one side only). | Accepted if fidelity stays ≤ 2% (it was 0.02-0.08% with the margin) |
| Career detail balls | 14px at 1.45 (`type-body-sm`); the artboard draws 1.42. | Accepted if fidelity stays ≤ 2% (about 3px over the whole detail panel) |

### 11.9 Content pages: Attributes and Trophy Room (Phase 2B)

Rulings, as built:

| ID | Decision | Why |
|---|---|---|
| T1 | Trophy Room gets the "PLAYER CARD →" next button (§11.3). The cabinet and academy end 74px higher than drawn to make room. The artboard-copy story keeps the drawn layout and compares the whole board. | Every room has a way forward. |
| T2 | Shelf lines use the short artboard wording (`shortSub`); the ON THE PLINTH panel shows the full content wording. | The 290px shelf column fits one line only with the short form. |
| T3 | GIANT KILLER stays the dashed locked outline: a native `disabled` tab, named by its own title and shelf line ("Giant Killer, Hidden · beat Yash to unlock") and announced "unavailable". It carries no `aria-controls` (it has no panel) and no copy of its own in `ui`. The gold trophy comes in Phase 6. | One wording, from content (no `lockedHint` to drift). |
| T4 | New content fields `player.position`, `player.playingStyle`; languages and kit bag from content. | No hard-coded copy. |
| T5 (amended) | The portrait is copied once into `src/assets/` (hashed name). **It loads eagerly on the phone too**: it is above the fold there (about y 250-490 at 390x844), and lazy loading would delay the image a visitor sees first. Lazy only where a frame starts below the fold (`PortraitFrame.loading`; the Player Card chooses). Width and height are set, so there is no layout shift. | Amended after the Phase 2B review. |
| T6 | Phone: Attributes = profile, then the groups stacked; Trophy Room = trophies in a 2-column grid (80% art), a light bar between the rows, then the plinth panel and the academy. Tablet: Attributes profile above a 2x2 grid whose skill rows stay level when notes wrap (`SkillGroup alignRows`, subgrid, 768-1199 only); Trophy Room cabinet full width, detail and academy side by side below. | §12 derived designs. |
| R7 | `trainingAcademy.honoursShort` ("Distinction", optional; the selector falls back to `honours`) is the Trophy Room's meta line, which the 474px card shows on one line as drawn. `/career` and `/scout` keep the full honours; the pennant on the shelf already says "SPPU · B.TECH 2024". | Same pattern as R6 (`degreeShort`). |
| R8 | `getAcademy().name` drops only the exact suffix " (shortName)". | A different trailing parenthetical is real information. |
| H1 | After a client navigation to `/page#section`, focus goes to the section's heading (or the target itself when it has none); without a hash it goes to the page h1 as before (`RouteAnnouncer`). | The page has scrolled to the section, so the reading cursor and the next Tab start there. A cold load is handled by the browser. |

Design-system changes:

| Change | Detail |
|---|---|
| New recipes (kept) | `type-title-panel` (36/.95), `type-title-shelf` (20/.04em), `type-title-group` (32/.02em), `type-monogram`, `type-name` (Archivo 18/600), `type-mono-note` (11, untracked), `type-mono-run` (12/1.6). Each has no near-equivalent. |
| Recipes removed (duplicates) | `type-mono-shot` (= `type-mono-round`, identical on desktop; the phone step's .14em also helps the shot line fit), `type-position` (= `type-d2s`; the badge's top edge absorbs the 2.6px half-leading), `type-player-name` (= `type-d3`; the name is 30px on the phone like the scorecard number, not 34). |
| Moved out of the type scale | `type-glyph-lg/md/sm` are art lettering used only inside `Trophy`: now `trophy-glyph-lg/md/sm` scene utilities in `scene.css`, no longer `Text` variants or catalogued as typography. |
| New utilities | `scroll-mt-header` (`calc(var(--header-h) + 20px)`, shared by `FluidSection` and `AcademyCard`; the 128px wrapped-header offset stays in `FluidSection`), `scene-zoom-sm` (the phone's 80% scene pieces), `trophy-cup-shape` (the bowl radius, shared by the cup and the locked outline). |
| Scene | `Trophy` and `Spotlight` take `scale="art" \| "phone"` (phone: 80% below 768px, real layout size, trophies in a stage of one height). `ShelfLight` takes `placement="absolute" \| "row"`; as a row it is a grid item that follows the shelf above it. |
| Components | `SelectableList.Item` is one `cva` (`variant: row \| bare`); a `disabled` item has no `aria-controls`. `SkillGroup alignRows`. `KeyValueList variant="profile"`, `SkyGlow tone="venue"`, `SelectableList.Item variant="bare"` and `SkillGroup` stay (no near-equivalent). `AcademyCard` balances its aside and meta. |
| Gold | Defined only in `[data-zone="trophy"]`; `contrast.test.ts` covers gold, scout-grey, dim, text and volt on the cabinet gradient, on glass over the trophy ground and on the academy gradient. |

Deviations from the artboards (visual tests accept exactly these):

| Where | Deviation | Check |
|---|---|---|
| Real `/trophies` | T1 and the footer: shelf 2 and the academy's lower part move up 74px, and the bottom strip holds the button. The route compares four regions of the board, each at its own 2%: header and title (0,0,1440,236), shelf 1 (36,236,872,322), plinth panel (930,236,474,262) and the academy down to the real card's end (930,514,474,276). Nothing is masked; shelf 2 is proven by the artboard-copy story. | `/trophies` fidelity (`expectBoxesMatchArtboard`) |
| Real `/attributes` | The COMM line (masked by its hook). Content wording in the profile and skill notes. | `/attributes` fidelity |
| Attributes profile name | 34px at .95, drawn at 1.0 (`type-d3`). | Accepted: the story and route stay under 2% |

---

## 12. Derived designs (not in the artboards; built from existing components, flagged for Yash's review)

| Screen / state | Approach |
|---|---|
| Ticket gate (sound) | No separate screen. The landing CTAs act as the gate: ENTER THE ARENA unlocks audio, and the audio toggle sits in the HUD. |
| Mobile intro (2s) | Two floodlight banks flicker, scoreboard name boots, CTA appears |
| Tablet (768–1199) | Stage screens scale. Hub index rail moves into a drawer. Content pages use the 1200 layout reflowed to 2 columns. |
| Mobile Career, Highlights, Attributes, Trophy, Card, Team Up, Tennis, Badminton | Built from the Mobile-QuickView and Mobile-Game patterns: single column, solid panels, 16px gutter, bottom tab bar |
| Player Card back face | Section index (career, highlights, skills, trophies, contact) as ActionRows |
| Copy-link feedback | Button label swaps to "LINK COPIED ✓" for 2s, announced politely |
| Team Up submit | Form validates locally. If `VITE_FORM_ENDPOINT` is set (Formspree/Web3Forms-style), it POSTs there. Otherwise it opens the visitor's email app with subject and body prefilled from the chosen format. Success: COMM "Challenge received. I'll serve first.", floodlight pulse, scoreboard "NEW FIXTURE · VISITOR vs YASH". Error state shows "OR EMAIL" fallback. |
| Resume buttons | The phone-number PDF is **never shipped**. If `content.player.resumePdf` is `null`, buttons read "REQUEST RESUME" (mailto). When a public PDF is added to `public/`, the buttons automatically switch to View/Download. |
| Project media | `MediaSlot` shows the designed striped placeholder while `media` is `null`, and a muted video with controls when set. `media` is `{ src, poster?, captions?, silent }`: every URL is https or a root path; a silent screen recording needs no captions but is described by the project line and problem / approach / result (`aria-describedby`); a recording with sound must have `captions` (the schema rejects it otherwise). The captions track exists only when there are captions. |
| Locker Room `/locker-room` | "The making of the arena": thank-you headline, the visitor's record, how the site was built (stack, design system, the 1% maths), and a direct-line contact band. Locked state for visitors who haven't won. |
| Giant Killer trophy (unlocked) | Gold trophy replaces the dashed outline in the cabinet, with the "GIANT KILLER" plaque |
| 404 | "OUT OF BOUNDS": scoreboard panel with links to Hub and Quick View |
| Trophy descriptions 2–5 | Written from content data, in the dry commentary voice |

---

## 13. Assets

- Portrait cutout, `rest.webp` and 3 rig strips are copied into `public/` (or imported as assets). Strips are preloaded after first paint.
  - **Later upgrade:** swap the strips for a WebM-alpha / HEVC-alpha clip; same slot.
- `yash-portrait.webp` and `yash-portrait-cutout.png` (2.26MB, unused by artboards): the cutout is converted to WebP/AVIF at needed sizes for the OG image and Locker Room.
- `tools/rig.py` is kept for reference only. It isn't re-runnable as shipped (audit §10 #12).
- Fonts are self-hosted, trimmed to the weights in use: Big Shoulders 700/800/900, Archivo 400/500/600/700 + italic 400/500, JetBrains Mono 400/700. The display font is preloaded.

---

## 14. Risks

| Risk | Mitigation |
|---|---|
| Artboard renderer shim can't reproduce some boards | Fall back to side-by-side review by eye for those boards (§9.3) |
| Rig strips hurt the landing budget | Load them after first paint; poster frame first; measure in Phase 3 |
| Visual diff noise from font rendering differences | Same self-hosted fonts in references and app; fixed device scale factor; small anti-aliasing tolerance |
| Scaled stage text blurriness at odd scales | Scale via `transform` on a layer sized in px, with `translateZ(0)`; test at common laptop sizes in Phase 3 |
| Derived designs drift from the art direction | Built only from existing components and tokens; each flagged for Yash's review in its phase preview |

---

## Trivia: terms used in this spec

- **Pre-rendering / static HTML:** building each page's HTML ahead of time, so it shows instantly and works without JavaScript.
- **Hydration:** after static HTML loads, React "wakes it up" in the browser and attaches click handlers and state.
- **Design tokens:** named values (like `--volt`) used instead of raw colours or sizes everywhere. Change the token once, and the whole site updates.
- **Semantic token:** a token named by its *job* (`--text-primary`) rather than its *look* (`#F2F4F5`).
- **Breakpoint:** a screen width where the layout changes (e.g. below 768px = mobile layout).
- **cva (class-variance-authority):** a helper that maps props like `variant="primary"` to a fixed set of Tailwind classes, so the same classes aren't retyped.
- **Compound component:** a component made of named sub-parts used together, like `<ScoreBug><ScoreBug.Name/>…</ScoreBug>`.
- **Radix:** a library of unstyled components with correct keyboard and screen-reader behaviour built in. We add our own look.
- **requestAnimationFrame:** the browser's "call me before the next screen refresh" timer. Used for smooth, synced animation and game timing.
- **Live region (`aria-live`):** an invisible area whose text changes are read aloud by screen readers. That's how game reveals reach blind users.
- **Zod schema:** a description of what data should look like. Zod checks real data against it and reports exactly what's wrong.
- **Zustand:** a tiny state library. Here it holds the match record and saves it to the browser.
- **WCAG:** the Web Content Accessibility Guidelines, the standard rules for accessible websites.
- **FCP (First Contentful Paint):** the moment the first text or image appears on screen. Our budget is under 1.5s.
- **Safe area:** the part of a phone screen not covered by the notch or home bar.
