# Model credits

Both packs are by Quaternius and are Creative Commons 0 1.0 (public domain dedication,
https://creativecommons.org/publicdomain/zero/1.0/). Credit is not required under CC0; listed for the record.
They are trimmed for the web by `tools/models.mjs` (run by hand once).

| File               | Source page                                            | Author     | Licence | Original name                                                        | What was changed                                                                                                                                                       |
| ------------------ | ------------------------------------------------------ | ---------- | ------- | -------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `athlete.glb`      | https://quaternius.itch.io/universal-base-characters   | Quaternius | CC0 1.0 | `Superhero_Male_FullBody.gltf` (Universal Base Characters, Standard) | All images, textures and texture slots removed; the three meshes and the skin kept; normals, UVs, colours and weights quantized (`KHR_mesh_quantization`).             |
| `athlete-skin.jpg` | https://quaternius.itch.io/universal-base-characters   | Quaternius | CC0 1.0 | `T_Superhero_Male_Dark.png`                                          | Resized to 1024px and saved as a JPEG (quality 80).                                                                                                                    |
| `moves.glb`        | https://quaternius.itch.io/universal-animation-library | Quaternius | CC0 1.0 | `UAL1_Standard.glb` (Universal Animation Library, Standard)          | Only `Idle_Loop`, `Walk_Loop`, `Jog_Fwd_Loop`, `Sprint_Loop` and `Crouch_Idle_Loop` kept; the mesh, materials and skin removed (the joints stay); keyframes resampled. |
