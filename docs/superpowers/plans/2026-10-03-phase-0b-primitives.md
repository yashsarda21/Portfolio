# Phase 0B — Primitives Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**What this plan does (plain words):** builds the smallest reusable pieces every Arena screen is made from:
- text styles
- headings
- labels
- the slanted volt button
- icons
- glass panels
- chips
- key/value lists
- progress steps
- form fields

Each piece gets a Storybook page showing every state. There's also a robot that scans every Storybook page for accessibility problems, so the catalogue doubles as a quality gate. Still no portfolio screens: those start in Phase 1, and they'll be assembled from these pieces.

**Goal:** A tested, accessible, documented primitive layer in `src/design-system/primitives/`, exported from `@/design-system`, with a Storybook accessibility gate wired into `pnpm verify`.

**Architecture:**
- Every primitive is a small React 19 function component styled only with Arena Tailwind tokens.
- Variants are declared with `cva` (literal class strings, so Tailwind's scanner generates them) and merged with `cn()`.
- Components that may render as different elements take a polymorphic `as` prop: a Button can be a `<button>`, an `<a>` or a router `Link`.
- State is exposed as `data-state` / ARIA attributes, never as visual-only booleans.
- A new Playwright project loads every built Storybook story and runs axe on it, on desktop and mobile.

**Tech Stack:** React 19, TypeScript ~5.9 strict, Tailwind v4 (locked Arena theme from 0A), class-variance-authority, Vitest + Testing Library, Storybook 10, Playwright + @axe-core/playwright.

**Spec:** `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md` (§5.3 component tiers, §5 conventions, §11.1 accessibility). Exact visual values: `docs/superpowers/specs/2026-10-03-arena-design-audit.md` §3.1–3.5. Carry-over items: `docs/superpowers/plans/phase-0-carryover.md` (0B section).

**Spec refinement made in this plan:** spec §5.3 says "`asChild` (Radix Slot) so a Button can render a router Link". This plan uses a **polymorphic `as` prop** instead (`<Button as={Link} to="/scout">`). The Button wraps its label in a counter-skewed `<span>`, and Radix Slot can't wrap a child's children. `as` keeps one component, full prop typing, and no extra dependency. `@radix-ui/react-slot` is therefore not installed.

## Global Constraints

Everything in Phase 0A's constraints still applies:
- Node ≥22.22, pnpm 12.8.1, TS ~5.9 strict, no `any`.
- Folder rules: `src/design-system` imports nothing from `content/`, `features/`, `shell/` or `app/`.
- No raw hex, `rgb()` or `cubic-bezier()` in TS.
- No arbitrary type sizes (`text-[13px]`).
- No decoration colours as text (`text-line-3` etc.).
- Breakpoints `md` 768, `lg` 1200, `xl` 1440.
- Contrast ≥4.5:1, mono ≥11px, volt focus ring, reduced motion respected.
- Commit trailer `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`.
- Git 2.15: no `git switch`/`restore`.

New for 0B:
- **Literal class strings only.** Never build a Tailwind class from a template (`` `bg-${x}` ``). Tailwind only generates classes it finds written out in full in source files. Variant maps must spell every class out (this is how the Storybook swatch bug happened in 0A).
- **No inline `style` with `var(--color-*)` or `var(--shadow-*)`.** Those variables don't exist (`@theme inline`). Use utilities. If an inline style is truly needed, use semantic vars (`--surface-*`, `--text-*`, `--accent`).
- **Hand-written vendor-prefixed CSS pairs:** the `-webkit-` line comes first.
- **Component API conventions** (spec §5.3):
  - `className` is accepted and merged last via `cn()`.
  - No outer margins: parents own spacing.
  - React 19 ref-as-prop (props typed with `ComponentPropsWithRef`).
  - Polymorphic components use the `as` prop and `PolymorphicProps`.
  - Interactive state goes through native/ARIA attributes (`aria-pressed`, `aria-invalid`, `:checked`).
- **Every primitive** ships with: a Vitest + Testing Library test file, a `*.stories.tsx` covering every variant and state, and an export from `src/design-system/index.ts`.
- Work on branch `phase/0-foundation` (already exists; continue on it).

## Review Focus

1. **Keyboard focus on skewed shapes:** tabbing to a skewed Button shows the volt ring following the parallelogram, and a focused radio shows the ring on its whole card. Tests: Task 4 `primitives.spec.ts` "button focus ring", Task 7 `primitives.spec.ts` "radio card focus ring".
2. **Button rendered as a link:** `as="a"` (or a router Link) must keep link semantics (no `type` attribute, has `href`) and the same look. Test: Task 4 `Button.test.tsx` "renders as an anchor without a type attribute".
3. **Reduced motion:** with `prefers-reduced-motion: reduce`, the pulsing CTA glow and the hover floodlight sweep must stop. Test: Task 4 `primitives.spec.ts` "reduced motion stops the CTA pulse".
4. **Form errors reach screen readers:** an invalid field sets `aria-invalid` and points `aria-describedby` at the visible error. Test: Task 7 `Field.test.tsx` "links the error message".
5. **Icon-only controls are named:** an IconButton without a `label` must not compile, and decorative icons are hidden from screen readers. Tests: Task 3 `IconButton.test.tsx` and `Icon.test.tsx`, plus the axe story gate (Task 1).

---

## File map

```
playwright.stories.config.ts                       (Task 1)
tests/stories/a11y.spec.ts                         (Task 1)  axe on every story
tests/stories/primitives.spec.ts                   (Tasks 4, 7) computed-style checks on stories
src/design-system/index.ts                         (Task 1, grows each task)
src/design-system/lib/polymorphic.ts               (Task 1)
src/design-system/lib/polymorphic.test.tsx         (Task 1)
src/design-system/tokens/motion.css                (Task 4)
src/design-system/primitives/
  Text.tsx  Text.test.tsx  Text.stories.tsx                       (Task 2) Text, Heading, MonoLabel
  icons.tsx Icon.tsx Icon.test.tsx Icon.stories.tsx               (Task 3)
  IconButton.tsx IconButton.test.tsx IconButton.stories.tsx       (Task 3)
  Button.tsx Button.test.tsx Button.stories.tsx                   (Task 4)
  Glass.tsx Glass.test.tsx Glass.stories.tsx                      (Task 5)
  Chip.tsx Chip.test.tsx Chip.stories.tsx                         (Task 5) Chip, ChipList
  KeyValueList.tsx Legend.tsx ProgressSteps.tsx                   (Task 6)
  DataDisplay.test.tsx DataDisplay.stories.tsx                    (Task 6)
  Field.tsx RadioCard.tsx Field.test.tsx Field.stories.tsx        (Task 7) TextField, TextArea, Fieldset, RadioCard
```

---

### Task 1: Storybook accessibility gate, polymorphic helper, barrel

**Files:**
- Create: `playwright.stories.config.ts`, `tests/stories/a11y.spec.ts`, `src/design-system/lib/polymorphic.ts`, `src/design-system/lib/polymorphic.test.tsx`, `src/design-system/index.ts`
- Modify: `package.json` (deps, scripts `test:stories`, `verify`), `docs/superpowers/plans/phase-0-carryover.md` (tick 0B rows this task resolves)

**Interfaces:**
- Consumes: 0A's `tests/support/a11y.ts` → `expectNoA11yViolations(page)`; `storybook-static/` from `pnpm build-storybook`.
- Produces:
  - `pnpm test:stories`: runs axe on every story in `storybook-static/index.json` at 1440×900 (`desktop`) and 390×844 (`mobile`).
  - `PolymorphicProps<T extends ElementType, Own = object>` from `@/design-system/lib/polymorphic`.
  - `@/design-system` barrel (`src/design-system/index.ts`); later tasks append exports.
  - The `class-variance-authority` dependency.

- [ ] **Step 1: Install cva and look into the peer warning (carry-over)**

```bash
pnpm add class-variance-authority
pnpm install --frozen-lockfile; echo exit=$?
pnpm peers check 2>&1 | tail -20
```
Expected: exit=0. Write the `pnpm peers check` output into your report. If the only unmet peer is `eslint-plugin-jsx-a11y` wanting ESLint ≤9, leave it (it works on ESLint 10; tracked in carry-over). If anything else is unmet, add the missing peer as a devDependency.

- [ ] **Step 2: Write the failing polymorphic test**

`src/design-system/lib/polymorphic.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import type { ElementType } from "react";
import { describe, expect, it } from "vitest";
import type { PolymorphicProps } from "./polymorphic";

type BoxProps<T extends ElementType> = PolymorphicProps<T, { tone?: "a" | "b" }>;

function Box<T extends ElementType = "div">({ as, tone, ...rest }: BoxProps<T>) {
  const Comp: ElementType = as ?? "div";
  return <Comp data-tone={tone} {...rest} />;
}

describe("PolymorphicProps", () => {
  it("renders the default element", () => {
    render(<Box>hi</Box>);
    expect(screen.getByText("hi").tagName).toBe("DIV");
  });

  it("renders the element passed in `as` with its own props", () => {
    render(
      <Box as="a" href="/scout" tone="a">
        go
      </Box>,
    );
    const link = screen.getByRole("link", { name: "go" });
    expect(link).toHaveAttribute("href", "/scout");
    expect(link).toHaveAttribute("data-tone", "a");
  });

  it("rejects props that do not belong to the element (type-level)", () => {
    // @ts-expect-error — `href` is not a valid prop on a <button>
    render(<Box as="button" href="/nope" />);
    expect(true).toBe(true);
  });
});
```
Run: `pnpm test src/design-system/lib`. Expected: FAIL, cannot find `./polymorphic`.

- [ ] **Step 3: Implement the helper**

`src/design-system/lib/polymorphic.ts`:
```ts
import type { ComponentPropsWithRef, ElementType } from "react";

/**
 * Props for a component that can render as any element via `as`.
 * Own props win over the element's native props of the same name.
 */
export type PolymorphicProps<T extends ElementType, Own = object> = Own & {
  as?: T;
} & Omit<ComponentPropsWithRef<T>, keyof Own | "as">;
```
Run the test again. Expected: 3 passed. Also run `pnpm typecheck`. The `@ts-expect-error` line must be a real error, or typecheck fails with "Unused '@ts-expect-error' directive".

- [ ] **Step 4: Create the barrel**

`src/design-system/index.ts`:
```ts
// Public API of the Arena design system. Screens import from "@/design-system" only.
export type { PolymorphicProps } from "./lib/polymorphic";
```

- [ ] **Step 5: Write the story gate config and test**

`playwright.stories.config.ts`:
```ts
import { defineConfig, devices } from "@playwright/test";

const PORT = 6007;
const strict = !!process.env.CI || process.env.VERIFY === "1";

// Runs against the static Storybook build (`pnpm build-storybook` first).
export default defineConfig({
  testDir: "tests/stories",
  outputDir: "test-results/stories",
  fullyParallel: true,
  forbidOnly: strict,
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: [["list"]],
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
    command: `sirv storybook-static --port ${PORT} --host 127.0.0.1`,
    url: `http://127.0.0.1:${PORT}`,
    reuseExistingServer: !strict,
    timeout: 60_000,
  },
});
```

`tests/stories/a11y.spec.ts`:
```ts
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { expect, test } from "@playwright/test";
import { expectNoA11yViolations } from "../support/a11y";

