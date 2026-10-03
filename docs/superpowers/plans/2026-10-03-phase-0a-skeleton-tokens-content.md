# Phase 0A — Skeleton, Tokens, Content & Test Harness Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**What this plan does (plain words):** sets up the empty project so every later phase builds on solid ground.
- The app runs and builds to static HTML.
- Code-style rules are enforced automatically.
- All colours, fonts and spacing live in one token system.
- Your resume content is loaded and checked automatically.
- There's a robot that screenshots the original designs, so we can compare our screens against them pixel by pixel.

No visible portfolio screens yet. Those start in Phase 1.

**Goal:** A pre-rendering React Router 8 app with locked-down Tailwind tokens, a validated content layer, Storybook, and a full verification harness (unit, e2e, axe, artboard pixel-diff), all runnable via `pnpm verify`.

**Architecture:** Vite + React Router 8 framework mode (`ssr: false`, `prerender: true`) → static HTML in `build/client`. Tokens are three CSS layers (reference → semantic → context) exposed to Tailwind v4 through `@theme`, with every Tailwind default palette, radius, shadow and font reset. Content is `content.json`, parsed by Zod at import time, with typed selector functions. Artboard references are rendered by a tiny local server plus a shim for the missing canvas runtime, then screenshotted with Playwright.

**Tech Stack:** pnpm, Node ≥22.12, React 19, React Router 8.4, Vite 8, TypeScript ~5.9 (strict), Tailwind CSS 4.3, Zod 4, Vitest 5 + Testing Library, Playwright 1.63 + @axe-core/playwright, Storybook 10, ESLint 10 + typescript-eslint, Prettier 3, pixelmatch + pngjs.

**Spec:** `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md`. Exact design values: `docs/superpowers/specs/2026-10-03-arena-design-audit.md`.

**Phase 0 roadmap:** 0A (this plan) → 0B Primitives → 0C Broadcast kit + scene → 0D Stage, shell services, motion, routes. 0B–0D plans are written after 0A merges, against the real code.

**Spec refinements made in this plan** (intentional, small):
1. React Router is **v8** (spec said v7). Same framework-mode API: `react-router.config.ts`, `app/routes.ts`, `prerender`.
2. Typography utilities are named `type-*` (e.g. `type-d1`), not `text-d1`. In Tailwind, `text-*` is shared by colour and size, so a separate prefix avoids clashes.
3. Artboard reference PNGs are **generated, not committed** (`design/references/` is gitignored). `pnpm verify` renders them first, so references and screenshots always come from the same machine and font rasteriser. CI on Linux vs your Mac would otherwise differ.

## Global Constraints

- Node `>=22.12`; package manager **pnpm** (via corepack or `npm i -g pnpm`).
- React Router 8 framework mode with `ssr: false` and `prerender: true`. Every route must pre-render to static HTML.
- TypeScript `~5.9`, `strict: true`. No `any` (lint error).
- Folder rules (spec §4.2):
  - `src/design-system/` imports nothing from `src/content`, `src/features`, `src/shell` or `app/`.
  - `src/content/` and `src/lib/` import nothing from `src/design-system`, `src/features`, `src/shell` or `app/`.
  - `src/features/*` never import `@/features/*`.
- No raw hex colours, `rgb()/rgba()` or `cubic-bezier()` string literals in `app/**` or `src/features/**`. Tokens only.
- Breakpoints: `md` = 768px, `lg` = 1200px, `xl` = 1440px.
- Accessibility floors: text contrast ≥4.5:1; mono text ≥11px; visible volt focus ring on every focusable element; `prefers-reduced-motion` respected.
- `design/handoff/assets/Yash-Sarda-Resume.pdf` must **never** be copied into the repo (it contains a phone number).
- Work on branch `phase/0-foundation`. Commit after every task. Commit messages use Conventional Commits (`feat:`, `chore:`, `test:` …) and end with:
  ```
  Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>
  ```
- Git on this machine is 2.15 (old). Avoid `git switch`, `git restore` and `git init -b`. Use `git checkout`, `git checkout -- <file>` and `git symbolic-ref`.

## Review Focus

1. **JavaScript disabled:** a visitor (or crawler) with JS off must still see the pre-rendered page text. Test: Task 4, `smoke.spec.ts` "renders without JavaScript".
2. **Malformed content:** a typo or missing field in `content.json` must fail loudly with the field path in the message, not render a broken page. Test: Task 7, `schema.test.ts` "reports the path of a missing field".
3. **Date edges:** current role (`end: null`), same-year spans, year-crossing spans and the runtime "since" label must format correctly regardless of today's date. Test: Task 7, `format.test.ts` cases.
4. **Reduced motion:** with `prefers-reduced-motion: reduce`, animations must effectively stop. Test: Task 5, `tokens.spec.ts` "reduced motion collapses animations".
5. **Keyboard focus:** tabbing to any link must show the volt focus ring. Test: Task 5, `tokens.spec.ts` "keyboard focus shows the volt ring".

---

## File map (created in this plan)

```
package.json, pnpm-lock.yaml, tsconfig.json, vite.config.ts, react-router.config.ts
vitest.config.ts, playwright.config.ts, eslint.config.js, .prettierrc.json, .prettierignore
.storybook/main.ts, .storybook/preview.tsx, .storybook/vite.config.ts
.github/workflows/ci.yml
app/root.tsx, app/routes.ts, app/routes/home.tsx, app/app.css
src/lib/cn.ts (+ cn.test.ts)
src/design-system/tokens/{tokens.css, theme.css, base.css, fonts.css, catalog.ts, catalog.test.ts, Tokens.stories.tsx}
src/content/{content.json, schema.ts, schema.test.ts, format.ts, format.test.ts, selectors.ts, selectors.test.ts, ui-copy.ts, index.ts}
tools/render-artboards/{runtime.js, runtime.test.ts, render.mjs}
tests/setup/vitest.setup.ts
tests/support/{a11y.ts, visual.ts, visual.test.ts}
tests/fixtures/tailwind-probe.html
tests/e2e/{smoke.spec.ts, tokens.spec.ts, visual-harness.spec.ts}
design/handoff/** (copied from temp_handoff, minus the PDF)
```

---

### Task 1: Project scaffold that pre-renders

**Files:**
- Create: `package.json`, `tsconfig.json`, `vite.config.ts`, `react-router.config.ts`, `app/root.tsx`, `app/routes.ts`, `app/routes/home.tsx`, `app/app.css`, `.prettierrc.json`, `.prettierignore`
- Modify: `.gitignore` (append)

**Interfaces:**
- Consumes: nothing.
- Produces: scripts `dev`, `build`, `preview` (serves `build/client` on `http://127.0.0.1:4173`), `typecheck`, `format`, `format:check`. Import aliases `@/*` → `src/*` and `~/*` → `app/*`. `app/app.css` is the single global stylesheet entry (Task 5 extends it).

- [ ] **Step 1: Create the phase branch**

```bash
cd /Users/sardap/Documents/github/portfolio
git checkout -b phase/0-foundation
```

- [ ] **Step 2: Make pnpm available**

```bash
corepack enable pnpm 2>/dev/null || npm install -g pnpm@latest
pnpm -v
```
Expected: a version number (10.x or newer).

- [ ] **Step 3: Write `package.json`**

```json
{
  "name": "arena-portfolio",
  "private": true,
  "type": "module",
  "engines": { "node": ">=22.12" },
  "scripts": {
    "dev": "react-router dev",
    "build": "react-router build",
    "preview": "sirv build/client --port 4173 --host 127.0.0.1",
    "typecheck": "react-router typegen && tsc",
    "format": "prettier --write .",
    "format:check": "prettier --check ."
  }
}
```

- [ ] **Step 4: Install dependencies**

```bash
pnpm add react@^19.2 react-dom@^19.2 react-router@^8.4 @react-router/node@^8.4 isbot@^5
pnpm add -D @react-router/dev@^8.4 vite@^8 typescript@~5.9 @types/react@^19 @types/react-dom@^19 @types/node@^22 tailwindcss@^4.3 @tailwindcss/vite@^4.3 sirv-cli prettier@^3 prettier-plugin-tailwindcss
```
Then run `corepack use pnpm@latest` (or manually add `"packageManager": "pnpm@<version>"`) so CI uses the same pnpm.

- [ ] **Step 5: Write `tsconfig.json`**

```json
{
  "include": ["**/*", ".react-router/types/**/*"],
  "exclude": ["node_modules", "build", "design", "temp_handoff", "storybook-static"],
  "compilerOptions": {
    "lib": ["DOM", "DOM.Iterable", "ES2023"],
    "types": ["node", "vite/client"],
    "target": "ES2022",
    "module": "ES2022",
    "moduleResolution": "bundler",
    "jsx": "react-jsx",
    "rootDirs": [".", "./.react-router/types"],
    "paths": { "@/*": ["./src/*"], "~/*": ["./app/*"] },
    "esModuleInterop": true,
    "verbatimModuleSyntax": true,
    "noEmit": true,
    "resolveJsonModule": true,
    "skipLibCheck": true,
    "strict": true,
    "noUncheckedIndexedAccess": true,
    "noFallthroughCasesInSwitch": true
  }
}
```

- [ ] **Step 6: Write `vite.config.ts` and `react-router.config.ts`**

`vite.config.ts`:
```ts
import { reactRouter } from "@react-router/dev/vite";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), reactRouter()],
  resolve: { tsconfigPaths: true },
});
```

`react-router.config.ts`:
```ts
import type { Config } from "@react-router/dev/config";

// Static site: every route is pre-rendered to HTML at build time (spec §4.3).
export default {
  ssr: false,
  prerender: true,
} satisfies Config;
```

- [ ] **Step 7: Write the app shell**

`app/app.css`:
```css
@import "tailwindcss";
```

`app/routes.ts`:
```ts
import { type RouteConfig, index } from "@react-router/dev/routes";

export default [index("routes/home.tsx")] satisfies RouteConfig;
```

`app/root.tsx`:
```tsx
import { Links, Meta, Outlet, Scripts, ScrollRestoration } from "react-router";
import "./app.css";

export function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta charSet="utf-8" />
        <meta name="viewport" content="width=device-width, initial-scale=1, viewport-fit=cover" />
        <Meta />
        <Links />
      </head>
      <body>
        {children}
        <ScrollRestoration />
        <Scripts />
      </body>
    </html>
  );
}

export default function App() {
  return <Outlet />;
}
```

`app/routes/home.tsx` (temporary placeholder, replaced by the Landing in Phase 3):
```tsx
import type { Route } from "./+types/home";

export function meta(_: Route.MetaArgs) {
  return [
    { title: "Yash Sarda — The Arena" },
    {
      name: "description",
      content: "Software Engineer Yash Sarda's portfolio, built as a night-time sports arena.",
    },
  ];
}

export default function Home() {
  return (
    <main>
      <p>THE ARENA</p>
      <h1>YASH SARDA</h1>
    </main>
  );
}
```

- [ ] **Step 8: Prettier config and ignores**

`.prettierrc.json`:
```json
{
  "printWidth": 100,
  "plugins": ["prettier-plugin-tailwindcss"],
  "tailwindStylesheet": "./app/app.css"
}
```

`.prettierignore`:
```
build
.react-router
storybook-static
coverage
playwright-report
test-results
design
temp_handoff
docs
pnpm-lock.yaml
```

Append to `.gitignore`:
```
# Generated artboard references (rendered by `pnpm references`)
design/references/
# Never commit the resume PDF (contains a phone number)
design/handoff/assets/*.pdf
```

- [ ] **Step 9: Verify typecheck and build output**

```bash
pnpm typecheck
pnpm build
test -f build/client/index.html && grep -q "YASH SARDA" build/client/index.html && echo PRERENDER_OK
```
Expected: typecheck passes; build succeeds; prints `PRERENDER_OK`.

- [ ] **Step 10: Format and commit**

