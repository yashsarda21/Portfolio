# Phase 0C — Broadcast Kit + Stadium Scene Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**What this plan does (plain words):** builds the pieces that make the site feel like a live TV broadcast inside a floodlit stadium.

- **Broadcast graphics:**
  - the score bug at the top of games
  - the "COMM" commentary bar
  - the LED scoreboard
  - the top HUD bar and its buttons
  - the skip chip
  - the skill bar with 10 segments
  - stat tiles that count up
- **The stadium itself:** night sky glow, crowd stands, light beams, floodlight banks that flicker on, and the turf field.

The plan ends by assembling the Landing stadium plus scoreboard from these pieces. That composition is compared pixel by pixel with your Landing artboard. If the pieces are right, the picture matches.

**Goal:** `src/design-system/broadcast/` and `src/design-system/scene/` exported from `@/design-system`, each with stories that pass the axe story gate. Plus one fidelity story that matches `Main@1440x900` within 4% after masking the parts 0C doesn't own.

**Architecture:**
- Broadcast components are presentational React components built on 0B primitives and Arena tokens. They hold no copy, routes or state logic; screens and 0D shell services pass those in.
- Scene layers are `aria-hidden` decorative `div`s. Their colour and shape live in CSS utilities (`scene.css`), and components only set **numeric** custom properties (position %, alpha, size). That keeps raw colours out of TypeScript (lint rule) and lets `data-venue` re-tint everything.
- Count-up uses a tiny `requestAnimationFrame` hook that never flickers prerendered values.

**Tech Stack:** React 19, Tailwind v4 (Arena locked theme), class-variance-authority, Vitest, Storybook 10 + the axe story gate, Playwright + `expectMatchesArtboard`.

**Spec:** `docs/superpowers/specs/2026-10-03-arena-portfolio-design.md` §5.3 (broadcast + scene tiers), §7 (motion), §11.1 (A4: MATCH POINT chip). Exact values: `docs/superpowers/specs/2026-10-03-arena-design-audit.md` §3.1, §3.3, §4. Carry-over: `docs/superpowers/plans/phase-0-carryover.md` (0C row).

**Scope decisions (YAGNI, deferred to the phase that first uses them):**

| Deferred to | Pieces |
|---|---|
| Phase 3 | Dust particles, stadium flash, scoreboard scan line |
| Phase 4 | Index rail, venue cards |
| Phase 5 | Hawk-Eye overlays, courts, pitch strip, hall lamp, LED marquee |
| Phase 6 | Flipped Giant-Killer score bug |
| 0D | QuickViewChip (it needs a route, and 0D owns routes) |

## Global Constraints

All Phase 0A/0B constraints apply:
- Arena tokens only, written as **literal class strings** (no template-built classes).
- No raw hex, `rgb()` or `cubic-bezier()` in TS/TSX.
- No arbitrary type sizes, no decoration colours as text.
- No inline `var(--color-*)`.
- Hand-written vendor pairs put `-webkit-` first.
- Polymorphic `as` where a component may be a link.
- `className` merged last via `cn`; no outer margins.
- Mono text ≥11px, contrast ≥4.5:1, volt focus ring, reduced motion respected.
- Every component gets a story (the story gate runs axe on it) and a barrel export.
- Commits end with `Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>`. Branch `phase/0-foundation`. Git 2.15 (no `switch`/`restore`).

New for 0C:
- **Design-system components hold no product copy.** Every visible string (`COMM`, `LIVE · THE ARENA`, labels) arrives as a prop. Stories may use literal copy.
- **Scene components are decorative:** `aria-hidden="true"`, `pointer-events-none`, no focusable content.
- **Numeric custom properties only in inline `style`** (e.g. `{"--sky-a": 0.2}`), cast with `as CSSProperties`. Colours stay in `scene.css`.
- **Lean testing (user decision):** unit tests only for logic (stat parsing, count-up rules, segment levels, ScoreBug labelling). Visual correctness comes from the story gate, a few computed-style checks and the one artboard fidelity diff.

## Review Focus

1. **Count-up never flickers prerendered numbers.** A stat already on screen at load, or with reduced motion on, shows its final value and never resets to 0. Test: Task 4 `StatTile.test.tsx`.
2. **Screen readers get real values, not animation frames.** StatTile exposes the final value in text; the ticking digits are `aria-hidden`. ScoreBug has a readable summary label. Tests: Task 4 and Task 3 unit tests.
3. **MATCH POINT is not a red fill** (spec A4). The alert status renders on a dark chip with a live-red dot. Test: Task 3 `ScoreBug.test.tsx`.
4. **The stadium matches the artboard.** The fidelity story is within 4% of `Main@1440x900` outside the masked regions. Test: Task 5 `scene.spec.ts`.
5. **Venue re-tinting works.** The same CrowdTier/VenueGlow markup reads warm under `data-venue="hall"`. Verified by the "Venues" story screenshot in the orchestrator's visual check.

---

## File map

```
src/design-system/tokens/tokens.css, theme.css, base.css, catalog.ts      (Task 1: ramps, recipes, glows)
src/design-system/tokens/scene.css                                        (Task 1: scene + broadcast CSS utilities, keyframes)
src/design-system/tokens/contrast.test.ts                                 (Task 1: add pairs)
app/app.css, .storybook/preview.tsx                                       (Task 1)
src/design-system/broadcast/
  LiveDot.tsx BrandLockup.tsx KeyboardHint.tsx HUDButton.tsx AudioToggle.tsx
  SkipChip.tsx PlayerTag.tsx HUD.tsx CommentaryBar.tsx  Chrome.stories.tsx  Chrome.test.tsx     (Task 2)
  ScoreBug.tsx Scoreboard.tsx  Boards.stories.tsx  ScoreBug.test.tsx                            (Task 3)
  SegmentBar.tsx SkillRow.tsx StatTile.tsx useCountUp.ts  Stats.stories.tsx  StatTile.test.tsx (Task 4)
src/design-system/scene/
  SkyGlow.tsx VenueGlow.tsx CrowdTier.tsx LightCone.tsx FloodlightBank.tsx FloodlightMast.tsx
  Field.tsx PitchGlow.tsx ArenaBackdrop.tsx  Scene.stories.tsx                                   (Task 5)
tests/stories/scene.spec.ts                                                                      (Task 5)
src/design-system/index.ts                                                                       (each task)
```

Execution batching (orchestrator): run A = Tasks 1–2, run B = Tasks 3–4, run C = Task 5.

---

### Task 1: Token additions, scene/broadcast CSS, fullscreen stories

**Files:**
- Modify: `src/design-system/tokens/tokens.css`, `theme.css`, `base.css`, `catalog.ts`, `contrast.test.ts`; `app/app.css`; `.storybook/preview.tsx`; `docs/superpowers/plans/phase-0-carryover.md`
- Create: `src/design-system/tokens/scene.css`

**Interfaces:**
- Produces:
  - Colour utilities `ground-a35 ground-a85 ground-a90 ground-a92 white-a09 white-a16` (e.g. `from-ground-a85`)
  - Type recipes `type-score` (Display 800, 20px, lh 1, .06em) and `type-score-lg` (Display 800, 24px, lh 1, .08em, tabular)
  - Glow utilities `glow-led`, `glow-volt`
  - Scene utilities: `led-dots scene-sky scene-venue-glow scene-crowd scene-cone scene-cone-left scene-cone-right scene-cone-down scene-bank scene-bank-off scene-mast scene-field scene-pitch-glow`
  - Animation utilities `animate-bank-flicker animate-live-pulse animate-comm-in animate-seg-fill`
  - Stories with `parameters: { layout: "fullscreen" }` render with no padding wrapper.

- [ ] **Step 1: Ramps (carry-over 0C row)**

In `tokens.css`, Layer 1, after the white ramp, add:
```css
  --ref-white-a16: rgb(var(--rgb-white) / 0.16);
  --ref-ground-a35: rgb(var(--rgb-ground) / 0.35);
  --ref-ground-a85: rgb(var(--rgb-ground) / 0.85);
  --ref-ground-a90: rgb(var(--rgb-ground) / 0.9);
  --ref-ground-a92: rgb(var(--rgb-ground) / 0.92);
```
In `theme.css` `@theme inline`, after `--color-white-a10`, add:
```css
  --color-white-a09: var(--ref-white-a09);
  --color-white-a16: var(--ref-white-a16);
  --color-ground-a35: var(--ref-ground-a35);
  --color-ground-a85: var(--ref-ground-a85);
  --color-ground-a90: var(--ref-ground-a90);
  --color-ground-a92: var(--ref-ground-a92);
```

- [ ] **Step 2: Recipes and glows**