interface IndexEntry {
  type: "story" | "docs";
  id: string;
  title: string;
  name: string;
}

const INDEX = join(process.cwd(), "storybook-static/index.json");
if (!existsSync(INDEX)) {
  throw new Error("storybook-static/index.json not found — run `pnpm build-storybook` first.");
}
const entries = Object.values(
  (JSON.parse(readFileSync(INDEX, "utf8")) as { entries: Record<string, IndexEntry> }).entries,
).filter((e) => e.type === "story");

test("the story index is not empty", () => {
  expect(entries.length).toBeGreaterThan(0);
});

for (const story of entries) {
  test(`a11y: ${story.title} / ${story.name}`, async ({ page }) => {
    await page.goto(`/iframe.html?id=${story.id}&viewMode=story`);
    await page.locator("#storybook-root > *").first().waitFor();
    await page.evaluate(() => document.fonts.ready);
    await expectNoA11yViolations(page);
  });
}
```
(If Storybook 10's `index.json` shape differs, e.g. no `entries` key, adapt the parsing and note it. The error message for a missing file must stay.)

- [ ] **Step 6: Wire scripts**

In `package.json`:
- add `"test:stories": "playwright test -c playwright.stories.config.ts"`
- change `verify` to: `"pnpm typecheck && pnpm lint && pnpm format:check && VERIFY=1 pnpm test && pnpm references && pnpm build-storybook && VERIFY=1 pnpm test:stories && VERIFY=1 pnpm test:e2e"`

- [ ] **Step 7: Run the gate against the existing token stories**

```bash
pnpm build-storybook && pnpm test:stories
```
Expected: the index test plus 4 token stories × 2 projects pass. If axe reports a real violation in a token story (e.g. contrast of a caption), fix the story markup. Never disable axe rules. Do not change token values.

- [ ] **Step 8: Tick carry-over and commit**

In `docs/superpowers/plans/phase-0-carryover.md`, tick these 0B rows:
- "Decide and wire a Storybook a11y test runner" (append: "→ Playwright + axe over storybook-static, `pnpm test:stories`")
- "Investigate the pnpm peer-dependency WARN" (append the finding in one line)

```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "test: gate every Storybook story with axe; add polymorphic helper

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Text, Heading, MonoLabel

**Files:**
- Create: `src/design-system/primitives/Text.tsx`, `Text.test.tsx`, `Text.stories.tsx`
- Modify: `src/design-system/index.ts`

**Interfaces:**
- Consumes: `cn` from `@/lib/cn`; `PolymorphicProps`; type recipes and colour utilities from 0A.
- Produces (exported from `@/design-system`):
  - `Text<T>(props: PolymorphicProps<T, { variant?: TypeVariant; tone?: TextTone }>)`. Default element `span`, default variant `body`, no tone (inherits).
  - `Heading(props: { level: 1|2|3|4|5|6; variant?: TypeVariant; tone?: TextTone } & ComponentPropsWithRef<"h1">)`. Renders `h{level}`. Default variants: 1→`d1`, 2→`d2`, 3→`d3`, 4→`d4`, 5→`d5`, 6→`d5`. Default tone `primary`.
  - `MonoLabel<T>(props: PolymorphicProps<T, { variant?: MonoVariant; tone?: TextTone }>)`. Default `span`, variant `mono-label`, tone `label`.
  - Types `TypeVariant`, `MonoVariant`, `TextTone`; the `textVariants` cva function.

- [ ] **Step 1: Write the failing tests**

`src/design-system/primitives/Text.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Heading, MonoLabel, Text } from "./Text";

describe("Text", () => {
  it("renders a span with the body recipe by default and no tone", () => {
    render(<Text>hello</Text>);
    const el = screen.getByText("hello");
    expect(el.tagName).toBe("SPAN");
    expect(el).toHaveClass("type-body");
    expect(el.className).not.toMatch(/\btext-/);
  });

  it("applies variant, tone and element", () => {
    render(
      <Text as="p" variant="comm" tone="body">
        Still not out.
      </Text>,
    );
    const el = screen.getByText("Still not out.");
    expect(el.tagName).toBe("P");
    expect(el).toHaveClass("type-comm", "text-text-1");
  });

  it("lets className override the recipe", () => {
    render(
      <Text variant="body" className="type-caption">
        x
      </Text>,
    );
    const el = screen.getByText("x");
    expect(el).toHaveClass("type-caption");
    expect(el).not.toHaveClass("type-body");
  });
});

describe("Heading", () => {
  it.each([
    [1, "type-d1"],
    [2, "type-d2"],
    [3, "type-d3"],
    [4, "type-d4"],
    [5, "type-d5"],
    [6, "type-d5"],
  ] as const)("level %i defaults to %s in floodlight", (level, recipe) => {
    render(<Heading level={level}>Title</Heading>);
    const el = screen.getByRole("heading", { level, name: "Title" });
    expect(el.tagName).toBe(`H${level}`);
    expect(el).toHaveClass(recipe, "text-floodlight");
  });

  it("accepts a variant override", () => {
    render(
      <Heading level={1} variant="d2s">
        Hub
      </Heading>,
    );
    expect(screen.getByRole("heading", { level: 1 })).toHaveClass("type-d2s");
  });
});

describe("MonoLabel", () => {
  it("defaults to the scout-grey panel label", () => {
    render(<MonoLabel>BOWL AT ME</MonoLabel>);
    expect(screen.getByText("BOWL AT ME")).toHaveClass("type-mono-label", "text-scout");
  });

  it("supports the volt eyebrow", () => {
    render(
      <MonoLabel variant="mono-eyebrow" tone="volt">
        CONTACT
      </MonoLabel>,
    );
    expect(screen.getByText("CONTACT")).toHaveClass("type-mono-eyebrow", "text-volt");
  });
});
```
Run: `pnpm test src/design-system/primitives/Text.test.tsx`. Expected: FAIL, module not found.

- [ ] **Step 2: Implement**

`src/design-system/primitives/Text.tsx`:
```tsx
import { cva } from "class-variance-authority";
import type { ComponentPropsWithRef, ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";

// Every class is written out in full so Tailwind generates it (never build class names).
export const textVariants = cva("", {
  variants: {
    variant: {
      hero: "type-hero",
      "hero-fluid": "type-hero-fluid",
      call: "type-call",
      d1: "type-d1",
      d2: "type-d2",
      d2s: "type-d2s",
      stat: "type-stat",
      d3: "type-d3",
      d3s: "type-d3s",
      d4: "type-d4",
      d4s: "type-d4s",
      "btn-xl": "type-btn-xl",
      btn: "type-btn",
      d5: "type-d5",
      sub: "type-sub",
      "mono-lg": "type-mono-lg",
      "mono-md": "type-mono-md",
      "mono-eyebrow": "type-mono-eyebrow",
      "mono-brand": "type-mono-brand",
      "mono-label": "type-mono-label",
      "mono-tag": "type-mono-tag",
      "mono-comm": "type-mono-comm",
      "mono-xs": "type-mono-xs",
      "body-lg": "type-body-lg",
      body: "type-body",
      "body-md": "type-body-md",
      "body-sm": "type-body-sm",
      caption: "type-caption",
      comm: "type-comm",
      challenge: "type-challenge",
    },
    tone: {
      primary: "text-floodlight",
      led: "text-led",
      body: "text-text-1",
      secondary: "text-text-2",
      label: "text-scout",
      dim: "text-dim",
      volt: "text-volt",
      gold: "text-gold",
      ink: "text-volt-ink",
      "ink-2": "text-volt-ink-2",
    },
  },
  defaultVariants: { variant: "body" },
});

export type TypeVariant = NonNullable<Parameters<typeof textVariants>[0]>["variant"] & string;
export type TextTone = NonNullable<NonNullable<Parameters<typeof textVariants>[0]>["tone"]>;
export type MonoVariant = Extract<TypeVariant, `mono-${string}`>;

type TextOwnProps = { variant?: TypeVariant; tone?: TextTone };

/** Any run of text, styled by an Arena type recipe. */
export function Text<T extends ElementType = "span">({
  as,
  variant,
  tone,
  className,
  ...rest
}: PolymorphicProps<T, TextOwnProps>) {
  const Comp: ElementType = as ?? "span";
  return <Comp className={cn(textVariants({ variant, tone }), className)} {...rest} />;
}

const HEADING_DEFAULT: Record<1 | 2 | 3 | 4 | 5 | 6, TypeVariant> = {
  1: "d1",
  2: "d2",
  3: "d3",
  4: "d4",
  5: "d5",
  6: "d5",
};

type HeadingProps = {
  level: 1 | 2 | 3 | 4 | 5 | 6;
  variant?: TypeVariant;
  tone?: TextTone;
} & ComponentPropsWithRef<"h1">;

/** A real <h1>–<h6>; the look defaults by level and can be overridden. */
export function Heading({ level, variant, tone = "primary", className, ...rest }: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={cn(textVariants({ variant: variant ?? HEADING_DEFAULT[level], tone }), className)}
      {...rest}
    />
  );
}

/** The engineer's voice: uppercase mono labels, tags and eyebrows. */
export function MonoLabel<T extends ElementType = "span">({
  variant = "mono-label",
  tone = "label",
  ...rest
}: PolymorphicProps<T, { variant?: MonoVariant; tone?: TextTone }>) {
  return <Text variant={variant} tone={tone} {...(rest as PolymorphicProps<T, TextOwnProps>)} />;
}
```
Run the tests. Expected: all pass. (If TypeScript rejects the `MonoLabel` spread, keep the runtime behaviour and adjust only the cast, then note it.)

