import { render } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { content, ui } from "@/content";
import { ROUTES } from "@/shell/routes";
import { WithShell } from "@/shell/storyDecorators";
import { IntroPage } from "./IntroPage";
import { collectIntroRefs } from "./refs";
import { buildIntroView } from "./view";

const view = buildIntroView(content, ui, ROUTES);

// The dust canvas has no 2D context in jsdom; it is not what these tests look at.
beforeEach(() => {
  vi.spyOn(HTMLCanvasElement.prototype, "getContext").mockReturnValue(null);
});

/** The page renders both layouts; a timeline collects the refs of the one it plays, by its `data-intro-layout`. */
function page(layout: "stage" | "column" = "stage") {
  const { container } = render(
    <WithShell>
      <IntroPage view={view} />
    </WithShell>,
  );
  const root = container.querySelector<HTMLElement>("main#main")!;
  const scope = root.querySelector<HTMLElement>(`[data-intro-layout="${layout}"]`)!;
  return { root, scope, refs: collectIntroRefs(scope) };
}

describe("IntroPage: what the timeline can reach", () => {
  it("finds every part the timeline moves, in the counts the board draws", () => {
    const { refs } = page();
    expect(refs.banks).toHaveLength(4);
    expect(refs.flares).toHaveLength(4);
    expect(refs.cones).toHaveLength(2);
    expect([refs.sky].flat()).toHaveLength(2);
    expect(refs.ghosts).toHaveLength(2);
    expect(refs.strips).toHaveLength(3);
    expect(refs.glints).toHaveLength(2);
    expect(refs.pixels).toHaveLength(90);
    expect(refs.letters).toHaveLength(10);
    expect(refs.tagline).toHaveLength(7);
    for (const key of [
      "crowd",
      "field",
      "backlight",
      "boardOn",
      "boardHit",
      "boardHeader",
      "scan",
      "mover",
      "trails",
      "fig",
      "rest",
      "shock",
      "streak",
      "title",
      "titleBar",
      "strip",
      "flash",
      "welcome",
      "cta",
      "idle",
      "sweep",
    ] as const) {
      expect(refs[key], key).toBeInstanceOf(HTMLElement);
    }
  });

  it("the letters spell the name, in order, with the gap as a letter of its own", () => {
    const { refs } = page();
    expect(refs.letters!.map((l) => l.textContent).join("")).toBe(content.player.name);
    expect(refs.letters![4]).toHaveClass("intro-letter-gap");
    expect(refs.letters!.map((l) => l.dataset.kind)).toEqual([
      "la",
      "lb",
      "lc",
      "la",
      "lb",
      "lc",
      "la",
      "lb",
      "lc",
      "la",
    ]);
  });

  it("every part a timeline reveals is held back while the show is pending", () => {
    const { root, refs } = page();
    expect(root).toHaveAttribute("data-hold", "pending");
    const held = (el: HTMLElement | undefined) => el!.classList.contains("hold-part");
    for (const el of [
      ...refs.banks!,
      ...refs.cones!,
      ...[refs.sky!].flat(),
      refs.crowd,
      refs.field,
      refs.backlight,
      refs.boardHeader,
      refs.mover,
      refs.title,
      refs.strip,
      refs.welcome,
      refs.cta,
      ...refs.letters!,
      ...refs.tagline!,
    ])
      expect(held(el), el!.getAttribute("data-part") ?? "").toBe(true);
  });

  it("the h1 is the name for assistive tech; its letters and every effect are decorative", () => {
    const { root, refs } = page();
    const h1s = root.querySelectorAll("h1");
    expect(h1s).toHaveLength(2); // the stage's, and the phone column's (each display:none at the other's width)
    const h1 = h1s[0]!;
    expect(h1).toHaveAttribute("aria-label", view.heading);
    expect(h1.hasAttribute("aria-hidden")).toBe(false);
    for (const letter of refs.letters!) expect(letter).toHaveAttribute("aria-hidden", "true");
    expect(refs.fig).toHaveAttribute("role", "img");
    expect(refs.fig).toHaveAttribute("aria-label", view.portraitAlt);
    for (const el of [refs.trails, refs.shock, refs.streak, refs.flash, ...refs.ghosts!])
      expect(el).toHaveAttribute("aria-hidden", "true");
  });

  it("the strips fetch nothing until the show plays (the image waits in --sprite)", () => {
    const { refs } = page();
    for (const strip of refs.strips!) {
      expect(strip.style.backgroundImage).toBe("");
      expect(strip.style.getPropertyValue("--sprite")).toMatch(/turn_[012]/);
      expect(strip).toHaveClass("intro-turn");
    }
  });

  it("the ghosts draw the rest pose, so the swing-in never waits on a head-turn strip", () => {
    const { refs } = page();
    expect(refs.ghosts).toHaveLength(2);
    for (const ghost of refs.ghosts!) {
      const image = ghost.querySelector("img")!;
      expect(image.getAttribute("src")).toBe(refs.rest!.getAttribute("src"));
      expect(ghost.querySelector("[style*='--sprite']")).toBeNull();
    }
  });

  it("the rest pose is under the strips (strip A paints over it), and the shade is over them", () => {
    const { refs } = page();
    const before = (a: HTMLElement, b: HTMLElement) =>
      Boolean(a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING);
    for (const strip of refs.strips!) {
      expect(before(refs.rest!, strip)).toBe(true);
      expect(before(strip, refs.shade!)).toBe(true);
    }
    expect(refs.shade).toHaveClass("intro-shade");
    expect(refs.shade!.getAttribute("src")).toBe(refs.rest!.getAttribute("src"));
    // the lit figure carries no filter of its own (L14)
    expect(refs.fig!.className).not.toMatch(/intro-fig/);
  });

  it("REPLAY is disabled (aria-disabled, no handler) until the page is given something to replay", () => {
    const off = page();
    const replay = (root: HTMLElement) =>
      [...root.querySelectorAll("button")].filter((b) => b.textContent === view.replay);
    expect(replay(off.root)).toHaveLength(2);
    for (const b of replay(off.root)) expect(b).toHaveAttribute("aria-disabled", "true");
    document.body.innerHTML = "";
    const onReplay = vi.fn();
    const { container } = render(
      <WithShell>
        <IntroPage view={view} onReplay={onReplay} />
      </WithShell>,
    );
    for (const b of replay(container)) {
      expect(b).not.toHaveAttribute("aria-disabled");
      b.click();
    }
    expect(onReplay).toHaveBeenCalledTimes(2);
  });

  it("ENTER THE ARENA and SKIP INTRO link to the hub; REPLAY is hidden under reduced motion", () => {
    const { root } = page();
    const links = [...root.querySelectorAll<HTMLAnchorElement>("a[href='/arena']")];
    expect(links.map((a) => a.textContent)).toEqual(
      expect.arrayContaining([view.skip.label, view.enter.label]),
    );
    const replay = [...root.querySelectorAll("button")].find((b) => b.textContent === view.replay)!;
    expect(replay).toHaveClass("motion-reduce:hidden");
  });

  it("the stage's refs never include the phone column's parts, and the column's never the stage's", () => {
    const stage = page("stage");
    const column = collectIntroRefs(
      stage.root.querySelector<HTMLElement>('[data-intro-layout="column"]')!,
    );
    const columnEl = stage.root.querySelector('[data-intro-layout="column"]')!;
    const stageEl = stage.scope;
    expect(stageEl.contains(columnEl)).toBe(false);
    for (const el of [
      ...stage.refs.letters!,
      stage.refs.cta!,
      stage.refs.welcome!,
      stage.refs.title!,
    ])
      expect(columnEl.contains(el)).toBe(false);
    for (const el of [...column.letters!, column.cta!, column.welcome!, column.title!])
      expect(stageEl.contains(el)).toBe(false);
    // the whole page would find the stage's parts first, which is the mistake the scoping prevents
    expect(collectIntroRefs(stage.root).letters).toHaveLength(20);
  });

  it("holds no copy of its own: the visible text is the view's", () => {
    const { root } = page();
    const stage = root.querySelector("[data-stage]") as HTMLElement;
    const text = stage.textContent!;
    for (const s of [
      view.header.live,
      view.header.matchday,
      view.title,
      view.welcome,
      view.enter.label,
      view.replay,
      view.skip.label,
      ...view.footer.flatMap((c) => [c.label, c.value]),
      ...view.tagline.map((t) => t.text),
    ])
      expect(text, s).toContain(s);
  });
});

