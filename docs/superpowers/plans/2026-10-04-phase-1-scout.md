# Phase 1 — Quick View `/scout` Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**What this plan does (plain words):** builds the recruiter page, `/scout`, the link that goes on the resume.

- **Desktop (fluid):**
  - a sticky header with section links
  - the big YASH SARDA hero with chips and two buttons
  - Career, Highlights, Attributes, Trophy Room and Academy sections
  - the volt "Team Up" band and a footer
  - all of it matching `QuickView.dc.html`
- **Mobile (390):**
  - the compact Mobile-QuickView layout
  - a swipeable highlights row with a visible "SWIPE →" hint
  - a sticky PLAYER CARD / TEAM UP bar at the bottom
  - the remaining sections continue in the same mobile style
- **Works with JavaScript off.** It's plain pre-rendered HTML.
- **Search and social tags:** Open Graph tags on every page, plus a JSON-LD "Person" card on `/scout`.
- **New test tool:** compare one region of a tall artboard at a time, so a long page can be pixel-checked section by section.
- **Lighthouse:** a `pnpm lighthouse` budget check.

**Goal:** `/scout` is built from real content. A fixture copy of the artboard text matches `QuickView@1440x3300` and `Mobile-QuickView@390x844` within 2%. Real-content regions match where the content is identical. It works with JS off, axe is clean, Lighthouse desktop performance is ≥90 with accessibility at 100, and `pnpm verify` stays green.

**Architecture:**
- `src/features/quick-view/report.ts` turns content + UI copy + routes into one plain `ScoutReport` object (a "view model").
- `QuickView` is a pure screen: it only draws a `ScoutReport`. The route renders `QuickViewScreen`, which builds the report from real content. Stories render the same screen from a fixture holding the artboard's exact words. That proves the layout pixel-for-pixel even where real content wording differs on purpose (spec §11.2).
- Desktop and mobile come from one DOM, switched by CSS breakpoints. Only short alternate labels exist twice, and one copy is always `display:none`.
- New design-system pieces are generic: `SectionHeader`, `LinkRow`, `HorizontalScroller`, `StickyBottomActions`, Button/HUDButton/Chip variants and 13 type recipes. Phase 2's fluid pages reuse them.

**Tech Stack:** React 19, React Router 8 (framework mode, prerender), Tailwind v4 Arena tokens, Vitest + Testing Library, Playwright + axe, `pixelmatch`, Lighthouse (new dev dependency).

**Spec:** `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md`:
- §1 (`/scout` readable with JS off)
- §4.3 (CSS breakpoints, not JS)
- §4.5 (`/scout` route)
- §5 (design system)
- §6 (content)
- §9 (testing)
- §10 Phase 1
- §11.1 A2, A3, A9, A10
- §11.2 #3–7, #10, #12
- §12 (resume buttons)

Exact values come from `design/handoff/design-source/QuickView.dc.html` and `Mobile-QuickView.dc.html`. **Builders read those two files. They are the measuring tape.**

**Carry-over absorbed** (`docs/superpowers/plans/phase-0-carryover.md`):
- "Before Phase 1's first pixel diff":
  - token-merge log
  - tall-board crops + friendly missing-reference error + documenting that `diffImages` mutates its inputs
  - font parity
  - `Link.href` regex
  - `test:visual-refs` overlap
- jsdom navigation noise in `pnpm test` output
- the `cn()` convention (Global Constraints)

StatTile tracking stays in Phase 2: `/scout` has no stat tiles.

---

## Rulings for Yash to confirm (decided by the orchestrator, spec D6)

| # | Decision | Why | Easy to flip? |
|---|---|---|---|
| R1 | The hero sentence uses the artboard's words, stored in content as `scout.summary` (+ a short mobile version). It does not use `player.summary`. | The artboard line names the employer and stack, which is what a recruiter scans for. Text still lives in content, never in code. Amends §11.2 #6 for `/scout` only. | Yes: one line in `content.json` |
| R2 | Quick View lists projects **strongest first** (FINAL → SF → QF), as drawn and labelled "STRONGEST FIRST". | §11.2 #3 (QF → SF → FINAL) is about the Highlights tournament reel, where bracket order makes sense. | Yes |
| R3 | Mobile `/scout` = the Mobile-QuickView design (compact hero and career, swipe row, bottom bar). The sections the artboard doesn't draw (Attributes, Trophies, Academy, Team Up, footer) continue in the same mobile style. | D2 says every screen below 768px uses its mobile layout. Nothing is hidden from mobile recruiters except the long career bullets, as drawn. | Medium |
| R4 | No public PDF yet, so the hero button reads **REQUEST RESUME** and the band row reads **Request resume ↗** (both open an email). | §12 security rule: the phone-number PDF is never shipped. They switch to "VIEW PLAYER CARD (PDF)" / "Resume (PDF) ↓" automatically once `player.resumePdf` is set. | Automatic |
| R5 | `og:image`, `og:url` and `canonical` wait for Phase 7. | They need the real domain (env) and the OG image. | — |
| R6 | Short labels the artboards use but content lacks are added to content: `shortRole` ("SE1", "Intern"), highlight `scoutTag`, `shortName`, `scoutShort`, academy `degreeShort`, the "Craft & tools" chip list. The `scoutShort` lines for Kudo Board and Power BI are **derived copy (not drawn), flagged for review**. | Keeps "no hard-coded copy" while matching the drawn labels exactly. | Yes |

---

## Global Constraints

