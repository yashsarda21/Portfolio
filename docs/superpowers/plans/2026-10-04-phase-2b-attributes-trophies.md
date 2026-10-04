# Phase 2B — Attributes & Trophy Room Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**What this plan does (plain words):**
- **Attributes (`/attributes`, the badminton hall):**
  - your player profile on the left: portrait, "SE · POSITION", name, playing style, languages and kit bag
  - four skill groups on the right (BACKEND / FRONTEND / DATA / CRAFT), each skill with its 10-segment bar that fills in
  - the legend in the title row
- **Trophy Room (`/trophies`):**
  - the glass trophy cabinet with two shelves and six trophies, all drawn in code: cup, medal, plaque, pennant, round award, and the locked GIANT KILLER outline
  - pick a trophy and it gets the spotlight, slowly turns on its plinth, and its story shows in the "ON THE PLINTH" panel
  - the Training Academy panel below it, which `/career`'s "SEE IT IN THE TROPHY ROOM →" now lands on (`/trophies#academy`)
- **Both pages:**
  - reuse the Phase 2A frame (breadcrumb header, title, COMM line, next button, phone tab bar)
  - get tablet and phone layouts
  - are checked against your artboards at 1440×900 within 2%

**Goal:** `/attributes` and `/trophies` render from real content inside the 2A frame. Trophies are keyboard-selectable tabs with the spotlight and turntable (reduced motion: static). `/trophies#academy` lands on the academy panel. Artboard-copy fixture stories match `Badminton-Attributes@1440x900` and `Trophy-Room@1440x900` within 2%, and the real routes match with only logged deviations masked. No overflow at any width, axe is clean, and `pnpm verify` stays green.

**Architecture:**
- **Same pattern as Career/Highlights:** a pure view builder, a pure screen, a `…Screen` wrapper, an artboard-copy fixture and parity stories (`src/shell/storyDecorators.tsx`).
- **New generic design-system pieces:**
  - `PortraitFrame`: cut-out portrait with a lighten blend and a fade mask, plus a corner badge. Player Card (2C) and Intro (3) reuse it.
  - The trophy scene set (scene tier, decorative): `Trophy` art in 6 kinds, `Plinth`, `Spotlight`, `ShelfLight` and `CabinetGlass`, coloured by a new **gold ramp** that only exists inside `[data-zone="trophy"]`.
  - `AcademyCard`
  - motion presets `animate-spot-drop` (400ms) and `animate-turntable` (12s, rotateY)
- **Trophy selection** = the existing `SelectableList` in horizontal orientation over a 3×2 grid. The locked trophy is a **disabled** tab: it's announced, but you can't select it or arrow onto it.
- **`ContentPage`** gains `zone?: "trophy"` (sets `data-zone`) and a footer-less layout. Without `next`/`comm`, the panels run to the bottom gutter as drawn.

**Tech Stack:** React 19, React Router 8 (prerender), Tailwind v4 Arena tokens, Radix Tabs (via `SelectableList`), Vitest + Testing Library, Playwright + axe + pixelmatch.

