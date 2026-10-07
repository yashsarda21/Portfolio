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

function page() {
  const { container } = render(
    <WithShell>
      <IntroPage view={view} />
    </WithShell>,
  );
  const root = container.querySelector<HTMLElement>("main#main")!;
  return { root, refs: collectIntroRefs(root) };
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
    expect(root).toHaveAttribute("data-intro", "pending");
    const held = (el: HTMLElement | undefined) => el!.classList.contains("intro-part");
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
    expect(h1s).toHaveLength(2); // the stage's, and the phone placeholder's (display:none from 768px)
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
    for (const strip of [
      ...refs.strips!,
      ...refs.ghosts!.map((g) => g.firstElementChild as HTMLElement),
    ]) {
      expect(strip.style.backgroundImage).toBe("");
      expect(strip.style.getPropertyValue("--sprite")).toMatch(/turn_[012]/);
      expect(strip).toHaveClass("intro-turn");
    }
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
