import { describe, expect, it } from "vitest";
import { BALL_RADIUS, netHeightAt, type Vec3 } from "./court";
import { FENCE, intoNet, KH, NET_CLEAR, shotTo, SPIN, toBounce, type BallPath } from "./ball";

const close = (a: Vec3, b: Vec3, d = 1e-6) =>
  a.forEach((v, i) => expect(v).toBeCloseTo(b[i]!, -Math.log10(d)));
/** The centre's height over the tape as it crosses the net. */
function clearance(path: BallPath) {
  for (let t = 0; t < path.reach; t += 0.001) {
    const [x, y, z] = path.at(t);
    const [, , z2] = path.at(t + 0.001);
    if (Math.sign(z) !== Math.sign(z2)) return y - netHeightAt(x);
  }
  return null;
}

describe("shotTo: the ball reaches the racket exactly", () => {
  // A serve from the deuce court (racket at 2.7 m) and a rally ball, at the slowest and fastest flights the game uses.
  const cases: {
    name: string;
    from: Vec3;
    to: Vec3;
    bounceZ: number;
    flights: number[];
    spin: number;
  }[] = [
    {
      name: "serve",
      from: [-1.15, 2.7, -11.75],
      to: [2.6, 0.95, 14.2],
      bounceZ: 5.5,
      flights: [0.9, 1.45],
      spin: SPIN.serve,
    },
    {
      name: "rally",
      from: [3.0, 0.95, -13.4],
      to: [-2.4, 0.95, 13.6],
      bounceZ: 9.0,
      flights: [1.0, 1.575],
      spin: SPIN.rally,
    },
  ];
  for (const c of cases)
    for (const flight of c.flights)
      it(`${c.name} in ${flight} s: at the contact on time, one bounce first, over the net, a real bounce`, () => {
        const path = shotTo(c.from, c.to, c.bounceZ, flight, c.spin);
        close(path.at(flight), c.to);
        expect(path.reach).toBe(flight);
        expect(path.bounces[0]!).toBeLessThan(flight);
        expect(path.bounces[1] ?? Infinity).toBeGreaterThan(flight);
        expect(path.bounce![2]).toBeCloseTo(c.bounceZ, 6);
        expect(path.bounce![1]).toBeCloseTo(BALL_RADIUS, 6);
        expect(clearance(path)!).toBeGreaterThanOrEqual(NET_CLEAR);
        expect(path.kv).toBeGreaterThan(0.5);
        expect(path.kv).toBeLessThan(0.9);
      });
  it("the post-bounce run keeps KH of the speed along the court", () => {
    const p = shotTo(cases[1]!.from, cases[1]!.to, 9, 1.2, SPIN.rally);
    const t = p.bounces[0]!;
    const before = (p.at(t)[2] - p.at(t - 0.01)[2]) / 0.01;
    const after = (p.at(t + 0.01)[2] - p.at(t)[2]) / 0.01;
    expect(after / before).toBeCloseTo(KH, 2);
  });
});

describe("toBounce and intoNet", () => {
  it("lands exactly where and when it is told, then runs on and never passes the fence", () => {
    const p = toBounce([2.4, 0.95, 13.6], [4.115 + BALL_RADIUS + 0.04, -8.6], 0.8, SPIN.rally);
    close(p.at(0.8), [4.115 + BALL_RADIUS + 0.04, BALL_RADIUS, -8.6]);
    expect(p.bounces[0]).toBeCloseTo(0.8, 6);
    expect(p.bounces.length).toBeGreaterThan(1);
    for (let t = 0; t <= p.end; t += 0.01) {
      const [x, y, z] = p.at(t);
      expect(Math.abs(z)).toBeLessThanOrEqual(FENCE.z + 1e-6);
      expect(Math.abs(x)).toBeLessThanOrEqual(FENCE.x + 1e-6);
      expect(y).toBeGreaterThanOrEqual(BALL_RADIUS - 1e-6);
    }
  });
  it("into the net: meets it at the height asked, then drops on the hitter's side and comes to rest", () => {
    const p = intoNet([-1.5, 0.95, 13.2], [1.2, 0.55], 0.45);
    close(p.at(0.45), [1.2, 0.55, 0]);
    for (let t = 0.46; t <= p.end; t += 0.01) expect(p.at(t)[2]).toBeGreaterThan(0);
    const [, y] = p.at(p.end);
    expect(y).toBeCloseTo(BALL_RADIUS, 3);
  });
  it("moves smoothly: no jump over 0.5 m between frames 1/120 s apart", () => {
    const p = shotTo([3.0, 0.95, -13.4], [-2.4, 0.95, 13.6], 9.0, 1.2, SPIN.rally);
    for (let t = 0; t < p.end; t += 1 / 120) {
      const a = p.at(t);
      const b = p.at(t + 1 / 120);
      expect(Math.hypot(b[0] - a[0], b[1] - a[1], b[2] - a[2])).toBeLessThan(0.5);
    }
  });
});