- [ ] **Step 3: Stories**

`src/design-system/primitives/Text.stories.tsx`:
```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Heading, MonoLabel, Text } from "./Text";

const meta: Meta<typeof Text> = { title: "Primitives/Text", component: Text };
export default meta;
type Story = StoryObj<typeof Text>;

export const Playground: Story = {
  args: { children: "Think you can beat me?", variant: "challenge", tone: "body" },
};

export const Tones: Story = {
  render: () => (
    <div className="flex flex-col gap-2">
      <Text tone="primary">primary — floodlight</Text>
      <Text tone="led">led — scoreboard white</Text>
      <Text tone="body">body — text-1</Text>
      <Text tone="secondary">secondary — text-2</Text>
      <Text tone="label">label — scout grey</Text>
      <Text tone="dim">dim — dimmest allowed text</Text>
      <Text tone="volt">volt — act here / you earned this</Text>
      <div className="bg-volt p-3">
        <Text tone="ink">ink — text on volt</Text> <Text tone="ink-2">ink-2</Text>
      </div>
      <div data-zone="trophy">
        <Text tone="gold">gold — trophy zone only</Text>
      </div>
    </div>
  ),
};

export const Headings: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Heading level={1}>Career stats</Heading>
      <Heading level={2}>Welcome to my arena</Heading>
      <Heading level={3}>Deutsche Bank</Heading>
      <Heading level={4}>Kudo Board</Heading>
      <Heading level={5}>Trophy room</Heading>
    </div>
  ),
};

export const MonoLabels: Story = {
  render: () => (
    <div className="flex flex-col gap-3">
      <MonoLabel>BOWL AT ME</MonoLabel>
      <MonoLabel variant="mono-eyebrow" tone="volt">
        CONTACT
      </MonoLabel>
      <MonoLabel variant="mono-brand">THE ARENA</MonoLabel>
      <MonoLabel variant="mono-tag" tone="dim">
        INNINGS 02 · LOCKED
      </MonoLabel>
      <MonoLabel variant="mono-md" tone="primary">
        QUICK VIEW
      </MonoLabel>
    </div>
  ),
};
```

- [ ] **Step 4: Export, verify, commit**

Append to `src/design-system/index.ts`:
```ts
export { Heading, MonoLabel, Text, textVariants } from "./primitives/Text";
export type { MonoVariant, TextTone, TypeVariant } from "./primitives/Text";
```
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build-storybook && pnpm test:stories
git add -A
git commit -m "feat(design-system): add Text, Heading and MonoLabel primitives

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
Expected: the story gate now includes the Primitives/Text stories, all passing.

---

### Task 3: Icon set and IconButton

**Files:**
- Create: `src/design-system/primitives/icons.tsx`, `Icon.tsx`, `Icon.test.tsx`, `Icon.stories.tsx`, `IconButton.tsx`, `IconButton.test.tsx`, `IconButton.stories.tsx`
- Modify: `src/design-system/index.ts`

**Interfaces:**
- Consumes: `cn`.
- Produces:
  - `ICONS` registry and `IconName` type from `./icons`.
  - `Icon(props: { name: IconName; size?: number; strokeWidth?: number; title?: string; className?: string })`. A 24×24 viewBox, `stroke="currentColor"`. Decorative (`aria-hidden`) unless `title` is given, then `role="img"` + `<title>`.
  - `IconButton(props: { icon: IconName; label: string; pressed?: boolean; variant?: "glass" | "outline" } & Omit<ComponentPropsWithRef<"button">, "children" | "aria-label">)`. 44×44, `type="button"`, `aria-label={label}`, `aria-pressed` when `pressed` is defined.

Icon paths are copied exactly from the artboards (audit §3 "Icons used"). `check` and `external` are derived: no artboard draws them, but Phase 2 needs them for copy-link feedback and external links.

- [ ] **Step 1: Write the failing tests**

`src/design-system/primitives/Icon.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Icon } from "./Icon";
import { ICONS } from "./icons";

describe("Icon", () => {
  it("is decorative by default", () => {
    const { container } = render(<Icon name="arrow-right" />);
    const svg = container.querySelector("svg")!;
    expect(svg).toHaveAttribute("aria-hidden", "true");
    expect(svg).toHaveAttribute("viewBox", "0 0 24 24");
    expect(svg).toHaveAttribute("stroke", "currentColor");
    expect(svg).toHaveAttribute("width", "18");
  });

  it("uses the artboard stroke width unless overridden", () => {
    const { container, rerender } = render(<Icon name="speaker" />);
    expect(container.querySelector("svg")).toHaveAttribute("stroke-width", "1.6");
    rerender(<Icon name="speaker" strokeWidth={2} />);
    expect(container.querySelector("svg")).toHaveAttribute("stroke-width", "2");
  });

  it("becomes an image with a name when given a title", () => {
    render(<Icon name="trophy" title="Trophy" />);
    expect(screen.getByRole("img", { name: "Trophy" })).toBeInTheDocument();
  });

  it("registry covers every artboard icon", () => {
    expect(Object.keys(ICONS).sort()).toEqual(
      [
        "arena",
        "arrow-right",
        "check",
        "code",
        "copy",
        "download",
        "external",
        "linkedin",
        "list",
        "mail",
        "play",
        "plus-circle",
        "speaker",
        "speaker-loud",
        "speaker-off",
        "stats",
        "terminal",
        "trophy",
      ].sort(),
    );
  });
});
```

`src/design-system/primitives/IconButton.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { IconButton } from "./IconButton";

describe("IconButton", () => {
  it("is a named 44px button", () => {
    render(<IconButton icon="speaker" label="Toggle crowd audio" />);
    const btn = screen.getByRole("button", { name: "Toggle crowd audio" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).toHaveClass("size-11");
  });

  it("exposes toggle state only when pressed is defined", () => {
    const { rerender } = render(<IconButton icon="speaker" label="Audio" />);
    expect(screen.getByRole("button")).not.toHaveAttribute("aria-pressed");
    rerender(<IconButton icon="speaker" label="Audio" pressed />);
    expect(screen.getByRole("button")).toHaveAttribute("aria-pressed", "true");
  });

  it("calls onClick", async () => {
    const onClick = vi.fn();
    render(<IconButton icon="copy" label="Copy link" onClick={onClick} />);
    await userEvent.click(screen.getByRole("button", { name: "Copy link" }));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("requires a label (type-level)", () => {
    // @ts-expect-error — label is required for icon-only controls
    render(<IconButton icon="copy" />);
    expect(true).toBe(true);
  });
});
```
Run: `pnpm test src/design-system/primitives/Icon` and `…/IconButton`. Expected: FAIL, modules not found.

- [ ] **Step 2: Implement the registry**

`src/design-system/primitives/icons.tsx`:
```tsx
import type { ReactNode } from "react";

interface IconDef {
  /** Stroke width used on the artboards. */
  sw: number;
  body: ReactNode;
}

const SPEAKER = <path d="M4 9v6h4l5 4V5L8 9H4z" />;

/** Stroke icons copied from the artboards (24×24, round caps). `check` and `external` are derived. */
export const ICONS = {
  speaker: {
    sw: 1.6,
    body: (
      <>
        {SPEAKER}
        <path d="M16.5 8.5a5 5 0 0 1 0 7" />
      </>
    ),
  },
  "speaker-loud": {
    sw: 1.6,
    body: (
      <>
        {SPEAKER}
        <path d="M16.5 8.5a5 5 0 0 1 0 7" />
        <path d="M19 6a8.5 8.5 0 0 1 0 12" />
      </>
    ),
  },
  "speaker-off": {
    sw: 1.6,
    body: (
      <>
        {SPEAKER}
        <path d="M17 9l5 6M22 9l-5 6" />
      </>
    ),
  },
  "arrow-right": { sw: 1.8, body: <path d="M5 12h14M13 6l6 6-6 6" /> },
  download: { sw: 1.8, body: <path d="M12 4v12M6 10l6 6 6-6M5 20h14" /> },
  copy: {
    sw: 1.8,
    body: (
      <>
        <rect x="8" y="8" width="12" height="12" />
        <path d="M16 8V4H4v12h4" />
      </>
    ),
  },
  mail: {
    sw: 1.6,
    body: (
      <>
        <rect x="3" y="5" width="18" height="14" />
        <path d="M3 6l9 7 9-7" />
      </>
    ),
  },
  linkedin: {
    sw: 1.6,
    body: (
      <>
        <rect x="3" y="3" width="18" height="18" />
        <path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 0 1 4 0v4M12 10v7" />
      </>
    ),
  },
  code: { sw: 1.6, body: <path d="M8 17l-5-5 5-5M16 7l5 5-5 5M14 4l-4 16" /> },
  terminal: {
    sw: 1.6,
    body: (
      <>
        <path d="M4 18l5-6-5-6" />
        <path d="M12 19h8" />
      </>
    ),
  },
  trophy: {
    sw: 1.8,
    body: (
      <>
        <path d="M7 4h10v5a5 5 0 0 1-10 0V4z" />
        <path d="M7 6H4a3 3 0 0 0 3 4M17 6h3a3 3 0 0 1-3 4M12 14v4M8 21h8" />
      </>
    ),
  },
  arena: {
    sw: 1.7,
    body: (
      <>
        <ellipse cx="12" cy="12" rx="9" ry="6" />
        <path d="M12 6v12" />
      </>
    ),
  },
  stats: { sw: 1.7, body: <path d="M4 20V10M10 20V4M16 20v-7M22 20H2" /> },
  play: {
    sw: 1.7,
    body: (
      <>
        <rect x="3" y="5" width="18" height="14" />
        <path d="M10 9l5 3-5 3z" />
      </>
    ),
  },
  list: { sw: 1.7, body: <path d="M4 7h10M4 12h16M4 17h7" /> },
  "plus-circle": {
    sw: 1.7,
    body: (
      <>
        <path d="M8 12h8M12 8v8" />
        <circle cx="12" cy="12" r="9" />
      </>
    ),
  },
  check: { sw: 1.8, body: <path d="M5 12l5 5L20 7" /> },
  external: { sw: 1.8, body: <path d="M7 17L17 7M9 7h8v8" /> },
} satisfies Record<string, IconDef>;

export type IconName = keyof typeof ICONS;
```

