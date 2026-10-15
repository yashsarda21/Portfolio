# Phase 7 — Launch Ready Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**What this plan does (plain words):**

Phase 7 makes the site ready to publish. Yash's choices (2026-10-14):
- **Sounds are made in code.** No files, no licences.
- **Build everything for launch, but don't publish yet.** Nothing is pushed to GitHub or Vercel in this phase.
- **Phones aim for a Lighthouse speed score of 80 or more.** Today they're around 64, and this becomes a pass/fail gate.
- **Yash does a 10-minute screen-reader check** with a checklist from us.

What the visitor gets:
- **Sound:** a bat crack on FOUR / SIX, a net cord on a tennis return, a smash, a floodlight thud as the Intro's lights come on, and a short crowd swell when a game ends. All of it respects the sound toggle.
- **A real OUT OF BOUNDS page** for any wrong address. A host serves it with a true "404 not found" status.
- **Shareable links:**
  - a share image (`og.png`, 1200×630) built from Yash's portrait
  - canonical and `og:url` tags from the production address (an environment setting)
  - `sitemap.xml` and `robots.txt`
- **Security rules:**
  - a Content Security Policy with exact hashes for the inline scripts
  - host headers against framing and sniffing
- **Faster phones:**
  - Lighthouse measures with compression, as Vercel serves it
  - then the biggest first-load costs are cut until phones score ≥ 80
- **An accessibility sweep** (axe on every page in key states, keyboard checks) and a VoiceOver checklist for Yash.
- **Launch kit:**
  - `vercel.json`
  - CI fixes
  - a step-by-step launch checklist for the day Yash says "publish"
  - a list of every wording we wrote that isn't in his design, for his review

**Goal:**
- Every page passes axe and keyboard checks, and runs under a strict CSP with zero violations.
- Unknown paths render OUT OF BOUNDS (and `404.html` exists for the host).
- The sitemap and canonical come from `VITE_SITE_URL`.
- Mobile Lighthouse performance is ≥ 0.80 wherever desktop performance is gated, and the desktop gates still pass.
- `pnpm verify` is green.
- Nothing is published.

**Architecture:**
- **Sound:** `src/shell/synth.ts` holds pure Web Audio "recipes" (one function per sound, given an `AudioContext`-like object and a start time). `AudioProvider.play` calls the recipe instead of fetching a file. A master gain respects mute.
- **SEO:**
  - `siteUrl` from `VITE_SITE_URL` in `src/shell/config.ts`, validated like `formEndpoint`
  - `pageMeta` adds the absolute tags when it is set
  - `sitemap.xml` / `robots.txt` are prerendered **resource routes** built by pure functions in `src/shell/seo.ts`
- **Security and 404:** a post-build step `tools/postbuild.mjs`, run by `pnpm build`:
  - hashes every inline `<script>` in each prerendered HTML file and inserts a `<meta http-equiv="Content-Security-Policy">`
  - copies the prerendered `/404` page to `build/client/404.html`

  `vercel.json` carries the header-only rules (`frame-ancestors`, `X-Frame-Options`, HSTS, nosniff, referrer, permissions, asset caching).
- **Speed:**
  - `tools/lighthouse.mjs` serves `build/client` brotli-compressed (as Vercel does) without writing extra files into the build
  - the fixes are chosen from the measured Lighthouse opportunities

**Tech Stack:** React 19, React Router 8 (prerender, `ssr:false`, resource routes), Web Audio API, Tailwind v4 tokens, Vitest, Playwright (+ WebKit smoke) + axe, Lighthouse, Node scripts in `tools/`.

**Spec:** `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md`:
- §4.6 (audio slots)
- §4.5 (routes; `*` → Out of bounds)
- §9.1 (budgets)
- §10 (the phase 7 row, minus "Vercel production deploy", by owner decision)
- §11.1 (A-rows)
- §12 (the 404 row: "OUT OF BOUNDS: scoreboard panel with links to Hub and Quick View")
- §13 (the portrait cutout → OG image)

**Carry-over absorbed** (`docs/superpowers/plans/phase-0-carryover.md`, ticked in Task 6): rows 28 (real 404), 29 (og:image / og:url / canonical from env), 30 (CSP hashes), 73 (phone back chip), 74 (call fade), 75 (Safari spot-check), 77 (derived copy review), 78 (audio), 86 (sitemap + full-time), 89 (CI hardening, prepared without a remote).

---

## Rulings for Yash to confirm

