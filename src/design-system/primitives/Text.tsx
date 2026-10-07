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
      lede: "type-lede",
      section: "type-section",
      "section-sm": "type-section-sm",
      band: "type-band",
      "title-lg": "type-title-lg",
      title: "type-title",
      "title-sm": "type-title-sm",
      "title-detail": "type-title-detail",
      "title-reel": "type-title-reel",
      "title-panel": "type-title-panel",
      "title-shelf": "type-title-shelf",
      monogram: "type-monogram",
      name: "type-name",
      "mono-note": "type-mono-note",
      "title-group": "type-title-group",
      "mono-run": "type-mono-run",
      "card-position": "type-card-position",
      "card-name": "type-card-name",
      "action-lg": "type-action-lg",
      action: "type-action",
      channel: "type-channel",
      "draw-name": "type-draw-name",
      "btn-heavy": "type-btn-heavy",
      "btn-bar": "type-btn-bar",
      "mono-nav": "type-mono-nav",
      "mono-chip": "type-mono-chip",
      "mono-round": "type-mono-round",
      "mono-date": "type-mono-date",
      "mono-stack": "type-mono-stack",
      "mono-meta": "type-mono-meta",
      "mono-kicker": "type-mono-kicker",
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
      "body-copy": "type-body-copy",
      "body-sm": "type-body-sm",
      "body-cell": "type-body-cell",
      "body-deck": "type-body-deck",
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
    // The line box. `recipe` keeps the recipe's own line-height. `font` is the font's own line box
    // (`line-height: normal`): what an artboard span with no line-height draws. This is the only way
    // to say it, so screens never write `leading-*` themselves.
    leading: { recipe: "", font: "leading-auto" },
    // Uppercase, for recipes that are mixed-case by default (the mono "stack" face) and content stored in sentence case.
    caps: { true: "uppercase", false: "" },
  },
  defaultVariants: { variant: "body", leading: "recipe", caps: false },
});

export type TypeVariant = NonNullable<Parameters<typeof textVariants>[0]>["variant"] & string;
export type TextTone = NonNullable<NonNullable<Parameters<typeof textVariants>[0]>["tone"]>;
export type TextLeading = NonNullable<NonNullable<Parameters<typeof textVariants>[0]>["leading"]>;
export type MonoVariant = Extract<TypeVariant, `mono-${string}`>;

type TextOwnProps = {
  variant?: TypeVariant;
  tone?: TextTone;
  /** "font" = the font's own line box (an artboard span with no line-height). Default: the recipe's. */
  leading?: TextLeading;
  /** Force uppercase (for the mixed-case mono face). */
  caps?: boolean;
};

/** Any run of text, styled by an Arena type recipe. */
export function Text<T extends ElementType = "span">({
  as,
  variant,
  tone,
  leading,
  caps,
  className,
  ...rest
}: PolymorphicProps<T, TextOwnProps>) {
  const Comp: ElementType = as ?? "span";
  return (
    <Comp className={cn(textVariants({ variant, tone, leading, caps }), className)} {...rest} />
  );
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
  leading?: TextLeading;
} & ComponentPropsWithRef<"h1">;

/** A real <h1>–<h6>; the look defaults by level and can be overridden. */
export function Heading({
  level,
  variant,
  tone = "primary",
  leading,
  className,
  ...rest
}: HeadingProps) {
  const Tag = `h${level}` as const;
  return (
    <Tag
      className={cn(
        textVariants({ variant: variant ?? HEADING_DEFAULT[level], tone, leading }),
        className,
      )}
      {...rest}
    />
  );
}

/** The engineer's voice: uppercase mono labels, tags and eyebrows. */
export function MonoLabel<T extends ElementType = "span">({
  variant = "mono-label",
  tone = "label",
  ...rest
}: PolymorphicProps<T, { variant?: MonoVariant; tone?: TextTone; leading?: TextLeading }>) {
  return <Text variant={variant} tone={tone} {...(rest as PolymorphicProps<T, TextOwnProps>)} />;
}