- [ ] **Step 3: Implement Icon and IconButton**

`src/design-system/primitives/Icon.tsx`:
```tsx
import { cn } from "@/lib/cn";
import { ICONS, type IconName } from "./icons";

interface IconProps {
  name: IconName;
  /** Rendered width/height in px (default 18). */
  size?: number;
  strokeWidth?: number;
  /** Give a title only when the icon carries meaning on its own. */
  title?: string;
  className?: string;
}

export function Icon({ name, size = 18, strokeWidth, title, className }: IconProps) {
  const def = ICONS[name];
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth={strokeWidth ?? def.sw}
      strokeLinecap="round"
      strokeLinejoin="round"
      focusable="false"
      className={cn("shrink-0", className)}
      {...(title ? { role: "img" } : { "aria-hidden": true })}
    >
      {title ? <title>{title}</title> : null}
      {def.body}
    </svg>
  );
}
```

`src/design-system/primitives/IconButton.tsx`:
```tsx
import { cva } from "class-variance-authority";
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

const iconButtonVariants = cva(
  "inline-flex size-11 cursor-pointer items-center justify-center text-floodlight transition-colors duration-(--dur-snap) ease-snap hover:text-volt",
  {
    variants: {
      variant: {
        glass: "glass hover:bg-white-a10",
        outline: "border border-line-strong hover:border-volt",
      },
    },
    defaultVariants: { variant: "glass" },
  },
);

type IconButtonProps = {
  icon: IconName;
  /** Accessible name — icon-only controls must always be named. */
  label: string;
  /** Set for toggle buttons (e.g. crowd audio); omit for plain actions. */
  pressed?: boolean;
  variant?: "glass" | "outline";
} & Omit<ComponentPropsWithRef<"button">, "children" | "aria-label" | "aria-pressed">;

export function IconButton({
  icon,
  label,
  pressed,
  variant,
  className,
  type = "button",
  ...rest
}: IconButtonProps) {
  return (
    <button
      type={type}
      aria-label={label}
      aria-pressed={pressed}
      className={cn(iconButtonVariants({ variant }), className)}
      {...rest}
    >
      <Icon name={icon} />
    </button>
  );
}
```
Run both test files. Expected: all pass.

- [ ] **Step 4: Stories**

`src/design-system/primitives/Icon.stories.tsx`:
```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Icon } from "./Icon";
import { ICONS, type IconName } from "./icons";

const meta: Meta<typeof Icon> = { title: "Primitives/Icon", component: Icon };
export default meta;

export const All: StoryObj<typeof Icon> = {
  render: () => (
    <ul className="grid grid-cols-6 gap-6">
      {(Object.keys(ICONS) as IconName[]).map((name) => (
        <li key={name} className="flex flex-col items-center gap-2 text-floodlight">
          <Icon name={name} size={24} />
          <span className="type-mono-tag text-scout">{name}</span>
        </li>
      ))}
    </ul>
  ),
};
```

`src/design-system/primitives/IconButton.stories.tsx`:
```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { IconButton } from "./IconButton";

const meta: Meta<typeof IconButton> = { title: "Primitives/IconButton", component: IconButton };
export default meta;
type Story = StoryObj<typeof IconButton>;

export const Glass: Story = { args: { icon: "speaker", label: "Toggle crowd audio" } };
export const Outline: Story = { args: { icon: "copy", label: "Copy link", variant: "outline" } };
export const PressedToggle: Story = {
  args: { icon: "speaker-loud", label: "Crowd audio", pressed: true },
};
```

- [ ] **Step 5: Export, verify, commit**

Append to `src/design-system/index.ts`:
```ts
export { Icon } from "./primitives/Icon";
export { ICONS } from "./primitives/icons";
export type { IconName } from "./primitives/icons";
export { IconButton } from "./primitives/IconButton";
```
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build-storybook && pnpm test:stories
git add -A
git commit -m "feat(design-system): add artboard icon set, Icon and IconButton

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: Button — the skewed broadcast CTA

**Files:**
- Create: `src/design-system/tokens/motion.css`, `src/design-system/primitives/Button.tsx`, `Button.test.tsx`, `Button.stories.tsx`, `tests/stories/primitives.spec.ts`
- Modify: `app/app.css` (import motion.css), `src/design-system/index.ts`

**Interfaces:**
- Consumes: `cn`, `PolymorphicProps`, `Icon`/`IconName`.
- Produces:
  - `Button<T>(props: PolymorphicProps<T, ButtonOwnProps>)` with `ButtonOwnProps`:
    - `variant?: "primary" | "secondary" | "outline" | "ghost"` (default `primary`)
    - `size?: "s" | "m" | "l" | "xl"` (default `m`)
    - `skew?: boolean | "desktop"` (default `"desktop"`: parallelogram at ≥768px, square on mobile, as the mobile artboards draw it)
    - `subLabel?: ReactNode` (second line, XL style)
    - `pulse?: boolean` (volt glow pulse, primary CTAs on Landing/Intro)
    - `iconRight?: IconName`
  - Default element `button` with `type="button"`. Any other `as` gets no `type`.
  - CSS utilities `floodlight-sweep` (hover light sweep) and `animate-cta-glow`, plus `@keyframes cta-glow` in `motion.css`.
  - `buttonVariants` cva function.

Sizes from audit §3.2 #15/#16:
- S: 52px tall, 26px side padding, `type-btn`.
- M: 62px tall, 40px side padding, `type-btn`.
- L: 74px tall, 40px side padding, `type-btn-xl`.
- XL: 310×78, two lines, `type-btn-xl` + mono sub-label.

Screens may override the type recipe through `className` (`cn` resolves the conflict).

- [ ] **Step 1: Write the failing unit tests**

`src/design-system/primitives/Button.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { Button } from "./Button";

describe("Button", () => {
  it("is a primary medium button skewed on desktop only", () => {
    render(<Button>Bowl</Button>);
    const btn = screen.getByRole("button", { name: "Bowl" });
    expect(btn).toHaveAttribute("type", "button");
    expect(btn).toHaveClass("bg-volt", "text-volt-ink", "h-15.5", "md:-skew-x-12");
    expect(screen.getByText("Bowl")).toHaveClass("md:skew-x-12");
  });

  it("renders as an anchor without a type attribute", () => {
    render(
      <Button as="a" href="/scout" variant="secondary">
        View portfolio
      </Button>,
    );
    const link = screen.getByRole("link", { name: "View portfolio" });
    expect(link).toHaveAttribute("href", "/scout");
    expect(link).not.toHaveAttribute("type");
    expect(link).toHaveClass("glass");
  });

  it("skews always or never on request", () => {
    const { rerender } = render(<Button skew>A</Button>);
    expect(screen.getByRole("button")).toHaveClass("-skew-x-12");
    rerender(<Button skew={false}>A</Button>);
    expect(screen.getByRole("button").className).not.toMatch(/skew/);
  });

  it("stacks a sub-label under the label at XL", () => {
    render(
      <Button size="xl" subLabel="INTERACTIVE · ~3 MIN">
        Enter the arena
      </Button>,
    );
    const btn = screen.getByRole("button", { name: /Enter the arena/ });
    expect(btn).toHaveClass("h-19.5", "w-77.5", "flex-col");
    expect(screen.getByText("INTERACTIVE · ~3 MIN")).toHaveClass("type-mono-tag", "text-volt-ink-2");
  });

  it("pulses only when asked", () => {
    const { rerender } = render(<Button>A</Button>);
    expect(screen.getByRole("button")).not.toHaveClass("animate-cta-glow");
    rerender(<Button pulse>A</Button>);
    expect(screen.getByRole("button")).toHaveClass("animate-cta-glow");
  });

  it("shows a trailing icon", () => {
    const { container } = render(<Button iconRight="arrow-right">Team up</Button>);
    expect(container.querySelector("svg")).toHaveAttribute("aria-hidden", "true");
  });

  it("does not fire when disabled", async () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        A
      </Button>,
    );
    await userEvent.click(screen.getByRole("button"));
    expect(onClick).not.toHaveBeenCalled();
  });
});
```
Run: `pnpm test src/design-system/primitives/Button.test.tsx`. Expected: FAIL, module not found.

- [ ] **Step 2: Motion utilities**

`src/design-system/tokens/motion.css`:
```css
/* Motion presets owned by primitives. Phase 0D adds the rest (fade, rise, pop…). */

@keyframes cta-glow {
  0%,
  100% {
    box-shadow: 0 0 30px rgb(var(--rgb-volt) / 0.25);
  }
  50% {
    box-shadow: 0 0 60px rgb(var(--rgb-volt) / 0.55);
  }
}

@utility animate-cta-glow {
  animation: cta-glow 2.4s var(--ease-standard) infinite;
}

/* Floodlight sweep: a soft light band crosses the element on hover (300ms, spec §6). */
@utility floodlight-sweep {
  isolation: isolate;
  overflow: hidden;
  &::before {
    content: "";
    position: absolute;
    inset: 0;
    z-index: -1;
    pointer-events: none;
    background: linear-gradient(
      100deg,
      transparent 30%,
      rgb(var(--rgb-white) / 0.22) 50%,
      transparent 70%
    );
    transform: translateX(-120%);
    transition: transform var(--dur-hover) var(--ease-follow);
  }
  &:hover::before {
    transform: translateX(120%);
  }
}
```

