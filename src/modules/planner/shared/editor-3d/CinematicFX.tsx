/**
 * Preview Fotorrealista — pilha de postprocessing que só roda quando
 * `viewport.cinematic` está ativo. Reusa o Canvas do Scene3D, sem novos
 * providers.
 *
 * Ordem importa: SSAO (sombra de contato nas quinas, o efeito que mais
 * "cola" os móveis no ambiente) → Bloom (emissivos de LED) → correção de
 * cor sutil → Vignette → SMAA.
 */
import {
  EffectComposer,
  Bloom,
  BrightnessContrast,
  HueSaturation,
  N8AO,
  Vignette,
  SMAA,
} from "@react-three/postprocessing";

export function CinematicFX() {
  return (
    <EffectComposer multisampling={0}>
      {/* Oclusão de ambiente: quinas de armário, vãos, junta piso/parede. */}
      <N8AO aoRadius={0.55} intensity={2.1} distanceFalloff={0.8} halfRes color="#0a0c12" />
      <Bloom
        intensity={0.5}
        luminanceThreshold={0.86}
        luminanceSmoothing={0.22}
        mipmapBlur
        radius={0.72}
      />
      {/* Leve punch de estúdio, sem estourar o branco da laca. */}
      <HueSaturation saturation={0.06} hue={0} />
      <BrightnessContrast brightness={0.01} contrast={0.07} />
      <Vignette eskil={false} offset={0.18} darkness={0.5} />
      <SMAA />
    </EffectComposer>
  );
}
