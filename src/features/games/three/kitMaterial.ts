import { MeshStandardMaterial, type Color, type Texture } from "three";
import { KIT_REGIONS } from "./rig";

export interface Kit {
  shirt: Color;
  trousers: Color;
  shoes: Color;
}

/**
 * The body's skin with a kit painted on (spec §6.1): each point is coloured by where it sits on the rest pose (a
 * T-pose, arms along x), before skinning moves it. Shirt: hips to neck, sleeves to mid upper arm; trousers: ankles
 * to hips; shoes below the ankles (the free body is barefoot); the skin texture everywhere else. Every kit shares
 * one shader program.
 */
export function kitMaterial(skin: Texture, kit: Kit): MeshStandardMaterial {
  const material = new MeshStandardMaterial({ map: skin, roughness: 0.75 });
  material.onBeforeCompile = (shader) => {
    Object.assign(shader.uniforms, {
      uAnkle: { value: KIT_REGIONS.ankle },
      uHip: { value: KIT_REGIONS.hip },
      uNeck: { value: KIT_REGIONS.neck },
      uSleeve: { value: KIT_REGIONS.sleeve },
      uShirt: { value: kit.shirt },
      uTrousers: { value: kit.trousers },
      uShoes: { value: kit.shoes },
    });
    shader.vertexShader = shader.vertexShader
      .replace("#include <common>", "#include <common>\nvarying vec3 vRest;")
      .replace("#include <begin_vertex>", "#include <begin_vertex>\nvRest = position;");
    shader.fragmentShader = shader.fragmentShader
      .replace(
        "#include <common>",
        [
          "#include <common>",
          "varying vec3 vRest;",
          "uniform float uAnkle, uHip, uNeck, uSleeve;",
          "uniform vec3 uShirt, uTrousers, uShoes;",
        ].join("\n"),
      )
      .replace(
        "#include <map_fragment>",
        [
          "#include <map_fragment>",
          "if (vRest.y > uHip && vRest.y < uNeck && abs(vRest.x) < uSleeve) diffuseColor.rgb = uShirt;",
          "else if (vRest.y > uAnkle && vRest.y <= uHip) diffuseColor.rgb = uTrousers;",
          "else if (vRest.y <= uAnkle) diffuseColor.rgb = uShoes;",
        ].join("\n"),
      );
  };
  material.customProgramCacheKey = () => "kit";
  return material;
}