Append to `base.css` (keep the existing recipe formatting style):
```css
@utility type-score {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 20px;
  line-height: 1;
  letter-spacing: 0.06em;
  text-transform: uppercase;
}
@utility type-score-lg {
  font-family: var(--font-display);
  font-weight: 800;
  font-size: 24px;
  line-height: 1;
  letter-spacing: 0.08em;
  font-variant-numeric: tabular-nums;
  text-transform: uppercase;
}
/* Lit-board text glows (audit §2.7 text glows). */
@utility glow-led {
  text-shadow: 0 0 28px rgb(var(--rgb-white) / 0.35);
}
@utility glow-volt {
  text-shadow: 0 0 18px rgb(var(--rgb-volt) / 0.45);
}
```

- [ ] **Step 3: `scene.css`**

Create `src/design-system/tokens/scene.css`:
```css
/* Stadium scene + broadcast utilities. Components set numeric custom properties only;
   colours come from tokens, so data-venue re-tints every layer (spec §5.1 layer 3). */

@utility led-dots {
  background-image: radial-gradient(rgb(var(--rgb-white) / 0.045) 1px, transparent 1.4px);
  background-size: 4px 4px;
}

@utility scene-sky {
  background: radial-gradient(
    ellipse var(--sky-w, 75%) var(--sky-h, 50%) at var(--sky-x, 50%) var(--sky-y, 0%),
    rgb(var(--rgb-sky) / var(--sky-a, 0.2)),
    transparent 70%
  );
}

@utility scene-venue-glow {
  background: radial-gradient(
    ellipse var(--glow-w, 80%) var(--glow-h, 50%) at var(--glow-x, 50%) var(--glow-y, 110%),
    rgb(var(--venue-glow-rgb, var(--rgb-volt)) / var(--glow-a, 0.4)),
    transparent 70%
  );
}

@utility scene-crowd {
  background-image: radial-gradient(
    rgb(var(--venue-crowd-rgb, var(--rgb-crowd)) / var(--crowd-a, 0.3)) 1px,
    transparent 1.7px
  );
  background-size: 7px 6px;
  -webkit-mask-image: linear-gradient(180deg, transparent 0%, #000 30%, #000 55%, transparent 90%);
  mask-image: linear-gradient(180deg, transparent 0%, #000 30%, #000 55%, transparent 90%);
}

@utility scene-cone {
  background: linear-gradient(
    180deg,
    rgb(var(--venue-light-rgb, var(--rgb-beam)) / var(--cone-a, 0.16)),
    transparent
  );
  filter: blur(var(--blur-beam));
}
@utility scene-cone-left {
  clip-path: polygon(18% 0, 32% 0, 100% 100%, 40% 100%);
}
@utility scene-cone-right {
  clip-path: polygon(68% 0, 82% 0, 60% 100%, 0 100%);
}
@utility scene-cone-down {
  clip-path: polygon(42% 0, 58% 0, 100% 100%, 0 100%);
}

/* Floodlight bank: a grid of bulbs on the fixture housing. Size vars set per size variant. */
@utility scene-bank {
  border-radius: 3px;
  background:
    radial-gradient(circle, #fff 0 var(--bulb-r1), transparent var(--bulb-r2)) 0 0 /
      var(--bulb-gx) var(--bulb-gy),
    var(--ref-fixture);
}
@utility scene-bank-off {
  background: var(--ref-fixture);
  box-shadow: none;
  opacity: 0.6;
}

@utility scene-mast {
  background: linear-gradient(180deg, var(--ref-mast), transparent);
}

/* Turf in perspective (Main/Intro). The parent sets perspective. */
@utility scene-field {
  border-radius: 50%;
  transform: rotateX(var(--field-tilt, 70deg));
  transform-origin: 50% 0;
  background:
    radial-gradient(
      ellipse at 50% 40%,
      rgb(46 132 78 / 0.75),
      rgb(14 52 32 / 0.55) 45%,
      transparent 70%
    ),
    repeating-linear-gradient(90deg, rgb(var(--rgb-white) / 0.035) 0 70px, transparent 70px 140px);
}

@utility scene-pitch-glow {
  background: linear-gradient(180deg, rgb(150 128 88 / 0), rgb(150 128 88 / 0.45));
  clip-path: polygon(30% 0, 70% 0, 100% 100%, 0 100%);
}

/* ---------- keyframes ---------- */
@keyframes bank-flicker {
  0%,
  18% {
    opacity: 0.05;
  }
  22% {
    opacity: 1;
  }
  25% {
    opacity: 0.2;
  }
  29%,
  100% {
    opacity: 1;
  }
}
@utility animate-bank-flicker {
  animation: bank-flicker 1.6s ease-out both;
  animation-delay: var(--flicker-delay, 0s);
}

@keyframes live-pulse {
  0%,
  100% {
    opacity: 1;
  }
  50% {
    opacity: 0.25;
  }
}
@utility animate-live-pulse {
  animation: live-pulse 1.6s ease-in-out infinite;
}

@keyframes comm-in {
  from {
    opacity: 0;
    transform: translateX(-12px);
  }
  to {
    opacity: 1;
    transform: none;
  }
}
@utility animate-comm-in {
  animation: comm-in 0.4s var(--ease-follow) both;
}

@keyframes seg-fill {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
@utility animate-seg-fill {
  animation: seg-fill 0.35s var(--ease-follow) both;
  animation-delay: calc(var(--i, 0) * 40ms);
}
```
In `app/app.css`, add `@import "../src/design-system/tokens/scene.css";` after the motion.css import.

- [ ] **Step 4: Catalogue + contrast**

`catalog.ts`: add colour entries (literal classNames) `ground-a35 → bg-ground-a35`, `ground-a85`, `ground-a90`, `ground-a92`, `white-a09 → bg-white-a09`, `white-a16`. Add `type-score` and `type-score-lg` to `type`. Existing catalogue tests and the built-CSS class-existence e2e cover them.

`contrast.test.ts`: add pairs, following the file's existing pattern:
- `--ref-led-white` and `--ref-dim` on `--ref-board-bg` (scoreboard text)
- `--ref-text-2` on `--ref-line` (ScoreBug meta cell)
- `--ref-scout-grey` on `--ref-stand` (ScoreBug away chip)
- `--ref-stand` on `--ref-floodlight` (ScoreBug name chip: dark text on white)

Run `pnpm test src/design-system/tokens`. Expected: pass. If a pair fails, report it; don't change tokens.

- [ ] **Step 5: Fullscreen stories**

`.storybook/preview.tsx`: change the decorator so fullscreen stories get no padding:
```tsx
  decorators: [
    (Story, context) =>
      context.parameters.layout === "fullscreen" ? (
        <div className="bg-ground text-floodlight">
          <Story />
        </div>
      ) : (
        <div className="min-h-dvh bg-ground p-6 text-floodlight">
          <Story />
        </div>
      ),
  ],
```

- [ ] **Step 6: Verify, tick carry-over, commit**

Tick the 0C row in `phase-0-carryover.md` ("ground alpha ramp ×4 and white ramp to ×6").
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "feat(tokens): add broadcast/scene utilities, ground+white ramps, score recipes

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 2: Broadcast chrome — LiveDot, BrandLockup, KeyboardHint, HUDButton, AudioToggle, SkipChip, PlayerTag, HUD, CommentaryBar

**Files:** create the 9 component files, plus `Chrome.stories.tsx` and `Chrome.test.tsx` in `src/design-system/broadcast/`. Modify `src/design-system/index.ts`.

**Interfaces** (all exported from `@/design-system`; values from audit §3.1, §3.3):

| Component | Signature | Rendering |
|---|---|---|
| `LiveDot` | `{ size?: 6 \| 8 \| 10; pulse?: boolean; className? }` | `aria-hidden` red dot |
| `BrandLockup<T>` | `PolymorphicProps<T, { mark: string; label?: ReactNode; size?: "lg" \| "md" \| "sm" }>` | Default `div`. YS square (38/36/34 px) + mono wordmark. As a link, the caller must pass `aria-label` |
| `KeyboardHint` | `ComponentPropsWithRef<"p">` | Mono 12, dim |
| `HUDButton<T>` | `PolymorphicProps<T, { icon?: IconName }>` | Default `button` (type="button"). Glass, 44px tall, mono-md |
| `AudioToggle` | `{ name: string; on: boolean; onToggle: () => void; variant?: "labelled" \| "icon"; labelOn?: string; labelOff?: string; className? }` | `aria-pressed={on}` |
| `SkipChip<T>` | `PolymorphicProps<T, { variant?: "game" \| "hub" }>` | Default `a`, trailing arrow |
| `PlayerTag` | `{ live?: boolean; children; className? }` | Glass pill, mono-tag |
| `HUD` | `{ left?: ReactNode; center?: ReactNode; right?: ReactNode; fade?: boolean } & ComponentPropsWithRef<"header">` | 76px, 3-column grid |
| `CommentaryBar` | `{ tag: string; line: string; variant?: "overlay" \| "inline"; className? }` | The line re-animates when its text changes (`key={line}`) |