| # | Decision | Why | Easy to flip? |
|---|---|---|---|
| P1 | **Sounds are synthesised** (Web Audio oscillators and filtered noise), quiet by default (master gain 0.35):<br>• **bat:** a FOUR / SIX in cricket<br>• **net:** a tennis return that wasn't a miss<br>• **smash:** a badminton smash<br>• **floodlight:** a low thud at the Intro's lights-on beat<br>• **crowd:** a 1.5 s swell when any game's verdict lands<br>Nothing plays before the first click (browsers forbid it) or while the toggle is off. | Yash's choice. Each slot has one obvious moment. | Yes (each sound) |
| P2 | **Don't publish.**<br>• No git remote is added, nothing is pushed, Vercel is never called.<br>• `vercel.json`, CI and a launch checklist are prepared so publishing later takes about 15 minutes with Yash at the keyboard.<br>• `vercel.json` stays unverified until that day. | Yash's choice. Publishing is outward-facing. | — |
| P3 | **Production address from `VITE_SITE_URL`** (https only, like `VITE_FORM_ENDPOINT`).<br>• **Unset:** no canonical / `og:url` / `og:image` tags, `sitemap.xml` is a valid empty `<urlset/>`, and `robots.txt` has no `Sitemap:` line.<br>• **Set:** all of them, absolute.<br>• Tests and Lighthouse build with `VITE_SITE_URL=https://arena.example` (a reserved test name). | Never ship a wrong canonical. The site still builds before a domain exists. | Yes |
| P4 | **Share image** `public/og.png`, 1200×630:<br>• the portrait cutout on the arena's dark ground with a volt spotlight<br>• "YASH SARDA", the role line from content, and "THE ARENA"<br>It is made once by `tools/og-image.mjs` (Playwright renders an HTML card) and committed. `twitter:card` becomes `summary_large_image`. | §13; a share preview recruiters see. | Yes (look) |
| P5 | **Security:**<br>• **CSP per page** (meta): `default-src 'self'`; `script-src 'self'` + the page's inline-script hashes; `style-src 'self' 'unsafe-inline'` (React style attributes); `img-src 'self' data:`; `font-src 'self'`; `media-src 'self' https:`; `connect-src 'self'` + the form endpoint's origin; `form-action 'self' mailto:` + that origin; `object-src 'none'`; `base-uri 'self'`; `upgrade-insecure-requests`.<br>• **Host headers** (`vercel.json`): `Content-Security-Policy: frame-ancestors 'none'`, `X-Frame-Options: DENY`, `Strict-Transport-Security: max-age=63072000; includeSubDomains`, `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`, `Permissions-Policy: camera=(), microphone=(), geolocation=()`, and `/assets/*` cached `public, max-age=31536000, immutable`. | Carry-over row 30. Meta CSP can't express `frame-ancestors`, so that goes in a header. | — |
| P6 | **OUT OF BOUNDS page (derived, §12):** the 404 replaces `PlaceholderScreen`, which is deleted.<br>• Layout: the site's content-page frame (brand, Quick View), a scoreboard panel ("OUT OF BOUNDS" `h1`, the description "This page is out of bounds.", and a line naming the path tried), then links: BACK TO THE HUB (volt), QUICK VIEW, HOME.<br>• `noindex`.<br>• `/404` and every unknown path show it.<br>• `build/client/404.html` exists for the host (a real 404 status on Vercel). | §12 row; carry-over 28. | Yes (copy) |
| P7 | **Phone speed ≥ 80:**<br>• Lighthouse first measures with brotli, as production does.<br>• Then fixes go in order of measured savings. Likely candidates: fewer `modulepreload`s on first paint; the 175 KB stylesheet; font loading (`font-display`, preloads); the 190 KB `transition` chunk.<br>• **No visual change:** every parity test stays inside its limit.<br>• **The gate:** mobile performance ≥ 0.80 on each page whose desktop performance is gated. The Landing's full-motion run stays reported (L13); its reduced-motion run is gated. | Yash's choice. Today's 64 is partly the uncompressed test server. | Yes (target) |
| P8 | **Accessibility:**<br>• an axe sweep of every route at 1440×900 and 390×844, fresh and with a full matchday<br>• a keyboard sweep: every focusable element reachable, a visible volt ring, no trap, Esc closes the drawer<br>• `docs/launch/screen-reader-checklist.md` for Yash (VoiceOver, about 10 minutes); his findings come back as fixes | Spec §10 row; Yash's choice. | — |
| P9 | **Leftovers decided, not built:**<br>• **No mid-game back chip on phones (row 73).** The end has BACK TO THE HUB, and SKIP, QUICK VIEW and the browser back always work. The Mobile-Game board draws none.<br>• **The big call stays behind the end buttons (row 74),** as drawn. | YAGNI; the drawn boards. | Yes |
| P10 | **Safari (row 75):** the WebKit smoke adds the three game columns and Full Time at 390×844. | A real-Safari engine check without hardware. | — |
| P11 | **Wording review:** `docs/launch/copy-review.md` lists every string we derived (not in the design or `content.json`) with where it shows. Yash marks changes, and they go in as one copy task before launch. | Carry-over 77; §12. | — |

---

## Global Constraints

All Phase 0–6 constraints apply:
- **Styling:**
  - Arena tokens only; literal class strings.
  - **No pixel fitting in feature code** (`src/features/styleRules.test.ts`).
  - **Check that no existing type recipe, token, keyframe, utility or component matches before adding one** (`src/design-system/tokens/catalog.ts`). Reuse `Scoreboard`, `Glass`, `Button`, `HUD`, `ContentLayout` / `PageTitle`, `QuickViewChip`, `BrandLockup`.
  - No raw hex / rgb / cubic-bezier in TS/TSX, no arbitrary type sizes.
  - **Exception:** `tools/og-image.mjs` renders a standalone HTML card and may read the token values from `src/design-system/tokens/*.css` rather than hard-code them.
- **Accessibility:**
  - Mono ≥ 11 px (A2). Contrast ≥ 4.5:1. Volt focus ring (A3). Targets ≥ 44 px.
  - Exactly one rendered `<h1>`.
  - Nothing invisible is focusable.
- **No visible copy in components or routes.** New strings go in `src/content/ui-copy.ts` (exact strings in each task).
- **Folder rules:**
  - features import shell / design-system / content / lib / assets
  - design-system imports nothing from content / shell / features
  - features never import each other
  - `tools/` scripts are Node ESM, run from the repo root
- **Motion:** GSAP lazy (`loadGsap()`), transform / opacity only, reduced motion stills everything. Sound is **not** tied to reduced motion (it has its own toggle).
- **No visual regressions:** every parity test in `tests/stories` and `tests/e2e` keeps its current limit and masks. A task that needs a new mask stops and reports instead.
- **Privacy and safety:**
  - Never touch `Yash-Sarda-Resume.pdf`; `player.resumePdf` stays `null`.
  - No phone number or email beyond what the content already shows.
  - **No network calls** to GitHub, Vercel or any external service. No `git remote add`, no `git push`, no `vercel` CLI.
- **Lean testing:**
  - unit tests for the pure parts (synth recipes via a fake context, `parseSiteUrl`, `seo.ts` builders, `pageMeta`, the CSP builder)
  - e2e for behaviour (404, CSP violations, sitemap / robots, a11y and keyboard sweeps, WebKit smoke)
  - no snapshot tests
- **Git and environment:**
  - Prefix every node / pnpm command with `NODE_OPTIONS=`. git 2.15 (no `switch` / `restore`).
  - Branch `phase/7-launch` (already created from `main` at `b1c35ba`).
  - Builder commits end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
  - **Ports:**
    - Tests use 4173 / 6007; Lighthouse uses 4174.
    - 4173 is often Yash's own server: then run e2e through a temporary config on **4183** whose webServer is `pnpm build && sirv build/client --single __spa-fallback.html --port 4183 --host 127.0.0.1` (prettier-format the temp file or keep it out of the lint / format globs, and delete it afterwards).
    - **Never kill processes you didn't start** (6006, 5173–5176, 4173 are Yash's).
  - The host is loaded: `--workers=2`; re-run timeouts, never weaken an assertion.

