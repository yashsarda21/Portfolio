# Phase 2A — Content-Page Frame, Career & Highlights Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Phase 2 is split like Phase 0 was** (each part has its own plan, approval, review and merge):

| Part | Delivers |
|---|---|
| **2A (this plan)** | The shared **content-page frame** (breadcrumb header, page title, panels, COMM line + "next venue" button, mobile tab bar, venue backdrop), **Career** (`/career`) and **Highlights** (`/highlights`), desktop + tablet + mobile |
| 2B | Attributes (`/attributes`), Trophy Room + Academy (`/trophies`, `#academy`): trophy art, spotlight, turntable |
| 2C | Player Card (`/card`: tilt, flip, derived back face, copy-link feedback), Team Up (`/team-up`: form, validation, success state) |

**What this plan does (plain words):**
- **One frame for every content page.** The six content pages share a layout:
  - a breadcrumb header ("HUB / CRICKET GROUND / CAREER STATS") with REMATCH and QUICK VIEW
  - a big page title
  - glass panels
  - the COMM line and a skewed "NEXT VENUE" button
  
  This plan builds that frame once, so 2B and 2C reuse it.
- **Career:** the cricket scorecard. Pick an innings on the left and its ball-by-ball detail shows on the right. A third row links to the Training Academy.
- **Highlights:** the tennis "tournament draw". Pick a project and its replay, problem → approach → result and shot data show. THE FINAL is picked by default.
- **Small screens:**
  - Tablets get a two-column version.
  - Phones get a single column with the bottom tab bar from your Mobile-Hub design.
- Both pages are checked against your artboards at 1440×900 within 2%.

**Goal:** `/career` and `/highlights` render from real content inside a reusable frame. Selection is keyboard-accessible tabs. Artboard-copy fixture stories match `Cricket-Career@1440x900` and `Tennis-Highlights@1440x900` within 2%, and the real routes match within 2% with only logged deviations masked. Tablet and mobile layouts have no overflow, axe is clean, and `pnpm verify` stays green.

**Architecture:**
- **Frame:**
  - Design system (layout only, no routes): `ContentLayout` slots, `PageTitle`, `Breadcrumb`, `MobileTabBar`.
  - Shell wiring: `src/shell/ContentPage.tsx` puts ArenaLink, `QuickViewChip`, `CommentarySlot`, the route-aware `ArenaTabBar` and the venue backdrop into those slots.
- **Pages follow the Quick View pattern:**
  - A pure view builder (`buildCareerView(content, ui, routes)`) produces a plain object.
  - A pure screen draws it.
  - A `…Screen` wrapper builds from real content.
  - An artboard-copy fixture feeds the parity story.
- **Selection** is one design-system `SelectableList`, built on `@radix-ui/react-tabs`: arrow keys, `aria-selected`, a tabpanel. All panels are force-mounted, so every innings and project is in the pre-rendered HTML; inactive ones are `hidden`.

**Tech Stack:** React 19, React Router 8 (prerender), Tailwind v4 Arena tokens, `@radix-ui/react-tabs` (new; the spec §3 lists it), Vitest + Testing Library, Playwright + axe + pixelmatch.

**Spec:** `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md`:
- §2 D2 (content pages fluid; below 768 mobile)
- §4.3 rendering
- §4.5 routes
- §4.6 commentary
- §5.3 tiers (SelectableList on Radix Tabs, MediaSlot, ProblemApproachResult, BallByBall, MobileTabBar)
- §9
- §11.1 A2, A3, A6
- §11.2 #2–4, #13
- §12 (tablet 2 columns, mobile single column + tab bar, MediaSlot placeholder)