- [ ] **Step 1: Write the (small) failing test**

`src/design-system/broadcast/Chrome.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { AudioToggle } from "./AudioToggle";
import { CommentaryBar } from "./CommentaryBar";
import { HUD } from "./HUD";

describe("broadcast chrome", () => {
  it("AudioToggle exposes and flips its pressed state", async () => {
    const onToggle = vi.fn();
    const { rerender } = render(
      <AudioToggle name="Crowd audio" on={false} onToggle={onToggle} labelOn="CROWD ON" labelOff="CROWD OFF" />,
    );
    const btn = screen.getByRole("button", { name: "Crowd audio" });
    expect(btn).toHaveAttribute("aria-pressed", "false");
    expect(btn).toHaveTextContent("CROWD OFF");
    await userEvent.click(btn);
    expect(onToggle).toHaveBeenCalledOnce();
    rerender(<AudioToggle name="Crowd audio" on onToggle={onToggle} labelOn="CROWD ON" labelOff="CROWD OFF" />);
    expect(btn).toHaveAttribute("aria-pressed", "true");
    expect(btn).toHaveTextContent("CROWD ON");
  });

  it("CommentaryBar shows the tag and the current line", () => {
    render(<CommentaryBar tag="COMM" line="Still not out." />);
    expect(screen.getByText("COMM")).toHaveClass("bg-volt", "text-volt-ink");
    expect(screen.getByText("Still not out.")).toHaveClass("type-comm", "glass");
  });

  it("HUD is a banner landmark with three slots", () => {
    render(<HUD left={<span>L</span>} center={<span>C</span>} right={<span>R</span>} fade />);
    const banner = screen.getByRole("banner");
    expect(banner).toHaveClass("h-19", "from-ground-a85");
    expect(banner).toHaveTextContent("LCR");
  });
});
```
Run: `pnpm test src/design-system/broadcast/Chrome.test.tsx`. Expected: FAIL (modules missing).

- [ ] **Step 2: Implement**

`LiveDot.tsx`:
```tsx
import { cn } from "@/lib/cn";

const SIZE = { 6: "size-1.5", 8: "size-2", 10: "size-2.5" } as const;

/** Live signal dot — the only place live-red appears (never a fill). */
export function LiveDot({ size = 8, pulse = false, className }: { size?: 6 | 8 | 10; pulse?: boolean; className?: string }) {
  return (
    <span
      aria-hidden="true"
      className={cn("inline-block shrink-0 rounded-full bg-live", SIZE[size], pulse && "animate-live-pulse", className)}
    />
  );
}
```

`BrandLockup.tsx`:
```tsx
import type { ElementType, ReactNode } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";

const MARK = { lg: "size-9.5", md: "size-9", sm: "size-8.5" } as const;

type Own = { mark: string; label?: ReactNode; size?: "lg" | "md" | "sm" };

/** The YS mark + wordmark/breadcrumb. As a link, pass an aria-label naming the destination. */
export function BrandLockup<T extends ElementType = "div">({ as, mark, label, size = "lg", className, ...rest }: PolymorphicProps<T, Own>) {
  const Comp: ElementType = as ?? "div";
  return (
    <Comp className={cn("inline-flex items-center gap-3.5 text-scout", className)} {...rest}>
      <span
        className={cn(
          "inline-flex shrink-0 items-center justify-center border-(length:--bw-brand) border-volt type-d5 text-volt",
          MARK[size],
        )}
      >
        {mark}
      </span>
      {label ? <span className="type-mono-brand">{label}</span> : null}
    </Comp>
  );
}
```

`KeyboardHint.tsx`:
```tsx
import type { ComponentPropsWithRef } from "react";
import { cn } from "@/lib/cn";

export function KeyboardHint({ className, ...rest }: ComponentPropsWithRef<"p">) {
  return <p className={cn("type-mono-md text-dim", className)} {...rest} />;
}
```

`HUDButton.tsx`:
```tsx
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { Icon } from "../primitives/Icon";
import type { IconName } from "../primitives/icons";

/** Glass HUD control (QUICK VIEW, SKIP INTRO, REMATCH…). 44px tall. */
export function HUDButton<T extends ElementType = "button">({ as, icon, className, children, ...rest }: PolymorphicProps<T, { icon?: IconName }>) {
  const Comp: ElementType = as ?? "button";
  const typeProp = Comp === "button" ? { type: (rest as { type?: string }).type ?? "button" } : {};
  return (
    <Comp
      {...rest}
      {...typeProp}
      className={cn(
        "glass inline-flex h-11 cursor-pointer items-center gap-2.5 px-4 type-mono-md text-floodlight transition-colors duration-(--dur-snap) ease-snap hover:bg-white-a10",
        className,
      )}
    >
      {icon ? <Icon name={icon} /> : null}
      {children}
    </Comp>
  );
}
```

`AudioToggle.tsx`:
```tsx
import { IconButton } from "../primitives/IconButton";
import { HUDButton } from "./HUDButton";

interface AudioToggleProps {
  /** Accessible name, e.g. "Crowd audio". State is conveyed by aria-pressed. */
  name: string;
  on: boolean;
  onToggle: () => void;
  variant?: "labelled" | "icon";
  labelOn?: string;
  labelOff?: string;
  className?: string;
}

export function AudioToggle({ name, on, onToggle, variant = "labelled", labelOn, labelOff, className }: AudioToggleProps) {
  if (variant === "icon") {
    return <IconButton icon={on ? "speaker-loud" : "speaker-off"} label={name} pressed={on} onClick={onToggle} className={className} />;
  }
  return (
    <HUDButton icon={on ? "speaker-loud" : "speaker-off"} aria-label={name} aria-pressed={on} onClick={onToggle} className={className}>
      {on ? labelOn : labelOff}
    </HUDButton>
  );
}
```

`SkipChip.tsx`:
```tsx
import { cva } from "class-variance-authority";
import type { ElementType } from "react";
import { cn } from "@/lib/cn";
import type { PolymorphicProps } from "../lib/polymorphic";
import { Icon } from "../primitives/Icon";

const skipChip = cva(
  "inline-flex cursor-pointer items-center gap-2.5 text-floodlight transition-colors duration-(--dur-snap) ease-snap hover:text-volt",
  {
    variants: {
      variant: {
        game: "glass h-12 px-5 type-mono-md",
        hub: "h-11.5 border border-line-strong px-3.5 type-mono-tag hover:border-volt",
      },
    },
    defaultVariants: { variant: "game" },
  },
);

/** "SKIP TO …" — always visible in games, ≥44px. */
export function SkipChip<T extends ElementType = "a">({ as, variant, className, children, ...rest }: PolymorphicProps<T, { variant?: "game" | "hub" }>) {
  const Comp: ElementType = as ?? "a";
  return (
    <Comp className={cn(skipChip({ variant }), className)} {...rest}>
      {children}
      <Icon name="arrow-right" size={16} />
    </Comp>
  );
}
```

`PlayerTag.tsx`:
```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LiveDot } from "./LiveDot";

/** On-field pill: "YASH · ON STRIKE · 14*". */
export function PlayerTag({ live = true, children, className }: { live?: boolean; children: ReactNode; className?: string }) {
  return (
    <span className={cn("glass inline-flex items-center gap-2 px-2.5 py-1.5 type-mono-tag text-floodlight", className)}>
      {live ? <LiveDot size={6} /> : null}
      {children}
    </span>
  );
}
```

`HUD.tsx`:
```tsx
import type { ComponentPropsWithRef, ReactNode } from "react";
import { cn } from "@/lib/cn";

type HUDProps = { left?: ReactNode; center?: ReactNode; right?: ReactNode; fade?: boolean } & Omit<ComponentPropsWithRef<"header">, "children">;

/** The 76px top bar: brand left, score bug centre, controls right. Screens position it. */
export function HUD({ left, center, right, fade = false, className, ...rest }: HUDProps) {
  return (
    <header
      className={cn(
        "grid h-19 grid-cols-[1fr_auto_1fr] items-center gap-4 px-(--gutter)",
        fade && "bg-linear-180 from-ground-a85 to-transparent",
        className,
      )}
      {...rest}
    >
      <div className="flex min-w-0 items-center">{left}</div>
      <div className="flex items-center">{center}</div>
      <div className="flex items-center justify-end gap-2.5">{right}</div>
    </header>
  );
}
```

