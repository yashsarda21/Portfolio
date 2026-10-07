# Phase 3 — Landing + Player Intro Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**What this plan does (plain words):**
- **Landing (`/`), desktop:** the stadium starts dark. The four floodlight banks flicker on one by one, the sky and pitch light up, a volt scan line sweeps the scoreboard, **YASH SARDA** boots out of a blur, then SOFTWARE ENGINEER, then "Think you can beat me?" and the two buttons rise in. The COMM line says "New challenger enters the arena." Timings are your Main board's (about 5.5 s). Returning visitors get a 1.5 s cut-down (your Opening board).
- **Landing, phone:** your Mobile-Landing board exactly (no animation, as drawn): two banks, the stacked YASH / SARDA scoreboard, full-width ENTER THE ARENA ("LITE · ONE-THUMB GAMES") and VIEW PORTFOLIO, a SOUND OFF toggle.
- **Player Intro (`/intro`), desktop:** your Intro board's full ~6 s entrance:
  - lights flick on, the board powers up
  - the silhouette swings in with ghost trails and light trails, hits with a volt shockwave and glitch
  - the 48-frame head turn plays (turn, chin lift, nod), lit by the key light, with the eye-line lens flare
  - 90 scoreboard pixels fly into the name, and YASH SARDA locks in letter by letter
  - SOFTWARE ENGINEER is wiped in by a white bar, then PLAYER 01 • ENGINEER • BUILDER • COMPETITOR ticks in
  - the stadium flashes, WELCOME TO MY ARENA rises, ENTER THE ARENA → pulses, COMM "The player has entered the arena."
  - afterwards he breathes, and a light sweep crosses him every 6 s
  - REPLAY and SKIP INTRO in the top right
- **Intro on tablet and phone (derived):** the phone-style scoreboard with your rest-pose portrait, the name locking in and the CTA — 4 s on tablet, 2 s on phone.
- **Reduced motion:** everything is simply there. No head-turn frames are even downloaded.
- **Speed:** GSAP (the animation library) leaves the first-load bundle and loads only when needed; the head-turn frames (~2.1 MB) load in the background after the landing has painted.

**Goal:** `/` and `/intro` match `Main@1440x900`, `Mobile-Landing@390x844` and `Intro@1440x900` (end states) within 2 %, with only logged deviations masked:
- the intro is one GSAP timeline factory with labels (desktop / tablet / mobile tiers + reduced motion), unit-tested
- skip, replay, keyboard and no-JS paths work
- Lighthouse: landing text visible < 1.5 s
- axe clean, `pnpm verify` green

**Architecture:**
- **Landing = CSS choreography.**
  - The boot is CSS keyframes with per-beat delays from one `LANDING_BEATS` map, multiplied by a `--pace` variable.
  - A tiny inline `<head>` script sets `data-return-visit` (pace 0.25) before first paint, plus `.js` on `<html>`.
  - It plays from the first paint without waiting for JavaScript, and works with JS off.
- **Intro = one GSAP timeline factory.**
  - `createIntroTimeline(gsap, refs, { tier, onBeat })` in `src/features/intro/timeline.ts` is built from **labels** in an `INTRO_BEATS` table per tier, not hard-coded seconds inside tweens.
  - A track whose ref is missing is skipped, so tablet and phone reuse the factory with fewer tracks.
  - Pure helpers (`createPixels`, `createLetters`, `frameAt`) reproduce the artboard's seeded maths and are unit-tested.
  - `gsap.matchMedia()` picks the tier, and reverts on resize and unmount.
