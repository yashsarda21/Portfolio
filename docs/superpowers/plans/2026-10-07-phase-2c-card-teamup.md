# Phase 2C — Player Card & Team Up Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**What this plan does (plain words):**
- **Player Card (`/card`):** your resume as a collector's player card.
  - **The card:** it floats gently, a light sheen passes over it, and it tilts toward the mouse (at most 6°, lifted 8px, border turning volt). Click it (or press Enter/Space) and it flips over.
  - **The back:** a section index (Career, Highlights, Skills, Trophy Room, Contact), so the card links to everything.
  - **The left side:** your profile with the card bio, home ground, pro debut, club and academy.
  - **The right side:** "Take the card with you" actions. These are REQUEST RESUME (it becomes View/Download PDF once a public PDF exists) and COPY SCOUTING LINK, which shows "LINK COPIED ✓" for 2 seconds.
- **Team Up (`/team-up`):** the contact page.
  - **The form:** pick a format (SIGN A PLAYER / DOUBLES / FRIENDLY RALLY), then fill in name, email and "the challenge". It checks itself as you go.
  - **SEND CHALLENGE:** posts to a form service if one is configured. Otherwise it opens the visitor's email app with everything pre-filled.
  - **After sending:** the success state from your design. The COMM line says "Challenge received. I'll serve first.", the floodlights pulse once, and the scoreboard reads "NEW FIXTURE · VISITOR vs YASH".
  - **The right side:** "Or skip the form" direct lines (Email, LinkedIn, GitHub, Coding profiles).
- **Both pages:**
  - use the shared content-page frame from 2A
  - get tablet and phone layouts
  - are checked against your artboards at 1440×900 within 2%

**Goal:** `/card` and `/team-up` render from real content inside the 2A frame:
- The card tilts, flips by mouse and keyboard, and does the reduced-motion version.
- Copy-link gives announced feedback.
- The form validates, submits by endpoint or by mailto, and shows success and error states.
- Artboard-copy fixture stories match `Player-Card@1440x900` and `Team-Up@1440x900` within 2%, and the real routes match with only logged deviations masked.
- No overflow, axe clean, `pnpm verify` green.

**Architecture:**
- **Same pattern as 2A/2B:** a pure view builder, a pure screen, a `…Screen` wrapper, an artboard-copy fixture and parity stories.
- **New generic design-system pieces:**
  - `PlayerCard`: a compound with `Front` and `Back` faces. It's a 3D flip container; the flip state is controlled by the parent.
  - `useTilt`: the pointer tilt hook. It uses GSAP `quickTo`, loaded lazily, and is off for touch and reduced motion.
  - `ActionRow`: the 74/64px rows with a title, sub-line and icon, tones `primary` and `glass`, plus a `status` slot for the "copied" feedback.
  - `ChannelCard`: the Team Up direct-line cards.
  - `DashedPanel`
  - motion presets `animate-card-float` and `animate-sheen`
  - Carry-over fixes: `StatTile` tone `cell` laid out as a row (label left, value right, baseline-aligned, as drawn), and `CommentaryBar` inline at 15px.
- **Team Up logic is plain TypeScript in the feature:**
  - `validate(values)` returns field errors.
  - `buildMailto(values, copy)` builds the email link.
  - `submitChallenge(values, { endpoint, fetch, openUrl })` returns `"sent" | "mailto" | "error"`.
  - `VITE_FORM_ENDPOINT` is read once in the shell config.
- **Without JS:** the form still works natively (`action` = endpoint or `mailto:`; `method="post"`).

**Tech Stack:** React 19, React Router 8 (prerender), Tailwind v4 Arena tokens, GSAP 3 core (`quickTo`, lazy import), Vitest + Testing Library + user-event, Playwright + axe + pixelmatch.

**Spec:** `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md`:
- §2 D2
- §5.3 (PlayerCard, PortraitFrame, ChannelCard, form primitives)
- §7 (card tilt `quickTo`, reduced motion)
- §11.1 A2, A3, A11
- §11.2 #6 (`player.cardBio`), #11 ("RECORD 99–1" brand line), #12 (SEASON = current year), #20 (tilt ≤6°, lift 8px, border volt)
- §11.8 (same-tab links; the document PDF opens a new tab)
- §12: Player Card back face; copy-link feedback; Team Up submit/success/error; resume buttons