`CommentaryBar.tsx`:
```tsx
import { cn } from "@/lib/cn";

interface CommentaryBarProps {
  tag: string;
  line: string;
  variant?: "overlay" | "inline";
  className?: string;
}

/** Commentary lower-third. Purely visual — the 0D commentary service owns timing and the live region. */
export function CommentaryBar({ tag, line, variant = "overlay", className }: CommentaryBarProps) {
  return (
    <div className={cn("flex items-stretch", className)}>
      <span className={cn("flex items-center bg-volt type-mono-comm text-volt-ink", variant === "overlay" ? "px-3.5" : "px-3")}>{tag}</span>
      <span
        key={line}
        className={cn(
          "animate-comm-in flex items-center type-comm text-text-1",
          variant === "overlay" ? "glass px-4.5 py-3" : "bg-panel px-3.5 py-2.5",
        )}
      >
        {line}
      </span>
    </div>
  );
}
```
Run the test. Expected: pass.

- [ ] **Step 3: Story (one file, every piece and state)**

`src/design-system/broadcast/Chrome.stories.tsx`:
```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { useState } from "react";
import { AudioToggle } from "./AudioToggle";
import { BrandLockup } from "./BrandLockup";
import { CommentaryBar } from "./CommentaryBar";
import { HUD } from "./HUD";
import { HUDButton } from "./HUDButton";
import { KeyboardHint } from "./KeyboardHint";
import { LiveDot } from "./LiveDot";
import { PlayerTag } from "./PlayerTag";
import { SkipChip } from "./SkipChip";

const meta: Meta = { title: "Broadcast/Chrome" };
export default meta;

function Audio({ variant }: { variant: "labelled" | "icon" }) {
  const [on, setOn] = useState(true);
  return <AudioToggle name="Crowd audio" variant={variant} on={on} onToggle={() => setOn(!on)} labelOn="CROWD ON" labelOff="CROWD OFF" />;
}

export const GameHUD: StoryObj = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="relative h-40 bg-night">
      <HUD
        fade
        left={<BrandLockup as="a" href="#hub" aria-label="Back to Arena Hub" mark="YS" label="HUB / CRICKET GROUND" />}
        center={<span className="type-mono-tag text-scout">[score bug]</span>}
        right={
          <>
            <HUDButton as="a" href="#scout">
              QUICK VIEW
            </HUDButton>
            <Audio variant="icon" />
          </>
        }
      />
    </div>
  ),
};

export const LandingHUD: StoryObj = {
  parameters: { layout: "fullscreen" },
  render: () => (
    <div className="relative h-40 bg-night">
      <HUD left={<BrandLockup mark="YS" label="THE ARENA" />} right={<><Audio variant="labelled" /><HUDButton>SKIP INTRO</HUDButton></>} />
    </div>
  ),
};

export const Pieces: StoryObj = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <div className="flex items-center gap-4">
        <LiveDot /> <LiveDot size={6} pulse /> <LiveDot size={10} />
        <BrandLockup mark="YS" size="md" label="SCOUTING REPORT" />
        <BrandLockup mark="YS" size="sm" />
      </div>
      <PlayerTag>YASH · ON STRIKE · 14*</PlayerTag>
      <div className="flex gap-3">
        <SkipChip href="#career">SKIP TO CAREER STATS</SkipChip>
        <SkipChip href="#career" variant="hub">
          SKIP
        </SkipChip>
      </div>
      <CommentaryBar tag="COMM" line="New challenger enters the arena." />
      <CommentaryBar tag="COMM" variant="inline" line="Challenge received. I'll serve first." />
      <KeyboardHint>ENTER ↵ TO PLAY · Q FOR QUICK VIEW</KeyboardHint>
    </div>
  ),
};
```

- [ ] **Step 4: Export, verify, commit**

Append to `src/design-system/index.ts`:
```ts
export { LiveDot } from "./broadcast/LiveDot";
export { BrandLockup } from "./broadcast/BrandLockup";
export { KeyboardHint } from "./broadcast/KeyboardHint";
export { HUDButton } from "./broadcast/HUDButton";
export { AudioToggle } from "./broadcast/AudioToggle";
export { SkipChip } from "./broadcast/SkipChip";
export { PlayerTag } from "./broadcast/PlayerTag";
export { HUD } from "./broadcast/HUD";
export { CommentaryBar } from "./broadcast/CommentaryBar";
```
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "feat(design-system): add broadcast chrome (HUD, brand lockup, audio toggle, skip chip, commentary bar)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
(End of run A: `pnpm build-storybook && pnpm test:stories`, then `pnpm verify`.)

---

### Task 3: ScoreBug and Scoreboard

**Files:** create `src/design-system/broadcast/ScoreBug.tsx`, `Scoreboard.tsx`, `ScoreBug.test.tsx` and `Boards.stories.tsx`. Modify `index.ts`.

**Interfaces:**
- `ScoreBug` is a compound component.
  - Root: `ScoreBug({ label: string; size?: "md" | "sm"; children; className? })`. Renders `role="group"` with `aria-label={label}` (the readable summary, e.g. "Yash 14 not out, ball 2 of 3"). Height 44 (md) or 40 (sm).
  - Parts:
    - `ScoreBug.Name({ serving?: boolean })`: white chip with dark text
    - `ScoreBug.Cell({ muted?: boolean })`: score digits on a panel
    - `ScoreBug.Meta`: mono status like "BALL 2 OF 3"
    - `ScoreBug.Away({ tone?: "panel" | "line" })`: opponent chip
    - `ScoreBug.Status({ alert?: boolean })`: volt chip; `alert` = dark chip + live dot (spec A4)
- `Scoreboard` is a compound component.
  - Root: `Scoreboard({ className, children })`: LED panel (board bg + 4px dot grid, strong border, board shadow), flex column.
  - Parts:
    - `Scoreboard.Header({ children })`
    - `Scoreboard.Body({ children })`
    - `Scoreboard.Title({ children })`: hero LED text with glow
    - `Scoreboard.Subtitle({ children })`: volt sub with glow
    - `Scoreboard.Footer({ children })`: 3-column strip
    - `Scoreboard.FooterCell({ label: string; value: ReactNode; tone?: "primary" | "volt" | "label"; align?: "start" | "center" | "end" })`

- [ ] **Step 1: Failing test**

`src/design-system/broadcast/ScoreBug.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ScoreBug } from "./ScoreBug";

describe("ScoreBug", () => {
  it("is a labelled group summarising the score", () => {
    render(
      <ScoreBug label="Yash 14 not out, ball 2 of 3">
        <ScoreBug.Name>YASH</ScoreBug.Name>
        <ScoreBug.Cell>14*</ScoreBug.Cell>
        <ScoreBug.Meta>BALL 2 OF 3</ScoreBug.Meta>
        <ScoreBug.Away>YOU BOWLING</ScoreBug.Away>
      </ScoreBug>,
    );
    expect(screen.getByRole("group", { name: "Yash 14 not out, ball 2 of 3" })).toHaveClass("h-11");
    expect(screen.getByText("YASH")).toHaveClass("bg-floodlight", "text-ground");
  });

  it("alert status is never a red fill (spec A4)", () => {
    render(
      <ScoreBug label="Match point">
        <ScoreBug.Status alert>MATCH POINT</ScoreBug.Status>
      </ScoreBug>,
    );
    const chip = screen.getByText("MATCH POINT");
    expect(chip.className).not.toMatch(/bg-live/);
    expect(chip).toHaveClass("bg-panel", "text-floodlight");
    expect(chip.querySelector(".bg-live")).not.toBeNull();
  });

  it("small size shrinks the bar", () => {
    render(
      <ScoreBug label="x" size="sm">
        <ScoreBug.Cell>6*</ScoreBug.Cell>
      </ScoreBug>,
    );
    expect(screen.getByRole("group")).toHaveClass("h-10");
    expect(screen.getByText("6*")).toHaveClass("type-score");
  });
});
```
Run it. Expected: FAIL.

- [ ] **Step 2: Implement**