All Phase 0 constraints apply:
- Arena tokens only.
- **Literal class strings.** Never build class names from template strings.
- **Any font-weight / size / leading / tracking override next to a `type-*` class goes in a separate `cn()` argument after it** (e.g. `cn("type-body-lg", "font-semibold")`). Prettier reorders literal strings, and `cn` drops overrides that land before the recipe. Better still: add a recipe.
- No raw hex, `rgb()` or `cubic-bezier()` in TS/TSX.
- No arbitrary type sizes (`text-[17px]`).
- No inline `var(--color-*)`. Those vars don't exist (`@theme inline`).
- Polymorphic `as`, `className` merged via `cn`, React 19 ref-as-prop.
- Mono text ≥11px (A2: the mobile artboard's 10px becomes 11px). Contrast ≥4.5:1. Volt focus ring on every interactive element. Inside the volt band the ring is ink (`outline-volt-ink`), so it stays visible. Reduced motion respected.
- Every new design-system component gets a story (all variants), a barrel export in `src/design-system/index.ts`, and is covered by the Storybook a11y gate.
- **No visible copy in components or routes.** Strings come from `src/content` (`ui` copy or resume content). Story fixtures (`*.fixture.ts`) are the only exception, and they are only imported by stories.
- **Zod stays out of the client bundle** (only `src/content/schema.ts`, content tests and `vite.config.ts` import it).
- **Folder rules:**
  - `app/routes/*` = `meta` + one feature screen.
  - Features import `shell`, `design-system`, `content` and `lib`, never other features.
  - `content` imports nothing from `shell`, `features` or `design-system`.
- **Security:** the private resume PDF is never referenced, copied or linked. No `.pdf` href appears while `player.resumePdf` is `null`. No phone number anywhere.
- **Lean testing:**
  - unit tests for `buildScoutReport`, JSON-LD and the visual helpers
  - component tests only for interactive or semantic design-system pieces
  - e2e for no-JS, fidelity regions, anchors, overflow, the mobile bar, the scroller, meta and the Landing → Quick View journey
  - no snapshot tests
- Git 2.15 (no `switch`/`restore`). Branch `phase/1-scout`. Commits end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Before any e2e run, port 4173 must be free. **Never kill a process you didn't start. Ask the orchestrator.**

## Review Focus

1. **Section links hide headings under the sticky header.** Clicking CAREER must land with the "CAREER STATS" heading fully visible below the 68px header (`scroll-mt`). Test: Task 5, `scout.spec.ts` "nav links land below the sticky header".
2. **The mobile bottom bar covers the last content.** At 390×844, after scrolling to the end, the footer link must sit fully above the bar, including on iPhones with a home bar (safe-area padding). Test: Task 5, "bottom bar never covers the footer".
3. **The highlights swipe row is unusable without touch.** It must be reachable by Tab, have an accessible name, actually overflow (scrollWidth > clientWidth), and show "SWIPE →". Tests: Task 3 `HorizontalScroller` story + a11y gate; Task 5 "highlights row is a focusable scroller".
4. **Focus is invisible on the volt band.** A volt ring on a volt background disappears, so band links use an ink ring. Test: Task 3 `LinkRow.test.tsx` checks the ink outline class. The Storybook a11y gate runs over the band story.
5. **Horizontal scrolling at in-between widths** (tablet, narrow laptop). Long chips, nav and grids must wrap: no page-level horizontal scroll at 390, 768, 1024 and 1440. Test: Task 5, "no horizontal overflow".
6. **Private resume leaks.** With `resumePdf: null` there must be no `.pdf` link anywhere on `/scout`. Tests: Task 4 `report.test.ts`; Task 5 no-JS test.

---

## File map

| File | Task | Purpose |
|---|---|---|
| `tests/support/visual.ts` (+ `visual.test.ts`) | 1 | `readReference` (friendly error), `cropPng`, `readRegions`, `expectRegionMatchesArtboard`; doc that `diffImages` mutates inputs |
| `tools/render-artboards/render.mjs`, `KNOWN-ISSUES.md` | 1 | write `<board>@WxH.regions.json`; drop unused font weights |
| `package.json` | 1, 5 | drop `test:visual-refs`; add `lighthouse` script + dev dep |
| `tests/setup/vitest.setup.ts` | 1 | silence jsdom "Not implemented: navigation" without weakening tests |
| `src/content/schema.ts`, `content.json`, `schema.test.ts` | 2 | new fields, tighter `Link.href` |
| `src/content/ui-copy.ts` | 2 | `ui.scout` namespace, `routes.scout.heading` = name, `navLabel` |
| `src/content/seo.ts` (+ test), `src/content/index.ts` | 2 | `getPersonJsonLd(content)` |
| `src/shell/PlaceholderScreen.tsx` | 2 | site map uses `navLabel ?? heading` |
| `src/design-system/tokens/base.css`, `tokens.css`, `theme.css`, `catalog.ts`, `primitives/Text.tsx` | 3 | 13 type recipes, `scrollbar-none`, ink alpha token |
| `src/design-system/primitives/Button.tsx`, `Chip.tsx`, `broadcast/HUDButton.tsx` (+ stories/tests) | 3 | new sizes/variants/tones |
| `src/design-system/layout/SectionHeader.tsx`, `primitives/LinkRow.tsx`, `layout/HorizontalScroller.tsx`, `layout/StickyBottomActions.tsx` (+ stories/tests) | 3 | new generic composites |
| `src/features/quick-view/*` | 4 | report builder, screen, sections, fixture, stories |
| `tests/stories/scout.spec.ts` | 4 | fixture parity vs both artboards |
| `app/routes/scout.tsx`, `src/shell/meta.ts` | 5 | route + OG + JSON-LD |
| `tests/e2e/scout.spec.ts`, `tests/e2e/routes.spec.ts` | 5 | e2e + Landing → Quick View journey |
| `tools/lighthouse.mjs` | 5 | Lighthouse budget run |
| spec §11, carry-over doc | Orchestrator | logs and ticks |

---

### Task 1: Region-by-region visual tool + carry-over test tooling

**Files:**
- Modify: `tests/support/visual.ts`, `tests/support/visual.test.ts`, `tools/render-artboards/render.mjs`, `tools/render-artboards/KNOWN-ISSUES.md`, `package.json`, `tests/setup/vitest.setup.ts`

**Interfaces — Produces** (Tasks 4–5 rely on these exact names):
```ts
export async function readReference(artboard: string, width: number, height: number): Promise<PNG>;
export function cropPng(src: PNG, r: Rect): PNG;
export async function readRegions(artboard: string, width: number, height: number): Promise<Record<string, Rect>>;
export interface RegionMatchOptions {
  /** Size of the reference board, e.g. { width: 1440, height: 3300 } (default: page viewport). */
  reference?: { width: number; height: number };
  maxDiffRatio?: number; // default 0.02
  /** Regions to exclude, in CSS px relative to the region's top-left. */
  maskRects?: Rect[];
  threshold?: number;
}
export async function expectRegionMatchesArtboard(
  actual: Locator, artboard: string, region: string, options?: RegionMatchOptions,
): Promise<number>;
```

- [ ] **Step 1: Write failing unit tests** in `tests/support/visual.test.ts`:
  - `cropPng` returns the exact pixels of a 2×2 window from a 4×4 PNG.
  - `readReference("Nope", 1, 1)` rejects with a message containing `Run \`pnpm references\``.
  - `readRegions` on a missing file rejects with the same hint.
  - `diffImages` still throws on size mismatch. This test already exists; keep it.

- [ ] **Step 2: Run** `pnpm vitest run tests/support/visual.test.ts`. Expected: the new tests FAIL (functions not exported).

- [ ] **Step 3: Implement in `tests/support/visual.ts`:**
  - `readReference`: `readFile(referencePath(...))`. On `ENOENT`, throw `new Error(\`Missing reference ${path}. Run \`pnpm references\` first.\`)`. `expectMatchesArtboard` now uses it.
  - Add a doc comment on `diffImages`: *"Paints mask rects magenta into BOTH inputs (mutates them) before diffing."*
  - `cropPng(src, r)`: rounds `r` to whole pixels, clamps to bounds, and copies rows into a new `PNG`.
  - `readRegions`: reads `design/references/<artboard>@WxH.regions.json`, with the same friendly error.
  - `expectRegionMatchesArtboard(actual, artboard, region, opts)`:
    1. `page = actual.page()`. `ref = opts.reference ?? page.viewportSize()`.
    2. `regions = await readRegions(artboard, ref.width, ref.height)`. If `region` is missing, throw listing the available keys.
    3. `expected = cropPng(await readReference(...), regions[region])`.
    4. `await page.evaluate(() => document.fonts.ready)`, then `actualPng = PNG.sync.read(await actual.screenshot({ animations: "disabled", caret: "hide" }))`.
    5. Sizes may differ by ≤2px in either axis (sub-pixel rounding). In that case crop both to the smaller size. A larger difference throws `"<artboard>/<region>: size WxH vs reference WxH (layout differs)"`.
    6. Diff with `diffImages(actualPng, expected, opts.maskRects ?? [], opts.threshold)`. On failure, write `test-results/visual/<artboard>-<region>.{actual,expected,diff}.png` and throw like `expectMatchesArtboard`.

- [ ] **Step 4: Renderer regions.** In `tools/render-artboards/render.mjs`:
  - Add a map:
    ```js
    // Element boxes for fluid boards, so tests can compare one region at a time (tall pages shift when content differs).
    const REGIONS = {
      QuickView: {
        header: "header",
        hero: "main > section:nth-of-type(1)",
        heroCtas: "main > section:nth-of-type(1) > div:last-child",
        careerHead: "#career > div:first-child",
        highlightsHead: "#highlights > div:first-child",
        highlights: "#highlights",
        attributes: "#attributes",
        trophiesHead: "#trophies > div:nth-child(1) > h2",
        academyHead: "#trophies > div:nth-child(2) > h2",
        teamup: "#teamup",
        teamupResume: "#teamup a:last-child",
        footer: "footer",
      },
    };
    ```
  - After the screenshot, if `REGIONS[board.name]` exists, evaluate `getBoundingClientRect()` for each selector and write `<name>@<w>x<h>.regions.json` (rounded to 0.01px) next to the PNG.
  - **A selector that matches nothing must fail the render** with the board name and the selector.
  - Remove Big Shoulders **600** and JetBrains Mono **500** from `FONTS`. A grep of every artboard shows no rendered text uses them, so references now load exactly the faces the app ships.
  - Add a line to `KNOWN-ISSUES.md`: "Fonts: BSD 600 / JBM 500 are requested by the artboards' Google Fonts link but no element uses them; the renderer loads only the shipped weights."

- [ ] **Step 5: Carry-over tidy-ups:**
  - Delete the `test:visual-refs` script from `package.json`. `tests/e2e/visual-harness.spec.ts` already runs under `test:e2e`.
  - `pnpm test` currently prints jsdom `Error: Not implemented: navigation (except hash changes)` when tests click real anchors. Make the output clean without changing what any test asserts.
    - Preferred: in `tests/setup/vitest.setup.ts`, add a bubbling-phase `click` listener on `window` that calls `preventDefault()` on unhandled clicks on `a[href]` that aren't `#` links. It runs after React's root listener, so `ArenaLink`'s own `defaultPrevented` logic is unaffected.
    - If any test asserts that a click was *not* prevented (e.g. checks `fireEvent.click`'s return value), use jsdom's virtual console filter for that exact message instead.
    - Explain the choice in a one-line comment.

- [ ] **Step 6: Verify:**
  - Run `pnpm vitest run` → all pass, no "Not implemented: navigation" lines.
  - Run `pnpm references QuickView Mobile-QuickView` → `design/references/QuickView@1440x3300.regions.json` exists with all 12 keys and sane boxes. Expected: header ≈ `{x:0,y:0,width:1440,height:69}`, `teamup` width 1200 at x 120.
  - Run `pnpm typecheck && pnpm lint`.

- [ ] **Step 7: Commit** `test(visual): region-by-region artboard comparison, friendly missing-reference errors, renderer regions + font parity`.

---

### Task 2: Content, UI copy and JSON-LD for Quick View

**Files:**
- Modify: `src/content/schema.ts`, `src/content/content.json`, `src/content/schema.test.ts`, `src/content/ui-copy.ts`, `src/content/index.ts`, `src/shell/PlaceholderScreen.tsx`
- Create: `src/content/seo.ts`, `src/content/seo.test.ts`

**Interfaces — Produces:**
- New content fields:
  - `content.scout.summary: string`
  - `content.scout.summaryShort: string`
  - `content.scout.craftAndTools: string[]`
  - `careerStats[].shortRole: string`
  - `matchHighlights[].scoutTag | shortName | scoutShort: string`
  - `trainingAcademy.degreeShort: string`
- `ui.scout` (shape below). `ui.routes.scout.heading === "YASH SARDA"`, `ui.routes.scout.navLabel === "SCOUTING REPORT"`.
- `getPersonJsonLd(c: Content): Record<string, unknown>`, exported from `@/content`.

- [ ] **Step 1: Failing tests:**
  - `schema.test.ts`:
    - the shipped content parses
    - each new field is required (delete it → parse fails)
    - `scout.craftAndTools` must be non-empty and unique
    - `Link.href` rejects `/\evil.com` and `//evil.com`, and accepts `/trophies#academy`, `https://x.y`, `mailto:a@b.c`
  - `seo.test.ts`:
    - `@context` `"https://schema.org"`, `@type` `"Person"`, `name` `"Yash Sarda"`, `jobTitle` `"Software Engineer"`
    - `worksFor` `{ "@type": "Organization", name: "Deutsche Bank" }`
    - `address.addressLocality` `"Pune"`, `addressCountry` `"India"`
    - `alumniOf.name` = academy school
    - `sameAs` = linkedin, github, leetcode, codeforces, codechef, in that order
    - `email` `"mailto:yashsarda2002@gmail.com"`
    - `JSON.stringify(result)` contains neither `"</"` nor `"telephone"` nor `".pdf"`

- [ ] **Step 2: Run** `pnpm vitest run src/content`. Expected: FAIL.

- [ ] **Step 3: Schema + content.**
  - `Link.href` regex becomes `/^(https:\/\/|mailto:|\/(?![\/\\]))/` with the message "Must start with https://, mailto: or a single / (not // or /\\)".
  - Add to `ContentSchema` (strict, `.min(1)` strings): the `scout` object (`summary`, `summaryShort`, `craftAndTools` unique non-empty array), `shortRole` per career row, the three highlight fields, and `degreeShort`.
  - `content.json` values (exact):
    ```json
    "scout": {
      "summary": "Software Engineer at Deutsche Bank. Full-stack — Java, Spring Boot, React and Oracle — building practical software that delivers measurable, real-world impact.",
      "summaryShort": "Software Engineer at Deutsche Bank. Full-stack: Java, Spring Boot, React, Oracle.",
      "craftAndTools": ["DSA · OOP", "System Design", "Python", "Git · CI/CD", "Google Cloud", "Gen AI"]
    }
    ```
    - careerStats[0]: `"shortRole": "SE1"`, `"scoutLine": "bulk upload cut manual entry 60%"`. This is the mobile compact line, rendered as `role · scoutLine`, exactly as drawn.
    - careerStats[1]: `"shortRole": "Intern"`.
    - THE FINAL: `"scoutTag": "Published research"`, `"shortName": "AI Interview Platform"`, `"scoutShort": "Gemini-powered mock interviews · published paper"`.
    - SEMI-FINAL: `"scoutTag": "Deutsche Bank"`, `"shortName": "Kudo Board"`, `"scoutShort": "Recognition platform for 10,000+ employees"`.
    - QUARTER-FINAL: `"scoutTag": "Analytics"`, `"shortName": "Power BI Dashboard"`, `"scoutShort": "Embedded Power BI with secure token auth"`.
    - trainingAcademy: `"degreeShort": "B.Tech IT"`.
  - Run `grep -rn scoutLine src` and update any test that pinned the old wording.

- [ ] **Step 4: `ui.scout`** in `ui-copy.ts` (exact strings):
  ```ts
  scout: {
    label: "SCOUTING REPORT",
    sectionsNav: "Sections",
    nav: { career: "CAREER", highlights: "HIGHLIGHTS", attributes: "ATTRIBUTES", trophies: "TROPHIES", teamUp: "TEAM UP" },
    enter: "ENTER THE ARENA",
    enterShort: "ARENA",
    eyebrow: "90-SECOND READ",
    eyebrowMore: "EVERYTHING, NO GAMES",
    problemsSolved: "PROBLEMS SOLVED",
    solved: "SOLVED",
    cgpa: "CGPA",
    resume: { view: "VIEW PLAYER CARD (PDF)", request: "REQUEST RESUME", row: "Resume (PDF)", rowRequest: "Request resume" },
    teamUpCta: "TEAM UP",
    career: { title: "CAREER STATS", meta: "EXPERIENCE · MOST RECENT FIRST", innings: "INNINGS" },
    highlights: { title: "MATCH HIGHLIGHTS", meta: "PROJECTS · STRONGEST FIRST", swipe: "SWIPE", list: "Projects", more: "MORE ON GITHUB" },
    attributes: { title: "PLAYER ATTRIBUTES", meta: "SKILLS", craft: "CRAFT & TOOLS", legend: "FILLED = SHIPPED IN PRODUCTION AT DEUTSCHE BANK" },
    trophies: { title: "TROPHY ROOM" },
    academy: { title: "TRAINING ACADEMY" },
    teamUp: { eyebrow: "TEAM UP", headline: "THINK YOU CAN BEAT ME? LET'S FIND OUT ON A REAL PROBLEM.", linkedin: "LinkedIn", github: "GitHub" },
    footer: { arena: "PREFER THE FULL EXPERIENCE? ENTER THE ARENA" },
    actions: { label: "Quick actions", card: "PLAYER CARD", teamUp: "TEAM UP" },
    newTab: "(opens in a new tab)",
  },
  glyph: { next: "→", external: "↗", download: "↓", sep: "·" },
  ```
  Also add `brand.siteName: "The Arena"` (used by `og:site_name` in Task 5).
  - Glyphs are separate from labels so components can mark them `aria-hidden`.
  - Change `routes.scout` to `heading: "YASH SARDA", navLabel: "SCOUTING REPORT"`. The page's `<h1>` is the player's name, as drawn.
  - `PlaceholderScreen`'s site map label becomes `"navLabel" in ui.routes[key] ? ui.routes[key].navLabel : ui.routes[key].heading`. Extract a tiny `routeLabel(key)` helper in the same file.

- [ ] **Step 5: `src/content/seo.ts`:**
  ```ts
  import type { Content } from "./schema";

  /** schema.org Person for the Quick View page (spec §10 Phase 1). Only public facts — never a phone number or the private PDF. */
  export function getPersonJsonLd(c: Content): Record<string, unknown> {
    const { player, trainingAcademy: a } = c;
    const [locality, country] = player.location.split(",").map((s) => s.trim());
    return {
      "@context": "https://schema.org",
      "@type": "Person",
      name: player.name,
      jobTitle: player.title,
      description: c.scout.summary,
      email: `mailto:${player.contact.email}`,
      worksFor: { "@type": "Organization", name: player.currentClub },
      address: { "@type": "PostalAddress", addressLocality: locality, addressCountry: country },
      alumniOf: { "@type": "CollegeOrUniversity", name: a.school },
      sameAs: [player.contact.linkedin, player.contact.github, player.contact.leetcode, player.contact.codeforces, player.contact.codechef],
    };
  }
  ```
  Export it from `src/content/index.ts`. The test asserts `"</"` is absent, which pins the output as safe inside a `<script>` tag.

- [ ] **Step 6: Verify:** `pnpm vitest run && pnpm typecheck && pnpm lint && pnpm build`. The build-time content check passes.

- [ ] **Step 7: Commit** `feat(content): Quick View copy, short labels, JSON-LD person, stricter root-path links`.

---

### Task 3: Design-system additions for fluid pages

**Files:**
- Modify: `src/design-system/tokens/base.css`, `tokens.css`, `theme.css`, `catalog.ts` (+ `catalog.test.ts` if it lists recipes), `primitives/Text.tsx`, `primitives/Button.tsx` (+ stories/test), `primitives/Chip.tsx` (+ stories), `broadcast/HUDButton.tsx` (+ Chrome stories/test), `index.ts`
- Create: `layout/SectionHeader.tsx`, `primitives/LinkRow.tsx`, `layout/HorizontalScroller.tsx`, `layout/StickyBottomActions.tsx`, `layout/Fluid.stories.tsx`, `layout/Fluid.test.tsx`

**Interfaces — Produces:**
```ts
// Text variants added: "lede" | "section" | "section-sm" | "band" | "title-lg" | "title" | "title-sm"
//   | "btn-heavy" | "btn-bar" | "mono-nav" | "mono-chip" | "mono-round" | "mono-stack"
Button size: "cta" | "bar" (new), variant: "panel" (new), prop glow?: boolean (default true; primary only)
Chip size: "meta" | "code" (new)
HUDButton tone?: "glass" | "volt-outline" (default "glass")
SectionHeader: { title: ReactNode; meta?: ReactNode; size?: "lg" | "md"; level?: 2 | 3; id?: string; className?: string }
LinkRow<T = "a">: polymorphic; { glyph?: ReactNode; tone?: "volt" } + children (label)
HorizontalScroller: { label: string; children: ReactNode /* <li> items */; className?: string; listClassName?: string; fadeClassName?: string }
StickyBottomActions: { label: string; children: ReactNode; className?: string }
```

- [ ] **Step 1: Tokens.**
  - `tokens.css`: `--rgb-volt-ink: 10 12 8;` and `--ref-ink-a25: rgb(var(--rgb-volt-ink) / 0.25);` (Team Up row dividers, artboard `rgba(10,12,8,.25)`).
  - `theme.css` `@theme inline`: `--color-ink-a25: var(--ref-ink-a25);`.
  - Add the swatch to `catalog.ts` if the catalog lists ramps. Keep `contrast.test.ts` green: no new text pair.

- [ ] **Step 2: Type recipes** in `base.css` (the mobile override lives inside the recipe, so screens use one class):
  ```css
  /* fluid pages (Quick View); mobile overrides are the Mobile-QuickView sizes (A2 floor applied) */
  @utility type-hero-fluid { /* existing desktop values stay */ @media (width < 48rem) { font-size: 76px; line-height: 0.84; } }
  @utility type-lede { font-family: var(--font-body); font-weight: 400; font-size: clamp(20px, 2.2vw, 28px); line-height: 1.35;
    @media (width < 48rem) { font-size: 17px; line-height: 1.45; } }
  @utility type-section { font-family: var(--font-display); font-weight: 900; font-size: clamp(40px, 5vw, 60px); line-height: 0.9; text-transform: uppercase;
    @media (width < 48rem) { font-size: 28px; line-height: 1; } }
  @utility type-section-sm { font-family: var(--font-display); font-weight: 900; font-size: clamp(36px, 4vw, 48px); line-height: 0.9; text-transform: uppercase;
    @media (width < 48rem) { font-size: 28px; line-height: 1; } }
  @utility type-band { font-family: var(--font-display); font-weight: 900; font-size: clamp(44px, 6vw, 80px); line-height: 0.88; text-transform: uppercase; }
  @utility type-title-lg { font-family: var(--font-display); font-weight: 900; font-size: 32px; line-height: 1; text-transform: uppercase;
    @media (width < 48rem) { font-weight: 800; font-size: 22px; } }
  @utility type-title { font-family: var(--font-display); font-weight: 900; font-size: 28px; line-height: 1; text-transform: uppercase;
    @media (width < 48rem) { font-weight: 800; font-size: 22px; } }
  @utility type-title-sm { font-family: var(--font-display); font-weight: 900; font-size: 24px; line-height: 1.2; text-transform: uppercase; }
  @utility type-btn-heavy { font-family: var(--font-display); font-weight: 900; font-size: 20px; line-height: 1; letter-spacing: 0.14em; text-transform: uppercase; }
  @utility type-btn-bar { font-family: var(--font-display); font-weight: 900; font-size: 17px; line-height: 1; letter-spacing: 0.12em; text-transform: uppercase; }
  @utility type-mono-nav { font-family: var(--font-mono); font-weight: 400; font-size: 12px; line-height: 1.3; letter-spacing: 0.14em; text-transform: uppercase; }
  @utility type-mono-chip { font-family: var(--font-mono); font-weight: 400; font-size: 12px; line-height: 1.3; letter-spacing: 0.12em; text-transform: uppercase;
    @media (width < 48rem) { font-size: 11px; letter-spacing: 0.1em; } }
  @utility type-mono-round { font-family: var(--font-mono); font-weight: 400; font-size: 11px; line-height: 1.3; letter-spacing: 0.18em; text-transform: uppercase;
    @media (width < 48rem) { letter-spacing: 0.14em; } }
  /* mixed-case mono (stack lists, dates): no tracking, no forced uppercase */
  @utility type-mono-stack { font-family: var(--font-mono); font-weight: 400; font-size: 12px; line-height: 1.6;
    @media (width < 48rem) { font-size: 11px; } }
  @utility scrollbar-none { scrollbar-width: none; &::-webkit-scrollbar { display: none; } }
  ```
  - Check that Tailwind v4 compiles nested `@media` inside `@utility`: `pnpm build` and grep the CSS for `type-lede` with two rules. If it doesn't, write a sibling `@media (width < 48rem) { .type-lede {…} }` block and note why.
  - Add every new name to `textVariants` in `Text.tsx` (literal strings) and to the `catalog.ts` recipe list, so the Tokens story shows them.
  - Prettier formats the CSS; the compact form above is for reading only.

- [ ] **Step 3: Component variants** (write the failing tests in `Button.test.tsx` / `Chrome.test.tsx` first):
  - **Button:**
    - Move `shadow-glow-cta` out of the `primary` plate variant into a compound variant `{ variant: "primary", glow: true }`. Add `glow?: boolean` (default `true`).
    - New sizes: `cta: "min-h-14 px-7 type-btn-heavy"`, `bar: "h-13.5 w-full px-4 type-btn-bar"`.
    - New variant `panel`: root `text-floodlight`; plate `border border-line-3 bg-inset group-hover/button:border-volt`.
    - Tests: `glow={false}` plate lacks `shadow-glow-cta`; default primary keeps it; `panel` plate has `bg-inset`.
    - The existing Main fidelity (`scene.spec.ts`, `routes.spec.ts`) must stay green, so default behaviour is unchanged.
  - **Chip:** sizes `meta: "px-3 py-2 type-mono-chip max-md:px-2 max-md:py-1.5"` and `code: "px-2.5 py-1.5 type-mono-code"`. The size's recipe comes after the base `type-mono-md` in the cva output, so `cn` keeps the size's recipe. Add one test proving `size="code"` renders `type-mono-code` and not `type-mono-md`.
  - **HUDButton:** `tone` via cva.
    - `glass`: the current classes.
    - `volt-outline`: `border border-volt bg-transparent text-volt hover:border-volt-hover hover:text-volt-hover`, no glass.
    - Test: the volt-outline tone has no `glass` class.

- [ ] **Step 4: New composites** (exact anatomy from `QuickView.dc.html` / `Mobile-QuickView.dc.html`):
  - **`SectionHeader`:**
    - Markup: `<div className="flex flex-wrap items-end justify-between gap-2.5 border-b border-line pb-3.5 max-md:items-baseline max-md:border-b-0 max-md:pb-0">`
    - Then `<Heading level={level} variant={size === "lg" ? "section" : "section-sm"} id={id}>{title}</Heading>`, and the meta as `MonoLabel variant="mono-md"` (tone label).
    - The mobile look is the Mobile-QuickView section title row; the mobile border-top lives on the section wrapper in the feature.
  - **`LinkRow`:**
    - Markup: `<Comp className="flex min-h-14 items-center justify-between gap-4 border-b border-ink-a25 type-body-lg text-volt-ink last:border-b-0 focus-visible:outline-volt-ink">`, with `"font-semibold"` as a separate `cn` argument.
    - Content: label, then `<span aria-hidden="true">{glyph}</span>`.
    - `tone="volt"` is the only tone for now (on the volt band). Highlights rows come in Phase 2.
    - Test: the root has `focus-visible:outline-volt-ink`, and the glyph is `aria-hidden`.
  - **`HorizontalScroller`:**
    - Markup: `<div className="relative">` holding `<ul aria-label={label} tabIndex={0} className="flex snap-x snap-mandatory gap-2.5 overflow-x-auto scrollbar-none">`, then an edge fade `<div aria-hidden="true" className="pointer-events-none absolute inset-y-0 right-0 w-12 bg-linear-to-l from-ground to-ground/0" />`.
    - Children are `<li className="shrink-0 snap-start">` items, written by the consumer.
    - The focus ring comes from the global `:focus-visible`. Add `focus-visible:outline-offset-2`, so it isn't clipped by the parent.
    - Test: the list is focusable (`tabIndex 0`), named, and the fade is `aria-hidden`; `listClassName`/`fadeClassName` are merged onto the list and fade.
  - **`StickyBottomActions`:**
    - Markup: `<nav aria-label={label} className="fixed inset-x-0 bottom-0 z-30 grid grid-cols-2 gap-2.5 bg-linear-to-b from-ground/0 to-ground to-30% px-4 pt-3 pb-[calc(24px+env(safe-area-inset-bottom))] md:hidden">`.
    - The safe-area padding is A9.
    - Test: it's a `nav` with the given name.
  - Export all four from `index.ts`.
  - `Fluid.stories.tsx`:
    - `SectionHeader` (lg with meta, md without)
    - `LinkRow` inside a `bg-volt p-10` band (3 rows)
    - `HorizontalScroller` with 3 × 250px cards at a 390 viewport (`parameters.viewport` or a fixed-width wrapper)
    - `StickyBottomActions` with two `Button size="bar"` (panel + primary, `skew={false}`)
  - Add new Button/Chip/HUDButton variants to their existing stories.

- [ ] **Step 5: Verify:** `pnpm vitest run && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build-storybook && VERIFY=1 pnpm test:stories`. The a11y gate covers the new stories, and the Main fidelity stays ≤2%.

- [ ] **Step 6: Commit** `feat(design-system): fluid-page type recipes, SectionHeader, LinkRow, HorizontalScroller, StickyBottomActions, CTA/panel/outline variants`.

---

### Task 4: Quick View screen (report builder, sections, fixture parity)

**Files:**
- Create in `src/features/quick-view/`:
  - `report.ts`, `report.test.ts`
  - `QuickView.tsx` (`QuickView` + `QuickViewScreen`)
  - `ScoutHeader.tsx`, `ScoutHero.tsx`, `CareerSection.tsx`, `HighlightsSection.tsx`, `AttributesSection.tsx`, `TrophiesSection.tsx`, `TeamUpBand.tsx`, `ScoutFooter.tsx`
  - `QuickView.fixture.ts`, `QuickView.stories.tsx`
- Create: `tests/stories/scout.spec.ts`

**Interfaces:**
- Consumes:
  - Task 2's content fields and `ui.scout`
  - `getCareerRows`, `getHighlights`, `getAttributeGroups`, `getTrophies`, `getResumeAction`, `experienceSince`, `formatSpan` from `@/content`
  - `ROUTES` from `@/shell/routes`
  - `ArenaLink`
  - Task 3 components
- Produces (Task 5 uses `QuickViewScreen`):
```ts
export type ScoutSectionId = "career" | "highlights" | "attributes" | "trophies" | "teamup";
export interface ScoutLinkView { label: string; href: string; glyph: string; download?: string; newTab?: boolean }
export interface ScoutReport {
  header: { mark: string; label: string; nav: { id: ScoutSectionId; label: string }[]; navLabel: string;
            enter: { label: string; to: string }; enterShort: string; next: string };
  hero: { eyebrow: string; eyebrowMore: string; sep: string; nameParts: string[]; summary: string; summaryShort: string;
          chips: { label: string; short?: string; highlight?: boolean; desktopOnly?: boolean }[];
          primary: ScoutLinkView; secondary: { label: string; href: string } };
  career: { title: string; meta: string; metaShort: string;
            rows: { span: string; status: string; isCurrent: boolean; team: string; roleLine: string; stackLine: string;
                    bullets: string[]; compactTitle: string; compactLine?: string }[] };
  highlights: { title: string; meta: string; swipe: string; next: string; listLabel: string; more: ScoutLinkView;
                items: { round: string; tag: string; sep: string; title: string; shortTitle: string; body: string; short: string;
                         stackLine: string; featured: boolean }[] };
  attributes: { title: string; meta: string; legend: string; groups: { name: string; chips: { label: string; filled: boolean }[] }[] };
  trophies: { title: string; rows: { title: string; sub: string }[] };
  academy: { title: string; school: string; degreeLine: string; datesLine: string };
  teamUp: { eyebrow: string; headline: string; links: ScoutLinkView[] };
  footer: { credit: string; arena: { label: string; to: string }; next: string };
  actions: { label: string; card: { label: string; to: string }; teamUp: { label: string; href: string } };
}
export function buildScoutReport(c: Content, copy: UiCopy, routes: typeof ROUTES): ScoutReport;
```

- [ ] **Step 1: Failing `report.test.ts`** (uses the real `content`, `ui`, `ROUTES`):
  - **Hero:**
    - chips are `["Pune, India", "Software Engineer 1 · SINCE JUL 2024" (short "SE1 · SINCE JUL 2024"), "B.Tech IT · PICT · CGPA 8.94" (desktopOnly), "750+ PROBLEMS SOLVED" (short "750+ SOLVED", highlight)]`
    - `nameParts` is `["Yash", "Sarda"]`
  - **Career:**
    - row 0: `span "Jul 2024 – now"`, `status "NOT OUT"`, `roleLine "Software Engineer 1 · Pune"`, `stackLine` = content stack joined `" · "`, `bullets` = `ballByBall`, `compactTitle "Deutsche Bank"`, `compactLine "Software Engineer 1 · bulk upload cut manual entry 60%"`
    - row 1: `compactTitle "Deutsche Bank · Intern"`, no `compactLine`
    - `metaShort` is `"2 INNINGS"`
  - **Highlights:** order is THE FINAL, SEMI-FINAL, QUARTER-FINAL; `featured` only on the first; `body` = `scoutLine`; `more.href` = the GitHub URL.
  - **Attributes:** four groups, with the last named `"CRAFT & TOOLS"` holding `scout.craftAndTools` chips (all unfilled). Backend chips are Java, Spring Boot and JUnit filled, Apache Kafka not.
  - **Trophies:** five rows (the locked trophy excluded), first `{ title: "750+ Problems Solved", sub: "LeetCode · Codeforces · CodeChef" }`.
  - **Academy:** `degreeLine "B.Tech, Information Technology · Distinction, SPPU"`, `datesLine "Jul 2020 – Jun 2024 · CGPA 8.94"`.
  - **Team Up:** link labels are `["yashsarda2002@gmail.com", "LinkedIn · yash-sarda2107", "GitHub · yashsarda21", "Request resume"]`. The handle is the last URL path segment.
  - **Resume null:** `primary.label` is `"REQUEST RESUME"` and the href starts with `mailto:`. **No href in the whole report ends with `.pdf`** (walk the object).
  - **Resume set** (clone content with `resumePdf: "/yash-sarda-public.pdf"`): `primary.label` is `"VIEW PLAYER CARD (PDF)"` with `newTab: true`; the last link is `"Resume (PDF)"` with glyph `↓` and `download: "Yash-Sarda-Resume.pdf"`.
  - **Routes:** `header.enter.to === ROUTES.arena`, `actions.card.to === ROUTES.card`, `actions.teamUp.href === "#teamup"`.
  - **Uppercasing is CSS's job.** The report keeps content casing, except labels whose recipe has no uppercase: `trophies.rows[].sub` and `academy.datesLine` are rendered with an `uppercase` class.

- [ ] **Step 2: Run** → FAIL. **Step 3: Implement `report.ts`.** Pure functions, no React. Small private helpers:
  - `handle(url)`: last non-empty path segment.
  - `city(location)`: the part before the first comma.
  - `problemsValue(c)`: `cardStats` entry with label `"PROBLEMS"`; throw if missing.

  Use `getHighlights(c).slice().reverse()` for strongest-first (R2).

- [ ] **Step 4: Sections.** Port every spacing, size, colour and border from the artboards. Recipe and token mapping:

  | Artboard element | Desktop | Mobile (<768) |
  |---|---|---|
  | Page | `relative min-h-dvh bg-ground` + `<SkyGlow w="80%" h="500px" alpha={0.12} />` | same |
  | Header | `<header className="sticky top-0 z-20 border-b border-line bar md:backdrop-blur-glass max-md:bg-ground-a92">`. Inner: `mx-auto flex min-h-17 max-w-300 flex-wrap items-center justify-between gap-5 px-6`. Left: `BrandLockup size="sm" mark` (no label) + `MonoLabel variant="mono-eyebrow"` label in a `gap-3` row. Nav: `<nav aria-label>` `flex flex-wrap gap-5.5`, links `type-mono-nav text-text-2 hover:text-floodlight`. Right: `HUDButton as={ArenaLink} tone="volt-outline" to=/arena` | `h-15 px-4`, mark + nav + HUDButton hidden (`max-md:hidden`). Label `type-mono-label`, plus a `md:hidden` `ArenaLink` "ARENA →" in `type-mono-xs text-volt h-11` (glyph `aria-hidden`) |
  | Main | `<main id="main" className="mx-auto flex max-w-300 flex-col gap-24 px-6">` | `gap-4 px-4 pb-32` (room for the bottom bar) |
  | Hero section | `pt-20 gap-6.5`. Eyebrow `mono-eyebrow` volt: `{eyebrow}<span className="max-md:hidden"> {sep} {eyebrowMore}</span>`. H1 `type-hero-fluid`: `nameParts` as `<span className="max-md:block">` joined by `{" "}`. `p` `type-lede text-text-1 max-w-215 text-pretty`. Chips `ul flex flex-wrap gap-2.5`, `Chip size="meta" tone="meta"` / `volt-outline` (highlight); `short` labels swap via two spans `max-md:hidden` / `md:hidden`; `desktopOnly` li `max-md:hidden`. CTAs `flex flex-wrap gap-3.5 max-md:hidden`: `Button size="cta" skew={false} glow={false}` primary (as `a`) + `variant="outline"` (as `a href="#teamup"`) | `pt-6 gap-4`, `p` shows `summaryShort` (swap spans) |
  | Section wrapper | `<section id aria-labelledby className="flex scroll-mt-20 flex-col gap-5.5">` | `gap-2.5 border-t border-line pt-4` |
  | Career row | `<article className="grid grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-x-10 gap-y-3 border-b border-line py-4.5">`. Left column `gap-1.5`: date `type-mono-chip` (volt if current, else label): `{span} · {status}`; team `type-title-lg`; role `type-body text-text-2`; stack `type-mono-stack text-scout`. Bullets `ul list-disc pl-4.5 flex flex-col gap-2 type-body text-text-1` | Article `block border-b-0 py-0`, gap-0.5; date + `compactTitle` (`type-title-lg`) + `compactLine` (`type-body-sm text-text-2`); bullets/stack/role hidden (`max-md:hidden`); `!isCurrent` rows `max-md:opacity-75` |
  | Highlights | `ul` grid `grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] gap-4`. Card `article flex h-full flex-col gap-3 border p-5`: featured `border-volt-a45 bg-volt-a04`, else `border-line`. Round `type-mono-round` (volt if featured, else label): `{round} {sep} {tag}`. Title `type-title`, body `type-body-md text-text-2`, stack `type-mono-stack text-scout mt-auto`. "MORE ON GITHUB ↗" `a type-mono-nav text-volt hover:text-volt-hover` | Same items inside `HorizontalScroller` (`li w-62.5`); card `p-3.5 gap-1.5`; round shows `{round}` only (tag span `max-md:hidden`); title swaps to `shortTitle`; body swaps to `short` (`type-caption`); stack hidden. Section header meta slot shows `{swipe} {next}` on mobile, `meta` on desktop. Desktop grid vs mobile scroller: pass `listClassName="md:grid md:grid-cols-[repeat(auto-fit,minmax(min(300px,100%),1fr))] md:gap-4 md:overflow-visible md:snap-none"` and `fadeClassName="md:hidden"` to `HorizontalScroller`. **One list, not two.** |
  | Attributes | grid `minmax(min(250px,100%),1fr)` `gap-4`; card `flex flex-col gap-3 border border-line p-4.5`; name `type-title-sm`; chips `ChipList`-like `ul flex flex-wrap gap-2` with `Chip size="code" tone={filled ? "volt" : "strong"}`. Legend `type-mono-xs text-dim` | single column (grid collapses naturally) |
  | Trophies + Academy | `<section id="trophies" className="grid grid-cols-[repeat(auto-fit,minmax(min(360px,100%),1fr))] gap-10">`. Two columns `flex flex-col gap-4`, each starting with `SectionHeader size="md"`. Trophy row `div flex justify-between gap-4 border-b border-line py-2.5`: `type-body text-floodlight` + `type-mono-stack text-scout text-right uppercase`. Academy row `flex flex-col gap-1 border-b border-line py-2.5`: school `type-body-lg` + separate `"font-semibold"`; degree `type-body-md text-text-2`; dates `type-mono-stack text-scout uppercase` | stacked |
  | Team Up band | `<section id="teamup" className="mb-15 grid scroll-mt-20 grid-cols-[repeat(auto-fit,minmax(min(380px,100%),1fr))] items-end gap-9 bg-volt px-[clamp(20px,4vw,56px)] py-12 text-volt-ink">`. Eyebrow `MonoLabel variant="mono-eyebrow" tone="ink-2"`; h2 `type-band text-volt-ink`; links: `flex flex-col gap-0.5` of `LinkRow` | `py-8`, `mb-0` |
  | Footer | `<footer className="mx-auto flex max-w-300 flex-wrap justify-between gap-3 px-6 pb-12 type-mono-nav text-dim">` credit + `ArenaLink` volt "…ENTER THE ARENA →" | `px-4 pb-36` (above the bar) |
  | Mobile actions | `StickyBottomActions`: `Button as={ArenaLink} to=/card size="bar" variant="panel" skew={false}` + `Button as="a" href="#teamup" size="bar" skew={false} glow={false}` | only below 768 |

  Notes:
  - Values marked `px-[clamp(...)]` are the one allowed arbitrary spacing: the artboard's fluid band padding. Spacing isn't covered by the type/colour lint bans; confirm lint passes.
  - `scroll-mt-20` (80px) keeps anchored headings below the 68px header (Review Focus 1). It's not in the artboard; it doesn't change any pixel at scroll 0.
  - Every `a` with `glyph` keeps the glyph in `<span aria-hidden="true">`. External links stay same-tab, as drawn. Only the PDF (when it exists) opens in a new tab, with `rel="noopener"` and an sr-only "(opens in a new tab)" from `ui` copy. (`ui.scout.newTab`, added in Task 2).
  - `QuickView` renders `<div className="relative min-h-dvh bg-ground">` → SkyGlow, ScoutHeader, `<main>` (hero + sections), ScoutFooter, StickyBottomActions.
  - `QuickViewScreen` = `<QuickView report={buildScoutReport(content, ui, ROUTES)} />`. Compute the report once at module scope, since content is static.
  - Add a story-only fixture `QuickView.fixture.ts`. It exports `artboardReport: ScoutReport`, holding the **exact strings drawn in `QuickView.dc.html`** for desktop and `Mobile-QuickView.dc.html` for the short/mobile fields:
    - the artboard's rewritten bullets and stack orders
    - its four trophy rows (desktop) and "VIEW PLAYER CARD (PDF)"
    - mobile chip short "SE1 · SINCE 2024"
    - KUDO BOARD's `short` = `""`: render no `p` when empty, as drawn
  - Add the header comment: "Artboard copy for pixel-parity stories only. Real pages use buildScoutReport()."

- [ ] **Step 5: Stories** `QuickView.stories.tsx` (`title: "Features/Quick View"`, `parameters: { layout: "fullscreen" }`):
  - `RealContent` → `QuickViewScreen`
  - `ArtboardParity` → `<QuickView report={artboardReport} />`

  Wrap in a `MemoryRouter` if the Storybook preview doesn't already provide a router: check `.storybook/preview.tsx`, where the Landing fidelity story already renders `ArenaLink`.

- [ ] **Step 6: Parity tests** `tests/stories/scout.spec.ts`:
  ```ts
  import { expect, test } from "@playwright/test";
  import { expectMatchesArtboard } from "../support/visual";

  const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

  test("Quick View layout matches the QuickView artboard (artboard copy)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "desktop", "QuickView is a 1440-wide board");
    await page.setViewportSize({ width: 1440, height: 3300 });
    await page.goto(story("features-quick-view--artboard-parity"));
    await page.locator("#storybook-root > *").first().waitFor();
    const ratio = await expectMatchesArtboard(page, "QuickView", { maxDiffRatio: 0.02 });
    expect(ratio).toBeLessThanOrEqual(0.02);
  });

  test("Quick View mobile matches Mobile-QuickView (artboard copy)", async ({ page }, testInfo) => {
    test.skip(testInfo.project.name !== "mobile", "Mobile-QuickView is a 390×844 board");
    await page.goto(story("features-quick-view--artboard-parity"));
    await page.locator("#storybook-root > *").first().waitFor();
    const ratio = await expectMatchesArtboard(page, "Mobile-QuickView", { maxDiffRatio: 0.02 });
    expect(ratio).toBeLessThanOrEqual(0.02);
  });
  ```
  - If a run is over 2%, open `test-results/visual/*.diff.png` and fix the layout first. Masks are allowed **only** for logged deviations:
    - A2: the 10→11px mono lines on mobile (mask just those text boxes)
    - A10: the scroller's fade and hint
    - the mobile Kudo card body
  - Each mask gets a comment naming its §11 entry. If an A2 size change shifts everything below it on mobile, report the measured ratio and the diff image to the orchestrator instead of adding wide masks.

- [ ] **Step 7: Verify:** `pnpm vitest run && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build-storybook && VERIFY=1 pnpm test:stories`. Paste both parity ratios into the report.

- [ ] **Step 8: Commit** `feat(quick-view): scouting report screen from content, artboard-parity stories`.

---

### Task 5: Route, SEO tags, e2e and Lighthouse

**Files:**
- Modify: `app/routes/scout.tsx`, `src/shell/meta.ts`, `tests/e2e/routes.spec.ts`, `package.json`, `pnpm-workspace.yaml` (only if Lighthouse needs a build-script entry)
- Create: `tests/e2e/scout.spec.ts`, `tools/lighthouse.mjs`

**Interfaces:**
- Consumes: `QuickViewScreen`, `getPersonJsonLd`, `expectRegionMatchesArtboard`.
- Produces: `pageMeta(key, opts?: { type?: "website" | "profile"; jsonLd?: Record<string, unknown> })`.

- [ ] **Step 1: Meta.**
  - `pageMeta` returns, for every route:
    - `title`
    - `description`
    - `og:title` / `og:description` (property tags)
    - `og:type` (`opts.type ?? "website"`)
    - `og:site_name` = `ui.brand.siteName`
    - `twitter:card` = `"summary"`
  - With `jsonLd`, it appends `{ "script:ld+json": opts.jsonLd }`.
  - Unit-test `pageMeta` in a new `src/shell/meta.test.ts`: tags present; JSON-LD entry only when passed.
  - Route:
    ```tsx
    import type { Route } from "./+types/scout";
    import { content, getPersonJsonLd } from "@/content";
    import { QuickViewScreen } from "@/features/quick-view/QuickView";
    import { pageMeta } from "@/shell/meta";

    export const meta: Route.MetaFunction = () =>
      pageMeta("scout", { type: "profile", jsonLd: getPersonJsonLd(content) });

    export default function Scout() {
      return <QuickViewScreen />;
    }
    ```
  - Check that `app/routes` is allowed to import `@/content`. If the lint zone forbids it, move the JSON-LD into a `scoutMeta()` exported by the feature, and keep the route at meta + screen.

- [ ] **Step 2: `tests/e2e/scout.spec.ts`:**
  - **Without JS:**
    - `h1` reads "Yash Sarda" (case-insensitive)
    - all six `h2`s are visible (CAREER STATS, MATCH HIGHLIGHTS, PLAYER ATTRIBUTES, TROPHY ROOM, TRAINING ACADEMY, and the Team Up headline)
    - nav links have `href="#career"` etc.
    - no `a[href$=".pdf"]`
    - the resume link `href` starts with `mailto:`
  - **Desktop fidelity, real content:**
    - first `page.addStyleTag({ content: "header{position:static!important}" })`. Static keeps the same space in the flow, so nothing moves. It stops the sticky header painting over regions.
    - then `expectRegionMatchesArtboard(locator, "QuickView", key, { reference: { width: 1440, height: 3300 } })` for:
      - `header`
      - `hero`, masking the primary CTA box: R4 label differs. Compute the mask from the regions file (`heroCtas`) relative to `hero`.
      - `careerHead` → `#career > div:first-child`
      - `highlightsHead`
      - `attributes`
      - `trophiesHead` / `academyHead` → `#trophies h2` nth 0/1
      - `teamup`, masking the resume row: `teamupResume` relative to `teamup`
      - `footer`
    - Each ≤2%. `highlights` (stack wording differs, §11.2 #5) and the career/trophy bodies are covered by the parity story, not here.
  - **Anchors:** click nav "CAREER" → wait for `#career` to be in view → the `h2` box top ≥ the header box bottom and < 300.
  - **No horizontal overflow:** for widths 390, 768, 1024 and 1440, `document.documentElement.scrollWidth <= innerWidth`.
  - **Mobile (390×844):**
    - the bottom nav "Quick actions" is visible with PLAYER CARD → `/card` and TEAM UP → `#teamup`
    - the hero CTAs and section nav are hidden
    - the highlights list has an accessible name, is focusable, and has `scrollWidth > clientWidth`
    - "SWIPE" is visible
    - scroll to bottom → the footer link's bottom ≤ the bar's top
  - **Desktop:** the bottom bar is hidden.
  - **Meta:**
    - `meta[property="og:title"]` has the scout title, and `og:type` is `profile`
    - parse `script[type="application/ld+json"]` → `@type` `Person`, `name` "Yash Sarda"
    - the home page has `og:type` `website` and no ld+json
  - **Journey (spec §9.1):** on `/` (desktop), click "VIEW PORTFOLIO" → URL `/scout` → the `h1` is focused (RouteAnnouncer) → title is `ui.routes.scout.title`. Place it in `routes.spec.ts` next to the existing transition test.
  - `routes.spec.ts` keeps its generic heading check: `ui.routes.scout.heading` is now "YASH SARDA". Axe already runs on `/scout` at both sizes.

- [ ] **Step 3: Lighthouse.**
  - `pnpm add -D lighthouse`. If pnpm reports ignored build scripts, add it to `allowBuilds` with a comment, as in Phase 0.
  - Write `tools/lighthouse.mjs`:
    1. Requires an existing `build/client`; tells you to run `pnpm build` if it's missing.
    2. Starts `sirv build/client --single __spa-fallback.html --port 4174 --host 127.0.0.1` via `spawn` (port 4174, so the user's preview on 4173 is untouched). Waits for it to answer.
    3. Launches Chrome through `chrome-launcher` (a dependency of lighthouse) with `chromePath` = `chromium.executablePath()` from `@playwright/test`, flags `--headless=new`.
    4. Runs `/scout` with the desktop config and the mobile default config.
    5. Prints the category scores.
    6. Fails (exit 1) unless: desktop performance ≥ 0.90; accessibility = 1.00 on both; best-practices ≥ 0.90 and SEO ≥ 0.90 on desktop.
    7. Always kills the server and Chrome (`finally`).
  - Add the `"lighthouse": "node tools/lighthouse.mjs"` script. Not part of `verify`: it's slow. The orchestrator runs it at the phase exit.

- [ ] **Step 4: Verify:**
  - `pnpm verify`. If port 4173 is busy, stop and tell the orchestrator. Do not kill it.
  - `pnpm build && pnpm lighthouse`.
  - Paste the region ratios and Lighthouse scores into the report.

- [ ] **Step 5: Commit** `feat(scout): /scout route with OG + JSON-LD, e2e coverage, Lighthouse budget`.

---

## Phase 1 exit checklist (orchestrator)

1. **Visual check by eye.** Real `/scout` at 1440, 1024, 768 and 390 vs both artboards (screenshots side by side).
2. **Docs:**
   - spec §11:
     - log token merges (mobile glass .7/.8→.85, QV sticky bar .86→.9, Main/Intro glass .62/.10→.66/.09, Scoreboard border `#2A323C` vs Main `#232A33`)
     - R1, R2, R4, R6
     - A2/A10 masks
     - the QV trophies showing 5 content rows (§11.2 #10)
   - tick the carry-over rows
   - add Phase 7 rows: og:image / og:url / canonical
3. One **Opus review** of the whole branch (spec compliance, fidelity, a11y, code quality) → at most one fix wave.
4. `pnpm verify` green on the branch, plus `pnpm lighthouse` within budget.
5. Progress meter. Yash reviews `pnpm preview` → merge to `main` (fast-forward, no PR).

---

## Trivia: terms used in this plan

- **View model:** a plain object shaped exactly for one screen ("what to draw"), built from raw data. The screen then just draws it, which makes it easy to test and to feed fake data.
- **Fixture:** fake but realistic data used only by tests or stories. Here it holds the artboard's exact words.
- **Pixel parity / pixel diff:** taking a screenshot and counting how many pixels differ from the reference picture. We allow 2%.
- **Region comparison:** comparing just one box (e.g. the Attributes section) of a screenshot with the same box in the reference, so content above it can be a different height without failing the test.
- **Sticky header:** a header that scrolls with the page until it reaches the top, then stays there.
- **`scroll-margin-top`:** tells the browser "when jumping to this anchor, stop a bit lower", so the sticky header doesn't cover the heading.
- **Safe area:** the part of an iPhone screen not covered by the home bar or notch. `env(safe-area-inset-bottom)` gives its height.
- **JSON-LD:** a small block of structured data in the page that tells Google "this page is about a Person called Yash Sarda, a Software Engineer at…".
- **Open Graph (OG) tags:** meta tags that control the title, description and image when the link is shared on LinkedIn, WhatsApp, Slack and so on.
- **Lighthouse:** Google's page checker. It scores performance, accessibility, best practices and SEO from 0 to 100.
- **Edge fade:** a gradient at the edge of a scrolling row that hints "there's more this way".
- **Breakpoint:** a screen width where the layout switches (here 768px for mobile vs desktop).