**Measuring tape:**
- `design/handoff/design-source/Player-Card.dc.html`
- `design/handoff/design-source/Team-Up.dc.html`
- audit §3 (#28 StatTile cell, ActionRow, ChannelCard, forms §3.5)

**Builders read those artboards.**

**Carry-over absorbed:**
- "StatTile `cell` tone lays out as a row in the artboard" (Phase 2, Player Card)
- "Inline CommentaryBar line is 15px here vs 16px on the artboard" (Phase 2, Team-Up)

---

## Rulings for Yash to confirm

| # | Decision | Why | Easy to flip? |
|---|---|---|---|
| C1 | **Resume actions while there's no public PDF:** the volt row reads **"REQUEST RESUME · OPENS YOUR EMAIL APP"** (mailto). The "DOWNLOAD PDF" row is hidden. Both PDF rows appear automatically once `player.resumePdf` is set (View opens a new tab, Download downloads). | The phone-number PDF is never shipped (§12). A dead download row would look broken. | Automatic |
| C2 | **Card back face:** a section index with Career, Highlights, Skills, Trophy Room and Contact, each as a row linking to its page. The footer is the same as the front. | Spec §12 derived design. | Yes |
| C3 | **Flipping:** the card is a button labelled "Flip card: show the back" / "…show the front", with `aria-pressed`. Mouse drag tilts (desktop, fine pointer only); a click without dragging flips. With reduced motion, there's no float, sheen or tilt, and the flip swaps faces instantly. The hint under the card stays "DRAG TO TILT · CLICK TO FLIP FOR FULL RESUME" on desktop and reads "TAP TO FLIP" on touch. | A8: no global keys; the card is a normal button. | Yes |
| C4 | **SEASON:** the card shows the build year, then updates to the visitor's current year after load. "Pro debut" shows the full month name ("July 2024", as drawn). | Spec §11.2 #12. Computing it after load avoids a hydration mismatch. | — |
| C5 | **Team Up sending:** if `VITE_FORM_ENDPOINT` is set, the form POSTs JSON there (Formspree/Web3Forms-style; a hidden honeypot field drops bots). If not, it opens the visitor's email app pre-filled: subject "`{format}` — `{name}`", body = the challenge + their email. | Spec §12. Nothing to set up today, and it works the moment you add an endpoint. | Yes |
| C6 | **After sending:** the form area is replaced by the success panel. It has a heading "CHALLENGE RECEIVED", the COMM line "Challenge received. I'll serve first.", a scoreboard strip "NEW FIXTURE · VISITOR vs YASH" and a "SEND ANOTHER" button. Focus moves to the heading, and the floodlight glow pulses once (reduced motion: none). If sending fails, an error line appears with "OR EMAIL `{address}`" as a mailto link, and the form keeps the visitor's text. | Spec §12 derived design; the "AFTER YOU SEND" box on the artboard describes it. | Medium |
| C7 | The Team Up "AFTER YOU SEND" preview box stays on the page as drawn: it tells visitors what will happen. | As drawn. | Yes |
| C8 | **Phone (<768):** both pages are single column; the tab bar marks TEAM UP current on Team Up and nothing on Player Card. Player Card = title, then the card (scaled to the width, tap to flip), then the actions, then the profile rows. **Tablet:** Player Card = profile and card side by side, actions below; Team Up = form full width, direct lines below in 2 columns. | Spec §12 derived. | Medium |

---

## Global Constraints

All Phase 0–2B constraints apply:
- Arena tokens only.
- Literal class strings.
- **No pixel fitting in feature code** (`src/features/styleRules.test.ts` guard). Line-box via `Text`'s `leading="font"`; content-box and breakpoint switches live in recipes/components.
- **Before adding a type recipe, check that no existing one matches.** Phase 2A/2B consolidated duplicates.
- No raw hex/rgb/cubic-bezier in TS/TSX, no arbitrary type sizes, no inline `var(--color-*)`.
- **Links stay in the same tab.** Only document view/download (the PDF) opens a new tab, with the `ui.a11y.newTab` hint.
- Mono ≥11px (A2: the artboard's 10px card labels become 11px). Contrast ≥4.5:1. Volt focus ring (ink on volt). **A11:** fields get the focus ring plus a volt border, never `outline:none`. Reduced motion respected.
- **No visible copy in components or routes.** Fixtures are imported by stories only.
- **Folder rules:**
  - features import shell/design-system/content/lib/assets
  - design-system imports nothing from content/shell/features
  - env is read only in `src/shell/config.ts`
- **GSAP:** core only, imported lazily inside the tilt hook (`await import("gsap")`), never at module top level on these routes.
- **Lean testing:**
  - unit tests for view builders, `validate`, `buildMailto`, `submitChallenge` (fake fetch), and the copy-link state
  - component tests for PlayerCard flip semantics, ActionRow status, the form error wiring (`aria-invalid` / `aria-describedby`, focus first error)
  - parity stories
  - e2e: no-JS content, keyboard flip, copy-link, form flows (mailto path; endpoint path with a route-intercepted fake endpoint), success focus, overflow, tab bar
- git 2.15. Branch `phase/2-content`. Commits end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Ports: 4173 / 6007, never kill others' processes; 6006 is Yash's Storybook.

## Review Focus

1. **Form accessibility:**
   - every field has a visible label
   - errors are linked (`aria-describedby`) and announced
   - on submit with errors, focus moves to the first invalid field
   - the radio group is a real fieldset/legend with arrow-key movement
   - success focus lands on the success heading
   
   Tests: Task 4 component + e2e.
2. **No data loss or duplicate sends:**
   - while sending, the button is disabled (`aria-disabled`) and a second click doesn't send twice
   - on error, the visitor's text stays
   - "SEND ANOTHER" clears it
   
   Test: Task 4 unit (`submitChallenge` with a slow fake) + e2e.
3. **Card flip for everyone:**
   - keyboard Enter/Space flips
   - the hidden face is `inert`/`aria-hidden`, so its links can't be tabbed to while facing away
   - reduced motion swaps instantly
   - touch: tap flips, no tilt
   
   Test: Task 2 component + Task 3 e2e.
4. **Clipboard can fail** (no permission, insecure context, old browser). The button then shows the link text selected in a fallback field, with "COPY THIS LINK", and never throws. Test: Task 3 unit with clipboard rejected.
5. **Private PDF + email:**
   - no `.pdf` href while `resumePdf` is null
   - the mailto subject and body are URL-encoded (a name with `&`, `?` or a newline can't break the link)
   - the endpoint gets JSON, never the honeypot value as a real field
   
   Tests: Task 4 unit, Task 3 e2e.

---

## File map

| File | Task | Purpose |
|---|---|---|
| `src/content/{format.ts,format.test.ts,ui-copy.ts}` | 1 | `formatMonthLong("2024-07") → "July 2024"`; `ui.pages.card`, `ui.pages.teamUp` copy |
| `src/shell/config.ts` (+ test) | 1 | `formEndpoint` from `import.meta.env.VITE_FORM_ENDPOINT` (https only, else null) |
| `src/design-system/broadcast/{PlayerCard,ActionRow,ChannelCard}.tsx`, `layout/DashedPanel.tsx`, `lib/useTilt.ts` (+ tests/stories) | 2 | new pieces |
| `src/design-system/broadcast/{StatTile,CommentaryBar}.tsx`, `tokens/motion.css` | 2 | cell row layout, inline 15px, float + sheen presets |
| `src/features/card/*`, `app/routes/card.tsx`, `tests/{stories,e2e}/card.spec.ts` | 3 | Player Card |
| `src/features/team-up/*`, `app/routes/team-up.tsx`, `tests/{stories,e2e}/team-up.spec.ts` | 4 | Team Up |
| spec §11, carry-over | Orchestrator | logs, ticks |

---

### Task 1: Copy, long-month format and form config

**Files:**
- Modify: `src/content/format.ts`, `format.test.ts`, `ui-copy.ts`, `index.ts`
- Create: `src/shell/config.ts`, `src/shell/config.test.ts`

**Interfaces — Produces:**
- `formatMonthLong(ym: string): string`
- `formEndpoint: string | null`, exported from `src/shell/config.ts`. Read `import.meta.env.VITE_FORM_ENDPOINT`; accept only `https://` URLs.
- `ui.pages.card`, `ui.pages.teamUp`, `ui.a11y.copied` (below)

- [ ] **Step 1: Failing tests:**
  - `formatMonthLong("2024-07") === "July 2024"`; it rejects bad input like `formatMonth` does
  - `config`: a parse helper `parseEndpoint(raw)` returns null for undefined, `http://`, `"javascript:…"` and empty, and returns the URL for `https://formspree.io/f/x`

- [ ] **Step 2: UI copy** (exact strings):
  ```ts
  pages: { /* existing */
    card: {
      eyebrow: "RESUME · ONE CARD, EVERYTHING ON IT",
      titleLines: ["PLAYER", "PROFILE"],
      rows: { home: "Home ground", debut: "Pro debut", club: "Current club", academy: "Academy" },
      season: "SEASON", number: "THE ARENA · NO. 01", position: "POSITION",
      hint: "DRAG TO TILT · CLICK TO FLIP FOR FULL RESUME", hintTouch: "TAP TO FLIP",
      flipToBack: "Flip card: show the back", flipToFront: "Flip card: show the front",
      backTitle: "THE FULL SHEET",
      back: { career: "CAREER STATS", highlights: "MATCH HIGHLIGHTS", skills: "PLAYER ATTRIBUTES", trophies: "TROPHY ROOM", contact: "TEAM UP" },
      take: "TAKE THE CARD WITH YOU",
      view: { title: "VIEW PLAYER CARD", sub: "FULL RESUME · OPENS AS PDF" },
      download: { title: "DOWNLOAD PDF", sub: "YASH-SARDA-RESUME.PDF" },
      request: { title: "REQUEST RESUME", sub: "OPENS YOUR EMAIL APP" },
      copy: { title: "COPY SCOUTING LINK", sub: "OPENS STRAIGHT TO QUICK VIEW", done: "LINK COPIED ✓", fallback: "COPY THIS LINK" },
      backNote: { label: "ON THE BACK OF THE CARD",
        text: "Career scorecard · Match highlights · Attributes · Trophy room · Academy · Contact — the same facts as the PDF, one tap from flipping.",
        meta: "SOFTWARE ENGINEER 1 · SDE RESUME" },
      comm: "Scouts usually stop here. Good call.",
      next: "TEAM UP",
    },
    teamUp: {
      eyebrow: "CONTACT",
      intro: "You've seen how I play. I'd rather be on your side of the net.",
      formats: { legend: "CHOOSE YOUR FORMAT",
        sign: { title: "SIGN A PLAYER", sub: "You're hiring for a role." },
        doubles: { title: "DOUBLES", sub: "Let's build something together." },
        rally: { title: "FRIENDLY RALLY", sub: "Just saying hi. Or talking sport." } },
      fields: { name: "YOUR NAME", namePh: "Who's challenging?", email: "EMAIL", emailPh: "you@company.com",
        message: "THE CHALLENGE", messagePh: "The role, the problem, or the match you want to talk about." },
      errors: { name: "Tell me who's challenging.", email: "That email doesn't look right.", message: "Add a line or two about the challenge (at least 10 characters)." },
      send: "SEND CHALLENGE", sending: "SENDING…", orEmail: "OR EMAIL",
      skip: "OR SKIP THE FORM",
      channels: { email: "EMAIL", linkedin: "LINKEDIN", github: "GITHUB", coding: "CODING PROFILES", codingSub: "LeetCode · Codeforces · CodeChef — {solved} solved" },
      after: { label: "AFTER YOU SEND", comm: "Challenge received. I'll serve first.",
        text: "Floodlights pulse once, the crowd lifts, and the scoreboard reads", board: "NEW FIXTURE · VISITOR vs YASH" },
      success: { title: "CHALLENGE RECEIVED", again: "SEND ANOTHER" },
      error: "That didn't go through. Your message is still here.",
      honeypot: "Leave this empty",
    },
  },
  a11y: { /* existing newTab */ copied: "Scouting link copied" },
  ```
  `{solved}` is filled from `cardStats` PROBLEMS by the view builder. Never format copy inside components.

- [ ] **Step 3: Verify:** `pnpm vitest run && pnpm typecheck && pnpm lint && pnpm build`. **Commit** `feat(content): player card and team up copy, long month format, form endpoint config`.

---

### Task 2: Design-system pieces

**Files:**
- Create:
  - `src/design-system/broadcast/PlayerCard.tsx`
  - `src/design-system/lib/useTilt.ts`
  - `src/design-system/broadcast/ActionRow.tsx`
  - `src/design-system/broadcast/ChannelCard.tsx`
  - `src/design-system/layout/DashedPanel.tsx`
  - stories: `broadcast/Card.stories.tsx`, `layout/Panels.stories.tsx`
  - tests: `PlayerCard.test.tsx`, `ActionRow.test.tsx`, `useTilt.test.ts`
- Modify: `broadcast/StatTile.tsx` (cell = row: label left, value right, baseline, padding 10, as drawn) + its stories/tests; `broadcast/CommentaryBar.tsx` (inline line 15px, as drawn on Team-Up); `tokens/motion.css` (`animate-card-float` 6s ease-in-out infinite, rotateY −12→−8° / rotateX 5→3° / translateY 0→−8px; `animate-sheen` 4.5s background-position); `index.ts`

**Interfaces — Produces:**
```ts
PlayerCard: { flipped: boolean; onFlip: () => void; label: string /* button aria-label for the current direction */;
              front: ReactNode; back: ReactNode; float?: boolean; className? }
  // 400×640 card (content-box per artboard), border volt-a45, holo shadow (shadow-holo), gradient 160°, sheen overlay;
  // root = <button type="button" aria-pressed={flipped}> wrapping a preserve-3d inner; faces backface-hidden;
  // the hidden face gets `inert` + aria-hidden; reduced motion: no float/sheen/tilt, faces swap without rotation.
PlayerCard.Header / Portrait / Name / Stats / Footer helpers OR documented slot classes — keep the anatomy reusable for Intro (Phase 3).
useTilt(ref, { max: 6, lift: 8 }): { onPointerMove, onPointerLeave, dragging: boolean }
  // fine pointer only (matchMedia "(pointer: fine)"), not under reduced motion; lazy-imports gsap and uses quickTo for rotateX/rotateY/y;
  // distinguishes drag (moved > 4px while pressed) from click so a drag never flips.
ActionRow<T = "a">: polymorphic; { title: string; sub: string; icon: IconName; tone: "primary" | "glass"; status?: ReactNode /* replaces sub, aria-live polite */ }
  // primary 74 tall, D 24/900/.1em + mono 11 ink-2 sub; glass 64 tall, D 20/800/.1em + mono 11 scout; hover border volt (glass)
ChannelCard<T = "a">: { icon: IconName; title: string; sub: string; glyph: ReactNode }   // 70 tall glass grid 44|1fr|20, icon volt
DashedPanel: { label: string; children }                                                  // 1px dashed line-strong, p 20, gap 10
```

- [ ] **Step 1: Failing tests:**
  - **PlayerCard:**
    - is a button with `aria-pressed` false → true after a click calls `onFlip`
    - the back face is `inert` and `aria-hidden` when not flipped, and the front is when flipped
    - Enter and Space trigger `onFlip` (native button)
  - **useTilt:**
    - does nothing when `matchMedia("(pointer: fine)")` is false or reduced motion is on (mock matchMedia)
    - a pointer move under 4px followed by click is a click, and over 4px sets `dragging` (assert via the returned flag; mock gsap)
  - **ActionRow:**
    - `status` replaces the sub and sits in a polite live region
    - the primary tone has volt classes
  - **StatTile `cell`:** label and value are in one row (flex-row)

- [ ] **Step 2: Implement.** Port exact values from `Player-Card.dc.html` (card anatomy, actions) and `Team-Up.dc.html` (channel cards, dashed panel). Any new colour = a token (the card gradient `#141B23 → #0A0E13 → #11160E`; `#11160E` may need `--ref-card-end`). Log new tokens.

- [ ] **Step 3: Stories:**
  - PlayerCard front/back (static and interactive), reduced-motion variant
  - ActionRow tones + copied status
  - ChannelCard ×4 icons
  - DashedPanel with inline CommentaryBar
  - StatTile cell grid of 6

- [ ] **Step 4: Verify:** `pnpm vitest run && pnpm typecheck && pnpm lint && pnpm format:check && pnpm build-storybook && VERIFY=1 pnpm test:stories`. **Commit** `feat(design-system): player card with flip and tilt, action rows, channel cards, dashed panel; stat cell row + inline comm 15px`.

---

### Task 3: Player Card (`/card`)

**Files:**
- Create in `src/features/card/`:
  - `view.ts`, `view.test.ts`
  - `CardPage.tsx` (`CardPage` + `CardScreen`)
  - `Profile.tsx`, `CardFaces.tsx`, `TakeAway.tsx`
  - `useCopyLink.ts`, `useCopyLink.test.ts`
  - `CardPage.fixture.ts`, `CardPage.stories.tsx`
- Create: `tests/stories/card.spec.ts`, `tests/e2e/card.spec.ts`
- Modify: `app/routes/card.tsx`

**Interfaces:**
```ts
export interface CardView {
  titleLines: string[]; bio: string;
  rows: { k: string; v: string; accent?: boolean }[];              // Home ground · Pune, India / Pro debut · July 2024 / Current club · Deutsche Bank / Academy · PICT · CGPA 8.94 (accent)
  front: { position: { value: string; label: string }; mark: string; season: { label: string; buildYear: number };
           portrait: { src: string; alt: string }; name: string; line: string;   // "SOFTWARE ENGINEER · DEUTSCHE BANK" (case by CSS)
           stats: { label: string; value: string; accent: boolean }[];             // cardStats; first 3 accent (as drawn)
           footer: { left: string; right: string } };                              // THE ARENA · NO. 01 / RECORD 99 – 1
  back: { title: string; items: { label: string; to: string }[]; footer: { left: string; right: string } };
  hint: { pointer: string; touch: string };
  take: { label: string; actions: ({ kind: "pdf-view" | "pdf-download" | "request"; title: string; sub: string; href: string; newTab?: boolean; download?: string })[];
          copy: { title: string; sub: string; done: string; fallback: string; url: string } };
  backNote: { label: string; text: string; meta: string };
  flip: { toBack: string; toFront: string };
}
export function buildCardView(c: Content, copy: UiCopy, routes: typeof ROUTES, opts: { portraitSrc: string; origin: string; buildYear: number }): CardView;
export function useCopyLink(url: string, copy: { done: string; fallback: string }): { state: "idle" | "copied" | "fallback"; copy: () => Promise<void> };
```

- [ ] **Step 1: Failing tests:**
  - **view:**
    - rows as listed; academy row `accent`
    - stats are 6, with the first 3 accented
    - **resume null:** exactly one take-away action, kind `request` with a mailto href, and no `.pdf` anywhere
    - **resume set** (clone): `pdf-view` (newTab) + `pdf-download` (download name from `ui.scout.resume.fileName`)
    - `copy.url` = `origin + ROUTES.scout`
    - back items link to career/highlights/attributes/trophies/team-up
    - `footer.right` = `ui.record.career`
  - **useCopyLink:**
    - clipboard resolves → `copied`, back to `idle` after 2000ms (fake timers)
    - clipboard rejects or is missing → `fallback`, never throws

- [ ] **Step 2: Implement** the view and hook. `origin` comes from `window.location.origin` on the client; during prerender, use a relative URL so nothing breaks.

- [ ] **Step 3: Screen.** `ContentPage`:
  - `route="card"`, no venue; trail = [] (breadcrumb "HUB / PLAYER CARD")
  - backdrop: the volt radial at the centre + the floor ellipse plane from the artboard, as a design-system scene utility (no inline colours)
  - no rematch
  - next = TEAM UP → `ROUTES.teamUp`
  - `comm` from copy

  Layout at ≥1200 (from the artboard):
  - the profile column (420): title on 2 lines, bio 18/1.55, `KeyValueList` rows 15px with top borders, academy row volt
  - the card (400×640 at x 520, top 120) + the hint centred under it
  - the actions column (x 984 → right 36, top 236): "TAKE THE CARD WITH YOU", `ActionRow`s, copy row with `useCopyLink` status, then the back-note block (top border)

  The card front uses `PortraitFrame size="card"` (Task 2B) inside `PlayerCard`. `SEASON {year}` updates to the client year after mount (C4).

  Tablet/phone per C8.

- [ ] **Step 4: Fixture + stories:** exact artboard strings, including the artboard's VIEW PLAYER CARD + DOWNLOAD PDF rows (story only, safe `#` anchors with no `.pdf`). `RealContent`, `ArtboardParity`, `Flipped`.

- [ ] **Step 5: Parity** `tests/stories/card.spec.ts`:
  - `ArtboardParity` vs `Player-Card` at 1440×900, ≤2%
  - pause the float/sheen at frame 0 (the artboard's own frame 0 is `rotateY(-12deg) rotateX(5deg)`). Make sure the static base transform equals that frame.
  - masks: COMM only

- [ ] **Step 6: Route + e2e** (`tests/e2e/card.spec.ts`):
  - **No JS:** `h1` text "PLAYER PROFILE"; the card's name and stats attached; the REQUEST RESUME mailto present; no `.pdf` href
  - **Keyboard:** focus the card, press Enter → `aria-pressed=true`, the back links are reachable by Tab and the front's aren't; Space flips back
  - **Copy link:**
    - grant clipboard permissions (Chromium) → click → "LINK COPIED ✓" visible and announced (polite region), and `navigator.clipboard.readText()` ends with `/scout`
    - without permission (override `navigator.clipboard.writeText` to reject via `addInitScript`) → the fallback shows the URL
  - **Reduced motion:** the card's computed `animation-name` is `none`; a flip still swaps faces
  - **Fidelity:** real route ≤2%. Masks: COMM, the take-away rows area (C1 differs from the artboard), the SEASON year if it differs from 2026.
  - **Overflow** 360–1440; **phone:** `expectTabBarClear`, one-line next button

- [ ] **Step 7: Verify** `pnpm verify`. **Commit** `feat(card): player card page with tilt, flip and back index, take-away actions and copy-link feedback`.

---

### Task 4: Team Up (`/team-up`)

**Files:**
- Create in `src/features/team-up/`:
  - `view.ts`, `view.test.ts`
  - `form.ts`, `form.test.ts`: `validate`, `buildMailto`, `submitChallenge`
  - `TeamUpPage.tsx` (`TeamUpPage` + `TeamUpScreen`)
  - `ChallengeForm.tsx`, `DirectLines.tsx`, `SuccessPanel.tsx`
  - `TeamUpPage.fixture.ts`, `TeamUpPage.stories.tsx`, `parts.test.tsx`
- Create: `tests/stories/team-up.spec.ts`, `tests/e2e/team-up.spec.ts`
- Modify: `app/routes/team-up.tsx`

**Interfaces:**
```ts
export type Format = "sign" | "doubles" | "rally";
export interface ChallengeValues { format: Format; name: string; email: string; message: string; website: string /* honeypot */ }
export type FieldErrors = Partial<Record<"name" | "email" | "message", string>>;
export function validate(v: ChallengeValues, copy: UiCopy["pages"]["teamUp"]["errors"]): FieldErrors;   // trims; email = one @, a dot in the domain, no spaces; message ≥ 10 chars
export function buildMailto(v: ChallengeValues, to: string, formatTitle: string): string;               // encodeURIComponent subject + body
export async function submitChallenge(v: ChallengeValues, deps: { endpoint: string | null; fetch: typeof fetch; openUrl: (u: string) => void; to: string; formatTitle: string }): Promise<"sent" | "mailto" | "error" | "dropped">;
  // honeypot filled → "dropped" (pretend success, send nothing); endpoint → POST JSON {format,name,email,message} with Accept: application/json,
  // 2xx → "sent", else "error", network throw → "error"; no endpoint → openUrl(mailto) → "mailto"
export interface TeamUpView { /* copy + formats[] + fields + channels[] (email, linkedin, github, coding with {solved} filled) + after + success + orEmail { label, href } */ }
export function buildTeamUpView(c: Content, copy: UiCopy): TeamUpView;
```

- [ ] **Step 1: Failing `form.test.ts`:**
  - **validate:** empty name/email/message → three errors; `"a@b"` invalid; `"a@b.co"` valid; whitespace-only message invalid
  - **buildMailto:** a name with `&?` and a message with a newline are encoded; the subject = "`{format title}` — `{name}`"
  - **submitChallenge:**
    - honeypot → `dropped` and fetch is not called
    - endpoint 200 → `sent` (the body is JSON without `website`)
    - endpoint 500 → `error`
    - fetch throws → `error`
    - no endpoint → `openUrl` called with the mailto → `mailto`

  `view.test.ts`: channels in order with hrefs from `contact`; the coding sub has "750+ solved"; formats in order sign/doubles/rally.

- [ ] **Step 2: Implement** `form.ts` and `view.ts` (pure).

- [ ] **Step 3: Screen.** `ContentPage`:
  - `route="teamUp"`, no venue
  - backdrop = the volt radial at 78% 50% + the sky at 30% −10% (artboard), using design-system glows with props
  - no rematch, no next CTA (as drawn), no `comm` on mount

  **`ChallengeForm`:**
  - a `<form noValidate>` with `action`/`method` set for no-JS (endpoint, or `mailto:` + `enctype="text/plain"`)
  - `Fieldset` legend + 3 `RadioCard`s (default `sign`)
  - two `TextField`s in a 2-column grid
  - a `TextArea` (110 tall)
  - the honeypot (visually hidden, `tabIndex=-1`, `autocomplete="off"`, labelled by `ui…honeypot`)
  - `Button size="l"` skewed volt "SEND CHALLENGE" (62 tall: check the size map; add a size in the design system if none is 62/24/900/.14em) + "OR EMAIL `{address}`" mono 12/.12em as a mailto link

  On submit:
  - validate, set errors, focus the first invalid field
  - otherwise set `sending` (button `aria-disabled`, label "SENDING…") and call `submitChallenge` with `formEndpoint` from `@/shell/config`
  - on `sent`/`mailto`/`dropped` → success; on `error` → the error line + the OR EMAIL link, values kept

  **`SuccessPanel`** replaces the form (C6):
  - an `h2` "CHALLENGE RECEIVED" (focused, `tabIndex=-1`)
  - the inline `CommentaryBar` with the success line, plus `useCommentary().say(line)`
  - a scoreboard strip "NEW FIXTURE · VISITOR vs YASH" (reuse the design-system Scoreboard/StatTile pieces; no new one-off)
  - the floodlight pulse on the backdrop glow (a motion preset; reduced motion none)
  - "SEND ANOTHER" resets the form and focuses the name field

  **`DirectLines`:** "OR SKIP THE FORM" + 4 `ChannelCard`s (same tab, `ui.glyph.external` aria-hidden) + the `DashedPanel` "AFTER YOU SEND" (C7).

  Tablet/phone per C8; TEAM UP tab current.

- [ ] **Step 4: Fixture + stories:** `RealContent`, `ArtboardParity` (exact artboard strings, form idle), `Errors`, `Sending`, `Success`, `SendError`.

- [ ] **Step 5: Parity** `tests/stories/team-up.spec.ts`: `ArtboardParity` vs `Team-Up` at 1440×900, ≤2%, no masks expected (no COMM on mount).

- [ ] **Step 6: Route + e2e** (`tests/e2e/team-up.spec.ts`):
  - **No JS:** `h1` "TEAM UP"; the form has `action` starting with `mailto:` (no endpoint in the test build); all 3 formats and 4 channels present
  - **Validation:** submit empty → 3 errors, focus on YOUR NAME, each field `aria-invalid` with `aria-describedby` → error text; fixing the fields clears the errors
  - **Mailto path:**
    - stub `window.open`/`location.assign` via `addInitScript` to capture the URL
    - fill → send → the captured URL starts with `mailto:yashsarda2002@gmail.com?subject=`
    - success heading focused; COMM line announced
  - **Endpoint path:** build-time env isn't available in e2e, so test `submitChallenge` with the endpoint in unit tests. If the screen accepts an injected endpoint in a story, cover the endpoint success/error UI in the story gate (`SendError` story axe-clean, error text visible).
  - **Keyboard:** arrow keys move between format radios
  - **Fidelity:** real route ≤2%; masks only for content-wording differences (list them)
  - **Overflow** 360–1440; **phone:** TEAM UP `aria-current`, `expectTabBarClear`

- [ ] **Step 7: Verify** `pnpm verify` + `pnpm build && pnpm lighthouse`. **Commit** `feat(team-up): challenge form with validation, endpoint or email sending, success and error states; direct lines`.

---

## Phase 2C exit checklist (orchestrator)

1. Visual check by eye: `/card` (front, back, copied) and `/team-up` (idle, errors, success) at 1440, 1024, 768 and 390.
2. Docs:
   - spec §11: C1–C8, new tokens/presets, masks
   - carry-over ticks (StatTile cell, inline COMM)
   - note for Phase 6: Team Up prefill "I beat you." and Giant Killer unlock
3. Opus review → stop for Yash → fix wave (limited tests) → stop for Yash → full test pass.
4. Progress meter → Yash previews → merge to `main`. Phase 2 is then complete; next is the Phase 3 plan (Landing + Intro animation).

---

## Trivia: terms used in this plan

- **3D flip / backface-visibility:** two faces glued back to back inside a box that rotates 180°. The browser hides whichever face points away from you.
- **`inert`:** an HTML attribute that makes a part of the page unclickable and unfocusable, like it isn't there for keyboard and screen-reader users. It's used on the card face that's turned away.
- **`quickTo` (GSAP):** a fast way to make something smoothly follow a moving value, like the mouse position, without creating a new animation every frame.
- **Honeypot field:** a hidden form field that people never see or fill, but spam bots do. If it has a value, we quietly drop the message.
- **mailto link:** a link that opens the visitor's email app with the address, subject and message already filled in.
- **Form endpoint:** a web address (e.g. from Formspree) that receives the form's data and forwards it to your inbox, so no server of our own is needed.
- **Clipboard API:** the browser feature that copies text for the visitor. It can be blocked, so we always have a fallback.