`ScoreBug.tsx`:
```tsx
import { createContext, useContext, type ReactNode } from "react";
import { cn } from "@/lib/cn";
import { LiveDot } from "./LiveDot";

type Size = "md" | "sm";
const SizeCtx = createContext<Size>("md");

function Root({ label, size = "md", children, className }: { label: string; size?: Size; children: ReactNode; className?: string }) {
  return (
    <SizeCtx.Provider value={size}>
      <div role="group" aria-label={label} className={cn("inline-flex items-stretch", size === "md" ? "h-11" : "h-10", className)}>
        {children}
      </div>
    </SizeCtx.Provider>
  );
}

function Name({ serving = false, children }: { serving?: boolean; children: ReactNode }) {
  const size = useContext(SizeCtx);
  return (
    <span className={cn("flex items-center gap-2 bg-floodlight text-ground", size === "md" ? "px-3.5 type-score" : "px-2.5 type-d5")}>
      {serving ? <span aria-hidden="true" className="size-1.75 rounded-full bg-volt" /> : null}
      {children}
    </span>
  );
}

function Cell({ muted = false, children }: { muted?: boolean; children: ReactNode }) {
  const size = useContext(SizeCtx);
  return (
    <span
      className={cn(
        "flex items-center bg-panel tabular-nums",
        size === "md" ? "px-4 type-score-lg" : "px-3 type-score",
        muted ? "border-l border-line text-scout" : "text-floodlight",
      )}
    >
      {children}
    </span>
  );
}

function Meta({ children }: { children: ReactNode }) {
  const size = useContext(SizeCtx);
  return (
    <span className={cn("flex items-center bg-line text-text-2", size === "md" ? "px-3.5 type-mono-tag" : "px-2.5 type-mono-xs")}>
      {children}
    </span>
  );
}

function Away({ tone = "panel", children }: { tone?: "panel" | "line"; children: ReactNode }) {
  const size = useContext(SizeCtx);
  return (
    <span
      className={cn(
        "flex items-center text-scout",
        tone === "panel" ? "border-l border-line bg-panel" : "bg-line",
        size === "md" ? "px-3.5 type-score" : "px-2.5 type-d5",
      )}
    >
      {children}
    </span>
  );
}

function Status({ alert = false, children }: { alert?: boolean; children: ReactNode }) {
  return (
    <span
      className={cn(
        "flex items-center gap-2 px-3 type-mono-comm",
        alert ? "bg-panel text-floodlight" : "bg-volt text-volt-ink",
      )}
    >
      {alert ? <LiveDot size={6} /> : null}
      {children}
    </span>
  );
}

/** The broadcast score bug (top-centre in every game). */
export const ScoreBug = Object.assign(Root, { Name, Cell, Meta, Away, Status });
```

`Scoreboard.tsx`:
```tsx
import type { ReactNode } from "react";
import { cn } from "@/lib/cn";
import { MonoLabel } from "../primitives/Text";

function Root({ className, children }: { className?: string; children: ReactNode }) {
  return (
    <div className={cn("relative flex flex-col overflow-hidden border border-line-strong bg-board led-dots shadow-board", className)}>
      {children}
    </div>
  );
}

function Header({ children }: { children: ReactNode }) {
  return (
    <div className="flex h-13 shrink-0 items-center justify-between border-b border-board-line px-7 type-mono-eyebrow text-scout">
      {children}
    </div>
  );
}

function Body({ children }: { children: ReactNode }) {
  return <div className="flex flex-1 flex-col items-center justify-center gap-3.5">{children}</div>;
}

function Title({ children }: { children: ReactNode }) {
  return <span className="type-hero text-led glow-led">{children}</span>;
}

function Subtitle({ children }: { children: ReactNode }) {
  // Padding-left equal to the tracking keeps wide-tracked text optically centred.
  return <span className="pl-[0.42em] type-sub text-volt glow-volt">{children}</span>;
}

function Footer({ children }: { children: ReactNode }) {
  return <div className="grid h-17.5 shrink-0 grid-cols-3 border-t border-board-line">{children}</div>;
}

const VALUE_TONE = { primary: "text-floodlight", volt: "text-volt", label: "text-scout" } as const;
const ALIGN = { start: "px-7", center: "justify-center border-x border-board-line", end: "justify-end px-7" } as const;

function FooterCell({ label, value, tone = "primary", align = "start" }: { label: string; value: ReactNode; tone?: keyof typeof VALUE_TONE; align?: keyof typeof ALIGN }) {
  return (
    <div className={cn("flex items-center gap-3.5", ALIGN[align])}>
      <MonoLabel tone="dim">{label}</MonoLabel>
      <span className={cn("type-score-lg", VALUE_TONE[tone])}>{value}</span>
    </div>
  );
}

/** The LED stadium scoreboard (Landing, Intro, mobile landing). Size it with className. */
export const Scoreboard = Object.assign(Root, { Header, Body, Title, Subtitle, Footer, FooterCell });
```
Run the test. Expected: pass.

- [ ] **Step 3: Stories**

`src/design-system/broadcast/Boards.stories.tsx`:
```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { LiveDot } from "./LiveDot";
import { ScoreBug } from "./ScoreBug";
import { Scoreboard } from "./Scoreboard";

const meta: Meta = { title: "Broadcast/Boards" };
export default meta;

export const ScoreBugs: StoryObj = {
  render: () => (
    <div className="flex flex-col items-start gap-6">
      <ScoreBug label="Yash 14 not out, ball 2 of 3">
        <ScoreBug.Name>YASH</ScoreBug.Name>
        <ScoreBug.Cell>14*</ScoreBug.Cell>
        <ScoreBug.Meta>BALL 2 OF 3</ScoreBug.Meta>
        <ScoreBug.Away>YOU BOWLING</ScoreBug.Away>
      </ScoreBug>
      <ScoreBug label="Yash serving, 40–30, rally 3">
        <ScoreBug.Name serving>YASH</ScoreBug.Name>
        <ScoreBug.Cell>40</ScoreBug.Cell>
        <ScoreBug.Cell muted>30</ScoreBug.Cell>
        <ScoreBug.Away tone="line">YOU</ScoreBug.Away>
        <ScoreBug.Status>RALLY 3</ScoreBug.Status>
      </ScoreBug>
      <ScoreBug label="Match point, 20–19">
        <ScoreBug.Name>YASH</ScoreBug.Name>
        <ScoreBug.Cell>20</ScoreBug.Cell>
        <ScoreBug.Cell muted>19</ScoreBug.Cell>
        <ScoreBug.Away tone="line">YOU</ScoreBug.Away>
        <ScoreBug.Status alert>MATCH POINT</ScoreBug.Status>
      </ScoreBug>
      <ScoreBug label="Yash 6 not out, you bowling, 2 of 3" size="sm">
        <ScoreBug.Name>YASH</ScoreBug.Name>
        <ScoreBug.Cell>6*</ScoreBug.Cell>
        <ScoreBug.Meta>YOU BOWLING · 2/3</ScoreBug.Meta>
      </ScoreBug>
    </div>
  ),
};

export const LandingScoreboard: StoryObj = {
  render: () => (
    <Scoreboard className="h-93 w-225">
      <Scoreboard.Header>
        <span className="flex items-center gap-2.5">
          <LiveDot pulse /> LIVE · THE ARENA
        </span>
        <span>PLAYER 01 / 01</span>
      </Scoreboard.Header>
      <Scoreboard.Body>
        <Scoreboard.Title>YASH SARDA</Scoreboard.Title>
        <Scoreboard.Subtitle>SOFTWARE ENGINEER</Scoreboard.Subtitle>
      </Scoreboard.Body>
      <Scoreboard.Footer>
        <Scoreboard.FooterCell label="HOME" value="YASH" />
        <Scoreboard.FooterCell label="STATUS" value="UNDEFEATED" tone="volt" align="center" />
        <Scoreboard.FooterCell label="AWAY" value="YOU?" tone="label" align="end" />
      </Scoreboard.Footer>
    </Scoreboard>
  ),
};
```

- [ ] **Step 4: Export, commit**

Append to the barrel: `export { ScoreBug } from "./broadcast/ScoreBug";` and `export { Scoreboard } from "./broadcast/Scoreboard";`
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "feat(design-system): add ScoreBug and LED Scoreboard

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

### Task 4: SegmentBar, SkillRow, StatTile (with no-flicker count-up)

**Files:** create `src/design-system/broadcast/SegmentBar.tsx`, `SkillRow.tsx`, `StatTile.tsx`, `useCountUp.ts`, `StatTile.test.tsx` and `Stats.stories.tsx`. Modify `index.ts`.

**Interfaces:**
- `SegmentBar({ level: "shipped" | "built" | "kit"; label: string; animate?: boolean; size?: "md" | "sm"; className? })`
  - 10 cells. shipped = 9 volt, built = 7 floodlight, kit = 5 dim.
  - `role="img"` with `aria-label={label}`. Evidence, never a percentage (spec §7).
  - Cell height 10px (md) or 8px (sm), gap `--seg-gap`.
- `SkillRow({ name: string; level; tierLabel: string; animate?: boolean; className? })`: grid `130px | 1fr | 92px`. The tier label is coloured by level. The bar's label is `${name}: ${tierLabel}`.
- `StatTile({ label: string; value: string; tone?: "glass" | "volt" | "cell"; countUp?: boolean; className? })`.
- `parseStat(value: string): { prefix: string; number: number; decimals: number; suffix: string } | null`.
- `useCountUp(target: number, decimals: number, enabled: boolean, ref: RefObject<Element | null>): string`. Rules:
  1. Returns the final value on the server and on first render.
  2. Never animates with reduced motion, or if the element is already in the viewport when it mounts.
  3. Otherwise it zeroes the value while the element is still just below the viewport, then counts up over 900ms (ease-out cubic) once it's 40% visible.