**Spec:** `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md`:
- §2 D2
- §5.1 (`[data-zone="trophy"]`: gold only there)
- §5.3 (TrophyCabinet + Trophy, TrophyDetail, AcademyCard, PortraitFrame)
- §7 (spotlight drop 400ms + 12s turntable, §11.2 #19)
- §8.3 (skill group order)
- §11.1 A1/A2/A3/A6
- §11.2 #1, #8, #9, #10, #13
- §11.3 (Trophy Room forward CTA "PLAYER CARD →")
- §11.8 (Phase 2A rules: same-tab links, typed `leading`, no pixel fitting in features)
- §12 (derived trophy descriptions, mobile pattern, Giant Killer unlocked art is Phase 6)

**Measuring tape:**
- `design/handoff/design-source/Badminton-Attributes.dc.html`
- `design/handoff/design-source/Trophy-Room.dc.html`
- audit §3 (SkillRow, SegmentBar, Legend, KeyValueRow #34, AcademyCard #49, the trophy cabinet rows) and §4 (scene)

**Builders read those artboards.**

**Carry-over absorbed:**
- "Phase 2: same-page hash links (`/trophies#academy`) — verify on the real page"
- "Career `status` enum only allows NOT OUT / DEBUT": checked, nothing to change (still two roles)

---

## Rulings for Yash to confirm

| # | Decision | Why | Easy to flip? |
|---|---|---|---|
| T1 | Trophy Room gets the **"PLAYER CARD →"** next button bottom-right, like every other content page (spec §11.3). The cabinet and academy panels end 74px higher than drawn to make room. The artboard-copy story keeps the drawn layout, so the pixel check stays exact. | Every room has a way forward. | Yes |
| T2 | Shelf labels use the **short** artboard wording ("MHT-CET 2020 · STATE RANK 709", "AI INTERVIEW PLATFORM · JOURNAL"), stored in content as a new optional `shortSub`. The ON THE PLINTH panel shows the full content wording. | The 290px shelf column can't fit the long sub on one line. Both wordings come from your data. | Yes |
| T3 | **GIANT KILLER** stays the dashed locked outline, a disabled tab announced as "hidden, beat Yash to unlock". The gold unlocked trophy comes in Phase 6, once a visitor actually wins. | Spec §12. | — |
| T4 | Attributes profile: new content fields `player.position: "SE"` and `player.playingStyle: "Full-stack"`. Languages and kit bag come from content (the kit bag in content order). | No hard-coded copy. | Yes |
| T5 | The portrait (`rest.webp`, 66KB) is copied once into `src/assets/` and served with a hashed name. It's lazy-loaded below the fold on phones. | App code never imports `design/handoff`. Player Card reuses it. | — |
| T6 | **Phone (<768):** Attributes = profile card, then the 4 groups stacked; tab bar SKILLS current. Trophy Room = trophies in a 2-column grid (smaller art), then ON THE PLINTH, then the Academy; no tab is current. **Tablet:** Attributes profile full width above a 2×2 grid; Trophy Room cabinet full width, with detail and academy side by side below. | Spec §12 derived designs. | Medium |

---

## Global Constraints

All Phase 0–2A constraints apply. Key ones:
- Arena tokens only.
- Literal class strings.
- **No pixel fitting in feature code.** The `src/features/styleRules.test.ts` guard must stay green. Line-box via `Text`'s typed `leading="font"`; content-box +2px and recipe/breakpoint switches live in recipes/components.
- No raw hex/rgb/cubic-bezier in TS/TSX, no arbitrary type sizes, no inline `var(--color-*)`.
- **Gold only inside `[data-zone="trophy"]`.** The new gold ramp tokens are defined only in that zone, and a contrast test covers any gold text pair.
- **Links stay in the same tab** (only document view/download opens a new tab, spec §11.8).
- Polymorphic `as`, `className` via `cn`, React 19 ref-as-prop.
- Mono ≥11px (A2: the artboard's 10px "POSITION" becomes 11px), contrast ≥4.5:1 (A1: the locked trophy's `#3A434C` stays decoration only, and its label text uses `--text-dim`), volt focus ring, reduced motion respected (no turntable, no segment fill, spotlight shown static).
- New design-system components: story for every variant/state, barrel export, a11y gate, no outer margins. Scene pieces are `aria-hidden`.
- **No visible copy in components or routes.** Fixtures are imported by stories only.
- Folder rules as before. `src/assets/*` may be imported by features.
- **Lean testing:**
  - unit tests for view builders and new selectors
  - component tests for the trophy tablist (disabled locked tab, arrows) and PortraitFrame alt text
  - parity stories
  - e2e: no-JS content, keyboard, fidelity, hash landing, overflow, tab bar
- git 2.15. Branch `phase/2-content`. Commits end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Ports: 4173 (e2e) / 6007 (stories) — check, never kill others' processes; 6006 is Yash's Storybook.

## Review Focus

1. **Hash landing:**
   - from `/career`, "SEE IT IN THE TROPHY ROOM →" (wipe navigation) ends with the Academy panel's heading in view below the header
   - a cold load of `/trophies#academy` does the same
   - Test: Task 4 e2e "academy hash lands"
2. **The locked trophy:**
   - it can't be selected by click or arrows (the disabled tab is skipped)
   - it's announced with its hidden state
   - the detail counter reads "n / 5", not "/ 6"
   - Tests: Task 4 unit + e2e
3. **Motion safety:**
   - with `prefers-reduced-motion`, nothing turns and no segments animate; the selected trophy still gets its spotlight (static)
   - the turntable only runs on the selected trophy
   - Test: Task 4 e2e reduced-motion (computed `animation-name: none`)
4. **Gold leaks:** no gold token resolves outside the trophy zone (existing token e2e guard extended to the new gold ramp). Test: Task 2.
5. **Images:**
   - the portrait has meaningful alt text ("Yash Sarda") only where it's the one portrait on the page; decorative duplicates are `alt=""`
   - it never causes horizontal overflow
   - it doesn't block first paint (`loading="lazy"` on phones, explicit width/height)
   - Tests: Task 2 component; Task 3 e2e overflow

---

## File map

| File | Task | Purpose |
|---|---|---|
| `src/content/{schema.ts,content.json,schema.test.ts,selectors.ts,selectors.test.ts,ui-copy.ts}` | 1 | `player.position`, `player.playingStyle`, trophy `shortSub?`, `getAcademy()` (name without the "(PICT)" suffix), `ui.pages.attributes`, `ui.pages.trophies` |
| `src/assets/portrait-rest.webp` | 1 | copied from `design/handoff/assets/character-rig/rest.webp` |
| `src/design-system/tokens/{tokens.css,theme.css,motion.css,catalog.ts}`, `tests/e2e/tokens.spec.ts` | 2 | gold ramp (trophy zone), silver set, spot-drop + turntable presets, gold-leak guard |
| `src/design-system/scene/{Trophy,Plinth,Spotlight,ShelfLight,CabinetGlass}.tsx`, `scene/Trophy.stories.tsx` | 2 | trophy scene set |
| `src/design-system/broadcast/{PortraitFrame,AcademyCard}.tsx` (+ tests/stories) | 2 | composites |
| `src/shell/ContentPage.tsx` (+ test), `src/design-system/layout/ContentLayout.tsx` | 2 | `zone` prop, footer-less layout |
| `src/features/attributes/*`, `app/routes/attributes.tsx`, `tests/{stories,e2e}/attributes.spec.ts` | 3 | Attributes |
| `src/features/trophies/*`, `app/routes/trophies.tsx`, `tests/{stories,e2e}/trophies.spec.ts` | 4 | Trophy Room |
| spec §11, carry-over | Orchestrator | logs, ticks |

---

### Task 1: Content, copy, selector and the portrait asset

**Files:**
- Modify: `src/content/schema.ts`, `content.json`, `schema.test.ts`, `selectors.ts`, `selectors.test.ts`, `ui-copy.ts`
- Create: `src/assets/portrait-rest.webp` (copy; check the folder rules allow `@/assets` from features, and add a lint zone line if needed)

**Interfaces — Produces:**
- `player.position: string`, `player.playingStyle: string`
- `trophyRoom[].shortSub?: string`
- `getAcademy(c): { name: string; shortName: string; city: string; degree: string; degreeShort: string; span: string; cgpa: string; honours: string; extras: string[] }`. `name` is the school without a trailing `" (SHORT)"` suffix; `span` = `formatSpan(start, end)`.
- `ui.pages.attributes`, `ui.pages.trophies` (below)

- [ ] **Step 1: Failing tests:**
  - schema: `position`/`playingStyle` required; `shortSub` optional, non-empty when present
  - selectors: `getAcademy(content).name === "Pune Institute of Computer Technology"`; a school without a suffix is returned unchanged; `span === "Jul 2020 – Jun 2024"`

- [ ] **Step 2: Implement.** Content values:
  - `"position": "SE"`, `"playingStyle": "Full-stack"`
  - medal `"shortSub": "MHT-CET 2020 · State Rank 709"`
  - plaque `"shortSub": "AI Interview Platform · Journal"`

- [ ] **Step 3: UI copy** (exact strings):
  ```ts
  pages: { /* existing */
    attributes: {
      eyebrow: "EVERY SKILL IS A SHOT IN THE BAG",
      legend: { shipped: "SHIPPED AT DEUTSCHE BANK", built: "BUILT IN PROJECTS", kit: "IN THE KIT BAG" },
      position: "POSITION",
      portraitAlt: "Yash Sarda",
      profile: { playingStyle: "Playing style", languages: "Languages", kitBag: "Kit bag" },
      shot: "SHOT",
      comm: "Full kit bag. Still undefeated.",
      next: "ENTER THE TROPHY ROOM",
    },
    trophies: {
      eyebrow: "ACHIEVEMENTS · LIT ONE BY ONE",
      listLabel: "Trophies",
      plinth: "ON THE PLINTH",
      lockedHint: "hidden, beat Yash to unlock",
      academy: { eyebrow: "EDUCATION", aside: "WHERE THE FUNDAMENTALS CAME FROM", extras: "EXTRA DRILLS" },
      next: "PLAYER CARD",
    },
  },
  ```
  `ui.pages.trophies.academy` title reuses `ui.scout.academy.title` ("TRAINING ACADEMY"). If a shared spot reads better, move it to `ui.pages.academyTitle` and update `/scout`.

- [ ] **Step 4:** Copy the asset. **Verify:** `pnpm vitest run && pnpm typecheck && pnpm lint && pnpm build`. **Commit** `feat(content): attributes and trophy copy, short shelf labels, academy selector, portrait asset`.

---

### Task 2: Design system and frame additions

**Files:**
- Create:
  - `src/design-system/scene/Trophy.tsx` (one component, `kind: "cup" | "medal" | "plaque" | "pennant" | "round" | "locked"`, optional `label` for the medal "99.5" and the plaque "PAPER" text from props)
  - `src/design-system/scene/Plinth.tsx`, `Spotlight.tsx` (`intensity: "lead" | "support"`, `size: "lg" | "md"`), `ShelfLight.tsx`, `CabinetGlass.tsx`
  - `src/design-system/scene/Trophy.stories.tsx`
  - `src/design-system/broadcast/PortraitFrame.tsx` (`src`, `alt`, `badge?: { value; label }`, `size: "attr" | "card"`)
  - `src/design-system/broadcast/AcademyCard.tsx` (props: `eyebrow`, `aside`, `title`, `monogram`, `name`, `degree`, `meta`, `extrasLabel`, `extras`, `id?`, `headingLevel?`)
  - their tests and stories
- Modify:
  - `tokens/tokens.css`: gold ramp + silver set inside `[data-zone="trophy"]` only (the exact artboard values: `#7A5E2A`, `#F0D998`, `#B8934A`, `#6A5023`, `#E8CF8E`, `#D9BE7C`, `#C9A55A`, `#8C6E33`, `#2B1E12`, `#140E08`; silver `#F4F6F7`, `#A9B2BA`, `#5E6770`, `#2A3138`, ribbon `#1E2A3A`). Name them by role (`--trophy-gold-1..`, `--trophy-silver-…`) and map them in `@theme inline`. Gradients live in `scene.css` utilities; components set no colours inline.
  - `tokens/motion.css`: `animate-spot-drop` (opacity 0→1, 400ms, ease-follow, stagger via `--i`), `animate-turntable` (rotateY 0→360deg, 12s linear infinite, `transform-style: preserve-3d`). Reduced motion: both disabled; the spotlight is static visible.
  - `tokens/catalog.ts`, `tests/e2e/tokens.spec.ts`: extend the gold-leak guard to every new trophy token.
  - `src/design-system/layout/ContentLayout.tsx` + `src/shell/ContentPage.tsx`: `zone?: "trophy"` sets `data-zone` on the page root; without `footer`, panels end at the 36px bottom gutter (≥1200) as on Trophy-Room. Keep `ContentPage.test.tsx` green, and add tests for `zone` and the footer-less frame.
  - `index.ts` exports

**Interfaces — Produces:** the components above with exactly those props; `ContentPageProps.zone`.

- [ ] **Step 1: Failing tests:**
  - `PortraitFrame`: renders an `img` with the given alt and explicit `width`/`height`; the badge value/label render; `alt=""` makes it decorative
  - `AcademyCard`: renders a section with `id`; the heading level is configurable; the extras list renders
  - `Trophy`: renders `aria-hidden` art for each kind
  - `ContentPage`: `zone="trophy"` sets `data-zone="trophy"`; without `next`/`comm` there is no footer

- [ ] **Step 2: Implement.** Port the trophy drawings 1:1 from `Trophy-Room.dc.html`: shapes, sizes, radii, borders, gradients, plinths 90×26 / 90×22. The locked trophy's dashed `#3A434C` stays decoration (`border-line-3`).
  - `CabinetGlass` = the 115° reflection overlay.
  - `ShelfLight` = the 6px bar with a glow (use existing `--rgb-beam`/halo values; log any merge in §11.6).
  - `Spotlight` = the clip-path cone with `--rgb-spot` at .30 (lead) / .18 / .16, sizes 220×300 / 200×260.

- [ ] **Step 3: Stories:** every trophy kind (inside a `data-zone="trophy"` wrapper), spotlight intensities, a full mini-cabinet, the turntable on and off, PortraitFrame both sizes, and AcademyCard.

- [ ] **Step 4: Verify:** `pnpm vitest run && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build-storybook && VERIFY=1 pnpm test:stories`. **Commit** `feat(design-system): trophy scene set, gold ramp in the trophy zone, portrait frame, academy card; content frame zone + footer-less layout`.

---

### Task 3: Attributes (`/attributes`)

**Files:**
- Create in `src/features/attributes/`:
  - `view.ts`, `view.test.ts`
  - `AttributesPage.tsx` (`AttributesPage` + `AttributesScreen`)
  - `PlayerProfile.tsx`, `AttributeGroups.tsx`
  - `AttributesPage.fixture.ts`, `AttributesPage.stories.tsx`
- Create: `tests/stories/attributes.spec.ts`, `tests/e2e/attributes.spec.ts`
- Modify: `app/routes/attributes.tsx`

**Interfaces:**
```ts
export interface AttributesView {
  legend: { label: string; swatch: "volt" | "floodlight" | "dim" }[];
  profile: { portrait: { src: string; alt: string }; badge: { value: string; label: string }; name: string; roleLine: string;
             rows: { k: string; v: string }[]; kitBag: { label: string; items: string };  // "Git · Google Cloud · …"
  };
  groups: { name: string; shotLine: string; note: string; skills: { name: string; level: "shipped" | "built" | "kit"; tierLabel: string }[] }[];
}
export function buildAttributesView(c: Content, copy: UiCopy, portraitSrc: string): AttributesView;
```

- [ ] **Step 1: Failing `view.test.ts`:**
  - **legend:** 3 items in shipped/built/kit order with volt/floodlight/dim
  - **profile:** `badge` = `{ value: "SE", label: "POSITION" }`; `roleLine` = "Software Engineer 1 · Deutsche Bank" (current role + club); rows = Playing style → "Full-stack", Languages → "Java · JavaScript · Python"; kit bag joined with " · " in content order
  - **groups:** order Backend/Frontend/Data/Craft (§8.3); `shotLine` = "SHOT · Smash" (case by CSS); JUnit `tierLabel` "75+ tests" (CSS uppercases)
  - **extra content:** a fifth group in cloned content renders 5 groups (no fixed counts)

- [ ] **Step 2: Implement** `view.ts` (reuse `getAttributeGroups`, `getCareerRows`).

- [ ] **Step 3: Screen.** `ContentPage`:
  - `route="attributes"`, `venue="hall"`, `trail={[ui.venues.badminton]}`
  - `eyebrow`; aside = `Legend`
  - `rematch` = `ROUTES.badminton`
  - next = `ui.pages.attributes.next` → `ROUTES.trophies`
  - `comm` = `ui.pages.attributes.comm`
  - glows from the artboard: hall glow 60% 50% at 30% 110% α .40; warm sky 50% 40% at 50% −10%, `rgb(255 228 184 / .10)`. Add a `SkyGlow` tone/venue-light option in the design system if the sky colour can't come from tokens today.

  Panels at ≥1200: profile 300 │ groups 2×2 (gap 16).
  - **Profile:** glass, p 20, gap 16. `PortraitFrame size="attr"` (250 tall, the drawn mask/lighten), name type-d3 34, role line, `KeyValueList` rows (14px drawn: adjust the component variant if needed), kit bag stacked (mono 12 / 1.6).
  - **Groups:** glass, p 20/22, gap 14. Header row: name 32/900/.02em + `shotLine` mono 11/.18em. Note 13 scout, pulled up 8px as drawn: encode it in a component or recipe, never `-mt-2` in the feature. Then `SkillRow`×n with `animate` (segment fill 350ms, 40ms stagger).

  Tablet/phone per ruling T6. Tab bar SKILLS current.

- [ ] **Step 4: Fixture + stories** (exact artboard strings; `RealContent`, `ArtboardParity`).

- [ ] **Step 5: Parity** `tests/stories/attributes.spec.ts`:
  - `ArtboardParity` vs `Badminton-Attributes` at 1440×900, ≤2%
  - let segment animations settle first: wait for `animationend`, or use the reduced-motion end state if the repo's helper does that
  - masks: COMM only

- [ ] **Step 6: Route + e2e** (`tests/e2e/attributes.spec.ts`):
  - **No JS:** `h1` "PLAYER ATTRIBUTES"; all 16 skill names and the 4 group names in the HTML; the portrait `img` has alt "Yash Sarda"
  - **Fidelity:** real route ≤2%; masks: COMM and any content-wording difference (list each with its reason)
  - **Overflow:** 360–1440
  - **Phone:** SKILLS `aria-current`; `expectTabBarClear`; one-line next button (helpers)
  - **Links:** REMATCH → `/arena/badminton`; next → `/trophies`

- [ ] **Step 7: Verify** `pnpm verify`. **Commit** `feat(attributes): player profile and skill groups page, tablet and phone layouts`.

---

### Task 4: Trophy Room (`/trophies`, `#academy`)

**Files:**
- Create in `src/features/trophies/`:
  - `view.ts`, `view.test.ts`
  - `TrophiesPage.tsx` (`TrophiesPage` + `TrophiesScreen`)
  - `Cabinet.tsx`, `PlinthDetail.tsx`
  - `TrophiesPage.fixture.ts`, `TrophiesPage.stories.tsx`, `parts.test.tsx`
- Create: `tests/stories/trophies.spec.ts`, `tests/e2e/trophies.spec.ts`
- Modify: `app/routes/trophies.tsx`

**Interfaces:**
```ts
export interface TrophiesView {
  listLabel: string;
  trophies: { id: string; kind: "cup" | "medal" | "plaque" | "pennant" | "round" | "locked"; title: string; shelfSub: string;
              locked: boolean; label?: string /* medal "99.5", plaque "PAPER" */;
              detail: { index: string; title: string; sub: string; description: string; links: { label: string; href: string }[] } | null }[];
  defaultId: string;                    // first unlocked (the cup)
  plinthLabel: string;
  academy: { id: "academy"; eyebrow: string; aside: string; title: string; monogram: string; name: string; degree: string; meta: string; extrasLabel: string; extras: string };
}
export function buildTrophiesView(c: Content, copy: UiCopy, routes: typeof ROUTES): TrophiesView;
```

- [ ] **Step 1: Failing `view.test.ts`:**
  - 6 trophies in content order; the last is `locked: true` with `detail: null`
  - `detail.index` = "1 / 5" … "5 / 5" (locked excluded from the count)
  - medal `shelfSub` = `shortSub` ("MHT-CET 2020 · State Rank 709") and `detail.sub` = the full content sub
  - cup links = LEETCODE/CODEFORCES/CODECHEF with the content hrefs
  - medal `label` "99.5" from the title's number; plaque `label` "PAPER" from ui/content: add `ui.pages.trophies.plaqueLabel: "PAPER"`
  - `academy.name` = "Pune Institute of Computer Technology"; `meta` = "Jul 2020 – Jun 2024 · CGPA 8.94 · Distinction, SPPU"; `extras` joined " · "
  - `defaultId` = the cup

- [ ] **Step 2: Implement** `view.ts`.

- [ ] **Step 3: Screen.** `ContentPage`:
  - `route="trophies"`, `zone="trophy"`, no venue, `trail={[]}`
  - eyebrow gold (`eyebrowTone="gold"`)
  - no rematch, no comm
  - next = `ui.pages.trophies.next` → `ROUTES.card` (ruling T1)
  - backdrop: none (plain `ground-trophy`)

  Panels at ≥1200: cabinet 870 │ right column (detail 262 tall + academy fills the rest; gap 16).
  - **Cabinet** (`CabinetGlass`, inset shadow `shadow-inset-cabinet`, gradient bg, border line):
    - a horizontal `SelectableList` whose List is a 3-column, 2-row grid (shelf 1 is 310 tall; `ShelfLight` at 308; shelf 2 below)
    - each Item = `Spotlight` (lead on the selected item, support otherwise; `animate-spot-drop` with stagger `--i`) + the trophy art (`animate-turntable` only when active) + the plinth + title (d5-ish 20/800/.04em: use or adjust a recipe) + `shelfSub` mono 11/.14em (gold on the selected item, scout otherwise, as drawn)
    - hover lift −6px over 400ms ease-follow
    - the locked item is a **disabled** Item with `aria-label` "`{title}`, `{lockedHint}`"
  - **ON THE PLINTH** (glass, p 20/22): one Panel per unlocked trophy: header ("ON THE PLINTH" gold + index), title 36/900, sub mono 12/.12em, description 15/1.5, links (mono 12/.14em volt, same tab, `ui.glyph.external` aria-hidden).
  - **Academy:** `AcademyCard id="academy"` (`h2`), with scroll-mt from the shared offset.

  Tablet/phone per ruling T6.

- [ ] **Step 4: Fixture + stories:** exact artboard strings, no next button (as drawn). `RealContent`, `ArtboardParity`.

- [ ] **Step 5: Parity** `tests/stories/trophies.spec.ts`:
  - `ArtboardParity` vs `Trophy-Room` at 1440×900, ≤2%, after the spot-drop settles
  - the turntable rotates the selected cup: pause animations (Playwright `animations: "disabled"` freezes at the end state; frame 0 = 0°, which equals the artboard) and mask nothing else

- [ ] **Step 6: Route + e2e** (`tests/e2e/trophies.spec.ts`):
  - **No JS:** `h1` "TROPHY ROOM"; all 5 descriptions attached (force-mounted); the Academy `h2` present; `#academy` exists
  - **Keyboard:** ArrowRight from the cup selects the medal, and the panel shows "99.5 Percentile"; End lands on System Design Blogs (the locked tab is skipped); clicking GIANT KILLER does nothing
  - **Hash landing:** `page.goto("/trophies#academy")` → the Academy heading is in the viewport below the header. And from `/career`, select row 03 and click "SEE IT IN THE TROPHY ROOM" → URL `/trophies#academy` and the heading is in view. This closes the carry-over row.
  - **Reduced motion** (`page.emulateMedia({ reducedMotion: "reduce" })`): the selected trophy's computed `animation-name` is `none`, and the spotlight is visible
  - **Fidelity:** real route ≤2%. Masks: the next-button area + the panel heights changed by T1. If T1 shifts too much to mask honestly, compare regions instead (header, title row, detail panel, cabinet top shelf) using `expectRegionMatchesArtboard`, adding `REGIONS["Trophy-Room"]` to the renderer.
  - **Gold check:** `getComputedStyle` gold text exists only inside `[data-zone="trophy"]`
  - **Overflow:** 360–1440; **phone:** `expectTabBarClear`, one-line next button

- [ ] **Step 7: Verify** `pnpm verify` + `pnpm build && pnpm lighthouse`. **Commit** `feat(trophies): trophy cabinet with spotlight and turntable, plinth detail, academy panel and hash landing`.

---

## Phase 2B exit checklist (orchestrator)

1. Visual check by eye: `/attributes` and `/trophies` at 1440, 1024, 768 and 390 (plus a selected-trophy check).
2. Docs:
   - spec §11: T1–T6, gold ramp tokens, masks
   - carry-over ticks
3. One **Opus review** → Yash approves → one fix wave → Yash approves → full test pass.
4. Progress meter → Yash previews → merge `phase/2-content` to `main`. Then the 2C plan.

---

## Trivia: terms used in this plan

- **Scene component:** a decorative drawing (like a trophy or a spotlight) made from HTML/CSS shapes. Screen readers skip it because it carries no information.
- **Zone (`data-zone="trophy"`):** an attribute on the page that unlocks the gold colours. Outside it, gold simply doesn't exist, so it can't leak onto other pages.
- **Disabled tab:** a tab that is shown and announced but can't be selected; keyboard arrows skip over it.
- **Turntable (rotateY):** spinning an element around its vertical axis in 3D, like a trophy on a rotating stand.
- **Hash link (`#academy`):** the part of a URL after `#` that tells the browser which section of the page to scroll to.
- **Lazy loading:** the browser waits to download an image until it's about to come on screen, so the page shows up faster.
