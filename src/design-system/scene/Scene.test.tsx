import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArenaBackdrop } from "./ArenaBackdrop";
import { CONE_BOXES } from "./cones";
import { CrowdTier } from "./CrowdTier";
import { FloodlightBank } from "./FloodlightBank";
import { SpriteStrip } from "./SpriteStrip";
import { ShowcaseBackdrop } from "./ShowcaseBackdrop";
import { SkyGlow } from "./SkyGlow";

describe("SkyGlow", () => {
  it("is the cool sky blue unless the tone is the venue's", () => {
    const { container, rerender } = render(<SkyGlow />);
    expect(container.firstElementChild).toHaveClass("scene-sky");
    expect(container.firstElementChild).not.toHaveClass("scene-sky-venue");
    rerender(<SkyGlow tone="venue" />);
    expect(container.firstElementChild).toHaveClass("scene-sky", "scene-sky-venue");
  });
});

describe("scene", () => {
  it("CrowdTier leaves density to the venue unless alpha is passed", () => {
    const { container, rerender } = render(<CrowdTier />);
    const tier = container.firstElementChild as HTMLElement;
    expect(tier.style.getPropertyValue("--crowd-a")).toBe("");
    rerender(<CrowdTier alpha={0.5} />);
    expect(tier.style.getPropertyValue("--crowd-a")).toBe("0.5");
  });

  it("CrowdTier flat is the phone's band: its own dot grid and fade, not the stand's", () => {
    const { container } = render(<CrowdTier flat alpha={0.22} />);
    const tier = container.firstElementChild!;
    expect(tier).toHaveClass("scene-crowd-flat");
    expect(tier).not.toHaveClass("scene-crowd");
    expect(tier).toHaveAttribute("aria-hidden", "true");
    expect(tier).toHaveStyle("--crowd-a: 0.22");
  });

  it("ArenaBackdrop is decorative and picks its venue (default turf)", () => {
    const { container, rerender } = render(<ArenaBackdrop />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveAttribute("data-venue", "turf");
    rerender(<ArenaBackdrop venue="hall" />);
    expect(root).toHaveAttribute("data-venue", "hall");
  });
});

describe("ShowcaseBackdrop", () => {
  it("is decorative: a centre glow, the sky, and a floor, all from scene utilities", () => {
    const { container } = render(<ShowcaseBackdrop />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root.querySelector(".scene-centre-glow")).not.toBeNull();
    expect(root.querySelector(".scene-sky")).not.toBeNull();
    expect(root.querySelector(".scene-floor")).not.toBeNull();
    expect(root.innerHTML).not.toMatch(/#[0-9a-f]{3,6}|rgb\(/i);
  });
});

const part = (root: Element, name: string) => root.querySelectorAll(`[data-part="${name}"]`);

describe("ArenaBackdrop layouts", () => {
  const PARTS = [
    "sky",
    "crowd",
    "field",
    "cone-left",
    "cone-right",
    "bank-1",
    "bank-2",
    "bank-3",
    "bank-4",
  ];

  it("landing keeps Main's pieces, each addressable by data-part", () => {
    const { container } = render(<ArenaBackdrop />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).not.toHaveAttribute("data-layout", "intro");
    for (const name of [...PARTS, "pitch", "mast-left", "mast-right"]) {
      expect(part(root, name), name).toHaveLength(1);
    }
  });

  it("intro draws four flat banks, each with a flare layer, and no pitch or masts", () => {
    const { container } = render(<ArenaBackdrop layout="intro" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-layout", "intro");
    for (const name of PARTS) expect(part(root, name), name).toHaveLength(1);
    expect(part(root, "pitch")).toHaveLength(0);
    expect(part(root, "mast-left")).toHaveLength(0);
    const banks = [1, 2, 3, 4].map((n) => part(root, `bank-${n}`)[0] as HTMLElement);
    expect(banks[0]).toHaveClass("h-11", "w-28");
    expect(banks[1]).toHaveClass("h-8", "w-21");
    expect(banks[2]).toHaveClass("h-8", "w-21");
    expect(banks[3]).toHaveClass("h-11", "w-28");
    for (const bank of banks) {
      const flare = bank.querySelector('[data-part="flare"]');
      expect(flare).not.toBeNull();
      expect(flare).toHaveAttribute("aria-hidden", "true");
    }
  });

  it("layerClassName reaches the sky, crowd, field, pitch, both cones and every bank (not the masts)", () => {
    const { container } = render(<ArenaBackdrop layerClassName="intro-part" bleed />);
    const root = container.firstElementChild as HTMLElement;
    const marked = [...root.querySelectorAll(".intro-part")].map((el) =>
      el.getAttribute("data-part"),
    );
    expect(marked.sort()).toEqual(
      [
        "bank-1",
        "bank-2",
        "bank-3",
        "bank-4",
        "cone-left",
        "cone-right",
        "crowd",
        "field",
        "pitch",
        "sky",
      ].sort(),
    );
    expect(root).not.toHaveClass("intro-part");
  });

  it("no layerClassName, no extra classes (the Landing draws as before)", () => {
    const { container } = render(<ArenaBackdrop />);
    expect(container.querySelector(".intro-part")).toBeNull();
  });

  it("each cone's classes draw the box cones.ts names (the source of the geometry)", () => {
    // 1 spacing unit = 4 design px; a right-anchored cone sits `right` px in from the 1440 edge.
    const px = (el: Element, prefix: string) => {
      const m = [...el.classList].find((c) => c.startsWith(`${prefix}-`));
      return m ? Number(m.slice(prefix.length + 1)) * 4 : undefined;
    };
    for (const layout of ["landing", "intro"] as const) {
      const { container } = render(<ArenaBackdrop layout={layout} />);
      for (const side of ["left", "right"] as const) {
        const cone = part(container, `cone-${side}`)[0]!;
        const w = px(cone, "w")!;
        const x = side === "left" ? px(cone, "left")! : 1440 - px(cone, "right")! - w;
        expect({ x, y: px(cone, "top"), w, h: px(cone, "h") }, `${layout} ${side}`).toEqual(
          CONE_BOXES[layout][side],
        );
      }
    }
  });

  const BEATS = {
    crowd: 0.3,
    coneL: 1,
    coneR: 1.5,
    sky: 2.2,
    field: 2.4,
    pitch: 2.6,
    banks: [0.6, 1.1, 1.6, 2],
  } as const;

  it("given boot beats, every layer fades in at its own beat and each bank flickers at its own", () => {
    const { container } = render(<ArenaBackdrop boot={BEATS} />);
    const root = container.firstElementChild as HTMLElement;
    const d = (name: string) => (part(root, name)[0] as HTMLElement).style.getPropertyValue("--d");
    expect(["sky", "crowd", "cone-left", "cone-right", "field", "pitch"].map(d)).toEqual([
      "2.2s",
      "0.3s",
      "1s",
      "1.5s",
      "2.4s",
      "2.6s",
    ]);
    for (const name of ["sky", "crowd", "cone-left", "cone-right", "field", "pitch"])
      expect(part(root, name)[0], name).toHaveClass("animate-boot-fade");
    expect([1, 2, 3, 4].map((n) => d(`bank-${n}`))).toEqual(["0.6s", "1.1s", "1.6s", "2s"]);
    expect(root.querySelectorAll(".animate-bank-flicker")).toHaveLength(4);
    // The masts have no entrance in Main.
    for (const mast of ["mast-left", "mast-right"])
      expect(part(root, mast)[0]).not.toHaveClass("animate-boot-fade");
  });

  it("without boot beats the scene stands lit for a timeline to drive", () => {
    const { container } = render(<ArenaBackdrop />);
    expect(container.querySelectorAll(".animate-boot-fade, .animate-bank-flicker")).toHaveLength(0);
    expect(container.querySelectorAll("[style*='--d']")).toHaveLength(0);
  });

  it("every scene layer is decorative", () => {
    const { container } = render(<ArenaBackdrop layout="intro" dust />);
    const root = container.firstElementChild as HTMLElement;
    for (const el of root.querySelectorAll("[data-part]")) {
      expect(el.closest('[aria-hidden="true"]'), el.getAttribute("data-part") ?? "").not.toBeNull();
    }
  });
});

describe("FloodlightBank", () => {
  it("draws the flare only on request, and not on a bank that is off", () => {
    const { container, rerender } = render(<FloodlightBank size="lg-flat" />);
    expect(container.querySelector('[data-part="flare"]')).toBeNull();
    rerender(<FloodlightBank size="lg-flat" flare />);
    expect(container.querySelector('[data-part="flare"]')).not.toBeNull();
    rerender(<FloodlightBank size="sm-flat" flare on={false} />);
    expect(container.querySelector('[data-part="flare"]')).toBeNull();
  });
});

describe("SpriteStrip", () => {
  it("scales a 16-frame strip to its box: the strip is 1600% wide and frame 0 shows", () => {
    const { container } = render(<SpriteStrip src="/rig/turn_0.webp" className="h-30 w-35" />);
    const strip = container.firstElementChild as HTMLElement;
    expect(strip.style.backgroundImage).toContain("/rig/turn_0.webp");
    expect(strip.style.backgroundSize).toBe("1600% 100%");
    expect(strip.style.backgroundRepeat).toBe("no-repeat");
    expect(strip.style.backgroundPosition).toBe("0px 0px");
    expect(strip).toHaveClass("h-30", "w-35");
  });

  it("deferred keeps the image in --sprite and fetches nothing until a class applies it", () => {
    const { container } = render(<SpriteStrip deferred src="/rig/turn_0.webp" />);
    const strip = container.firstElementChild as HTMLElement;
    expect(strip.style.backgroundImage).toBe("");
    expect(strip.style.getPropertyValue("--sprite")).toContain("/rig/turn_0.webp");
    expect(strip.style.backgroundSize).toBe("1600% 100%");
  });

  it("frames sets the strip width, and the caller owns data-frame", () => {
    const { container } = render(<SpriteStrip src="/x.webp" frames={8} data-frame="3" />);
    const strip = container.firstElementChild as HTMLElement;
    expect(strip.style.backgroundSize).toBe("800% 100%");
    expect(strip).toHaveAttribute("data-frame", "3");
  });
});
