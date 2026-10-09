import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { ArenaBackdrop } from "./ArenaBackdrop";
import { CONE_BOXES } from "./cones";
import { CrowdTier } from "./CrowdTier";
import { FloodlightBank } from "./FloodlightBank";
import { GameBackdrop } from "./GameBackdrop";
import { GridFloor } from "./GridFloor";
import { SpriteStrip } from "./SpriteStrip";
import { ShowcaseBackdrop } from "./ShowcaseBackdrop";
import { SkyGlow } from "./SkyGlow";
import { TracerPath } from "./TracerPath";
import { VenueArt } from "./VenueArt";

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

  it("CrowdTier shape: a stand by default, curved along its top edge, or the phone's flat band", () => {
    const shapeOf = (shape?: "stand" | "curved" | "flat") => {
      const { container } = render(<CrowdTier shape={shape} />);
      return container.firstElementChild as HTMLElement;
    };
    expect(shapeOf()).toHaveClass("scene-crowd");
    expect(shapeOf()).not.toHaveClass("[border-radius:50%_50%_0_0/60%_60%_0_0]");
    expect(shapeOf("curved")).toHaveClass("scene-crowd", "[border-radius:50%_50%_0_0/60%_60%_0_0]");
    expect(shapeOf("flat")).toHaveClass("scene-crowd-flat");
    expect(shapeOf("flat")).not.toHaveClass("scene-crowd");
  });

  it("CrowdTier flat is the phone's band: its own dot grid and fade, not the stand's", () => {
    const { container } = render(<CrowdTier shape="flat" alpha={0.22} />);
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
    const { container } = render(<ArenaBackdrop layerClassName="hold-part" bleed />);
    const root = container.firstElementChild as HTMLElement;
    const marked = [...root.querySelectorAll(".hold-part")].map((el) =>
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
    expect(root).not.toHaveClass("hold-part");
  });

  it("column is the phone's frame: a glow, a flat crowd and two small banks, nothing of the stage", () => {
    const { container } = render(<ArenaBackdrop layout="column" layerClassName="hold-part" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-layout", "column");
    expect(root).toHaveClass("absolute", "inset-0", "overflow-hidden");
    for (const name of ["field", "pitch", "cone-left", "cone-right", "mast-left", "dust"])
      expect(part(root, name), name).toHaveLength(0);
    const banks = [1, 2].map((n) => part(root, `bank-${n}`)[0] as HTMLElement);
    expect(banks[0]).toHaveClass("h-5.5", "w-15", "top-20", "left-7.5");
    expect(banks[1]).toHaveClass("h-5.5", "w-15", "top-20", "right-7.5");
    // The banks hang in a box as wide as the column (640px at most, centred), not the screen.
    expect(banks[0]!.parentElement).toHaveClass("relative", "mx-auto", "h-full", "max-w-160");
    const crowd = root.querySelector(".scene-crowd-flat") as HTMLElement;
    expect(crowd).toHaveStyle("--crowd-a: 0.22");
    expect(root.querySelector(".scene-venue-glow")).not.toBeNull();
    // Only the banks enter (a screen holds them back); the washes are just there.
    expect([...root.querySelectorAll(".hold-part")]).toEqual(banks);
    expect(root.querySelector(".scene-sky")).not.toHaveAttribute("data-part");
  });

  it("column takes the boot like the stage: sky, venue glow and crowd enter on their beats, the two banks flicker in order", () => {
    const boot = {
      crowd: 0.3,
      coneL: 1,
      coneR: 1.5,
      sky: 2.2,
      field: 2.4,
      pitch: 2.6,
      banks: [0.6, 1.1, 1.6, 2],
    } as const;
    const { container } = render(<ArenaBackdrop layout="column" boot={boot} />);
    const root = container.firstElementChild as HTMLElement;
    const at = (el: Element | null) => (el as HTMLElement).style.getPropertyValue("--d");
    const sky = part(root, "sky")[0]!;
    const crowd = part(root, "crowd")[0]!;
    const glow = part(root, "venue")[0]!;
    expect(sky).toHaveClass("scene-sky", "animate-boot-fade");
    expect(at(sky)).toBe("2.2s");
    expect(crowd).toHaveClass("animate-boot-fade");
    expect(at(crowd)).toBe("0.3s");
    expect(glow).toHaveClass("scene-venue-glow", "animate-boot-fade");
    expect(at(glow)).toBe("2.4s");
    const banks = [1, 2].map((n) => part(root, `bank-${n}`)[0] as HTMLElement);
    expect(banks.map(at)).toEqual(["0.6s", "1.1s"]);
    for (const bank of banks) expect(bank).toHaveClass("animate-bank-flicker");
    // The stage's other layers are still not here.
    for (const name of ["field", "pitch", "cone-left", "cone-right", "dust"])
      expect(part(root, name), name).toHaveLength(0);
  });

  it("column without a boot is as before: the washes are plain, only the banks take the held class", () => {
    const { container } = render(<ArenaBackdrop layout="column" layerClassName="hold-part" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root.querySelector(".scene-venue-glow")).not.toHaveAttribute("data-part");
    expect(root.querySelector(".scene-crowd-flat")).not.toHaveAttribute("data-part");
    expect(root.querySelector(".animate-boot-fade")).toBeNull();
  });

  it("dust fades in with the left cone, and holds back with the rest of the scene", () => {
    const boot = {
      crowd: 0.3,
      coneL: 1,
      coneR: 1.5,
      sky: 2.2,
      field: 2.4,
      pitch: 2.6,
      banks: [0.6, 1.1, 1.6, 2],
    } as const;
    const { container, rerender } = render(
      <ArenaBackdrop dust boot={boot} layerClassName="hold-part" />,
    );
    const dust = container.querySelector('[data-part="dust"]') as HTMLElement;
    expect(dust).toHaveClass("animate-boot-fade", "hold-part");
    expect(dust.style.getPropertyValue("--d")).toBe("1s");
    expect(dust.style.getPropertyValue("--d")).toBe(
      (container.querySelector('[data-part="cone-left"]') as HTMLElement).style.getPropertyValue(
        "--d",
      ),
    );
    rerender(<ArenaBackdrop dust />);
    const still = container.querySelector('[data-part="dust"]') as HTMLElement;
    expect(still).not.toHaveClass("animate-boot-fade");
    expect(still.style.getPropertyValue("--d")).toBe("");
    rerender(<ArenaBackdrop />);
    expect(container.querySelector('[data-part="dust"]')).toBeNull();
  });

  it("no layerClassName, no extra classes (the Landing draws as before)", () => {
    const { container } = render(<ArenaBackdrop />);
    expect(container.querySelector(".hold-part")).toBeNull();
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

  it("the Intro's four banks hang at the artboard's x, 76px down: under the HUD (ends y 60) with 16px between, above the board (starts y 136) with 16px (D-5, spec 11.4)", () => {
    const { container } = render(<ArenaBackdrop layout="intro" />);
    const bank = (n: number) => part(container, `bank-${n}`)[0] as HTMLElement;
    expect([1, 2, 3, 4].map((n) => bank(n).classList.contains("top-19"))).toEqual([
      true,
      true,
      true,
      true,
    ]);
    expect(bank(1)).toHaveClass("left-20", "h-11");
    expect(bank(2)).toHaveClass("left-95", "h-8");
    expect(bank(3)).toHaveClass("right-95", "h-8");
    expect(bank(4)).toHaveClass("right-20", "h-11");
    // The housings end at 76 + 44 = 120 (large) and 76 + 32 = 108 (small): 16px short of the board's top, 136.
    expect(19 * 4 + 44 + 16).toBe(136);
  });

  it("each Intro beam still starts under its lamp: the cone boxes start 26px above the lowered housing's bottom as the artboard's start 26px above the old one's", () => {
    const lampTop = 76; // top-19
    const artboard = { lampTop: 34, coneTop: 60 };
    expect(CONE_BOXES.intro.left.y - lampTop).toBe(artboard.coneTop - artboard.lampTop);
    expect(CONE_BOXES.intro.right.y - lampTop).toBe(artboard.coneTop - artboard.lampTop);
    // The bottom edge is where the artboard has it (y 860).
    expect(CONE_BOXES.intro.left.y + CONE_BOXES.intro.left.h).toBe(860);
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
    const { container, rerender } = render(<FloodlightBank size="lg" flat />);
    expect(container.querySelector('[data-part="flare"]')).toBeNull();
    rerender(<FloodlightBank size="lg" flat flare />);
    expect(container.querySelector('[data-part="flare"]')).not.toBeNull();
    rerender(<FloodlightBank size="sm" flat flare on={false} />);
    expect(container.querySelector('[data-part="flare"]')).toBeNull();
  });

  it("a bank is a bulb preset in a housing: flat only lowers the housing, the bulbs and glow stay", () => {
    const bank = (props: { size?: "lg" | "sm" | "mini" | "mobile"; flat?: boolean }) => {
      const { container } = render(<FloodlightBank {...props} />);
      return container.firstElementChild as HTMLElement;
    };
    const tall = bank({ size: "lg" });
    const flat = bank({ size: "lg", flat: true });
    expect(tall).toHaveClass("h-12", "w-28");
    expect(flat).toHaveClass("h-11", "w-28");
    expect(flat).not.toHaveClass("h-12");
    for (const cls of ["shadow-bank-lg", "[--bulb-r1:2.6px]", "[--bulb-gx:12px]"]) {
      expect(tall).toHaveClass(cls);
      expect(flat).toHaveClass(cls);
    }
    expect(bank({ size: "sm", flat: true })).toHaveClass("h-8", "w-21", "shadow-bank-sm");
    // The small phone banks have one height: flat changes nothing.
    expect(bank({ size: "mobile", flat: true })).toHaveClass("h-5.5", "w-15");
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

describe("ArenaBackdrop hub layout", () => {
  it("is the Hub's sky, volt floor glow, crowd strip and grid floor: no banks, cones, field or masts", () => {
    const { container } = render(<ArenaBackdrop layout="hub" />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("data-layout", "hub");
    expect(root).toHaveAttribute("aria-hidden", "true");
    for (const name of ["sky", "floor-glow", "crowd", "grid"]) {
      expect(part(root, name), name).toHaveLength(1);
    }
    for (const name of [
      "field",
      "pitch",
      "cone-left",
      "cone-right",
      "mast-left",
      "bank-1",
      "dust",
    ]) {
      expect(part(root, name), name).toHaveLength(0);
    }
    // The sky sits at 60% across; the crowd strip is the artboard's box at half strength.
    expect(part(root, "sky")[0]).toHaveStyle("--sky-x: 60%");
    expect(part(root, "crowd")[0]).toHaveClass(
      "left-70",
      "-right-15",
      "top-22.5",
      "h-55",
      "opacity-60",
    );
    expect(part(root, "crowd")[0]).toHaveStyle("--crowd-a: 0.2");
    // The floor glow is volt whatever the venue.
    expect(part(root, "floor-glow")[0]).toHaveClass("scene-venue-glow", "scene-glow-volt");
  });

  it("bleed lets it extend past 1440x900 like the other stage layouts", () => {
    const { container } = render(<ArenaBackdrop layout="hub" bleed />);
    expect(container.firstElementChild).toHaveClass("overflow-visible", "bg-transparent");
  });

  it("the other layouts draw no floor glow or grid", () => {
    for (const layout of ["landing", "intro", "column"] as const) {
      const { container } = render(<ArenaBackdrop layout={layout} />);
      const root = container.firstElementChild as HTMLElement;
      expect(part(root, "floor-glow"), layout).toHaveLength(0);
      expect(part(root, "grid"), layout).toHaveLength(0);
    }
  });
});

describe("GridFloor", () => {
  it("is a decorative perspective box holding the plane", () => {
    const { container } = render(<GridFloor className="top-10" />);
    const box = container.firstElementChild as HTMLElement;
    expect(box).toHaveAttribute("aria-hidden", "true");
    expect(box).toHaveClass("pointer-events-none", "perspective-grid", "top-10");
    expect(box.firstElementChild).toHaveClass("scene-grid-floor");
  });
});

describe("VenueArt", () => {
  const art = (scene: "turf" | "court" | "hall") => {
    const { container } = render(<VenueArt scene={scene} />);
    return container.firstElementChild as HTMLElement;
  };

  it("turf: two card banks, the oval in perspective and the wicket", () => {
    const root = art("turf");
    expect(root).toHaveAttribute("data-venue", "turf");
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveClass("h-50");
    const banks = part(root, "bank");
    expect(banks).toHaveLength(2);
    for (const bank of banks) expect(bank).toHaveClass("h-3.5", "w-10", "shadow-bank-mini");
    expect(banks[0]).toHaveClass("top-1.5", "left-7.5");
    expect(banks[1]).toHaveClass("top-1.5", "right-7.5");
    expect(part(root, "oval")).toHaveLength(1);
    expect(part(root, "wicket")).toHaveLength(1);
    for (const name of ["court", "roof", "beam"]) expect(part(root, name), name).toHaveLength(0);
  });

  it("court: one wide card bank and the tennis court with its net", () => {
    const root = art("court");
    expect(root).toHaveAttribute("data-venue", "court");
    const banks = part(root, "bank");
    expect(banks).toHaveLength(1);
    expect(banks[0]).toHaveClass("h-3.5", "w-12.5", "shadow-bank-card-wide");
    const court = part(root, "court")[0] as HTMLElement;
    expect(court).toHaveStyle({ width: "130px", height: "240px" });
    expect(court).toHaveClass("scene-court-hard");
    expect(court.querySelector('[data-part="net"]')).not.toBeNull();
    for (const name of ["oval", "wicket", "roof", "beam"])
      expect(part(root, name), name).toHaveLength(0);
  });

  it("hall: the roof arc, the warm beam and the badminton court", () => {
    const root = art("hall");
    expect(root).toHaveAttribute("data-venue", "hall");
    expect(part(root, "roof")).toHaveLength(1);
    expect(part(root, "beam")).toHaveLength(1);
    expect(part(root, "bank")).toHaveLength(0);
    const court = part(root, "court")[0] as HTMLElement;
    expect(court).toHaveStyle({ width: "110px", height: "230px" });
    expect(court).toHaveClass("scene-court-hall");
    expect(court.querySelector('[data-part="net"]')).not.toBeNull();
  });

  it("every part is decorative, and a className lands on the root", () => {
    for (const scene of ["turf", "court", "hall"] as const) {
      const { container } = render(<VenueArt scene={scene} className="w-87" />);
      const root = container.firstElementChild as HTMLElement;
      expect(root).toHaveClass("w-87");
      for (const el of root.querySelectorAll("[data-part]")) {
        expect(el.closest('[aria-hidden="true"]')).not.toBeNull();
      }
    }
  });
});

describe("FloodlightBank card sizes", () => {
  it("card is the mini bulbs in a 40x14 housing, card-wide a 50x14 one with its own glow", () => {
    const bank = (size: "card" | "card-wide") => {
      const { container } = render(<FloodlightBank size={size} />);
      return container.firstElementChild as HTMLElement;
    };
    expect(bank("card")).toHaveClass(
      "h-3.5",
      "w-10",
      "shadow-bank-mini",
      "[--bulb-gx:7px]",
      "[--bulb-gy:6px]",
    );
    expect(bank("card-wide")).toHaveClass(
      "h-3.5",
      "w-12.5",
      "shadow-bank-card-wide",
      "[--bulb-gx:7px]",
    );
  });
});

describe("GameBackdrop", () => {
  it.each([
    ["turf", "stage"],
    ["court", "stage"],
    ["hall", "stage"],
    ["turf", "column"],
    ["court", "column"],
    ["hall", "column"],
  ] as const)("%s in the %s frame is decorative and takes its venue", (venue, frame) => {
    const { container } = render(<GameBackdrop venue={venue} frame={frame} />);
    const root = container.firstElementChild as HTMLElement;
    expect(root).toHaveAttribute("aria-hidden", "true");
    expect(root).toHaveAttribute("data-venue", venue);
    expect(root).toHaveAttribute("data-frame", frame);
    expect(root.innerHTML).not.toMatch(/#[0-9a-f]{3,6}\b|rgba?\(/i);
  });

  it("the stage turf draws Yash's static bat", () => {
    const { container } = render(<GameBackdrop venue="turf" frame="stage" />);
    expect(container.querySelectorAll('[data-part="bat"]')).toHaveLength(1);
  });
});

describe("TracerPath", () => {
  it("draw reveals the path from its start: a mask path of length 1 with the dash offset left over", () => {
    const { container } = render(
      <TracerPath d="M0 0 L10 10" viewBox="0 0 20 20" size="stage" draw={0.5} />,
    );
    const reveal = container.querySelector('[data-part="reveal"]')!;
    expect(reveal).toHaveAttribute("pathLength", "1");
    expect(reveal).toHaveAttribute("stroke-dashoffset", "0.5");
    expect(container.querySelector('[data-part="tracer"]')).toHaveAttribute(
      "stroke-dasharray",
      "2 8",
    );
  });

  it("drawVar hands the reveal to a CSS variable, with draw as its fallback; slice crops like a court", () => {
    const { container } = render(
      <TracerPath
        d="M0 0 L10 10"
        viewBox="0 0 20 20"
        size="stage"
        draw={0.25}
        drawVar="--serve"
        slice
      />,
    );
    expect(container.querySelector('[data-part="reveal"]')).toHaveStyle({
      strokeDashoffset: "calc(1 - var(--serve, 0.25))",
    });
    expect(container.querySelector("svg")).toHaveAttribute("preserveAspectRatio", "xMidYMin slice");
  });

  it("draws the whole path by default, and the column's dashes are finer", () => {
    const { container } = render(<TracerPath d="M0 0 L10 10" viewBox="0 0 20 20" size="column" />);
    expect(container.querySelector('[data-part="reveal"]')).toHaveAttribute(
      "stroke-dashoffset",
      "0",
    );
    expect(container.querySelector('[data-part="tracer"]')).toHaveAttribute(
      "stroke-dasharray",
      "2 7",
    );
  });
});
