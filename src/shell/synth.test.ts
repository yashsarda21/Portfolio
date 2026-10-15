import { describe, expect, it } from "vitest";
import type { SoundName } from "./audio";
import { MASTER_GAIN, PEAK, RECIPES, type SynthContext } from "./synth";

/** A parameter that remembers what it was told. */
class FakeParam {
  value = 0;
  calls: { kind: string; value: number; time: number }[] = [];
  constructor(readonly owner: FakeNode) {}
  setValueAtTime(value: number, time: number) {
    this.calls.push({ kind: "set", value, time });
  }
  linearRampToValueAtTime(value: number, time: number) {
    this.calls.push({ kind: "linear", value, time });
  }
  exponentialRampToValueAtTime(value: number, time: number) {
    this.calls.push({ kind: "exp", value, time });
  }
}

class FakeNode {
  kind: string;
  targets: (FakeNode | FakeParam)[] = [];
  starts: number[] = [];
  stops: number[] = [];
  gain = new FakeParam(this);
  frequency = new FakeParam(this);
  Q = new FakeParam(this);
  type = "";
  buffer: unknown = null;
  loop = false;
  constructor(kind: string) {
    this.kind = kind;
  }
  connect(to: FakeNode | FakeParam) {
    this.targets.push(to);
  }
  start(time: number) {
    this.starts.push(time);
  }
  stop(time: number) {
    this.stops.push(time);
  }
  isSource() {
    return this.kind === "osc" || this.kind === "buffer";
  }
}

function fakeContext() {
  const nodes: FakeNode[] = [];
  const make = (kind: string) => {
    const node = new FakeNode(kind);
    nodes.push(node);
    return node;
  };
  const ctx = {
    sampleRate: 8000,
    currentTime: 0,
    createOscillator: () => make("osc"),
    createGain: () => make("gain"),
    createBiquadFilter: () => make("filter"),
    createBufferSource: () => make("buffer"),
    createBuffer: (_channels: number, length: number) => ({
      getChannelData: () => new Float32Array(length),
    }),
  } as unknown as SynthContext;
  const out = new FakeNode("out");
  return { ctx, nodes, out };
}

/** Whether a signal leaving `from` can reach `out` (a connection to a parameter counts as reaching its node). */
function reaches(from: FakeNode, out: FakeNode, seen = new Set<FakeNode>()): boolean {
  if (from === out) return true;
  if (seen.has(from)) return false;
  seen.add(from);
  return from.targets.some((t) => reaches(t instanceof FakeParam ? t.owner : t, out, seen));
}

const CAPS: Record<SoundName, number> = {
  bat: 0.15,
  net: 0.2,
  smash: 0.2,
  floodlight: 0.6,
  crowd: 1.8,
  clap: 0.07,
  bounce: 0.06,
  ooh: 0.9,
};
const AT = 2;

describe.each(Object.keys(CAPS) as SoundName[])("%s recipe", (name) => {
  const built = () => {
    const rig = fakeContext();
    RECIPES[name](rig.ctx, rig.out as unknown as AudioNode, AT);
    return rig;
  };

  it("makes sources whose sound reaches the output", () => {
    const { nodes, out } = built();
    const sources = nodes.filter((n) => n.isSource());
    expect(sources.length).toBeGreaterThan(0);
    for (const source of sources) expect(reaches(source, out)).toBe(true);
  });

  it("starts at the given time and stops within its cap, with no source left running", () => {
    const { nodes } = built();
    for (const source of nodes.filter((n) => n.isSource())) {
      expect(source.starts).toEqual([AT]);
      expect(source.stops).toHaveLength(1);
      expect(source.stops[0]).toBeGreaterThan(AT);
      expect(source.stops[0]! - AT).toBeLessThanOrEqual(CAPS[name]);
    }
  });

  it("never sets a gain above the peak, and every ramp lands inside the cap", () => {
    const { nodes } = built();
    for (const node of nodes.filter((n) => n.kind === "gain")) {
      for (const call of node.gain.calls) {
        expect(call.value).toBeLessThanOrEqual(PEAK);
        expect(call.time - AT).toBeLessThanOrEqual(CAPS[name]);
      }
    }
  });
});

describe("the master level", () => {
  it("is quiet", () => {
    expect(MASTER_GAIN).toBe(0.35);
    expect(PEAK).toBe(0.9);
  });
});