In `app/app.css`, add after the base.css import:
```css
@import "../src/design-system/tokens/motion.css";
```

- [ ] **Step 3: Implement Button**

`src/design-system/primitives/Button.tsx`:
```tsx
import { cva } from "class-variance-authority";
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { Icon } from "./Icon";
import type { IconName } from "./icons";

export const buttonVariants = cva(
  "floodlight-sweep relative inline-flex cursor-pointer items-center justify-center select-none transition-[background-color,border-color,color,transform] duration-(--dur-snap) ease-snap active:scale-97 disabled:pointer-events-none disabled:opacity-40",
  {
    variants: {
      variant: {
        primary: "bg-volt text-volt-ink shadow-glow-cta hover:bg-volt-hover",
        secondary: "glass text-floodlight hover:bg-white-a10",
        outline: "border border-line-3 text-floodlight hover:border-volt",
        ghost: "text-floodlight hover:text-volt",
      },
      size: {
        s: "h-13 px-6.5 type-btn",
        m: "h-15.5 px-10 type-btn",
        l: "h-18.5 px-10 type-btn-xl",
        xl: "h-19.5 w-77.5 flex-col gap-1 type-btn-xl",
      },
      skew: {
        always: "-skew-x-12",
        desktop: "md:-skew-x-12",
        never: "",
      },
    },
    defaultVariants: { variant: "primary", size: "m", skew: "desktop" },
  },
);

// The label is counter-skewed so text stays upright inside the parallelogram.
const LABEL_SKEW = { always: "skew-x-12", desktop: "md:skew-x-12", never: "" } as const;

type Variant = "primary" | "secondary" | "outline" | "ghost";

export type ButtonOwnProps = {
  variant?: Variant;
  size?: "s" | "m" | "l" | "xl";
  /** true = always skewed, false = never, "desktop" = skewed from 768px up (default). */
  skew?: boolean | "desktop";
  /** Second line under the label (XL CTAs). */
  subLabel?: ReactNode;
  /** Volt glow pulse for the hero CTA. */
  pulse?: boolean;
  iconRight?: IconName;
};

export function Button<T extends ElementType = "button">({
  as,
  variant = "primary",
  size,
  skew = "desktop",
  subLabel,
  pulse = false,
  iconRight,
  className,
  children,
  ...rest
}: PolymorphicProps<T, ButtonOwnProps>) {
  const Comp: ElementType = as ?? "button";
  const skewKey = skew === true ? "always" : skew === false ? "never" : "desktop";
  const typeProp = Comp === "button" ? { type: (rest as { type?: string }).type ?? "button" } : {};
  const subTone = variant === "primary" ? "text-volt-ink-2" : "text-scout";

  return (
    <Comp
      {...rest}
      {...typeProp}
      className={cn(
        buttonVariants({ variant, size, skew: skewKey }),
        pulse && variant === "primary" && "animate-cta-glow",
        className,
      )}
    >
      <span className={cn("inline-flex items-center gap-2.5", LABEL_SKEW[skewKey])}>
        {children}
        {iconRight ? <Icon name={iconRight} size={18} /> : null}
      </span>
      {subLabel ? (
        <span className={cn("type-mono-tag", subTone, LABEL_SKEW[skewKey])}>{subLabel}</span>
      ) : null}
    </Comp>
  );
}
```
Run the unit tests. Expected: all pass.

- [ ] **Step 4: Stories**

`src/design-system/primitives/Button.stories.tsx`:
```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Button } from "./Button";

const meta: Meta<typeof Button> = { title: "Primitives/Button", component: Button };
export default meta;
type Story = StoryObj<typeof Button>;

export const Playground: Story = { args: { children: "Bowl · Space", variant: "primary", size: "m" } };

export const HeroPair: Story = {
  render: () => (
    <div className="flex gap-5.5 p-6">
      <Button size="xl" subLabel="INTERACTIVE · ~3 MIN" data-testid="cta-primary">
        Enter the arena
      </Button>
      <Button size="xl" variant="secondary" subLabel="RECRUITER VIEW · 90 SEC">
        View portfolio
      </Button>
    </div>
  ),
};

export const Sizes: Story = {
  render: () => (
    <div className="flex flex-col items-start gap-6 p-6">
      <Button size="s">Next venue</Button>
      <Button size="m">See the full scorecard</Button>
      <Button size="l" pulse data-testid="cta-pulse">
        Enter the arena →
      </Button>
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex flex-wrap gap-6 p-6">
      <Button>Primary</Button>
      <Button variant="secondary">Secondary</Button>
      <Button variant="outline" skew={false}>
        Outline
      </Button>
      <Button variant="ghost" skew={false} iconRight="arrow-right">
        Ghost
      </Button>
      <Button disabled>Disabled</Button>
    </div>
  ),
};

export const AsLink: Story = {
  render: () => (
    <Button as="a" href="#scout" variant="secondary" iconRight="arrow-right">
      Quick view
    </Button>
  ),
};

export const Flat: Story = {
  render: () => (
    <div className="flex w-90 gap-2.5">
      <Button skew={false} size="s" className="flex-1">
        Play
      </Button>
      <Button skew={false} size="s" variant="outline">
        Skip →
      </Button>
    </div>
  ),
};
```

- [ ] **Step 5: Write the computed-style story checks (real browser)**

`tests/stories/primitives.spec.ts`:
```ts
import { expect, test } from "@playwright/test";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story`;

test.describe("Button", () => {
  test("XL hero CTA matches the artboard box and skew", async ({ page }, testInfo) => {
    await page.goto(story("primitives-button--hero-pair"));
    const cta = page.getByTestId("cta-primary");
    const box = await cta.evaluate((el) => {
      const s = getComputedStyle(el);
      return { w: el.offsetWidth, h: el.offsetHeight, transform: s.transform, bg: s.backgroundColor };
    });
    expect(box.w).toBe(310);
    expect(box.h).toBe(78);
    expect(box.bg).toBe("rgb(215, 255, 63)");
    if (testInfo.project.name === "desktop") {
      // skewX(-12deg) → matrix(1, 0, -tan(12deg), 1, 0, 0) ≈ c = 0.2126
      expect(box.transform).toMatch(/^matrix\(1, 0, 0\.21\d*, 1, 0, 0\)$|^matrix\(1, 0, -0\.21\d*, 1, 0, 0\)$/);
    } else {
      expect(box.transform).toBe("none");
    }
  });

  test("button focus ring is the volt outline", async ({ page }) => {
    await page.goto(story("primitives-button--hero-pair"));
    await page.keyboard.press("Tab");
    const ring = await page.evaluate(() => {
      const s = getComputedStyle(document.activeElement as Element);
      return { style: s.outlineStyle, color: s.outlineColor, width: s.outlineWidth };
    });
    expect(ring).toEqual({ style: "solid", color: "rgb(215, 255, 63)", width: "2px" });
  });

  test("reduced motion stops the CTA pulse", async ({ page }) => {
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.goto(story("primitives-button--sizes"));
    const iterations = await page
      .getByTestId("cta-pulse")
      .evaluate((el) => getComputedStyle(el).animationIterationCount);
    expect(iterations).toBe("1");
  });
});
```
Run: `pnpm build-storybook && pnpm test:stories`. Expected: a11y passes for all Button stories, and the three checks pass on both projects. (If the skew matrix sign differs, fix the regex to the real browser value for `skewX(-12deg)` and say so in the report. The magnitude must be tan 12° ≈ 0.2126.)

- [ ] **Step 6: Export, verify, commit**

Append to `src/design-system/index.ts`:
```ts
export { Button, buttonVariants } from "./primitives/Button";
export type { ButtonOwnProps } from "./primitives/Button";
```
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build-storybook && pnpm test:stories
git add -A
git commit -m "feat(design-system): add skewed broadcast Button with hover sweep and CTA pulse

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 5: Glass panel and Chips

**Files:**
- Create: `src/design-system/primitives/Glass.tsx`, `Glass.test.tsx`, `Glass.stories.tsx`, `Chip.tsx`, `Chip.test.tsx`, `Chip.stories.tsx`
- Modify: `src/design-system/index.ts`

**Interfaces:**
- Consumes: `cn`, `PolymorphicProps`.
- Produces:
  - `Glass<T>(props: PolymorphicProps<T, GlassOwnProps>)`, default `div`. `GlassOwnProps`:
    - `surface?: "glass" | "solid" | "panel" | "gradient" | "dashed" | "none"` (default `glass`)
    - `edge?: "none" | "volt-soft" | "volt" | "selected"`
    - `elevation?: "none" | "card" | "toast" | "holo"`
    - `pad?: "none" | "sm" | "md" | "lg"`
  - `Chip<T>(props: PolymorphicProps<T, { tone?: ChipTone; size?: "sm" | "md" | "lg" }>)`, default `span`. `ChipTone = "outline" | "strong" | "meta" | "volt" | "volt-outline"`.
  - `ChipList(props: { items: string[]; tone?: ChipTone; size?: "sm" | "md" | "lg"; label?: string; className?: string })`: a `<ul>` of chips with list semantics, optional `aria-label`.

Values from audit §3.3 #33 and §3.4 #35:
- Panel padding: 20 (`md`), 14 (`sm`), 20×22 (`lg`).
- Volt-edged borders at .35 / .45.
- Chips: mono 12px. Career tag h32 px12, highlight tag h30 px10, meta chip px12 py8.

- [ ] **Step 1: Write the failing tests**

`src/design-system/primitives/Glass.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Glass } from "./Glass";

