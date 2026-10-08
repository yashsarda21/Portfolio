import type { IntroRefs } from "./timeline";

/**
 * Collect the timeline's refs from the page, by `data-part`, inside `scope` (the page root, or one layout of
 * it). The page names what it draws; this is the only place that knows which names the timeline wants.
 * A part that is not in the scope is left out (the timeline skips tracks whose refs are missing).
 */
export function collectIntroRefs(scope: HTMLElement): IntroRefs {
  const one = (part: string, within: ParentNode = scope) =>
    within.querySelector<HTMLElement>(`[data-part="${part}"]`) ?? undefined;
  const many = (part: string) => [...scope.querySelectorAll<HTMLElement>(`[data-part="${part}"]`)];

  const banks = [1, 2, 3, 4].flatMap((n) => one(`bank-${n}`) ?? []);
  const sky = [one("letterbox-sky"), one("sky")].flatMap((el) => el ?? []);

  return {
    root: scope,
    banks,
    flares: banks.flatMap((bank) => one("flare", bank) ?? []),
    cones: [one("cone-left"), one("cone-right")].flatMap((el) => el ?? []),
    dust: one("dust"),
    crowd: one("crowd"),
    sky,
    field: one("field"),
    backlight: one("backlight"),
    boardOn: one("board-on"),
    boardHit: one("board-hit"),
    boardHeader: one("board-header"),
    scan: one("scan"),
    mover: one("mover"),
    ghosts: many("ghost"),
    trails: one("trails"),
    fig: one("fig"),
    shade: one("shade"),
    strips: many("turn"),
    rest: one("rest"),
    portrait: one("portrait"),
    shock: one("shock"),
    streak: one("streak"),
    glints: many("glint"),
    pixels: many("pixel"),
    letters: many("letter"),
    title: one("title"),
    titleBar: one("title-bar"),
    tagline: many("tagline"),
    strip: one("board-strip"),
    flash: one("flash"),
    welcome: one("welcome"),
    cta: one("cta"),
    idle: one("idle"),
    sweep: one("sweep"),
  };
}