- [ ] **Step 1: Failing tests (logic only)**

`src/design-system/broadcast/StatTile.test.tsx`:
```tsx
import { render, screen } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { StatTile, parseStat } from "./StatTile";

describe("parseStat", () => {
  it.each([
    ["750+", { prefix: "", number: 750, decimals: 0, suffix: "+" }],
    ["8.94", { prefix: "", number: 8.94, decimals: 2, suffix: "" }],
    ["10K+", { prefix: "", number: 10, decimals: 0, suffix: "K+" }],
    ["99.5", { prefix: "", number: 99.5, decimals: 1, suffix: "" }],
  ])("%s", (input, expected) => {
    expect(parseStat(input)).toEqual(expected);
  });

  it("returns null for non-numeric values", () => {
    expect(parseStat("DEUTSCHE")).toBeNull();
  });
});

describe("StatTile count-up", () => {
  let observe: ReturnType<typeof vi.fn>;
  beforeEach(() => {
    observe = vi.fn();
    vi.stubGlobal(
      "IntersectionObserver",
      vi.fn(() => ({ observe, disconnect: vi.fn(), unobserve: vi.fn() })),
    );
  });
  afterEach(() => vi.unstubAllGlobals());

  it("always exposes the final value to screen readers", () => {
    render(<StatTile label="PROBLEMS" value="750+" countUp />);
    expect(screen.getByText("750+", { selector: ".sr-only" })).toBeInTheDocument();
  });

  it("shows the final value when the tile is already on screen (no flicker)", () => {
    // jsdom reports a 0×0 rect at the top: treated as "in viewport" at mount.
    render(<StatTile label="PROBLEMS" value="750+" countUp />);
    expect(screen.getByText("750+", { selector: "[aria-hidden='true']" })).toBeInTheDocument();
    expect(observe).not.toHaveBeenCalled();
  });

  it("does not animate with reduced motion", () => {
    vi.stubGlobal("matchMedia", (q: string) => ({ matches: q.includes("reduce"), media: q, addEventListener() {}, removeEventListener() {} }));
    render(<StatTile label="CGPA" value="8.94" countUp />);
    expect(screen.getByText("8.94", { selector: "[aria-hidden='true']" })).toBeInTheDocument();
    expect(observe).not.toHaveBeenCalled();
  });
});
```
Run it. Expected: FAIL.

- [ ] **Step 2: Implement**

`useCountUp.ts`:
```ts
import { useEffect, useState, type RefObject } from "react";

const DURATION = 900; // --dur-count

function inViewport(el: Element) {
  const r = el.getBoundingClientRect();
  return r.top < window.innerHeight && r.bottom >= 0;
}

/** Count up to `target` once the element scrolls into view. Never flickers prerendered values (spec §6). */
export function useCountUp(target: number, decimals: number, enabled: boolean, ref: RefObject<Element | null>): string {
  const [value, setValue] = useState(target);

  useEffect(() => {
    const el = ref.current;
    if (!enabled || !el) return;
    if (window.matchMedia?.("(prefers-reduced-motion: reduce)").matches) return;
    if (inViewport(el)) return;

    let raf = 0;
    // Zero the number while it is still just below the fold, so the reset is never seen…
    const arm = new IntersectionObserver(
      ([entry]) => {
        if (!entry?.isIntersecting) return;
        arm.disconnect();
        setValue(0);
        // …then count up once it is properly visible.
        const play = new IntersectionObserver(
          ([e]) => {
            if (!e?.isIntersecting) return;
            play.disconnect();
            const t0 = performance.now();
            const tick = (now: number) => {
              const p = Math.min(1, (now - t0) / DURATION);
              setValue(target * (1 - (1 - p) ** 3));
              if (p < 1) raf = requestAnimationFrame(tick);
            };
            raf = requestAnimationFrame(tick);
          },
          { threshold: 0.4 },
        );
        play.observe(el);
      },
      { rootMargin: "0px 0px 25% 0px" },
    );
    arm.observe(el);
    return () => {
      arm.disconnect();
      cancelAnimationFrame(raf);
    };
  }, [target, enabled, ref]);

  return value.toFixed(decimals);
}
```
(The inner observer is created inside the callback, so it isn't disconnected by the cleanup. If that leaks in testing, hoist it into an outer `let play: IntersectionObserver | undefined` and disconnect it in cleanup. Do that hoist regardless; it's correct.)

`StatTile.tsx`:
```tsx
import { cva } from "class-variance-authority";
import { useRef } from "react";
import { cn } from "@/lib/cn";
import { useCountUp } from "./useCountUp";

export function parseStat(value: string) {
  const m = /^(\D*)(\d+(?:\.\d+)?)(.*)$/.exec(value);
  if (!m) return null;
  const num = m[2]!;
  return { prefix: m[1]!, number: Number(num), decimals: num.includes(".") ? num.split(".")[1]!.length : 0, suffix: m[3]! };
}

const tile = cva("flex flex-col gap-0.5", {
  variants: {
    tone: {
      glass: "glass w-42.5 px-4.5 py-3.5",
      volt: "w-42.5 bg-volt px-4.5 py-3.5",
      cell: "bg-inset p-2.5",
    },
  },
  defaultVariants: { tone: "glass" },
});
const LABEL = { glass: "type-mono-label text-scout", volt: "type-mono-label text-volt-ink-2", cell: "type-mono-xs text-scout" } as const;
const VALUE = { glass: "type-stat text-floodlight", volt: "type-stat text-volt-ink", cell: "type-d4s text-floodlight" } as const;

interface StatTileProps {
  label: string;
  value: string;
  tone?: "glass" | "volt" | "cell";
  countUp?: boolean;
  className?: string;
}

/** A labelled stat. With countUp, digits tick up on scroll-in; screen readers always get the final value. */
export function StatTile({ label, value, tone = "glass", countUp = false, className }: StatTileProps) {
  const ref = useRef<HTMLDivElement>(null);
  const parsed = parseStat(value);
  const shown = useCountUp(parsed?.number ?? 0, parsed?.decimals ?? 0, countUp && parsed !== null, ref);
  const display = parsed && countUp ? `${parsed.prefix}${shown}${parsed.suffix}` : value;
  return (
    <div ref={ref} className={cn(tile({ tone }), className)}>
      <span className={LABEL[tone]}>{label}</span>
      <span className={cn(VALUE[tone], "tabular-nums")}>
        <span className="sr-only">{value}</span>
        <span aria-hidden="true">{display}</span>
      </span>
    </div>
  );
}
```

`SegmentBar.tsx`:
```tsx
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

type Level = "shipped" | "built" | "kit";
const FILLED: Record<Level, number> = { shipped: 9, built: 7, kit: 5 };
const FILL: Record<Level, string> = { shipped: "bg-volt", built: "bg-floodlight", kit: "bg-dim" };

interface SegmentBarProps {
  level: Level;
  /** Evidence in words, e.g. "Java: shipped in production". */
  label: string;
  animate?: boolean;
  size?: "md" | "sm";
  className?: string;
}

/** 10-segment evidence bar — never a percentage (spec §7). */
export function SegmentBar({ level, label, animate = false, size = "md", className }: SegmentBarProps) {
  return (
    <div role="img" aria-label={label} className={cn("flex gap-(--seg-gap)", className)}>
      {Array.from({ length: 10 }, (_, i) => (
        <span
          key={i}
          className={cn("flex-1", size === "md" ? "h-2.5" : "h-2", i < FILLED[level] ? FILL[level] : "bg-seg-empty", animate && "animate-seg-fill")}
          style={animate ? ({ "--i": i } as CSSProperties) : undefined}
        />
      ))}
    </div>
  );
}
```

`SkillRow.tsx`:
```tsx
import { cn } from "@/lib/cn";
import { SegmentBar } from "./SegmentBar";

const TIER = { shipped: "text-volt", built: "text-floodlight", kit: "text-dim" } as const;

interface SkillRowProps {
  name: string;
  level: "shipped" | "built" | "kit";
  tierLabel: string;
  animate?: boolean;
  className?: string;
}

export function SkillRow({ name, level, tierLabel, animate, className }: SkillRowProps) {
  return (
    <div className={cn("grid grid-cols-[130px_1fr_92px] items-center gap-3.5", className)}>
      <span className="type-mono-md normal-case tracking-normal text-floodlight">{name}</span>
      <SegmentBar level={level} label={`${name}: ${tierLabel}`} animate={animate} />
      <span className={cn("text-right type-mono-tag", TIER[level])}>{tierLabel}</span>
    </div>
  );
}
```
(`tracking-normal` may not exist because the tracking scale is reset. If the build lacks it, drop it and keep `normal-case`.)