## Review Focus

1. **CSP breaks something silently.**
   - Each page in each state must load, hydrate and run with **zero** `securitypolicyviolation` events: Landing boot, Intro, the Hub drag, each game, Team Up send (endpoint set and unset), Full Time, 404.
   - This includes the scripts React Router inlines per page and the JSON-LD on `/scout`.

   Tests: Task 3 e2e.
2. **Sound misbehaves.**
   - Nothing plays before the first gesture or while muted. Toggling mute mid-sound silences the master gain at once.
   - A browser without `AudioContext`, or one that throws on creation, plays nothing and logs nothing.
   - Rapid repeats (a held key, three quick rallies) never stack into a loud burst: each recipe's peak stays capped.

   Tests: Task 1 unit.
3. **A wrong or missing production address.**
   - `VITE_SITE_URL` unset, `http://…`, with a path, or with a trailing slash: canonical / `og:url` are either absolute https with no double slash, or absent.
   - The sitemap lists every public page exactly once (Full Time yes; `/404`, `/arena/giant-killer`, `/locker-room` no).

   Tests: Task 2 unit + e2e.
4. **The speed work changes what people see.**
   - Every parity limit holds.
   - The first paint still shows the same frame on the Landing, Hub and Quick View.
   - Fonts never flash a fallback face on pages where a parity test samples text.

   Tests: Task 4 (full `pnpm verify` + Lighthouse).
5. **The 404 at the edges:**
   - deep unknown paths (`/arena/nope/deeper`), trailing slashes, query strings
   - JavaScript off (prerendered `/404` and the SPA fallback for an unknown path)
   - one `h1`, axe clean, links work, `noindex` present, and the page is not listed in the sitemap

   Tests: Task 2 e2e.

---

## Task 1: Sound made in code

**Files:**
- Create: `src/shell/synth.ts`, `src/shell/synth.test.ts`
- Modify: `src/shell/audio.tsx` (+ `src/shell/audio.test.tsx`), the Intro's lights-on beat (find where the Intro timeline turns the floodlights on, under `src/features/intro/`), `src/features/games/engine/useGameSession.ts` (the verdict: one `crowd` call)

