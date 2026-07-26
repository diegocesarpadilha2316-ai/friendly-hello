/**
 * Preview Fotorrealista (Parte 4) — pilha de postprocessing leve que só
 * roda quando `viewport.cinematic` está ativo. Reusa o Canvas do Scene3D,
 * sem novos providers. Efeitos: SSAO sutil, Bloom nos emissivos (lâmpadas
 * do DecorMesh), Vignette e Smaa. Custo controlado — dpr do Canvas já é
 * limitado a 1.5 em Scene3D.
 */
import { EffectComposer, Bloom, SSAO, Vignette, SMAA } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

export function CinematicFX() {
  return (
    <EffectComposer multisampling={0} enableNormalPass>
      <SSAO
        blendFunction={BlendFunction.MULTIPLY}
        samples={16}
        rings={4}
        distanceThreshold={1.0}
        distanceFalloff={0.3}
        rangeThreshold={0.5}
        rangeFalloff={0.1}
        luminanceInfluence={0.7}
        radius={12}
        bias={0.025}
        intensity={22}
        color={undefined as unknown as never}
        worldDistanceThreshold={0}
        worldDistanceFalloff={0}
        worldProximityThreshold={0}
        worldProximityFalloff={0}
      />
      <Bloom
        intensity={0.55}
        luminanceThreshold={0.85}
        luminanceSmoothing={0.2}
        mipmapBlur
        radius={0.75}
      />
      <Vignette eskil={false} offset={0.15} darkness={0.55} />
      <SMAA />
    </EffectComposer>
  );
}