describe("Glass", () => {
  it("is a plain glass div by default", () => {
    render(<Glass>panel</Glass>);
    const el = screen.getByText("panel");
    expect(el.tagName).toBe("DIV");
    expect(el).toHaveClass("glass");
  });

  it("combines surface, edge, elevation and padding", () => {
    render(
      <Glass as="section" surface="gradient" edge="volt" elevation="card" pad="md" aria-label="Detail">
        x
      </Glass>,
    );
    const el = screen.getByRole("region", { name: "Detail" });
    expect(el).toHaveClass("bg-linear-160", "from-panel", "to-stand-3", "border-volt-a45", "shadow-card-3d", "p-5");
  });

  it("dashed surface for locked slots", () => {
    render(<Glass surface="dashed">locked</Glass>);
    expect(screen.getByText("locked")).toHaveClass("border-dashed", "border-line-strong");
  });
});
```

`src/design-system/primitives/Chip.test.tsx`:
```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { Chip, ChipList } from "./Chip";

describe("Chip", () => {
  it("defaults to an outlined mono tag", () => {
    render(<Chip>Java</Chip>);
    expect(screen.getByText("Java")).toHaveClass("type-mono-md", "border", "border-line-strong", "h-8");
  });

  it("volt fill marks shipped skills", () => {
    render(<Chip tone="volt">React</Chip>);
    expect(screen.getByText("React")).toHaveClass("bg-volt", "text-volt-ink");
  });
});

describe("ChipList", () => {
  it("renders a labelled list of chips", () => {
    render(<ChipList items={["React", "Spring Boot", "Oracle"]} label="Stack" size="sm" />);
    const list = screen.getByRole("list", { name: "Stack" });
    const items = within(list).getAllByRole("listitem");
    expect(items.map((i) => i.textContent)).toEqual(["React", "Spring Boot", "Oracle"]);
    expect(within(list).getByText("React")).toHaveClass("h-7.5");
  });
});
```
Run both. Expected: FAIL, modules not found.

- [ ] **Step 2: Implement**

`src/design-system/primitives/Glass.tsx`:
```tsx
import { cva } from "class-variance-authority";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";

export const glassVariants = cva("", {
  variants: {
    surface: {
      glass: "glass",
      solid: "glass-solid",
      panel: "border border-line bg-panel",
      gradient: "border border-line bg-linear-160 from-panel to-stand-3",
      dashed: "border border-dashed border-line-strong",
      none: "",
    },
    edge: {
      none: "",
      "volt-soft": "border-volt-a35",
      volt: "border-volt-a45",
      selected: "border-volt",
    },
    elevation: {
      none: "",
      card: "shadow-card-3d",
      toast: "shadow-toast",
      holo: "shadow-holo",
    },
    pad: {
      none: "",
      sm: "p-3.5",
      md: "p-5",
      lg: "px-5.5 py-5",
    },
  },
  defaultVariants: { surface: "glass", edge: "none", elevation: "none", pad: "none" },
});

export type GlassOwnProps = {
  surface?: "glass" | "solid" | "panel" | "gradient" | "dashed" | "none";
  edge?: "none" | "volt-soft" | "volt" | "selected";
  elevation?: "none" | "card" | "toast" | "holo";
  pad?: "none" | "sm" | "md" | "lg";
};

/** The broadcast panel: frosted stand glass by default (solid, no blur, on mobile via tokens). */
export function Glass<T extends ElementType = "div">({
  as,
  surface,
  edge,
  elevation,
  pad,
  className,
  ...rest
}: PolymorphicProps<T, GlassOwnProps>) {
  const Comp: ElementType = as ?? "div";
  return <Comp className={cn(glassVariants({ surface, edge, elevation, pad }), className)} {...rest} />;
}
```

`src/design-system/primitives/Chip.tsx`:
```tsx
import { cva } from "class-variance-authority";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";

export type ChipTone = "outline" | "strong" | "meta" | "volt" | "volt-outline";
type ChipSize = "sm" | "md" | "lg";

export const chipVariants = cva("inline-flex items-center gap-2 whitespace-nowrap type-mono-md", {
  variants: {
    tone: {
      outline: "border border-line-strong text-floodlight",
      strong: "border border-line-3 text-floodlight",
      meta: "border border-line-strong text-text-2",
      volt: "bg-volt text-volt-ink",
      "volt-outline": "border border-volt text-volt",
    },
    size: {
      sm: "h-7.5 px-2.5",
      md: "h-8 px-3",
      lg: "px-3 py-2",
    },
  },
  defaultVariants: { tone: "outline", size: "md" },
});

export function Chip<T extends ElementType = "span">({
  as,
  tone,
  size,
  className,
  ...rest
}: PolymorphicProps<T, { tone?: ChipTone; size?: ChipSize }>) {
  const Comp: ElementType = as ?? "span";
  return <Comp className={cn(chipVariants({ tone, size }), className)} {...rest} />;
}

interface ChipListProps {
  items: string[];
  tone?: ChipTone;
  size?: ChipSize;
  /** Accessible name for the list (e.g. "Stack"). */
  label?: string;
  className?: string;
}

export function ChipList({ items, tone, size, label, className }: ChipListProps) {
  return (
    <ul aria-label={label} className={cn("flex flex-wrap gap-2", className)}>
      {items.map((item) => (
        <li key={item}>
          <Chip tone={tone} size={size}>
            {item}
          </Chip>
        </li>
      ))}
    </ul>
  );
}
```
Run both test files. Expected: all pass.

- [ ] **Step 3: Stories**

`src/design-system/primitives/Glass.stories.tsx`:
```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Glass } from "./Glass";
import { MonoLabel, Text } from "./Text";

const meta: Meta<typeof Glass> = { title: "Primitives/Glass", component: Glass };
export default meta;

const Body = ({ title }: { title: string }) => (
  <div className="flex flex-col gap-2">
    <MonoLabel>{title}</MonoLabel>
    <Text variant="body-sm" tone="secondary">
      Release when the marker hits the yorker zone.
    </Text>
  </div>
);

export const Surfaces: StoryObj<typeof Glass> = {
  render: () => (
    <div className="grid grid-cols-3 gap-6 bg-linear-180 from-venue-mid to-ground p-10" data-venue="turf">
      <Glass pad="md">
        <Body title="GLASS" />
      </Glass>
      <Glass surface="solid" pad="md">
        <Body title="SOLID" />
      </Glass>
      <Glass surface="panel" pad="md">
        <Body title="PANEL" />
      </Glass>
      <Glass surface="gradient" pad="lg">
        <Body title="GRADIENT" />
      </Glass>
      <Glass surface="dashed" pad="sm">
        <Body title="DASHED · LOCKED" />
      </Glass>
      <Glass edge="volt" elevation="card" pad="md">
        <Body title="VOLT EDGE + CARD" />
      </Glass>
    </div>
  ),
};
```

`src/design-system/primitives/Chip.stories.tsx`:
```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Chip, ChipList } from "./Chip";

const meta: Meta<typeof Chip> = { title: "Primitives/Chip", component: Chip };
export default meta;

export const Tones: StoryObj<typeof Chip> = {
  render: () => (
    <div className="flex flex-wrap gap-3">
      <Chip>Java</Chip>
      <Chip tone="strong">System Design</Chip>
      <Chip tone="meta" size="lg">
        SOFTWARE ENGINEER 1 · SINCE JUL 2024
      </Chip>
      <Chip tone="volt">React</Chip>
      <Chip tone="volt-outline">Pune, India</Chip>
    </div>
  ),
};

export const StackList: StoryObj<typeof Chip> = {
  render: () => (
    <ChipList label="Stack" size="sm" items={["React", "Spring Boot", "Oracle", "JUnit", "TeamCity"]} />
  ),
};
```

- [ ] **Step 4: Export, verify, commit**

Append to `src/design-system/index.ts`:
```ts
export { Glass, glassVariants } from "./primitives/Glass";
export type { GlassOwnProps } from "./primitives/Glass";
export { Chip, ChipList, chipVariants } from "./primitives/Chip";
export type { ChipTone } from "./primitives/Chip";
```
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build-storybook && pnpm test:stories
git add -A
git commit -m "feat(design-system): add Glass panel and Chip primitives

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 6: KeyValueList, Legend, ProgressSteps

**Files:**
- Create: `src/design-system/primitives/KeyValueList.tsx`, `Legend.tsx`, `ProgressSteps.tsx`, `DataDisplay.test.tsx`, `DataDisplay.stories.tsx`
- Modify: `src/design-system/index.ts`

**Interfaces:**
- Consumes: `cn`.
- Produces:
  - `KeyValueList(props: { items: { k: ReactNode; v: ReactNode; accent?: boolean }[]; variant?: "row" | "stacked"; className?: string })`: a `<dl>` with each pair in a `<div>`.
  - `Legend(props: { items: { label: string; swatch: "volt" | "floodlight" | "dim" }[]; className?: string })`: a `<ul>`.
  - `ProgressSteps(props: { total: number; done: number; current?: boolean; variant?: "bar" | "segment"; label: string; className?: string })`: `role="img"` with `aria-label={label}`. Shows `done` volt cells, then one half-lit cell if `current`, then empty cells.

Values from audit §3.3 #31, #32, #34:
- KeyValue row: B15, border-top, padding 12.
- Stacked: mono 11 label over B14, border-bottom.
- Legend swatch: 18×8, gap 8, row gap 18.
- Progress bar: 4px tall, gap 4.
- Segment: 84×6, gap 6.

- [ ] **Step 1: Write the failing tests**

`src/design-system/primitives/DataDisplay.test.tsx`:
```tsx
import { render, screen, within } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { KeyValueList } from "./KeyValueList";
import { Legend } from "./Legend";
import { ProgressSteps } from "./ProgressSteps";

describe("KeyValueList", () => {
  it("renders a definition list with accented values", () => {
    const { container } = render(
      <KeyValueList
        items={[
          { k: "Home ground", v: "Pune, India" },
          { k: "Current club", v: "Deutsche Bank", accent: true },
        ]}
      />,
    );
    const dl = container.querySelector("dl")!;
    expect(within(dl).getAllByRole("term").map((t) => t.textContent)).toEqual(["Home ground", "Current club"]);
    expect(screen.getByText("Deutsche Bank")).toHaveClass("text-volt");
    expect(screen.getByText("Pune, India")).toHaveClass("text-floodlight");
  });

  it("stacked variant puts mono labels over values", () => {
    render(<KeyValueList variant="stacked" items={[{ k: "TYPE", v: "Analytics web platform" }]} />);
    expect(screen.getByText("TYPE")).toHaveClass("type-mono-label");
  });
});