Run the tests. Expected: pass.

- [ ] **Step 3: Stories**

`src/design-system/broadcast/Stats.stories.tsx`:
```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Glass } from "../primitives/Glass";
import { SkillRow } from "./SkillRow";
import { StatTile } from "./StatTile";

const meta: Meta = { title: "Broadcast/Stats" };
export default meta;

export const Tiles: StoryObj = {
  render: () => (
    <div className="flex flex-col gap-6">
      <div className="flex gap-3">
        <StatTile label="PRO SINCE" value="JUL 2024" />
        <StatTile label="PROBLEMS" value="750+" countUp />
        <StatTile label="CURRENT" value="NOT OUT" tone="volt" />
      </div>
      <div className="grid w-100 grid-cols-3 gap-px bg-line">
        <StatTile tone="cell" label="CGPA" value="8.94" />
        <StatTile tone="cell" label="CET %ILE" value="99.5" />
        <StatTile tone="cell" label="RECORDS" value="10K+" />
      </div>
    </div>
  ),
};

export const Skills: StoryObj = {
  render: () => (
    <Glass pad="md" className="flex w-130 flex-col gap-3">
      <SkillRow name="Java" level="shipped" tierLabel="SHIPPED" animate />
      <SkillRow name="JUnit" level="shipped" tierLabel="75+ TESTS" animate />
      <SkillRow name="JavaScript" level="built" tierLabel="BUILT" animate />
      <SkillRow name="Apache Kafka" level="kit" tierLabel="KIT BAG" animate />
    </Glass>
  ),
};
```

- [ ] **Step 4: Export, commit**

Barrel:
```ts
export { SegmentBar } from "./broadcast/SegmentBar";
export { SkillRow } from "./broadcast/SkillRow";
export { StatTile, parseStat } from "./broadcast/StatTile";
export { useCountUp } from "./broadcast/useCountUp";
```
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test
git add -A
git commit -m "feat(design-system): add SegmentBar, SkillRow and count-up StatTile

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```
(End of run B: `pnpm build-storybook && pnpm test:stories`, then `pnpm verify`.)

---

### Task 5: Stadium scene + Landing fidelity check

**Files:** create `src/design-system/scene/{SkyGlow,VenueGlow,CrowdTier,LightCone,FloodlightBank,FloodlightMast,Field,PitchGlow,ArenaBackdrop}.tsx`, `src/design-system/scene/Scene.stories.tsx` and `tests/stories/scene.spec.ts`. Modify `index.ts`.

**Interfaces** (all `aria-hidden`, `pointer-events-none`, absolutely positioned; callers place them with `className`):

| Component | Props | Notes |
|---|---|---|
| `SkyGlow` | `{ x?: string; y?: string; w?: string; h?: string; alpha?: number; className? }` | Defaults: Main sky (75% 50% at 50% 0, .20) |
| `VenueGlow` | same shape, `alpha` default .4 | Tinted by `data-venue` |
| `CrowdTier` | `{ alpha?: number; curved?: boolean; className? }` | Dot crowd; warm under `data-venue="hall"` |
| `LightCone` | `{ side: "left" \| "right" \| "down"; alpha?: number; className? }` | |
| `FloodlightBank` | `{ size?: "lg" \| "sm" \| "mini" \| "mobile"; on?: boolean; flickerDelay?: number; className? }` | `flickerDelay` in seconds; flickers on once when set |
| `FloodlightMast` | `{ className? }` | |
| `Field` | `{ tilt?: number; className? }` | Perspective wrapper + turf plane |
| `PitchGlow` | `{ className? }` | |
| `ArenaBackdrop` | `{ variant?: "landing"; className? }` | Main's full stadium in a 1440×900 box, night ground, `data-venue="turf"`. 0D's `<Stage>` scales it |

Main positions (audit §4, Main artboard):

| Layer | Position and size |
|---|---|
| Sky | 75% 50% at 50% 0, α .20 |
| Crowd | left/right −120, top 380, height 360, α .30, curved, opacity .7 |
| Field | wrapper top 600, height 420, perspective 900; plane 1240×760, rotateX 70° |
| Pitch glow | 684, 640, 72×200 |
| Cones | left: 60, 70, 520×760, α .16; right: right 60, 70, same |
| Masts | left 150 / right 150, top 118, 2×300 |
| Banks | lg at left 96 top 70 (delay .6s); sm at left 356 top 40 (1.1s); sm at right 356 top 40 (1.6s); lg at right 96 top 70 (2.0s) |

- [ ] **Step 1: Implement the layers**

Shared pattern (example `SkyGlow.tsx`; repeat for VenueGlow with `--glow-*` vars and `scene-venue-glow`):
```tsx
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

interface GlowProps {
  x?: string;
  y?: string;
  w?: string;
  h?: string;
  alpha?: number;
  className?: string;
}

export function SkyGlow({ x = "50%", y = "0%", w = "75%", h = "50%", alpha = 0.2, className }: GlowProps) {
  const style = { "--sky-x": x, "--sky-y": y, "--sky-w": w, "--sky-h": h, "--sky-a": alpha } as CSSProperties;
  return <div aria-hidden="true" className={cn("pointer-events-none absolute inset-0 scene-sky", className)} style={style} />;
}
```
`VenueGlow.tsx`: same, but with defaults `x="50%" y="110%" w="80%" h="50%" alpha=0.4`, vars `--glow-x/-y/-w/-h/-a`, class `scene-venue-glow`.

`CrowdTier.tsx`:
```tsx
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

export function CrowdTier({ alpha = 0.3, curved = false, className }: { alpha?: number; curved?: boolean; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute scene-crowd opacity-70", curved && "[border-radius:50%_50%_0_0/60%_60%_0_0]", className)}
      style={{ "--crowd-a": alpha } as CSSProperties}
    />
  );
}
```

`LightCone.tsx`:
```tsx
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

const SIDE = { left: "scene-cone-left", right: "scene-cone-right", down: "scene-cone-down" } as const;

export function LightCone({ side, alpha = 0.16, className }: { side: keyof typeof SIDE; alpha?: number; className?: string }) {
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute scene-cone", SIDE[side], className)}
      style={{ "--cone-a": alpha } as CSSProperties}
    />
  );
}
```

`FloodlightBank.tsx`:
```tsx
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

// Bulb radius/grid per size (audit §4 floodlight bank).
const SIZE = {
  lg: "h-12 w-28 shadow-bank-lg [--bulb-r1:2.6px] [--bulb-r2:3.6px] [--bulb-gx:12px] [--bulb-gy:11px]",
  sm: "h-9 w-21 shadow-bank-sm [--bulb-r1:2.4px] [--bulb-r2:3.4px] [--bulb-gx:12px] [--bulb-gy:11px]",
  mini: "h-4.5 w-11.5 shadow-bank-mini [--bulb-r1:1.6px] [--bulb-r2:2.4px] [--bulb-gx:7px] [--bulb-gy:6px]",
  mobile: "h-5.5 w-15 shadow-bank-mini [--bulb-r1:1.8px] [--bulb-r2:2.8px] [--bulb-gx:9px] [--bulb-gy:8px]",
} as const;

interface FloodlightBankProps {
  size?: keyof typeof SIZE;
  on?: boolean;
  /** Seconds before this bank flickers on (Landing: .6 / 1.1 / 1.6 / 2.0). Omit for steady. */
  flickerDelay?: number;
  className?: string;
}

export function FloodlightBank({ size = "lg", on = true, flickerDelay, className }: FloodlightBankProps) {
  const flicker = on && flickerDelay !== undefined;
  return (
    <div
      aria-hidden="true"
      className={cn("pointer-events-none absolute scene-bank", SIZE[size], !on && "scene-bank-off", flicker && "animate-bank-flicker", className)}
      style={flicker ? ({ "--flicker-delay": `${flickerDelay}s` } as CSSProperties) : undefined}
    />
  );
}
```

`FloodlightMast.tsx`:
```tsx
import { cn } from "@/lib/cn";

export function FloodlightMast({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("pointer-events-none absolute h-75 w-0.5 scene-mast", className)} />;
}
```

`Field.tsx`:
```tsx
import type { CSSProperties } from "react";
import { cn } from "@/lib/cn";

/** Turf oval in perspective (Landing/Intro). Position the wrapper with className. */
export function Field({ tilt = 70, className }: { tilt?: number; className?: string }) {
  return (
    <div aria-hidden="true" className={cn("pointer-events-none absolute inset-x-0 [perspective:900px]", className)}>
      <div className="mx-auto h-190 w-310 scene-field" style={{ "--field-tilt": `${tilt}deg` } as CSSProperties} />
    </div>
  );
}
```

`PitchGlow.tsx`:
```tsx
import { cn } from "@/lib/cn";

