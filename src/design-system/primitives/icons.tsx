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