- **Before the timeline runs**, the intro's animated parts are hidden by CSS under `.js` (so no flash of the end state). A CSS fallback reveals them at 8 s if the script never runs. Without JS, the end state shows.
- **New generic design-system pieces:**
  - `SpriteStrip` (one sprite-strip layer)
  - `Dust` (one canvas, ≤60 specks)
  - `Scoreboard` sizes (`compact` for phones, the Intro board's tighter header and footer) + `power` overlay layers (board-on and board-hit rings as opacity layers)
  - `FloodlightBank` flat sizes + a `flare` layer
  - `ArenaBackdrop layout="intro"`
  - `Stage` `from="md" | "lg"` + the stage mono floor
  - boot / scan / rise-in CSS presets that read `--d` and `--pace`
- **Shell additions:**
  - `HEAD_FLAGS_SCRIPT`
  - `loadGsap()` (lazy; the transition imports it inside `go()` and prefetches on idle)
  - `useScreenShortcuts` (A8: screen-scoped keys)
  - commentary stays silent on phones

**Tech Stack:** React 19, React Router 8 (prerender, `ssr:false`), Tailwind v4 Arena tokens, GSAP 3 core (lazy `import("gsap")`, `matchMedia`, percentage keyframes), Vitest + Testing Library, Playwright + axe + pixelmatch, Lighthouse.

**Spec:** `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md`:
- §1 (done = 1440×900 + 390×844, FCP < 1.5 s)
- §2 D2
- §4.3, §4.4 (Stage)
- §4.6 (transitions, commentary, audio gate)
- §5.3 (scene tier: Dust, FloodlightBank, Scoreboard)
- §7 (motion layers, sprite rig, reduced motion, perf rules)
- §9.1 (Lighthouse at phase 3)
- §10 phase 3 row
- §11.1 A2, A3, A8
- §11.2 #11 (RECORD 99 – 1 brand line), #16–18 (newest timing source wins)
- §11.4 D-1 (cone tops under the lamps)
- §11.6 (Main glass / scoreboard merges)
- §12 (ticket gate = the CTA; mobile intro)
- §13 (rig assets, preload after first paint)
- §14 (rig budget, stage blur)

**Measuring tape (builders read these):**
- `design/handoff/design-source/Main.dc.html`, `Intro.dc.html`, `Mobile-Landing.dc.html`, `Opening.dc.html` (return-visit cut-down, ticket gate)
- `design/handoff/README.md` §6 (intro table) and §8 (rig: 16 frames × 700×564, shown at 560×451, `background-size: 8960px 451px`, 0 → −8400 px, `steps(16, jump-none)` over .667 s, chained at 2.517 s and 3.183 s)
- `docs/superpowers/specs/2026-10-03-arena-design-audit.md` §5.1 (Main + Intro keyframe rows), §5.3, §6.5 (intro procedural code), §9 (mobile deltas)

**Carry-over absorbed** (`docs/superpowers/plans/phase-0-carryover.md`; Task 8 ticks them):
- "Phase 3: tablet (768–1199) Stage shrinks 11px mono to ~6px" → ruling L1 + L2
- "Phase 3: commentary live region on the mobile placeholders" → ruling L11
- "Phase 3 / 7: lazy-load GSAP" → Task 1
- "Main reference shows SOFTWARE ENGINEER with collapsed tracking" → ruling L10
- "Intro light cones: apply D-1" → Task 2
- "Count-up has no controlled trigger …" → **moved to Phase 4** (the intro has no count-ups; the Hub's record and matchday do)
- New row added for Phase 4: "Hub tablet treatment (drawer per §12) and the stage mono floor at Hub scale"

---

## Rulings for Yash to confirm

| # | Decision | Why | Easy to flip? |
|---|---|---|---|
| L1 | **Tablet (768–1199 px):** Landing and Intro use the **phone-style layout, centred and wider** (max 640 px column, one size step up), not the shrunken 1440×900 stage. | A scaled stage at 1024 px puts the 11 px labels at ~7.8 px, and at ~5.9 px on a portrait iPad (breaks A2). | Medium |
| L2 | **Laptop screens (stage scaled below 100 %, e.g. 1280×720, 1366×768):** the small mono labels inside the stage keep a **real 11 px minimum** (they grow slightly in the design space). At 1440×900 nothing changes. | A2 holds on every desktop, not only at 1440×900. | Yes |
| L3 | **Landing boot is CSS, not GSAP.** It starts at the very first paint, works with JS off, and costs no JavaScript. The Intro is GSAP (30+ tracks, replay, sprite chaining). | Spec §7 lists the landing boot under GSAP. CSS gives the same artboard timings with better first paint, so it is logged as a deviation. | Yes |
| L4 | **Return visit:** from the second visit on, the landing boot is a ~1.5 s cut-down (Opening board), via a flag saved in the browser. **Ticket gate:** no separate screen. ENTER THE ARENA unlocks sound (spec §12, as today). | Opening board: "RETURN VISIT → 1.5s CUT-DOWN". | Yes |
| L5 | **Phone landing as drawn:** static (the board has no animation), SOUND OFF toggle, no COMM, no keyboard hint, no SKIP INTRO. **Phones start muted** unless the visitor turned sound on before; desktop starts on. | Mobile-Landing board + README matrix ("2s… sound off"). | Yes |
| L6 | **Intro on phone and tablet (derived; no board exists):** the Mobile-Landing frame with intro content.<br>• The board header reads LIVE · PLAYER INTRODUCTION.<br>• Your **rest-pose portrait** (68 KB, no head-turn frames) sits in the board, and the name locks in letter by letter.<br>• Then SOFTWARE ENGINEER, the tagline, a two-cell footer (RECORD 99 – 1, STATUS UNDEFEATED), WELCOME TO MY ARENA and a full-width ENTER THE ARENA →.<br>• REPLAY + SKIP INTRO sit in the top row.<br>• Timing: **2 s on phones** (lights + name + CTA, README), **4 s on tablets** (adds the portrait slide-in and the tagline tick). | README §9 matrix; spec §12 "mobile intro (2s)". | Medium |
| L7 | **Slow connection on the intro:**<br>• The lights and silhouette play while the head-turn frames load.<br>• If they aren't ready when the head turn is due, the timeline **waits up to 1.5 s** at that beat, then carries on with the rest pose (no head turn). It never stays dark.<br>• On desktop, the landing quietly preloads the frames after it has painted and the browser is idle. It skips this for reduced motion, data saver, or phone/tablet. | Spec §7 / §13 / §14: frames load after first paint; never block. | Yes |
| L8 | **SKIP INTRO** goes to the Arena Hub on both pages (as now). **REPLAY** restarts the intro from the dark stadium, and is hidden under reduced motion (nothing to replay). The intro never auto-advances; the visitor presses ENTER THE ARENA →. | Audit §6.5: no auto-advance; skip → Hub. | Yes |
| L9 | **Keyboard shortcuts (A8):** on the desktop Landing only, **Enter** = ENTER THE ARENA and **Q** = Quick View. They are ignored while focus is on any link, button or field (so Enter keeps its normal meaning there), with Ctrl / Alt / Cmd held, and on phones. They exist only while the Landing is on screen. | Spec A8; WCAG 2.1.4. | Yes |
| L10 | **SOFTWARE ENGINEER keeps its wide .42 em tracking** at the end of the boot. The Main board's frozen end state collapses it to .02 em, a side-effect of its keyframe (audit risk #11). The parity test keeps masking that box, logged. | Intent beats a keyframe accident (the Intro board draws it wide too). | Yes |
| L11 | **Commentary on phones is silent**, for screen readers too: phones show no commentary, so they announce none. Desktop announces as today. | Spec §4.6 "hidden on mobile"; screen readers hear what is on screen. | Yes |
| L12 | **Dust in the light beams** on desktop Landing and Intro: one canvas, ≤60 specks at 15 % opacity, drifting slowly inside the two cones. Off on phones and tablets, under reduced motion, and while the tab is hidden. | README §6 + Opening F2 ("dust drifts in the beams"); spec §7 dust rule. Not drawn on Main/Intro, so derived. | Yes |
| L13 | **Lighthouse on `/`:**<br>• **Gated:** FCP < 1.5 s, CLS < 0.1, accessibility 100, best practices ≥ 0.9, SEO ≥ 0.9, and performance ≥ 90 in a **reduced-motion run** (it measures the code's real cost).<br>• **Reported, not gated:** the full-motion performance score, because your 3 s name reveal counts as the "largest paint" by design.<br>`/scout` keeps its existing gate. | Spec §9.1 FCP budget; the designed reveal is not a defect. | Yes |
| L14 | **Intro animation rule (spec §7):** only `transform` and `opacity` are animated, plus `filter` blur and the 0.32 s `clip-path` glitch inside the intro. The board power-up, impact ring and bank flare are separate glow layers whose **opacity** animates, instead of animating `box-shadow`. | 60 fps; spec §7 perf rules. | — |

---

## Global Constraints

All Phase 0–2 constraints apply:
- **Styling:**
  - Arena tokens only; literal class strings.
  - **No pixel fitting in feature code** (`src/features/styleRules.test.ts` guard). Line box via `Text`'s `leading="font"`; content-box and breakpoint switches live in recipes/components.
  - Stage screens place parts at **artboard coordinates** with spacing-scale classes (e.g. `top-35 left-67.5`), as the Phase 0 landing does. That is design-space layout, not fitting.
  - **Check that no existing type recipe matches before adding one** (2A/2B/2C consolidated duplicates).
  - No raw hex / rgb / cubic-bezier in TS/TSX, no arbitrary type sizes, no inline `var(--color-*)`. GSAP eases come from `src/lib/motion.ts` (`EASE.follow` etc., mirroring the CSS tokens); no curve strings in features.
- **Accessibility:**
  - Mono ≥ 11 px on screen (A2; with L2 the floor holds inside a scaled stage). Contrast ≥ 4.5:1. Volt focus ring (A3).
  - **Nothing invisible is focusable or clickable:** anything that fades in starts `visibility:hidden` (CSS `from` keyframe or GSAP `autoAlpha`).
- **No visible copy in components or routes.** New strings go in `src/content/ui-copy.ts` (`ui.landing.*`, `ui.intro.*`); lines from `content.commentary`; the name and title from `content.player`. The record is `ui.record.career` ("RECORD 99 – 1"; split label and value if needed, never retype it).
- **Folder rules:**
  - features import shell / design-system / content / lib / assets
  - design-system imports nothing from content / shell / features
  - features never import each other (delete `src/features/landing-preview`; `landing` replaces it)
- **GSAP:**
  - core only
  - **never imported at module top level** in app code after Task 1; always `await loadGsap()`
  - every timeline built inside `gsap.matchMedia()` or `gsap.context()` and reverted on unmount
- **Assets:**
  - Rig strips are copied (not moved) from `design/handoff/assets/character-rig/` to `src/assets/rig/turn_{0,1,2}.webp`.
  - `src/assets/portrait-rest.webp` already exists (reuse it as the rest pose and the sweep mask).
  - Never touch `Yash-Sarda-Resume.pdf`.
- **Lean testing:**
  - unit tests for every pure helper, the timeline factory (labels, tiers, durations, skipped tracks, reduced end state), the head flags script, shortcuts scope, the GSAP lazy loader
  - parity stories for the end states
  - route parity
  - e2e for skip / replay / keyboard / no-JS / reduced motion / return visit / slow rig / viewports
  - no snapshot tests
- **Git and environment:**
  - git 2.15 (no `switch` / `restore`). Branch `phase/3-landing`.
  - Commits end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
  - Ports: tests use 4173 / 6007. Never kill others' processes; 6006 and 5173 are Yash's.
  - The host is often heavily loaded: re-run timeouts with `--workers=2`, never weaken an assertion.

## Review Focus

1. **Hidden but reachable.** During the landing boot and the intro, a control that is not yet visible must not take focus or clicks. Tab from the top at t = 0 reaches the HUD buttons only, and SKIP INTRO works at every moment. Tests: Task 3 e2e (landing Tab order at t = 0 and after the boot), Task 6 e2e (intro CTA not focusable before its beat, focusable after; SKIP at t = 0.5 s).
2. **Interrupting the intro.** SKIP mid-timeline, REPLAY spam (5 clicks in 1 s), back then forward to `/intro`, resizing across 1200 px and 768 px mid-play: no console errors, no leftover GSAP tweens on unmounted nodes, no stuck hidden parts, the end state is reached once per play. Tests: Task 5 unit (revert kills tweens; restart idempotent), Task 6 e2e (replay spam + skip mid-play + console error listener), Task 7 e2e (resize mid-play).
3. **Shortcut scope (A8).**
   - Enter on a focused link or button does its own action only (no double navigation).
   - Q with Ctrl / Cmd / Alt does nothing, and Q while typing in any field does nothing.
   - Shortcuts are gone after leaving the Landing and inactive below `lg`.
   
   Tests: Task 3 unit (`useScreenShortcuts`) + e2e.
4. **Slow, failed or missing rig frames.** Strip requests delayed 5 s or answered 404: the intro still finishes, with the rest pose and no head turn, within 6 s + 1.5 s. Reduced motion makes **no** strip requests. JS disabled: the end state is visible and SKIP / ENTER links work. A JS error before the timeline starts: the parts appear by 8 s (CSS fallback). Tests: Task 6 e2e (route-intercepted delay / 404, request log, `javaScriptEnabled: false`).
5. **Viewport extremes.** Check at 2560×1080, 1440×900, 1366×768, 1280×720, 1199×800, 1024×768, 768×1024, 390×844, 375×667 and 360×640. All of these must hold:
   - no horizontal scroll
   - CTAs never clipped (short phones scroll the page instead)
   - rendered mono ≥ 11 px
   - the stage letterbox shows stadium, not black
   - exactly one rendered `<h1>`
   
   Tests: Task 4 + Task 7 e2e loops, Task 1 e2e (mono floor at 1280×720).

---

## Task 1: Shell and stage foundations (lazy GSAP, head flags, mono floor, phone silence)

**Files:**
- Modify: `src/lib/motion.ts` (replace the static re-export), `src/shell/transition.tsx`, `src/design-system/lib/useTilt.ts` (use the shared loader), `src/design-system/layout/Stage.tsx`, `src/design-system/tokens/base.css` (mono recipes), `src/shell/commentary.tsx`, `app/root.tsx`
- Create: `src/shell/headFlags.ts` (+ test), `src/lib/motion.test.ts`
- Modify tests: `tests/e2e/routes.spec.ts` (add the mono-floor case), existing transition / commentary unit tests as needed

**Interfaces:**
- Produces:
  - `loadGsap(): Promise<typeof import("gsap").gsap>`: memoised dynamic import.
  - `prefetchGsap(): void`: on `requestIdleCallback` (fallback: `setTimeout` 1 s).
  - `EASE`: `{ follow, snap, swing, entrance, standard, absorb }` as GSAP ease functions. GSAP core has no `cubic-bezier()` ease and `CustomEase` is a plugin, so they are built by the small `bezier()` helper below from the same numbers as the CSS tokens.
  - `prefersReducedMotion()` (unchanged).
  - `HEAD_FLAGS_SCRIPT: string` (sets `.js` on `<html>`; sets `data-return-visit` when `localStorage["arena:landing-seen"]==="1"`, inside try/catch).
  - `LANDING_SEEN_KEY = "arena:landing-seen"`.
  - `<Stage from="md" | "lg">` (default `"md"`; replaces `desktopOnly`; `desktopOnly={false}` callers become `from={null}`).
  - The `--stage-mono-floor` contract (below).
  - Commentary: `say()` is a no-op below `md` (L11).

- [ ] **Step 1: Failing tests (unit).**
```ts
// src/lib/motion.test.ts
import { describe, expect, it, vi } from "vitest";
describe("loadGsap", () => {
  it("imports gsap once and returns the same instance", async () => {
    const { loadGsap } = await import("./motion");
    const [a, b] = await Promise.all([loadGsap(), loadGsap()]);
    expect(a).toBe(b);
    expect(typeof a.timeline).toBe("function");
  });
});
describe("bezier", () => {
  it("matches the CSS curve end points and is monotonic for the follow curve", async () => {
    const { bezier } = await import("./motion");
    const f = bezier(0.22, 1, 0.36, 1);
    expect(f(0)).toBe(0);
    expect(f(1)).toBe(1);
    expect(f(0.5)).toBeGreaterThan(0.85); // follow-through is front-loaded
  });
});
```
```ts
// src/shell/headFlags.test.ts: run the script string against a fake document/localStorage
import { describe, expect, it } from "vitest";
import { HEAD_FLAGS_SCRIPT } from "./headFlags";
function run(seen: string | null, throws = false) {
  const attrs: Record<string, string> = {};
  const classes = new Set<string>();
  const document = { documentElement: { classList: { add: (c: string) => classes.add(c) }, setAttribute: (k: string, v: string) => (attrs[k] = v) } };
  const localStorage = { getItem: () => { if (throws) throw new Error("blocked"); return seen; } };
  new Function("document", "localStorage", HEAD_FLAGS_SCRIPT)(document, localStorage);
  return { attrs, classes };
}
describe("HEAD_FLAGS_SCRIPT", () => {
  it("marks JS on", () => expect(run(null).classes.has("js")).toBe(true));
  it("marks a return visit", () => expect(run("1").attrs["data-return-visit"]).toBe(""));
  it("first visit has no flag", () => expect(run(null).attrs["data-return-visit"]).toBeUndefined());
  it("survives blocked storage", () => expect(run(null, true).classes.has("js")).toBe(true));
});
```
Run: `pnpm vitest run src/lib/motion.test.ts src/shell/headFlags.test.ts`. Expected: FAIL (exports missing).

- [ ] **Step 2: Implement `src/lib/motion.ts`.**
```ts
import type { gsap as Gsap } from "gsap";

let pending: Promise<typeof Gsap> | null = null;
/** GSAP is loaded on demand so it never sits in the first-load bundle (spec §9.1 budget). */
export function loadGsap(): Promise<typeof Gsap> {
  pending ??= import("gsap").then((m) => m.gsap);
  return pending;
}
/** Warm the GSAP chunk once the page is idle (landing → intro, any wipe). */
export function prefetchGsap(): void {
  if (typeof window === "undefined") return;
  const idle = window.requestIdleCallback ?? ((cb: () => void) => window.setTimeout(cb, 1000));
  idle(() => void loadGsap());
}
/** CSS cubic-bezier as a GSAP ease function (x→y by Newton iterations). */
export function bezier(x1: number, y1: number, x2: number, y2: number): (t: number) => number {
  const cx = 3 * x1, bx = 3 * (x2 - x1) - cx, ax = 1 - cx - bx;
  const cy = 3 * y1, by = 3 * (y2 - y1) - cy, ay = 1 - cy - by;
  const x = (t: number) => ((ax * t + bx) * t + cx) * t;
  const dx = (t: number) => (3 * ax * t + 2 * bx) * t + cx;
  const y = (t: number) => ((ay * t + by) * t + cy) * t;
  return (p) => {
    if (p <= 0) return 0;
    if (p >= 1) return 1;
    let t = p;
    for (let i = 0; i < 8; i++) {
      const d = dx(t);
      if (Math.abs(d) < 1e-6) break;
      t -= (x(t) - p) / d;
    }
    return y(Math.min(1, Math.max(0, t)));
  };
}
/** The motion tokens (tokens.css --ease-*) as GSAP eases. Keep in step with the CSS values. */
export const EASE = {
  follow: bezier(0.22, 1, 0.36, 1),
  snap: bezier(0.2, 0.9, 0.1, 1),
  swing: bezier(0.65, 0, 0.35, 1),
  entrance: bezier(0.12, 0.9, 0.25, 1),
  standard: bezier(0.4, 0, 0.2, 1),
  absorb: bezier(0.7, 0, 0.84, 0),
} as const;
export function prefersReducedMotion(): boolean {
  return typeof window !== "undefined" && !!window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;
}
```
Add a unit test that reads `tokens.css` and asserts each `EASE` key's four numbers equal the `--ease-*` token (one source of truth checked, not duplicated silently).

- [ ] **Step 3: Transition and tilt use the loader.** In `transition.tsx`, `go()` does `const gsap = await loadGsap()` before the cover. The reduced-motion and no-ref early return stays before the await, so reduced motion never loads GSAP. `TransitionProvider` calls `prefetchGsap()` once on mount. `useTilt` switches to `loadGsap()`. Existing transition and tilt tests stay green. Verify with `pnpm build` that no entry / root chunk contains GSAP: add `tests/e2e/smoke.spec.ts` case "first load does not request the gsap chunk before idle". Record request URLs during `page.goto("/scout")` until `load`; assert none matches `/gsap/i`. Vite names the chunk after the module; if the name is hashed only, assert via `build/client/.vite/manifest.json`, which a small node test can read. Pick whichever is deterministic and say which in the report.

- [ ] **Step 4: Head flags.** `src/shell/headFlags.ts`:
```ts
export const LANDING_SEEN_KEY = "arena:landing-seen";
/** Inline in <head>, before first paint: `.js` lets CSS hide parts a timeline will reveal; a return visit gets the cut-down pace. */
export const HEAD_FLAGS_SCRIPT = `(function(){var d=document.documentElement;d.classList.add('js');try{if(localStorage.getItem('${"arena:landing-seen"}')==='1')d.setAttribute('data-return-visit','')}catch(e){}})();`;
```
(Write the key once: build the string from `LANDING_SEEN_KEY` with a template literal; the test above runs the real string.) In `app/root.tsx`, add `<script dangerouslySetInnerHTML={{ __html: HEAD_FLAGS_SCRIPT }} />` next to `STAGE_SCALE_SCRIPT`.

- [ ] **Step 5: Stage `from` + mono floor.**
  - `Stage` takes `from?: "md" | "lg" | null` (default `"md"` → `max-md:hidden`; `"lg"` → `max-lg:hidden`; `null` → always shown) and sets `[--stage-mono-floor:11px]` on `[data-stage]`.
  - In `base.css`, every **mono** recipe whose size is ≤ 13 px gets `font-size: max(<size>, calc(var(--stage-mono-floor, 0px) / var(--stage-scale, 1)))`.
    - Outside a stage, the floor var is unset, so the max is the size (no change anywhere else).
    - Keep each recipe's `@media (width < 48rem)` step: apply the same `max()` there.
  - Add a comment block above the mono recipes explaining L2.
  - Update the Stage story; add a Storybook check that the 1440×900 stage renders the hint at 12 px (scale 1: unchanged).

- [ ] **Step 6: e2e mono floor.** In `tests/e2e/routes.spec.ts` (desktop project): at 1280×720 on `/`, for the keyboard hint and the scoreboard footer label, `parseFloat(getComputedStyle(el).fontSize) * scale ≥ 11` (scale read from `--stage-scale`). At 1440×900 the hint's computed size is exactly 12 px.

- [ ] **Step 7: Phones stay silent (L11).** In `commentary.tsx`, `say()` returns early when `matchMedia("(max-width: 767px)").matches`. Unit test with a mocked `matchMedia`: below md nothing is queued or announced; at md and up, unchanged.

- [ ] **Step 8:** `pnpm typecheck && pnpm lint && pnpm test`, the touched stories and e2e files, then commit `feat(shell): lazy GSAP, head flags, stage mono floor, commentary silent on phones`.

---

## Task 2: Scene and scoreboard pieces for the boot and the intro

**Files:**
- Modify: `src/design-system/scene/{FloodlightBank,ArenaBackdrop,LightCone}.tsx`, `src/design-system/broadcast/Scoreboard.tsx`, `src/design-system/tokens/{scene,motion}.css`, `src/design-system/index.ts`, `Scene.stories.tsx`, `Boards.stories.tsx`, `Scene.test.tsx`, `Boards.test.tsx`
- Create: `src/design-system/scene/{Dust,SpriteStrip}.tsx`, `src/lib/sprite.ts` (+ test), `src/assets/rig/turn_0.webp`, `turn_1.webp`, `turn_2.webp` (copied)

**Interfaces:**
- Produces:
  - `FloodlightBank` sizes `lg-flat` (112×44) and `sm-flat` (84×32) (Intro board). A `flare` child layer: the bright 80px/420px glow at opacity 0, which the intro tweens; `data-part="flare"`. **Remove `flickerDelay` from `ArenaBackdrop`'s defaults** and add a `boot?: boolean` prop: `true` (Landing) applies the CSS flicker with `--d` per bank and `--pace`; `false` (Intro) leaves the banks for the timeline.
  - `ArenaBackdrop layout="landing" | "intro"`: positions from Main (`landing`, current) and Intro (`intro`: crowd top 530 h300 alpha .6, field top 690 1300×700 tilt 72, cones 540×800 at top 60 / side 40 alpha .14, banks `lg-flat` left 80 top 34, `sm-flat` left 380 top 20, mirrored).
    - **Apply D-1 to the intro cones**: the apex spans each `lg-flat` lamp. Compute the percentages like the existing `scene-cone-left` / `-right` comment, and add `scene-cone-left-intro` / `-right-intro` (or parametrise `--cone-apex-*` vars; prefer vars over two more utilities).
    - Each scene layer gets `data-part` (`sky`, `crowd`, `field`, `pitch`, `cone-left`, `cone-right`, `bank-1..4`, `mast-*`) so the landing CSS and the intro timeline address them without new props.
  - Scoreboard:
    - `size: "landing" | "intro" | "compact"`, named for where the board shape comes from.
      - `landing` = current (header 53, footer 71, 3 cols).
      - `intro` = header 48 with its own `bg-board`, footer 64 with `type-score-md` values (22px; check for an existing recipe first).
      - `compact` = Mobile-Landing: header 38 (11px mono, A2), body padding 26/14, footer 48, `grid-cols-2`, values 18px, 5px bezel shadow `shadow-board-compact`.
    - `Scoreboard.Power`: two absolutely placed ring layers (`data-part="board-on"`, `data-part="board-hit"`), opacity 0 by default. **The landing board renders without them; the resting ring is the board's own shadow** (L14).
    - `Scoreboard.Scan` (`variant: "band" | "bar"`): Main's 90h vertical band (α .16) or Intro's 90w horizontal bar (α .24); `data-part="scan"`.
    - `Scoreboard.Title` / `.Subtitle` follow the size (compact: stacked name, recipe `type-hero-stack` 96/.82 with an `md:` step (120/.82) inside the recipe; subtitle `type-sub-sm` 18/.38em with its `md:` step). **Check existing recipes first.** The tracking-matched `pl-[…]` moves into the Subtitle per size.
  - `SpriteStrip({ src, frames = 16, className })`: a div with `background: url(src) 0 0 / {frames*100}% 100% no-repeat` (so it scales to its box; at 560×451 that is 8960×451). `data-frame` is set by the caller.
  - `src/lib/sprite.ts`:
```ts
/** Frame index for steps(frames, jump-none): 0 at the start, frames-1 at the end, equal holds between. */
export function frameAt(progress: number, frames: number): number {
  if (progress <= 0) return 0;
  return Math.min(frames - 1, Math.floor(progress * frames));
}
/** background-position-x for a frame, as a percentage of the strip (jump-none ends at 100%). */
export function framePosition(frame: number, frames: number): string {
  return `${(frame / (frames - 1)) * 100}% 0`;
}
```
  - `Dust({ count = 60, regions })`:
    - one `<canvas aria-hidden>` sized to its parent; specks drift up / sideways inside the given polygons (the two cone clips)
    - alpha .15, 1–2 px, `requestAnimationFrame`
    - paused on `visibilitychange` hidden; not started under reduced motion or below `lg` (checked by matchMedia at mount and on change)
    - cancels its frame and listeners on unmount
  - CSS presets in `motion.css`, all reading `--d` (delay) and `--pace` (default 1, `:root[data-return-visit] { --pace: .25 }`):
    - `animate-boot-fade` (Main `fadein`, 1.8s ease-out)
    - `animate-boot-rise` (18px, .9s follow)
    - `animate-boot-name` (Main `boot`: blur 10 → 0, tracking .3em → the element's own, opacity 0 → .7 at 55% → 1; 1.2s follow)
    - `animate-boot-scan` (translateY −120% → 420%, opacity 1 → 0, 1.4s ease-in)
    - `animate-bank-flicker` reuses the existing keyframes with `--pace`
    - Every `from` frame also sets `visibility: hidden` (Review Focus 1).
    - `animation-delay: calc(var(--d, 0s) * var(--pace, 1))` and `animation-duration: calc(<base> * var(--pace, 1))`.
    - The existing reduced-motion rule in `base.css` already ends them instantly.
    - The subtitle keeps `.42em` at the end (L10). For it, the name keyframe animates `letter-spacing` from `calc(var(--boot-from, .3em))` to `var(--boot-to, .02em)`; the subtitle sets `--boot-from:.7em; --boot-to:.42em`.
  - CSS for the intro's hidden-before-play state, in `motion.css`:
```css
/* Parts an intro timeline reveals: hidden only when JS is on (no flash of the end state before GSAP starts);
   if the timeline never runs (script error), they appear at 8s. Without JS, or with reduced motion, they are just there. */
@keyframes intro-fallback { to { visibility: visible; } }
@utility intro-part {
  :root.js [data-intro="pending"] & { visibility: hidden; animation: intro-fallback 0s 8s forwards; }
  @media (prefers-reduced-motion: reduce) { :root.js [data-intro="pending"] & { visibility: visible; animation: none; } }
}
```
    Also the intro idle loops as CSS utilities (spec §7: loops are CSS):
    - `animate-breathe` (3.6s, origin bottom)
    - `animate-face-sweep` (6s, the 100deg gradient, `bg-size 300% 100%`, with `mask-image` from a `--mask` var)
    - `animate-cta-glow` (exists)
    
    All are off under reduced motion.

- [ ] **Step 1: Failing tests.**
  - `src/lib/sprite.test.ts`:
```ts
import { expect, it } from "vitest";
import { frameAt, framePosition } from "./sprite";
it("steps(16, jump-none): 16 equal holds from frame 0 to 15", () => {
  expect(frameAt(0, 16)).toBe(0);
  expect(frameAt(1 / 16 - 1e-9, 16)).toBe(0);
  expect(frameAt(1 / 16, 16)).toBe(1);
  expect(frameAt(0.999, 16)).toBe(15);
  expect(frameAt(1, 16)).toBe(15);
});
it("frame 15 of 16 is the strip's end (-8400px at 560px frames = 100%)", () => {
  expect(framePosition(15, 16)).toBe("100% 0");
  expect(framePosition(0, 16)).toBe("0% 0");
});
```
  - `Scene.test.tsx`: `ArenaBackdrop layout="intro"` renders 4 banks with `lg-flat` / `sm-flat` and a `flare` layer each. `boot` adds the flicker class only when true. Every layer has its `data-part`.
  - `Boards.test.tsx`: `size="compact"` renders 2 footer cells and the compact header. `Scoreboard.Power` renders two `aria-hidden` layers.
  - `Dust`: under a mocked reduced-motion `matchMedia` no rAF is requested; unmount cancels the frame (spy on `cancelAnimationFrame`).

  Run them; expect FAIL.

- [ ] **Step 2: Implement the pieces above.** No raw colours in TSX. New colour values go to `tokens.css` as `--ref-*` / semantic tokens, e.g. the intro backlight `rgba(255,150,60,.22)` → `--ref-warm-a22` if no warm token exists; check the light families first. Log any merge that moves a value > ~2 % in spec §11.11 (Task 8 collects them; list them in your report).

- [ ] **Step 3: Stories.** In `Scene.stories.tsx`:
  - `ArenaBackdrop` Landing (boot, played to the end) and Intro (resting end state)
  - `Dust` (desktop viewport)
  - `FloodlightBank` flat sizes with the flare at 1
  
  In `Boards.stories.tsx`: Scoreboard `compact` and `intro`, plus Power layers at 1. Story a11y passes.

- [ ] **Step 4:** Run the unit tests and `pnpm build-storybook && pnpm test:stories --grep "Scene|Boards"`. The existing `/` parity (`routes.spec.ts` "home matches the Main artboard") must still pass. The banks get `boot` in Task 3, so for this task `ArenaBackdrop`'s default stays the current flicker until Task 3 switches it (say so in the report). Commit `feat(design-system): intro scene layout, scoreboard sizes and power layers, sprite strip, dust, boot presets`.

---

## Task 3: Landing desktop (CSS boot, return visit, shortcuts, rig prefetch)

**Files:**
- Create: `src/features/landing/{beats.ts,view.ts,view.test.ts,LandingPage.tsx,LandingScreen.tsx,Landing.stories.tsx,landing.fixture.ts}`, `src/shell/useScreenShortcuts.ts` (+ test), `src/features/landing/prefetchRig.ts` (+ test)
- Delete: `src/features/landing-preview/` (and its imports)
- Modify: `app/routes/home.tsx`, `src/content/ui-copy.ts` (only if a string is missing), `tests/e2e/routes.spec.ts`, `tests/e2e/smoke.spec.ts`
- Create: `tests/e2e/landing.spec.ts`

**Interfaces:**
- Consumes (Task 1–2):
  - `ArenaBackdrop boot`, `Scoreboard.Scan variant="band"`, `animate-boot-*`, `--pace`
  - `HEAD_FLAGS_SCRIPT` / `LANDING_SEEN_KEY`, `Stage from="lg"`
  - `loadGsap` / `prefetchGsap`
- Produces:
  - `LANDING_BEATS` (seconds, from Main): `crowd .3, coneL 1.0, coneR 1.5, sky 2.2, field 2.4, pitch 2.6, boardHeader 2.7, scan 2.7, name 3.0, title 3.6, boardFooter 4.0, ctas 4.5, comm 5.2, hint 5.2`; banks `.6 / 1.1 / 1.6 / 2.0`.
  - `buildLandingView(content, ui, routes)` → `{ heading, title, header: {live, player}, footer: [...], challenge, enter: {label, sub, subPhone, to}, view: {label, sub, to}, hint, comm, skip: {label, to}, audio }`.
  - `useScreenShortcuts(map: Record<string, () => void>, { enabled })` in shell, reused by the Hub in Phase 4. Keys are matched on `event.key` lowercased. It is ignored when `event.defaultPrevented`, when any of `ctrlKey` / `metaKey` / `altKey` is held, when `event.target` is `input, textarea, select, [contenteditable], a, button, [role=button], [role=tab]`, or when `enabled` is false. Listeners attach on mount and detach on unmount.
  - `prefetchRig(urls)`: after `load`, then idle. It runs only when `matchMedia("(min-width: 1200px)")` matches, reduced motion is off and `navigator.connection?.saveData` isn't true. It creates `Image()` objects (nothing appended); idempotent across calls.

- [ ] **Step 1: Failing tests.**
  - `view.test.ts`: every string comes from `content` / `ui`. `enter.to === ROUTES.intro`, `view.to === ROUTES.scout`, `skip.to === ROUTES.arena`, and `comm === content.commentary.entrance[0]`.
  - `useScreenShortcuts.test.ts`, using `@testing-library/react` + `fireEvent.keyDown(window …)`:
    - Enter fires the action; Ctrl+Q / Cmd+Q / Alt+Q don't.
    - The key from a focused `<a>` or `<input>` doesn't fire.
    - `enabled:false` doesn't fire; after unmount nothing fires.
  - `prefetchRig.test.ts`: below lg, under reduced motion, or with saveData, no `Image` is created. Otherwise one per URL, and only once across two calls.

- [ ] **Step 2: `LandingPage({ view })`.** Compose the Phase 0 landing (keep every coordinate that passes parity today) inside `<Stage from="lg" backdrop={<ArenaBackdrop bleed boot />}>`, with the boot classes and `style={{"--d": …}}` from `LANDING_BEATS` on each part:
  - the board header and footer fade
  - the scan band
  - the name and title boot
  - the CTA group rise, the hint fade
  - the commentary wrapper rise
  
  Commentary: `LandingScreen` calls `say(view.comm)` after `LANDING_BEATS.comm * pace` seconds. Pace = .25 when `document.documentElement.hasAttribute("data-return-visit")`, 0 under reduced motion. The timer is cleared on unmount. The `CommentarySlot` wrapper has the rise animation, so the line appears at the drawn time. The phone layout slot below `lg` is a placeholder `<div>` filled in Task 4. Until then keep the current `PlaceholderScreen as="div"`, behind `lg:hidden`.

- [ ] **Step 3: `LandingScreen`.**
  - Builds the view.
  - Sets `localStorage[LANDING_SEEN_KEY]="1"` via `safeStorage` on mount.
  - `useScreenShortcuts({ enter: () => go(ROUTES.intro), q: () => go(ROUTES.scout) }, { enabled: isDesktop })`, where `isDesktop` comes from a `matchMedia("(min-width: 1200px)")` hook (shell has one? if not, add `useMediaQuery` to `src/lib/` with a test). Enter also unlocks audio, like the button.
  - Calls `prefetchRig([turn0, turn1, turn2])` (imported `?url` assets) and `prefetchGsap()`.

- [ ] **Step 4: Stories.**
  - `Landing.stories.tsx`: `Desktop` (fixture = artboard copy, played to end: the story test uses Playwright `animations: "disabled"`), a parity story test vs `Main@1440x900` (same masks as the route), and `ReturnVisit` (sets the attribute in a decorator).

- [ ] **Step 5: e2e `tests/e2e/landing.spec.ts`** (desktop project unless noted):
  - **Boot order:**
    - at 0.2 s the name is `visibility: hidden` and the CTAs are not focusable (Tab from the body visits the skip link, audio and SKIP INTRO, never ENTER)
    - after 6 s, Tab reaches ENTER THE ARENA and VIEW PORTFOLIO
  - **Return visit:** set `localStorage["arena:landing-seen"]="1"` via `addInitScript`; the CTAs are visible and focusable by 1.6 s.
  - **Shortcuts:** Enter on the body → `/intro`; Q → `/scout`; Ctrl+Q stays; Enter while VIEW PORTFOLIO is focused → `/scout` (native), only one navigation (count `framenavigated`).
  - **No JS** (`javaScriptEnabled:false`): the name, CTAs and SKIP are visible after the CSS boot; the CTA links have the right hrefs.
  - **Reduced motion** (`emulateMedia({ reducedMotion: "reduce" })`): everything is visible at 0.1 s; no request matches the rig strips.
  - **Rig prefetch:** after `load` + 3 s, the three strip URLs were requested (desktop, motion on).
  - **Parity:** the existing "home matches the Main artboard" test stays, with `waitForTimeout` replaced by waiting for the CTA group's `getAnimations()` to finish. Masks stay the same (subtitle box L10, commentary, two D-1 wedges).
  - axe clean at the end of the boot.

- [ ] **Step 6:** Run unit + `pnpm build` + the landing / routes / smoke e2e + story tests. Commit `feat(landing): CSS floodlight boot with return-visit cut-down, screen shortcuts, rig prefetch`.

---

## Task 4: Landing phone and tablet layout

**Files:**
- Modify: `src/features/landing/{LandingPage.tsx,view.ts,Landing.stories.tsx}`, `src/design-system/broadcast/AudioToggle.tsx` (if the phone label needs a prop), `src/shell/audio.tsx` (L5 default), `src/content/ui-copy.ts`
- Test: `tests/e2e/landing.spec.ts` (phone + tablet blocks), `src/shell/audio.test.tsx`

**Interfaces:**
- Consumes: `Scoreboard size="compact"`, `FloodlightBank size="mobile"`, `Button` (full-width unskewed: check the existing `skew` variant; `skew: "desktop"` already unskews below md, so tablet needs `lg`-aware skew: add `skew: "lg"`, i.e. skewed from `lg` up, only if no variant fits).
- Produces: the phone / tablet half of `LandingPage` (`lg:hidden`). Its own `<h1>` is the stacked name; the desktop one is `max-lg:hidden`. Exactly one rendered.

- [ ] **Step 1: Failing tests.**
  - `audio.test.tsx`:
    - no saved choice + phone `matchMedia` → `enabled` false after mount
    - no saved choice + desktop → true
    - saved "on" on a phone → true
  - e2e (mobile project 390×844):
    - `Mobile-Landing` parity ≤ 2 %; masks only for A2 (header and footer labels at 11 px instead of 10 px: mask those label boxes, sized to them)
    - one rendered h1
    - no horizontal scroll
    - SOUND OFF toggle has `aria-pressed="false"`
    - ENTER sub-line reads `ui.landing.enterSubPhone`
    - no COMM, no hint, no SKIP INTRO
  - e2e viewport loop (Review Focus 5) over 1199×800, 1024×768, 768×1024, 390×844, 375×667, 360×640, checking:
    - no horizontal scroll
    - both CTAs fully inside the document (scroll into view, `boundingBox` within `scrollWidth`)
    - one rendered `<h1>`
    - mono font size ≥ 11 px for every visible mono element (query `[class*="type-mono"]`)

- [ ] **Step 2: Implement the phone / tablet layout** as a flex column, not absolute positions, so short phones scroll:
  - **Top row:** BrandLockup mark only (34px) + `AudioToggle` labelled "SOUND" / OFF·ON (new `ui.audio.labelPhone: "SOUND"` if missing).
  - **Scene:** two `mobile` banks at their drawn spots, sky + turf radial glows, flat crowd band, all `aria-hidden`.
  - **Scoreboard** `size="compact"` (header LIVE · THE ARENA / `ui.landing.playerShort` "01 / 01"; footer STATUS / AWAY).
  - **Bottom:** challenge line, ENTER THE ARENA + "LITE · ONE-THUMB GAMES", VIEW PORTFOLIO.
  
  Drawn gaps: board top 130, CTAs bottom 40, gap 12, challenge margin 8. Use spacing tokens; recipes for every type size.
  - **Tablet (md–lg):** the same column centred, `max-w-160`, the recipes' `md:` steps.
  - **Static:** no boot classes on phone / tablet (as drawn).

- [ ] **Step 3: L5** in `AudioProvider`: after mount, if nothing is saved and `matchMedia("(max-width: 767px)")` matches, `enabled` becomes false (not saved, so a later desktop visit is on). Comment why.

- [ ] **Step 4:** Story `Phone` (fixture) + parity story test vs `Mobile-Landing@390x844`. Run tests. Commit `feat(landing): phone layout as drawn, tablet column, phones start muted`.

---

## Task 5: Intro timeline factory and its pure helpers (no UI)

**Files:**
- Create: `src/features/intro/{beats.ts,pixels.ts,letters.ts,timeline.ts,rig.ts}` + `*.test.ts` for each

**Interfaces:**
- Produces:
  - `type IntroTier = "desktop" | "tablet" | "mobile"`.
  - `INTRO_BEATS: Record<IntroTier, Partial<Record<Beat, number>>>`. Seconds, desktop from the Intro board:
```ts
export const INTRO_BEATS = {
  desktop: { crowd: .3, banks: .2, bankGap: .25, coneL: .4, boardHeader: .85, boardOn: .8, sky: .9, coneR: .9,
             entrance: .95, ghostGap: .07, field: 1.2, backlight: 1.5, performance: 1.85, impact: 1.88,
             look: 2.78, pixels: 2.85, name: 3.1, letterGap: .055, idle: 3.9, title: 3.95, tagline: 4.3,
             taglineGap: .06, strip: 4.6, flash: 5.0, welcome: 5.4, cta: 5.7, comm: 5.9, ctaGlow: 6.5 },
  tablet:  { banks: .1, bankGap: .15, boardOn: .4, boardHeader: .45, entrance: .6, name: 1.5, letterGap: .04,
             title: 2.2, tagline: 2.5, taglineGap: .05, strip: 2.7, welcome: 3.0, cta: 3.3, comm: 3.5, ctaGlow: 4.0 },
  mobile:  { banks: .05, bankGap: .2, boardOn: .3, boardHeader: .3, name: .6, letterGap: .03,
             title: 1.1, strip: 1.2, welcome: 1.3, cta: 1.5, comm: 1.7, ctaGlow: 2.0 },
} as const;
```
  - `createPixels(seed = 7)` → exactly the artboard's 90 pixels (code in audit §6.5), with colours as **token names** (`"volt" | "led" | "warm"`), not hex.
  - `createLetters(name: string)` → `{ ch, kind: "la"|"lb"|"lc", order }[]`. Kinds go `i % 3`. The order is the artboard's `[3,0,7,5,1,9,2,8,6,4]` when `name.length === 10`, otherwise a seeded permutation (seed 7, Fisher–Yates with the same LCG). Spaces count as letters, as in the board.
  - `loadRig(urls, { timeoutMs })` → `Promise<"ready" | "timeout" | "error">`: decodes each via `new Image(); img.src = u; await img.decode()`.
  - `createIntroTimeline(gsap, refs: IntroRefs, opts: { tier, rig: Promise<"ready"|"timeout"|"error">, onBeat?: (beat: "comm" | "bank" | "done") => void }) → gsap.core.Timeline`:
    - `IntroRefs` is a record of optional elements / element arrays: `root, banks[], flares[], cones[], crowd, sky, field, backlight, boardOn, boardHit, boardHeader, scan, mover, ghosts[], trails, fig, strips[3], rest, shock, streak, glints[], pixels[] (each {anchor, dot}), letters[], title, titleBar, tagline[], strip, flash, welcome, cta, idle`.
    - **Every beat is a label** (`tl.addLabel(beat, INTRO_BEATS[tier][beat])`). Tweens are positioned at `"label"` or `"label+=n"`.
    - A track whose ref is missing is skipped.
    - At `performance`, if the rig promise is not settled, `tl.addPause("performance", …)` resumes when it settles or after 1.5 s (L7). If the result is not `"ready"`, the strip tracks are skipped and `rest` is shown at that beat.
    - Strips: a proxy `{ p: 0 }` tweened 0 → 1 over .667 s with `ease: "none"`; `onUpdate` sets `backgroundPosition` from `framePosition(frameAt(p, 16), 16)`. Strip B and C swap visibility at their labels (`performance+=.667`, `+=1.333`).
    - Banks: GSAP percentage keyframes `{ "0%": {opacity:.04}, "15%": {opacity:.04}, "20%": {opacity:1}, "24%": {opacity:.2}, "30%": {opacity:1}, "100%": {opacity:1} }` over 1.1 s, `bankGap` apart; `onBeat("bank")` at each.
    - Flare: each `flares[i]` opacity 0 → 1 → 0 at `flash+=i*.05`.
    - Letters: `la` / `lb` / `lc` from-states per the audit keyframes (`la`: y −60, scaleY 1.9, blur 12; `lb`: y 70, scaleX 1.6; `lc`: scale 2.4, blur 16) → none. The colour pass (volt → LED) uses a class toggle at 55 %, not a colour tween (no raw colours in TS). Positioned at `name+=order*letterGap`.
    - Pixels: anchor `scale 1 → .02`, `autoAlpha 0 → 1 (18%) → .15`, `EASE.absorb`, .8 s at `pixels+=delay-2.85`.
    - Everything that starts hidden uses `autoAlpha` (visibility) so it is not focusable before its beat.
    - `onBeat("comm")` at `comm`; `onBeat("done")` at the end.
    - At `ctaGlow` and `idle`, add the CSS loop classes (`animate-cta-glow`, `animate-breathe`, `animate-face-sweep`) via `tl.call`.
  - `showIntroEndState(gsap, refs)`: `gsap.set` every ref to its end state, strips hidden, `rest` shown, idle classes **not** added (reduced motion). Used by reduced motion and by tests.

- [ ] **Step 1: Failing tests** (Vitest, jsdom, real `gsap` imported in the test file):
```ts
import { gsap } from "gsap";
import { describe, expect, it } from "vitest";
import { INTRO_BEATS } from "./beats";
import { createIntroTimeline, showIntroEndState } from "./timeline";
import { createLetters } from "./letters";
import { createPixels } from "./pixels";

const el = () => document.createElement("div");
function fullRefs() { /* build one element per ref, arrays sized like the board: 4 banks, 2 ghosts, 3 strips, 90 pixels {anchor, dot}, 10 letters, 7 tagline parts, 2 glints */ }

describe("createPixels", () => {
  it("reproduces the artboard's seeded first and last pixel", () => {
    const px = createPixels();
    expect(px).toHaveLength(90);
    expect(px[0]).toEqual(/* compute once from the audit §6.5 code and paste the literal here */);
    expect(px.every((p) => p.delay >= 2.85 && p.delay <= 3.35)).toBe(true);
  });
});
describe("createLetters", () => {
  it("uses the board's lock-in order for YASH SARDA", () => {
    expect(createLetters("YASH SARDA").map((l) => l.order)).toEqual([3, 0, 7, 5, 1, 9, 2, 8, 6, 4]);
    expect(createLetters("YASH SARDA").map((l) => l.kind)).toEqual(["la","lb","lc","la","lb","lc","la","lb","lc","la"]);
  });
  it("gives any other name a full permutation", () => {
    const o = createLetters("ALEXANDRA K").map((l) => l.order);
    expect([...o].sort((a, b) => a - b)).toEqual([...o.keys()]);
  });
});
describe("createIntroTimeline", () => {
  const ready = Promise.resolve("ready" as const);
  it.each(["desktop", "tablet", "mobile"] as const)("%s: every beat is a label at its table time", (tier) => {
    const tl = createIntroTimeline(gsap, fullRefs(), { tier, rig: ready });
    for (const [beat, t] of Object.entries(INTRO_BEATS[tier])) if (!beat.endsWith("Gap")) expect(tl.labels[beat]).toBeCloseTo(t, 3);
    tl.kill();
  });
  it("lengths: desktop ~6.4s, tablet ~4s, mobile ~2s", () => {
    const d = (tier: "desktop" | "tablet" | "mobile") => createIntroTimeline(gsap, fullRefs(), { tier, rig: ready }).duration();
    expect(d("desktop")).toBeGreaterThan(6.0); expect(d("desktop")).toBeLessThan(6.6);
    expect(d("tablet")).toBeGreaterThan(3.6); expect(d("tablet")).toBeLessThan(4.2);
    expect(d("mobile")).toBeGreaterThan(1.8); expect(d("mobile")).toBeLessThan(2.2);
  });
  it("skips tracks whose refs are missing (phone: no mover, strips, pixels)", () => {
    const refs = { ...fullRefs(), mover: undefined, strips: [], pixels: [] };
    expect(() => createIntroTimeline(gsap, refs, { tier: "mobile", rig: ready }).progress(1)).not.toThrow();
  });
  it("ends with every revealed part visible and the CTA reachable", () => {
    const refs = fullRefs();
    createIntroTimeline(gsap, refs, { tier: "desktop", rig: ready }).progress(1);
    expect(refs.cta.style.visibility).not.toBe("hidden");
    expect(refs.letters.every((l) => getComputedStyle(l).opacity === "1")).toBe(true);
  });
  it("before the CTA beat the CTA is hidden (not focusable)", () => {
    const refs = fullRefs();
    createIntroTimeline(gsap, refs, { tier: "desktop", rig: ready }).seek(INTRO_BEATS.desktop.cta - 0.1);
    expect(refs.cta.style.visibility).toBe("hidden");
  });
  it("rig timeout: no strip frames, rest pose shown at the performance beat", async () => {
    const refs = fullRefs();
    const tl = createIntroTimeline(gsap, refs, { tier: "desktop", rig: Promise.resolve("timeout") });
    await Promise.resolve(); tl.progress(1);
    expect(refs.strips.every((s) => s.style.visibility === "hidden")).toBe(true);
    expect(refs.rest.style.visibility).not.toBe("hidden");
  });
  it("calls onBeat for comm and done exactly once per play, again after restart", () => { /* spy, progress(1), restart(), progress(1) → 2 each */ });
  it("kill() leaves no active tweens on its targets", () => { /* gsap.getTweensOf(refs.cta).length === 0 after kill */ });
});
describe("showIntroEndState", () => {
  it("shows the end state with no idle loop classes", () => { /* … */ });
});
describe("loadRig", () => { /* fake Image with decode(): ready / error / timeout via vi.useFakeTimers */ });
```
Fill in the elided bodies; no placeholders may remain in the committed tests. Run: FAIL.

- [ ] **Step 2: Implement** `beats.ts`, `pixels.ts`, `letters.ts`, `rig.ts`, `timeline.ts` to pass. Keep `timeline.ts` readable: one small function per track (`addLights`, `addBoard`, `addEntrance`, `addPerformance`, `addLook`, `addName`, `addTitle`, `addTagline`, `addFinale`, `addIdle`), each taking `(tl, refs, beats, tier)`.

- [ ] **Step 3:** `pnpm vitest run src/features/intro` green, typecheck, lint. Commit `feat(intro): timeline factory with labelled beats per tier, seeded pixels and letters, rig loader`.

---

## Task 6: Intro desktop screen

**Files:**
- Create: `src/features/intro/{view.ts,view.test.ts,IntroPage.tsx,IntroScreen.tsx,useIntroTimeline.ts,Intro.stories.tsx,intro.fixture.ts}`, `tests/e2e/intro.spec.ts`
- Modify: `app/routes/intro.tsx`, `src/content/ui-copy.ts` (`ui.intro.*`: `live`, `matchday`, `tagline: ["PLAYER 01","ENGINEER","BUILDER","COMPETITOR"]`, `introducing`, `number`, `welcome`, `enter`, `portraitAlt`; reuse `ui.hud.replay`, `ui.hud.skipIntro`, `ui.landing.status` / `undefeated`, `ui.record.career`)

**Interfaces:**
- Consumes: Task 5 (factory, helpers, `loadRig`), Task 2 (`ArenaBackdrop layout="intro"`, `Scoreboard size="intro"` + `Power` + `Scan variant="bar"`, `SpriteStrip`, `intro-part`, loops, `Dust`), Task 1 (`loadGsap`, `Stage`).
- Produces:
  - `buildIntroView(content, ui, routes)`.
  - `useIntroTimeline(rootRef, refs, { onComm })` → `{ replay(): void, state: "pending" | "playing" | "done" }`. It:
    1. loads GSAP
    2. creates `gsap.matchMedia()` with `{ desktop: "(min-width: 1200px) and (prefers-reduced-motion: no-preference)", tablet: "(min-width: 768px) and (max-width: 1199px) and (prefers-reduced-motion: no-preference)", mobile: "(max-width: 767px) and (prefers-reduced-motion: no-preference)", reduce: "(prefers-reduced-motion: reduce)" }`
    3. in each branch, builds the tier's timeline with the refs of the layout that is visible (desktop refs vs the fluid layout's refs, Task 7)
    4. under `reduce`, calls `showIntroEndState` and **never calls `loadRig`**
    5. sets `data-intro` on the root: `pending` → `playing` → `done`
    
    Replay = `tl.restart()`, plus removing the loop classes; a replay while playing restarts. It cleans up with `mm.revert()` on unmount. `onComm` calls `say(content.commentary.intro[0])`; `onBeat("bank")` calls `audio.play("floodlight")` (silent until files exist).
  - **Rig loading** starts only in the desktop branch: `loadRig([turn0, turn1, turn2], { timeoutMs: 1500 + time-to-performance })`.

- [ ] **Step 1: Failing tests.**
  - `view.test.ts`: all copy from content / ui; `enter.to === ROUTES.arena`; `skip.to === ROUTES.arena`; the tagline is 4 words with 3 volt separators; the record comes from `ui.record.career`.
  - e2e `tests/e2e/intro.spec.ts` (desktop):
    - **End state:** wait for `[data-intro="done"]`, then parity vs `Intro@1440x900` ≤ 2 %. Masks: COMM line box; the two D-1 intro cone wedges (compute from Task 2's numbers and write them in the test with a comment); nothing on the board, name, portrait or CTA.
    - **CTA hidden** at 3 s (not in the Tab order) and focusable after `done`.
    - **SKIP INTRO** at 0.5 s → `/arena`, no console errors (listen to `console` + `pageerror` for the whole file).
    - **REPLAY** 5× quickly → reaches `done` once more, letters visible, no errors.
    - **Slow rig:** `page.route("**/turn_*.webp", r => setTimeout(() => r.continue(), 5000))` → `done` within 8 s, `[data-part="rest"]` visible, strips hidden. The same with `r.abort()`.
    - **Reduced motion:** `done` (or the end state) at 0.3 s, no request to `turn_`, REPLAY not visible.
    - **No JS:** the name heading, ENTER THE ARENA → (`href="/arena"`) and SKIP visible; `data-intro="pending"` parts visible (`.js` absent).
    - **JS error fallback:** `addInitScript` that makes `import("gsap")` fail (route the gsap chunk to 404) → the parts are visible by 8.5 s.
    - Focus after arriving from `/` by ENTER THE ARENA lands on the `<h1>` (the name).
    - axe clean at `done`.

- [ ] **Step 2: `IntroPage({ view, refs })`.** Inside `<Stage from="lg" backdrop={<ArenaBackdrop layout="intro" bleed />}>`, the board at left 100 top 96 1240×540 with:
  - header (LIVE · PLAYER INTRODUCTION / THE ARENA · MATCHDAY)
  - backlight (`data-part="backlight"`)
  - scan bar
  - 2 ghosts (`SpriteStrip` with the first strip at frame 0, warm/volt tinted via two filter utilities in `scene.css`)
  - shock bar
  - the mover (trail lines + specks as one decorative layer)
  - the `fig` wrapper with the edge mask → the breath wrapper → 3 `SpriteStrip`s + the rest image + the face sweep masked by `portrait-rest.webp`
  - streak + 2 glints
  - the LED grid and scanline overlays
  - the 90 pixels
  - the name: `<h1 aria-label={view.heading}>` with letter spans `aria-hidden`, kinds as classes for the colour pass
  - the title with its leading bar
  - the tagline
  - the footer (INTRODUCING NO. 01 / RECORD 99 – 1 / STATUS UNDEFEATED)
  
  Then the stadium flash, WELCOME TO MY ARENA, `Button` (primary, `size` matching 340×74: check `l`/`xl` first; if none fits add size `xl-wide` named by scale), the COMM slot, and the HUD (mark only, REPLAY + SKIP INTRO, glass, 44 h). Every part a timeline reveals has `intro-part` + `data-part`. The figure is `role="img"` with `view.portraitAlt`; everything else decorative is `aria-hidden`. `Dust` sits behind the board, in the cone regions.

- [ ] **Step 3: `IntroScreen`** wires `useIntroTimeline`, commentary, audio, REPLAY (`motion-reduce:hidden`) and SKIP (`ArenaLink` to `/arena`). `app/routes/intro.tsx` = meta + `<IntroScreen />`.

- [ ] **Step 4: Stories.** `Desktop` (fixture; the story decorator calls `showIntroEndState` instead of playing) + parity story test vs `Intro@1440x900`; `Playing` (the real hook, for eyeballing); a11y passes.

- [ ] **Step 5:** Run unit + story + `pnpm build` + `tests/e2e/intro.spec.ts` + routes/smoke. Commit `feat(intro): desktop player introduction with sprite rig, pixel name lock-in, replay and skip`.

---

## Task 7: Intro on tablet and phone (derived, L6)

**Files:**
- Modify: `src/features/intro/{IntroPage.tsx,IntroScreen.tsx,Intro.stories.tsx}`, `tests/e2e/intro.spec.ts`

**Interfaces:**
- Consumes: Task 4's phone / tablet landing column pattern (top row, `mobile` banks, `Scoreboard size="compact"`, full-width CTA), Task 5 tiers `tablet` / `mobile`, `src/assets/portrait-rest.webp`.
- Produces: the `lg:hidden` half of `IntroPage`, with its own ref set handed to `useIntroTimeline` (tablet / mobile branches).

- [ ] **Step 1: Failing e2e** (mobile project 390×844 + a tablet block at 1024×768 and 768×1024):
  - `done` within 2.6 s (phone) or 4.6 s (tablet)
  - one rendered h1 (the name)
  - REPLAY + SKIP INTRO ≥ 44 px
  - ENTER THE ARENA → full width, focusable after `done`
  - no `turn_` requests on phone or tablet
  - the Review Focus 5 viewport loop (no horizontal scroll, CTA inside the document, mono ≥ 11 px)
  - resizing from 1440 to 900 wide mid-play → the tablet layout reaches `done`, no console errors (Review Focus 2)

- [ ] **Step 2: Implement the column.**
  - **Top row:** mark + REPLAY + SKIP INTRO.
  - **Banks:** two `mobile` banks.
  - **Compact board:** header LIVE · PLAYER INTRODUCTION / 01 / 01; body = the rest portrait (`<img>` with width / height attributes, `decoding="async"`, `PortraitFrame` if it fits, else a plain `img` with the `portrait-fade` mask) above the stacked name with letter spans + title + tagline (tablet only; phones hide it per L6); footer RECORD 99 – 1 / STATUS UNDEFEATED.
  - **Bottom:** WELCOME TO MY ARENA (phone step of its recipe) + ENTER THE ARENA →.
  - **Tablet:** the centred `max-w-160` column, portrait slide-in from the right via the `mover` ref.
  - **Phone:** no mover, portrait fades.

- [ ] **Step 3: Stories.** `Phone` and `Tablet` end states (no artboard: eyeball stories, flagged derived). Run tests. Commit `feat(intro): tablet and phone introductions (4s / 2s) with the rest-pose portrait`.

---

## Task 8: Budgets, docs, carry-over

**Files:**
- Modify: `tools/lighthouse.mjs`, `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md` (new §11.11), `docs/superpowers/plans/phase-0-carryover.md`, `src/shell/PlaceholderScreen.tsx` (drop `home` / `intro` from the "coming in phase" map only if the map lists live phases; keep the site map)

- [ ] **Step 1: Lighthouse.** Make the page list data-driven:
  - `[{ path: "/scout", gate: <existing> }, { path: "/", gate: L13 }, { path: "/intro", gate: { accessibility: 1, "best-practices": .9, seo: .9 } }]`.
  - For `/`, run desktop twice: once normal (report only) and once with Chrome flag `--force-prefers-reduced-motion` (performance ≥ .9 gated).
  - Gate `first-contentful-paint` ≤ 1500 ms and `cumulative-layout-shift` ≤ .1 from the audits.
  - Print a table per page and run: perf / a11y / bp / seo / FCP / LCP / CLS / TBT.
  - `pnpm build && pnpm lighthouse` must pass.

- [ ] **Step 2: Spec §11.11 "Landing and Player Intro (Phase 3)"**, same shape as §11.10:
  - the rulings L1–L14 as built
  - design-system changes (new tokens, presets, recipes, components)
  - deviations the visual tests accept (exact mask boxes with reasons)
  - merges > ~2 %
  
  Note in §7 that the landing boot is CSS (L3).

- [ ] **Step 3: Carry-over.** Tick the absorbed rows with "→ §11.11" or "→ Task n". Move the count-up row to a new "Phase 4" section. Add "Hub tablet treatment (drawer, §12) and the stage mono floor at Hub scale".

- [ ] **Step 4:** Run `pnpm verify` (stop any stray `pnpm preview` on 4173 first: ask in the report if one is Yash's). Commit `docs(spec): section 11.11 for Phase 3; lighthouse covers landing and intro`.

---

## Execution order and model

Sequential, one Sonnet 5.5 builder per task (1 → 8): the tasks share the scene pieces and the landing file. After each task, the orchestrator reviews the diff (and screenshots for 3, 4, 6, 7). After Task 8: an Opus 5.5 whole-phase review → one fix wave → full `pnpm verify` + Lighthouse → progress meter → Yash previews (`pnpm build && pnpm preview`) and OKs the merge.

## Self-review notes (orchestrator)

- **Spec coverage:**
  - phase 3 row: flicker + boot + CTAs + audio gate (Tasks 2–4), intro + rig (5–6), tablet / mobile / reduced (4, 6, 7), skip / replay (6)
  - exit checks: end-state visual diffs (3, 4, 6), timeline unit tests (5), FCP (8)
- **Carry-over rows:** all assigned above.
- **Placeholders:** the two test bodies marked "fill in" in Task 5 are instructions to compute literals from the audit code; the reviewer rejects a commit that leaves them empty.
- **Types:**
  - `IntroTier`, `INTRO_BEATS`, `IntroRefs`, `createIntroTimeline`, `showIntroEndState`, `loadRig` are used with the same names in Tasks 5–7
  - `loadGsap` / `prefetchGsap` / `EASE` in Tasks 1, 3, 5, 6
  - `LANDING_SEEN_KEY` in Tasks 1 and 3
  - `Stage from` in Tasks 1, 3, 6
