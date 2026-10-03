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