```bash
pnpm format
git add -A
git commit -m "chore: scaffold React Router 8 app with static pre-rendering

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Lint rules that enforce the architecture

**Files:**
- Create: `eslint.config.js`
- Modify: `package.json` (script `lint`)

**Interfaces:**
- Consumes: Task 1 project.
- Produces: `pnpm lint`, which fails on folder-rule violations and raw colour/easing literals in `app/**` and `src/features/**`.

- [ ] **Step 1: Install ESLint packages**

```bash
pnpm add -D eslint@^10 @eslint/js typescript-eslint eslint-plugin-react-hooks eslint-plugin-jsx-a11y eslint-config-prettier globals
```

- [ ] **Step 2: Write a failing probe (the rule doesn't exist yet)**

Create `src/design-system/__lint_probe__.ts`:
```ts
import { content } from "@/content";
export const probe = content;
```
Create `src/features/__probe__/probe.ts`:
```ts
export const colour = "#D7FF3F";
export const ease = "cubic-bezier(.22,1,.36,1)";
```

- [ ] **Step 3: Write `eslint.config.js`**

```js
import js from "@eslint/js";
import tseslint from "typescript-eslint";
import reactHooks from "eslint-plugin-react-hooks";
import jsxA11y from "eslint-plugin-jsx-a11y";
import prettier from "eslint-config-prettier";
import globals from "globals";

const restrictImports = (groups, message) => ({
  "no-restricted-imports": ["error", { patterns: [{ group: groups, message }] }],
});

const RAW_STYLE_LITERALS = [
  {
    selector: "Literal[value=/#[0-9A-Fa-f]{3,8}(?![0-9A-Za-z])/]",
    message: "Use design tokens, not raw hex colours (spec §4.2).",
  },
  {
    selector: "TemplateElement[value.raw=/#[0-9A-Fa-f]{3,8}(?![0-9A-Za-z])/]",
    message: "Use design tokens, not raw hex colours (spec §4.2).",
  },
  {
    selector: "Literal[value=/rgba?\\(/]",
    message: "Use design tokens, not raw rgb()/rgba() (spec §4.2).",
  },
  {
    selector: "Literal[value=/cubic-bezier\\(/]",
    message: "Use motion tokens (ease-follow / ease-snap / ease-swing) (spec §4.2).",
  },
];

export default tseslint.config(
  {
    ignores: [
      "build",
      ".react-router",
      "storybook-static",
      "coverage",
      "playwright-report",
      "test-results",
      "design",
      "temp_handoff",
      "tools/render-artboards/runtime.js",
    ],
  },
  js.configs.recommended,
  ...tseslint.configs.recommended,
  {
    plugins: { "react-hooks": reactHooks },
    rules: {
      ...reactHooks.configs.recommended.rules,
      "@typescript-eslint/no-explicit-any": "error",
      "@typescript-eslint/no-unused-vars": ["error", { argsIgnorePattern: "^_" }],
    },
  },
  jsxA11y.flatConfigs.recommended,
  {
    files: ["**/*.mjs", "*.config.{js,ts}", "tools/**/*"],
    languageOptions: { globals: globals.node },
  },
  {
    files: ["src/design-system/**/*.{ts,tsx}"],
    rules: restrictImports(
      ["@/content", "@/content/*", "@/features/*", "@/shell", "@/shell/*", "~/*"],
      "design-system must not depend on app code (spec §4.2).",
    ),
  },
  {
    files: ["src/content/**/*.{ts,tsx}", "src/lib/**/*.{ts,tsx}"],
    rules: restrictImports(
      ["@/design-system", "@/design-system/*", "@/features/*", "@/shell", "@/shell/*", "~/*"],
      "content/ and lib/ are leaf layers (spec §4.2).",
    ),
  },
  {
    files: ["src/features/**/*.{ts,tsx}"],
    rules: restrictImports(
      ["@/features/*"],
      "Features never import each other; move shared code down (spec §4.2).",
    ),
  },
  {
    files: ["app/**/*.{ts,tsx}", "src/features/**/*.{ts,tsx}"],
    rules: { "no-restricted-syntax": ["error", ...RAW_STYLE_LITERALS] },
  },
  prettier,
);
```

Add to `package.json` scripts: `"lint": "eslint ."`.

- [ ] **Step 4: Run lint and confirm the probes fail**

```bash
pnpm lint; echo "exit=$?"
```
Expected: errors naming `design-system must not depend on app code`, `Use design tokens, not raw hex colours` and `Use motion tokens`; `exit=1`.

- [ ] **Step 5: Delete the probes and confirm lint passes**

```bash
rm -rf src/design-system/__lint_probe__.ts src/features/__probe__
pnpm lint
```
Expected: no errors. (If `src/` is now empty, git won't track it. That's fine.)

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "chore: add ESLint with architecture and token rules

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 3: Unit-test runner and the `cn()` helper

**Files:**
- Create: `vitest.config.ts`, `tests/setup/vitest.setup.ts`, `src/lib/cn.ts`, `src/lib/cn.test.ts`
- Modify: `package.json` (scripts `test`, `test:watch`)

**Interfaces:**
- Consumes: Task 1.
- Produces: `pnpm test` (Vitest, jsdom). `cn(...inputs: ClassValue[]): string` from `@/lib/cn`, which merges class names and resolves Tailwind conflicts (later class wins).

- [ ] **Step 1: Install**

```bash
pnpm add clsx tailwind-merge
pnpm add -D vitest@^5 @vitejs/plugin-react jsdom @testing-library/react @testing-library/jest-dom @testing-library/user-event
```

- [ ] **Step 2: Write config and setup**

`vitest.config.ts`:
```ts
import react from "@vitejs/plugin-react";
import { defineConfig } from "vitest/config";

export default defineConfig({
  plugins: [react()],
  resolve: { tsconfigPaths: true },
  test: {
    environment: "jsdom",
    setupFiles: ["./tests/setup/vitest.setup.ts"],
    include: ["src/**/*.test.{ts,tsx}", "tools/**/*.test.ts", "tests/support/**/*.test.ts"],
    css: false,
    restoreMocks: true,
  },
});
```

`tests/setup/vitest.setup.ts`:
```ts
import "@testing-library/jest-dom/vitest";
```

Add scripts: `"test": "vitest run"`, `"test:watch": "vitest"`.

- [ ] **Step 3: Write the failing test**

`src/lib/cn.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { cn } from "./cn";

describe("cn", () => {
  it("joins truthy class names", () => {
    expect(cn("a", false, undefined, "b")).toBe("a b");
  });

  it("lets the later Tailwind class win on conflict", () => {
    expect(cn("px-2 py-1", "px-4")).toBe("py-1 px-4");
  });

  it("accepts conditional objects", () => {
    expect(cn("base", { active: true, hidden: false })).toBe("base active");
  });
});
```

- [ ] **Step 4: Run it to see it fail**

Run: `pnpm test src/lib/cn.test.ts`
Expected: FAIL, cannot find module `./cn`.

- [ ] **Step 5: Implement**

`src/lib/cn.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/** Merge class names; later Tailwind classes override earlier conflicting ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```

- [ ] **Step 6: Run to see it pass**

Run: `pnpm test src/lib/cn.test.ts`
Expected: 3 passed.

Note: Task 5 resets Tailwind's default theme. `tailwind-merge` still recognises our custom `type-*` utilities as distinct groups only if configured. Task 5 Step 7 extends `cn` for that, with a test.

- [ ] **Step 7: Commit**

```bash
git add -A
git commit -m "test: add Vitest and cn() class helper

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Browser tests, accessibility scan, JS-off check

**Files:**
- Create: `playwright.config.ts`, `tests/support/a11y.ts`, `tests/e2e/smoke.spec.ts`
- Modify: `package.json` (script `test:e2e`)

**Interfaces:**
- Consumes: Task 1 `build` and `preview` scripts.
- Produces: `pnpm test:e2e`, with two projects: `desktop` (1440×900) and `mobile` (390×844), both DPR 1. Helper `expectNoA11yViolations(page: Page): Promise<void>` from `tests/support/a11y.ts` (WCAG 2.0/2.1 A+AA rules).

- [ ] **Step 1: Install**

```bash
pnpm add -D @playwright/test@^1.63 @axe-core/playwright
pnpm exec playwright install chromium
```

- [ ] **Step 2: Write `playwright.config.ts`**

```ts
import { defineConfig, devices } from "@playwright/test";

const PORT = 4173;

export default defineConfig({
  testDir: "tests/e2e",
  outputDir: "test-results/playwright",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 1 : 0,
  reporter: [["list"], ["html", { open: "never" }]],
  use: { baseURL: `http://127.0.0.1:${PORT}`, trace: "retain-on-failure" },
  projects: [
    {
      name: "desktop",
      use: { ...devices["Desktop Chrome"], viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 },
    },
    {
      name: "mobile",
      use: {
        ...devices["Desktop Chrome"],
        viewport: { width: 390, height: 844 },
        deviceScaleFactor: 1,
        hasTouch: true,
      },
    },
  ],
  webServer: {
    command: "pnpm build && pnpm preview",
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
  },
});
```

Add script: `"test:e2e": "playwright test"`.

- [ ] **Step 3: Write the a11y helper**

`tests/support/a11y.ts`:
```ts
import AxeBuilder from "@axe-core/playwright";
import { expect, type Page } from "@playwright/test";

/** Fails the test with a readable list if axe finds any WCAG A/AA violation. */
export async function expectNoA11yViolations(page: Page): Promise<void> {
  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  const summary = results.violations.map(
    (v) => `${v.id} (${v.impact}): ${v.help} — ${v.nodes.map((n) => n.target.join(" ")).join(", ")}`,
  );
  expect(summary, "accessibility violations").toEqual([]);
}
```

- [ ] **Step 4: Write the smoke tests**

`tests/e2e/smoke.spec.ts`:
```ts
import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "../support/a11y";

test("home page renders its heading", async ({ page }) => {
  await page.goto("/");
  await expect(page.getByRole("heading", { level: 1, name: "YASH SARDA" })).toBeVisible();
});

test("home page has no accessibility violations", async ({ page }) => {
  await page.goto("/");
  await expectNoA11yViolations(page);
});

test.describe("without JavaScript", () => {
  test.use({ javaScriptEnabled: false });

  test("renders without JavaScript", async ({ page }) => {
    await page.goto("/");
    await expect(page.getByRole("heading", { level: 1, name: "YASH SARDA" })).toBeVisible();
  });
});
```

- [ ] **Step 5: Run**

Run: `pnpm test:e2e`
Expected: 6 passed (3 tests × 2 projects). If axe reports `landmark-one-main` or `page-has-heading-one`, the placeholder markup is wrong. Fix the markup, not the test.

- [ ] **Step 6: Commit**

```bash
git add -A
git commit -m "test: add Playwright with axe and no-JS smoke tests

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Design tokens, Tailwind lockdown, fonts, base styles

**Files:**
- Create: `src/design-system/tokens/tokens.css`, `theme.css`, `base.css`, `fonts.css`, `tests/fixtures/tailwind-probe.html`, `tests/e2e/tokens.spec.ts`
- Modify: `app/app.css`, `app/root.tsx` (font preload links), `app/routes/home.tsx` (use token classes), `src/lib/cn.ts` (+ test)

**Interfaces:**
- Consumes: Task 1 (app), Task 3 (`cn`), Task 4 (Playwright).
- Produces (later tasks rely on these exact names):
  - **Tailwind colour utilities** (`bg-*`, `text-*`, `border-*`): `ground night void ground-warm ground-trophy panel inset stand-3 stand-hi fixture plinth mast board line line-strong line-3 line-hover seg-empty board-line floodlight led white text-1 text-2 scout dim volt volt-hover volt-ink volt-ink-2 live gold court-line glass glass-solid bar venue-tint venue-mid venue-deep volt-a04 volt-a08 volt-a12 volt-a16 volt-a22 volt-a35 volt-a45 volt-a60 white-a03 white-a04 white-a05 white-a10 glass-edge`
  - **Fonts:** `font-display`, `font-body`, `font-mono`.
  - **Type recipes** (each sets family, size, line-height, tracking, weight): `type-hero type-hero-fluid type-call type-d1 type-d2 type-d2s type-stat type-d3 type-d3s type-d4 type-d4s type-btn-xl type-btn type-d5 type-sub type-mono-lg type-mono-md type-mono-eyebrow type-mono-brand type-mono-label type-mono-tag type-mono-comm type-mono-xs type-body-lg type-body type-body-md type-body-sm type-caption type-comm type-challenge`
  - **Surfaces:** `glass`, `glass-solid`, `bar` (utilities).
  - **Shadows:** `shadow-board shadow-card-3d shadow-toast shadow-holo shadow-glow-ring shadow-glow-cta shadow-glow-cursor shadow-bank-lg shadow-bank-sm shadow-bank-mini shadow-inset-cabinet`
  - **Easing:** `ease-follow ease-snap ease-swing ease-entrance ease-standard ease-absorb`. Duration vars `--dur-snap --dur-hover --dur-pop --dur-wipe --dur-follow --dur-count --dur-comm-hold`, used as `duration-(--dur-wipe)`.
  - **Blur:** `blur-beam`, `backdrop-blur-glass`.
  - **Breakpoints:** `md:` 768, `lg:` 1200, `xl:` 1440.
  - **Context attributes:** `data-venue="turf|court|hall"` sets `--venue-*`. `data-zone="trophy"` is the gold zone.
  - **CSS vars for components:** `--surface-*`, `--text-*`, `--border-*`, `--focus-ring`, `--glass-blur`, `--gutter`, `--header-h`, `--h-sm|md|lg|xl|tap`, `--hit`, `--seg-gap`, `--bw-brand`, `--skew`, `--venue-glow-rgb`, `--venue-light-rgb`, `--venue-crowd-rgb`, `--venue-crowd-alpha`, and the RGB triplets `--rgb-sky|beam|bulb|halo|crowd|warm|spot|volt|white|ground|stand`.

- [ ] **Step 1: Install fonts**

```bash
pnpm add @fontsource/big-shoulders-display @fontsource/archivo @fontsource/jetbrains-mono
```

- [ ] **Step 2: Write the failing e2e tests**