**Interfaces:**
- Produces:
  - `SoundName = "crowd" | "floodlight" | "bat" | "net" | "smash"` (unchanged)
  - `RECIPES: Record<SoundName, Recipe>`, with `type Recipe = (ctx: SynthContext, out: AudioNode, at: number) => void`
  - `SynthContext` = the subset of `BaseAudioContext` the recipes use (`createOscillator`, `createGain`, `createBiquadFilter`, `createBufferSource`, `createBuffer`, `sampleRate`, `currentTime`)
  - `MASTER_GAIN = 0.35`
  - `PEAK = 0.9` (no recipe's envelope exceeds it)

- [ ] **Step 1: Failing tests.**
  - **`src/shell/synth.test.ts`:**
    - A fake `SynthContext` records every node it creates and every `gain.setValueAtTime` / `linearRampToValueAtTime` / `exponentialRampToValueAtTime` / `start` / `stop` call.
    - For each `SoundName`, its recipe:
      - creates at least one source and connects a path to `out`
      - starts at `at` and stops by `at + duration` (bat ≤ 0.15 s, net ≤ 0.2 s, smash ≤ 0.2 s, floodlight ≤ 0.6 s, crowd ≤ 1.8 s)
      - never sets a gain above `PEAK`
      - leaves no source without a `stop` (no leaks)
  - **`src/shell/audio.test.tsx`:**
    - `play` does nothing before `unlock()`, nothing while disabled, and nothing when `window.AudioContext` is missing or its constructor throws (no console output)
    - after `unlock()` and enabled, `play("bat")` runs `RECIPES.bat` into the master gain
    - `toggle()` to off ramps the master gain to 0 immediately (`setValueAtTime(0, currentTime)`)
    - `SOUND_FILES` and the fetch path are gone

  Run: `NODE_OPTIONS= pnpm exec vitest run src/shell/synth.test.ts src/shell/audio.test.tsx`. Expected: FAIL.

- [ ] **Step 2: Recipes.** In `src/shell/synth.ts`, one function per sound. Short, dry and quiet; **values are starting points, tuned by ear only within the caps above**:
  - **bat:** a white-noise burst through a bandpass (~2.2 kHz, Q 1.2), attack 2 ms, exponential decay to 0.001 by 90 ms; plus a sine at 140 Hz dropping to 70 Hz over 60 ms at half level
  - **net:** noise through a bandpass (~1.4 kHz, Q 0.8), 120 ms decay; plus a triangle at 320 Hz for 50 ms at a quarter level
  - **smash:** noise through a highpass (~3 kHz), a 1 ms attack and a 150 ms decay; plus a sine sweep from 900 Hz to 300 Hz over 80 ms at a third level
  - **floodlight:** a sine from 70 Hz to 38 Hz over 450 ms, attack 5 ms, decay to silence by 550 ms; plus a 30 ms noise click at a low level
  - **crowd:** noise through a lowpass (~1.2 kHz) and a slow bandpass wobble, gain rising over 400 ms to 0.5 × `PEAK`, holding, and falling by 1.6 s

  Noise comes from one cached 1 s mono buffer per context (a `WeakMap<SynthContext, AudioBuffer>`), filled with `Math.random() * 2 - 1` once. This is allowed here (the shell, not a referee).

- [ ] **Step 3: Provider.** In `src/shell/audio.tsx`:
  - `unlock()` creates the context inside `try` (stays silent on failure), and a master `GainNode` at `MASTER_GAIN` connected to `destination`.
  - `play(name)` runs `RECIPES[name](ctx, master, ctx.currentTime + 0.005)` when enabled and unlocked.
  - The toggle sets the master gain (0 or `MASTER_GAIN`) with `setValueAtTime` at `currentTime`.
  - If `ctx.state === "suspended"`, `play` calls `ctx.resume()` first (iOS).
  - Remove `SOUND_FILES` and the fetch / decode path. Update the module doc (spec §4.6: synthesised slots, P1).

- [ ] **Step 4: Wire the two new moments.**
  - **floodlight:** at the Intro's lights-on beat, call `audio.play("floodlight")` once. Read the timeline: the beat where the banks light. Reduced motion has no beat, so no sound.
  - **crowd:** in `useGameSession.finish`, after the save, call `live.current.audio.play("crowd")` once per finished game (the reduced-motion auto-rally included).
  - Add one unit assertion each where those modules already have tests (the session's `finish` test; the intro timeline test if it can observe a callback), or a focused new test.

- [ ] **Step 5: Verify and commit.**
  - Run `NODE_OPTIONS= pnpm exec vitest run`, typecheck, lint, and the e2e `intro`, `cricket` and `journeys` specs (nothing visual changes).
  - **Listen:** write a tiny scratch HTML page outside the repo (scratchpad) that plays each recipe, open it in the browser, and say in the report which values you changed and why. Keep them inside the caps.
  - Commit `feat(audio): the five sound slots are made in code, quiet and capped (P1)`.

---

## Task 2: OUT OF BOUNDS, production address, sitemap, robots, share image

**Files:**
- Create:
  - feature: `src/features/not-found/{view.ts,view.test.ts,NotFoundPage.tsx,NotFoundPage.stories.tsx}`
  - shell: `src/shell/seo.ts`, `src/shell/seo.test.ts`
  - routes: `app/routes/sitemap[.]xml.ts`, `app/routes/robots[.]txt.ts`
  - tools: `tools/og-image.mjs`, `public/og.png`
  - `.env.example`
  - `tools/postbuild.mjs` (only the `404.html` copy here; Task 3 adds the CSP step) and `package.json` `"build": "react-router build && node tools/postbuild.mjs"` (keep whatever the current build does)
  - tests: `tests/e2e/not-found.spec.ts`, `tests/e2e/seo.spec.ts`
- Modify:
  - shell: `src/shell/config.ts` (+ test), `src/shell/meta.ts` (+ test)
  - routes: `app/routes.ts`, `app/routes/not-found.tsx`, `app/routes/catch-all.tsx`
  - `src/content/ui-copy.ts`
  - `playwright.config.ts` (the webServer build env) and `tools/lighthouse.mjs` (the same env)
  - `tests/e2e/routes.spec.ts`
- Delete: `src/shell/PlaceholderScreen.tsx` (and its story / test if any)

**Interfaces:**
- Produces:
  - `parseSiteUrl(raw: string | undefined): string | null` (https only, origin only, no trailing slash) and `siteUrl: string | null` in `config.ts`
  - `absoluteUrl(path: string, base = siteUrl): string | null`
  - `buildSitemap(paths: readonly string[], base: string | null): string`, `buildRobots(base: string | null): string`, `PUBLIC_PATHS` (every `ROUTES` value except `notFound`) in `seo.ts`
  - `pageMeta(key, opts)` also emits, when `siteUrl` is set: `{ tagName: "link", rel: "canonical", href }`, `og:url`, `og:image` (+ `og:image:width` 1200, `og:image:height` 630, `og:image:alt`), and `twitter:card: summary_large_image`. Option `noindex: true` → `{ name: "robots", content: "noindex" }`.

- [ ] **Step 1: Copy.**
  - Add `ui.notFound`:
  ```ts
  /** P6: the OUT OF BOUNDS page (derived, §12 404 row). The heading and description are ui.routes.notFound's. */
  notFound: {
    tried: "You tried",
    hub: "BACK TO THE HUB",
    home: "HOME",
  },
  /** P4: the share image's alt text. */
  shareAlt: "Yash Sarda, Software Engineer — The Arena",
  ```
  - Reuse `ui.hud.quickView` for QUICK VIEW. Remove `ui.routes.*.phase` if nothing reads it once `PlaceholderScreen` is gone (check with grep / tsc).

- [ ] **Step 2: Failing tests.**
  - **`config.test.ts`:** `parseSiteUrl`:
    - `undefined`, `""`, `"http://x.dev"`, `"javascript:alert(1)"` and `"not a url"` → `null`
    - `"https://yash.dev"` → `"https://yash.dev"`
    - `"https://yash.dev/"` → `"https://yash.dev"`
    - `"https://yash.dev/some/path?q=1"` → `"https://yash.dev"` (origin only)
  - **`seo.test.ts`:**
    - `buildSitemap(PUBLIC_PATHS, "https://a.example")` is a valid `urlset` with one `<loc>` per path, `https://a.example/arena/full-time` among them, and `/404`, `giant-killer`, `locker-room` absent
    - with `null` it is `<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"/>` (empty, valid)
    - `buildRobots("https://a.example")` is `User-agent: *\nAllow: /\nSitemap: https://a.example/sitemap.xml\n`; with `null`, no `Sitemap:` line
  - **`meta.test.ts`:** with a base, the canonical / `og:url` for `cricket` is `https://a.example/arena/cricket`, and `og:image` is `https://a.example/og.png`. Without a base, none of them appear. `noindex` adds the robots tag. (Make `pageMeta` take the base as an optional parameter defaulting to `siteUrl`, so it is testable.)
  - **`src/features/not-found/view.test.ts`:**
    - `buildNotFoundView(ui, routes, "/arena/nope")` gives the `h1` "OUT OF BOUNDS", the description, `tried: "You tried /arena/nope"`, and the links Hub → `/arena`, Quick View → `/scout`, Home → `/`
    - the path is shown as text and is truncated to 60 characters with "…"

  Run them. Expected: FAIL.

- [ ] **Step 3: Build.**
  - **config, seo, meta** as in Interfaces. `siteUrl = parseSiteUrl(import.meta.env.VITE_SITE_URL)`.
  - **Resource routes:**
    - `app/routes/sitemap[.]xml.ts` has a `loader` returning `new Response(buildSitemap(PUBLIC_PATHS, siteUrl), { headers: { "Content-Type": "application/xml" } })`.
    - `robots[.]txt.ts` does the same with `text/plain`.
    - Register both in `app/routes.ts` before the catch-all.
    - Confirm the prerender writes `build/client/sitemap.xml` and `build/client/robots.txt`. If React Router won't prerender them under `ssr:false`, report BLOCKED with the error. Don't switch to another mechanism silently.
  - **`NotFoundPage`:**
    - the content-page frame the other content pages use (brand + QUICK VIEW top row, `PageTitle`)
    - a `Scoreboard` / `Glass` panel with the `h1`, the description and the "You tried …" line (`mono`)
    - the three links (`Button` volt for the Hub, secondary for the others)
    - both `app/routes/not-found.tsx` and `catch-all.tsx` render it; their `meta` is `pageMeta("notFound", { noindex: true })`
    - the catch-all passes `location.pathname`, and `/404` passes nothing (no "You tried" line)
    - Delete `PlaceholderScreen`.
  - **`tools/og-image.mjs`:**
    - launches Playwright chromium and renders a 1200×630 HTML card. Inline its CSS from token values read out of `src/design-system/tokens/*.css`, the self-hosted fonts from `node_modules/@fontsource/*`, and the portrait from `design/handoff/assets/yash-portrait-cutout.png`.
    - writes `public/og.png`; target size ≤ 300 KB (PNG; lower the portrait's resolution if needed)
    - Run it once and commit the PNG. Add a `pnpm og-image` script.
  - **`tools/postbuild.mjs`:** copy `build/client/404/index.html` → `build/client/404.html`, and log one line.
  - **`.env.example`:** `VITE_SITE_URL=` and `VITE_FORM_ENDPOINT=`, each with a one-line comment.
  - **Test builds:** the `playwright.config.ts` webServer command and `tools/lighthouse.mjs`'s build env set `VITE_SITE_URL=https://arena.example`. If `tools/lighthouse.mjs` doesn't build, document that it reads whatever `build/client` holds, and that `pnpm verify` builds with the variable.

- [ ] **Step 4: e2e.**
  - **`tests/e2e/not-found.spec.ts`** (Review Focus 5):
    - `/arena/nope/deeper`, `/arena/nope/`, `/nope?x=1` and `/404`, each: one `h1` "OUT OF BOUNDS", axe clean, Hub / Quick View / Home links work, `meta[name=robots][content=noindex]` present
    - JavaScript off: `/404` renders with working links
    - `build/client/404.html` exists after the build (read the file in the test's `beforeAll`) and has the `h1`
  - **`tests/e2e/seo.spec.ts`** (Review Focus 3):
    - `/sitemap.xml` returns XML listing `https://arena.example/arena/full-time`, with no `/404`, `giant-killer` or `locker-room`
    - `/robots.txt` has the `Sitemap:` line
    - `/arena/cricket` has the canonical `https://arena.example/arena/cricket`, `og:url` and `og:image`
    - `/og.png` returns 200 `image/png`
  - **`routes.spec.ts`:** update the placeholder expectations.

- [ ] **Step 5: Verify and commit.** Run the full vitest suite, typecheck, lint, the new e2e specs plus `routes` (4183 config if needed), and the stories for `NotFoundPage` (+ axe). Save shots `shots/404-1440.png` and `shots/404-390.png` and `shots/og.png` (a copy). Commit `feat(seo): OUT OF BOUNDS page, production address from env, sitemap, robots and a share image`.

---

## Task 3: Security rules (CSP with hashes, host headers)

**Files:**
- Create: `tools/csp.mjs` (the pure builder), `tools/csp.test.mjs` (or `.test.ts` under the vitest include; follow the repo's test globs), `vercel.json`, `tests/e2e/csp.spec.ts`
- Modify: `tools/postbuild.mjs` (Task 2 created it with the `404.html` copy)

**Interfaces:**
- Produces:
  - `buildCsp({ scriptHashes: string[], formOrigin: string | null }): string`, `hashScript(source: string): string` (`'sha256-<base64>'`)
  - the post-build step: for every `build/client/**/*.html` (including `__spa-fallback.html` and `404.html`), collect each inline `<script>` without `src` (any `type`), hash its exact text, and insert `<meta http-equiv="Content-Security-Policy" content="…">` as the **first** child of `<head>`.

- [ ] **Step 1: Failing tests.**
  - **`csp` unit:**
    - `hashScript("alert(1)")` equals the known SHA-256 base64 `'sha256-bhHHL3z2vDgxUt0W3dWQOrprscmda2Y5pLsLg4GF+pI='`
    - `buildCsp` contains every P5 directive exactly once, joins the hashes with spaces, and adds the form origin to `connect-src` and `form-action` only when given
    - no `'unsafe-inline'` or `'unsafe-eval'` in `script-src`
  - **`tests/e2e/csp.spec.ts`** (Review Focus 1):
    - register `page.on("console")` and an `addInitScript` listener for `securitypolicyviolation` that pushes to `window.__csp`
    - visit and exercise: `/` (wait for the boot), `/intro` (skip), `/arena` (drag a card), `/arena/cricket` (bowl one ball), `/arena/tennis`, `/arena/badminton`, `/arena/full-time` (seeded), `/team-up` (fill and send with no endpoint → mailto phase), `/scout`, `/card`, `/trophies`, `/career`, `/highlights`, `/attributes`, `/404`, `/arena/nope`
    - assert `window.__csp` is empty and no console message contains "Content Security Policy"
    - `<head>`'s first element is the CSP meta

  Expected: FAIL (no postbuild).

- [ ] **Step 2: Build it.**
  - **`tools/csp.mjs` + `tools/postbuild.mjs`:**
    - Node only, no new dependencies: parse with regexes scoped to `<script>` tags, and read the real built files.
    - The form origin comes from `process.env.VITE_FORM_ENDPOINT` through the same https check as `parseEndpoint` (duplicate the 5-line check in the tool, with a comment pointing to `src/shell/config.ts`; a tool can't import TS).
    - Log one line per run: pages processed, distinct hashes.
  - **`vercel.json`**, with:
    - `buildCommand: "pnpm build"`, `outputDirectory: "build/client"`, `installCommand: "pnpm install --frozen-lockfile"`
    - `cleanUrls: true`, `trailingSlash: false`
    - the P5 headers on `/(.*)`, and the immutable cache on `/assets/(.*)`
    - no rewrites: unknown paths fall to `404.html` with status 404

    Add a `$schema`. In the launch checklist (Task 6), note that this file is checked on the first deploy.
  - Confirm `pnpm preview` and the e2e build still work. sirv ignores the meta, but the browser enforces it.

- [ ] **Step 3: Verify and commit.**
  - Run the unit tests, the full e2e suite (the CSP can break any page) and the stories suite. The stories are served by Storybook, not the build, so they're unaffected: confirm.
  - Commit `feat(security): a per-page CSP with exact inline-script hashes, and host headers for launch`.

---

## Task 4: Phone speed ≥ 80

**Files:**
- Modify: `tools/lighthouse.mjs`; then whatever the measurements point to (expected: `app/root.tsx`, `vite.config.ts` / build chunking, font CSS in `src/design-system/tokens/*.css`, the shell's eager imports)
- Test: the Lighthouse gates themselves, plus the full `pnpm verify` (every parity test)

- [ ] **Step 1: Measure like production.**
  - In `tools/lighthouse.mjs`, replace the plain sirv server with one that brotli-compresses text responses on the fly. For example, a small `node:http` server: `sirv` as a handler (`sirv("build/client", { single: "__spa-fallback.html" })`) plus `zlib.createBrotliCompress()` for `text/*`, `application/javascript`, `application/json` and `image/svg+xml` when the request accepts `br`. Write nothing into `build/client`.
  - Run `NODE_OPTIONS= pnpm build && NODE_OPTIONS= pnpm lighthouse`, and record the mobile table **before** any code change in the report.
  - For the three worst mobile pages, save Lighthouse's top opportunities and diagnostics (render-blocking resources, unused JS / CSS, critical request chain, font display, LCP element) to `.superpowers/sdd/<workspace>/lh-mobile-before.md` (the controller gives the path).

- [ ] **Step 2: Fix in order of measured savings, one change per commit.** Candidates; apply only those the measurements support:
  - **Too many `modulepreload`s on first paint.** Defer route-irrelevant shell chunks (audio, commentary, transitions) behind `import()` until after first paint or first interaction. Keep the stage-scale and head-flags scripts inline.
  - **The 175 KB stylesheet.** Find what dominates (e.g. per-route scene CSS, keyframes, unused recipes). Split route-only CSS into the route's module if React Router's CSS handling allows, or trim dead tokens (`catalog.ts` tells what is used).
  - **Fonts:**
    - `font-display: swap` where a parity test doesn't sample the text in its first second; otherwise keep `block` / `optional` and preload only the faces used above the fold
    - subset to latin (already), drop unused weights
  - **The 190 KB `transition` chunk.** Find out why it is large (`pnpm exec vite-bundle-visualizer` or rollup's output stats) and move what isn't needed for the first paint.

  After each change, re-run the affected parity specs and Lighthouse. Stop changing code once every gated page is ≥ 0.80 on mobile with its desktop gates intact.

- [ ] **Step 3: Gate it.**
  - Add `performance: 0.8` to the mobile variant of each page whose desktop variant gates performance (the Landing: on the reduced-motion mobile run).
  - Update the header comment.
  - `pnpm lighthouse` must print "Lighthouse budget met."

- [ ] **Step 4: Verify and commit.** Run the full `pnpm verify` (the 4183 e2e config if needed), then `pnpm lighthouse`. Report the before/after mobile tables. Commit each fix separately with a message naming the saving, and the gate as `perf(lighthouse): phones gated at 80 (P7)`.

---

## Task 5: Accessibility sweep, Safari smoke, checklists

**Files:**
- Create: `tests/e2e/a11y-sweep.spec.ts`, `tests/e2e/keyboard-sweep.spec.ts`, `docs/launch/screen-reader-checklist.md`, `docs/launch/copy-review.md`
- Modify: the WebKit smoke spec (find it: `grep -rn webkit playwright*.config.ts tests`); any component the sweeps prove broken (fix at the source, smallest change)

- [ ] **Step 1: axe sweep** (P8).
  - Every route in `ROUTES` (and `/arena/nope`) at 1440×900 and 390×844.
  - Two states: fresh, and with a full matchday seeded (3 venues, `bestForm`, sections seen).
  - `AxeBuilder` with the repo's existing tags / config: zero violations.
  - Reuse the existing axe helper if there is one.
- [ ] **Step 2: keyboard sweep** (P8). For every route at 1440×900, Tab from the top until focus wraps (cap 80 presses), asserting for each focused element:
  - it is visible (in the viewport after the browser scrolls, non-zero size, not `visibility:hidden`)
  - it shows a focus ring: the computed `outline-style` isn't `none`, or the element has the repo's focus-ring class
  - focus never sits on `body` between two presses (no lost focus)

  At 390×844: the Hub's INDEX drawer opens with Enter, traps Tab inside, and Esc closes it and returns focus to INDEX.
- [ ] **Step 3: WebKit smoke** (P10). Add `/arena/cricket`, `/arena/tennis`, `/arena/badminton` and `/arena/full-time` (seeded done) at 390×844: one `h1`, the thumb button on screen (games), no horizontal scroll.
- [ ] **Step 4: Fix** what Steps 1–3 find, at the source. Each fix gets its own commit and a one-line note in the report. If a fix would change a drawn layout, stop and report instead.
- [ ] **Step 5: Checklists.**
  - **`docs/launch/screen-reader-checklist.md`:** a numbered ~10-minute VoiceOver script for Mac (Safari) and iPhone. Each step says what to do (keys / gestures) and what Yash should hear. It covers:
    - Landing → ENTER
    - Hub (rotor headings, the venue cards, the INDEX drawer on iPhone)
    - one cricket game (the calls are announced, the end buttons take focus)
    - Full Time (the board reads "Final score: You 0, Yash 3")
    - Team Up form errors
    - Quick View
    - OUT OF BOUNDS

    Plain language, with a box per step for "OK / not OK + note".
  - **`docs/launch/copy-review.md`:** every derived string, i.e. in `src/content/ui-copy.ts` with a `// derived` mark or listed in spec §12 as derived. Group by page, then give each string, where it shows, and a blank "Yash's wording" column. Generate it by reading the file, not by hand-typing guesses.
- [ ] **Step 6: Verify and commit.** Run the new specs (both projects where the config has them), the WebKit smoke and the full unit suite. Commit `test(a11y): axe and keyboard sweeps on every page; WebKit smoke covers the games; launch checklists`.

---

## Task 6: Launch kit, docs, final checks

**Files:**
- Create: `docs/launch/README.md`
- Modify:
  - `.github/workflows/ci.yml`, `README.md`
  - docs: `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md` (new §11.15; §10 phase 7 row), `docs/superpowers/plans/phase-0-carryover.md`

- [ ] **Step 1: CI (no remote, nothing pushed).** In `.github/workflows/ci.yml`, add:
  - `permissions: contents: read`
  - `concurrency: { group: ci-${{ github.ref }}, cancel-in-progress: true }`
  - `if-no-files-found: ignore` on the artifact upload
  - `VITE_SITE_URL: https://arena.example` in the verify step's env

  Validate the YAML shape with a quick parse (e.g. `node -e` with the `yaml` package if present, else `python3 -c "import yaml"` if available; otherwise state it is unvalidated).
- [ ] **Step 2: Launch checklist** `docs/launch/README.md`, in plain steps for the day Yash says "publish":
  1. Create a GitHub repo (private or public, his choice), `git remote add origin …`, push `main`.
  2. Import it in Vercel (framework: Other; it uses `vercel.json`).
  3. Set `VITE_SITE_URL` (the final address) and, if wanted, `VITE_FORM_ENDPOINT`.
  4. Deploy.
  5. Check after deploy:
     - `/nope` returns status 404 with OUT OF BOUNDS
     - the response headers match P5
     - the share preview (LinkedIn Post Inspector)
     - `/sitemap.xml` and `/robots.txt`
     - Lighthouse on the live URL
  6. Add a custom domain later; re-deploy after changing `VITE_SITE_URL`.

  Link the two Task 5 checklists. Update `README.md` with a short "Launch" section pointing to it.
- [ ] **Step 3: Spec §11.15 "Launch ready (Phase 7)"**, the shape of §11.14:
  - P1–P11 as built
  - the sound recipes' final values
  - the CSP and headers verbatim
  - the 404 page
  - the speed changes with before/after mobile tables and the new gates
  - the sweeps' results and fixes
  - the derived-designs rows added to §12 (OUT OF BOUNDS as built, the share image)

  Then the §10 phase 7 row: "Launch ready (deploy deferred by owner decision 2026-10-14)".
- [ ] **Step 4: Carry-over.**
  - Tick rows 28, 29, 30, 73, 74, 75, 77 (→ copy-review.md), 78, 86 and 89 with pointers.
  - Add "Publish: follow docs/launch/README.md when Yash says publish".
  - Add any rows the reviews produce.
- [ ] **Step 5: Final.** `NODE_OPTIONS= pnpm verify` (the 4183 config if needed), then `NODE_OPTIONS= pnpm lighthouse`. Paste both summaries into the report. Commit `docs(spec): section 11.15, launch ready; the launch checklist`.

---

## Execution order and model

Sequential, one Sonnet 5.5 builder per task (1 → 6). The tasks share:
- **the build (2 → 3: `tools/postbuild.mjs`, env; 3 → 4: the measured HTML includes the CSP meta)**
- **Task 2's `VITE_SITE_URL` test env:** used by 3, 4 and 6
- **Task 5's sweeps:** run on the final build of 1–4

After each task the orchestrator reviews the diff, with screenshots for Task 2. After Task 6:
1. An Opus 5.5 whole-phase review.
2. One fix wave.
3. Full `pnpm verify` + Lighthouse.
4. The progress meter.
5. Yash runs the screen-reader checklist and marks the copy review; their findings form one follow-up task.
6. Yash OKs the merge.
7. Fast-forward to `main`.

Publishing waits for his separate "publish".

## Self-review notes (orchestrator)

- **Spec §10 phase 7 row coverage:**

  | Item | Covered by |
  |---|---|
  | Audio wiring | Task 1 |
  | Final perf pass | Task 4 |
  | Full a11y audit (keyboard + screen reader) | Task 5, plus Yash's checklist |
  | SEO (meta, OG image, sitemap, robots, canonical from env) | Task 2 |
  | 404 | Task 2 (+ Task 3's `404.html`) |
  | Vercel production deploy | deferred by Yash (P2); prepared in Tasks 3 and 6 |

- **Owner choices:**

  | Choice | Covered by |
  |---|---|
  | Sound in code | P1, Task 1 |
  | Don't deploy | P2, Global Constraints, Task 6 |
  | Phone ≥ 80 | P7, Task 4 |
  | Screen-reader checklist | P8, Task 5 |

- **Placeholders:** none. The sound values are starting points with hard caps, tuned by ear by instruction. The speed fixes are chosen from measurements by instruction, with the gate fixed.
- **Types and names used across tasks:** `RECIPES`, `MASTER_GAIN`, `PEAK`, `SynthContext`; `parseSiteUrl`, `siteUrl`, `absoluteUrl`, `buildSitemap`, `buildRobots`, `PUBLIC_PATHS`; `pageMeta(key, { noindex, type, jsonLd }, base?)`; `buildNotFoundView`; `hashScript`, `buildCsp`; `tools/postbuild.mjs`, `tools/og-image.mjs`.
- **Review Focus → tests:**

  | # | Tests |
  |---|---|
  | 1 | Task 3 e2e |
  | 2 | Task 1 unit |
  | 3 | Task 2 unit + e2e |
  | 4 | Task 4 verify |
  | 5 | Task 2 e2e |

---

## Task 7 (owner add-on, 2026-10-15): the Home and Intro sound show

Yash on the Home page and the Intro: "When the four lights turn on one by one, add a realistic sound effect for each light turning on. After that, when my name appears and the stadium is revealed, add a loud crowd cheering sound… all sounds properly synchronized with the animations." The game sounds are left as they are (the next phase). His choices:
- real CC0 recordings, which he picks by ear
- a **first-visit start screen**, because browsers allow no sound before a click
- return visits keep the fast, silent show

| # | Decision | Why |
|---|---|---|
| S1 | **Two recordings:**<br>• `public/audio/light.mp3`, a floodlight clunk, played once per bank<br>• `public/audio/crowd.mp3`, a stadium roar<br>Both are CC0, credited in `public/audio/CREDITS.md`. They are fetched and decoded only after the visitor's click, so first-load Lighthouse is unchanged. | Real recordings beat synthesis for a crowd. |
| S2 | **First-visit start screen.**<br>• **When it shows:** only when the Landing has never been seen (no `arena:landing-seen`; CSS `:root.js:not([data-return-visit])`, so the prerendered HTML never flashes it, and visitors with JavaScript off never see it).<br>• **What it says:** the brand, a volt **KICK OFF · SOUND ON** button (focused) and a quiet **KICK OFF IN SILENCE** link.<br>• **What it does:** the Landing's boot waits under it (CSS animations paused) and starts on either choice. SOUND ON unlocks audio; IN SILENCE turns the sound toggle off.<br>• **How it looks:** a full-viewport dark overlay with the arena's ground and one volt spotlight, from existing tokens and components. Once gone it never returns in that browser. | The only way to have sound on the very first show. |
| S3 | **Sync.** Sounds are scheduled on the `AudioContext` clock from the same beat tables the animations use (`LANDING_BEATS` × pace; `INTRO_BEATS[tier]`), not by timers. A clunk whose time has already passed, because the file was still decoding, is skipped, never played late. | "Properly synchronized". |
| S4 | **The Home show (after the start screen):**<br>• a clunk at each of the 4 bank beats `[0.6, 1.1, 1.6, 2.0]`<br>• the crowd fades in from `field` (2.4 s) to full at `name` (3.0 s), holds, then fades out over 1.5 s from `ctas` (4.5 s)<br>**Return visits:** fast pace and silent, except when sound is already unlocked in this page session (the visitor came back to Home by clicking inside the site). Then only the cheer plays, at the scaled `name` beat. | Yash: "on refresh … only crowd cheering". |
| S5 | **The Intro show (after ENTER THE ARENA, always unlocked):**<br>• a clunk per bank at `banks + i × bankGap` (desktop 0.2 / 0.45 / 0.7 / 0.95; phone 0.075 + i × 0.3), replacing today's single synthesised floodlight<br>• **Desktop crowd:** starts at `name` (3.1), swells to full by `flash` (5.0, the stadium reveal), fades over 1.2 s from `cta` (5.7)<br>• **Phone crowd:** starts at `name` (0.9), full by `title` (1.65), fades from `cta` (2.25)<br>REPLAY plays the show again. | Matches the drawn beats. |
| S6 | **Loudness.**<br>• The show plays through its own **show bus** (gain 0.8, so "loud") into the existing limiter and master mute.<br>• Clunks sit at about 0.6 of the bus. The crowd peaks at 1.0 of the bus.<br>• Turning sound off silences everything at once.<br>• SKIP, leaving the page or switching tabs fades the show out over 300 ms. | Yash: "loud crowd". |
| S7 | **Reduced motion:** no show, so no show sounds. The start screen still appears on a first visit (it is the only gesture, and the end-state page then shows at once). | Sound follows the show. |

**Files:**
- Create:
  - audio files: `public/audio/{light.mp3,crowd.mp3,CREDITS.md}` (from the owner's picks)
  - shell: `src/shell/showSound.ts` (+ test)
  - landing: `src/features/landing/StartScreen.tsx` (+ story), the start screen's tests
- Modify:
  - `src/shell/audio.tsx` (load and play buffers through the show bus; keep the synth for the game slots)
  - landing: `src/features/landing/{LandingScreen.tsx,LandingPage.tsx,LandingColumn.tsx,pace.css}`
  - intro: `src/features/intro/useIntroTimeline.ts`
  - `src/content/ui-copy.ts`
  - e2e: `tests/e2e/{landing,intro}.spec.ts` (plus any parity test whose fresh Landing load now meets the start screen: dismiss it with IN SILENCE in the test, never mask it)

**Interfaces:**
- `showSchedule(kind: "landing" | "intro", { tier, pace, firstShow }): { at: number; sound: "light" | "crowd"; fadeIn?: number; holdUntil?: number; fadeOut?: number }[]`: pure, from the beat tables
- `useAudio().playShow(schedule, startAt)` and `useAudio().stopShow(fadeMs = 300)`

**Copy** (in `ui.landing.start`; derived, flagged for Yash):
```ts
start: {
  label: "Start the show",
  soundOn: "KICK OFF · SOUND ON",
  silent: "KICK OFF IN SILENCE",
  note: "Best with sound. You can switch it off any time.",
},
```

- [ ] **Step 1: Failing tests.**
  - **`showSchedule` (unit):**
    - Landing first show: 4 lights at the bank beats; the crowd at field / name / ctas.
    - Landing return visit with sound unlocked: the crowd only, times scaled by pace.
    - Intro desktop and phone: as in S5.
  - **`audio` (unit):**
    - `playShow` decodes each file once and schedules on `ctx.currentTime + at`; it skips past-due clunks
    - `stopShow` ramps the show bus to 0 over the fade
    - muted → nothing
    - a fetch or decode failure stays silent
  - **e2e:**
    - a fresh profile shows the start screen with focus on SOUND ON, and the boot is held (a part with a known delay is still hidden after 1 s)
    - SOUND ON starts the boot and unlocks audio; IN SILENCE starts it with the toggle off
    - a reload shows no start screen (fast pace)
    - JavaScript off shows none
    - axe is clean with it open
    - the Intro after ENTER calls the schedule (spy on `playShow` through a test hook, or assert on a `data-show-scheduled` attribute)
- [ ] **Step 2: Build** `showSound.ts`, the audio additions, `StartScreen` and the wiring, per S1–S7. Copy only in `ui-copy.ts`. Tokens only. One `h1` (the start screen uses none, or the page's own stays the only one).
- [ ] **Step 3: Verify.**
  - Run the full `pnpm verify` (4183 config) and `pnpm lighthouse`: budgets met, phones ≥ 0.8.
  - Landing parity stays inside its limit, with tests dismissing the start screen.
  - **Shots:** the start screen at 1440×900 and 390×844.
  - Commit `feat(sound): the Home and Intro show with real light clunks and a stadium roar; a first-visit start screen (S1–S7)`.
