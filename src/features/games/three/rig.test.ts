import { readFileSync, statSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { BONES, LIBRARY_CLIPS } from "./rig";

/** The JSON chunk of a .glb. */
function gltfJson(path: string) {
  const b = readFileSync(path);
  return JSON.parse(b.subarray(20, 20 + b.readUInt32LE(12)).toString("utf8"));
}
const body = gltfJson("public/models/athlete.glb");
const moves = gltfJson("public/models/moves.glb");
const nodeNames = (j: { nodes: { name?: string }[] }) => new Set(j.nodes.map((n) => n.name));

describe("the shipped models (spec §6.1, CSP-safe)", () => {
  it("the body has every bone we pose, no images, and needs no decoder", () => {
    for (const name of Object.values(BONES)) expect(nodeNames(body)).toContain(name);
    expect(body.images ?? []).toEqual([]);
    for (const ext of body.extensionsRequired ?? []) expect(ext).toBe("KHR_mesh_quantization");
  });
  it("the moves are exactly our clips, on the same bone names", () => {
    expect(moves.animations.map((a: { name: string }) => a.name).sort()).toEqual(
      Object.values(LIBRARY_CLIPS).sort(),
    );
    for (const name of Object.values(BONES)) expect(nodeNames(moves)).toContain(name);
    expect(moves.meshes ?? []).toEqual([]);
  });
  it("stays small", () => {
    expect(statSync("public/models/athlete.glb").size).toBeLessThan(700_000);
    expect(statSync("public/models/moves.glb").size).toBeLessThan(1_500_000);
    expect(statSync("public/models/athlete-skin.jpg").size).toBeLessThan(300_000);
  });
});