`tests/fixtures/tailwind-probe.html` (Tailwind scans this file, so the build either generates these classes or proves they don't exist):
```html
<!-- Lockdown probe: tokens.spec.ts asserts which of these classes exist in the built CSS. -->
<div class="bg-blue-500 rounded-lg text-sm shadow-md font-sans bg-volt type-d1 glass ease-follow"></div>
```

`tests/e2e/tokens.spec.ts`:
```ts
import { readdirSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";

function builtCss(): string {
  const dir = join(process.cwd(), "build/client/assets");
  return readdirSync(dir)
    .filter((f) => f.endsWith(".css"))
    .map((f) => readFileSync(join(dir, f), "utf8"))
    .join("\n");
}

test.describe("design tokens", () => {
  test("page ground and text use token colours", async ({ page }) => {
    await page.goto("/");
    const body = await page.evaluate(() => {
      const s = getComputedStyle(document.body);
      return { bg: s.backgroundColor, color: s.color };
    });
    expect(body.bg).toBe("rgb(5, 7, 10)");
    expect(body.color).toBe("rgb(242, 244, 245)");
  });

  test("display font loads with its fallback chain", async ({ page }) => {
    await page.goto("/");
    await page.evaluate(() => document.fonts.ready);
    const h1 = page.getByRole("heading", { level: 1 });
    const family = await h1.evaluate((el) => getComputedStyle(el).fontFamily);
    expect(family).toContain("Big Shoulders Display");
    expect(family).toContain("Arial Narrow");
    const loaded = await page.evaluate(() => document.fonts.check('900 84px "Big Shoulders Display"'));
    expect(loaded).toBe(true);
  });

  test("keyboard focus shows the volt ring", async ({ page }) => {
    await page.goto("/");
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => {
      const el = document.activeElement as HTMLElement;
      const s = getComputedStyle(el);
      return { tag: el.tagName, style: s.outlineStyle, color: s.outlineColor, width: s.outlineWidth };
    });
    expect(ring.tag).toBe("A");
    expect(ring.style).toBe("solid");
    expect(ring.color).toBe("rgb(215, 255, 63)");
    expect(ring.width).toBe("2px");
  });

  test("reduced motion collapses animations", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto("/");
    const duration = await page.evaluate(() => {
      const el = document.createElement("div");
      el.style.animation = "spin 2s linear infinite";
      document.body.append(el);
      return parseFloat(getComputedStyle(el).animationDuration);
    });
    expect(duration).toBeLessThan(0.001);
  });

  test("Tailwind defaults are locked out; tokens are in", () => {
    const css = builtCss();
    for (const banned of [".bg-blue-500", ".rounded-lg", ".text-sm", ".shadow-md", ".font-sans"]) {
      expect(css, `${banned} must not exist`).not.toContain(banned);
    }
    for (const allowed of [".bg-volt", ".type-d1", ".glass", ".ease-follow"]) {
      expect(css, `${allowed} must exist`).toContain(allowed);
    }
  });
});
```

- [ ] **Step 3: Run to see them fail**

Run: `pnpm test:e2e tests/e2e/tokens.spec.ts --project=desktop`
Expected: FAIL. Body background is not `rgb(5, 7, 10)`, there's no focusable link, and `.bg-blue-500` exists.

- [ ] **Step 4: Write `tokens.css` (reference + semantic + context layers)**

`src/design-system/tokens/tokens.css`:
```css
/* The Arena — design tokens. Single source of truth (spec §5.1).
   Layer 1 = reference (raw values) · Layer 2 = semantic (roles) · Layer 3 = context overrides.
   Exact origins of every value: docs/superpowers/specs/2026-10-03-arena-design-audit.md §2. */

:root {
  /* ---------- Layer 1: reference ---------- */
  /* grounds */
  --ref-ground: #05070a;
  --ref-night: #030405;
  --ref-void: #020304;
  --ref-ground-warm: #07060a;
  --ref-ground-trophy: #040508;
  /* stands & surfaces */
  --ref-stand: #0e141b;
  --ref-stand-2: #0b0f14;
  --ref-stand-3: #0a0e13;
  --ref-stand-hi: #141b23;
  --ref-fixture: #1a2027;
  --ref-plinth: #13171c;
  --ref-mast: #2a3138;
  /* lines */
  --ref-line: #1c232c;
  --ref-line-strong: #2a323c;
  --ref-line-3: #3a434c; /* borders/decoration only — 1.95:1 as text (spec A1) */
  --ref-line-hover: #5d6670; /* borders/decoration only — 3.44:1 as text (spec A1) */
  --ref-seg-empty: #26303a;
  /* text */
  --ref-white: #ffffff;
  --ref-led-white: #f4f6f7;
  --ref-floodlight: #f2f4f5;
  --ref-text-1: #e6eaee;
  --ref-text-2: #c3cbd3;
  --ref-scout-grey: #a3adb7;
  --ref-dim: #7d8893; /* dimmest allowed text colour (≥4.5:1 on ground) */
  /* accent & signals */
  --ref-volt: #d7ff3f;
  --ref-volt-hover: #e6ff7a;
  --ref-volt-ink: #0a0c08;
  --ref-volt-ink-2: #2e3a0a;
  --ref-live-red: #ff4d3d; /* 6–8px live dot only, never a fill */
  --ref-gold: #d4b26a; /* trophy zone only */
  /* scoreboard (canonical set = Intro, audit §10 #22) */
  --ref-board-bg: #06080b;
  --ref-board-line: #1a2028;
  --ref-board-border: #2a323c;
  --ref-board-ring: #232a33;
  --ref-board-bezel: #0a0d11;
  /* venues */
  --ref-turf-tint: #0e3322;
  --ref-turf-mid: #185634;
  --ref-turf-deep: #0a2015;
  --ref-court-tint: #0c2236;
  --ref-court-mid: #1b4c76;
  --ref-court-deep: #0a1a2b;
  --ref-hall-tint: #24180e;
  --ref-hall-mid: #5a3e22;
  --ref-hall-deep: #22170d;
  --ref-court-line: #e8eef3;

  /* RGB triplets for alpha use: rgb(var(--rgb-volt) / 0.35) */
  --rgb-sky: 150 172 200;
  --rgb-beam: 225 236 250;
  --rgb-bulb: 228 238 252;
  --rgb-halo: 200 216 238;
  --rgb-crowd: 214 224 236;
  --rgb-warm: 255 228 184;
  --rgb-spot: 255 236 200;
  --rgb-volt: 215 255 63;
  --rgb-white: 255 255 255;
  --rgb-ground: 5 7 10;
  --rgb-stand: 14 19 26;

  /* alpha ramps (replace the audit's 142 one-off rgba values) */
  --ref-volt-a04: rgb(var(--rgb-volt) / 0.04);
  --ref-volt-a08: rgb(var(--rgb-volt) / 0.08);
  --ref-volt-a12: rgb(var(--rgb-volt) / 0.12);
  --ref-volt-a16: rgb(var(--rgb-volt) / 0.16);
  --ref-volt-a22: rgb(var(--rgb-volt) / 0.22);
  --ref-volt-a35: rgb(var(--rgb-volt) / 0.35);
  --ref-volt-a45: rgb(var(--rgb-volt) / 0.45);
  --ref-volt-a60: rgb(var(--rgb-volt) / 0.6);
  --ref-white-a03: rgb(var(--rgb-white) / 0.03);
  --ref-white-a04: rgb(var(--rgb-white) / 0.04);
  --ref-white-a05: rgb(var(--rgb-white) / 0.05);
  --ref-white-a09: rgb(var(--rgb-white) / 0.09);
  --ref-white-a10: rgb(var(--rgb-white) / 0.1);

  /* ---------- Layer 2: semantic ---------- */
  --surface-ground: var(--ref-ground);
  --surface-panel: var(--ref-stand);
  --surface-inset: var(--ref-stand-2);
  --surface-glass: rgb(var(--rgb-stand) / 0.66);
  --surface-glass-solid: rgb(var(--rgb-stand) / 0.85);
  --surface-bar: rgb(var(--rgb-ground) / 0.9);
  --text-primary: var(--ref-floodlight);
  --text-body: var(--ref-text-1);
  --text-secondary: var(--ref-text-2);
  --text-label: var(--ref-scout-grey);
  --text-dim: var(--ref-dim);
  --text-on-accent: var(--ref-volt-ink);
  --text-on-accent-2: var(--ref-volt-ink-2);
  --border-subtle: var(--ref-line);
  --border-control: var(--ref-line-strong);
  --border-strong: var(--ref-line-3);
  --border-hover: var(--ref-line-hover);
  --border-glass: var(--ref-white-a09);
  --border-selected: var(--ref-volt);
  --accent: var(--ref-volt);
  --accent-hover: var(--ref-volt-hover);
  --signal-live: var(--ref-live-red);
  --focus-ring: var(--ref-volt);
  --glass-blur: 14px;

  /* layout & sizing */
  --gutter: 36px;
  --header-h: 76px;
  --hit: 44px;
  --h-sm: 44px;
  --h-md: 52px;
  --h-lg: 62px;
  --h-xl: 78px;
  --h-tap: 110px;
  --seg-gap: 3px;
  --bw-brand: 1.5px;
  --skew: -12deg;

  /* motion durations (easings live in theme.css) */
  --dur-snap: 200ms;
  --dur-hover: 300ms;
  --dur-pop: 450ms;
  --dur-wipe: 480ms;
  --dur-follow: 900ms;
  --dur-count: 900ms;
  --dur-comm-hold: 4000ms;
}

/* ---------- Layer 3: context overrides ---------- */
[data-venue="turf"] {
  --venue-tint: var(--ref-turf-tint);
  --venue-mid: var(--ref-turf-mid);
  --venue-deep: var(--ref-turf-deep);
  --venue-glow-rgb: 46 132 78;
  --venue-light-rgb: var(--rgb-beam);
  --venue-crowd-rgb: var(--rgb-crowd);
  --venue-crowd-alpha: 0.26;
}
[data-venue="court"] {
  --venue-tint: var(--ref-court-tint);
  --venue-mid: var(--ref-court-mid);
  --venue-deep: var(--ref-court-deep);
  --venue-glow-rgb: 31 78 122;
  --venue-light-rgb: var(--rgb-beam);
  --venue-crowd-rgb: var(--rgb-crowd);
  --venue-crowd-alpha: 0.24;
}
[data-venue="hall"] {
  --venue-tint: var(--ref-hall-tint);
  --venue-mid: var(--ref-hall-mid);
  --venue-deep: var(--ref-hall-deep);
  --venue-glow-rgb: 120 84 44;
  --venue-light-rgb: var(--rgb-warm);
  --venue-crowd-rgb: 230 214 190;
  --venue-crowd-alpha: 0.18;
  --surface-ground: var(--ref-ground-warm);
}
[data-zone="trophy"] {
  --surface-ground: var(--ref-ground-trophy);
  --accent-gold: var(--ref-gold);
}

/* Mobile: solid panels, no blur, 16px gutter (Responsive board) */
@media (max-width: 47.99rem) {
  :root {
    --surface-glass: var(--surface-glass-solid);
    --border-glass: var(--ref-line-strong);
    --glass-blur: 0px;
    --gutter: 16px;
  }
}
```

- [ ] **Step 5: Write `theme.css` (Tailwind lockdown + mapping)**

`src/design-system/tokens/theme.css`:
```css
/* Tailwind theme: only Arena tokens exist. Defaults are reset so off-system classes can't be used. */
@theme {
  --color-*: initial;
  --font-*: initial;
  --text-*: initial;
  --radius-*: initial;
  --shadow-*: initial;
  --inset-shadow-*: initial;
  --drop-shadow-*: initial;
  --text-shadow-*: initial;
  --ease-*: initial;
  --animate-*: initial;
  --blur-*: initial;
  --breakpoint-*: initial;

  --breakpoint-md: 48rem; /* 768 */
  --breakpoint-lg: 75rem; /* 1200 */
  --breakpoint-xl: 90rem; /* 1440 */

  --font-display: "Big Shoulders Display", "Oswald", "Arial Narrow", sans-serif;
  --font-body: "Archivo", "Helvetica Neue", Arial, sans-serif;
  --font-mono: "JetBrains Mono", ui-monospace, Menlo, monospace;

  --ease-follow: cubic-bezier(0.22, 1, 0.36, 1);
  --ease-snap: cubic-bezier(0.2, 0.9, 0.1, 1);
  --ease-swing: cubic-bezier(0.65, 0, 0.35, 1);
  --ease-entrance: cubic-bezier(0.12, 0.9, 0.25, 1);
  --ease-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --ease-absorb: cubic-bezier(0.7, 0, 0.84, 0);

  --blur-beam: 6px;
}

@theme inline {
  /* grounds & surfaces */
  --color-ground: var(--surface-ground);
  --color-night: var(--ref-night);
  --color-void: var(--ref-void);
  --color-ground-warm: var(--ref-ground-warm);
  --color-ground-trophy: var(--ref-ground-trophy);
  --color-panel: var(--surface-panel);
  --color-inset: var(--surface-inset);
  --color-stand-3: var(--ref-stand-3);
  --color-stand-hi: var(--ref-stand-hi);
  --color-fixture: var(--ref-fixture);
  --color-plinth: var(--ref-plinth);
  --color-mast: var(--ref-mast);
  --color-board: var(--ref-board-bg);
  --color-glass: var(--surface-glass);
  --color-glass-solid: var(--surface-glass-solid);
  --color-bar: var(--surface-bar);
  /* lines */
  --color-line: var(--border-subtle);
  --color-line-strong: var(--border-control);
  --color-line-3: var(--border-strong);
  --color-line-hover: var(--border-hover);
  --color-glass-edge: var(--border-glass);
  --color-seg-empty: var(--ref-seg-empty);
  --color-board-line: var(--ref-board-line);
  /* text */
  --color-floodlight: var(--text-primary);
  --color-led: var(--ref-led-white);
  --color-white: var(--ref-white);
  --color-text-1: var(--text-body);
  --color-text-2: var(--text-secondary);
  --color-scout: var(--text-label);
  --color-dim: var(--text-dim);
  /* accent & signals */
  --color-volt: var(--accent);
  --color-volt-hover: var(--accent-hover);
  --color-volt-ink: var(--text-on-accent);
  --color-volt-ink-2: var(--text-on-accent-2);
  --color-live: var(--signal-live);
  --color-gold: var(--accent-gold, var(--ref-gold));
  --color-court-line: var(--ref-court-line);
  /* alpha ramps */
  --color-volt-a04: var(--ref-volt-a04);
  --color-volt-a08: var(--ref-volt-a08);
  --color-volt-a12: var(--ref-volt-a12);
  --color-volt-a16: var(--ref-volt-a16);
  --color-volt-a22: var(--ref-volt-a22);
  --color-volt-a35: var(--ref-volt-a35);
  --color-volt-a45: var(--ref-volt-a45);
  --color-volt-a60: var(--ref-volt-a60);
  --color-white-a03: var(--ref-white-a03);
  --color-white-a04: var(--ref-white-a04);
  --color-white-a05: var(--ref-white-a05);
  --color-white-a10: var(--ref-white-a10);
  /* venue (set by data-venue) */
  --color-venue-tint: var(--venue-tint);
  --color-venue-mid: var(--venue-mid);
  --color-venue-deep: var(--venue-deep);

  /* shadows & glows (audit §2.7) */
  --shadow-board: 0 0 0 8px var(--ref-board-bezel), 0 0 0 9px var(--ref-board-ring), 0 50px 140px rgb(0 0 0 / 0.7);
  --shadow-card-3d: 0 30px 80px rgb(0 0 0 / 0.5);
  --shadow-toast: 0 20px 60px rgb(0 0 0 / 0.6);
  --shadow-holo: 0 60px 120px rgb(0 0 0 / 0.7), 0 0 60px rgb(var(--rgb-volt) / 0.1);
  --shadow-glow-ring: 0 0 18px rgb(var(--rgb-volt) / 0.6);
  --shadow-glow-cta: 0 0 40px rgb(var(--rgb-volt) / 0.25);
  --shadow-glow-cursor: 0 0 12px rgb(var(--rgb-white) / 0.9);
  --shadow-bank-lg: 0 0 40px 12px rgb(var(--rgb-bulb) / 0.45), 0 0 220px 80px rgb(var(--rgb-halo) / 0.14);
  --shadow-bank-sm: 0 0 30px 10px rgb(var(--rgb-bulb) / 0.4), 0 0 160px 60px rgb(var(--rgb-halo) / 0.1);
  --shadow-bank-mini: 0 0 22px 6px rgb(var(--rgb-bulb) / 0.4);
  --shadow-inset-cabinet: inset 0 0 120px rgb(0 0 0 / 0.8);

  --blur-glass: var(--glass-blur);
}
```

- [ ] **Step 6: Write `fonts.css`, `base.css` (type recipes, surfaces, focus, reduced motion), and wire `app.css`**

`src/design-system/tokens/fonts.css`:
```css
/* Self-hosted fonts, trimmed to the weights the designs use (spec §13). */
@import "@fontsource/big-shoulders-display/700.css";
@import "@fontsource/big-shoulders-display/800.css";
@import "@fontsource/big-shoulders-display/900.css";
@import "@fontsource/archivo/400.css";
@import "@fontsource/archivo/500.css";
@import "@fontsource/archivo/600.css";
@import "@fontsource/archivo/700.css";
@import "@fontsource/archivo/400-italic.css";
@import "@fontsource/archivo/500-italic.css";
@import "@fontsource/jetbrains-mono/400.css";
@import "@fontsource/jetbrains-mono/700.css";
```

`src/design-system/tokens/base.css`:
```css
@layer base {
  html {
    background: var(--surface-ground);
    color: var(--text-primary);
    font-family: var(--font-body);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: grayscale;
    text-rendering: optimizeLegibility;
  }
  body {
    margin: 0;
    min-height: 100dvh;
    background: var(--surface-ground);
  }
  ::selection {
    background: var(--ref-volt);
    color: var(--ref-volt-ink);
  }
  a {
    color: inherit;
    text-decoration: none;
  }
  :focus-visible {
    outline: 2px solid var(--focus-ring);
    outline-offset: 3px;
  }
}

@media (prefers-reduced-motion: reduce) {
  *,
  *::before,
  *::after {
    animation-duration: 0.01ms !important;
    animation-iteration-count: 1 !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
}

/* ---------- surfaces ---------- */
@utility glass {
  background: var(--surface-glass);
  border: 1px solid var(--border-glass);
  backdrop-filter: blur(var(--glass-blur));
  -webkit-backdrop-filter: blur(var(--glass-blur));
}
@utility glass-solid {
  background: var(--surface-glass-solid);
  border: 1px solid var(--border-control);
}
@utility bar {
  background: var(--surface-bar);
}

/* ---------- type recipes (audit §2.4 consolidated scale) ---------- */
/* display: the competitor */
@utility type-hero { font-family: var(--font-display); font-weight: 900; font-size: 156px; line-height: 0.86; letter-spacing: 0.02em; text-transform: uppercase; }
@utility type-hero-fluid { font-family: var(--font-display); font-weight: 900; font-size: clamp(64px, 11vw, 156px); line-height: 0.85; letter-spacing: 0.01em; text-transform: uppercase; }
@utility type-call { font-family: var(--font-display); font-weight: 900; font-size: 120px; line-height: 1; letter-spacing: 0.04em; text-transform: uppercase; }
@utility type-d1 { font-family: var(--font-display); font-weight: 900; font-size: 84px; line-height: 0.85; text-transform: uppercase; }
@utility type-d2 { font-family: var(--font-display); font-weight: 900; font-size: 60px; line-height: 0.9; text-transform: uppercase; }
@utility type-d2s { font-family: var(--font-display); font-weight: 900; font-size: 52px; line-height: 0.9; text-transform: uppercase; }
@utility type-stat { font-family: var(--font-display); font-weight: 900; font-size: 40px; line-height: 1; font-variant-numeric: tabular-nums; text-transform: uppercase; }
@utility type-d3 { font-family: var(--font-display); font-weight: 900; font-size: 34px; line-height: 0.95; text-transform: uppercase; }
@utility type-d3s { font-family: var(--font-display); font-weight: 900; font-size: 30px; line-height: 0.95; text-transform: uppercase; }
@utility type-d4 { font-family: var(--font-display); font-weight: 800; font-size: 26px; line-height: 1; letter-spacing: 0.04em; text-transform: uppercase; }
@utility type-d4s { font-family: var(--font-display); font-weight: 800; font-size: 24px; line-height: 1; letter-spacing: 0.03em; text-transform: uppercase; }
@utility type-btn-xl { font-family: var(--font-display); font-weight: 800; font-size: 26px; line-height: 1; letter-spacing: 0.14em; text-transform: uppercase; }
@utility type-btn { font-family: var(--font-display); font-weight: 800; font-size: 20px; line-height: 1; letter-spacing: 0.14em; text-transform: uppercase; }
@utility type-d5 { font-family: var(--font-display); font-weight: 800; font-size: 18px; line-height: 1; letter-spacing: 0.08em; text-transform: uppercase; }
@utility type-sub { font-family: var(--font-display); font-weight: 700; font-size: 30px; line-height: 1; letter-spacing: 0.42em; text-transform: uppercase; }
/* mono: the engineer (11px floor, spec A2) */
@utility type-mono-lg { font-family: var(--font-mono); font-weight: 400; font-size: 14px; line-height: 1.4; letter-spacing: 0.22em; text-transform: uppercase; }
@utility type-mono-md { font-family: var(--font-mono); font-weight: 400; font-size: 12px; line-height: 1.3; letter-spacing: 0.16em; text-transform: uppercase; }
@utility type-mono-eyebrow { font-family: var(--font-mono); font-weight: 400; font-size: 12px; line-height: 1; letter-spacing: 0.22em; text-transform: uppercase; }
@utility type-mono-brand { font-family: var(--font-mono); font-weight: 400; font-size: 12px; line-height: 1; letter-spacing: 0.24em; text-transform: uppercase; }
@utility type-mono-label { font-family: var(--font-mono); font-weight: 400; font-size: 11px; line-height: 1.3; letter-spacing: 0.2em; text-transform: uppercase; }
@utility type-mono-tag { font-family: var(--font-mono); font-weight: 400; font-size: 11px; line-height: 1; letter-spacing: 0.16em; text-transform: uppercase; }
@utility type-mono-comm { font-family: var(--font-mono); font-weight: 700; font-size: 11px; line-height: 1; letter-spacing: 0.2em; text-transform: uppercase; }
@utility type-mono-xs { font-family: var(--font-mono); font-weight: 400; font-size: 11px; line-height: 1.2; letter-spacing: 0.14em; text-transform: uppercase; }
/* body: the narrator */
@utility type-body-lg { font-family: var(--font-body); font-weight: 400; font-size: 18px; line-height: 1.55; }
@utility type-body { font-family: var(--font-body); font-weight: 400; font-size: 16px; line-height: 1.5; }
@utility type-body-md { font-family: var(--font-body); font-weight: 400; font-size: 15px; line-height: 1.45; }
@utility type-body-sm { font-family: var(--font-body); font-weight: 400; font-size: 14px; line-height: 1.45; }
@utility type-caption { font-family: var(--font-body); font-weight: 400; font-size: 13px; line-height: 1.45; }
@utility type-comm { font-family: var(--font-body); font-weight: 400; font-style: italic; font-size: 16px; line-height: 1.3; }
@utility type-challenge { font-family: var(--font-body); font-weight: 500; font-style: italic; font-size: clamp(22px, 2.1vw, 30px); line-height: 1.2; }
```

Replace `app/app.css` with:
```css
@import "tailwindcss";
@import "../src/design-system/tokens/fonts.css";
@import "../src/design-system/tokens/tokens.css";
@import "../src/design-system/tokens/theme.css";
@import "../src/design-system/tokens/base.css";

@source "../tests/fixtures/tailwind-probe.html";
```

- [ ] **Step 7: Teach `cn()` about the custom recipes (test first)**

Add to `src/lib/cn.test.ts`:
```ts
it("treats type-* recipes as one conflict group", () => {
  expect(cn("type-d1", "type-d2")).toBe("type-d2");
});

it("keeps a type recipe alongside a colour", () => {
  expect(cn("type-d1 text-volt")).toBe("type-d1 text-volt");
});
```
Run `pnpm test src/lib/cn.test.ts`. Expected: the first new test FAILS (both classes kept).

Replace `src/lib/cn.ts`:
```ts
import { clsx, type ClassValue } from "clsx";
import { extendTailwindMerge } from "tailwind-merge";

// Our `type-*` utilities each set a full type recipe, so two of them always conflict.
const twMerge = extendTailwindMerge({
  extend: {
    classGroups: {
      "type-recipe": [{ type: [(value: string) => value.length > 0] }],
    },
  },
});

/** Merge class names; later Tailwind classes override earlier conflicting ones. */
export function cn(...inputs: ClassValue[]): string {
  return twMerge(clsx(inputs));
}
```
Run again. Expected: 5 passed.

- [ ] **Step 8: Preload the display font and use tokens in the placeholder**

In `app/root.tsx`, add above `Layout`:
```tsx
import type { Route } from "./+types/root";
import displayFont from "@fontsource/big-shoulders-display/files/big-shoulders-display-latin-900-normal.woff2?url";

export const links: Route.LinksFunction = () => [
  { rel: "preload", href: displayFont, as: "font", type: "font/woff2", crossOrigin: "anonymous" },
];
```
If that file path doesn't exist, run `ls node_modules/@fontsource/big-shoulders-display/files | grep latin-900` and use the exact filename.

Replace the `Home` component body in `app/routes/home.tsx`:
```tsx
export default function Home() {
  return (
    <main className="grid min-h-dvh place-items-center bg-night">
      <div className="flex flex-col items-center gap-4">
        <p className="type-mono-brand text-scout">THE ARENA</p>
        <h1 className="type-d1 text-floodlight">YASH SARDA</h1>
        <a className="type-mono-md text-volt hover:text-volt-hover" href="#top">
          PORTFOLIO COMING SOON
        </a>
      </div>
    </main>
  );
}
```

- [ ] **Step 9: Run all e2e tests**

Run: `pnpm test:e2e`
Expected: all smoke + token tests pass in both projects. If "display font loads" fails, check the fontsource family name with `grep font-family node_modules/@fontsource/big-shoulders-display/900.css` and align `--font-display`.

- [ ] **Step 10: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Arena design tokens, locked Tailwind theme, fonts and base styles

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: Storybook with a living token catalogue

**Files:**
- Create: `.storybook/main.ts`, `.storybook/preview.tsx`, `.storybook/vite.config.ts`, `src/design-system/tokens/catalog.ts`, `src/design-system/tokens/catalog.test.ts`, `src/design-system/tokens/Tokens.stories.tsx`
- Modify: `package.json` (scripts `storybook`, `build-storybook`)

**Interfaces:**
- Consumes: Task 5 tokens and `app/app.css`.
- Produces: `pnpm storybook` (port 6006) and `pnpm build-storybook` → `storybook-static/`. Stories live next to components as `*.stories.tsx`. `TOKEN_CATALOG` from `@/design-system/tokens/catalog` lists colour, type, shadow and ease token names.

- [ ] **Step 1: Install**

```bash
pnpm add -D storybook@^10 @storybook/react-vite@^10 @storybook/addon-a11y@^10 @storybook/addon-docs@^10
```

- [ ] **Step 2: Write the failing catalogue-sync test**

`src/design-system/tokens/catalog.test.ts`:
```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { TOKEN_CATALOG } from "./catalog";

const dir = join(process.cwd(), "src/design-system/tokens");
const theme = readFileSync(join(dir, "theme.css"), "utf8");
const base = readFileSync(join(dir, "base.css"), "utf8");

describe("token catalogue", () => {
  it.each(TOKEN_CATALOG.colors)("colour %s exists in theme.css", (name) => {
    expect(theme).toContain(`--color-${name}:`);
  });
  it.each(TOKEN_CATALOG.type)("type recipe %s exists in base.css", (name) => {
    expect(base).toContain(`@utility ${name} {`);
  });
  it.each(TOKEN_CATALOG.shadows)("shadow %s exists in theme.css", (name) => {
    expect(theme).toContain(`--shadow-${name}:`);
  });
  it.each(TOKEN_CATALOG.eases)("ease %s exists in theme.css", (name) => {
    expect(theme).toContain(`--ease-${name}:`);
  });
});
```
Run: `pnpm test src/design-system/tokens`. Expected: FAIL, cannot find `./catalog`.

- [ ] **Step 3: Write the catalogue**

`src/design-system/tokens/catalog.ts`:
```ts
/** Names of every public token, used by the Storybook catalogue and kept in sync by catalog.test.ts. */
export const TOKEN_CATALOG = {
  colors: [
    "ground", "night", "void", "ground-warm", "ground-trophy", "panel", "inset", "stand-3", "stand-hi",
    "fixture", "plinth", "mast", "board", "glass", "glass-solid", "bar",
    "line", "line-strong", "line-3", "line-hover", "glass-edge", "seg-empty", "board-line",
    "floodlight", "led", "white", "text-1", "text-2", "scout", "dim",
    "volt", "volt-hover", "volt-ink", "volt-ink-2", "live", "gold", "court-line",
    "volt-a04", "volt-a08", "volt-a12", "volt-a16", "volt-a22", "volt-a35", "volt-a45", "volt-a60",
    "white-a03", "white-a04", "white-a05", "white-a10",
  ],
  type: [
    "type-hero", "type-hero-fluid", "type-call", "type-d1", "type-d2", "type-d2s", "type-stat",
    "type-d3", "type-d3s", "type-d4", "type-d4s", "type-btn-xl", "type-btn", "type-d5", "type-sub",
    "type-mono-lg", "type-mono-md", "type-mono-eyebrow", "type-mono-brand", "type-mono-label",
    "type-mono-tag", "type-mono-comm", "type-mono-xs",
    "type-body-lg", "type-body", "type-body-md", "type-body-sm", "type-caption", "type-comm",
    "type-challenge",
  ],
  shadows: [
    "board", "card-3d", "toast", "holo", "glow-ring", "glow-cta", "glow-cursor",
    "bank-lg", "bank-sm", "bank-mini", "inset-cabinet",
  ],
  eases: ["follow", "snap", "swing", "entrance", "standard", "absorb"],
} as const;
```
Run the test again. Expected: all pass.

- [ ] **Step 4: Storybook config**

`.storybook/vite.config.ts` (Storybook must not load the React Router plugin):
```ts
import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react";
import { defineConfig } from "vite";

export default defineConfig({
  plugins: [tailwindcss(), react()],
  resolve: { tsconfigPaths: true },
});
```

`.storybook/main.ts`:
```ts
import type { StorybookConfig } from "@storybook/react-vite";

const config: StorybookConfig = {
  stories: ["../src/**/*.stories.@(ts|tsx)"],
  addons: ["@storybook/addon-a11y", "@storybook/addon-docs"],
  framework: {
    name: "@storybook/react-vite",
    options: { builder: { viteConfigPath: ".storybook/vite.config.ts" } },
  },
};

export default config;
```

`.storybook/preview.tsx`:
```tsx
import type { Preview } from "@storybook/react-vite";
import "../app/app.css";

const preview: Preview = {
  parameters: {
    layout: "padded",
    backgrounds: { disable: true },
    a11y: { test: "error" },
  },
  decorators: [
    (Story) => (
      <div className="min-h-dvh bg-ground p-6 text-floodlight">
        <Story />
      </div>
    ),
  ],
};

export default preview;
```

Scripts: `"storybook": "storybook dev -p 6006"`, `"build-storybook": "storybook build --quiet"`.

- [ ] **Step 5: Token stories**

`src/design-system/tokens/Tokens.stories.tsx`:
```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { TOKEN_CATALOG } from "./catalog";

const meta: Meta = { title: "Foundations/Tokens" };
export default meta;

export const Colours: StoryObj = {
  render: () => (
    <div className="grid grid-cols-6 gap-4">
      {TOKEN_CATALOG.colors.map((name) => (
        <figure key={name} className="flex flex-col gap-2">
          <div
            className="h-16 border border-line"
            style={{ background: `var(--color-${name})` }}
            aria-hidden="true"
          />
          <figcaption className="type-mono-tag text-scout">{name}</figcaption>
        </figure>
      ))}
    </div>
  ),
};

export const Type: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      {TOKEN_CATALOG.type.map((name) => (
        <div key={name} className="flex flex-col gap-1 border-b border-line pb-4">
          <span className="type-mono-tag text-dim">{name}</span>
          <span className={name}>Think you can beat me?</span>
        </div>
      ))}
    </div>
  ),
};

export const Shadows: StoryObj = {
  render: () => (
    <div className="grid grid-cols-4 gap-10 p-10">
      {TOKEN_CATALOG.shadows.map((name) => (
        <div
          key={name}
          className="flex h-24 items-end bg-panel p-3"
          style={{ boxShadow: `var(--shadow-${name})` }}
        >
          <span className="type-mono-tag text-scout">{name}</span>
        </div>
      ))}
    </div>
  ),
};

export const Surfaces: StoryObj = {
  render: () => (
    <div className="flex gap-6">
      <div className="glass p-5 type-body">glass</div>
      <div className="glass-solid p-5 type-body">glass-solid</div>
      <div className="bar p-5 type-body">bar</div>
    </div>
  ),
};
```
(Inline `style` with `var(--…)` is allowed here: design-system code, token references only, no raw values.)

- [ ] **Step 6: Build Storybook**

Run: `pnpm build-storybook`
Expected: success, `storybook-static/index.html` exists. Then run `pnpm storybook`, open `http://localhost:6006`, check that "Foundations/Tokens" renders swatches in the Arena fonts, then stop it.

- [ ] **Step 7: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: add Storybook with token catalogue

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Content layer — validated data and selectors

**Files:**
- Create: `src/content/content.json`, `schema.ts`, `schema.test.ts`, `format.ts`, `format.test.ts`, `selectors.ts`, `selectors.test.ts`, `ui-copy.ts`, `index.ts`

**Interfaces:**
- Consumes: Task 3 (Vitest).
- Produces (from `@/content`):
  - `content: Content` (parsed, validated) and the type `Content`.
  - `parseContent(raw: unknown): Content`. Throws `ContentError` whose message lists each bad field path.
  - `ui` (UI copy object, `as const`).
  - Formatters: `formatMonth(ym: string): string` ("Jul 2024"), `formatSpan(start: string, end: string | null): string` ("Jul 2024 – now", "Jun – Jul 2023", "Dec 2023 – Jan 2024"), `formatYearSpan(start: string, end: string): string` ("2020 – 2024"), `experienceSince(ym: string): string` ("SINCE JUL 2024"), `monthsBetween(startYm: string, now: Date): number`.
  - Selectors (all pure, `Content` passed explicitly so tests can use fixtures; screens call e.g. `getCareerRows(content)`):
    - `getCareerRows(c: Content): CareerRow[]`
    - `getInningsReveals(c: Content): InningsReveal[]` (3 items: 2 careers + academy)
    - `getHighlights(c: Content): Highlight[]` (QF → SF → FINAL)
    - `getAttributeGroups(c: Content): AttributeGroup[]`
    - `getTrophies(c: Content): Trophy[]`
    - `getResumeAction(c: Content): ResumeAction`
  - Constants: `LEVEL_SEGMENTS`, `LEVEL_LABEL`.
  - Types: `CareerRow`, `InningsReveal`, `Highlight`, `AttributeGroup`, `SkillView`, `Trophy`, `ResumeAction`, `SkillLevel`.

- [ ] **Step 1: Install Zod**

```bash
pnpm add zod@^4
```

- [ ] **Step 2: Create `content.json`**

Copy `temp_handoff/yash-sarda-arena-handoff/content/content.json` to `src/content/content.json`, then apply exactly these edits (spec §6, §11.2, §12):

1. `player.resumePdf` → `null` (the phone-number PDF is never shipped).
2. Add `player.cardBio`: `"Software engineer with hands-on full-stack experience. I like problems that need solving properly — and software that delivers measurable, real-world impact."`
3. `careerStats[0]`: add `"scoutLine": "Bulk upload cut manual data entry by 60%."`. `careerStats[1]`: add `"scoutLine": "Built a Kudo Board recognition platform from scratch for 10,000+ employees."`.
4. `matchHighlights` (match by `name`): add `facts` and `scoutLine`.
   - AI Interview Grooming Platform: `"facts": [{"k":"TYPE","v":"Academic project · PICT"},{"k":"RECOGNITION","v":"Journal publication"}]`, `"scoutLine": "A conversational AI interviewer: Google Gemini generates questions, asks follow-ups based on your answers, evaluates them and scores you at the end. Published in a journal."`
   - Kudo Board: `"facts": [{"k":"TYPE","v":"Internship project · Deutsche Bank"},{"k":"REACH","v":"10,000+ employees"}]`, `"scoutLine": "A recognition platform built from the ground up for 10,000+ employees, with messages, GIFs, short videos and gesture-based responses."`
   - Power BI Dashboard: `"facts": [{"k":"TYPE","v":"Analytics web platform"},{"k":"KEY PIECE","v":"Secure token generation"}]`, `"scoutLine": "Interactive Power BI dashboards embedded via the REST Embedding API, with server-side session management and token generation — on desktop and mobile."`
5. `playerAttributes.groups[*]`: add `note`.
   - Backend: `"Power and pace — where most of my points are won."`
   - Frontend: `"Finesse at the net — the part users actually touch."`
   - Data: `"Consistent, reliable, never gives away a cheap point."`
   - Craft: `"Reading the whole court before the shuttle lands."`
6. `trophyRoom[*]`: add `description`, `links` and `draftCopy`. Derived copy is flagged `"draftCopy": true` for Yash's review (spec §12).
   - cup: `"description": "Competitive programming across three platforms — the daily practice behind fast, clean problem-solving on the job."`, `"links": [{"label":"LEETCODE","href":"https://leetcode.com/u/yash_sarda"},{"label":"CODEFORCES","href":"https://codeforces.com/profile/yashsarda2002"},{"label":"CODECHEF","href":"https://www.codechef.com/users/yash0721"}]`, `"draftCopy": false`
   - medal: `"description": "Top half-percent of the state engineering entrance exam — 99.5 percentile, State Merit Rank 709. Preparing properly started here."`, `"links": []`, `"draftCopy": true`
   - plaque: `"description": "A conversational AI interviewer built on Google Gemini — designed, built and written up as a paper published in a journal."`, `"links": []`, `"draftCopy": true`
   - pennant: `"description": "Four years of Information Technology at PICT, finished with Distinction and a CGPA of 8.94."`, `"links": []`, `"draftCopy": true`
   - round: `"description": "System design write-ups shared on LinkedIn — how big systems hold up, one diagram at a time."`, `"links": [{"label":"LINKEDIN","href":"https://www.linkedin.com/in/yash-sarda2107/"}]`, `"draftCopy": true`
   - locked: `"description": "Hidden. Beat Yash at any venue to unlock it."`, `"links": []`, `"draftCopy": true`
7. `trainingAcademy`: add `"shortName": "PICT"` and `"city": "Pune"`.
8. `commentary.yashWins`: append `"He doesn't like losing. Noted."`.

- [ ] **Step 3: Write the failing schema tests**

`src/content/schema.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import raw from "./content.json";
import { ContentError, parseContent } from "./schema";

describe("content schema", () => {
  it("accepts the real content file", () => {
    expect(() => parseContent(raw)).not.toThrow();
  });

  it("reports the path of a missing field", () => {
    const broken = structuredClone(raw) as Record<string, unknown>;
    const highlights = broken.matchHighlights as Array<Record<string, unknown>>;
    delete highlights[1]!.name;
    expect(() => parseContent(broken)).toThrow(ContentError);
    expect(() => parseContent(broken)).toThrow(/matchHighlights\.1\.name/);
  });

  it("rejects a malformed month", () => {
    const broken = structuredClone(raw) as { player: { proSince: string } };
    broken.player.proSince = "July 2024";
    expect(() => parseContent(broken)).toThrow(/player\.proSince/);
  });

  it("rejects an unknown skill level", () => {
    const broken = structuredClone(raw) as {
      playerAttributes: { groups: Array<{ skills: unknown[][] }> };
    };
    broken.playerAttributes.groups[0]!.skills[0] = ["Java", "pro"];
    expect(() => parseContent(broken)).toThrow(/playerAttributes\.groups\.0\.skills\.0/);
  });

  it("never allows a resume PDF path that is not public", () => {
    const broken = structuredClone(raw) as { player: { resumePdf: string | null } };
    broken.player.resumePdf = "assets/Yash-Sarda-Resume.pdf";
    expect(() => parseContent(broken)).toThrow(/player\.resumePdf/);
  });
});
```
Run: `pnpm test src/content/schema.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 4: Implement the schema**

`src/content/schema.ts`:
```ts
import { z } from "zod";

const YearMonth = z.string().regex(/^\d{4}-(0[1-9]|1[0-2])$/, "Expected YYYY-MM");
const Url = z.url();
const Link = z.object({ label: z.string().min(1), href: z.string().min(1) });

export const SkillLevelSchema = z.enum(["shipped", "built", "kit"]);
const Skill = z.union([
  z.tuple([z.string().min(1), SkillLevelSchema]),
  z.tuple([z.string().min(1), SkillLevelSchema, z.string().min(1)]),
]);

export const ContentSchema = z.object({
  player: z.object({
    name: z.string().min(1),
    title: z.string().min(1),
    tagline: z.string().min(1),
    summary: z.string().min(1),
    cardBio: z.string().min(1),
    location: z.string().min(1),
    currentClub: z.string().min(1),
    proSince: YearMonth,
    contact: z.object({
      email: z.email(),
      linkedin: Url,
      github: Url,
      leetcode: Url,
      codeforces: Url,
      codechef: Url,
    }),
    // Only a public file under /public may be linked (the original PDF contains a phone number).
    resumePdf: z
      .string()
      .regex(/^\/[\w./-]+\.pdf$/, "Must be a public path like /Yash-Sarda-Resume-public.pdf")
      .nullable(),
    cardStats: z.array(z.object({ label: z.string().min(1), value: z.string().min(1) })).length(6),
  }),
  careerStats: z
    .array(
      z.object({
        innings: z.string().regex(/^\d{2}$/),
        status: z.enum(["NOT OUT", "DEBUT"]),
        team: z.string().min(1),
        role: z.string().min(1),
        location: z.string().min(1),
        start: YearMonth,
        end: YearMonth.nullable(),
        ballByBall: z.array(z.string().min(1)).min(1),
        stack: z.array(z.string().min(1)).min(1),
        scoutLine: z.string().min(1),
      }),
    )
    .min(1),
  matchHighlights: z
    .array(
      z.object({
        round: z.enum(["THE FINAL", "SEMI-FINAL", "QUARTER-FINAL"]),
        name: z.string().min(1),
        kind: z.string().min(1),
        line: z.string().min(1),
        serve: z.string().min(1),
        rally: z.string().min(1),
        winner: z.string().min(1),
        stack: z.array(z.string().min(1)).min(1),
        media: z.string().nullable(),
        facts: z.array(z.object({ k: z.string().min(1), v: z.string().min(1) })).min(1),
        scoutLine: z.string().min(1),
      }),
    )
    .length(3),
  playerAttributes: z.object({
    levels: z.record(SkillLevelSchema, z.string().min(1)),
    groups: z
      .array(
        z.object({
          name: z.string().min(1),
          shot: z.string().min(1),
          note: z.string().min(1),
          skills: z.array(Skill).min(1),
        }),
      )
      .length(4),
    languages: z.array(z.string().min(1)),
    kitBag: z.array(z.string().min(1)),
  }),
  trophyRoom: z
    .array(
      z.object({
        type: z.enum(["cup", "medal", "plaque", "pennant", "round", "locked"]),
        title: z.string().min(1),
        sub: z.string().min(1),
        description: z.string().min(1),
        links: z.array(Link),
        draftCopy: z.boolean(),
      }),
    )
    .length(6),
  trainingAcademy: z.object({
    school: z.string().min(1),
    shortName: z.string().min(1),
    city: z.string().min(1),
    degree: z.string().min(1),
    start: YearMonth,
    end: YearMonth,
    cgpa: z.string().min(1),
    honours: z.string().min(1),
    extras: z.array(z.string().min(1)),
  }),
  commentary: z.record(z.string(), z.array(z.string().min(1)).min(1)),
});

export type Content = z.infer<typeof ContentSchema>;
export type SkillLevel = z.infer<typeof SkillLevelSchema>;

export class ContentError extends Error {
  override name = "ContentError";
}

/** Validate raw content. Throws ContentError listing every bad field path (e.g. "matchHighlights.1.name"). */
export function parseContent(raw: unknown): Content {
  const result = ContentSchema.safeParse(raw);
  if (result.success) return result.data;
  const lines = result.error.issues.map((issue) => `  • ${issue.path.join(".")}: ${issue.message}`);
  throw new ContentError(`content.json is invalid:\n${lines.join("\n")}`);
}
```
Run the schema tests. Expected: 5 passed. If "accepts the real content file" fails, the message names the field. Fix `content.json` (Step 2), never loosen the schema.

- [ ] **Step 5: Write the failing formatter tests**

`src/content/format.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import { experienceSince, formatMonth, formatSpan, formatYearSpan, monthsBetween } from "./format";

describe("formatters", () => {
  it("formats a year-month", () => {
    expect(formatMonth("2024-07")).toBe("Jul 2024");
    expect(formatMonth("2023-12")).toBe("Dec 2023");
  });

  it("formats an ongoing span", () => {
    expect(formatSpan("2024-07", null)).toBe("Jul 2024 – now");
  });

  it("collapses the year inside a same-year span", () => {
    expect(formatSpan("2023-06", "2023-07")).toBe("Jun – Jul 2023");
  });

  it("keeps both years when a span crosses a year", () => {
    expect(formatSpan("2023-12", "2024-01")).toBe("Dec 2023 – Jan 2024");
  });

  it("formats a single-month span without repeating", () => {
    expect(formatSpan("2023-06", "2023-06")).toBe("Jun 2023");
  });

  it("formats a year span", () => {
    expect(formatYearSpan("2020-07", "2024-06")).toBe("2020 – 2024");
  });

  it("builds the since-label in caps", () => {
    expect(experienceSince("2024-07")).toBe("SINCE JUL 2024");
  });

  it("counts whole months, never negative", () => {
    expect(monthsBetween("2024-07", new Date(2026, 9, 3))).toBe(27);
    expect(monthsBetween("2024-07", new Date(2024, 6, 1))).toBe(0);
    expect(monthsBetween("2030-01", new Date(2026, 9, 3))).toBe(0);
  });

  it("throws on malformed input", () => {
    expect(() => formatMonth("2024-7")).toThrow(/YYYY-MM/);
  });
});
```
Run: `pnpm test src/content/format.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 6: Implement formatters**

`src/content/format.ts`:
```ts
const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

function parseYm(ym: string): { year: number; month: number } {
  const match = /^(\d{4})-(0[1-9]|1[0-2])$/.exec(ym);
  if (!match) throw new Error(`Expected YYYY-MM, got "${ym}"`);
  return { year: Number(match[1]), month: Number(match[2]) };
}

/** "2024-07" → "Jul 2024" */
export function formatMonth(ym: string): string {
  const { year, month } = parseYm(ym);
  return `${MONTHS[month - 1]} ${year}`;
}

/** "2024-07", null → "Jul 2024 – now"; same year → "Jun – Jul 2023". */
export function formatSpan(start: string, end: string | null): string {
  if (end === null) return `${formatMonth(start)} – now`;
  if (start === end) return formatMonth(start);
  const a = parseYm(start);
  const b = parseYm(end);
  if (a.year === b.year) return `${MONTHS[a.month - 1]} – ${formatMonth(end)}`;
  return `${formatMonth(start)} – ${formatMonth(end)}`;
}

/** "2020-07", "2024-06" → "2020 – 2024" */
export function formatYearSpan(start: string, end: string): string {
  return `${parseYm(start).year} – ${parseYm(end).year}`;
}

/** "2024-07" → "SINCE JUL 2024" (never goes stale, spec §7 content rules). */
export function experienceSince(ym: string): string {
  return `SINCE ${formatMonth(ym).toUpperCase()}`;
}

/** Whole months from startYm to now; 0 if now is before start. */
export function monthsBetween(startYm: string, now: Date): number {
  const { year, month } = parseYm(startYm);
  const months = (now.getFullYear() - year) * 12 + (now.getMonth() + 1 - month);
  return Math.max(0, months);
}
```
Run the formatter tests. Expected: 9 passed.

- [ ] **Step 7: Write the failing selector tests**

`src/content/selectors.test.ts`:
```ts
import { describe, expect, it } from "vitest";
import raw from "./content.json";
import { parseContent } from "./schema";
import {
  getAttributeGroups,
  getCareerRows,
  getHighlights,
  getInningsReveals,
  getResumeAction,
  getTrophies,
} from "./selectors";

const c = parseContent(raw);

describe("selectors", () => {
  it("career rows carry formatted spans and current flag", () => {
    const rows = getCareerRows(c);
    expect(rows).toHaveLength(2);
    expect(rows[0]).toMatchObject({ innings: "01", status: "NOT OUT", span: "Jul 2024 – now", isCurrent: true });
    expect(rows[1]).toMatchObject({ innings: "02", status: "DEBUT", span: "Jun – Jul 2023", isCurrent: false });
  });

  it("innings reveals add the academy as innings 03", () => {
    const reveals = getInningsReveals(c);
    expect(reveals.map((r) => r.status)).toEqual(["NOT OUT", "DEBUT", "ACADEMY"]);
    expect(reveals[2]).toEqual({
      n: "03",
      status: "ACADEMY",
      team: "PICT, Pune",
      role: "B.Tech, Information Technology",
      span: "2020 – 2024",
    });
  });

  it("highlights come in tournament order QF → SF → FINAL", () => {
    expect(getHighlights(c).map((h) => h.roundShort)).toEqual(["QF", "SF", "F"]);
  });

  it("attribute skills map levels to evidence segments and labels", () => {
    const groups = getAttributeGroups(c);
    expect(groups.map((g) => g.name)).toEqual(["Backend", "Frontend", "Data", "Craft"]);
    const backend = groups[0]!;
    expect(backend.skills[0]).toEqual({ name: "Java", level: "shipped", segments: 9, tierLabel: "SHIPPED" });
    expect(backend.skills[2]).toEqual({ name: "JUnit", level: "shipped", segments: 9, tierLabel: "75+ TESTS" });
    expect(backend.skills[3]).toMatchObject({ level: "kit", segments: 5, tierLabel: "KIT BAG" });
    expect(groups[1]!.skills[2]).toMatchObject({ level: "built", segments: 7, tierLabel: "BUILT" });
  });

  it("trophies mark only the hidden one as locked", () => {
    const trophies = getTrophies(c);
    expect(trophies).toHaveLength(6);
    expect(trophies.filter((t) => t.locked).map((t) => t.title)).toEqual(["Giant Killer"]);
  });

  it("resume falls back to a request email while no public PDF exists", () => {
    const action = getResumeAction(c);
    expect(action.kind).toBe("request");
    expect(action.href).toMatch(/^mailto:yashsarda2002@gmail\.com\?subject=/);
  });

  it("resume links the public PDF once one is set", () => {
    const withPdf = parseContent({
      ...raw,
      player: { ...raw.player, resumePdf: "/Yash-Sarda-Resume-public.pdf" },
    });
    expect(getResumeAction(withPdf)).toEqual({ kind: "pdf", href: "/Yash-Sarda-Resume-public.pdf" });
  });
});
```
Run: `pnpm test src/content/selectors.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 8: Implement selectors, UI copy and the barrel**

`src/content/selectors.ts`:
```ts
import { formatSpan, formatYearSpan } from "./format";
import type { Content, SkillLevel } from "./schema";

export interface CareerRow {
  innings: string;
  status: "NOT OUT" | "DEBUT";
  team: string;
  role: string;
  location: string;
  span: string;
  isCurrent: boolean;
  ballByBall: string[];
  stack: string[];
  scoutLine: string;
}

export interface InningsReveal {
  n: string;
  status: "NOT OUT" | "DEBUT" | "ACADEMY";
  team: string;
  role: string;
  span: string;
}

export type RoundShort = "QF" | "SF" | "F";
export type Highlight = Content["matchHighlights"][number] & { roundShort: RoundShort };

export interface SkillView {
  name: string;
  level: SkillLevel;
  segments: number;
  tierLabel: string;
}
export interface AttributeGroup {
  name: string;
  shot: string;
  note: string;
  skills: SkillView[];
}

export type Trophy = Content["trophyRoom"][number] & { locked: boolean };

export type ResumeAction = { kind: "pdf"; href: string } | { kind: "request"; href: string };

const ROUND_ORDER: Record<Highlight["round"], { order: number; short: RoundShort }> = {
  "QUARTER-FINAL": { order: 0, short: "QF" },
  "SEMI-FINAL": { order: 1, short: "SF" },
  "THE FINAL": { order: 2, short: "F" },
};

/** Evidence levels (spec §7): shipped 9/10, built 7/10, kit 5/10. */
export const LEVEL_SEGMENTS: Record<SkillLevel, number> = { shipped: 9, built: 7, kit: 5 };
export const LEVEL_LABEL: Record<SkillLevel, string> = { shipped: "SHIPPED", built: "BUILT", kit: "KIT BAG" };

export function getCareerRows(c: Content): CareerRow[] {
  return c.careerStats.map((row) => ({
    innings: row.innings,
    status: row.status,
    team: row.team,
    role: row.role,
    location: row.location,
    span: formatSpan(row.start, row.end),
    isCurrent: row.end === null,
    ballByBall: row.ballByBall,
    stack: row.stack,
    scoutLine: row.scoutLine,
  }));
}

export function getInningsReveals(c: Content): InningsReveal[] {
  const careers: InningsReveal[] = c.careerStats.map((row) => ({
    n: row.innings,
    status: row.status,
    team: row.team,
    role: row.role,
    span: formatSpan(row.start, row.end),
  }));
  const a = c.trainingAcademy;
  return [
    ...careers,
    {
      n: String(careers.length + 1).padStart(2, "0"),
      status: "ACADEMY",
      team: `${a.shortName}, ${a.city}`,
      role: a.degree,
      span: formatYearSpan(a.start, a.end),
    },
  ];
}

export function getHighlights(c: Content): Highlight[] {
  return [...c.matchHighlights]
    .sort((x, y) => ROUND_ORDER[x.round].order - ROUND_ORDER[y.round].order)
    .map((h) => ({ ...h, roundShort: ROUND_ORDER[h.round].short }));
}

export function getAttributeGroups(c: Content): AttributeGroup[] {
  return c.playerAttributes.groups.map((g) => ({
    name: g.name,
    shot: g.shot,
    note: g.note,
    skills: g.skills.map(([name, level, tag]) => ({
      name,
      level,
      segments: LEVEL_SEGMENTS[level],
      tierLabel: tag ? tag.toUpperCase() : LEVEL_LABEL[level],
    })),
  }));
}

export function getTrophies(c: Content): Trophy[] {
  return c.trophyRoom.map((t) => ({ ...t, locked: t.type === "locked" }));
}

export function getResumeAction(c: Content): ResumeAction {
  if (c.player.resumePdf) return { kind: "pdf", href: c.player.resumePdf };
  const subject = encodeURIComponent(`Resume request — ${c.player.name}`);
  return { kind: "request", href: `mailto:${c.player.contact.email}?subject=${subject}` };
}
```

`src/content/ui-copy.ts` (grows phase by phase; each phase adds its screen's strings from audit §7.1):
```ts
/** Interface copy that is not resume data (spec §6). Screens never hard-code strings. */
export const ui = {
  brand: { mark: "YS", wordmark: "THE ARENA" },
  hud: {
    quickView: "QUICK VIEW",
    skipIntro: "SKIP INTRO",
    replay: "REPLAY",
    rematch: "REMATCH",
    crowdOn: "CROWD ON",
    soundOff: "SOUND OFF",
  },
  record: { career: "RECORD 99 – 1", yours: "YOUR RECORD" },
} as const;

export type UiCopy = typeof ui;
```

`src/content/index.ts`:
```ts
import raw from "./content.json";
import { parseContent } from "./schema";

/** Validated content. Importing this module throws (and fails the build) if content.json is invalid. */
export const content = parseContent(raw);

export { ContentError, parseContent } from "./schema";
export type { Content, SkillLevel } from "./schema";
export * from "./format";
export * from "./selectors";
export { ui } from "./ui-copy";
export type { UiCopy } from "./ui-copy";
```

Selectors take `Content` explicitly so tests can pass fixtures. Screens call e.g. `getCareerRows(content)`.

- [ ] **Step 9: Run all content tests**

Run: `pnpm test src/content`
Expected: all pass (schema 5, format 9, selectors 7).

- [ ] **Step 10: Commit**

```bash
pnpm format
git add -A
git commit -m "feat: add validated content layer with formatters and selectors

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 8: Handoff import and artboard reference renderer

**Files:**
- Create: `design/handoff/**` (copied), `tools/render-artboards/runtime.js`, `tools/render-artboards/runtime.test.ts`, `tools/render-artboards/render.mjs`
- Modify: `package.json` (script `references`)

**Interfaces:**
- Consumes: Task 4 (`@playwright/test` chromium), Task 5 (fontsource packages).
- Produces: `pnpm references [ArtboardName …]` writes `design/references/<Artboard>@<w>x<h>.png` for every board in `design/handoff/design-source/canvas.json`, e.g. `Main@1440x900.png` and `Mobile-Landing@390x844.png`. Browser global `window.__dcTemplate = { resolvePath, interpolate, renderTemplate, DCLogic, boot }`.

**Why this exists (plain words):** the designs were made in a canvas tool whose "player" script (`support.js`) isn't in the handoff, so the files can't be opened as-is. We write a tiny stand-in player, open each design in a robot browser, and save a screenshot. Those screenshots are the answer key for every screen we build.

- [ ] **Step 1: Copy the handoff (without the PDF)**

```bash
mkdir -p design/handoff
rsync -a --exclude '.DS_Store' --exclude 'Yash-Sarda-Resume.pdf' temp_handoff/yash-sarda-arena-handoff/ design/handoff/
test ! -e design/handoff/assets/Yash-Sarda-Resume.pdf && echo "PDF_EXCLUDED"
ls design/handoff/design-source | wc -l
```
Expected: `PDF_EXCLUDED`; 24 files (23 artboards + canvas.json).

- [ ] **Step 2: Write the failing runtime tests**

`tools/render-artboards/runtime.test.ts`:
```ts
import { readFileSync } from "node:fs";
import { join } from "node:path";
import { beforeAll, describe, expect, it } from "vitest";

interface DcTemplate {
  resolvePath(path: string, scope: Record<string, unknown>): unknown;
  interpolate(text: string, scope: Record<string, unknown>): string;
  renderTemplate(root: Element, scope: Record<string, unknown>): void;
  boot(): void;
}
declare global {
  interface Window {
    __dcTemplate: DcTemplate;
  }
}

beforeAll(() => {
  const src = readFileSync(join(process.cwd(), "tools/render-artboards/runtime.js"), "utf8");
  new Function(src)();
});

function host(html: string): HTMLElement {
  const el = document.createElement("div");
  el.innerHTML = html;
  return el;
}

describe("artboard runtime", () => {
  it("resolves dotted paths", () => {
    expect(window.__dcTemplate.resolvePath("b.bg", { b: { bg: "#000" } })).toBe("#000");
    expect(window.__dcTemplate.resolvePath("missing.x", {})).toBeUndefined();
  });

  it("interpolates text and attributes, dropping event handlers", () => {
    const el = host('<span style="color:{{c}}" onclick="{{go}}">{{label}}</span>');
    window.__dcTemplate.renderTemplate(el, { c: "red", label: "FOUR.", go: () => {} });
    const span = el.querySelector("span")!;
    expect(span.textContent).toBe("FOUR.");
    expect(span.getAttribute("style")).toBe("color:red");
    expect(span.hasAttribute("onclick")).toBe(false);
  });

  it("repeats sc-for children with the alias in scope", () => {
    const el = host('<sc-for list="{{balls}}" as="b"><i>{{b.label}}</i></sc-for>');
    window.__dcTemplate.renderTemplate(el, { balls: [{ label: "1" }, { label: "2" }, { label: "3" }] });
    expect(Array.from(el.querySelectorAll("i")).map((i) => i.textContent)).toEqual(["1", "2", "3"]);
    expect(el.querySelector("sc-for")).toBeNull();
  });

  it("uses hint-placeholder-count when the list is undefined", () => {
    const el = host('<sc-for list="{{nothing}}" as="x" hint-placeholder-count="2"><b>slot</b></sc-for>');
    window.__dcTemplate.renderTemplate(el, {});
    expect(el.querySelectorAll("b")).toHaveLength(2);
  });

  it("keeps or removes sc-if, falling back to the placeholder value", () => {
    const el = host(
      '<sc-if value="{{yes}}"><p>a</p></sc-if><sc-if value="{{no}}"><p>b</p></sc-if>' +
        '<sc-if value="{{unknown}}" hint-placeholder-val="{{true}}"><p>c</p></sc-if>',
    );
    window.__dcTemplate.renderTemplate(el, { yes: true, no: false });
    expect(Array.from(el.querySelectorAll("p")).map((p) => p.textContent)).toEqual(["a", "c"]);
  });

  it("boots a full artboard: runs DCLogic, hoists helmet, marks ready", () => {
    document.head.innerHTML = "";
    document.body.innerHTML =
      '<x-dc><helmet><style id="s">.d{}</style></helmet><div id="out">{{score}}</div></x-dc>' +
      '<script type="text/x-dc" data-props="{}">class Component extends DCLogic { renderVals() { return { score: "14*" }; } }</script>';
    window.__dcTemplate.boot();
    expect(document.getElementById("out")!.textContent).toBe("14*");
    expect(document.head.querySelector("#s")).not.toBeNull();
    expect(document.querySelector("x-dc")).toBeNull();
    expect(document.documentElement.getAttribute("data-dc-ready")).toBe("true");
  });
});
```
Run: `pnpm test tools/render-artboards`. Expected: FAIL, ENOENT for `runtime.js`.

- [ ] **Step 3: Implement the runtime (classic browser script, no build step)**

`tools/render-artboards/runtime.js`:
```js
/* Stand-in for the canvas runtime (support.js) that is missing from the handoff.
   Evaluates an artboard's DCLogic.renderVals() and fills its {{…}}, <sc-for>, <sc-if> template. */
(function () {
  "use strict";

  var EXPR = /\{\{\s*([^}]+?)\s*\}\}/g;

  function resolvePath(path, scope) {
    return path
      .trim()
      .split(".")
      .reduce(function (acc, key) {
        return acc == null ? undefined : acc[key];
      }, scope);
  }

  function interpolate(text, scope) {
    return text.replace(EXPR, function (_, p) {
      var v = resolvePath(p, scope);
      return v == null ? "" : String(v);
    });
  }

  function exprOf(attr) {
    if (attr == null) return null;
    var m = /^\s*\{\{\s*([^}]+?)\s*\}\}\s*$/.exec(attr);
    return m ? m[1] : null;
  }

  function literal(attr) {
    var e = exprOf(attr);
    if (e === null) return undefined;
    if (e === "true") return true;
    if (e === "false") return false;
    if (/^-?\d+(\.\d+)?$/.test(e)) return Number(e);
    return undefined;
  }

  function renderChildren(parent, scope) {
    Array.prototype.slice.call(parent.childNodes).forEach(function (n) {
      renderNode(n, scope);
    });
  }

  function expand(el, scope) {
    var holder = el.ownerDocument.createElement("div");
    Array.prototype.slice.call(el.childNodes).forEach(function (c) {
      holder.appendChild(c.cloneNode(true));
    });
    renderChildren(holder, scope);
    return Array.prototype.slice.call(holder.childNodes);
  }

  function renderNode(node, scope) {
    if (node.nodeType === 3) {
      node.textContent = interpolate(node.textContent || "", scope);
      return;
    }
    if (node.nodeType !== 1) return;
    var el = node;
    var tag = el.tagName.toLowerCase();

    if (tag === "sc-for") {
      var listExpr = exprOf(el.getAttribute("list"));
      var as = el.getAttribute("as") || "item";
      var list = listExpr ? resolvePath(listExpr, scope) : undefined;
      if (!Array.isArray(list)) {
        var count = Number(el.getAttribute("hint-placeholder-count") || 0);
        list = Array.apply(null, Array(count)).map(function () {
          return {};
        });
      }
      var out = [];
      list.forEach(function (item) {
        var child = Object.assign({}, scope);
        child[as] = item;
        out = out.concat(expand(el, child));
      });
      el.replaceWith.apply(el, out);
      return;
    }

    if (tag === "sc-if") {
      var e = exprOf(el.getAttribute("value"));
      var v = e ? resolvePath(e, scope) : undefined;
      if (v === undefined) v = literal(el.getAttribute("hint-placeholder-val"));
      if (v) el.replaceWith.apply(el, expand(el, scope));
      else el.remove();
      return;
    }

    Array.prototype.slice.call(el.attributes).forEach(function (a) {
      if (a.value.indexOf("{{") === -1) return;
      if (/^on/i.test(a.name)) el.removeAttribute(a.name);
      else el.setAttribute(a.name, interpolate(a.value, scope));
    });
    renderChildren(el, scope);
  }

  function renderTemplate(root, scope) {
    renderChildren(root, scope);
  }

  function DCLogic(props) {
    this.props = props || {};
    this.state = {};
  }
  DCLogic.prototype.setState = function (patch) {
    var next = typeof patch === "function" ? patch(this.state) : patch;
    this.state = Object.assign({}, this.state, next);
  };

  function boot() {
    var host = document.querySelector("x-dc");
    if (!host) return;
    var scriptEl = document.querySelector('script[type="text/x-dc"]');
    var vals = {};
    if (scriptEl) {
      var Component = new Function("DCLogic", scriptEl.textContent + "\n;return Component;")(DCLogic);
      var props = JSON.parse(scriptEl.getAttribute("data-props") || "{}");
      var inst = new Component(props);
      if (typeof inst.componentDidMount === "function") {
        try {
          inst.componentDidMount();
        } catch (err) {
          console.warn("componentDidMount failed", err);
        }
      }
      vals = typeof inst.renderVals === "function" ? inst.renderVals() : {};
    }
    var helmet = host.querySelector("helmet");
    if (helmet) {
      Array.prototype.slice.call(helmet.children).forEach(function (c) {
        document.head.appendChild(c);
      });
      helmet.remove();
    }
    renderTemplate(host, vals);
    host.replaceWith.apply(host, Array.prototype.slice.call(host.childNodes));
    document.documentElement.setAttribute("data-dc-ready", "true");
  }

  window.__dcTemplate = {
    resolvePath: resolvePath,
    interpolate: interpolate,
    renderTemplate: renderTemplate,
    DCLogic: DCLogic,
    boot: boot,
  };

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", function () {
      if (document.querySelector("x-dc")) boot();
    });
  } else if (document.querySelector("x-dc")) {
    boot();
  }
})();
```
Run: `pnpm test tools/render-artboards`. Expected: 6 passed. (The class body in DCLogic scripts uses `class Component extends DCLogic`; `DCLogic` is a constructor function, which ES classes can extend.)

- [ ] **Step 4: Write the renderer**

`tools/render-artboards/render.mjs`:
```js
#!/usr/bin/env node
// Renders every handoff artboard to a PNG reference (spec §9.3).
// Usage: pnpm references            → all boards
//        pnpm references Main Hub   → only these
import { createServer } from "node:http";
import { existsSync } from "node:fs";
import { mkdir, readFile } from "node:fs/promises";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { chromium } from "@playwright/test";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "../..");
const SOURCE = join(ROOT, "design/handoff/design-source");
const ASSETS = join(ROOT, "design/handoff/assets");
const OUT = join(ROOT, "design/references");
const RUNTIME = join(ROOT, "tools/render-artboards/runtime.js");

// Canvas blob IDs → handoff assets (audit §10 #5). The resume PDF blob is deliberately not served.
const BLOBS = {
  ce44ebfed8ad9979086b96c681c1f133: "character-rig/turn_0.webp",
  ec1dd1224b94231a919a24552cd472bc: "character-rig/turn_1.webp",
  "830b24f7277c2c75359b074fc3c52669": "character-rig/turn_2.webp",
  f8a90aea8f1ad9cd7e8273aa370812df: "character-rig/rest.webp",
};

// Boards driven by JS timelines need time to reach their final frame.
const SETTLE_MS = { "Intro.dc.html": 7000 };

const FONTS = [
  ["Big Shoulders Display", "big-shoulders-display", [700, 800, 900], ["normal"]],
  ["Archivo", "archivo", [400, 500, 600, 700], ["normal", "italic"]],
  ["JetBrains Mono", "jetbrains-mono", [400, 700], ["normal"]],
];

const TYPES = {
  ".html": "text/html; charset=utf-8",
  ".js": "text/javascript; charset=utf-8",
  ".json": "application/json",
  ".webp": "image/webp",
  ".png": "image/png",
  ".woff2": "font/woff2",
};

// Force every CSS animation/transition to its end state.
const FREEZE =
  "*,*::before,*::after{animation-delay:0s!important;animation-duration:1ms!important;" +
  "animation-iteration-count:1!important;transition:none!important}";

function fontCss(origin) {
  const faces = [];
  for (const [family, pkg, weights, styles] of FONTS) {
    for (const weight of weights) {
      for (const style of styles) {
        if (style === "italic" && weight > 500) continue;
        faces.push(
          `@font-face{font-family:'${family}';font-style:${style};font-weight:${weight};font-display:block;` +
            `src:url(${origin}/__fonts/${pkg}/files/${pkg}-latin-${weight}-${style}.woff2) format('woff2');}`,
        );
      }
    }
  }
  return faces.join("\n");
}

function fileFor(pathname) {
  if (pathname === "/support.js") return RUNTIME;
  if (pathname.startsWith("/_blob/")) {
    const asset = BLOBS[pathname.slice("/_blob/".length)];
    return asset ? join(ASSETS, asset) : null;
  }
  if (pathname.startsWith("/__fonts/")) {
    const [pkg, ...rest] = pathname.slice("/__fonts/".length).split("/");
    return join(ROOT, "node_modules/@fontsource", pkg, ...rest);
  }
  return join(SOURCE, decodeURIComponent(pathname));
}

function startServer() {
  return new Promise((resolveServer) => {
    const server = createServer(async (req, res) => {
      const file = fileFor(new URL(req.url ?? "/", "http://x").pathname);
      if (!file || !file.startsWith(ROOT) || !existsSync(file)) {
        res.writeHead(404);
        res.end();
        return;
      }
      res.writeHead(200, { "content-type": TYPES[extname(file)] ?? "application/octet-stream" });
      res.end(await readFile(file));
    });
    server.listen(0, "127.0.0.1", () => resolveServer(server));
  });
}

const canvas = JSON.parse(await readFile(join(SOURCE, "canvas.json"), "utf8"));
const only = process.argv.slice(2);
await mkdir(OUT, { recursive: true });
const server = await startServer();
const origin = `http://127.0.0.1:${server.address().port}`;
const browser = await chromium.launch();
let failures = 0;

for (const [file, board] of Object.entries(canvas.boards)) {
  const name = file.replace(".dc.html", "");
  if (only.length > 0 && !only.includes(name)) continue;
  const page = await browser.newPage({
    viewport: { width: board.w, height: board.h },
    deviceScaleFactor: 1,
    reducedMotion: "no-preference",
  });
  await page.route("https://fonts.googleapis.com/**", (route) =>
    route.fulfill({ contentType: "text/css", body: fontCss(origin) }),
  );
  await page.route("https://fonts.gstatic.com/**", (route) => route.abort());
  try {
    await page.goto(`${origin}/${file}`, { waitUntil: "load" });
    await page.waitForSelector("html[data-dc-ready]", { timeout: 10_000 });
    await page.addStyleTag({ content: FREEZE });
    await page.evaluate(() => document.fonts.ready);
    await page.waitForTimeout(SETTLE_MS[file] ?? 300);
    const out = join(OUT, `${name}@${board.w}x${board.h}.png`);
    await page.screenshot({ path: out, clip: { x: 0, y: 0, width: board.w, height: board.h } });
    console.log(`✓ ${name} → ${out}`);
  } catch (err) {
    failures += 1;
    console.error(`✗ ${name}: ${err instanceof Error ? err.message : String(err)}`);
  }
  await page.close();
}

await browser.close();
server.close();
if (failures > 0) process.exitCode = 1;
```

Add script: `"references": "node tools/render-artboards/render.mjs"`.

- [ ] **Step 5: Render and inspect**

```bash
pnpm references
ls design/references | wc -l
```
Expected: 23 `✓` lines and 23 PNGs.

Then **look at** these with the Read tool and compare them against what the artboard HTML describes: `Main@1440x900.png`, `Cricket-Play@1440x900.png`, `QuickView@1440x900.png`, `Intro@1440x900.png`, `Mobile-Landing@390x844.png`.
- Main: scoreboard "YASH SARDA / SOFTWARE ENGINEER", two skewed CTAs, the COMM bar.
- Cricket-Play: score bug "YASH | 0* | BALL 1 OF 3", three locked innings slots.
- Text must be in the condensed display font, not a fallback.

If a board renders blank or with raw `{{…}}`, write the board name and symptom into `design/references/KNOWN-ISSUES.md`. It's gitignored with the folder, so also paste it into the task report. Fix it if it's a runtime bug; leave it if the board depends on canvas features we don't emulate. Spec §9.3 allows by-eye review for those boards.

- [ ] **Step 6: Commit**

```bash
pnpm format
git add -A
git status --short | grep -i "\.pdf" && echo "STOP: a PDF is staged" || echo "no pdf staged"
git commit -m "feat: import design handoff and add artboard reference renderer

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
Expected: `no pdf staged` before the commit.

---

### Task 9: Pixel-diff helper, `pnpm verify`, and CI

**Files:**
- Create: `tests/support/visual.ts`, `tests/support/visual.test.ts`, `tests/e2e/visual-harness.spec.ts`, `.github/workflows/ci.yml`
- Modify: `package.json` (scripts `test:visual-refs`, `verify`)

**Interfaces:**
- Consumes: Task 4 (Playwright), Task 8 (`design/references/*.png`, `pnpm references`).
- Produces:
  - `expectMatchesArtboard(page: Page, artboard: string, options?: ArtboardMatchOptions): Promise<number>`. Compares a full-viewport screenshot with `design/references/<artboard>@<w>x<h>.png`. Throws if the differing-pixel ratio exceeds `maxDiffRatio` (default `0.02`), writing `test-results/visual/<artboard>@<w>x<h>.{actual,expected,diff}.png`. Returns the ratio.
  - `ArtboardMatchOptions = { maxDiffRatio?: number; mask?: Locator[]; maskRects?: Rect[]; threshold?: number }`. `mask`/`maskRects` paint the same region magenta in **both** images (used for logged deviations, spec §11).
  - `diffImages(actual: PNG, expected: PNG, rects: Rect[], threshold?: number): { ratio: number; pixels: number; diff: PNG }`.
  - `pnpm verify`: the single gate every task and phase must pass.

- [ ] **Step 1: Install**

```bash
pnpm add -D pixelmatch pngjs @types/pngjs
```
(If `pixelmatch` lacks bundled types, also `pnpm add -D @types/pixelmatch`.)

- [ ] **Step 2: Write the failing unit test**

`tests/support/visual.test.ts`:
```ts
import { PNG } from "pngjs";
import { describe, expect, it } from "vitest";
import { diffImages } from "./visual";

function solid(width: number, height: number, rgb: [number, number, number]): PNG {
  const png = new PNG({ width, height });
  for (let i = 0; i < width * height; i++) {
    png.data[i * 4] = rgb[0];
    png.data[i * 4 + 1] = rgb[1];
    png.data[i * 4 + 2] = rgb[2];
    png.data[i * 4 + 3] = 255;
  }
  return png;
}

function paintBlock(png: PNG, x0: number, y0: number, size: number, rgb: [number, number, number]) {
  for (let y = y0; y < y0 + size; y++) {
    for (let x = x0; x < x0 + size; x++) {
      const i = (y * png.width + x) * 4;
      png.data[i] = rgb[0];
      png.data[i + 1] = rgb[1];
      png.data[i + 2] = rgb[2];
    }
  }
}

describe("diffImages", () => {
  it("reports zero for identical images", () => {
    expect(diffImages(solid(100, 100, [5, 7, 10]), solid(100, 100, [5, 7, 10]), []).ratio).toBe(0);
  });

  it("reports the share of differing pixels", () => {
    const actual = solid(100, 100, [5, 7, 10]);
    paintBlock(actual, 0, 0, 10, [215, 255, 63]);
    expect(diffImages(actual, solid(100, 100, [5, 7, 10]), []).ratio).toBeCloseTo(0.01, 5);
  });

  it("ignores masked regions in both images", () => {
    const actual = solid(100, 100, [5, 7, 10]);
    paintBlock(actual, 0, 0, 10, [215, 255, 63]);
    const rects = [{ x: 0, y: 0, width: 10, height: 10 }];
    expect(diffImages(actual, solid(100, 100, [5, 7, 10]), rects).ratio).toBe(0);
  });

  it("throws on size mismatch", () => {
    expect(() => diffImages(solid(10, 10, [0, 0, 0]), solid(20, 10, [0, 0, 0]), [])).toThrow(
      /Size mismatch/,
    );
  });
});
```
Run: `pnpm test tests/support/visual.test.ts`. Expected: FAIL, module not found.

- [ ] **Step 3: Implement the helper**

`tests/support/visual.ts`:
```ts
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { join } from "node:path";
import type { Locator, Page } from "@playwright/test";
import pixelmatch from "pixelmatch";
import { PNG } from "pngjs";

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
}

export interface ArtboardMatchOptions {
  /** Largest allowed share of differing pixels (0.02 = 2%, spec §9.1). */
  maxDiffRatio?: number;
  /** Elements to exclude (logged deviations, spec §11). */
  mask?: Locator[];
  /** Raw regions to exclude, in CSS pixels. */
  maskRects?: Rect[];
  /** pixelmatch colour threshold 0–1 (default 0.1). */
  threshold?: number;
}

const REFERENCES_DIR = join(process.cwd(), "design/references");

export function referencePath(artboard: string, width: number, height: number): string {
  return join(REFERENCES_DIR, `${artboard}@${width}x${height}.png`);
}

function paintRects(png: PNG, rects: Rect[]): void {
  for (const r of rects) {
    const x0 = Math.max(0, Math.floor(r.x));
    const y0 = Math.max(0, Math.floor(r.y));
    const x1 = Math.min(png.width, Math.ceil(r.x + r.width));
    const y1 = Math.min(png.height, Math.ceil(r.y + r.height));
    for (let y = y0; y < y1; y++) {
      for (let x = x0; x < x1; x++) {
        const i = (y * png.width + x) * 4;
        png.data[i] = 255;
        png.data[i + 1] = 0;
        png.data[i + 2] = 255;
        png.data[i + 3] = 255;
      }
    }
  }
}

export function diffImages(actual: PNG, expected: PNG, rects: Rect[], threshold = 0.1) {
  if (actual.width !== expected.width || actual.height !== expected.height) {
    throw new Error(
      `Size mismatch: actual ${actual.width}x${actual.height}, reference ${expected.width}x${expected.height}`,
    );
  }
  paintRects(actual, rects);
  paintRects(expected, rects);
  const diff = new PNG({ width: actual.width, height: actual.height });
  const pixels = pixelmatch(actual.data, expected.data, diff.data, actual.width, actual.height, {
    threshold,
  });
  return { ratio: pixels / (actual.width * actual.height), pixels, diff };
}

/** Screenshot the page and compare it with the artboard reference at the same viewport size. */
export async function expectMatchesArtboard(
  page: Page,
  artboard: string,
  options: ArtboardMatchOptions = {},
): Promise<number> {
  const viewport = page.viewportSize();
  if (!viewport) throw new Error("expectMatchesArtboard needs a fixed viewport");
  const expected = PNG.sync.read(await readFile(referencePath(artboard, viewport.width, viewport.height)));
  await page.evaluate(() => document.fonts.ready);
  const actual = PNG.sync.read(await page.screenshot({ animations: "disabled", caret: "hide" }));

  const rects: Rect[] = [...(options.maskRects ?? [])];
  for (const locator of options.mask ?? []) {
    const box = await locator.boundingBox();
    if (box) rects.push(box);
  }

  const { ratio, diff } = diffImages(actual, expected, rects, options.threshold);
  const max = options.maxDiffRatio ?? 0.02;
  if (ratio > max) {
    const dir = join(process.cwd(), "test-results/visual");
    await mkdir(dir, { recursive: true });
    const base = join(dir, `${artboard}@${viewport.width}x${viewport.height}`);
    await writeFile(`${base}.actual.png`, PNG.sync.write(actual));
    await writeFile(`${base}.expected.png`, PNG.sync.write(expected));
    await writeFile(`${base}.diff.png`, PNG.sync.write(diff));
    throw new Error(
      `${artboard}: ${(ratio * 100).toFixed(2)}% of pixels differ (limit ${(max * 100).toFixed(2)}%). ` +
        `See ${base}.diff.png`,
    );
  }
  return ratio;
}
```
Run the unit test. Expected: 4 passed.

- [ ] **Step 4: Prove the harness end to end**

`tests/e2e/visual-harness.spec.ts`:
```ts
import { readFileSync } from "node:fs";
import { expect, test } from "@playwright/test";
import { expectMatchesArtboard, referencePath } from "../support/visual";

// Which reference to use per Playwright project viewport.
const BOARD: Record<string, string> = { desktop: "Main", mobile: "Mobile-Landing" };

test("a reference matches itself", async ({ page }, testInfo) => {
  const board = BOARD[testInfo.project.name]!;
  const { width, height } = page.viewportSize()!;
  const png = readFileSync(referencePath(board, width, height)).toString("base64");
  await page.setContent(
    `<html><body style="margin:0"><img src="data:image/png;base64,${png}" style="display:block"></body></html>`,
  );
  const ratio = await expectMatchesArtboard(page, board);
  expect(ratio).toBeLessThan(0.001);
});

test("a blank page fails against a reference", async ({ page }, testInfo) => {
  const board = BOARD[testInfo.project.name]!;
  await page.setContent(`<html><body style="margin:0;background:#fff"></body></html>`);
  await expect(expectMatchesArtboard(page, board)).rejects.toThrow(/pixels differ/);
});
```
Run: `pnpm test:e2e tests/e2e/visual-harness.spec.ts`
Expected: 4 passed (2 tests × 2 projects).

- [ ] **Step 5: Add `pnpm verify`**

Add scripts:
```json
"verify": "pnpm typecheck && pnpm lint && pnpm format:check && pnpm test && pnpm references && pnpm build-storybook && pnpm test:e2e"
```
Run: `pnpm verify`
Expected: every step passes. This is the gate for every later task.

- [ ] **Step 6: CI workflow**

`.github/workflows/ci.yml`:
```yaml
name: CI
on:
  push:
    branches: ["**"]

jobs:
  verify:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v4
      - uses: actions/setup-node@v4
        with:
          node-version: 22
          cache: pnpm
      - run: pnpm install --frozen-lockfile
      - run: pnpm exec playwright install --with-deps chromium
      - run: pnpm verify
      - if: failure()
        uses: actions/upload-artifact@v4
        with:
          name: test-results
          path: |
            test-results
            playwright-report
```

- [ ] **Step 7: Commit**

```bash
pnpm format
git add -A
git commit -m "test: add artboard pixel-diff helper, verify script and CI

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Phase 0A exit checklist (orchestrator)

- [ ] `pnpm verify` green on `phase/0-foundation`.
- [ ] `git ls-files | grep -i pdf` prints nothing.
- [ ] Storybook "Foundations/Tokens" renders in Arena fonts.
- [ ] 23 artboard references render; `KNOWN-ISSUES` list (if any) reported.
- [ ] Opus review of the 0A diff (spec §4–§6, §9 compliance) passed. Then write the 0B plan.

---

## Trivia: terms used in this plan

- **Scaffold:** the bare starting skeleton of a project (config files, folders, one page) before real features.
- **Pre-render / static HTML:** building each page's HTML at build time, so it loads instantly and works with JavaScript off.
- **Lint / ESLint:** a tool that reads code and flags rule breaks (like "no raw colours here") before anything runs.
- **Barrel file (`index.ts`):** one file that re-exports a folder's pieces, so other code imports from `@/content` instead of deep paths.
- **jsdom:** a fake browser that runs inside Node, so component tests run fast without opening a real browser.
- **Playwright:** a tool that drives a real browser (Chromium) to click through pages and take screenshots in tests.
- **axe:** an accessibility checker that scans a page for problems like low contrast or missing labels.
- **Tailwind `@theme` / lockdown:** where you tell Tailwind which colours, fonts and sizes exist. We delete the defaults, so only Arena tokens can be used.
- **`@utility`:** a Tailwind v4 way to define your own class (like `type-d1`) that bundles several CSS properties.
- **Fontsource:** npm packages containing font files, so we serve fonts ourselves instead of from Google. Faster and more reliable.
- **Zod schema:** a description of what the content must look like. If `content.json` breaks it, the build fails with the exact field.
- **Selector function:** a small function that turns raw data into exactly what a screen needs (formatted, sorted, labelled).
- **Shim:** a small stand-in for missing code. Here it replaces the design tool's absent `support.js`.
- **pixelmatch:** a library that compares two images pixel by pixel and counts the differences.
- **CI workflow:** instructions for GitHub's servers to run `pnpm verify` automatically on every push.
