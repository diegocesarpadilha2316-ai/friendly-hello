/**
 * Preview Fotorrealista (Parte 4) — pilha de postprocessing leve que só
 * roda quando `viewport.cinematic` está ativo. Reusa o Canvas do Scene3D,
 * sem novos providers. Efeitos: SSAO sutil, Bloom nos emissivos (lâmpadas
 * do DecorMesh), Vignette e Smaa. Custo controlado — dpr do Canvas já é
 * limitado a 1.5 em Scene3D.
 */
import { EffectComposer, Bloom, Vignette, SMAA } from "@react-three/postprocessing";

export function CinematicFX() {
  return (
    <EffectComposer multisampling={0}>
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