export function PitchGlow({ className }: { className?: string }) {
  return <div aria-hidden="true" className={cn("pointer-events-none absolute scene-pitch-glow", className)} />;
}
```

`ArenaBackdrop.tsx`:
```tsx
import { cn } from "@/lib/cn";
import { CrowdTier } from "./CrowdTier";
import { Field } from "./Field";
import { FloodlightBank } from "./FloodlightBank";
import { FloodlightMast } from "./FloodlightMast";
import { LightCone } from "./LightCone";
import { PitchGlow } from "./PitchGlow";
import { SkyGlow } from "./SkyGlow";

/** Main's floodlit stadium, laid out in the 1440×900 design space (0D's <Stage> scales it). */
export function ArenaBackdrop({ className }: { variant?: "landing"; className?: string }) {
  return (
    <div aria-hidden="true" data-venue="turf" className={cn("pointer-events-none relative h-225 w-360 overflow-hidden bg-night", className)}>
      <SkyGlow />
      <CrowdTier curved className="-inset-x-30 top-95 h-90" />
      <Field className="top-150 h-105" />
      <PitchGlow className="left-171 top-160 h-50 w-18" />
      <LightCone side="left" className="left-15 top-17.5 h-190 w-130" />
      <LightCone side="right" className="right-15 top-17.5 h-190 w-130" />
      <FloodlightMast className="left-37.5 top-29.5" />
      <FloodlightMast className="right-37.5 top-29.5" />
      <FloodlightBank size="lg" flickerDelay={0.6} className="left-24 top-17.5" />
      <FloodlightBank size="sm" flickerDelay={1.1} className="left-89 top-10" />
      <FloodlightBank size="sm" flickerDelay={1.6} className="right-89 top-10" />
      <FloodlightBank size="lg" flickerDelay={2} className="right-24 top-17.5" />
    </div>
  );
}
```
(Spacing check: Tailwind's 4px scale maps 96→24, 356→89, 70→17.5, 40→10, 150→37.5, 118→29.5, 60→15, 520→130, 760→190, 380→95, 360→90, 600→150, 420→105, 684→171, 640→160, 72→18, 200→50, 1240→310, 900→225, 1440→360. If any isn't generated, use the arbitrary form, e.g. `left-[684px]`.)

- [ ] **Step 2: Stories, including the fidelity composition**

`src/design-system/scene/Scene.stories.tsx`:
```tsx
import type { Meta, StoryObj } from "@storybook/react-vite";
import { LiveDot } from "../broadcast/LiveDot";
import { Scoreboard } from "../broadcast/Scoreboard";
import { ArenaBackdrop } from "./ArenaBackdrop";
import { CrowdTier } from "./CrowdTier";
import { FloodlightBank } from "./FloodlightBank";
import { VenueGlow } from "./VenueGlow";

const meta: Meta = { title: "Scene/Stadium", parameters: { layout: "fullscreen" } };
export default meta;

/** The Landing stadium + scoreboard at artboard positions — compared to Main@1440x900. */
export const LandingFidelity: StoryObj = {
  render: () => (
    <div className="relative h-225 w-360">
      <ArenaBackdrop />
      <Scoreboard className="absolute left-67.5 top-35 h-93 w-225">
        <Scoreboard.Header>
          <span className="flex items-center gap-2.5">
            <LiveDot /> LIVE · THE ARENA
          </span>
          <span>PLAYER 01 / 01</span>
        </Scoreboard.Header>
        <Scoreboard.Body>
          <Scoreboard.Title>YASH SARDA</Scoreboard.Title>
          <Scoreboard.Subtitle>SOFTWARE ENGINEER</Scoreboard.Subtitle>
        </Scoreboard.Body>
        <Scoreboard.Footer>
          <Scoreboard.FooterCell label="HOME" value="YASH" />
          <Scoreboard.FooterCell label="STATUS" value="UNDEFEATED" tone="volt" align="center" />
          <Scoreboard.FooterCell label="AWAY" value="YOU?" tone="label" align="end" />
        </Scoreboard.Footer>
      </Scoreboard>
    </div>
  ),
};

/** Same markup re-tinted by venue attribute. */
export const Venues: StoryObj = {
  render: () => (
    <div className="grid grid-cols-3">
      {(["turf", "court", "hall"] as const).map((venue) => (
        <div key={venue} data-venue={venue} className="relative h-80 overflow-hidden bg-ground">
          <VenueGlow y="100%" alpha={0.5} />
          <CrowdTier className="inset-x-0 top-10 h-40" alpha={0.3} />
          <FloodlightBank size="mini" className="left-10 top-4" />
          <FloodlightBank size="mini" on={false} className="right-10 top-4" />
          <span className="absolute bottom-4 left-4 type-mono-label text-scout">{venue}</span>
        </div>
      ))}
    </div>
  ),
};
```

- [ ] **Step 3: Fidelity test**

`tests/stories/scene.spec.ts`:
```ts
import { expect, test } from "@playwright/test";
import { expectMatchesArtboard } from "../support/visual";

const story = (id: string) => `/iframe.html?id=${id}&viewMode=story&globals=a11y.manual:!true`;

test("Landing stadium + scoreboard match the Main artboard", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "desktop", "Main is a 1440×900 board");
  await page.goto(story("scene-stadium--landing-fidelity"));
  await page.locator("#storybook-root > *").first().waitFor();
  // Let the floodlight flicker finish (last bank at 2.0s + 1.6s).
  await page.waitForTimeout(3800);
  const ratio = await expectMatchesArtboard(page, "Main", {
    maxDiffRatio: 0.04,
    maskRects: [
      { x: 0, y: 0, width: 1440, height: 76 }, // HUD (0D/Phase 3)
      { x: 360, y: 540, width: 720, height: 170 }, // challenge line + CTAs (Phase 3)
      { x: 30, y: 815, width: 400, height: 60 }, // commentary (Phase 3)
      { x: 1080, y: 828, width: 340, height: 32 }, // keyboard hint (Phase 3)
      { x: 560, y: 368, width: 320, height: 52 }, // subtitle: reference shows collapsed boot tracking (carry-over, Phase 3)
    ],
  });
  expect(ratio).toBeLessThanOrEqual(0.04);
});
```
Run: `pnpm references Main && pnpm build-storybook && pnpm test:stories -- tests/stories/scene.spec.ts --project=desktop`.

If the ratio is above 4%, open `test-results/visual/Main@1440x900.diff.png` and fix the layer that differs, using the artboard's exact values (`design/handoff/design-source/Main.dc.html`). Up to 3 focused attempts. Then report the final ratio and what still differs, rather than loosening the threshold.

- [ ] **Step 4: Export, verify, commit**

Barrel:
```ts
export { SkyGlow } from "./scene/SkyGlow";
export { VenueGlow } from "./scene/VenueGlow";
export { CrowdTier } from "./scene/CrowdTier";
export { LightCone } from "./scene/LightCone";
export { FloodlightBank } from "./scene/FloodlightBank";
export { FloodlightMast } from "./scene/FloodlightMast";
export { Field } from "./scene/Field";
export { PitchGlow } from "./scene/PitchGlow";
export { ArenaBackdrop } from "./scene/ArenaBackdrop";
```
```bash
pnpm format && pnpm lint && pnpm typecheck && pnpm test && pnpm verify
git add -A
git commit -m "feat(design-system): add stadium scene layers and Landing backdrop (matches Main artboard)

Co-Authored-By: Claude Sonnet 5.5 <noreply@anthropic.com>"
```

---

## Phase 0C exit checklist (orchestrator)

- [ ] `pnpm verify` green. The fidelity diff is ≤4% and its ratio is recorded.
- [ ] Orchestrator views `Broadcast/Chrome`, `Broadcast/Boards`, `Broadcast/Stats`, `Scene/Stadium` (both stories), and the fidelity diff image if one exists.
- [ ] One Opus review of 0C (with at most one fix wave), then Yash's merge OK, then the 0D plan.

---

## Trivia: terms used in this plan

- **Score bug:** the small score graphic pinned to the top of a sports broadcast.
- **Lower-third:** a caption bar in the bottom third of a TV screen. Here it's the "COMM" commentary line.
- **Compound component:** one component with named sub-parts (`ScoreBug.Name`, `ScoreBug.Cell`), so screens can assemble different layouts from the same pieces.
- **CSS custom property:** a variable inside CSS (like `--sky-a`). Components set numbers, and the stylesheet decides colours, so tokens stay in charge.
- **`aria-hidden` / decorative:** tells screen readers to skip something purely visual, like stadium lights.
- **IntersectionObserver:** a browser feature that reports when an element scrolls into view. It's how the stat count-up knows when to start.
- **Fidelity diff:** an automatic pixel comparison between our rebuilt screen and your original design, with known-unfinished regions masked out.
