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
| **Zustand** (+ persist) | The visitor's match record ~~and achievements~~ (superseded, §11.14: no achievements any more), saved in the browser |
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
| ~~`/arena/giant-killer`~~ | ~~Easter egg (only reached after a win; direct visits show a "not yet earned" state)~~ (superseded, §11.14): the route is gone; `/arena/full-time` takes its place | ~~Cinematic~~ |
| `/arena/full-time` | Full Time: the matchday's last page (YOU 0 · 3 YASH, graded). Opened early, it reads "NOT YET." (§11.14) | Cinematic |
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
| Match record | `useMatchRecord()` | Zustand, saved to `localStorage` under a versioned key (`arena:v1`). Stores: venues played, last scores, sections seen, ~~the visitor's wins and losses, achievements, Locker Room unlocked~~ (the wins and losses, achievements and Locker Room flag are gone; the record now keeps venues, scores, sections seen, the best form per venue and Yash's wins, §11.14). If storage is blocked, everything still works; the record just isn't kept. Includes "reset my record". |

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
| **GSAP timelines** | Choreography: Player Intro, broadcast wipe, tunnel push, count-ups (900ms, tabular digits), ball/shuttle arcs, card tilt (`quickTo`), Hub idle sway | Each timeline is a **factory function**, e.g. `createIntroTimeline(refs, { tier })`, built from **labels and relative positions, not absolute seconds**. Desktop, tablet and mobile variants are the same timeline at different speeds or with tracks removed (fixes audit §10 #12). |
| **Sprite rig** | Intro head turn: 3 strips × 16 frames, plus `rest.webp` poster | Stepped ease, chained by timeline labels. Strips (~2.2MB) preload **only after landing text paints**. |

**Timing sources:** landing follows the Main artboard. The intro follows the Intro artboard and README §6 table (the newer source wins on conflicts; audit §7.2 #16–18). Intro lengths: desktop 6.5s (from 1200px), the column 3s (phones and tablets: lights + name; the README's 2s, slowed by the owner, D-6; D-7), reduced motion instant (§11.11).

**The landing boot is CSS, not GSAP** (§11.11 L3): `animate-boot-*` presets on the first paint, with `--d` per part and `--pace` for the return visit. It runs with JS off, costs no JavaScript and keeps nothing invisible focusable. GSAP is loaded lazily (`loadGsap`) and only the Intro, the wipe and the card tilt use it.

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
| Outcome | ~~On a visitor win: record it, unlock the Locker Room and the Giant Killer trophy, prefill Team Up with "I beat you.", and route to `/arena/giant-killer`. "Rematch" returns to the venue just played.~~ (superseded, §11.14): there is no visitor win. Every game ends as Yash's win and saves how close the visitor came; after all three venues the end leads to Full Time. "Rematch" still returns to the venue just played. |

~~**Win odds:** P(win) ≈ P(perfect on every input) × 12% luck ≈ 8% × 12% ≈ **1%**. A win always means the visitor really played perfectly.~~ (superseded, §11.14): the odds are 0. Owner decision, 2026-10-14.

### 8.1 Cricket: Bowl at Me (from the working prototype)

> **Phase 8 (2026-10-15):** cricket becomes a 3D game; see [`2026-10-15-phase-8-cricket-3d-design.md`](2026-10-15-phase-8-cricket-3d-design.md), which wins over this section and §11.13 for cricket. The rules below stay.

- 3 balls. The meter cursor ping-pongs every 1.1s.
- Zones: perfect = centre ±3.5%, good = ±12% on desktop; mobile ±5% / ±14%, as drawn.
- Balls 1–2: perfect → DOT, good → FOUR, miss → SIX.
- Ball 3: ~~if all three balls were perfect and luck < 0.12 → BOWLED HIM (visitor wins). Otherwise~~ perfect/good → FOUR, miss → SIX (superseded, §11.14): ball 3 is always a FOUR or a SIX.
- Reveals: innings 01 (current role), innings 02 (internship), innings 03 (PICT academy).
- Commentary lines verbatim from the prototype (audit §6.1).

### 8.2 Tennis: Return of Serve (rules designed from README)

> **Phase 8 (2026-10-16):** tennis becomes a 3D game; see [`2026-10-16-phase-8-tennis-3d-design.md`](2026-10-16-phase-8-tennis-3d-design.md), which wins over this section and §11.13 for tennis. The rules below stay as the 2D backup's rules.

- 3 serves. Before each serve, the open side is chosen randomly and shown as a subtle tell: a volt highlight on the open aim zone after a short delay.
- The visitor picks ← / → (click or swipe).
- Reaction window shrinks: 900ms, 700ms, 500ms (+25% on touch). The displayed serve speed rises: 178, 186, 194 km/h.
- Quality: correct side within the first 40% of the window = perfect; correct side in time = good; wrong side or too late = miss.
- Every serve reveals one project, in QF → SF → FINAL order, shown as a courtside card.
- Serve 3: Yash hits a winner that clips the line~~, unless all three returns were perfect and luck < 0.12~~ (superseded, §11.14): it always clips the line.

### 8.3 Badminton: Smash or Clear (rules designed from README)

> **Phase 8 (2026-10-22):** badminton becomes a 3D game; see [`2026-10-22-phase-8-badminton-3d-design.md`](2026-10-22-phase-8-badminton-3d-design.md), which wins over this section and §11.13 for badminton. The rules below stay as the 2D backup's rules.

- 4 rallies. Hold to charge the vertical power meter, release to play. Meter fills 8% → 86% over 1.4s and ping-pongs while held.
- Zones (top to bottom, as drawn): SMASH top 20%, CLEAR 20–60%, DROP bottom 40%.
- Rallies 1–3: any release plays the rally, and Yash wins the point. Score climbs to 20–19. Quality: a release inside a narrow "perfect weight" band (a 6%-tall band inside the DROP zone) counts as perfect.
- Rally 4 (match point at 20–19): ~~only a perfect-weight drop, after perfect rallies 1–3, plus luck < 0.12, gets through. Otherwise~~ Yash reads it (superseded, §11.14): the point always goes to Yash, 21–19.
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
| Journeys (Playwright) | Landing → Quick View; Landing → Intro → Hub → Cricket → reveals → Career; Skip on every game; ~~forced-win path → Giant Killer → Locker Room~~ (superseded, §11.14); the full matchday → Full Time → Team Up (also with storage blocked); `/scout` with JS disabled; reduced-motion path; keyboard-only path | End of each phase |
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
| 6 | ~~**Giant Killer + Locker Room + achievements**~~ | ~~Easter egg sequence, trophy unlock in cabinet, Team Up prefill, Locker Room page~~ | ~~Forced-win journey passes end to end~~ |
| 6 | **Full Time + cleanup** (superseded, §11.14) | Yash always wins, the matchday ends on Full Time (YOU 0 · 3 YASH, graded), the Hub's FULL TIME box, Team Up prefill, five trophies | Full-matchday journey passes end to end |
| 7 | ~~**Hardening**~~ (superseded, §11.15) | ~~Audio wiring, final perf pass, full a11y audit (keyboard + screen reader spot check), SEO (meta, OG image, sitemap, robots, canonical from env), 404, Vercel production deploy~~ | ~~All budgets green; Opus final review; Yash sign-off~~ |
| 7 | **Launch ready** (deploy deferred by owner decision 2026-10-14, §11.15) | Sound made in code, OUT OF BOUNDS (a real 404), production address from `VITE_SITE_URL` with canonical / `og:*` / sitemap / robots and a share image, a per-page CSP and host headers (`vercel.json`), phones gated at 80 in Lighthouse, axe and keyboard sweeps, a WebKit smoke, a screen-reader checklist and a wording review for Yash, CI prepared, the launch checklist (`docs/launch/README.md`) | All budgets green; Opus final review; Yash runs the screen-reader checklist and marks the copy review; **publishing waits for his separate "publish"** |

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
- ~~Tennis and Badminton wins route to Giant Killer. Its rematch goes to the venue just played.~~ (superseded, §11.14): there are no wins; the third game's end routes to Full Time.
- The Hub index adds Quick View, ~~plus Locker Room once unlocked~~ (superseded, §11.14): plus Full Time once all three venues are played.

### 11.4 Owner-requested design corrections

| ID | Where | Change | Source |
|---|---|---|---|
| D-1 | Main/Intro light cones | Beam top edge starts exactly under its floodlight lamp (artboard draws it offset) | Owner request 2026-10-04 |
| D-2 | Mobile-Landing and phone Intro (`ScreenColumn`'s backdrop) | The two floodlight banks hang 80px down (`top-20`, 22px tall: y 80 to 102), under the top row (it ends at y 60, gap 20) and over the board (which never starts above y 116, gap 14 at the least), where the artboard draws them at y 56 to 78 behind the YS mark and the SOUND chip | Owner request 2026-10-08 |
| D-3 | Mobile-Landing and phone Intro (`ScreenColumn`) | The board and the calls to action are one group: the challenge line (the Intro's WELCOME line) sits a fixed gap under the board, 40px below 768px and 56px from it (the artboard pins the buttons 40px above the foot of the screen, 156px under the board), and the whole group is centred under the top row (never nearer to it than 56px); a short phone scrolls | Owner request 2026-10-08 |
| D-4 | Landing below 1200px | The phone and tablet column plays the desktop's CSS boot on the same beats and pace (`LANDING_BEATS`, `--pace`; see L3 and L4 of §11.11); the artboard is a still | Owner request 2026-10-08 |
| D-5 | Intro stage (1200px and up) | The four floodlight banks keep the artboard's x (80, 380, mirrored; large outer, small inner) and hang lower, all at y 76 (the artboard: 34 large, 20 small), so every housing is under the HUD (its controls end at y 60) with 16px between (8.5px on a 768px tablet's scaled stage) and over the board with 16px. To make room the board starts 40px lower, y 136 (the artboard's 96), and ends where it did (y 638): 1242x502 outside, header and footer heights unchanged; the name, title, tagline, footer, WELCOME, the CTA and COMM stay where they are drawn, and the figure and its glow move down 40px with the board's top (the footer hides 40px of the shirt). The beams' boxes start at y 102 (the artboard's 60, i.e. 26px into the lamp as before) and end at y 860 as before, so each still starts under its lamp (D-1) | Owner request 2026-10-08 |
| D-6 | Column Intro (below 1200px) | Plays in about 3.0s, not the README's 2s: every mobile beat times 1.5, reveals at the board's own durations (tempo 1.0) | Owner request 2026-10-08 |
| D-7 | Intro on tablets (768 to 1199px) | The column Intro (the phone's, D-6) replaces the scaled stage show: the stage starts at 1200px, the timeline tiers split at 1200px, no head-turn frame is requested below it (the Landing's prefetch starts at 1200px); the column wears the tablet treatment (centred, `max-w-160`, one size step up) A tablet held wide (`squat:`, a theme variant: at least 768px across and under 63rem tall, e.g. 1024x768 and 1180x820) has no height for the stack, so the board's body lays the portrait (40% wide) beside the name block and the end state fits without scrolling, the CTA 24px above the foot; portrait tablets (768x1024) and phones keep the stack | Owner request 2026-10-08 |
| D-8 | Cricket-Play (`GameBackdrop` turf, stage) | The bowler's-end stumps stand on the pitch's centre line (x 698 to 741, centred on 720, under the far stumps), where the artboard draws them at x 596, left of the pitch's middle. The release ring, its label and the tracer stay where drawn. The cricket parity tests mask the box both places cover, `x 590–746, y 785–900` | Owner request 2026-10-09 |
| D-9 | Cricket column (Mobile-Game, below 1200px: `GameBackdrop` turf column and `CricketColumn`) | The batter's end stands on the pitch's centre line, x 195 of the 390 space and at every width (the parts are placed from the pitch's middle, never from the left edge). The far stumps (12px wide) are centred, x 189–201, where the board draws them at x 186–198, 3px left of its own centre; the Yash ring (46px with its border) is centred, x 172–218, where it is drawn at x 174–220; the `YASH · ON STRIKE` tag keeps its 2px gap and moves with it (x 220); the tracer's top end and the ball's last leg (`flight.ts`) end at x 195, where they are drawn ending at x 197. The length band was already centred. The Mobile-Game parity stays under the 2% limit without a mask (1.2%) | Owner request 2026-10-09 |
| D-10 | Cricket (the stadium screen's reveals, stage and column) and Career Stats | Owner change 2026-10-16: career shown oldest first (academy → internship → current role) in the cricket game and on Career Stats. Cricket: ball 1 opens the academy as innings 01, ball 2 the internship (02), ball 3 the current role (03); with a third role later, the academy then the two most recent roles, oldest first. Career Stats lists the academy (01), the internship (02) and the current role (03), and still opens on the current role. The artboards draw the current role first, so the parity tests mask the three scorecard rows (Cricket-Career) and the reveal chip's title and meta (Mobile-Game story); the fresh Cricket-Play board is unchanged. One order, `getCareerTimeline` / `getInningsReveals` in `selectors.ts` | Owner request 2026-10-16 |

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
| T3 | ~~GIANT KILLER stays the dashed locked outline: a native `disabled` tab, named by its own title and shelf line ("Giant Killer, Hidden · beat Yash to unlock") and announced "unavailable". It carries no `aria-controls` (it has no panel) and no copy of its own in `ui`. The gold trophy comes in Phase 6.~~ (superseded, §11.14): there is no Giant Killer trophy and no locked outline; the cabinet holds five. | One wording, from content (no `lockedHint` to drift). |
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

### 11.10 Player Card and Team Up (Phase 2C)

Rulings, as built:

| ID | Decision | Why |
|---|---|---|
| C1 | While `player.resumePdf` is `null` the volt action row is **REQUEST RESUME** (mailto) and the DOWNLOAD PDF row is not drawn. Both PDF rows appear on their own once a public PDF is set (View opens a new tab and says so; Download downloads). The private PDF is never linked. | A dead download row looks broken; the phone-number PDF never ships (§12). |
| C2 | The card's back is a derived section index (Career, Highlights, Attributes, Trophy Room, Team Up), then the player's address as a mail link, under the same foot line. | §12 derived design; the address fills the back (fix wave M15) using only existing content. |
| C3 | The card is two faces, each with its own full-face flip button under its content, so the back's links are never inside a button. The button is named for where it flips to ("Flip card: show the back" / "…the front") and is **not** a toggle: no `aria-pressed` (a toggle's name must not change with its state; fix wave M1, owner ruling follows the APG). Fine pointer only tilts (max 6 deg, lifted 8px); a drag never flips, including a drag that leaves the card and returns with the button held (M2). Reduced motion: no float, sheen or tilt, faces swap instantly. | A8: no global keys; the card is a normal button. |
| C4 | SEASON shows the **build** year in the HTML and the visitor's own year after mount. The build year is injected by Vite `define` (`__BUILD_YEAR__`, `vite.define.ts`, read as `BUILD_YEAR` from `shell/config.ts`) so the client bundle and the prerendered HTML agree whatever the visitor's year; a unit test hydrates the prerendered page with a clock one year ahead and expects no recoverable error. "Pro debut" shows the long month. | Spec §11.2 #12; the earlier module-scope `new Date()` mismatched on every visit after 1 January. |
| C5 | Team Up sends through the form service when `VITE_FORM_ENDPOINT` is an https URL (JSON POST, Formspree-compatible; the honeypot field is named `_gotcha` and is hidden from sight, the tab order and the accessibility tree). Without one it opens the visitor's email app, pre-filled. Web3Forms-style services that need an `access_key` in the body are not supported as is. | Nothing to set up today; works the moment an endpoint is added. |
| C6 | Success (the service answered 2xx, or the honeypot was filled and the send is quietly dropped): the form is replaced by the CHALLENGE RECEIVED panel, focus goes to its heading, the floodlights pulse once (reduced motion: none), SEND ANOTHER starts an empty form. A failed send keeps the visitor's text and shows the error with the OR EMAIL link. | §12 derived design. |
| C7 | The AFTER YOU SEND preview box stays on Team Up as drawn. | As drawn. |
| C8 | Phone: single column; Team Up marks its tab current, Player Card none. Player Card = title, card, actions, profile. Tablet: profile and card side by side, actions below; Team Up = form full width, direct lines below in two columns. | §12 derived. |
| P1 | **Phone card without zoom.** Below `md` the card is as wide as the gutters allow (never wider than the drawn 402px) at the drawn 402:642 proportions; the portrait frame gives up height (the head shot shrinks to fit, whole), the stat cells stack label over value, and every label stays at 11px or more (A2). The earlier CSS-`zoom` fit (`card-fit`) took the labels to 7.7-9.4px on common phones and is removed. Desktop is unchanged. | A2 holds on the card too; a floor that a zoom silently overrides is not a floor. |
| P2 | **The email path is not a success.** With no endpoint, opening the mail app only asks the OS; the visitor still has to press send there. So `mailto` has its own state: the form and every word stay, a polite status says `YOUR EMAIL APP SHOULD OPEN WITH THE MESSAGE READY. PRESS SEND THERE.`, the OR EMAIL link stays, and a `COPY MESSAGE` button (`MESSAGE COPIED ✓` for 2s, announced) copies the whole message, falling back to a selected read-only field if the clipboard refuses. New copy: `ui.pages.teamUp.mailto { note, copy, copied }`. | Telling visitors "Challenge received" when nothing was sent, and clearing their text on SEND ANOTHER, loses messages. |
| P3 | The copy-link row's "copied" line is visual only (the row is not a live region); a separate polite status announces it. When the clipboard refuses, the focus move to the selected, labelled field is the announcement (the status stays quiet). | One announcement, no stray re-reads when the row returns to its sub-line. |
| P4 | Content: each `cardStats` entry has an `id`; Team Up and the scouting report read the problems count by `id: "problems"`, not by the printed label. The closing "." of the AFTER YOU SEND line is copy (`ui.glyph.period`). | A renamed label must not break the build; no visible copy in components. |
| P5 | `ContentLayout` takes one `columns` prop: `{ kind: "showcase", stage, caption?, rail? }` or `{ kind: "split", side }`. The title, panels and body render once with a `cva` per kind; the stage, rail and caption offsets live in the layout (a page passes plain nodes); `lg:` and `xl:` replace the arbitrary 1200 and 1440 breakpoints in the new code. | No repeated branches; offsets in a feature are pixel fitting the style guard cannot see. |

Design-system changes:

| Change | Detail |
|---|---|
| New tokens | `--ref-card-end` / `card-end`, `--rgb-sheen`, `volt-a07`, `--perspective-card` (1400px), `--perspective-floor` (700px, the showcase floor). |
| New motion | `animate-card-float`, `animate-sheen` (rests on its first frame, so a paused or cancelled animation shows no band), `animate-floodlight-pulse`; `card-sheen`, `scene-centre-glow`, `scene-floor` utilities. |
| New recipes (kept, 7) | `type-d0` (96/.85), `type-body-intro` (20/1.45), `type-btn-lg` (24/900/.14em), `type-card-position` (64/.85), `type-card-name` (52/.9/.02em), `type-action-lg` (24/.1em), `type-action` (20/800/.1em; also the direct lines' titles). |
| Recipes merged away | `type-mono-line` into `type-mono-date`, `type-channel` into `type-action` (.02em less tracking, about 5px across the longest title), `type-caption-copy` into `type-caption` (1.45 for 1.5), `type-mono-inline` into `type-mono-code` (the paragraph's own recipe sets the rhythm), `type-body-note` into `type-body-cell` (1.5 for 1.6). Nothing uses the removed names. |
| Components | `PlayerCard` (+ `Header`, `Portrait`, `Name`, `Stats`, `Contact`, `Footer`), `ActionRow`, `ChannelCard`, `DashedPanel`, `ShowcaseBackdrop`, `useTilt`; `StatTile tone="cell"` (stacked on the phone), `PageTitle size/lede`, `Button size="ml"` (the 62px body with the 24px label; named by scale), `ContentLayout columns`. Shared hook `lib/useCopyText` (copied, fallback, 2s). |
| ActionRow | `status` is visual only; the consumer owns the announcement. |

Deviations from the artboards (visual tests accept exactly these):

| Where | Deviation | Check |
|---|---|---|
| Card story and route | Labels are 11px, not the drawn 10px (A2); the stat cells' gap and the glass rows' 66px (the artboard's COPY row is a 64px button) shift a few pixels. | Card story and route fidelity |
| Card story | COMM only (fixed area `{24,812,392,60}`: the line animates on and off air). | Card story fidelity |
| Real `/card` | COMM; the actions column from the first row down (`{984,262,420,404}`; C1: the real page has the request row and the copy row only, so the note below rises); SEASON only when the visitor's year is not 2026. | `/card` fidelity |
| Real `/team-up` | None: the real content equals the board's words and the page has no commentary on arrival. | `/team-up` fidelity |
| Team Up's `mailto` state | New (P2); not on the artboard. | `MailtoOpened` story, e2e |

### 11.11 Landing and Player Intro (Phase 3)

Rulings, as built (L1 to L14 of the Phase 3 plan; owner rulings of 2026-10-07 are marked):

| ID | Decision | Why |
|---|---|---|
| L1 | **Tablet (768 to 1199px).** The **Landing** uses the phone column, centred and wider (`max-w-160`, one size step up; below 1200px the board and the CTAs are one group, the challenge line a fixed gap under the board (40px phone, 56px from `md`, D-3) and the group centred under the top row, and the two banks hang over the column's edges, 80px down, clear of the top row, D-2). The Stage of the Landing starts at `lg` (1200px). **Tablets get the column Intro too** (owner, 2026-10-08, D-7, reversing the 2026-10-07 ruling that gave tablets the scaled stage): below 1200px `/intro` is the 3s column (L6, D-6; `ScreenColumn until="lg"`, centred, `max-w-160`, one size step up), the stage shows from 1200px (`Stage from="lg"`), and the timeline's tiers are `(min-width: 1200px)` and `(max-width: 1199px)`; the rig loads only on the stage tier, and the Landing's strip prefetch starts at 1200px, so a tablet never requests a head-turn frame. | A scaled landing at 1024px draws the 11px labels at about 7.8px; the owner prefers the phone intro on tablets. |
| L2 | **Laptop and tablet Stage scales.** `[data-stage]` sets `--stage-mono-min` (11px / scale) and `--stage-body-min` (14px / scale). All 22 mono recipes of 13px or less and `type-mono-lg` (14px) read `max(Npx, var(--stage-mono-min))`; `type-comm` (16px, the only body recipe of 16px or less drawn in a stage) reads `max(16px, var(--stage-body-min))`. At 1440x900 nothing changes (12px and 11px mono stay, COMM stays 16px). Measured: COMM is 16px at 1440x900 and at least 14px rendered at 1280x720, 1024x768 and 768x1024. | A2 holds on every desktop and tablet, not only at 1440x900. |
| L3 | **The Landing boot is CSS** (see §7). | First paint, JS off, no JavaScript cost. |
| L4 | **Return visit.** `arena:landing-seen` is saved when the Landing mounts; a head script (`HEAD_FLAGS_SCRIPT`) puts `data-return-visit` on `<html>` before paint, and the Landing's own `pace.css` (`:root[data-return-visit] { --pace: .25 }`) drops `--pace` from 1 to .25 (CTA entrance ends in 1.35s, at most 1.6s). The design system only knows `--pace` (default 1); `landingPace()` reads the computed value, so .25 is written once. Coming back to `/` in the same session also takes the short boot (a module flag set when the entrance line fires). No ticket gate: ENTER THE ARENA unlocks sound. | Opening board: "RETURN VISIT, 1.5s cut-down". |
| L5 | **Phone Landing as drawn, except where the owner changed it (D-2 to D-4):** SOUND toggle, no COMM, no keyboard hint, no SKIP INTRO; it plays the desktop's CSS boot (the artboard is a still), with the lights 80px down and the board and the CTAs one centred group (the artboard pins the CTAs to the foot). **Phones start with sound on** (owner): the toggle is `aria-pressed`, reads SOUND ON where the board draws SOUND OFF; the state word is masked. | Owner ruling over the README matrix; the audio provider is unchanged. |
| L6 | **Phone and tablet Intro, below 1200px (derived; no artboard):** the compact board with the header `LIVE · PLAYER INTRODUCTION` and `01 / 01`, the rest-pose portrait, the name locking in letter by letter (same 10 letters as the stage), SOFTWARE ENGINEER, the tagline, a two-cell footer (RECORD, STATUS), WELCOME TO MY ARENA, a full-width ENTER THE ARENA. REPLAY and SKIP INTRO in the top row (44px). Same timeline factory, tier `mobile`, tempo 1.0. **About 3.0s** (D-6: the README's 2s, every beat times 1.5, reveals at the board's own durations; timeline duration 3.000s, `done` within 3.2s at 390x844, 375x667 and 360x640). The banks sit 80px down and the welcome line is 40px under the board (D-2, D-3). The end state fits 390x844 and 375x812 without scrolling, the CTA 16px or more above the bottom (the board body's padding is 16px, the portrait 60% of the board's width; smaller phones scroll). | README matrix; §12 "Mobile intro (2s)". |
| L7 | **Slow connection.** The desktop tier loads the three strips (`loadRig`, 3.35s cap; the root's `data-sprites` reads `ready`, `timeout` or `error` once known). The silhouette is the rest pose: it is shown with the mover from the entrance (under strip A) and the two ghosts draw it too, so the swing-in, the lights and the impact never wait on a strip. Only the head turn waits: it is a child timeline placed at the performance beat. If the strips are ready by the beat it plays as placed and the rest pose steps aside. If they are not known yet it waits up to 1.5s (`RIG_WAIT_MS`) while the rest of the show (scan bar, trails, ghosts, name, title, tagline, CTA) keeps running, and plays from its first frame, late, if they arrive in time. If they time out or fail, the head turn never plays: the strips stay hidden and the rest pose stays. The decision is made once and kept for replays. The show is 6.5s whatever the rig does. The Landing warms the strips after load and an idle callback, only at 1200px and up, never under reduced motion or `saveData`; the strips are `SpriteStrip deferred`, so with JS off, reduced motion, a phone or a tablet no `turn_*.webp` is ever requested. | Spec §7 / §13 / §14. |
| L8 | **SKIP INTRO** goes to `/arena`; **REPLAY** restarts from the dark stadium (five quick presses give exactly one more `done`) and is hidden under reduced motion. The Intro never auto-advances. | Audit §6.5. |
| L9 | **Shortcuts.** Landing at 1200px and up: `Enter` is ENTER THE ARENA, `Q` is Quick View. Ignored with Ctrl, Alt or Cmd, key repeat, `defaultPrevented`, and while focus is on a link, button, field, select, tab or contenteditable. Active only while the Landing is mounted. | A8; WCAG 2.1.4. |
| L10 | **SOFTWARE ENGINEER keeps its .42em tracking** (the boot settles on the recipe's own tracking, 12.6px at 30px). The Main reference's collapsed end state is masked. | Intent over a keyframe accident (audit risk #11). |
| L11 | **Commentary is silent below 768px**, for screen readers too (`say()` returns early). From 768px the line is said as before on screens that draw a slot; on a tablet the Landing's slot is inside the hidden Stage, and the Intro's column plays its own cut without saying a line (its beat does not call `say`), so nothing is announced that is not on screen. | Spec §4.6; screen readers hear what is on screen. |
| L12 | **Dust** in the beams: one canvas, 60 specks, 1 to 2px at 15%, inside the two cones (`CONE_REGIONS`; on the Intro they follow the D-5 cone boxes); runs only at 1200px and up, not under reduced motion, paused when the tab is hidden; cancelled and unlistened on unmount. On **both** the Landing and the Intro the canvas takes the backdrop's fade with the left cone's beat (the Landing's boot at 1.0s, the Intro's `coneL`), so it never shows in a dark stadium; the phone column has none. | README §6 + Opening F2; §7 dust rule. |
| L13 | **Lighthouse** (`tools/lighthouse.mjs`, page-driven): `/` gates FCP at most 1500ms, CLS at most .1, accessibility 100, best practices at least .9, SEO at least .9, and performance at least .9 in the **reduced-motion run** (`--force-prefers-reduced-motion`); the full-motion performance is reported. `/intro` gates accessibility 100, best practices and SEO at least .9 (performance reported). `/scout` keeps its gate. Mobile runs are reported. Results below. | Spec §9.1; the designed 3s name reveal is the largest paint by design. |
| L14 | **Animated properties.** The board power-up, impact ring and bank flare are separate glow layers whose opacity animates (`shadow-board-on`, `shadow-board-hit`, `shadow-bank-flare`), not `box-shadow`. Transform, opacity, `filter` blur (the swing-in only, cleared when it lands) and the 0.32s `clip-path` glitch are the only others. The silhouette's backlit look is a separate layer (`intro-shade`: a dark, desaturated copy of the rest pose with a volt rim; its filter is static) over the lit figure, and its opacity fades 1 to 0 over 0.8s; no filter is animated, and none is left on the figure or its ancestors at the end. The face sweep moves a gradient band by `transform: translateX` inside the masked layer (opacity and transform only). The head-turn strips step through frames with `background-position` while the head turn plays. | §7 performance rules. |

Design-system changes:

| Change | Detail |
|---|---|
| Stage | `from?: "md" \| "lg" \| null` replaces `desktopOnly` (default `md`; the Landing passes `lg`, the Intro `md`). `skyClassName` / `skyStyle` for the letterbox sky (`data-part="letterbox-sky"`), so it boots and fades with the rest. `--stage-mono-min` and `--stage-body-min` (L2). |
| Motion lib | `loadGsap()` (memoised dynamic import, a failed load retries), `prefetchGsap()` (idle, skipped under reduced motion), `bezier()`, `EASE` (six eases mirroring `theme.css`; a test parses the CSS). No static `gsap` import: the GSAP chunk is in no first-load graph (smoke test walks `/`, `/scout`, `/intro`). `useTilt` loads it the same way. |
| Shell and lib | `HEAD_FLAGS_SCRIPT` + `LANDING_SEEN_KEY` (`.js` class and `data-return-visit`), `useScreenShortcuts`, `lib/useMediaQuery`, commentary silent below 768px. `src/features/landing-preview` is deleted; `landing` replaces it. `<html>` takes `suppressHydrationWarning` (the two head scripts set its attributes before React runs). `lib/breakpoints` (`BREAKPOINT`, `MEDIA`: the theme's `md` and `lg` as media queries, one source for commentary, the rig prefetch, the intro tiers, the Landing shortcuts and the dust; a test reads `theme.css`); `lib/seeded` (the artboards' LCG for the letters and the 90 pixels); `assets/rig` (`RIG_STRIPS`, the one list of the three strips). |
| ArenaBackdrop | `layout="landing" \| "intro" \| "column"` from one per-layout table (frame, sky, venue glow, crowd shape, field, pitch, cones, masts, banks, flare). `column` is the phone and tablet frame: sky and venue glow, a flat crowd band and two `mobile` banks (`bank-1`, `bank-2`, 80px down, D-2) hung in a `max-w-160` box; only its banks take `layerClassName`. With `boot` its sky, venue glow (`data-part="venue"`, on the field's beat) and crowd fade in on the stage's beats and its banks flicker at `boot.banks[0]` and `[1]` (D-4); without one the washes are plain. The Intro layout's banks hang at y 76 (D-5) and its cone boxes start at y 102. `boot?: BootBeats` (each layer gets `animate-boot-fade` and its `--d`, banks flicker at `boot.banks[i]`; omitted means the stands are lit); `dust` (fades with the left cone like the cones, on both stage layouts); `layerClassName` (the Intro's `hold-part` hold); `data-part` on every layer a page addresses. |
| Cones | `cones.ts` is the single source: `CONE_BOXES`, `LAMP_SPANS`, `apexOf` (D-1 as code), `CONE_APEX`, `CONE_REGIONS`; a test parses `scene.css` and the rendered classes against it. Intro apexes: left 7.4074% to 28.1481%, right 71.8519% to 92.5926% (cone boxes y 102 to 860, D-5). |
| Scoreboard | `size="landing" \| "intro" \| "compact"`; `Scan variant="band" \| "bar"`; `Power` (the `board-on` / `board-hit` glow layers, a sibling of the board because the board clips); parts take `style` and `data-part`. Compact: header 39 and footer 49 (content-box rules, as Main's 53 / 71), `shadow-board-compact`, title `w-min`. `FooterCells cells={ScoreboardCell[]}` fills a footer from a view's data (replaces four hand mappings); `Header hideEndBelow="xs"` drops the last cell below the `xs` breakpoint (368px; a 360px phone has no room for it). |
| Scene | `FloodlightBank` is a bulb preset (`lg`, `sm`, `mini`, `mobile`: radii, grid, glow) in a housing (width and height); `flat` lowers the large and small housing for the Intro (112x44, 84x32) and copies no bulb string; `flare`. `CrowdTier shape="stand" \| "curved" \| "flat"` (flat = `scene-crowd-flat`, the board's 6x5 dot grid; replaces the `curved` and `flat` booleans). `SceneLayerProps` (`data-part`, `className`, `style`) is the one props type of every scene layer (and `GlowLayerProps` of the two glows). `Field ovalClassName`; `SpriteStrip` (+ `deferred`; `lib/sprite.ts`); `Dust` (`data-part`, `style`). |
| Boot and intro CSS | Boot presets `animate-boot-fade`, `-rise`, `-name`, `-scan` on `--d` x `--pace` (they reuse `fade-in` / `rise-in`; every entrance's first frame is `visibility: hidden` so nothing hidden is focusable, except `boot-name`, which starts at opacity 0 only so the heading can take focus on arrival); one `bank-flicker`; `hold-part` (hidden while an ancestor says `data-hold="pending"` and the page has JS, 8s fallback `hold-fallback` to visible, visible under reduced motion; the contract is generic: the page puts `data-hold` = pending, playing, done on a root and the design system knows nothing of the Intro); idle loops `animate-breathe`, `animate-face-sweep` (opacity on the masked layer plus a `::before` band moved by `translateX`), `animate-cta-glow` (off under reduced motion); `intro-shade` (the static backlit copy whose opacity fades), `intro-letter` (`data-lit` in / glow / done), `intro-turn` (hidden by default, visible once `data-hold` is anything but `pending`; its image comes from `--sprite` only while an ancestor carries `data-sprites`, which the page sets when it chooses to play the head turn; a timeline's inline `autoAlpha` has the last word), `intro-cta`, `intro-ghost-*`, `intro-streak`, `intro-glint`, `intro-led-grid`, `intro-scanlines`, `intro-edge-mask`, `intro-backlight`, `intro-pixel-*`, `intro-flash`, `scene-bank-flare`, `scene-scan-band` / `-bar`. `--pace` is 1 in `motion.css`; the Landing's `features/landing/pace.css` sets .25 for a return visit. |
| New type recipes (8) | `type-hero-sm` (132/.85), `type-hero-stack` (96, 120 from `md`), `type-sub-lg` (34/.4em), `type-sub-sm` (18, 22 from `md`), `type-score-md` (22/.08em), `type-btn-bar-lg` (22/900/.14em), `type-btn-2xl` (28/900/.14em), `type-welcome` (60/.9/.06em, 32 on phones). |
| Recipe faces | A family that differs only by size shares one face, defined once in `base.css` as a `face-*` utility and applied (`@apply`) by each sized recipe, so a size recipe is its size (and the leading or tracking that is its own). `face-btn` (display 800, line-height 1, .14em, caps) and `face-btn-heavy` (the same at 900) for `type-btn` / `-xl` and `type-btn-heavy` / `-bar-lg` / `-lg` / `-2xl`; `face-hero` (900, .02em) for `type-hero` / `-hero-sm`; `face-score` (800, line-height 1, .08em, tabular) for `type-score-lg` / `-md`; `face-sub` (700) for `type-sub` / `-lg` / `-sm`. `type-welcome` is `type-d2` plus .06em and a 32px step below `md`. A face has no size and is never used in markup (`catalog.test.ts`); `cn()` still treats every sized `type-*` as one conflict group (`cn.test.ts`). **Why a size could not reuse its neighbour:** the button sizes are each fitted to their own button (44px HUD to 74px 2xl); `type-btn-bar` (17px) tracks .12em, not the face's .14em, to hold its bar; `type-btn-xl` and `type-btn` are 800 where the heavy sizes are 900; `type-hero-stack` (centred, untracked, steps to 120px) and `-fluid` (clamp, .01em) differ in tracking and wrap, not only size; `type-hero` and `-sm` also differ in leading (.86, .85); `type-score-num` is untracked (it inherits its parent's tracking, which a tracked face cannot be switched back to) and `type-score` is 20px with .06em and no tabular figures; `type-sub`, `-lg` and `-sm` each carry their own size, leading and tracking (30/1/.42em, 34/normal/.4em, 18-22/normal/.38em), which are the three boards'. |
| Components | `Button size="bar-lg"` (h-16, full width) and `"2xl"` (340x74); `AudioToggle variant="text"`; `HUDButton tone="glass-compact"` (the compact chip is the `hud-chip` utility, once; `glass-line` wears it as `max-md:hud-chip`); `ScreenColumn` (slots `top` (`data-part="top"`), `children`, `actions`; `until="md" \| "lg"`: the min-h-dvh flex column, 16px gutters, 640px centred; content and actions one group, the actions 40px (56px from `md`) under the content, the group vertically centred under the top row and never nearer to it than 56px, 24px under the group at the least, D-2 and D-3; a 1024x768 or 1180x820 tablet fits without scrolling) shared by `LandingColumn` and `IntroColumn`; in `features/intro`, `IntroName` (`stacked`), `IntroTitle`, `IntroTagline` (`variant`), `IntroControls`, `IntroWelcome`, `IntroEnter` (`IntroParts.tsx`) and `IntroFigure`, shared by the stage and the column. |
| New tokens | `--rgb-ember` (255 178 92), `--rgb-backlight` (255 150 60), `--rgb-board` (6 8 11), `bg-ember`; shadows `shadow-board-compact`, `-board-on`, `-board-hit`, `-bank-flare`, and the volt glows by strength `shadow-glow-volt-sm` (10px), `-md` (16px), `-lg` (30px) (the trail's 14px glow took `-md`); `blur-soft` (2px); breakpoint `xs` (368px); `--pace`. ESLint's `RAW_STYLE_LITERALS` also rejects arbitrary `shadow-[…]`, `blur-[…]` and `drop-shadow-[…]` (`tools/eslintRules.test.ts` lints a sample to prove it). |
| Copy | `ui.landing.*` (incl. `enterSubPhone`, `playerShort`), `ui.audio.labelPhone`, `ui.intro.*`, `ui.glyph.bullet`; `ui.record` is `{ label, value, career }`. |

Deviations from the artboards (visual tests accept exactly these):

| Where | Deviation | Check |
|---|---|---|
| Main (route and artboard-copy story) | SOFTWARE ENGINEER box `{560,368,320,52}` (L10). | Both parity tests |
| Main (route and story) | D-1 wedges `{106,120,78,142}` and `{1255,120,80,151}` (§11.4). | Both |
| Main (route and story) | COMM `{30,815,400,60}`: the line animates in (the story has none, Main draws one). | Both |
| Main | The crowd ends at opacity 1 (Main's `.fade` end frame) where the static landing drew .7; the unmasked difference is inside the 2%. | Both |
| Mobile-Landing (route and story) | D-2, D-3: the page is not compared whole. Three boxes of the artboard (390x844), each at most 2%: `topRow` `{0,0,390,60}` where it is; `board` `{16,130,358,331}` and `actions` (the challenge line and both buttons) `{16,618,358,186}`, each cut out of the page at its own new place (measured at the boot's last frame) and compared with the artboard's box at the old one (`tests/support/mobileLanding.ts`, `placements` in `tests/support/visual.ts`). Page places at 390x844: board `{16,181,358,331}` and actions `{16,553,358,186}` (centred; the challenge line is 40px under the board). | Both |
| Mobile-Landing | D-2 (lights): the `topRow` box masks the lights' old and new housings with 20px of glow: `{10,36,100,62}`, `{280,36,100,62}` (old, y 56 to 78) and `{10,60,100,62}`, `{280,60,100,62}` (new, y 80 to 102). With a 30px pad the band differs by 0.03%. | Both |
| Mobile-Landing (route and story) | A2: the board's 10px labels are 11px. Six boxes, each the text span's own box: `LIVE · THE ARENA`, `01 / 01`, `STATUS`, `AWAY` (inside `board`), `LITE · ONE-THUMB GAMES`, `RECRUITER VIEW · 90 SEC` (inside `actions`). | Both |
| Mobile-Landing | L5: the toggle's state word only (ON on the page, OFF on the board), inside `topRow`. | Both |
| Intro (route and story) | COMM `{30,815,400,60}`. | Both |
| Intro (route and story) | D-5 (§11.4): the banks, the board's top and the figure moved. Eight boxes (`tests/support/introLights.ts`): the band above the board around the HUD's controls `{0,0,1440,16}`, `{76,16,1104,44}`, `{0,16,36,44}`, `{1404,16,36,44}` and `{0,60,1440,140}` (from the HUD's foot to the old header's foot; it holds the old and new banks, their glow, the beams' tops and both headers); the artboard's right bank seen through SKIP INTRO `{1248,34,112,26}`; the figure's old place, head `{920,150,220,270}` and shoulders `{750,410,545,170}`. The HUD's other boxes, the name, title, tagline, footer, WELCOME and the CTA are compared. Never the name, WELCOME or the CTA. | Both |
| Intro | The CTA keeps the design system's skewed primary button; the artboard's end frame is square because its `rise` keyframe (fill both, `transform: none`) overrides the `skewX(-12deg)`. About 0.2% of the pixels, unmasked. | Both |
| Intro | The board outer box is 1242x502 from y 136 (D-5; the artboard sizes the content box and starts at y 96, 1242x542). The board's unlit start is not drawn (opacity layers only fade in); the artboard's title bar, drawn from t=0, shows from the title beat; the 90 pixels end hidden. | Intro tests |
| Intro | Field uses `scene-field` (turf .75 / .55 and faint stripes) where the artboard draws .7 / .5 and none; the crowd shares `scene-crowd`'s mask (30 / 55 / 90%) where the artboard draws 30 / 60 / 95%. | Intro tests |
| Phone Intro (derived) | No board: the portrait is a plain decorative `<img alt="">` (the h1 under it names him; it costs no extra request, the stage's `rest` img is the same file); `01 / 01` is hidden below 368px (the header cannot hold both); the compact board has no power ring (its own 5px bezel is the lit edge); the title bar travels the title's own width; commentary does nothing; the banks still play the floodlight sound. | `intro.spec.ts` phone block |
| Every board | A2: 11px labels where 10px is drawn. | The masks above |

Token merges that moved a value by more than ~2% (extends §11.6):

| Artboard value | Token used | Where |
|---|---|---|
| Intro flare halo `rgb(220 232 250)` | `--rgb-beam` (225 236 250) | Bank flare |
| Face-sweep highlight `rgba(255,250,235,.38)` | white at .38 (2% on blue) | `animate-face-sweep` |
| Name glow 20px .30 / 24px .30 | `glow-led` (28px .35) | Compact and Intro names |
| Compact board border `#232A33` | `line-strong` (`#2A323C`; see §11.6) | Compact scoreboard |
| Compact footer values untracked | `type-d5` (.08em) | Compact footer |
| Intro field turf .7 / .5, no stripes | `scene-field` .75 / .55 + 3.5% stripes (about .05 alpha on the green centre) | Intro backdrop |
| Intro crowd mask 30 / 60 / 95% | `scene-crowd` 30 / 55 / 90% (opacity .6 exact) | Intro backdrop |
| Intro flare as a replacement shadow | a separate glow layer over the bank's own shadow (L14), so the peak is the sum | Intro banks |
| Intro board power-up/hit `box-shadow` | opacity of `shadow-board-on` / `-hit` layers without the 50px / 140px drop shadow | Intro board |
| Phone `type-sub-sm` md step | 22px (derived, no tablet board exists) | Compact subtitle |

Measured:
- Visual ratios (2% limit): Main route .0076, story .0112 (unchanged by D-2 to D-6); Mobile-Landing by box (route, 390x844) top row .0065, board .0113, actions .0140; Intro route .0018 (.18%, with the D-5 masks and the commentary mask).
- Intro lengths: desktop 6.5s (labels per `INTRO_BEATS`), slow or failed rig about 8.0s, phone 3.0s (D-6).
- Landing boot, checked on screenshots: dark at 0.7s, banks lit by 1.8s, header and field by 2.9s, complete at 6.2s; the return visit's CTA entrance ends at 1.35s.
- The factory has 76 unit tests (labels and lengths per tier, rig gate, letters, pixels, end-state parity).

Lighthouse (production build served by `tools/lighthouse.mjs`, median of 3 runs, desktop preset unless said; load average 2.6 to 3.9 (one-minute, at the end of the two runs)):

| Page and run | Perf | A11y | BP | SEO | FCP | LCP | CLS | TBT | Gate |
|---|---|---|---|---|---|---|---|---|---|
| `/scout` desktop | 97 | 100 | 96 | 100 | 1006 ms | 1046 ms | .002 | 0 | unchanged, met |
| `/scout` mobile | 67 | 100 | 96 | 100 | 5255 ms | 5255 ms | 0 | 0 | accessibility 100, met |
| `/` desktop, full motion | 95 | 100 | 96 | 100 | 1045 ms | 1264 ms | .011 | 0 | FCP, CLS, a11y, BP, SEO met; performance reported |
| `/` desktop, reduced motion | 96 | 100 | 96 | 100 | 1045 ms | 1085 ms | .001 | 0 | all met, performance 96 at least 90 |
| `/` mobile | 66 | 100 | 96 | 100 | 5404 ms | 5554 ms | .009 | 0 | reported |
| `/intro` desktop | 94 | 100 | 96 | 100 | 1084 ms | 1337 ms | 0 | 0 | a11y, BP, SEO met; performance reported |
| `/intro` mobile | 64 | 100 | 96 | 100 | 5405 ms | 6174 ms | .006 | 0 | reported |

Best practices shows 96 only in the first run of each page after Chrome starts (100 in the next two); the gate takes the worst run and still clears .9. The mobile rows use Lighthouse's simulated slow 4G with a 4x CPU slowdown; the FCP budget is a desktop budget (§9.1), and `/scout`, which was gated before, sits at the same 5.3s there.

### 11.12 Arena Hub (Phase 4)

Rulings, as built (H1 to H15 of the Phase 4 plan; the owner's revision of H9 on 2026-10-08 is marked):

| ID | Decision | Why |
|---|---|---|
| H1 | **Tablet (768 to 1199px).** The Hub uses the phone's fixtures column, centred (`max-w-160`, 640px) and one size step up (the heading takes `d1`'s own `md` step, 84px; the list sits 16px lower). The desktop stage starts at 1200px (`Stage from="lg"`). The column and the stage are in the same `<main>`; CSS shows one of them. | A scaled stage at 1024px would draw the 15px card text at about 10.7px. Same call as the Landing (L1) and the Intro (D-7). |
| H2 | **INDEX drawer on phones and tablets (derived, no artboard).** An INDEX button in the top row, between the YS mark and QUICK VIEW, slides the rail in from the left (`Drawer`, a native modal `<dialog>`, `w-80 max-w-[85vw]`): YOUR RECORD first, the matchday card, the full index with SEEN tags, ~~hidden achievements~~ (superseded, §11.14: the FULL TIME box). Esc, the close button or a tap outside closes it (it slides out), and focus returns to INDEX. Choosing a link closes it and goes there. The page behind does not scroll while it is open. It is forced shut at 1200px, so a drawer left open never holds the stage inert. | §12 puts the rail in a drawer on tablets. On a phone it is the only way to reach Player Card, ~~Locker Room~~ (superseded, §11.14: Full Time) and the full index from the Hub. |
| H3 | **YOUR RECORD chip** reads `YOUR RECORD  YASH n · YOU m` from the saved record; a first-time visitor sees `YASH 0 · YOU 0`. The artboard says RECORD, so the chip is wider (masked, below). | §11.2 #11: the Hub shows the visitor's real tally, not the brand line 99 - 1. |
| H4 | **Venue cards follow the saved record.** Played: volt edge, `PLAYED · <last score>` and REMATCH (phone: the score in volt, REMATCH and `SEE STATS →`; tennis `SEE PROJECTS →`, badminton `SEE SKILLS →`, derived). Unplayed: `UNPLAYED`, PLAY and `SKIP →` (phone: the duration `~12s`). The tests seed the artboard's state: cricket played `14* NOT OUT`, record 1 - 0, Career SEEN. | Artboard states; §4.6 match record. |
| H5 | **No wrong-state flash.** `HEAD_FLAGS_SCRIPT` also sets `data-record` on `<html>` when `arena:v1` exists. Record-bound regions carry `data-record-pending`; `:root.js[data-record] [data-record-pending]` hides them until `useRecordReady` says the record has loaded (one frame after the scripts), and a 3s timer in the same head script drops `data-record` if the bundle never gets there (a timer, not a CSS animation delay: the global reduced-motion rule would cut a delay to 0 and bring the flash back; fixed after the final review). A record that is not JSON counts as no record (`safeJSONStorage.getItem` returns null and removes it), so the store still finishes loading. First-time visitors and JS-off visitors see the page at once. The prerender passes `ready=false`, so the marker is in the HTML (checked in `build/client/arena/index.html`). | Prerendered HTML cannot know the browser's record. |
| H6 | **SEEN tags.** A section counts as seen once its page has been opened, however you got there (`SeenTracker`, mounted in `ArenaShell`, waits for the record to load). Training Academy lives on the Trophy Room page, so it is seen with it. The index adds QUICK VIEW (tag `RECRUITER`) and, ~~after a visitor win, LOCKER ROOM (tag `UNLOCKED`)~~ (superseded, §11.14): FULL TIME (tag `RESULT`) once all three venues are played. An unseen Career Stats shows the tag `CAREER` (derived; the artboard draws it seen). | §11.3; artboard tags. |
| H7 | **COMM by progress (derived lines; desktop only, phones stay silent per L11).** 0 played: "Three venues. One opponent. Pick your ground." 1 played: "One down. Two venues left. Still undefeated." (the artboard). 2: "Two down. One venue left. Still undefeated." 3: "Full matchday. Still undefeated." ~~After a visitor win: "Okay… you got me. That doesn't happen often." (`visitorWins`).~~ (superseded, §11.14): the branch is gone. Said once the record is ready, and again only when the line changes. | Only the 1-played line is drawn. |
| H8 | ~~**Hidden achievements.** Locked: "0 of 1 unlocked. Rumour says you have to beat him." (artboard). Unlocked (derived): "1 of 1 unlocked. Giant Killer. The Locker Room is open."~~ (superseded, §11.14): the rail's bottom box is FULL TIME (F8). | |
| H9 | **Motion (revised by the owner, 2026-10-08: touch screens get motion too).** *Stage (1200px and up, mouse or finger):* hover or keyboard focus straightens the card and lifts it 8px with a brighter volt edge (0.5s, `--dur-glide`, CSS only; `:has(:focus-visible)` so a mouse click does not leave it lifted; while hovered the slot reaches 8px below its lifted foot, so a pointer resting in the card's bottom edge does not make it bob, and the tilt reads the slot rather than the card that turns); the hovered card tilts toward the cursor up to 6deg (`useTilt`); the arc sways +-6deg over 40s (`useOrbit`), stops when the pointer moves and resumes after 4s of stillness; dragging anywhere on the arc that is not a link or button turns it up to +-15deg and it eases back on release, also when the pointer is lost mid-drag (`lostpointercapture`; releasing outside the arc ends it there) (a drag past 4px never opens a link); with a finger the sway runs, a drag orbits the arc (vertical scrolling still works) and pressing a card lifts and tilts it toward the finger (`useTilt({ touch: true })`, `data-pressed`). *Column (under 1200px):* the fixtures and tiles rise in one after another (`animate-rise-stagger`, 60ms apart, `--i` 0 to 4); pressing a fixture tilts it toward the finger (up to 6deg) and presses it in, **scale .98 on the layer around the card** (`fixture-press`; GSAP bakes the individual `scale` into the card's inline transform, so the card itself cannot carry it); release or `pointercancel` eases back, a scroll cancels it, it never blocks the tap. *Reduced motion:* none of the moving parts; the cards still straighten on focus, instantly. | Spec §10 phase 4 row; README camera moves; artboard hover; owner ruling. |
| H10 | **Shortcuts (A8).** Desktop Hub only: 1 / 2 / 3 = PLAY (or REMATCH) that venue, with the tunnel push. Ignored while focus is on a link, button or field, and with Ctrl, Cmd or Alt. The hint shows only on desktop, and only what works there: `DRAG TO ORBIT` needs motion (hidden under reduced motion), `1 2 3 TO PICK A VENUE` needs a keyboard (hidden on a touch-only screen, `(pointer: coarse) and (not (any-pointer: fine))`); both until the page knows (the prerender is the artboard's line), none if neither works (`hubHint`). | Same rules as the Landing (L9). |
| H11 | **No count-up on the Hub** (moved, not built). Its numbers are 0 to 3, so a 900ms count-up reads as a blink. The matchday bars fill on arrival instead (`ProgressSteps animate`, the existing `animate-seg-fill`: 350ms, 40ms stagger). The "controlled count-up trigger" carry-over moves to Phase 5 / 6 (game score, Locker Room record). | §7 segment preset; YAGNI. |
| H12 | **Where the buttons go.** PLAY and REMATCH go to `/arena/cricket`, `/arena/tennis`, `/arena/badminton` (still Phase 5 placeholders) with the tunnel push (`TunnelLink`, now in `shell/ArenaLink`). SKIP goes to Career, Highlights and Attributes (wipe). The facilities go to Trophy Room, `/trophies#academy`, Player Card and Team Up. The YS mark on desktop goes back to the Landing. | §4.6; artboard links. |
| H13 | **Small text on laptops, replaced by the `mono-fit` rule (Phase 4, fix round).** The first version of H13 (an 11px floor on stage screens scaled below 100%) made the labels wrap at 1280x720. A floored mono label now **keeps its drawn width**: the recipe declares `--mono-s` (drawn px) and `--mono-t` (drawn tracking, em); `mono-fit-size` floors the size at `--stage-mono-min`, and `mono-fit` also lowers the tracking, `letter-spacing: max(0, min(T, S * (.6 + T) * fit / 11 - .6)) em`, so size x width matches the drawing. `--stage-fit` is set only inside the stage (`Stage` sets it from `--stage-scale`), so a label outside a stage, or one not floored, keeps its tracking; at scale 1 nothing moves. All 18 floored mono recipes moved to it. Untracked recipes use `mono-fit-size` only. Known limit: when the drawn width needs negative tracking (11px / .14em at scale .8) the clamp stops at 0 and that label is about 1% wider than drawn. **Accepted:** body-floored rail labels ("Match Highlights", "Training Academy") may wrap to two lines at the 11px tag / laptop scales; the row grows, nothing clips or overlaps (the tag is `shrink-0`; a test keeps 8px between label and tag at the lowest floor). | A2 on every desktop, without the wraps. If wrong, one shared CSS rule to revert. |
| H14 | **Phone text sizes (A2).** The artboard's 9 to 10px mono (tab labels, fixture meta, tile labels, index tags) is drawn at 11px. The fixture meta rows are masked; tab and tile labels stay under the limit unmasked. | A2. |
| H15 | **Lighthouse on `/arena`** (desktop): performance at least 90, accessibility 100, best practices at least .9, SEO at least .9, FCP at most 1500ms, CLS at most .1; all gated. Mobile is reported. Results below. | §9.1 budgets on a new cinematic page. |

Design-system additions:

| Change | Detail |
|---|---|
| Tokens | `--perspective-court` 500px (tennis / badminton floor), `--perspective-arc` 1600px (the arc), `--perspective-grid` 800px (the grid floor; `--perspective-floor` already exists at 700px, 14% away, so it was not reused); `--shadow-bank-card-wide`; `--dur-glide` 500ms (no 500ms token existed: wipe is 480, pop 450). New `--ref-*` colours for scene art with no semantic token: `--ref-oval-lo` #13432A, `--ref-wicket` #8C7650, `--ref-court-hard` #16456E, `--ref-court-hall` #2B3A33, and `--rgb-floodlight` 242 244 245. |
| Utilities | Scene (`scene.css`): `scene-grid-floor`, `scene-glow-volt` (sets `--venue-glow-rgb` to volt, since the backdrop root always carries a `data-venue`), `scene-crowd-fade` (and `scene-crowd` now reads `--crowd-mask`, default unchanged), `scene-venue-art`, `scene-art-tilt`, `scene-oval`, `scene-wicket`, `scene-court-hard` / `-hall`, `scene-net`, `scene-net-lifted`, `scene-hall-beam`. Base / motion: `venue-slot` (the lift, on hover and `:has(:focus-visible)`, and `:has([data-pressed])`), `fixture-wash` (reads `--venue-mid` from its own `data-venue`), `fixture-press`, `tabbar-clearance` (the room above the bottom tab bar; now shared by `ContentLayout` and `HubColumn`), `animate-rise-stagger` (the brief called it `animate-rise-in`; no such preset existed and `animate-rise` has `--d`, no stagger), `mono-fit` / `mono-fit-size` (H13), the `record-pending` rule (H5) and `:root:has(dialog[data-drawer][open]) { overflow: hidden }`. |
| Type recipes | `type-btn-sm` (18 / 800 / .14em, the card button), `type-btn-xs` (16 / 800 / .14em, the fixture's play cell), `type-title-fixture` (28 / 900 constant; `type-title` steps down to 22 on phones), `type-title-tile` (18 / 800 untracked; `type-d5` is .08em), `type-title-matchday` (30 / 900, line-height 1; `type-d3s` is .95 and moved every rail row 1.5px, taking the rail from 2.46% to .63%), `type-title-hub` (56 / .9 / 900; `d2s` is 52, `d2` 60). Reused with no new recipe: `d3`, `d4`, `body-md`, `body-sm`, `mono-label`, `mono-xs`, `mono-tag`, `mono-round`, `mono-nav`, `mono-note`. |
| Components | `GridFloor`; `VenueArt` (+ `PerspectiveCourt`, shared by tennis and badminton, whose service lines are `{ from, inset }` because badminton's run edge to edge while its sidelines are inset 10); `ArenaBackdrop layout="hub"` (one more row in the LAYOUT table: sky at 60%, volt floor glow, the stand-shaped crowd with `scene-crowd-fade`, the grid; no banks, cones, field or masts; `bleed` as the other stage layouts; `LayoutSpec` gained `sky.x`, optional `floorGlow` and `grid`, other layouts unchanged; `wash: "enters"` rather than `static`, because a static wash emits no `data-part` and the page addresses four); `FloodlightBank` sizes `card` (40x14) and `card-wide` (50x14); `VenueCard` (slot div around a Glass article, `tiltRef`, `data-state`, `slotClassName`); `VenueFixture` (the phone row; two action cells share one `ActionCell`); `FacilityTile` (cva tone x size); `IndexRail` + `RailSection`; `RecordChip` (forwards rest props); `Drawer` (native dialog, optional `id`); `Button size="card"` (h-11.5, px-6.5, `type-btn-sm`); `SkipChip variant="hub"` (h-12, 12px arrow, `type-mono-xs`); `ProgressSteps animate`; the `close` icon; `LinkSpec` / `linkProps` (`lib/link.ts`, one link description shared by the four composites; `draggable` is optional). Motion lib: `useOrbit`, `orbit.ts` (`orbitAngle`), `motionGate.ts` (`motionAllowed`, `finePointer`), `pressTracker.ts` (press origin, 4px drag threshold, click guard; `useTilt` and `useOrbit` both use it), `useTilt({ touch })`. |
| Shell | `storageKeys.ts` (`LANDING_SEEN_KEY`, `MATCH_RECORD_KEY`: `headFlags` imports it so the head-script test does not pull Zustand in); `sanitizeRecord` (the persist `merge` and `migrate` run every saved record through it: shape guard and version migration of `arena:v1`; it also de-duplicates `sectionsSeen` ~~and `achievements`~~ (superseded, §11.14: no achievements)); `useRecordReady` (`useSyncExternalStore` on the store's hydration events); `sections.ts` (`SECTIONS`, `sectionForPath`, `SeenTracker`); `data-record` on `<html>` (H5); `TunnelLink` in `ArenaLink`; the `withShell` story decorator reads `parameters.route`. |
| Hub feature | `src/features/hub`: `view.ts` (`buildHubView` from the record and `ui.hub`; no string in a component), `hub.fixture.ts` (`artboardRecord`, `artboardHubView`), `HubScreen` (the store, readiness, commentary, shortcuts), `HubPage` (stage + column in one `<main>`, `ArenaTabBar` after it), `HubStage` (the only place with design-space coordinates), `HubColumn`, `HubIndex` (the rail content shared by stage and drawer). Copy: `ui.hub.*`. |
| Storybook | `.storybook/static` (the demo replay `webm` and `vtt`) is served through `staticDirs` (commit a3939d8); a fresh Storybook build went from 2 errors to 0. Stories: `Scene/Stadium` gained `HubBackdrop` and `VenueArts`; Hub composite stories `VenueCardArc`, `VenueCardStates`, `VenueFixtures`, `FacilityTiles`, `IndexRailFidelity`, `RecordChips`, `DrawerOpen`; `Features/Hub` `Desktop`, `ArtboardParity`, `Fresh`, `Unlocked`, `Pending`, `Phone`, `PhoneFresh`, `PhoneDrawerOpen`. |

Deviations from the artboards (visual tests accept exactly these):

| Where | Deviation | Check |
|---|---|---|
| Hub (route, 1440x900, reduced motion) | Record chip `{954.78, 16, 260.02, 44}`: it reads YOUR RECORD (H3) where the artboard says RECORD, so it is wider. | Route parity |
| Hub (route and story) | Quick View index row `{55, 566.59, 198, 44}`: the index adds QUICK VIEW (§11.3, H6); the artboard draws no such row. | Both |
| Hub (story only) | COMM `{304, 821, 414, 43}`: the story has no commentary line. The route does not mask COMM (it waits for the line to finish entering, then compares). | Story parity |
| Hub | No sway mask: the compare runs under `reducedMotion: "reduce"`. | Both |
| Mobile-Hub (390x844) | INDEX button `{191.9, 16, 66.7, 44}` (H2, derived; the artboard has no such button). | Phone story |
| Mobile-Hub | The three fixture meta rows `{33, 211.5 / 360.5 / 503.4, 324, 13}`: 10px drawn, 11px built (A2, H14). The tab labels (9 to 11px) and tile labels (10 to 11px) are unmasked: the whole page is .94% with only these masks. | Phone story |
| Hub backdrop story | Compared with the Hub at 1440x900 with the HUD, rail, title, cards, facilities, COMM and hint masked: the backdrop alone is 0.0000 (near-black art is a weak pixel signal, the shot was also eyeballed). | `scene.spec.ts` |
| VenueArt | Tennis against the artboard crop `{680, 192, 348, 200}` (limit 3%). Cricket and badminton are eyeball-reviewed: the artboard's cards are rotated. | `scene.spec.ts` |
| Fixture crops | Compared at 358x130 (the artboard fixture is 130 tall, not the 110 first briefed) at y 186 / 328 / 470; the meta row (326x14) is masked: its label is 11px mono-round (.14em on a phone) where the artboard draws 10px at .18em. | `hub.spec.ts` (stories) |
| Index rail | "Training Academy" and its tag wrap the label to two lines at the 11px tag (the row stays 44px; A2, H13). | Rail crop |
| Card arc | The arc is a still outer frame (`perspective-arc`, handlers, `touch-pan-y`, `select-none`) holding a rotating plate (`transform-3d`, `pointer-events-none`); each slot is `pointer-events-auto`. The first plan put the rotation on the grid itself, but its own flat box then cut across the turned cards and `elementFromPoint` returned the grid (about 1 load in 6, and it would steal clicks on the outer cards). An e2e hit-tests each card at 10 / 50 / 90% of its width during the sway. Mouse capture starts only after the 4px threshold, so the card tilt sees the press until then. | `hub.spec.ts` (e2e) |
| Every Hub screen | A2: 11px labels where 9 or 10px is drawn. | The masks above |

Measured:
- Visual ratios (2% limit): Hub route 1.16% (.011620), Hub story `ArtboardParity` 1.09%, Mobile-Hub 390x844 .94%.
- Component crops (2% limit): tennis card against `{680, 192, 348, 440}` 1.15% (no mask); index rail against `{36, 104, 236, 760}` 1.10% (.63% before the wrapped row); fixtures cricket (played) .99%, tennis .53%, badminton .53%; tennis VenueArt 2.41% (limit 3%).
- Motion checks: the sway, drag, hover tilt, per-card hit-test, touch context (1366x1024, `hasTouch`) and resize 1440 -> 1024 -> 1440 are e2e tests (the motion block passed 40 of 40 over `--repeat-each=4`); the phone rise delays are 0 / .06 / .12 / .18 / .24s and the press scale .98 (the spec said .97; a full-width fixture takes .98).
- Notes: the closed drawer holds a second matchday card and record chip, so tests scope their selectors to `[data-stage]` or the rail. The prerendered HTML has two `<h1>` (stage and column, one hidden by CSS), as the Landing does; one-h1 assertions use the accessibility tree.

Token merges that moved a value by more than ~2% (extends §11.6), and other near-misses:

| Artboard value | Token used | Where |
|---|---|---|
| Cricket oval light `#2E8A50` | `--rgb-turf` (#2E844E; green 138 to 132, 2.4%) | `VenueArt` oval |
| Roof arc border white `.12` | `border-white-a10` (.10) | `VenueArt` roof |
| Card hover border `.55` | `volt-a60` (+.05 alpha on a 1px border; no a55 token) | `VenueCard` |
| HUD centre label `.2em` | `mono-eyebrow` 12px / .22em (about 2px over nine characters; no 12px / .2em recipe) | Hub HUD |
| SkipChip hub 46px | `h-12` (48px: the artboard's chip is 46px content-box beside a 46px PLAY, i.e. 48px with its border) | `SkipChip hub` |
| YS mark 34px on the phone | `BrandLockup size="sm"` (36px, as the Landing column; the compare stays under the limit) | `HubColumn` |
| Hall beam `rgba(255,226,180)` | `--rgb-warm` (255,228,184; under 2%) | `scene-hall-beam` |
| Fixture meta tracking .18em | `mono-round` (.14em on a phone) | `VenueFixture` |
| Not merged (no token within 2%): wicket against `--rgb-pitch` 3.9%; hard court against `--ref-court-mid` about 3%; oval dark against `turf-deep` about 6% | new `--ref-*` tokens | `VenueArt` |

Lighthouse (production build served by `tools/lighthouse.mjs`, median of 3 runs; `/arena` is gated on desktop, mobile is reported):

| Page and run | Perf | A11y | BP | SEO | FCP | LCP | CLS | TBT | Gate |
|---|---|---|---|---|---|---|---|---|---|
| `/arena` desktop | 96 | 100 | 96 | 100 | 1043 ms | 1082 ms | 0 | 0 | all met (performance 96 at least 90, FCP at most 1500 ms, CLS at most .1) |
| `/arena` mobile | 66 | 100 | 96 | 100 | 5403 ms | 5403 ms | 0 | 0 | reported |

The other pages in the same run are unchanged (`/scout` desktop 96 / 100 / 96 / 100, `/` desktop 95 and reduced-motion run met, `/intro` met). Best practices shows 96 only in the first run after Chrome starts (100 in the next two); the gate takes the worst run and still clears .9. The `/arena` page now carries the column's DOM as well as the stage's; this is in the measurement. Mobile uses Lighthouse's simulated slow 4G with a 4x CPU slowdown; the FCP budget is a desktop budget (§9.1).

### 11.13 Games (Phase 5)

Rulings, as built (G1 to G18 of the Phase 5 plan; where the build differs from the plan text, the build is described and marked **built**):

| ID | Decision | Why |
|---|---|---|
| G1 | **Layouts.** From 1200px: the drawn 1440x900 stage (`GameStage`). Phones and iPads: the one-thumb column from the Mobile-Game board (`GameColumn`), centred on a tablet (`max-w-160`, 640px) and one size step up. The stage and the column live in the same `<main>`; CSS shows one of them, so the prerendered HTML never flashes the wrong layout, and both render from the same game state (a resize across 1200px keeps the game, and the e2e checks it). The keys work on the column too (an iPad with a keyboard). | Same call as the Hub (H1), Landing (L1) and Intro (D-7). A 1024px stage would shrink the meter labels to about 8px. |
| G2 | **One clock.** `useGameClock` is a single `requestAnimationFrame` clock. It writes the meter's position to a CSS variable on the game root (`--meter` cricket, `--power` badminton, `--serve` tennis) and the judge reads the same clock (`clock.elapsed()`), so what you see is what is judged (audit §6.1). The meter moves by `transform` only, with no React re-render per frame. A hidden tab pauses it; a tennis serve in flight when the tab hides is dropped and served again fresh, never judged (**built**). **Built:** tennis never plays while the tab is hidden: `beginServe` and the tell and toss callbacks check the tab's visibility, hold the game at `ready` (a `waiting` flag) and serve anew when the tab is visible again, so a tab hidden during the call, or opened hidden (middle-click, "open in new tab"), is not played out and saves nothing (e2e for both). | Spec §8 game clock. |
| G3 | **Controls.** Cricket: Space, Enter or a click on BOWL; the phone has TAP TO BOWL. Tennis: ← →, or a click on a side; on the phone a swipe on the court (touch or pen only, more than 40px across and more across than down) or a tap on the big ← / → halves of the thumb zone. Badminton: hold Space, or press and hold HOLD · RELEASE (the phone's is 110px tall, 64px on a phone held sideways). **Built:** Space or Enter on a focused BOWL bowls on the key going down (like the game keys do anywhere else; a button's own Space fires on key-up, 80 to 150ms late against a 76ms perfect window), ignores repeats and stops the key-up's click; the tennis aim zones are `aria-disabled` between serves (not `disabled`), so a keyboard pick keeps the focus and the tab order. **Key rules (A8):** keys listen only while a game is waiting for you; they are ignored in fields and with Ctrl, Cmd or Alt; Space or Enter on a focused link or button does that control's own job and is never also a shot; a held key (repeat) does nothing more. **Built:** a badminton hold can never stick: it is released by the HOLD button's `pointerup`, `pointercancel`, `lostpointercapture`, blur and keyup, and by the window's blur, a hidden tab and any Space keyup, at the power it had. | Spec §8 input; README fair play; A8. |
| G4 | **Cricket is the prototype, verbatim.** Zones: stage perfect +-3.5%, good +-12%; column perfect +-5%, good +-14%. Balls 1 and 2: perfect is DOT BALL, good is FOUR, miss is SIX. Ball 3: ~~BOWLED HIM only if all three balls were perfect and the 12% roll lands; otherwise~~ FOUR (perfect or good) or SIX (superseded, §11.14): ball 3 never bowls him. All seven commentary lines are the prototype's. | Spec §8.1, §11.2 #26. |
| G5 | **Tennis details (derived where §8.2 is silent).** The open side is drawn at random; the serve is lit from its start for `TELL_MS` (300ms), then Yash's toss runs a random 0.4 to 0.9s, then the window opens (**built**: the plan said the side lights 0.3s later; the build lights it at once, so the tell is never missed). The first serve **(built, m-7)** waits until the page's wipe is done plus 1.5s (`TENNIS_BEATS.firstMs`) so a first-time visitor has the board to read; after REMATCH it starts 300ms after the click. The 15s bound includes the 1.5s. The window runs from the hit: 900 / 700 / 500ms (+25% on the column). Correct side in the first 40% of the window is perfect; correct side in time is good; wrong side, too late, or **too early (before the hit)** is a miss (TOO EARLY stops key-mashing). Calls: CLEAN RETURN. / RETURNED. / ACE. / WRONG SIDE. / TOO EARLY. Serve 3: Yash's winner clips the line (ON THE LINE.) ~~unless all three returns were perfect and the roll lands (RETURN WINNER.)~~ (superseded, §11.14): always. **Built:** with no input at all the first two serves are ACE and the third is ON THE LINE (the referee never gives an ace on serve 3). A serve is judged with the layout it began in; a resize takes effect from the next serve. The score bug narrates a service game in tennis points: the serves are played at 15–15, 30–15 and 40–30, and the game ends GAME YASH ~~(BROKE SERVE on a win)~~. Serve speeds are 178 / 186 / 194 km/h. | Spec §8.2 leaves these open; three returns cannot come out as real tennis points, so the bug narrates. |
| G6 | **Badminton details (derived where §8.3 is silent).** The meter fills 8% to 86% linearly in 1.4s and bounces while held. Release zones (as drawn): SMASH top 20%, CLEAR 20 to 60% from the top, DROP the bottom 40% (the referee counts from the bottom: smash from 80, drop below 40). The perfect-weight band is 20 to 26% (6% tall, inside DROP) and is **not drawn** (the board has none; only the call PERFECT WEIGHT. tells you). Score: 17–19, 18, 19, then **20–19 MATCH POINT**; a loss ends 21–19 (GAME YASH); ~~the 1% win is the drop that gets through at 20–19: the bug reads 20–20 and the call is IT GETS THROUGH~~ (superseded, §11.14): the match point always goes to Yash. **Built:** at match point a perfect-weight drop is called as the shot (the referee returns `shot`, not `perfect`), so PERFECT WEIGHT. shows on rallies 1 to 3 only. The shuttle waits parked where the board draws it, flies along one arc (600ms) from your ring to Yash's at every release, and rests there through the call. | Spec §8.3; the artboard. |
| G7 | **What each input reveals.** Cricket (revised 2026-10-16, D-10: the career is told from the start): innings 01 (the academy), 02 (the internship), 03 (the current role); with a third role later, the academy then the two most recent roles, oldest first. The slot's number is its place, so an older third role never shows (unit-tested with three careers). Tennis: QF, SF, FINAL courtside cards with each project's content `line` (content wins, §11.2). Badminton: Backend, Frontend, Data, Craft (content order, §11.2 #8); each toast lists the group's shot and its **shipped** skills as chips; upcoming groups read `UP NEXT · RALLY n` / `RALLY n`, never LOCKED (§11.2 #24). Cricket's `INNINGS 02 · LOCKED / BOWL BALL 2` rows stay as drawn. **Built (tennis):** the third card takes the first card's side again, so the card it would cover (QF) slides up to y 96 (`moved`, transform only; instant under reduced motion) and all three stay on screen and clear of each other. | Spec §8, §11.2. |
| G8 | **Verdict, end and saving.** After the last input the call holds for `VERDICT_MS` (2s), then the end buttons appear and take focus **(built, m-3)** only if the focus was on the game's own controls or nowhere (the page body): a keyboard visitor who has tabbed to QUICK VIEW, the sound or the breadcrumb keeps it when a game ends by itself (the reduced-motion rally, or tennis with no input). **Built (m-8):** the phone's end adds a third, quiet BACK TO THE HUB link to `/arena` (`ui.games.backToHub`, derived, §12) where the stage has the breadcrumb. Loss: SEE THE FULL SCORECARD / BOWL AGAIN (cricket, the prototype); SEE MATCH HIGHLIGHTS / REMATCH (tennis); SEE PLAYER ATTRIBUTES / REMATCH (badminton). ~~Win: CLAIM YOUR WICKET (prototype) / CLAIM YOUR BREAK / CLAIM YOUR POINT, all to `/arena/giant-killer`; the cricket win has no BOWL AGAIN (claim only, as drawn).~~ (superseded, §11.14): no win ends; from the third venue SEE FULL TIME is the quiet third link (F3, owner 2026-10-22). The result is saved **the moment it is known** (the last ball landing, the last return, the last release), even if the visitor leaves during the verdict (an e2e leaves mid-game and checks nothing is saved for an unfinished game). **Saved scores** (the Hub shows `PLAYED · <score>`): cricket `<runs>* NOT OUT` (a perfect-to-the-last loss is `4* NOT OUT`, three misses `18* NOT OUT`, the reduced-motion over `14* NOT OUT`) ~~or `0 OUT` on a win (always dot, dot, wicket); tennis `GAME YASH` or `BROKE SERVE`; badminton `21–19` or `20–20`. A win also unlocks the Locker Room, adds the Giant Killer achievement and saves the Team Up prefill "I beat you." (Phase 6 reads it).~~ (superseded, §11.14): the win strings, the Locker Room unlock, the achievement and the prefill are gone; `GAME YASH` and `21–19` are the only tennis and badminton scores. Blocked storage does not stop the game: the save is wrapped and the end buttons still work. | Spec §8 outcome; README loop; carry-over "agree the score string". |
| G9 | **"Watch the highlight instead".** After the 2nd loss at the same venue in one visit the end's main button becomes WATCH THE HIGHLIGHT INSTEAD (to that venue's page: Career, Highlights or Attributes) and the play-again button stays beside it. "One visit" means until the page reloads (`engine/session.ts`, `OFFER_AFTER_LOSSES = 2`, counted per venue). | README fair play. |
| G10 | **Reduced motion.** No live game: no meter, no BOWL button, no aim zones, no hold button. On arrival a 3s auto-rally (`AUTO_RALLY_MS`) plays: the inputs resolve one by one at `autoRallyTimes(n)` with nothing moving (things swap in at once), each reveal appears, then the verdict and the end buttons. It plays as Yash's win and is saved like any loss: cricket good, miss, good (FOUR, SIX, FOUR = `14* NOT OUT`); tennis picks the open side at 60% of the window (good); badminton 50, 85, 30, 30 (clear, smash, drop, drop; none perfect) = `21–19`. REMATCH replays it. | Spec §7, §8 fair play. |
| G11 | **Fair play and accessibility.** SKIP and QUICK VIEW are visible and 44px on every layout and viewport. On the stage the 44px is judged in the 1440x900 design space (it renders at about 35 to 38px at 1280x720, still over the 24px of WCAG 2.5.8 AA; every stage screen since Phase 3 scales the same way, ruling R4); on the column it is judged on screen. On the phone QUICK VIEW sits right-aligned under the reveal chip (A5; the board has none). **Built (landscape):** on a short screen (under 500px tall, the `short:` variant: a phone held sideways) QUICK VIEW moves up into the top row beside SKIP, the thumb zone compacts (the button is 64px, the hint hidden, the badminton power meter shorter) and the call is drawn between the reveal chip and the thumb zone at 40px, so SKIP, QUICK VIEW and the call never hide behind the thumb zone; `VIEWPORTS` carries 844x390 and 667x375 and `expectGameViewport` asserts it. The game pictures are `aria-hidden`; the buttons are real buttons (BOWL and TAP use `aria-disabled` outside the ready phase, so keyboard focus is kept). A polite live region (`GameAnnouncer`) reads each call plus what it revealed, on phones too (the reveals are content): "SIX. Innings 01 unlocked: DEUTSCHE BANK, Software Engineer 1, Jul 2024 – now". **Built (m-4):** once the game is over the last announcement also says how it ended ("… Over complete. Yash 14 not out.", "… Game yash.", "… Game yash. 21–19.", from the same copy as the bug), and while a game is mounted the commentary bar's own live region is left out (`CommentarySlot live={false}`) so each call is heard once. The over tracker is `aria-hidden` (the announcer and the bug carry the over). Each game has one `h1`: BOWL AT ME (visible), RETURN OF SERVE (visible, the pill's label), SMASH OR CLEAR (screen-reader only: the board draws no title); the column's is screen-reader only. With prompt play every game ends inside 15s (`MAX_GAME_MS`, unit-tested from the beat constants). Cricket and badminton are never auto-played for you. Without JavaScript the prerendered board shows SKIP and QUICK VIEW as plain links. | README fair play; A5, A7, A8. |
| G12 | **Commentary (desktop only, L11).** Cricket: the prototype's lines. Tennis and badminton: the content lexicon (entrance, `yashWins`, `visitorWins`), the drawn lines ("Another project shipped. He's not letting up.", "Match point. He's done this before."), and derived lines flagged in §12. Said once on arrival and once per input. | Spec §6, §12. |
| G13 | **Phone extras (derived).** The big call ("SIX.") also shows on the phone, smaller (`type-call-sm`); it is the only feedback there. On a short screen (a phone held sideways) it is 40px, so it fits between the reveal chip and the thumb zone. A 20ms vibration on release where the device supports it (not under reduced motion). | Mobile-Game hint "HAPTIC ON RELEASE". |
| G14 | **No count-up in games.** Score digits swap with the 200ms snap (README "score digits"). The "controlled count-up trigger" carry-over moves to ~~Phase 6 (Locker Room record)~~ (superseded, §11.14): closed unbuilt, there is no Locker Room. | Spec §7; YAGNI. |
| G15 | **Sound hooks.** `audio.play("bat")` on a cricket FOUR or SIX, `"net"` on a tennis return that was not a miss, `"smash"` on a badminton smash. Silent until the files arrive in Phase 7. | Spec §4.6 audio slots. |
| G16 | ~~**The win goes to `/arena/giant-killer`,** still the placeholder until Phase 6 builds it. The journey checks the placeholder has its way back to the Hub, and that the Hub then lists the Locker Room.~~ (superseded, §11.14): there is no win, and no such page. | Phase split. |
| G17 | **Lighthouse on the three game routes (desktop):** performance at least 90, accessibility 100, best practices at least .9, SEO at least .9, FCP at most 1500ms, CLS at most .1 (the Hub's gates). Mobile is reported. Results below. | Spec §9.1. |
| G18 | **Pixel parity.** Cricket: the live route at 1440x900 with the clock frozen. Tennis, Badminton and Mobile-Game: stories in their drawn mid-game states (`Features/Games/*` `ArtboardParity`, `PhoneArtboardParity`). The masks are listed below. | Drawn states are mid-game. |

The referees (plain TypeScript in `features/games/<game>/referee.ts`, no React; the numbers the tests and the games read):

| Game | Rules as built |
|---|---|
| Shared (`engine/`) | ~~A visitor win needs a perfect streak (every input perfect) **and** a luck roll under `LUCK_ODDS` (12%) from the injected random source; luck is not consumed otherwise. `winChance(perfectRate, inputs) = perfectRate^inputs x 0.12` (a Monte Carlo of 20 000 perfect-every-time cricket overs lands in 10 to 14%).~~ (superseded, §11.14): `luck.ts` and `winChance` are deleted; the form of a game is `perfectShare` (F4). `VERDICT_MS` 2000; `AUTO_RALLY_MS` 3000; `MAX_GAME_MS` 15000; `OFFER_AFTER_LOSSES` 2. `Quality` is perfect, good or miss. |
| Cricket | 3 balls. The cursor crosses the track in 1100ms and back. Zones from the track's centre: stage 0.035 perfect / 0.12 good; column 0.05 / 0.14. Beats: the ball flies 450ms, the call holds 1200ms. Calls: dot (0 runs, for you), four (4), six (6), ~~bowled (0, win)~~. Last-ball lines: `lastPerfect`, `lastGood`, `lastSix`. Score: runs + `*` + NOT OUT ~~(`0 OUT` on a win)~~ (superseded, §11.14). |
| Tennis | 3 serves. Windows 900 / 700 / 500ms, x1.25 on the column. Perfect share 0.4 of the window. Tell 300ms, toss 400 to 900ms. Beats: the return flies 500ms, the call holds 1400ms. Points at each serve: 15–15, 30–15, 40–30. Serve speeds 178 / 186 / 194. A pick is `{ side, atMs }` after the hit (negative: before it; side `null`: the window ran out). Calls: clean, returned, ace, wrong, early, line, ~~winner~~ (superseded, §11.14). |
| Badminton | 4 rallies. Power 8 to 86 over 1400ms (ping-pong). Shots: smash at 80 and up, clear 40 to 80, drop under 40. Perfect weight 20 to 26. Start 17–19; rallies 1 to 3 are Yash's (18, 19, then 20–19 at match point); the loss is 21–19. Beats: the shuttle flies 600ms, the call holds 1200ms. Calls: smash, clear, drop, perfect, through. |

Design-system additions:

| Change | Detail |
|---|---|
| Tokens | Scene colours (`--ref-*`, no semantic token within 2%): `--ref-outfield-a` / `-b`, `--ref-pitch-far` / `-near`, `--ref-stump` (`-hi`, `-lo`), `--ref-bat-lo`, `--ref-hall-surround`, `--ref-hall-surface`, `--ref-lamp`; per-venue `--game-surround` / `--game-surface` (court, hall). Colours `volt-a40` (courtside card border) and `floodlight-a35` (aim zone dashed edge). Shadows `bank-game`, `lamp`, `bat`, `glow-power`. `--perspective-courtside` 900px. |
| Type recipes | `type-call-sm` (64 / 900 / .04em, the column's call), `type-title-chip` (22 / 800 untracked), `type-title-card` (26 / 800), `type-title-legend` (26 / 900), `type-title-game` (32 at .95; `type-title-lg` is 1.0 and is Quick View's), `type-btn-tap` (34, heavy, for TAP TO BOWL). Reused: `type-call`, `type-btn-xl` (the stage BOWL label), `type-title-matchday` (the toast title, 30 / 900 exactly), `type-d4s`, `type-mono-*`. |
| Utilities | Scene (`scene.css`): `game-*` (turf, court and hall surfaces, the sky and crowd peak `game-crowd-peak`, the pitch zones, the net). Motion: `animate-slide-in` (600ms, 30px from the right, `--d` stagger), `animate-marquee` (18s linear; `animation: none` under reduced motion), `animate-ring` (the board's `ring`, now drawn as the button's `::after` ring that grows and fades by scale and opacity only, spec §7), `glow-call` (text-shadow). |
| Components | Scene: `GameBackdrop` (venue turf / court / hall x frame stage / column; the static bat is drawn here, ruling R2), `TrackingRing` (yash / you; stage and column sizes), `TracerPath` (+ `ShuttleMark`; `draw`, `drawVar` and `slice`), `CourtBox` and `CourtMark` (an HTML mark centred on a board coordinate of the sliced court, by container query units: the column's rings and tags stand on the court's own places at any width), and the exports `GAME_COURT_VIEW` and `GAME_STAGE_VIEW` (one crop for the backdrop and the games). Broadcast: `TimingMeter`, `PowerMeter` (zones in power % from the bottom), `BallTracker` (54px cell), `CallOverlay` (balanced text wrap; the parent gives it its width), `AimZone` (`tabbable`), `RevealList` + `RevealChip`, `CourtsideCard` (338px wide with padding and border, the board's 300px is content-box), `AttributeToast` (eyebrow on one line, the tag right-aligned), `LEDMarquee` (aria-hidden unless it has a label), `FloodlightBank size="game"`; `ScoreBug.Cell pad="wide"` (16, cricket) / `"tight"` (14, tennis and badminton); `Button pulse="ring"` and `size="tap"`. |
| Engine and frame | `features/games/engine`: `Quality`, `Luck`, `Winner`, `GameLayout`; `luckyWin`, `winChance`; `createGameClock`, `pingPong`; `useGameClock`, `useGameKeys`, `useTimers`, `useMatchResult`, `useRun` (state mirrored in a ref, so one input is one shot), `useFlight` (lazy GSAP, id-guarded, killed on rematch and unmount, with `fly` for the ball, shuttle and return), `useArrival` (the arrival line and the GSAP warm-up); `noteLoss`; `autoRallyTimes`. `features/games/frame`: `buildGameChrome`, `GameStage`, `GameColumn` (sets `data-game-column` and `data-part="thumb"`), `GameEnd` (focuses its first control), `GameAnnouncer`. Each game: `referee.ts`, `view.ts` (a pure builder; no string lives in a component), `flight.ts`, `<Game>Stage`, `<Game>Column`, `<Game>Page`, `<Game>Screen`, a fixture and stories. The root carries `data-game` and `data-phase`. Shell: `isTypingTarget` / `isControlTarget` (one definition, shared with `useScreenShortcuts`), `MEDIA.reducedMotion`. Copy: `ui.games.*` (the headings and the bug names reuse `ui.routes.<venue>.heading` and `ui.hub.record`, ruling R1). |
| Tests | `tests/e2e/{cricket,tennis,badminton,journeys}.spec.ts`; the helpers `tests/e2e/support/game.ts` (`forceLuck`, `freezeClock`, `pauseClock`, `openFrozen`, `stepUntil`, `cssVar`, `VIEWPORTS`, `expectGameViewport`) and `support/cricket.ts`; stories specs `tests/stories/{cricket,tennis,badminton}.spec.ts`. Stories: `Scene/Game`, `Broadcast/Game`, `Features/Games/Frame`, `Features/Games/{Cricket,Tennis,Badminton}`. |

Deviations from the artboards (visual tests accept exactly these):

| Where | Deviation | Check |
|---|---|---|
| Cricket-Play (route, 1440x900) | D-8: the near stumps `{590, 785, 156, 115}` (they stand on the pitch's centre line, the board draws them at x 596). Nothing else is masked: the route is 0.40%. | Route parity |
| Cricket-Play (story) | The same stump box, and the COMM line `{36, 820, 350, 45}` (the story has no commentary line). | Story parity |
| Tennis-Play (story) | The two card blurbs `{57.8, 572.5, 236.7, 39.3}` and `{1145.5, 572.5, 236.7, 39.3}` (the board draws short blurbs; the game shows each project's content `line`, §11.2); the serving tag `{806, 294, 245, 25}` (194 KM/H at rally 3, the board draws 186); the COMM line `{36, 820, 650, 45}`. | Story parity |
| Badminton-Play (story) | The toast column `{1064, 120, 340, 452}` (the board draws two charged and "FRONTEND · LOCKED / WIN RALLY 3"; the game draws three charged in content order and UP NEXT, §8.3 and §11.2 #8 / #24); the COMM line `{36, 820, 650, 45}`. The MATCH POINT chip (A4, §11.1: dark with the red dot, the board's is solid red) is inside the compared area. | Story parity |
| Mobile-Game (story, 390x844) | The QUICK VIEW chip `{270.6, 164, 107.4, 44}` (A5: the board has none); the reveal chip's eyebrow line `{27, 85, 336, 13}` (10px drawn, 11px built, A2); the `YASH · ON STRIKE` tag `{220, 212, 149.8, 21}` (9px drawn, 11px built, A2). The test logs the boxes. Everything else is unmasked: 1.2%. | Story parity |
| Cricket stage | A2: the pitch labels YORKER and GOOD LENGTH are drawn 10px, built 11px (unmasked, inside the 0.40%). | Route parity |
| Every small ScoreBug | A2: the 11px mono floor where the board has 10px (the bug is a few px wider). Unmasked. (Carry-over row ticked.) | Story parity |
| Mobile-Game | A2: the 9 to 10px mono (the hint, the bug's meta, the tags) is 11px. The hint is unmasked. | Story parity |
| Tennis column, Badminton column | Derived, no board: the court crop (`GAME_COURT_VIEW`), the one-thumb controls (the big ← / → halves; the hold button), the slim power meter and its labels, the reveal chip. | Eyeballed against the Mobile-Game pattern; e2e (`expectGameViewport` at 11 viewports) |
| Tennis-Play | The Yash ring is a pill (`rounded-full`) where the board's is a 50% ellipse. Inside the limit. | Story parity |
| Cricket column | D-9: the batter's end on the pitch's centre line. | Logged in §11.4 |
| Reduced motion | No live game and no meter, button, zones or hold; an auto-rally. | e2e |

Measured:
- Visual ratios (2% limit): Cricket-Play route 0.40%, story 0.33%; Tennis-Play story 0.35%; Badminton-Play story 0.68%; Mobile-Game 390x844 1.22% (after D-9).
- Journeys (`tests/e2e/journeys.spec.ts`, both projects unless noted): Landing, Intro, Hub, Cricket (three balls clicked), SEE THE FULL SCORECARD to `/career`, back to the Hub (`1 OF 3 VENUES`, the cricket card PLAYED, `YASH 1 · YOU 0`); SKIP on every game goes to its page and saves nothing; ~~the forced win (`forceLuck(0)`): CLAIM YOUR WICKET to `/arena/giant-killer` and the Hub index lists the Locker Room~~ (superseded, §11.14); keyboard only (desktop: Hub `1`, Space three times with the clock stepped, Tab to the end link, Enter to `/career`); reduced motion (Hub PLAY, the auto-rally, the end, `14* NOT OUT`). The per-game suites cover the rules (forced win and loss, the offer after two losses, every input reveals, racing inputs, hidden tab, resize across 1200px, blocked storage, no JavaScript, leaving mid-game, 11 viewports, axe fresh / during a call / at the end).
- Referee unit tests include ~~the forced win, the forced loss, the 1% maths (Monte Carlo)~~ (superseded, §11.14) and the fair-play bound (every game ends inside 15s with prompt play).

Token merges that moved a value by more than ~2% (extends §11.6), and other near-misses:

| Artboard value | Token used | Where |
|---|---|---|
| Hall court line `#ECEFF1` | `--ref-court-line` `#E8EEF3` (about 1.5%) | Hall court lines |
| Hall net mesh `.18` | `white-a16` (.16; the mesh is a faint pattern) | Hall net |
| Hall net ground `rgba(7,6,10,.3)` | `ground-a35` (`rgba(5,7,10,.35)`) | Hall net |
| Mobile meter cursor glow 10px | `shadow-glow-cursor` (12px) | Column `TimingMeter` |
| Legend note 13px / 1.4 | `type-caption` 13px / 1.45 | `RevealList` legend |
| Mobile 10px and 9px mono | 11px (A2) | Column hints, tags, bug meta |
| Chip eyebrow `.16em` | `type-mono-round` (.14em phone, .18em tablet and up) | Reveal chip, ball cell |
| Courtside media stripes (period 10, `#0E141B` / `#121A23`) | `media-stripes` with `--surface-inset` / `--surface-panel` (period 14; each channel within 5/255) | `CourtsideCard` |
| Cricket BOWL label (900 / .16em) | `type-btn-xl` (800 / .14em, the button is 14px narrower than the board) | Stage BOWL |
| Hall stage surface `#2b3a33` | not reused: the stage's hall is `#1f3a30` (`--ref-hall-surface`) | `GameBackdrop` |

Lighthouse (production build served by `tools/lighthouse.mjs`, median of 3 runs; the three game routes are gated on desktop, mobile is reported):

| Page and run | Perf | A11y | BP | SEO | FCP | LCP | CLS | TBT | Gate |
|---|---|---|---|---|---|---|---|---|---|
| `/scout` desktop | 96 | 100 | 96 | 100 | 1046 ms | 1049 ms | 0.002 | 0 ms | as in Phases 1 to 4 |
| `/scout` mobile | 65 | 100 | 96 | 100 | 5555 ms | 5705 ms | 0.000 | 0 ms | as in Phases 1 to 4 |
| `/` desktop | 95 | 100 | 96 | 100 | 1084 ms | 1326 ms | 0.011 | 0 ms | as in Phases 1 to 4 |
| `/` desktop, reduced motion | 96 | 100 | 96 | 100 | 1084 ms | 1124 ms | 0.001 | 0 ms | as in Phases 1 to 4 |
| `/` mobile | 64 | 100 | 96 | 100 | 5703 ms | 6307 ms | 0.027 | 0 ms | as in Phases 1 to 4 |
| `/intro` desktop | 94 | 100 | 96 | 100 | 1083 ms | 1374 ms | 0.000 | 0 ms | as in Phases 1 to 4 |
| `/intro` mobile | 63 | 100 | 96 | 100 | 5704 ms | 6620 ms | 0.002 | 0 ms | as in Phases 1 to 4 |
| `/arena` desktop | 96 | 100 | 96 | 100 | 1084 ms | 1085 ms | 0.000 | 0 ms | all met (performance at least 90, FCP at most 1500 ms, CLS at most .1) |
| `/arena` mobile | 66 | 100 | 96 | 100 | 5554 ms | 5554 ms | 0.000 | 0 ms | reported |
| `/arena/cricket` desktop | 96 | 100 | 96 | 100 | 1085 ms | 1085 ms | 0.001 | 0 ms | all met (performance at least 90, FCP at most 1500 ms, CLS at most .1) |
| `/arena/cricket` mobile | 65 | 100 | 96 | 100 | 5703 ms | 5703 ms | 0.000 | 0 ms | reported |
| `/arena/tennis` desktop | 95 | 100 | 96 | 100 | 1084 ms | 1250 ms | 0.000 | 0 ms | all met (performance at least 90, FCP at most 1500 ms, CLS at most .1) |
| `/arena/tennis` mobile | 63 | 100 | 96 | 100 | 5704 ms | 6315 ms | 0.006 | 0 ms | reported |
| `/arena/badminton` desktop | 96 | 100 | 96 | 100 | 1084 ms | 1084 ms | 0.001 | 0 ms | all met (performance at least 90, FCP at most 1500 ms, CLS at most .1) |
| `/arena/badminton` mobile | 65 | 100 | 96 | 100 | 5704 ms | 5705 ms | 0.001 | 0 ms | reported |

The game routes sit with the Hub: the prerendered page carries both layouts (the stage and the column) and GSAP stays out of the first-load bundle (the game warms it on arrival, after first paint). The older pages are unchanged from the Phase 4 run (`/scout` desktop 96 / 100 / 96 / 100, `/` desktop 95 with the reduced-motion run met, `/intro` met). Best practices shows 96 only in the first run after Chrome starts (100 in the next two); the gate takes the worst run and still clears .9. Mobile uses Lighthouse's simulated slow 4G with a 4x CPU slowdown; the FCP budget is a desktop budget (§9.1).

### 11.14 Yash always wins and Full Time (Phase 6)

**Owner decision, 2026-10-14.** Yash: "it is my portfolio so I will [win] every time". A visitor can never beat Yash. This replaces the old Phase 6 (Giant Killer, Locker Room, hidden achievements). The 1% win, the Easter egg, the Locker Room and the Giant Killer trophy are gone. In their place, the matchday ends on a Full Time page that shows the real result, YOU 0 · 3 YASH, and a grade for how close the visitor came. Every row this replaces is marked "(superseded, §11.14)" where it stands (§4.5, §8, §9.1, §10, §11.3, H6 to H8, T3, G4 to G6, G8, G14, G16, §12).

Rulings, as built (F1 to F14 of the Phase 6 plan):

| ID | Decision | Why |
|---|---|---|
| F1 | **Yash always wins.** The luck roll is removed from all three referees. Cricket: ball 3 is always FOUR or SIX (a perfect ball 3 is FOUR: "Perfect yorker. Flicked off the toes anyway. Still not out."). Tennis: serve 3 always clips the line (ON THE LINE.). Badminton: match point always goes to Yash, 21–19. Tennis still draws the open side and the toss at random. The cricket `how` line now reads "— dot ball or six —" (a wicket can no longer happen; owner-approved). | Owner decision. |
| F2 | **Saved scores** (the Hub's `PLAYED · <score>`): cricket `<runs>* NOT OUT`, tennis `GAME YASH`, badminton `21–19`. The win strings (`0 OUT`, `BROKE SERVE`, `20–20`) go. | F1. |
| F3 | **The game end.** Unchanged (the venue's page, play again, and the phone's BACK TO THE HUB) until all three venues are played. From then on the main button is **SEE FULL TIME** to `/arena/full-time`, and play again stays beside it. SEE FULL TIME takes the place of WATCH THE HIGHLIGHT INSTEAD (G9) when both apply. With storage blocked the record lives in memory for the visit, so the third game still offers SEE FULL TIME. **Superseded (owner, 2026-10-22):** the main button stays the venue's page (or the G9 highlight offer); once the matchday is complete SEE FULL TIME is the quiet (ghost) third link after play again, replacing the column's BACK TO THE HUB, and shown the same way on the stage. | Yash: "show the entire thing at the end only". |
| F4 | **How close you came.** Each finished game saves its perfect share: perfect inputs ÷ inputs (cricket 3 balls, tennis 3 returns, badminton 4 rallies). The record keeps the best per venue. Full Time compares the sum of the three to `threshold × 3` (so a visitor exactly on a boundary gets the higher grade; the float sum 1.7999999999999998 equals 0.6 × 3 in floating point): 0.6 or more is **SO CLOSE.**, 0.2 or more **NICE EFFORT.**, otherwise **GOOD TRY.** The reduced-motion auto-rallies have no perfect inputs (GOOD TRY). | One verdict from all three games; perfect is the only quality all three share. |
| F5 | **Full Time page = the Easter-Egg artboard, flipped.** Toast MATCHDAY COMPLETE · 3 OF 3 VENUES / FULL TIME; scoreboard **YOU 0 · 3 YASH** with Yash's name on volt; the grade as the `h1` with its line under it; the Team Up card (TEAM UP to `/team-up`); PLAY AGAIN (to cricket), SEE THE PLAYER CARD, BACK TO THE HUB; COMM bottom-left; SAVED TO YOUR RECORD bottom-right (shown only when done). The artboard strikes the loser's name; the board **never strikes the visitor's name**. Motion as drawn (toast drop, rises, dust, scoreboard glitch), still under reduced motion by the global rule. The stage adds QUICK VIEW top-right, as every cinematic screen has (A5; the artboard draws none), and the column has it in its top row. | The drawn screen, reused. |
| F6 | **Opened early** (fewer than three venues played, or a first-time visitor): MATCHDAY IN PROGRESS · n OF 3 VENUES, YOU 0 · n YASH, **NOT YET.**, "n of 3 venues played. The final whistle blows after all three.", a card for the next unplayed venue (name, blurb, PLAY), BACK TO THE HUB only, no note. A returning visitor never sees a wrong-state flash (H5 `data-record-pending`; the prerender and JS off read NOT YET.). | No dead end, no spoiler. |
| F7 | **Phones and tablets (under 1200px).** A derived single column: toast, scoreboard, `h1`, line, card (CTA full width), the links stacked, the note. No COMM (L11). Tablets are centred (max 640px) and one size step up. | No mobile artboard; the column pattern of the Hub and games. |
| F8 | **Hub.** The rail's bottom box (HIDDEN ACHIEVEMENTS) becomes **FULL TIME**: "The final whistle blows after all three venues." / "Final whistle. Your result is up." Same place and size. The index lists **Full Time** (tag RESULT, SEEN once opened) once all three venues are played, where the Locker Room used to appear. The record chip reads `YASH n · YOU 0`. The `visitorWins` COMM branch and its content line go. | H6 to H8 replaced. |
| F9 | **Trophy Room: five trophies.** Desktop: three on the top shelf, the second shelf's two centred. Phone: 2 + 2, then the fifth centred. The locked kind leaves the design system (`TrophyKind`, `Trophy`, stories) and the content schema (`length(5)`); the unused `trophy-glyph-lg` utility is removed. Quick View lost its locked filter. | T3 replaced. |
| F10 | **Team Up prefill.** Once the visitor has played any venue, an empty, untouched message field starts as "Good game, Yash." Nothing typed is ever replaced; clearing the field does not bring it back. Derived from `venuesPlayed`, not stored. | Yash's pick. |
| F11 | **Old addresses** `/arena/giant-killer` and `/locker-room` are removed and fall to the existing Out of Bounds page, which links every page including the Hub. The site has never been published, so nobody holds those links. | A redirect would be code for a link nobody has. |
| F12 | **Saved record.** Same key `arena:v1`, persist version 2: `venuesPlayed`, `lastScores`, `bestForm` (best perfect share per venue, 0 to 1), `sectionsSeen`, `yashWins`. A version 1 record keeps venues, scores and sections seen; `record.yash` becomes `yashWins`; `record.you`, `achievements`, `lockerRoomUnlocked` and `teamUpPrefill` are dropped; a missing best form counts as 0. | Visitors of earlier builds (Yash's own browser) load cleanly. |
| F13 | **Lighthouse** on `/arena/full-time` with the Hub's gates: performance at least 90, accessibility 100, best practices at least .9, SEO at least .9, FCP at most 1500ms, CLS at most .1 (desktop gated, mobile reported). Results below. | §9.1. |
| F14 | **Pixel parity.** Full Time: a story fed the artboard's own words (`artboardView`) against `Easter-Egg@1440x900`, 2% limit, with the YASH strike-through masked. Hub: the rail's bottom box is masked (new words). Trophy Room: the second shelf is masked (centred two, no locked outline). Masks below. | The real page's words differ by design. |

Decisions during the build:

| ID | Decision |
|---|---|
| R1 | The trophy content changes (the content row, the `"locked"` enum, `length(5)`, the selector's `locked` flag) landed in the Trophy Room task, not the Hub task, so every task leaves the build and tests green. |
| R2 | `gradeFor` compares the venue sum against `threshold × 3`, so the inclusive threshold holds under floating point (F4). |
| R3 | The three Hub small-text laptop cases that seeded the old unlocked record stayed red between the games task and the Hub task, and were rewritten there. |
| R4 | The cricket `how` line, "— wicket or six —", became "— dot ball or six —". Confirmed by Yash, 2026-10-14. |

The record (F12) as code: `MatchRecordData = { venuesPlayed, lastScores, bestForm, sectionsSeen, yashWins }`; `completeMatch({ venue, score, form })` is the only writer, called once per finished game by `useMatchResult`; `matchdayComplete(record)` is true when all three venues are in `venuesPlayed`; `sanitizeRecord` clamps `bestForm` to 0 to 1 and reads an old `record.yash` as `yashWins`. `perfectShare` (in `features/games/engine/form.ts`) is the form a game saves. The Full Time feature (`src/features/full-time/`) reads the record through `@/shell/matchRecord`, never through `features/games`.

Design-system additions:

| Change | Detail |
|---|---|
| Components | `IconToast` (broadcast: the drop-in toast with an icon, eyebrow and title; `eyebrowProps` takes data attributes only, so a page can mark just the eyebrow record-pending), `ResultBoard` (broadcast: YOU / YASH with scores; `glitch` flickers the scoreboard), `SpotBeam` and `FloorPool` (scene: the volt beam and the floor pool under it). Stories `Result.stories.tsx`. |
| Type recipes | `type-mono-toast` (11px, .22em), `type-title-toast` (26 / 900 / .06em), `type-title-board` (30 / 900 / .06em), `type-hero-verdict` (150 / .85 / 900; the grade; `type-hero` is 156 / .86 tracked), `type-verdict-line` (28 italic). |
| Text glow | `glow-volt-wide` (0 0 50px at volt .25; `glow-volt` is 18px / .45). |
| Scene utilities | `scene-beam-volt` (volt .16 to .04, clipped 44% / 56% to the full foot, unblurred) and `scene-pool-volt` (radial volt .22 to transparent at 70%). |
| Keyframes (`motion.css`) | `drop-in` / `animate-drop` (700ms, 24px, hidden first frame), `glitch` / `animate-glitch` (3.2s, steps, off under reduced motion), `mote-rise` / `animate-mote` (5s, 120px, off under reduced motion), `rise-text` / `animate-rise-text` (the same 18px / .9s as `rise-in` but never `visibility: hidden`, so the `h1` stays readable and focusable during its delay). `motion.test.ts` covers `drop-in` (hidden first frame) and `rise-text` (not hidden). |
| Reused | `Glass`, `Button`, `rise-in`, `shadow-toast`, `type-stat`, `type-title-panel`, `type-mono-label`, `type-body-copy`, `type-btn-bar-lg`, `type-mono-md`, `type-mono-nav`. `Dust` was not reused: it is a canvas of random specks, the artboard's four motes are CSS spans at drawn spots. |
| Removed | `Trophy` locked kind; `trophy-glyph-lg`; `engine/luck.ts` (`luckyWin`, `winChance`); the `Winner` type; copy keys `ui.games.prefill`, the cricket / tennis / badminton `claim`, `calls.bowled`, `calls.winner`, `calls.through`, `status.broke`, `status.saved`, `ui.routes.giantKiller`, `ui.routes.lockerRoom`, `ui.hub.achievements`, `ui.hub.index.links.lockerRoom`, and `commentary.visitorWins`. |
| Tests | `tests/e2e/full-time.spec.ts` (no record, two venues, all three, no wrong-state flash, blocked storage, JS off, reduced motion, 13 viewports); `tests/stories/full-time.spec.ts` (parity and axe); `tests/e2e/journeys.spec.ts` (the full matchday, also with storage blocked); `gradeFor` / `buildFullTimeView` unit tests. |

Deviations from the artboards (visual tests accept exactly these):

| Where | Deviation | Check |
|---|---|---|
| Full Time (story `Artboard` against `Easter-Egg@1440x900`) | The YASH name cell `{x: 773, y: 151, w: 106.25, h: 62}` (the artboard strikes the loser's name through; the board never strikes the visitor's, F5), the QUICK VIEW chip `{x: 1278.8, y: 16, w: 125.2, h: 44}` (the stage adds it top-right, A5; the artboard draws none), and the COMM line `{x: 36, y: 821, w: 508, h: 43}` (the story has no commentary). Measured 0.52% (0.5245%, unchanged by the chip, which is masked). | Story parity |
| Full Time board | The loser's score uses `text-dim` (#7D8893), where the artboard draws #5D6670. The lint rule (A1) bans decoration greys as text; #5D6670 is `line-hover`. | Eyeballed |
| Full Time board | The drawn name colour #E3E8EC is `text-1` (#E6EAEE); the card title `type-title-panel` is 1.8px taller on line one than drawn. Inside the 0.52%. | Story parity |
| Full Time CTA | No glow on the stage (as drawn); the column's CTA keeps the Button default glow. | Story parity |
| Full Time column | Derived, no board: the phone board's cells are 16px padded (22px from `md`) so it holds 360px. | Eyeballed; e2e (13 viewports) |
| Hub rail (route and story) | The bottom box `{x: 55, y: 792.7, w: 198, h: 50.3}`: FULL TIME and its words replace HIDDEN ACHIEVEMENTS. Measured: route 1.15%, story 1.08%, Mobile-Hub story 0.94%. | Both |
| Trophy Room (story) | The whole second shelf `{x: 36, y: 558, w: 872, h: 306}` (about 20.6% of the board): the artboard draws a locked Giant Killer as the third cell; the cabinet holds five, with the second shelf's two centred. Remaining diff 0.0005%. | Story parity |
| Cricket-Play | The "how" line changed (R4); parity did not move (route 0.40%, story 0.35%). | Both |

Token merges that moved a value by more than ~2% (extends §11.6):

| Artboard value | Token used | Where |
|---|---|---|
| Board border `#232A33` | `line-strong` `#2A323C` (7 to 9 of 255 per channel, about 3%; the same role as `Scoreboard`) | `ResultBoard` |
| Light motes `#EBFF9E` | `volt-hover` `#E6FF7A` (the blue channel is 36 of 255 lower, about 14%; a 3px mote) | Full Time dust |
| Loser score `#5D6670` | `text-dim` `#7D8893` (A1, above) | `ResultBoard` |

Lighthouse (production build served by `tools/lighthouse.mjs`, median of 3 runs; `/arena/full-time` desktop is gated, mobile is reported):

| Page and run | Perf | A11y | BP | SEO | FCP | LCP | CLS | TBT | Gate |
|---|---|---|---|---|---|---|---|---|---|
| `/scout` desktop | 96 | 100 | 96 | 100 | 1048 ms | 1086 ms | 0.002 | 0 ms | as in Phases 1 to 4 |
| `/scout` mobile | 65 | 100 | 96 | 100 | 5555 ms | 5705 ms | 0.000 | 0 ms | as in Phases 1 to 4 |
| `/` desktop | 94 | 100 | 96 | 100 | 1084 ms | 1326 ms | 0.011 | 0 ms | as in Phases 1 to 4 |
| `/` desktop, reduced motion | 96 | 100 | 96 | 100 | 1085 ms | 1125 ms | 0.001 | 0 ms | as in Phases 1 to 4 |
| `/` mobile | 63 | 100 | 96 | 100 | 5704 ms | 6455 ms | 0.027 | 0 ms | as in Phases 1 to 4 |
| `/intro` desktop | 93 | 100 | 96 | 100 | 1124 ms | 1375 ms | 0.000 | 0 ms | as in Phases 1 to 4 |
| `/intro` mobile | 62 | 100 | 96 | 100 | 5855 ms | 6695 ms | 0.002 | 0 ms | as in Phases 1 to 4 |
| `/arena` desktop | 96 | 100 | 96 | 100 | 1085 ms | 1087 ms | 0.000 | 0 ms | all met (performance at least 90, FCP at most 1500 ms, CLS at most .1) |
| `/arena` mobile | 65 | 100 | 96 | 100 | 5554 ms | 5704 ms | 0.000 | 0 ms | reported |
| `/arena/cricket` desktop | 96 | 100 | 96 | 100 | 1084 ms | 1124 ms | 0.001 | 0 ms | all met (performance at least 90, FCP at most 1500 ms, CLS at most .1) |
| `/arena/cricket` mobile | 64 | 100 | 96 | 100 | 5704 ms | 5854 ms | 0.000 | 0 ms | reported |
| `/arena/tennis` desktop | 96 | 100 | 96 | 100 | 1085 ms | 1125 ms | 0.000 | 0 ms | all met (performance at least 90, FCP at most 1500 ms, CLS at most .1) |
| `/arena/tennis` mobile | 64 | 100 | 96 | 100 | 5705 ms | 5855 ms | 0.001 | 0 ms | reported |
| `/arena/badminton` desktop | 96 | 100 | 96 | 100 | 1083 ms | 1123 ms | 0.001 | 0 ms | all met (performance at least 90, FCP at most 1500 ms, CLS at most .1) |
| `/arena/badminton` mobile | 64 | 100 | 96 | 100 | 5704 ms | 5854 ms | 0.001 | 0 ms | reported |
| `/arena/full-time` desktop | 94 | 100 | 96 | 100 | 1185 ms | 1245 ms | 0.000 | 0 ms | all met (performance at least 90, FCP at most 1500 ms, CLS at most .1) |
| `/arena/full-time` mobile | 63 | 100 | 96 | 100 | 5703 ms | 6455 ms | 0.000 | 0 ms | reported |

The numbers are medians of three runs on a loaded host. The older pages sit within a point or two of the Phase 5 run above (the Landing 94, the Intro 93); the Full Time page sits with the Hub and the games: the prerendered page carries both layouts, its entrance is CSS keyframes only, and it loads no GSAP.

Journeys (`tests/e2e/journeys.spec.ts`, both projects unless noted):
- The full matchday: from the Hub, cricket, tennis and badminton on the fake clock (any quality); the first two ends still offer their pages; the third offers SEE FULL TIME; it leads to `/arena/full-time`, which shows YOU 0 · 3 YASH, a grade headline and SAVED TO YOUR RECORD; TEAM UP leads to `/team-up`, whose message field reads "Good game, Yash."; back at the Hub, the index lists Full Time with SEEN.
- The same matchday with storage blocked: the third end still offers SEE FULL TIME and Full Time shows the done state in that visit.
- Kept and updated: Landing to Career with the Hub remembering (`YASH 1 · YOU 0`); SKIP on every game; "perfect play still loses" (no claim, `4* NOT OUT`, no Locker Room link); keyboard only; reduced motion.

### 11.15 Launch ready (Phase 7)

**Owner decisions, 2026-10-14.** The sounds are made in code (P1). The site is made launch ready but **not published** (P2): no git remote was added, nothing was pushed, and Vercel was never called. Phones must score at least 80 in Lighthouse (P7). Yash checks the site with a screen reader himself (P8). This replaces the old "Hardening" row of §10 (audio wiring, final perf pass, accessibility audit, SEO, 404, Vercel deploy), except the deploy, which waits for his separate word "publish". The steps for that day are in `docs/launch/README.md`.

Rulings, as built (P1 to P11 of the Phase 7 plan):

| ID | Decision | Why |
|---|---|---|
| P1 | **Sounds are synthesised** in `src/shell/synth.ts` (Web Audio oscillators and filtered noise), no audio files. Five slots: **bat** (FOUR or SIX in cricket), **net** (a tennis return that was not a miss), **smash** (a badminton smash), **floodlight** (a low thud at the Intro's lights-on beat), **crowd** (a 1.5s swell when any game's verdict lands). The provider (`src/shell/audio.tsx`) builds the `AudioContext` and one master `GainNode` (0.35) on the first unlock; `play` is stable and gated by refs, so it works in the same tick as `unlock`. Nothing plays before the first click, while the toggle is off, or if the browser has no `AudioContext` (everything is wrapped; silent on failure). The floodlight plays once per Intro show, on the first bank of lights (not on each of the four); reduced motion builds no timeline, so it has no sound. The final values are below. | Yash's choice. Each slot has one obvious moment (ruling G15 had left them silent). |
| P2 | **Don't publish.** No remote, no push, no Vercel call. `vercel.json`, the CI file and the launch checklist are prepared, so publishing later is about 15 minutes with Yash at the keyboard. **`vercel.json` is unverified until the first deploy**, and **CI has never run on Ubuntu**. | Yash's choice. Publishing is outward-facing. |
| P3 | **The production address comes from `VITE_SITE_URL`** (https only, only its origin kept; `parseSiteUrl` in `src/shell/config.ts`, like `VITE_FORM_ENDPOINT`). **Unset:** no canonical, `og:url` or `og:image` tags, `sitemap.xml` is a valid empty `<urlset/>`, and `robots.txt` has no `Sitemap:` line. **Set:** all of them, absolute. `twitter:card` is `summary_large_image` only when the address is set (the image needs an absolute URL). Pages that are `noindex` (OUT OF BOUNDS) emit no canonical or `og:url`, since every unknown path would otherwise claim `/404` as its address. `sitemap.xml` and `robots.txt` are resource routes that React Router prerenders under `ssr:false`; the sitemap lists every route except OUT OF BOUNDS (so `/arena/full-time` is in, and `/arena/giant-killer`, `/locker-room` and `/404` are not). Tests and Lighthouse build with `VITE_SITE_URL=https://arena.example` (a reserved test name). | Never ship a wrong canonical. The site still builds before a domain exists. |
| P4 | **Share image** `public/og.png`, 1200×630, 289,803 bytes: the portrait cutout on the arena's dark ground with a blurred volt spotlight, "YASH SARDA", the role line from `content.json`, and "THE ARENA". `tools/og-image.mjs` (`pnpm og-image`) renders an HTML card with Playwright once; the PNG is committed. The size came from a blurred flat ellipse for the spotlight (gradients dither) and drawing the portrait at half detail. Alt text built in `pageMeta` from `content.player` and `ui.brand` ("Yash Sarda, Software Engineer — The Arena"), not stored as a second copy. | §13; a share preview recruiters see. |
| P5 | **Security.** A per-page **Content-Security-Policy meta** (right after `<meta charset>`, which stays within the first 1024 bytes, and before every script) and host headers in `vercel.json`. `tools/csp.mjs` builds the policy from the page's own inline scripts; `tools/postbuild.mjs` adds it to every prerendered page after the build. The policy and headers are quoted below. **As built, `upgrade-insecure-requests` is a host header, not part of the meta (R2).** The form service's origin (from `VITE_FORM_ENDPOINT`) is added to `connect-src` and `form-action` only when set. | Carry-over row 30. A meta policy cannot express `frame-ancestors`, so that goes in a header. |
| P6 | **OUT OF BOUNDS page (derived, §12).** It replaces `PlaceholderScreen`, which is deleted. Built on the content-page frame (`ContentPage`: brand, QUICK VIEW chip). The breadcrumb reads HUB / OUT OF BOUNDS, the eyebrow is THE ARENA, the `h1` is OUT OF BOUNDS and the description is "This page is out of bounds." A compact scoreboard panel holds a line "You tried <path>" (the path in the `mono-code` recipe so it keeps its case, cut at 60 characters with "…") and three links: BACK TO THE HUB (volt), QUICK VIEW, HOME. `noindex`. `/404` and every unknown path show it. A static host serves `build/client/404.html` with a real **404 status** for every unknown address, at that address, so `tools/postbuild.mjs` builds it from the client-only `__spa-fallback.html` (the router then renders the catch-all once and shows the path tried; a copy of the prerendered `/404` body would be shown twice, as two `main` and two `h1`). So that a visitor without JavaScript still sees the page, the `<main>` of the prerendered `/404` is added inside a `<noscript>` at the end of `<body>`, and its title and meta tags (`noindex` too) go in a `<noscript>` in `<head>` (the router renders the same ones for the catch-all, so with scripts on they would be a second set). `tests/e2e/static-host.spec.ts` serves `build/client` like that host (unknown path: `404.html`, status 404, no SPA fallback) and checks one `main`, one visible `h1`, "You tried …", no console errors, and the `<noscript>` content with JavaScript off. | §12 row; carry-over 28. |
| P7 | **Phones at 80 or more.** Finding: the old phone score of about 64 came from the test server, not the site. `tools/lighthouse.mjs` now serves `build/client` through a small `node:http` server with brotli (quality 5, cached in memory) for text, JS, CSS, JSON, SVG and XML, as Vercel does; the same build then scored 0.91 to 0.95 on phones (/scout 0.71 to 0.95). So **no app code was changed** for speed (the plan said to stop changing code once every gated page was at 80). **The gate:** mobile performance at least 0.80 on each page whose desktop performance is gated (`/scout`, `/`, `/arena`, the three games, `/arena/full-time`) and on `/` with reduced motion (a new variant); the Landing's full-motion phone run stays reported (L13, its LCP is the animated `h1`) and `/intro` mobile is reported only (its desktop performance is not gated). Tables below. | Yash's choice. The old number measured the server. |
| P8 | **Accessibility.** An axe sweep (`tests/e2e/a11y-sweep.spec.ts`) of the 15 routes plus an unknown address, at 1440×900 and 390×844, fresh and with a full matchday: zero violations. A keyboard sweep (`tests/e2e/keyboard-sweep.spec.ts`): Tab from the top of every route until focus wraps; every stop is visible, sized, on screen and has a focus ring, and every tabbable element in the DOM was reached; the INDEX drawer keeps focus inside, Esc closes it and focus returns to INDEX. `docs/launch/screen-reader-checklist.md` (eight steps, VoiceOver on Mac and iPhone) is for Yash; what he marks "Not OK" comes back as fixes. | Spec §10 row; Yash's choice. |
| P9 | **Leftovers decided, not built.** No mid-game back chip on phones (carry-over 73): the end has BACK TO THE HUB, and SKIP, QUICK VIEW and the browser's back always work. The big call stays behind the end buttons (carry-over 74), as drawn. | YAGNI; the drawn boards. |
| P10 | **Safari (carry-over 75).** There was no WebKit smoke, so this phase created it: a `webkit` Playwright project (the iPhone 13 preset, `isMobile` with touch, at 390×844) running only `tests/e2e/webkit-smoke.spec.ts` (the three game columns and Full Time seeded with a full matchday: one rendered `h1`, the thumb button on screen, no sideways scroll, the board's label). It needs WebKit installed (`playwright install webkit`), also in CI (R3). | A real-Safari-engine check without hardware. |
| P11 | **Wording review.** `docs/launch/copy-review.md` lists the 84 strings we wrote that are not in the design or `content.json` (59 marked derived in `src/content/ui-copy.ts`, 21 more that §12 names, 4 draft trophy descriptions), with where each shows. Yash marks changes; they go in as one copy task before launch. | Carry-over 77; §12. |

Rulings during the build (from the orchestrator, not in the plan):

| ID | Decision | Why |
|---|---|---|
| R1 | **Fonts are never inlined as `data:` URLs** (`build.assetsInlineLimit` in `vite.config.ts` returns false for `.woff`, `.woff2`, `.ttf`, `.otf` and `.eot`; everything else keeps the default). The first CSP e2e run showed `font-src` blocking `data:` fonts. The policy stays strict (`font-src 'self'`) rather than widening to `data:`. | A few more small font requests (measured in P7: no effect on the gates) for a tighter policy. Applies to the Storybook build too. |
| R2 | **`upgrade-insecure-requests` moves out of the page's meta CSP and into `vercel.json`'s `Content-Security-Policy` header**, beside `frame-ancestors`. Safari/WebKit applied the directive to `http://localhost` and loaded every script over https, which failed, so every local preview broke in Safari (Yash's VoiceOver check uses Safari). Production is https only with HSTS, so the header keeps the protection there. The WebKit smoke no longer strips it; it passes without. | It costs nothing on the live site and a local `pnpm preview` works in every browser. This changes P5's text as built. |
| R3 | **CI installs WebKit too** (`pnpm exec playwright install --with-deps chromium webkit`), since `playwright.config.ts` has a `webkit` project and `pnpm verify` runs it. | Without it CI fails on the first push. |
| R4 | **The "ticket gate" has three doors** (owner ruling, final review m-2). The sound still starts from a user gesture, but any of these opens it: ENTER THE ARENA / the Intro's CTA, **turning the sound toggle on**, or **a game's first input** (BOWL, a tennis pick, the badminton press). So a game reached directly from a shared link can make sound. No visual change. `tests/e2e/audio-unlock.spec.ts` counts the page's `AudioContext`s. | A visitor who opens `/arena/cricket` from a link used to hear nothing for the whole game. |
| R5 | **Repeats cannot pile up (final review m-3).** `play` ignores the same sound asked for again within 60 ms, and the master gain feeds a `DynamicsCompressorNode` (a limiter: threshold -6 dB, ratio 20) before the speakers, so overlapping floodlight hums or bats cannot add up past full scale. Without a compressor the master feeds the speakers directly. | Five quick REPLAYs started five floodlight hums that summed past 1.0 and clipped. |

**Owner add-on, 2026-10-15 (the Home and Intro sound show).** Two CC0 recordings (`public/audio/light.mp3`, `crowd.mp3`, credited in `CREDITS.md`) play through a show bus into the limiter and master mute, scheduled on the audio clock from the same beat tables as the animations. A first-visit start screen was built and then dropped by the owner (2026-10-15) in favour of prefetch + autoplay where the browser allows it + joining on the first gesture: the Home's first visit is silent (the files are only prefetched), a Home return visit gets the crowd only, and the Intro gets the full show (four clunks and the crowd). The game sounds stay as the synth above.

**Sound recipes, final values.** Master gain 0.35 (`MASTER_GAIN`); `PEAK` 0.9; silence floor 0.001. Each stop time is the hard cap a unit test checks. Noise is a looped white-noise buffer.

| Slot | Recipe | Peak after master (measured) |
|---|---|---|
| bat | Noise, bandpass 2200 Hz Q 1.2, level 0.8 × `PEAK`, 2ms attack, exponential decay to 0.001 at 90ms (stops 100ms). Plus a sine 140 to 70 Hz over 60ms at 0.4 × `PEAK` (stops 80ms). | 0.18 to 0.24 |
| net | Noise, bandpass 1400 Hz Q 0.8, 0.6 × `PEAK`, 4ms attack, decay 120ms (stops 140ms). Plus a triangle at 320 Hz, 0.25 × `PEAK`, decay 50ms (stops 60ms). | 0.11 to 0.12 |
| smash | Noise, highpass 3000 Hz Q 0.7, 0.5 × `PEAK` (lowered from 0.7: the first render peaked at 1.04 before the master gain, since a resonant highpass rings above its envelope), 1ms attack, decay 150ms (stops 160ms). Plus a sine 900 to 300 Hz over 80ms, 0.3 × `PEAK` (lowered from 0.33; stops 100ms). | 0.24 to 0.26 |
| floodlight | Sine 70 to 38 Hz over 450ms, 0.8 × `PEAK`, 5ms attack, to silence at 550ms. Plus a noise click, 0.15 × `PEAK`, decay 30ms (stops 40ms). | 0.24 |
| crowd | Looped noise, lowpass 1200 Hz, bandpass 700 Hz Q 0.7 (centre swayed ±250 Hz by a 1.3 Hz sine), up to 0.5 × `PEAK` over 400ms, held to 1.1s, falling to 0.001 at 1.6s (all sources stop at 1.6s). | 0.08 to 0.09 |

Peaks were measured with an `OfflineAudioContext` in Chromium (44.1 kHz, three renders each, as the noise is random); every sound stays under 1.0 with margin and every audible tail ends inside its cap. **The builder could not listen**: the values past smash are starting points, to be tuned by ear (`RECIPES` and `MASTER_GAIN` are the only knobs). The crowd is deliberately very quiet.

**The security policy, verbatim.**

The page's meta (the example is `/scout`, built with no `VITE_FORM_ENDPOINT`; the `sha256` list is that page's own eleven inline scripts, and differs per page: 17 pages, 27 distinct hashes in all):

```
default-src 'self'; script-src 'self' 'sha256-h7yQbqf9aASGBmlHy7d1/ivZ9lqyXeUzktasGBx4XL0=' 'sha256-jTYpJv6RVuNOKOA45HlQBMtFMspDsg8/4yiXN64665E=' 'sha256-UHk7yYf0g66ipavM7T1Il3IpenM+th+KgJnhUUbiWfA=' 'sha256-n1D9cZXw4ZNSiUR+6/8u4KC6Mx7KCFb9ScJA8U0UdhI=' 'sha256-eWa6DMZRMTkb7k2BX579qgK/VGeDqc4D+SQPSUKmNtE=' 'sha256-iwejSqUxRTkrWaltYaBfQ0Sb3AY/i3/X4gtBcsaOQd4=' 'sha256-7mu4H06fwDCjmnxxr/xNHyuQC6pLTHr4M2E4jXw5WZs=' 'sha256-duhaxWNI+6QAukUMmlYrkl97X+e0pxobkwS+TpY5/CQ=' 'sha256-QAlSewaQLi/NPCznjAZSyvQ72heD0VdxmNDDkZeCxgc=' 'sha256-RBZNiG3Ztb26Xi/69+VRecU4BPhrfxcvspLXMRrrCNE=' 'sha256-p7GE78bbMHDrE4IWzpiMSttAsTpUu7wwi5/wvnH54Os='; style-src 'self' 'unsafe-inline'; img-src 'self' data:; font-src 'self'; media-src 'self' https:; connect-src 'self'; form-action 'self' mailto:; object-src 'none'; base-uri 'self'
```

(Before R2 this policy ended with `; upgrade-insecure-requests`; R2 moved it to the header below.) With `VITE_FORM_ENDPOINT` set, its origin is appended to `connect-src` and `form-action`. Styles allow `'unsafe-inline'` because React writes `style` attributes; scripts never do (no `'unsafe-inline'` or `'unsafe-eval'` in `script-src`). A page with no inline scripts would carry only `'self'`.

The host (`vercel.json`, verbatim):

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "buildCommand": "pnpm build",
  "outputDirectory": "build/client",
  "installCommand": "pnpm install --frozen-lockfile",
  "cleanUrls": true,
  "trailingSlash": false,
  "headers": [
    {
      "source": "/(.*)",
      "headers": [
        {
          "key": "Content-Security-Policy",
          "value": "frame-ancestors 'none'; upgrade-insecure-requests"
        },
        { "key": "X-Frame-Options", "value": "DENY" },
        { "key": "Strict-Transport-Security", "value": "max-age=63072000; includeSubDomains" },
        { "key": "X-Content-Type-Options", "value": "nosniff" },
        { "key": "Referrer-Policy", "value": "strict-origin-when-cross-origin" },
        { "key": "Permissions-Policy", "value": "camera=(), microphone=(), geolocation=()" }
      ]
    },
    {
      "source": "/assets/(.*)",
      "headers": [{ "key": "Cache-Control", "value": "public, max-age=31536000, immutable" }]
    }
  ]
}
```

Proofs: `tools/csp.test.ts` (30 unit tests: the hash of a known vector, the exact policy text, no `'unsafe-*'` in `script-src`, the form origin only when given, `withCsp` twice changes nothing); `tests/e2e/csp.spec.ts` (an enforcement canary: an unhashed inline script is blocked and reported; 15 pages "as served" have the meta first in `<head>` and no `'unsafe'` in `script-src`; ten pages used end to end with zero `securitypolicyviolation` events and no CSP console lines).

**What is not verified yet.** (1) `vercel.json` has never run on a real host, so the headers and the real 404 status are checked on the first deploy (`docs/launch/README.md`, step 5). The 404 behaviour itself is emulated locally by `tests/e2e/static-host.spec.ts` (a static server with no SPA fallback), which is how the final review's double OUT OF BOUNDS was found and fixed. (2) The form-origin path (`connect-src` and `form-action` with the service's origin) is covered by unit tests only (`tools/csp.test.ts`, and `tools/buildEnv.test.ts` for a value that sits in a `.env` file), because e2e runs with no form address. (3) CI (`.github/workflows/ci.yml`) has never run on Ubuntu. (4) The sounds have not been listened to. (5) Yash's VoiceOver checklist and wording review are open.

**CI (carry-over 89, prepared without a remote).** `permissions: contents: read`; `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`; `if-no-files-found: ignore` on the artifact upload; `VITE_SITE_URL: https://arena.example` in the verify step's environment; Chromium and WebKit installed (R3). The YAML shape was parsed with Python's `yaml` and prettier-checked.

**Speed.** Phones, same build, only the server changed (median of three runs, Lighthouse's default phone profile):

| Page | Before: performance (FCP / LCP), uncompressed test server | After: performance (FCP / LCP), brotli as Vercel serves it | Gate |
|---|---|---|---|
| `/scout` | 65 (5555 / 5705 ms) | 95 (1958 / 2564 ms) | gated at 80 |
| `/` full motion | 63 (5704 / 6455 ms) | 91 (2111 / 3167 ms) | reported (L13) |
| `/` reduced motion | not measured | 94 (2110 / 2715 ms) | gated at 80 (new) |
| `/intro` | 62 (5855 / 6695 ms) | 92 (1960 / 3107 ms) | reported |
| `/arena` | 65 (5554 / 5704 ms) | 95 (1965 / 2569 ms) | gated at 80 |
| `/arena/cricket` | 64 (5704 / 5854 ms) | 94 (2035 / 2716 ms) | gated at 80 |
| `/arena/tennis` | 64 (5705 / 5855 ms) | 94 (2036 / 2716 ms) | gated at 80 |
| `/arena/badminton` | 64 (5704 / 5854 ms) | 94 (2036 / 2716 ms) | gated at 80 |
| `/arena/full-time` | 63 (5703 / 6455 ms) | 94 (2110 / 2715 ms) | gated at 80 |

The "before" column is the plain test server of Phases 1 to 6 (the §11.14 table, built at the end of Phase 6; `/scout` and `/` re-measured at the start of Phase 7 at 71 and 70). The "after" column is this phase's final run of `pnpm lighthouse`. What the numbers say: the raw 156 KB stylesheet is 21 KB in brotli (12 KB unused); the `transition` chunk is React Router's own library code (51 KB in brotli); `entry.client` is 57 KB, react-dom 36 KB, GSAP 25 KB (idle prefetch, not blocking). Total blocking time is 0 ms everywhere. Full diagnostics for the Landing, Player Intro and Cricket before any change: Phase 7's `lh-mobile-before.md`.

The final `pnpm lighthouse` (production build, brotli server, median of 3; desktop and phone gates as listed; "reported" rows are not gated):

```
/scout
                                    perf a11y  bp seo       FCP      LCP      CLS      TBT
  desktop run 1                     100 100 100 100    473 ms   575 ms    0.001     0 ms
  desktop run 2                     100 100 100 100    466 ms   566 ms    0.002     0 ms
  desktop run 3                     100 100 100 100    464 ms   564 ms    0.002     0 ms
> desktop (gate)                    100 100 100 100    466 ms   566 ms    0.002     0 ms
  mobile run 1                       95 100 100 100   1959 ms  2564 ms    0.000     0 ms
  mobile run 2                       95 100 100 100   1953 ms  2704 ms    0.000     0 ms
  mobile run 3                       95 100 100 100   1958 ms  2563 ms    0.000     0 ms
> mobile (gate)                      95 100 100 100   1958 ms  2564 ms    0.000     0 ms

/
                                    perf a11y  bp seo       FCP      LCP      CLS      TBT
  desktop run 1                     100 100 100 100    468 ms   577 ms    0.000     0 ms
  desktop run 2                     100 100 100 100    467 ms   687 ms    0.011     0 ms
  desktop run 3                     100 100 100 100    467 ms   687 ms    0.011     0 ms
> desktop (gate)                    100 100 100 100    467 ms   687 ms    0.011     0 ms
  desktop, reduced motion run 1     100 100 100 100    466 ms   687 ms    0.001     0 ms
  desktop, reduced motion run 2     100 100 100 100    464 ms   566 ms    0.000     0 ms
  desktop, reduced motion run 3     100 100 100 100    465 ms   568 ms    0.000     0 ms
> desktop, reduced motion (gate)    100 100 100 100    465 ms   568 ms    0.001     0 ms
  mobile run 1                       94 100 100 100   2110 ms  2715 ms    0.009     0 ms
  mobile run 2                       91 100 100 100   2111 ms  3167 ms    0.027     0 ms
  mobile run 3                       91 100 100 100   2111 ms  3167 ms    0.027     0 ms
> mobile (gate)                      91 100 100 100   2111 ms  3167 ms    0.027     0 ms
  mobile, reduced motion run 1       94 100 100 100   2111 ms  2719 ms    0.017     0 ms
  mobile, reduced motion run 2       95 100 100 100   1960 ms  2714 ms    0.017     0 ms
  mobile, reduced motion run 3       94 100 100 100   2110 ms  2715 ms    0.009     0 ms
> mobile, reduced motion (gate)      94 100 100 100   2110 ms  2715 ms    0.017     0 ms

/intro
                                    perf a11y  bp seo       FCP      LCP      CLS      TBT
  desktop run 1                      99 100 100 100    466 ms   738 ms    0.000     0 ms
  desktop run 2                      99 100 100 100    446 ms   738 ms    0.000     0 ms
  desktop run 3                      99 100 100 100    465 ms   736 ms    0.000     0 ms
> desktop (gate)                     99 100 100 100    465 ms   738 ms    0.000     0 ms
  mobile run 1                       92 100 100 100   1962 ms  3112 ms    0.002     0 ms
  mobile run 2                       92 100 100 100   1960 ms  3106 ms    0.002     0 ms
  mobile run 3                       92 100 100 100   1960 ms  3107 ms    0.002     0 ms
> mobile (gate)                      92 100 100 100   1960 ms  3107 ms    0.002     0 ms

/arena
                                    perf a11y  bp seo       FCP      LCP      CLS      TBT
  desktop run 1                     100 100 100 100    465 ms   570 ms    0.000     0 ms
  desktop run 2                     100 100 100 100    465 ms   565 ms    0.000     0 ms
  desktop run 3                     100 100 100 100    465 ms   565 ms    0.000     0 ms
> desktop (gate)                    100 100 100 100    465 ms   565 ms    0.000     0 ms
  mobile run 1                       95 100 100 100   1960 ms  2565 ms    0.000     0 ms
  mobile run 2                       95 100 100 100   1969 ms  2579 ms    0.000     0 ms
  mobile run 3                       95 100 100 100   1965 ms  2569 ms    0.000     0 ms
> mobile (gate)                      95 100 100 100   1965 ms  2569 ms    0.000     0 ms

/arena/cricket
                                    perf a11y  bp seo       FCP      LCP      CLS      TBT
  desktop run 1                     100 100 100 100    527 ms   688 ms    0.001     0 ms
  desktop run 2                     100 100 100 100    465 ms   565 ms    0.000     0 ms
  desktop run 3                     100 100 100 100    466 ms   566 ms    0.000     0 ms
> desktop (gate)                    100 100 100 100    466 ms   566 ms    0.001     0 ms
  mobile run 1                       94 100 100 100   2035 ms  2718 ms    0.000     0 ms
  mobile run 2                       94 100 100 100   2034 ms  2715 ms    0.000     0 ms
  mobile run 3                       94 100 100 100   2035 ms  2716 ms    0.000     0 ms
> mobile (gate)                      94 100 100 100   2035 ms  2716 ms    0.000     0 ms

/arena/tennis
                                    perf a11y  bp seo       FCP      LCP      CLS      TBT
  desktop run 1                     100 100 100 100    528 ms   691 ms    0.000     0 ms
  desktop run 2                     100 100 100 100    464 ms   564 ms    0.000     0 ms
  desktop run 3                     100 100 100 100    464 ms   564 ms    0.000     0 ms
> desktop (gate)                    100 100 100 100    464 ms   564 ms    0.000     0 ms
  mobile run 1                       92 100 100 100   2190 ms  3028 ms    0.001     0 ms
  mobile run 2                       94 100 100 100   2035 ms  2715 ms    0.001     0 ms
  mobile run 3                       94 100 100 100   2036 ms  2716 ms    0.001     0 ms
> mobile (gate)                      94 100 100 100   2036 ms  2716 ms    0.001     0 ms

/arena/badminton
                                    perf a11y  bp seo       FCP      LCP      CLS      TBT
  desktop run 1                     100 100 100 100    525 ms   686 ms    0.001     0 ms
  desktop run 2                     100 100 100 100    464 ms   565 ms    0.001     0 ms
  desktop run 3                     100 100 100 100    466 ms   566 ms    0.001     0 ms
> desktop (gate)                    100 100 100 100    466 ms   566 ms    0.001     0 ms
  mobile run 1                       94 100 100 100   2036 ms  2718 ms    0.001     0 ms
  mobile run 2                       94 100 100 100   2036 ms  2716 ms    0.001     0 ms
  mobile run 3                       94 100 100 100   2035 ms  2715 ms    0.001     0 ms
> mobile (gate)                      94 100 100 100   2036 ms  2716 ms    0.001     0 ms

/arena/full-time
                                    perf a11y  bp seo       FCP      LCP      CLS      TBT
  desktop run 1                     100 100 100 100    464 ms   687 ms    0.000     0 ms
  desktop run 2                     100 100 100 100    466 ms   690 ms    0.000     0 ms
  desktop run 3                     100 100 100 100    464 ms   686 ms    0.000     0 ms
> desktop (gate)                    100 100 100 100    464 ms   687 ms    0.000     0 ms
  mobile run 1                       94 100 100 100   2110 ms  2715 ms    0.000     0 ms
  mobile run 2                       94 100 100 100   2110 ms  2715 ms    0.000     0 ms
  mobile run 3                       94 100 100 100   2114 ms  2718 ms    0.000     0 ms
> mobile (gate)                      94 100 100 100   2110 ms  2715 ms    0.000     0 ms

gate rows: performance = median, accessibility / best practices / SEO = worst run,
FCP / LCP / TBT = median, CLS = worst run. Variants without a gate for a column only report it.

Lighthouse budget met.
```

**Sweeps, results and fixes.** Axe: 64 tests (16 paths × 2 viewports × fresh and full matchday), zero violations on the first run; the shared helper still logs some colour-contrast nodes as "incomplete" (translucent glass; axe cannot compute them, `contrast.test.ts` covers contrast) and does not fail on them. Keyboard: 17 tests (16 routes plus the drawer), zero findings in the page code. Two failures in the first draft of the sweep were test mistakes and were fixed in the test: a Radix `[role=tablist]` forwards focus to the selected tab, so the list itself is not a stop; and a native modal `<dialog>` hops to the browser's own bar after its last control (the document reads as `body`), so the drawer test accepts "in the drawer" or "body" and fails if focus ever lands on the page behind, on Tab or Shift+Tab (24 presses each). **No application code needed fixing.** WebKit smoke: 4 tests. The shared helper `tests/e2e/support/matchday.ts` (`FULL_MATCHDAY`, `seedFullMatchday`, `ALL_PATHS`) serves these specs.

**Deferred minors.** `ui.games.firstReveal` ("EVERY INPUT UNLOCKS SOMETHING") is derived copy used only by `Frame.stories.tsx`; it is flagged in `copy-review.md`. The VoiceOver checklist's expected phrases ("has pop-up", "invalid data") are what VoiceOver usually says, not recorded output. The Intro's floodlight is audible when the Intro is reached from the Landing (its ENTER THE ARENA click unlocks audio); a visitor who opens `/intro` directly hears it from REPLAY or the next visit.

**Derived designs added to §12.** The OUT OF BOUNDS row (P6) and the share image (P4) below; the 404 row that was already there still reads "scoreboard panel with links to Hub and Quick View" and the page now also has a line naming the path tried and a HOME link.

Tests added or changed: `src/shell/synth.test.ts`, `audio.test.tsx`; `src/shell/config.test.ts`, `seo.test.ts`, `meta.test.ts`; `src/features/not-found/view.test.ts`; `tools/csp.test.ts`; `tests/e2e/not-found.spec.ts`, `seo.spec.ts`, `csp.spec.ts`, `a11y-sweep.spec.ts`, `keyboard-sweep.spec.ts`, `webkit-smoke.spec.ts`; `routes.spec.ts` updated (the wipe, focus and reduced-motion tests use the page's own links, not the placeholder site map).

---

## 12. Derived designs (not in the artboards; built from existing components, flagged for Yash's review)

| Screen / state | Approach |
|---|---|
| Ticket gate (sound) | No separate screen. The landing CTAs act as the gate: ENTER THE ARENA unlocks audio, and the audio toggle sits in the HUD. |
| Mobile intro (3s, D-6) | Two floodlight banks flicker, scoreboard name boots, CTA appears |
| Tablet (768–1199) | Stage screens scale (the Landing and Intro use their phone columns, §11.11). Hub: the phone's fixtures column, centred and a size up, with the index rail in a drawer (H1, H2, §11.12). Content pages use the 1200 layout reflowed to 2 columns. |
| Hub INDEX drawer (phones and tablets, H2) | An INDEX button in the top row opens the desktop rail (YOUR RECORD, matchday card, the index with SEEN tags, ~~hidden achievements~~ (superseded, §11.14: the FULL TIME box)) in a left-hand modal drawer: Esc, the close button or a tap outside closes it and focus returns to INDEX; choosing a link closes it and goes there. |
| Hub COMM and achievements lines (H7, H8) | Derived commentary by matchday progress (0, 2 and 3 played; the 1-played line is the artboard's), and ~~the unlocked achievements line "1 of 1 unlocked. Giant Killer. The Locker Room is open."~~ (superseded, §11.14). Flagged for review. |
| Mobile Career, Highlights, Attributes, Trophy, Card, Team Up | Built from the Mobile-QuickView and Mobile-Game patterns: single column, solid panels, 16px gutter, bottom tab bar |
| Mobile Tennis and Badminton (G1, G3) | One-thumb columns built from the Mobile-Game board (`GameColumn`): the score bug and SKIP at the top, QUICK VIEW under the reveal chip (beside SKIP on a phone held sideways), the court (the stage's, cropped) in the middle, the thumb zone at the bottom. Tennis: swipe left or right on the court, or tap the big ← / → halves of the thumb zone (the zones are a picture of the buttons, out of the tab order). Badminton: press and hold the big HOLD · RELEASE button, let go to play; a slim power meter stands above the hint. Keys also work (an iPad with a keyboard). Centred, one step up, on tablets. |
| Games, the phone's end (m-8) | A third, quiet link BACK TO THE HUB (`ui.games.backToHub`) to `/arena` below the end buttons (a ghost bar button), because the column has no breadcrumb. On a phone held sideways the end's buttons stand in one row. The top row is unchanged. Also derived: `ui.games.skipShort` (the phone's SKIP chip) and `ui.games.hubLabel` (the breadcrumb's HUB), so the frame no longer reads `ui.hub.venue.skip` or `ui.placeholder.hub`. |
| Reduced-motion auto-rally (G10) | Under reduced motion each game shows no meter, button, zones or hold; a 3s auto-rally resolves the inputs one by one with no movement (cricket FOUR, SIX, FOUR = `14* NOT OUT`; tennis three good returns, `GAME YASH`; badminton clear, smash, drop, drop, `21–19`), each reveal appears, then the verdict and the end buttons. REMATCH replays it. |
| "Watch the highlight instead" (G9) | After the second loss at one venue in a visit, the end's main button reads WATCH THE HIGHLIGHT INSTEAD and goes to that venue's page (Career, Highlights or Attributes); the play-again button stays beside it. It resets when the page reloads. |
| Derived game copy (G5, G6, G8, G12) | Flagged for Yash's review. Tennis: the calls CLEAN RETURN. / RETURNED. / ACE. / WRONG SIDE. / TOO EARLY. / ON THE LINE. / RETURN WINNER.; the statuses GAME YASH and BROKE SERVE; the marquee "ALL THREE ON THE BIG SCREEN"; COMM "Ace. The project ships anyway." and "Clipped the line. Still undefeated."; SEE MATCH HIGHLIGHTS and CLAIM YOUR BREAK; the phone hint SWIPE OR TAP THE OPEN SIDE. Badminton: the calls HE READS IT. / BACK LINE. STILL HIS. / AT THE NET. STILL HIS. / PERFECT WEIGHT. / IT GETS THROUGH.; the statuses GAME YASH and SAVED; COMM "Your serve. He's reading your grip.", "He reads it. Another attribute charged." and "Perfect weight. He still got there."; SEE PLAYER ATTRIBUTES and CLAIM YOUR POINT; the phone hint PRESS AND HOLD · LET GO TO PLAY. The score bug's story in tennis points (15–15, 30–15, 40–30) and the perfect-weight band (20 to 26%, not drawn) are derived too. |
| Player Card back face | Section index (career, highlights, skills, trophies, contact) as ActionRows |
| Copy-link feedback | Button label swaps to "LINK COPIED ✓" for 2s, announced politely |
| Team Up submit | Form validates locally. If `VITE_FORM_ENDPOINT` is set (Formspree-compatible: JSON with `Accept: application/json`, honeypot `_gotcha`), it POSTs there. Otherwise it opens the visitor's email app with subject and body prefilled from the chosen format and says nothing is sent yet (§11.10 P2). Success (service answered 2xx, or a quiet honeypot drop): COMM "Challenge received. I'll serve first.", floodlight pulse, scoreboard "NEW FIXTURE · VISITOR vs YASH". Error state shows "OR EMAIL" fallback. |
| Resume buttons | The phone-number PDF is **never shipped**. If `content.player.resumePdf` is `null`, buttons read "REQUEST RESUME" (mailto). When a public PDF is added to `public/`, the buttons automatically switch to View/Download. |
| Project media | `MediaSlot` shows the designed striped placeholder while `media` is `null`, and a muted video with controls when set. `media` is `{ src, poster?, captions?, silent }`: every URL is https or a root path; a silent screen recording needs no captions but is described by the project line and problem / approach / result (`aria-describedby`); a recording with sound must have `captions` (the schema rejects it otherwise). The captions track exists only when there are captions. |
| ~~Locker Room `/locker-room`~~ (superseded, §11.14) | ~~"The making of the arena": thank-you headline, the visitor's record, how the site was built (stack, design system, the 1% maths), and a direct-line contact band. Locked state for visitors who haven't won.~~ |
| ~~Giant Killer trophy (unlocked)~~ (superseded, §11.14) | ~~Gold trophy replaces the dashed outline in the cabinet, with the "GIANT KILLER" plaque~~ |
| Full Time `/arena/full-time` (§11.14, F5 to F7) | The Easter-Egg artboard, flipped (stage 1440×900 at the artboard's coordinates); phones and tablets get a derived single column (no COMM). Derived column: toast, scoreboard, `h1`, line, card, links stacked, note. Opened early it reads NOT YET. with the next venue's card. Every string is derived (`ui.fullTime`). Flagged for review. |
| Hub FULL TIME box (F8) | The rail's bottom box (HIDDEN ACHIEVEMENTS in the artboard): "The final whistle blows after all three venues." until the third venue is played, then "Final whistle. Your result is up." Same place and size. Flagged for review. |
| Team Up prefill (F10) | Once a venue is played, an empty, untouched message field starts as "Good game, Yash." Nothing typed is replaced; derived from `venuesPlayed`, never stored. Flagged for review. |
| Trophy Room, five trophies (F9) | Desktop: three on the top shelf, the second shelf's two centred under them. Phone: 2 + 2, then the fifth centred. The locked outline is gone from the cabinet and the design system. Flagged for review. |
| 404 | "OUT OF BOUNDS": scoreboard panel with links to Hub and Quick View |
| OUT OF BOUNDS `404` as built (§11.15, P6) | The content-page frame (brand, QUICK VIEW chip), breadcrumb HUB / OUT OF BOUNDS, eyebrow THE ARENA, `h1` OUT OF BOUNDS, the lede "This page is out of bounds.", and a compact scoreboard panel with "You tried <path>" and the links BACK TO THE HUB (volt), QUICK VIEW and HOME. `noindex`; no canonical. Shown for `/404` and every unknown path; the host serves `404.html` (the client-only page, plus this content in a `<noscript>`) with a real 404 status. Every string is derived (`ui.notFound`, `ui.routes.notFound`). Flagged for review. |
| Share image `og.png` (§11.15, P4) | 1200×630: the portrait cutout on the arena's dark ground with a blurred volt spotlight, "YASH SARDA", the role line from `content.json` and "THE ARENA". Made once by `tools/og-image.mjs` and committed. Derived (no artboard). Flagged for review. |
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
