// The asset step for the 3D games (Phase 8): turns two free CC0 Quaternius packs into small web files.
// Run by hand, once; it is not part of the build.
//
// Usage:  node tools/models.mjs <folder holding ubc/ and ual/>
//
// Inputs (read as DATA only; the folder is untrusted, nothing in it is ever run):
//   <folder>/ubc/Superhero_Male_FullBody.gltf (+ .bin)   Universal Base Characters, the body
//   <folder>/ubc/T_Superhero_Male_Dark.png               the body's colour texture
//   <folder>/ual/UAL1_Standard.glb                       Universal Animation Library, the moves
// Outputs:
//   public/models/athlete.glb       the body: 3 meshes + the skin, no images, quantized (no decoder needed)
//   public/models/athlete-skin.jpg  the colour texture, 1024px JPEG (a separate same-origin file: the CSP has no blob:)
//   public/models/moves.glb         joints + only the clips we use, no mesh
import { execFileSync } from "node:child_process";
import { mkdirSync, readFileSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { Extension, NodeIO } from "@gltf-transform/core";
import { dedup, prune, quantize, resample } from "@gltf-transform/functions";

const src = process.argv[2];
if (!src) {
  console.error("usage: node tools/models.mjs <folder holding ubc/ and ual/>");
  process.exit(1);
}
const out = resolve(dirname(fileURLToPath(import.meta.url)), "../public/models");
mkdirSync(out, { recursive: true });
// Lets the writer declare KHR_mesh_quantization (the extensions package is not a direct dependency). Three reads it with no decoder.
class MeshQuantization extends Extension {
  extensionName = "KHR_mesh_quantization";
  static EXTENSION_NAME = "KHR_mesh_quantization";
  read() {
    return this;
  }
  write() {
    return this;
  }
}
const io = new NodeIO().registerExtensions([MeshQuantization]);

// The clips we keep. Repeated from LIBRARY_CLIPS in src/features/games/three/rig.ts: keep the two in step.
const KEEP_CLIPS = ["Idle_Loop", "Walk_Loop", "Jog_Fwd_Loop", "Sprint_Loop", "Crouch_Idle_Loop"];

// --- Body ---------------------------------------------------------------
// The .gltf names 7 PNGs, and only some are in the folder. We never want them, so the images, textures and
// every texture slot are dropped from the JSON before glTF-Transform reads it.
const bodyJson = JSON.parse(readFileSync(join(src, "ubc/Superhero_Male_FullBody.gltf"), "utf8"));
delete bodyJson.images;
delete bodyJson.textures;
delete bodyJson.samplers;
const dropTextureSlots = (o) => {
  for (const k of Object.keys(o)) {
    if (/Texture$/.test(k)) delete o[k];
    else if (o[k] && typeof o[k] === "object") dropTextureSlots(o[k]);
  }
};
for (const m of bodyJson.materials ?? []) dropTextureSlots(m);
const bodyBin = new Uint8Array(readFileSync(join(src, "ubc/Superhero_Male_FullBody.bin")));
const body = await io.readJSON({
  json: bodyJson,
  resources: Object.fromEntries(bodyJson.buffers.map((b) => [b.uri, bodyBin])),
});
// The kit is painted by comparing each vertex's rest-pose position with heights in metres (KIT_REGIONS in rig.ts),
// so POSITION stays float32 and everything else is quantized.
// The texture UVs (TEXCOORD_0) must survive: prune() would drop them (no material uses a texture now), so keepAttributes.
// The spare UV sets and second colour set are not used, so they go.
for (const mesh of body.getRoot().listMeshes()) {
  for (const prim of mesh.listPrimitives()) {
    for (const semantic of prim.listSemantics()) {
      if (/^TEXCOORD_[1-9]$|^COLOR_[1-9]$/.test(semantic)) prim.setAttribute(semantic, null);
    }
  }
}
await body.transform(
  prune({ keepAttributes: true }),
  dedup(),
  quantize({ pattern: /^(?!POSITION$)/ }),
);
// Quantized normals, UVs and colours need the extension declared (quantize() only declares it when POSITION is quantized).
body.createExtension(MeshQuantization).setRequired(true);
await io.write(join(out, "athlete.glb"), body);

// --- Moves --------------------------------------------------------------
const moves = await io.read(join(src, "ual/UAL1_Standard.glb"));
for (const a of moves.getRoot().listAnimations()) {
  if (KEEP_CLIPS.includes(a.getName())) continue;
  // The channels and samplers hold the keyframes; dispose them too or the keyframes stay in the file.
  a.listChannels().forEach((c) => c.dispose());
  a.listSamplers().forEach((s) => s.dispose());
  a.dispose();
}
for (const n of moves.getRoot().listNodes()) {
  const mesh = n.getMesh();
  n.setMesh(null).setSkin(null);
  mesh?.dispose();
}
for (const s of moves.getRoot().listSkins()) s.dispose();
for (const m of moves.getRoot().listMaterials()) m.dispose();
await moves.transform(resample(), dedup(), prune());
await io.write(join(out, "moves.glb"), moves);

// --- Skin ---------------------------------------------------------------
// sips is the macOS built-in image tool.
execFileSync("sips", [
  "-s",
  "format",
  "jpeg",
  "-s",
  "formatOptions",
  "80",
  "-Z",
  "1024",
  join(src, "ubc/T_Superhero_Male_Dark.png"),
  "--out",
  join(out, "athlete-skin.jpg"),
]);
console.log("wrote athlete.glb, moves.glb, athlete-skin.jpg to", out);
