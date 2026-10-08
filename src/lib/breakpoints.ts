/**
 * The breakpoints a script needs, in px. They are the theme's (`--breakpoint-md` and `-lg` in theme.css, which
 * breakpoints.test.ts checks), so a media query written here and a Tailwind `md:` or `lg:` class agree.
 */
export const BREAKPOINT = { md: 768, lg: 1200 } as const;

/** The same breakpoints as media queries. `belowMd` is the phone: one pixel under `md`. */
export const MEDIA = {
  md: `(min-width: ${BREAKPOINT.md}px)`,
  belowMd: `(max-width: ${BREAKPOINT.md - 1}px)`,
  lg: `(min-width: ${BREAKPOINT.lg}px)`,
} as const;