Measuring tape:
- `design/handoff/design-source/Cricket-Career.dc.html`
- `design/handoff/design-source/Tennis-Highlights.dc.html`
- `design/handoff/design-source/Mobile-Hub.dc.html` (tab bar, mobile header)
- audit §3 (#2 Breadcrumb, #12 MobileTabBar, #27 PageHeader, #28 StatTile, #43 ProblemApproachResult, #44 SelectableListRow, #46 BallByBallList)

**Builders read those artboards.**

**Carry-over absorbed:**
- "Pick the venue per route" (`data-venue` turf for Career, court for Highlights)
- StatTile label tracking (resolve at the Career pixel diff)

**Deferred:**
- Phase 2B: the hash link `/trophies#academy` is verified on the real page there; here we check only the href
- Phase 2C: StatTile `cell` row, inline COMM 15px

---

## Rulings for Yash to confirm

| # | Decision | Why | Easy to flip? |
|---|---|---|---|
| P1 | The replay placeholder text reads **"AI INTERVIEW GROOMING PLATFORM · REPLAY COMING SOON"** instead of the artboard's "· ADD A 10s SCREEN RECORDING". The stripes, REPLAY chip, round chip and progress bar stay exactly as drawn. When `media` is set, a muted captioned video replaces it (spec §12). | The artboard text is a note to you, the owner. Recruiters shouldn't read it. | Yes: one `ui` string |
| P2 | **LIVE DEMO** and **FULL CASE STUDY** rows only appear when a project has those links in content (new optional `links.demo` / `links.caseStudy`). Today none do, so only **CODE ON GITHUB ↗** shows. It goes to the project's `links.code` if set, else your GitHub profile. | The artboard links are `#` (dead links). A dead button looks broken and fails accessibility. | Yes: add URLs to `content.json` and they appear |
| P3 | Career shows the 2 scorecard rows plus a third **"03 · ACADEMY"** link row → `/trophies#academy` (spec §11.2 #13), drawn in the idle-row style. | The cricket game's ball 3 reveals the academy innings, so the scorecard shouldn't hide it. | Yes |
| P4 | The "CLUB" stat tile shows **DEUTSCHE**, from a new `player.clubShort` content field. | The tile is 170px wide, too narrow for the full club name. | Yes |
| P5 | **Tablet (768–1199):** Career = title, stat tiles, then scorecard and detail stacked full width. Highlights = draw │ replay in 2 columns, shot data full width below. **Phone (<768):** single column, solid panels, 16px gutter. The header is the YS mark + QUICK VIEW (like Mobile-Hub), the title is 48px, the next-venue button is full width and unskewed, and the bottom tab bar is **ARENA / CAREER / PROJECTS / SKILLS / TEAM UP** with the current page in volt. Tab labels are 11px (A2). COMM is hidden on mobile, as designed. | Spec §12 derived designs. | Medium |
| P6 | On screens wider than 1440, content stays at most 1440 wide and centred, and the stadium backdrop fills the edges. On short screens (e.g. 1440×800) the page scrolls instead of squashing panels. | Fluid pages must not stretch or clip. | Yes |

---

## Global Constraints

All Phase 0/1 constraints apply:
- Arena tokens only.
- **Literal class strings.**
- **Type-recipe overrides only as a separate `cn()` argument after the recipe.** Better still: add or adjust a recipe or component. Feature code holds no pixel fitting.
- No raw hex/rgb/cubic-bezier in TS/TSX, no arbitrary type sizes, no inline `var(--color-*)`.
- Polymorphic `as`, `className` via `cn`, React 19 ref-as-prop.
- Mono ≥11px, contrast ≥4.5:1, volt focus ring (ink ring on volt surfaces), reduced motion respected.
- New design-system components: story for every variant/state, barrel export, Storybook a11y gate, no outer margins.
- **Artboard borders are content-box (+2px)**; spans with no line-height use the font's own line box (`leading-auto` / recipe `line-height: normal`). Encode both in recipes and components, never per element (Phase 1 §11.7).
- **No visible copy in components or routes.** Strings come from `src/content` (`ui` or content). `*.fixture.ts` files are only imported by stories.
- **Folder rules:**
  - design-system imports nothing from content/shell/features
  - shell imports design-system/content/lib
  - features import shell/design-system/content/lib, never other features
  - `app/routes/*` = meta + one feature screen
- Zod stays out of the client.
- The private resume PDF is never referenced.
- **Lean testing:**
  - unit tests for view builders
  - component tests for interactive or semantic design-system pieces (SelectableList keyboard, MobileTabBar `aria-current`, Breadcrumb)
  - parity stories
  - e2e for routes (no-JS content, keyboard tabs, fidelity, mobile/tablet overflow, links)
  - no snapshot tests
- git 2.15 (no `switch`/`restore`). Branch `phase/2-content` (2A–2C share it, merged after each part with Yash's OK). Commits end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Port 4173 may be held by Yash's own preview: ask the orchestrator; never kill processes you didn't start. Port 6006 (his Storybook) is untouchable.

## Review Focus

1. **Keyboard selection.** Tab into the scorecard/draw, use ↑/↓ to move the selection, and the detail panel updates. Focus never gets lost, and the selected row is announced as selected. Tests: Task 2 `SelectableList.test.tsx`; Task 4/5 e2e "keyboard selects".
2. **No-JS and crawlers see every innings and project.** Force-mounted panels: all ball-by-ball lines and all three projects are in the pre-rendered HTML. Test: Task 4/5 e2e "renders without JavaScript".
3. **The mobile tab bar covers content or focus.** The page bottom clears the 76px bar plus the safe area, and focused elements scroll clear of it (reuse the Phase 1 `scroll-padding-bottom` pattern). Test: Task 3 e2e helper, used in Task 4/5.
4. **In-between widths overflow.** No horizontal page scroll at 390, 768, 1024, 1200 and 1440. Stat tiles and the scorecard grid wrap cleanly. Test: Task 4/5 e2e.
5. **Long or changed content.** A third career row or a fourth project must still render: no fixed row counts, the reel scrolls inside its panel if taller than the viewport. Tests: Task 4/5 view-builder unit tests with extra rows; the fixture story renders with the real row counts.

---

## File map

| File | Task | Purpose |
|---|---|---|
| `package.json`, `pnpm-lock.yaml` | 1 | `@radix-ui/react-tabs` |
| `src/content/schema.ts`, `content.json`, `schema.test.ts`, `ui-copy.ts` | 1 | `player.clubShort`, optional highlight `links`, `ui.venues`, `ui.pages.career/highlights`, `ui.tabs`, `ui.hud` additions |
| `src/design-system/primitives/SelectableList.tsx` (+ test) | 2 | Radix Tabs compound: `Root`, `List`, `Item`, `Panel` |
| `src/design-system/layout/{ContentLayout,PageTitle}.tsx`, `broadcast/{Breadcrumb,MobileTabBar,BallByBall,ProblemApproachResult,MediaSlot}.tsx` (+ tests) | 2 | frame + content composites |
| `src/design-system/primitives/LinkRow.tsx` | 2 | tones `band` (current) + `outline` + `primary` (Highlights rows) |
| `src/design-system/layout/Content.stories.tsx` | 2 | stories for all of the above |
| `src/shell/ContentPage.tsx`, `src/shell/ArenaTabBar.tsx` (+ tests) | 3 | frame wiring (routes, commentary, Quick View, venue backdrop) |
| `tests/e2e/support/contentPage.ts` | 3 | shared e2e helpers (overflow, tab bar clearance) |
| `src/features/career/*`, `app/routes/career.tsx`, `tests/stories/career.spec.ts`, `tests/e2e/career.spec.ts` | 4 | Career |
| `src/features/highlights/*`, `app/routes/highlights.tsx`, `tests/stories/highlights.spec.ts`, `tests/e2e/highlights.spec.ts` | 5 | Highlights |
| spec §11, carry-over | Orchestrator | logs, ticks |

---

### Task 1: Content, copy and the tabs dependency

**Files:**
- Modify: `package.json`, `src/content/schema.ts`, `src/content/content.json`, `src/content/schema.test.ts`, `src/content/ui-copy.ts`

**Interfaces — Produces:**
- `content.player.clubShort: string`
- `matchHighlights[].links?: { code?: string; demo?: string; caseStudy?: string }`: strict object, each value an https URL, all optional, the object optional
- `ui.venues`, `ui.pages.career`, `ui.pages.highlights`, `ui.tabs`, `ui.hud.nextVenue` (below)

- [ ] **Step 1: Failing tests** in `schema.test.ts`:
  - `clubShort` required
  - `links` optional; when present, `demo` must be https (rejects `http://` and `#`)
  - an unknown key inside `links` is rejected

- [ ] **Step 2:** `pnpm add @radix-ui/react-tabs`. If pnpm reports ignored build scripts, extend `allowBuilds` with a comment, as in Phase 0.

- [ ] **Step 3: Schema + content.** Add `"clubShort": "Deutsche"` to `player`. Add the optional `links` to the highlight schema. Content gets no `links` today (ruling P2).

- [ ] **Step 4: UI copy** (exact strings):
  ```ts
  venues: { cricket: "CRICKET GROUND", tennis: "CENTRE COURT", badminton: "BADMINTON HALL" },
  hud: { /* existing keys stay */ nextVenue: "NEXT VENUE" },
  tabs: { label: "Main", arena: "ARENA", career: "CAREER", projects: "PROJECTS", skills: "SKILLS", teamUp: "TEAM UP" },
  pages: {
    breadcrumb: "Breadcrumb",
    career: {
      eyebrow: "THE SCORECARD",
      stats: { proSince: "PRO SINCE", club: "CLUB", current: "CURRENT" },
      cols: { inn: "INN", team: "TEAM", role: "ROLE", span: "SPAN", status: "STATUS" },
      listLabel: "Innings",
      academy: "ACADEMY",
      legend: "NOT OUT = CURRENT ROLE · DEBUT = FIRST INNINGS",
      viewCard: "VIEW PLAYER CARD",
      innings: "INNINGS",
      ballByBall: "BALL BY BALL",
      shots: "SHOTS PLAYED",
    },
    highlights: {
      eyebrow: "THE TOURNAMENT RUN · BEST PROJECT PLAYS THE FINAL",
      unlocked: "UNLOCKED", of: "OF",
      draw: "THE DRAW",
      listLabel: "Projects",
      replay: "REPLAY",
      comingSoon: "REPLAY COMING SOON",
      serve: "THE SERVE · PROBLEM", rally: "THE RALLY · APPROACH", winner: "THE WINNER · RESULT",
      shotData: "SHOT DATA", stack: "STACK",
      code: "CODE ON GITHUB", demo: "LIVE DEMO", caseStudy: "FULL CASE STUDY",
      commFinal: "Match point. This one went the distance.",
    },
  },
  ```
  The breadcrumb's first crumb reuses `ui.placeholder.hub` ("HUB"). Page titles reuse `ui.routes.*.heading`.

- [ ] **Step 5: Verify:** `pnpm vitest run && pnpm typecheck && pnpm lint && pnpm build`. **Commit** `feat(content): content-page copy, club short name, optional project links, tabs dependency`.

---

### Task 2: Design-system pieces for content pages

**Files:**
- Create:
  - `src/design-system/primitives/SelectableList.tsx`, `SelectableList.test.tsx`
  - `src/design-system/layout/ContentLayout.tsx`, `layout/PageTitle.tsx`
  - `src/design-system/broadcast/Breadcrumb.tsx`, `broadcast/MobileTabBar.tsx`, `broadcast/BallByBall.tsx`, `broadcast/ProblemApproachResult.tsx`, `broadcast/MediaSlot.tsx`
  - `src/design-system/layout/Content.stories.tsx`, `layout/Content.test.tsx`
- Modify: `primitives/LinkRow.tsx` (+ Fluid stories/test), `broadcast/StatTile.tsx` only if the Career diff needs it, `tokens/base.css` only for new recipes, `index.ts`

**Interfaces — Produces** (Tasks 3–5 rely on these exact names):
```ts
// SelectableList — Radix Tabs underneath; vertical by default; every panel force-mounted (inactive = hidden).
SelectableList.Root: { value: string; onValueChange: (v: string) => void; orientation?: "vertical" | "horizontal"; className?: string; children }
SelectableList.List: { label: string; className?: string; children }          // role=tablist, aria-label
SelectableList.Item: { value: string; className?: string; children }          // role=tab; styles key off data-state=active:
                                                                              // 3px left edge volt + bg volt-a08(.06 drawn→ use nearest ramp, log) vs transparent;
                                                                              // hover bg white-a04; transition 200ms; min touch target 44px
SelectableList.Panel: { value: string; className?: string; children }         // role=tabpanel, forceMount, hidden when inactive
// Consumers colour inner parts with `group-data-[state=active]/item:` — Item root carries `group/item`.

ContentLayout: { header: ReactNode; title: ReactNode; children: ReactNode; footer?: ReactNode; tabBar?: ReactNode; backdrop?: ReactNode; className?: string }
  // ≥1200: max-w-360 centred, px-9; rows: header 76 / title (top 100) / panels (top 236, flex-1, min-h 554) / footer (bottom 36, 52 tall)
  // 768–1199: same frame, panels flow (consumer decides columns), page scrolls
  // <768: px-4, header row at top 16, title, panels stacked, footer CTA full width, padding-bottom clears tabBar (76 + safe area); tabBar fixed bottom
PageTitle: { eyebrow: ReactNode; eyebrowTone?: "volt" | "gold"; title: ReactNode; aside?: ReactNode; level?: 1 }   // h1 type-d1 (84); mobile 48 (recipe @media)
Breadcrumb<T = "a">: { mark: string; trail: string[]; hubLabel?: string; as/href|to for the first crumb; className? }
  // <nav aria-label> → mark + <ol> "HUB / X / Y": first crumb is the link (mark + "HUB" inside one link, label-in-name),
  // last crumb aria-current="page"; separators aria-hidden. Visual = audit #2 (M 12/.24em scout, gap 14). Mobile: trail hidden, mark only.
MobileTabBar: { label: string; items: { key: string; label: string; icon: IconName; href?: string; current?: boolean; as?: ElementType; to?: string }[] }
  // fixed bottom, h-19 (76) + safe area, bg = the drawn rgba(10,13,17,.94): add token `--surface-tabbar` (rgb of --ref-board-bezel at .94) + utility, log in §11.6,
  // border-top line, 5-col grid, item: Icon 20 + type-mono-xs (11px, A2) label, gap 5; current = text-volt + aria-current="page"; md:hidden
BallByBall: { items: string[]; className? }   // <ol>: grid 44px|1fr, gap 10, py 9, border-top line; over "0.1".."0.n" type-mono-stack volt + type-body-sm(14/1.42 → recipe) text-text-1
ProblemApproachResult: { serve: {label, text}; rally: {label, text}; winner: {label, text} }  // audit #43; 3 cols, gap 2px; winner cell bg volt-a08 + border volt-a35, label volt; stacks <768
MediaSlot: { label: string; badge: ReactNode; round: string; media?: { src: string; captions?: string; poster?: string } | null; className? }
  // null → striped placeholder (repeating 135° stripes, two stand tones), centred mono label, REPLAY chip with LiveDot top-left, round chip top-right volt,
  // 4px progress track with 38% volt fill — all decorative except the label text; set → <video muted controls playsInline preload="metadata"> with <track kind="captions">
LinkRow tones: "band" (existing ink-on-volt, default), "outline" (h 46 content-box → 48, px 14, border line-strong, type-mono-nav, hover border volt), "primary" (bg volt, ink, font bold mono)
```

- [ ] **Step 1: Failing component tests:**
  - **`SelectableList.test.tsx`** (Testing Library + user-event):
    - renders a tablist with an accessible name
    - ArrowDown moves the selection and calls `onValueChange` (controlled)
    - the selected tab has `aria-selected="true"` and `data-state="active"`
    - all panels exist in the DOM; only the active one is visible (`hidden` on the others)
    - Home/End jump to the first/last tab
  - **`Content.test.tsx`:**
    - Breadcrumb: is a `nav` named by its label; the first crumb is a link whose name contains "HUB"; the last crumb has `aria-current="page"`; separators are `aria-hidden`
    - MobileTabBar: is a `nav`; the current item has `aria-current="page"`; others don't
    - MediaSlot: with `media: null`, the placeholder label is visible and there's no `<video>`; with media, it renders `<video muted controls>` with a captions track
    - BallByBall: renders an `<ol>` with "0.1"… numbering
  - **LinkRow:** the `outline` tone has no ink classes, and `primary` has a volt background.

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement.** Port exact values from the artboards and audit rows listed in the header.
  - Selected-row background `rgba(215,255,63,0.06)`: the ramp has a04/a08, so add `--ref-volt-a06` to the volt ramp (tokens + theme). Never use an inline colour.
  - Hover background `rgba(255,255,255,.04)` = `white-a04`.
  - Any new recipe needed (e.g. the 14/1.42 ball text, the 13px reel `kind` line) goes in `base.css` with its mobile block. Add it to `Text.tsx` and the catalog.

- [ ] **Step 4: Stories** in `Content.stories.tsx`:
  - SelectableList (scorecard-style rows and reel-style rows, interactive)
  - Breadcrumb (depth 1/2/3)
  - MobileTabBar (each current item, 390 viewport)
  - PageTitle (with stat-tile aside, legend aside, text aside; gold eyebrow)
  - ContentLayout skeleton
  - BallByBall
  - ProblemApproachResult
  - MediaSlot (placeholder + with a tiny inline poster image; no external video)
  - LinkRow tones

- [ ] **Step 5: Verify:** `pnpm vitest run && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build-storybook && VERIFY=1 pnpm test:stories`. **Commit** `feat(design-system): SelectableList (Radix Tabs), content-page layout, breadcrumb, mobile tab bar, ball-by-ball, problem/approach/result, media slot`.

---

### Task 3: Shell content-page frame

**Files:**
- Create: `src/shell/ContentPage.tsx`, `src/shell/ArenaTabBar.tsx`, `src/shell/ContentPage.test.tsx`, `tests/e2e/support/contentPage.ts`
- Modify: `src/design-system/tokens/base.css` (only if the mobile tab bar needs the `scroll-padding-bottom` rule; reuse the Phase 1 `[data-bottom-actions]` pattern by giving MobileTabBar the same data attribute)

**Interfaces — Produces:**
```ts
// src/shell/ContentPage.tsx
export interface ContentPageProps {
  route: RouteKey;                       // h1 = ui.routes[route].heading; breadcrumb trail ends with it
  venue?: "turf" | "court" | "hall";     // data-venue on the page root + backdrop glows; undefined = no venue glow
  trail: string[];                        // middle crumbs, e.g. [ui.venues.cricket]
  eyebrow: ReactNode; eyebrowTone?: "volt" | "gold";
  aside?: ReactNode;                      // PageTitle right slot
  rematch?: string;                       // route path for REMATCH (omitted on pages without it)
  next?: { label: ReactNode; to: string };// skewed CTA bottom-right (full-width, unskewed on mobile)
  comm?: string;                          // said once on mount via useCommentary().say(line, { interrupt: true })
  backdrop?: ReactNode;                   // overrides the default venue backdrop (Trophy/Card/Team Up in 2B/2C)
  children: ReactNode;                    // the panels
}
export function ContentPage(props: ContentPageProps): JSX.Element;
// src/shell/ArenaTabBar.tsx — MobileTabBar with ArenaLink items: arena→/arena, career→/career, projects→/highlights,
// skills→/attributes, teamUp→/team-up; current from useLocation().pathname.
export function ArenaTabBar(): JSX.Element;
```

- [ ] **Step 1: Failing tests** in `ContentPage.test.tsx`, rendered in a memory router + `ArenaShell`:
  - renders `<main id="main">` with one `h1` = the route heading
  - the breadcrumb's first crumb links to `/arena`; REMATCH links to `rematch` when given and is absent otherwise
  - QUICK VIEW links to `/scout`
  - the next CTA links to `next.to`
  - the page root has `data-venue` when given
  - the tab bar marks `/career` current on the career route

- [ ] **Step 2: Implement.**
  - **Default backdrop** (desktop and mobile; fixed full-bleed layer behind content):
    - `SkyGlow` at the drawn values (60% 40% at 50% −10%, α .12–.14 per page; pass through `ContentPage` props if they differ)
    - `VenueGlow` (Career: 80% 50% at 50% 115%, α .40; Highlights: 70% 50% at 50% 110%, α .45)
    - Keep these as props with page-specific values passed from the features.
  - **Header** = `HUD` with:
    - left: Breadcrumb (`as={ArenaLink} to={ROUTES.arena}`)
    - right: REMATCH `HUDButton` (if any) + `QuickViewChip`
    - On mobile: the mark only, plus QUICK VIEW in the mobile bordered style.
  - **Footer:**
    - `CommentarySlot` (left, desktop only, as the service already does)
    - `Button as={ArenaLink} size="s" skew="desktop"` with `next.label` + `ui.glyph.next` (glyph `aria-hidden`)
  - The page `h1` gets the RouteAnnouncer focus behaviour for free: it focuses the first `main h1`.

- [ ] **Step 3: `tests/e2e/support/contentPage.ts`:**
  - `expectNoHorizontalOverflow(page, widths)`
  - `expectTabBarClear(page)`: at 390, scroll to the end; the last focusable in `main` has bottom ≤ the tab bar's top; focusing it keeps it clear
  - `expectMainLandmarks(page)`

- [ ] **Step 4: Verify** focused tests + `pnpm typecheck && pnpm lint`. **Commit** `feat(shell): ContentPage frame and route-aware mobile tab bar`.

---

### Task 4: Career (`/career`)

**Files:**
- Create in `src/features/career/`:
  - `view.ts`, `view.test.ts`
  - `CareerPage.tsx` (`CareerPage` + `CareerScreen`)
  - `Scorecard.tsx`, `InningsDetail.tsx`
  - `CareerPage.fixture.ts`, `CareerPage.stories.tsx`
- Create: `tests/stories/career.spec.ts`, `tests/e2e/career.spec.ts`
- Modify: `app/routes/career.tsx`; `tools/render-artboards/render.mjs` (add `REGIONS["Cricket-Career"]` only if region checks are used)

**Interfaces:**
```ts
export interface CareerView {
  stats: { label: string; value: string; tone: "glass" | "volt" }[];              // PRO SINCE · JUL 2024 / CLUB · DEUTSCHE / CURRENT · NOT OUT (volt)
  cols: { inn: string; team: string; role: string; span: string; status: string };
  listLabel: string;
  rows: { id: string; n: string; team: string; role: string; span: string; status: string; current: boolean;
          detail: { heading: string; span: string; roleLine: string; balls: string[]; shotsLabel: string; stack: string[] } }[];
  academy: { n: string; team: string; role: string; span: string; status: string; to: string } | null;   // 03 · PICT, Pune · B.Tech… · 2020 – 2024 · ACADEMY → /trophies#academy (null only in the artboard fixture)
  legend: string;
  viewCard: { label: string; to: string };
  defaultId: string;                                                            // first row
}
export function buildCareerView(c: Content, copy: UiCopy, routes: typeof ROUTES): CareerView;
```

- [ ] **Step 1: Failing `view.test.ts`** (real content):
  - **stats:** `stats[0]` = `{ label: "PRO SINCE", value: "Jul 2024" }` (case by CSS); `stats[1].value` = `"Deutsche"`; `stats[2]` = `{ label: "CURRENT", value: "NOT OUT", tone: "volt" }`
  - **rows:** two rows, ids `"01"`, `"02"`. Row 0: span "Jul 2024 – now"; `detail.heading` = "INNINGS 01 · BALL BY BALL"; `roleLine` = "Software Engineer 1 · Pune, MH"; `balls` = `ballByBall`.
  - **academy:** `academy.n` "03"; `academy.to` "/trophies#academy"; `academy.status` "ACADEMY"
  - **extra content:** with a third career row added to a cloned content, rows has 3 and `academy.n` becomes "04"
  - **current tile:** the CURRENT stat follows the row with `end === null`

- [ ] **Step 2: Implement** `view.ts` (pure). Reuse `getCareerRows`, `getInningsReveals` and `formatMonth`.

- [ ] **Step 3: Screen.** `CareerPage({ view })` = `ContentPage` with:
  - `route="career"`, `venue="turf"`, `trail={[ui.venues.cricket]}`
  - `eyebrow` = `ui.pages.career.eyebrow`
  - `aside` = 3 `StatTile`s (tick stagger 0/.1/.2s via the `animate-rise` preset; reduced motion = none)
  - `rematch` = `ROUTES.cricket`
  - `next` = `{ label: "NEXT VENUE · CENTRE COURT", to: ROUTES.tennis }`, label built from `ui.hud.nextVenue` + `ui.glyph.sep` + `ui.venues.tennis`
  - `comm` = `content.commentary.reveal[1]` ("Career high score updated.")

  Panels:
  - **Scorecard (glass, 800 wide at ≥1200):**
    - a decorative column header (`aria-hidden`, type-mono-label scout)
    - `SelectableList.List` of rows. Grid `56px | 1.4fr | 1.2fr | 1.3fr | 110px`, gap 16, min-h 84, px 22. Number type-d3 (34) dim → volt when active; team type-d4s; role type-body-md text-2; span type-mono-stack text-2; status mono 11/.16em, volt for NOT OUT.
    - then the academy link row (same grid, idle colours, `ArenaLink`)
    - then the footer: legend `type-mono-xs text-dim` + "VIEW PLAYER CARD →" volt `ArenaLink` → `/card`
  - **Detail (glass, rest of the width, padding 22/24):** one `SelectableList.Panel` per row:
    - header row: volt "INNINGS 01 · BALL BY BALL" + span
    - `h2` team (40/900/.95, new recipe if none fits) + role line
    - `BallByBall`
    - "SHOTS PLAYED" + `ChipList` (Chip `size="md"` outline, h 32)
  - **Tablet:** scorecard and detail full width, stacked. **Mobile:** scorecard rows collapse to a 3-line card per row (number + status / team / role · span); the column header is hidden; the detail follows; the tab bar is fixed.

- [ ] **Step 4: Fixture + stories.**
  - `CareerPage.fixture.ts` holds the exact artboard strings: header, rows and selected row 0.
  - The academy row and the "DEUTSCHE" tile are present in real content but not drawn. In the fixture, set the academy row `null`; the view type allows `academy: … | null` for this reason, and the screen renders nothing when it's null.
  - Stories: `RealContent` (`CareerScreen`), `ArtboardParity` (`CareerPage` with the fixture). Use a memory router + `ArenaShell` decorator, as in `QuickView.stories.tsx`. Extract that decorator to `src/shell/storyDecorators.tsx` once both features need it.

- [ ] **Step 5: Parity tests** `tests/stories/career.spec.ts`:
  - desktop project only, `ArtboardParity` vs `Cricket-Career` at 1440×900, ≤2%
  - masks only for the COMM line: it animates in and out; mask its box. Each mask is commented with its reason.
  - Fix layout before masking. If over 2%, inspect `test-results/visual/*.diff.png`.

- [ ] **Step 6: Route + e2e.** `app/routes/career.tsx` = `meta = pageMeta("career")` + `<CareerScreen />`.

  `tests/e2e/career.spec.ts`:
  - **No JS:** `h1` "CAREER STATS"; both rows' team names and **all 7 ball-by-ball lines** are in the HTML (`toBeAttached`); the academy link `href="/trophies#academy"`.
  - **Keyboard:** focus the first tab, press ArrowDown; the second row is `aria-selected` and the visible panel shows "Graduate Analyst Intern".
  - **Fidelity (desktop, real route):** full board vs `Cricket-Career` ≤2%. Mask only logged deviations: COMM line; the academy row (P3); the CLUB tile value if it differs. The rest of the real content equals the artboard; confirm by eye.
  - **Overflow** at 390/768/1024/1200/1440 (helper).
  - **Mobile:** tab bar visible, CAREER `aria-current`; `expectTabBarClear`.
  - **Links:** REMATCH → `/arena/cricket`; NEXT VENUE → `/arena/tennis`; VIEW PLAYER CARD → `/card`.

- [ ] **Step 7: Verify:** `pnpm verify`. If 4173 is busy, ask the orchestrator. **Commit** `feat(career): scorecard + ball-by-ball page with academy link, tablet and mobile layouts`.

---

### Task 5: Highlights (`/highlights`)

**Files:**
- Create in `src/features/highlights/`:
  - `view.ts`, `view.test.ts`
  - `HighlightsPage.tsx` (`HighlightsPage` + `HighlightsScreen`)
  - `Draw.tsx`, `Replay.tsx`, `ShotData.tsx`
  - `HighlightsPage.fixture.ts`, `HighlightsPage.stories.tsx`
- Create: `tests/stories/highlights.spec.ts`, `tests/e2e/highlights.spec.ts`
- Modify: `app/routes/highlights.tsx`

**Interfaces:**
```ts
export interface HighlightsView {
  unlocked: string;                       // "3 OF 3 UNLOCKED"
  drawLabel: string; listLabel: string;
  items: { id: string; round: string; name: string; kind: string; line: string;
           media: { label: string; badge: string; round: string; video: { src: string; poster?: string; captions?: string } | null };
           par: { serve: { label: string; text: string }; rally: { label: string; text: string }; winner: { label: string; text: string } };
           facts: { k: string; v: string }[]; stackLabel: string; stack: string[];
           links: { label: string; href: string; tone: "outline" | "primary"; glyph: string }[];   // code always; demo/caseStudy only if in content
           comm: string }[];
  defaultId: string;                      // THE FINAL (spec §11.2 #3)
  shotDataLabel: string;
}
export function buildHighlightsView(c: Content, copy: UiCopy): HighlightsView;
```

- [ ] **Step 1: Failing `view.test.ts`:**
  - items in QF → SF → FINAL order (via `getHighlights`)
  - `defaultId` is the FINAL's id
  - **links:** each item has exactly one link, CODE ON GITHUB → `contact.github`. With a cloned project holding `links.demo` and `links.caseStudy`, three links in the order code/demo/caseStudy; caseStudy is tone `primary` with glyph `→`, the others `outline` with `↗`.
  - **media:** `media.label` = `"AI Interview Grooming Platform · REPLAY COMING SOON"` (name + sep + copy; case by CSS); `media.video` null
  - **comm:** FINAL = `ui.pages.highlights.commFinal`, others = `content.commentary.reveal[0]`
  - `unlocked` = "3 OF 3 UNLOCKED"
  - with a fourth project in cloned content, 4 items render (no fixed counts)

- [ ] **Step 2: Implement** `view.ts` (pure; ids = slug of name).

- [ ] **Step 3: Screen.** `HighlightsPage({ view })` = `ContentPage`:
  - `route="highlights"`, `venue="court"`, `trail={[ui.venues.tennis]}`, `eyebrow`, aside = `unlocked` (type-mono-md scout)
  - `rematch` = `ROUTES.tennis`
  - next = NEXT VENUE · BADMINTON HALL → `ROUTES.badminton`
  - controlled `SelectableList` with `useState(view.defaultId)`; on change, `say(item.comm)`. Mount says the default item's comm.

  Panels at ≥1200: draw 300 │ replay 720 │ shot data rest, gaps 24 as drawn.
  - **Draw (glass):** "THE DRAW" header 44 tall, then items: column, min-h 96, py 14 px 18; round mono 11/.18em dim → volt when active; name type-d4s (24/800/.02em: adjust the recipe if tracking differs); kind 13 scout. The list scrolls inside the panel if taller.
  - **Replay:** one Panel per item:
    - `MediaSlot` (230 tall)
    - `h2` name (44/900/.9: recipe) + line 17 text-2
    - `ProblemApproachResult`
  - **Shot data (glass, p 20):**
    - "SHOT DATA"
    - facts as `KeyValueList variant="stacked"` (check it matches drawn: M 11/.14em label + B 14 value, border-bottom; adjust the component if not)
    - "STACK" + chips (h 30, px 10: Chip `size="sm"`)
    - links pinned to the bottom (`mt-auto`) as `LinkRow` outline/primary

  Tablet: draw │ replay in 2 columns, shot data full width below. Mobile: draw as the tab list (full width rows), then replay, then shot data; tab bar with PROJECTS current.

- [ ] **Step 4: Fixture + stories:** exact artboard strings, including the artboard's LIVE DEMO / FULL CASE STUDY rows (fixture links with `href: "#teamup"`-style safe in-page anchors; story only) and the artboard placeholder label. Stories: `RealContent`, `ArtboardParity`.

- [ ] **Step 5: Parity** `tests/stories/highlights.spec.ts`: `ArtboardParity` vs `Tennis-Highlights` at 1440×900, ≤2%, masks only for the COMM line.

- [ ] **Step 6: Route + e2e.** `app/routes/highlights.tsx` = meta + `<HighlightsScreen />`. `tests/e2e/highlights.spec.ts`:
  - **No JS:** `h1` "MATCH HIGHLIGHTS"; all 3 project names and all 3 serve/rally/winner texts attached; THE FINAL panel visible by default.
  - **Keyboard:** ArrowUp from THE FINAL selects SEMI-FINAL; the panel shows "KUDO BOARD"; the live region announces "Another project shipped." (`CommentarySlot` polite region).
  - **Fidelity (desktop, real route)** ≤2%. Masks: COMM line; the replay placeholder label (P1); the LIVE DEMO + FULL CASE STUDY rows area (P2); any text that differs by content wording (list each mask with its §11 entry).
  - **Overflow** at all widths; **mobile:** PROJECTS `aria-current`, `expectTabBarClear`.
  - **Links:** CODE ON GITHUB → the GitHub URL; no `href="#"` anywhere on the page.

- [ ] **Step 7: Verify:** `pnpm verify` + `pnpm build && pnpm lighthouse` (budget unchanged; `/scout` only). **Commit** `feat(highlights): tournament draw, replay slot and shot data page, tablet and mobile layouts`.

---

## Phase 2A exit checklist (orchestrator)

1. Visual check by eye: `/career` and `/highlights` at 1440, 1200, 1024, 768 and 390 vs artboards.
2. Docs:
   - spec §11: P1–P6, new tokens (volt a06, surface-tabbar), masks
   - carry-over ticks (venue per route, StatTile tracking)
3. One **Opus review** of the 2A diff → at most one fix wave.
4. `pnpm verify` green.
5. Progress meter → Yash previews → merge `phase/2-content` to `main` (fast-forward). Then write the 2B plan.

---

## Trivia: terms used in this plan

- **Tabs (ARIA tabs):** a pattern where a list of "tab" buttons controls which panel shows. Screen readers announce "tab, 2 of 3, selected", and arrow keys move between tabs. Radix Tabs is a small library that gets all of this right.
- **Force-mounted panel:** every panel is in the HTML from the start, and the hidden ones get the `hidden` attribute. Crawlers and no-JS visitors still have all the text.
- **Frame / layout component:** the shared skeleton of a page (header, title, footer) that each page fills with its own content, so the skeleton is built once.
- **Breadcrumb:** the "HUB / CRICKET GROUND / CAREER STATS" trail that shows where you are; the first part is a link back.
- **Content-box:** in the artboards, a border is added *outside* the stated size, so a "44px" bordered button is really 46px. Tailwind counts borders inside, so we add 2px in the component.
- **Venue (`data-venue`):** an attribute on the page that switches the stadium colours (turf green, court blue, hall amber).