describe("IntroColumn: the phone's parts", () => {
  it("offers the mobile tier what it moves (two banks, the name, the title, the tagline, the strip, WELCOME, the CTA) and nothing of the stage", () => {
    const { refs } = page("column");
    expect(refs.banks).toHaveLength(2);
    expect(refs.letters).toHaveLength(10);
    expect(refs.tagline).toHaveLength(7);
    for (const key of [
      "boardHeader",
      "portrait",
      "title",
      "titleBar",
      "strip",
      "welcome",
      "cta",
    ] as const)
      expect(refs[key], key).toBeInstanceOf(HTMLElement);
    for (const key of [
      "mover",
      "fig",
      "rest",
      "backlight",
      "shock",
      "streak",
      "flash",
      "trails",
      "idle",
      "sweep",
    ] as const)
      expect(refs[key], key).toBeUndefined();
    expect(refs.strips).toEqual([]);
    expect(refs.ghosts).toEqual([]);
    expect(refs.pixels).toEqual([]);
    expect(refs.flares).toEqual([]);
  });

  it("the h1 is the name for assistive tech, its letters are decorative, and the words never break", () => {
    const { scope, refs } = page("column");
    const h1 = scope.querySelector("h1")!;
    expect(scope.querySelectorAll("h1")).toHaveLength(1);
    expect(h1).toHaveAttribute("aria-label", view.heading);
    expect(refs.letters!.map((l) => l.textContent).join("")).toBe(content.player.name);
    for (const letter of refs.letters!) expect(letter).toHaveAttribute("aria-hidden", "true");
    // YASH and SARDA are one line each; the space between them is a letter that draws nothing
    const lines = [...h1.children] as HTMLElement[];
    expect(lines.map((l) => l.textContent)).toEqual(["Yash", " Sarda"]);
    expect(lines.every((l) => l.classList.contains("whitespace-nowrap"))).toBe(true);
    expect(refs.letters![4]).toHaveClass("hidden");
  });

  it("every part the timeline reveals is held back while the show is pending", () => {
    const { refs } = page("column");
    for (const el of [
      ...refs.banks!,
      refs.boardHeader,
      refs.portrait,
      refs.title,
      refs.strip,
      refs.welcome,
      refs.cta,
      ...refs.letters!,
      ...refs.tagline!,
    ])
      expect(el!.classList.contains("hold-part"), el!.getAttribute("data-part") ?? "").toBe(true);
  });

  it("the portrait is the rest pose: decorative (the h1 names him), sized by attributes, decoded off the main thread", () => {
    const { refs } = page("column");
    const img = refs.portrait as HTMLImageElement;
    expect(img.tagName).toBe("IMG");
    expect(img.getAttribute("src")).toMatch(/portrait-rest/);
    expect(img.getAttribute("alt")).toBe("");
    expect(img).toHaveAttribute("width", "700");
    expect(img).toHaveAttribute("height", "564");
    expect(img).toHaveAttribute("decoding", "async");
    expect(img).toHaveClass("portrait-fade");
  });

  it("REPLAY (hidden under reduced motion), SKIP INTRO and ENTER THE ARENA are all there, and no commentary", () => {
    const { scope } = page("column");
    const links = [...scope.querySelectorAll<HTMLAnchorElement>("a[href='/arena']")];
    expect(links.map((a) => a.textContent)).toEqual(
      expect.arrayContaining([view.skip.label, view.enter.label]),
    );
    const replay = [...scope.querySelectorAll("button")].find(
      (b) => b.textContent === view.replay,
    )!;
    expect(replay).toHaveClass("motion-reduce:hidden");
    expect(scope.querySelector("[data-commentary-bar]")).toBeNull();
    expect(scope.querySelector("canvas")).toBeNull();
  });

  it("holds no copy of its own: the visible text is the view's", () => {
    const { scope } = page("column");
    const text = scope.textContent!;
    for (const s of [
      view.header.live,
      view.header.count,
      view.title,
      view.welcome,
      view.enter.label,
      view.replay,
      view.skip.label,
      ...view.footerPhone.flatMap((c) => [c.label, c.value]),
      ...view.tagline.map((t) => t.text),
    ])
      expect(text, s).toContain(s);
  });
});