describe("Legend", () => {
  it("lists swatches with labels", () => {
    render(
      <Legend
        items={[
          { label: "SHIPPED AT DEUTSCHE BANK", swatch: "volt" },
          { label: "BUILT IN PROJECTS", swatch: "floodlight" },
        ]}
      />,
    );
    const items = screen.getAllByRole("listitem");
    expect(items).toHaveLength(2);
    expect(items[0]!.querySelector("[aria-hidden]")).toHaveClass("bg-volt");
  });
});

describe("ProgressSteps", () => {
  it("describes progress in words and lights the right cells", () => {
    render(<ProgressSteps total={3} done={1} current label="1 of 3 venues played" />);
    const meter = screen.getByRole("img", { name: "1 of 3 venues played" });
    const cells = Array.from(meter.children);
    expect(cells).toHaveLength(3);
    expect(cells[0]).toHaveClass("bg-volt");
    expect(cells[1]).toHaveClass("bg-volt-a35");
    expect(cells[2]).toHaveClass("bg-seg-empty");
  });

  it("clamps done to the total", () => {
    render(<ProgressSteps total={3} done={9} label="done" variant="segment" />);
    const cells = Array.from(screen.getByRole("img").children);
    expect(cells.every((c) => c.classList.contains("bg-volt"))).toBe(true);
    expect(cells[0]).toHaveClass("w-21", "h-1.5");
  });
});
```
Run: `pnpm test src/design-system/primitives/DataDisplay.test.tsx`. Expected: FAIL, modules not found.

- [ ] **Step 2: Implement**

`src/design-system/primitives/KeyValueList.tsx`:
```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";

interface KeyValueItem {
  k: ReactNode;
  v: ReactNode;
  accent?: boolean;
}

interface KeyValueListProps {
  items: KeyValueItem[];
  variant?: "row" | "stacked";
  className?: string;
}

export function KeyValueList({ items, variant = "row", className }: KeyValueListProps) {
  return (
    <dl className={cn("flex flex-col", className)}>
      {items.map((item, i) =>
        variant === "row" ? (
          <div key={i} className="flex items-baseline justify-between gap-4 border-t border-line py-3">
            <dt className="type-body-md text-scout">{item.k}</dt>
            <dd className={cn("type-body-md text-right", item.accent ? "text-volt" : "text-floodlight")}>
              {item.v}
            </dd>
          </div>
        ) : (
          <div key={i} className="flex flex-col gap-1 border-b border-line pb-3 pt-3 first:pt-0">
            <dt className="type-mono-label text-scout">{item.k}</dt>
            <dd className={cn("type-body-sm", item.accent ? "text-volt" : "text-floodlight")}>{item.v}</dd>
          </div>
        ),
      )}
    </dl>
  );
}
```

`src/design-system/primitives/Legend.tsx`:
```tsx
import { cn } from "@/lib/cn";

type Swatch = "volt" | "floodlight" | "dim";

const SWATCH: Record<Swatch, string> = {
  volt: "bg-volt",
  floodlight: "bg-floodlight",
  dim: "bg-dim",
};

interface LegendProps {
  items: { label: string; swatch: Swatch }[];
  className?: string;
}

export function Legend({ items, className }: LegendProps) {
  return (
    <ul className={cn("flex flex-wrap items-center gap-x-4.5 gap-y-2", className)}>
      {items.map((item) => (
        <li key={item.label} className="inline-flex items-center gap-2">
          <span aria-hidden="true" className={cn("h-2 w-4.5", SWATCH[item.swatch])} />
          <span className="type-mono-tag text-scout">{item.label}</span>
        </li>
      ))}
    </ul>
  );
}
```

`src/design-system/primitives/ProgressSteps.tsx`:
```tsx
import { cn } from "@/lib/cn";

interface ProgressStepsProps {
  total: number;
  done: number;
  /** Half-light the next step (in progress). */
  current?: boolean;
  variant?: "bar" | "segment";
  /** Progress in words, e.g. "1 of 3 venues played" — what screen readers announce. */
  label: string;
  className?: string;
}

const CELL = { bar: "h-1 flex-1", segment: "h-1.5 w-21" } as const;
const GAP = { bar: "gap-1", segment: "gap-1.5" } as const;

export function ProgressSteps({ total, done, current = false, variant = "bar", label, className }: ProgressStepsProps) {
  const filled = Math.max(0, Math.min(done, total));
  return (
    <div role="img" aria-label={label} className={cn("flex", GAP[variant], className)}>
      {Array.from({ length: total }, (_, i) => (
        <span
          key={i}
          className={cn(
            CELL[variant],
            i < filled ? "bg-volt" : i === filled && current ? "bg-volt-a35" : "bg-seg-empty",
          )}
        />
      ))}
    </div>
  );
}
```
Run the tests. Expected: all pass.

- [ ] **Step 3: Stories**

`src/design-system/primitives/DataDisplay.stories.tsx`:
```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Glass } from "./Glass";
import { KeyValueList } from "./KeyValueList";
import { Legend } from "./Legend";
import { ProgressSteps } from "./ProgressSteps";

const meta: Meta = { title: "Primitives/Data display" };
export default meta;

export const KeyValues: StoryObj = {
  render: () => (
    <div className="grid w-200 grid-cols-2 gap-8">
      <KeyValueList
        items={[
          { k: "Home ground", v: "Pune, India" },
          { k: "Pro debut", v: "Jun 2023" },
          { k: "Current club", v: "Deutsche Bank", accent: true },
        ]}
      />
      <KeyValueList
        variant="stacked"
        items={[
          { k: "TYPE", v: "Analytics web platform" },
          { k: "KEY PIECE", v: "Secure token generation" },
        ]}
      />
    </div>
  ),
};

export const LegendRow: StoryObj = {
  render: () => (
    <Legend
      items={[
        { label: "SHIPPED AT DEUTSCHE BANK", swatch: "volt" },
        { label: "BUILT IN PROJECTS", swatch: "floodlight" },
        { label: "IN THE KIT BAG", swatch: "dim" },
      ]}
    />
  ),
};

export const Progress: StoryObj = {
  render: () => (
    <Glass pad="md" className="flex w-60 flex-col gap-6">
      <ProgressSteps total={3} done={1} label="1 of 3 venues played" />
      <ProgressSteps total={3} done={2} current variant="segment" label="Rally 3 of 3" />
    </Glass>
  ),
};
```

- [ ] **Step 4: Export, verify, commit**

Append to `src/design-system/index.ts`:
```ts
export { KeyValueList } from "./primitives/KeyValueList";
export { Legend } from "./primitives/Legend";
export { ProgressSteps } from "./primitives/ProgressSteps";
```
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build-storybook && pnpm test:stories
git add -A
git commit -m "feat(design-system): add KeyValueList, Legend and ProgressSteps

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 7: Form fields — TextField, TextArea, Fieldset, RadioCard

**Files:**
- Create: `src/design-system/primitives/Field.tsx`, `RadioCard.tsx`, `Field.test.tsx`, `Field.stories.tsx`
- Modify: `src/design-system/index.ts`, `src/design-system/tokens/base.css` (no change expected; `color-scheme: dark` already set in 0A), `tests/stories/primitives.spec.ts` (append)

**Interfaces:**
- Consumes: `cn`.
- Produces:
  - `TextField(props: { label: string; error?: string; hint?: string } & ComponentPropsWithRef<"input">)`
  - `TextArea(props: { label: string; error?: string; hint?: string } & ComponentPropsWithRef<"textarea">)`
  - `Fieldset(props: { legend: string } & ComponentPropsWithRef<"fieldset">)`
  - `RadioCard(props: { title: string; description?: string } & Omit<ComponentPropsWithRef<"input">, "type">)`: a native radio inside a `<label>` card.

Values from audit §3.5:
- Label: mono 11/.2em scout.
- Input: inset bg, 1px line-strong, B16, 52px tall (textarea 110px), px14, placeholder dim.
- Radio card: padding 16, selected = volt border + volt-a08 bg, hover border line-hover.

**Derived (spec §12):** the error state isn't designed. It shows a live-red 6px dot, a 1px live-red border and the message in floodlight text. A border is not a fill, so it honours "red is never a fill", and text contrast stays ≥4.5:1.

- [ ] **Step 1: Write the failing tests**

`src/design-system/primitives/Field.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it } from "vitest";
import { Fieldset, TextArea, TextField } from "./Field";
import { RadioCard } from "./RadioCard";

describe("TextField", () => {
  it("is labelled by its visible label", () => {
    render(<TextField label="YOUR NAME" placeholder="Who's stepping up?" />);
    const input = screen.getByLabelText("YOUR NAME");
    expect(input.tagName).toBe("INPUT");
    expect(input).toHaveClass("h-13", "bg-inset", "border-line-strong");
    expect(input).not.toHaveAttribute("aria-invalid");
  });

  it("links the error message", () => {
    render(<TextField label="EMAIL" error="Enter a valid email" />);
    const input = screen.getByLabelText("EMAIL");
    expect(input).toHaveAttribute("aria-invalid", "true");
    const msg = screen.getByText("Enter a valid email");
    expect(input.getAttribute("aria-describedby")).toContain(msg.id);
  });

  it("links a hint", () => {
    render(<TextField label="EMAIL" hint="We reply within a day" />);
    const hint = screen.getByText("We reply within a day");
    expect(screen.getByLabelText("EMAIL").getAttribute("aria-describedby")).toContain(hint.id);
  });

  it("accepts typing", async () => {
    render(<TextField label="YOUR NAME" />);
    await userEvent.type(screen.getByLabelText("YOUR NAME"), "Rohit");
    expect(screen.getByLabelText("YOUR NAME")).toHaveValue("Rohit");
  });
});

describe("TextArea", () => {
  it("is a 110px non-resizable textarea", () => {
    render(<TextArea label="THE CHALLENGE" />);
    const ta = screen.getByLabelText("THE CHALLENGE");
    expect(ta.tagName).toBe("TEXTAREA");
    expect(ta).toHaveClass("h-27.5", "resize-none");
  });
});

describe("Fieldset + RadioCard", () => {
  it("groups radio cards under a legend and selects one", async () => {
    render(
      <Fieldset legend="CHOOSE YOUR FORMAT">
        <RadioCard name="format" value="sign" title="Sign a player" description="Full-time role" defaultChecked />
        <RadioCard name="format" value="doubles" title="Doubles" description="Project collab" />
      </Fieldset>,
    );
    const group = screen.getByRole("group", { name: "CHOOSE YOUR FORMAT" });
    expect(group).toBeInTheDocument();
    const doubles = screen.getByRole("radio", { name: /Doubles/ });
    await userEvent.click(doubles);
    expect(doubles).toBeChecked();
    expect(screen.getByRole("radio", { name: /Sign a player/ })).not.toBeChecked();
  });
});
```
Run: `pnpm test src/design-system/primitives/Field.test.tsx`. Expected: FAIL, modules not found.

- [ ] **Step 2: Implement**

`src/design-system/primitives/Field.tsx`:
```tsx
import { useId, type ComponentPropsWithRef, type ReactNode } from "react";
import { cn } from "@/lib/cn";

const CONTROL =
  "w-full border border-line-strong bg-inset px-3.5 type-body text-floodlight placeholder:text-dim transition-colors duration-(--dur-snap) ease-snap hover:border-line-hover focus-visible:border-volt aria-invalid:border-live";

interface FieldChromeProps {
  id: string;
  label: string;
  hintId?: string;
  hint?: string;
  errorId?: string;
  error?: string;
  children: ReactNode;
}

function FieldChrome({ id, label, hint, hintId, error, errorId, children }: FieldChromeProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <label htmlFor={id} className="type-mono-label text-scout">
        {label}
      </label>
      {children}
      {hint ? (
        <p id={hintId} className="type-caption text-text-2">
          {hint}
        </p>
      ) : null}
      {error ? (
        <p id={errorId} className="flex items-center gap-2 type-caption text-floodlight">
          <span aria-hidden="true" className="size-1.5 rounded-full bg-live" />
          {error}
        </p>
      ) : null}
    </div>
  );
}

function useFieldIds(id: string | undefined, hint?: string, error?: string) {
  const auto = useId();
  const base = id ?? auto;
  const hintId = hint ? `${base}-hint` : undefined;
  const errorId = error ? `${base}-error` : undefined;
  const describedBy = [hintId, errorId].filter(Boolean).join(" ") || undefined;
  return { base, hintId, errorId, describedBy };
}

type FieldOwn = { label: string; error?: string; hint?: string };

export function TextField({
  label,
  error,
  hint,
  id,
  className,
  ...rest
}: FieldOwn & ComponentPropsWithRef<"input">) {
  const ids = useFieldIds(id, hint, error);
  return (
    <FieldChrome id={ids.base} label={label} hint={hint} hintId={ids.hintId} error={error} errorId={ids.errorId}>
      <input
        id={ids.base}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(CONTROL, "h-13", className)}
        {...rest}
      />
    </FieldChrome>
  );
}

export function TextArea({
  label,
  error,
  hint,
  id,
  className,
  ...rest
}: FieldOwn & ComponentPropsWithRef<"textarea">) {
  const ids = useFieldIds(id, hint, error);
  return (
    <FieldChrome id={ids.base} label={label} hint={hint} hintId={ids.hintId} error={error} errorId={ids.errorId}>
      <textarea
        id={ids.base}
        aria-invalid={error ? true : undefined}
        aria-describedby={ids.describedBy}
        className={cn(CONTROL, "h-27.5 resize-none py-3.5", className)}
        {...rest}
      />
    </FieldChrome>
  );
}

export function Fieldset({
  legend,
  className,
  children,
  ...rest
}: { legend: string } & ComponentPropsWithRef<"fieldset">) {
  return (
    <fieldset className={cn("flex min-w-0 flex-col gap-2.5 border-0 p-0", className)} {...rest}>
      <legend className="mb-2.5 type-mono-label text-scout">{legend}</legend>
      {children}
    </fieldset>
  );
}
```

`src/design-system/primitives/RadioCard.tsx`:
```tsx
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

type RadioCardProps = {
  title: string;
  description?: string;
} & Omit<ComponentPropsWithRef<"input">, "type">;

/** A native radio dressed as a selectable card (Team Up formats). The focus ring is drawn on the card. */
export function RadioCard({ title, description, className, ...rest }: RadioCardProps) {
  return (
    <label
      className={cn(
        "relative flex cursor-pointer flex-col gap-1.5 border border-line-strong p-4 transition-colors duration-(--dur-snap) ease-snap hover:border-line-hover has-checked:border-volt has-checked:bg-volt-a08 has-focus-visible:outline-2 has-focus-visible:outline-offset-3 has-focus-visible:outline-volt has-focus-visible:outline-solid",
        className,
      )}
    >
      <span className="flex items-center gap-2.5">
        <input type="radio" className="size-4.5 accent-volt focus-visible:outline-none" {...rest} />
        <span className="type-d4s text-floodlight">{title}</span>
      </span>
      {description ? <span className="type-caption text-text-2">{description}</span> : null}
    </label>
  );
}
```
Run the tests. Expected: all pass.

- [ ] **Step 3: Stories**

`src/design-system/primitives/Field.stories.tsx`:
```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Fieldset, TextArea, TextField } from "./Field";
import { RadioCard } from "./RadioCard";

const meta: Meta = { title: "Primitives/Form" };
export default meta;

export const Fields: StoryObj = {
  render: () => (
    <form className="flex w-120 flex-col gap-5" onSubmit={(e) => e.preventDefault()}>
      <TextField label="YOUR NAME" placeholder="Who's stepping up?" />
      <TextField label="EMAIL" type="email" placeholder="you@club.com" hint="I reply within a day." />
      <TextField label="EMAIL (ERROR)" type="email" defaultValue="not-an-email" error="Enter a valid email address." />
      <TextArea label="THE CHALLENGE" placeholder="What are we building?" />
    </form>
  ),
};

export const FormatCards: StoryObj = {
  render: () => (
    <Fieldset legend="CHOOSE YOUR FORMAT" className="w-200">
      <div className="grid grid-cols-3 gap-2.5">
        <RadioCard name="format" value="sign" title="Sign a player" description="A full-time role on your team." defaultChecked data-testid="radio-sign" />
        <RadioCard name="format" value="doubles" title="Doubles" description="Pair up on a project." />
        <RadioCard name="format" value="friendly" title="Friendly rally" description="Just a conversation." />
      </div>
    </Fieldset>
  ),
};
```

- [ ] **Step 4: Browser checks for the radio card**

Append to `tests/stories/primitives.spec.ts`:
```ts
test.describe("RadioCard", () => {
  test("radio card focus ring wraps the whole card", async ({ page }) => {
    await page.goto(story("primitives-form--format-cards"));
    await page.keyboard.press("Tab");
    const card = page.locator("label", { has: page.getByTestId("radio-sign") });
    const ring = await card.evaluate((el) => {
      const s = getComputedStyle(el);
      return { style: s.outlineStyle, color: s.outlineColor };
    });
    expect(ring).toEqual({ style: "solid", color: "rgb(215, 255, 63)" });
  });

  test("selected card is volt-edged", async ({ page }) => {
    await page.goto(story("primitives-form--format-cards"));
    const card = page.locator("label", { has: page.getByTestId("radio-sign") });
    expect(await card.evaluate((el) => getComputedStyle(el).borderTopColor)).toBe("rgb(215, 255, 63)");
  });
});
```

- [ ] **Step 5: Export, verify, commit, tick carry-over**

Append to `src/design-system/index.ts`:
```ts
export { Fieldset, TextArea, TextField } from "./primitives/Field";
export { RadioCard } from "./primitives/RadioCard";
```
In `docs/superpowers/plans/phase-0-carryover.md`, tick the 0B rows "Inline styles in components/stories…" and "Hand-written vendor-prefixed CSS pairs…" (both enforced by this plan's Global Constraints and `motion.css`).
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm build-storybook && pnpm test:stories
git add -A
git commit -m "feat(design-system): add TextField, TextArea, Fieldset and RadioCard

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
Finally run the whole gate: `pnpm verify`. Expected: exit 0.

---

## Phase 0B exit checklist (orchestrator)

- [ ] `pnpm verify` green on `phase/0-foundation` (now including `test:stories`).
- [ ] Storybook shows Primitives/{Text, Icon, IconButton, Button, Glass, Chip, Data display, Form}. The orchestrator views the Button and Form stories in a screenshot.
- [ ] Every component is exported from `@/design-system`.
- [ ] 0B rows in `phase-0-carryover.md` are ticked or explicitly re-assigned.
- [ ] Opus whole-branch review passed → ask Yash to merge → write the 0C plan.

---

## Trivia: terms used in this plan

- **Primitive:** the smallest reusable UI piece (a button, a label). Screens are assembled from them.
- **Polymorphic component (`as` prop):** one component that can render as different HTML elements, e.g. a Button that's really a link, while keeping the same look.
- **cva (class-variance-authority):** a helper that maps props like `variant="primary"` to a fixed list of classes, so options are declared once.
- **Accessible name:** what a screen reader announces for a control. Icon-only buttons need one via `aria-label`.
- **`aria-invalid` / `aria-describedby`:** attributes that tell screen readers "this field has an error" and "read this message with it".
- **`has-checked:` (CSS `:has()`):** styles a parent based on its child's state. Here the card turns volt when its radio is checked.
- **Story gate:** a robot that opens every Storybook page and runs an accessibility scan, so a broken component can't pass `pnpm verify`.
- **Computed style:** the final CSS a browser actually applies to an element. Tests read it to prove sizes, colours and the skew are real.
