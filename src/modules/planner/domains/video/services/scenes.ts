/**
 * Fase 3.10 — Cenas prontas.
 */
import { instantiateAnimation } from "./animations";
import { CAMERA_MOVES, instantiateCameraMove } from "./camera-moves";
import { buildLinearTimeline } from "./timeline";
import type {
  VideoAnimation,
  VideoCameraMove,
  VideoScenePreset,
  VideoSceneKind,
  VideoTimeline,
} from "../types";

export const SCENE_PRESETS: readonly VideoScenePreset[] = [
  { id: "scene-apresentacao", kind: "apresentacao", label: "Apresentação", description: "Tour cinemático completo — orbital, walk through, close nas ferragens.", durationSec: 45, aspectRatio: "16:9", recommendedFormatIds: ["fmt-fhd-16-9", "fmt-4k-16-9"], usage: ["Reunião", "Vistoria", "Portfólio"] },
  { id: "scene-cliente", kind: "cliente", label: "Cliente", description: "Vídeo dedicado ao cliente — narração + close nos móveis + LEDs.", durationSec: 60, aspectRatio: "16:9", recommendedFormatIds: ["fmt-fhd-16-9"], usage: ["Envio pessoal", "WhatsApp", "E-mail"] },
  { id: "scene-marketing", kind: "marketing", label: "Marketing", description: "Vinheta com marca — orbital rápido, corte seco, chamada final.", durationSec: 30, aspectRatio: "16:9", recommendedFormatIds: ["fmt-4k-16-9", "fmt-8k-16-9"], usage: ["Site", "LinkedIn", "Google Ads"] },
  { id: "scene-instagram", kind: "instagram", label: "Instagram Feed", description: "Vertical 4:5 curto — 3 planos rápidos e branding final.", durationSec: 20, aspectRatio: "4:5", recommendedFormatIds: ["fmt-fhd-4-5"], usage: ["Feed", "Carrossel de vídeo"] },
  { id: "scene-reels", kind: "reels", label: "Reels / TikTok", description: "Vertical 9:16 dinâmico — cortes rápidos, câmera automática, legenda.", durationSec: 15, aspectRatio: "9:16", recommendedFormatIds: ["fmt-fhd-9-16", "fmt-4k-9-16"], usage: ["Reels", "TikTok", "Shorts"] },
  { id: "scene-youtube", kind: "youtube", label: "YouTube", description: "Horizontal 16:9 longo — tour completo com narração e trilha.", durationSec: 90, aspectRatio: "16:9", recommendedFormatIds: ["fmt-4k-16-9"], usage: ["YouTube", "Blog", "Case"] },
  { id: "scene-catalogo", kind: "catalogo", label: "Catálogo", description: "Foco no produto — orbital + explode + ferragens + estrutura.", durationSec: 25, aspectRatio: "1:1", recommendedFormatIds: ["fmt-fhd-1-1"], usage: ["E-commerce", "Ficha técnica", "Showroom digital"] },
];

export function getScenePreset(id: string): VideoScenePreset {
  return SCENE_PRESETS.find((s) => s.id === id) ?? SCENE_PRESETS[0];
}
export function scenePresetByKind(kind: VideoSceneKind): VideoScenePreset {
  return SCENE_PRESETS.find((s) => s.kind === kind) ?? SCENE_PRESETS[0];
}

export function buildSceneTimeline(kind: VideoSceneKind): {
  moves: readonly VideoCameraMove[];
  animations: readonly VideoAnimation[];
  timeline: VideoTimeline;
} {
  let moves: VideoCameraMove[] = [];
  const anims: VideoAnimation[] = [];
  switch (kind) {
    case "apresentacao":
      moves = [
        instantiateCameraMove("fly-through", { durationSec: 8 }),
        instantiateCameraMove("orbit", { durationSec: 14 }),
        instantiateCameraMove("walk-through", { durationSec: 12 }),
        instantiateCameraMove("close", { durationSec: 6 }),
        instantiateCameraMove("detail", { durationSec: 5 }),
      ];
      anims.push(instantiateAnimation("led-on", { startSec: 6 }));
      anims.push(instantiateAnimation("door-open", { startSec: 22 }));
      anims.push(instantiateAnimation("drawer-open", { startSec: 24 }));
      break;
    case "cliente":
      moves = [
        instantiateCameraMove("walk-through", { durationSec: 14 }),
        instantiateCameraMove("orbit", { durationSec: 18 }),
        instantiateCameraMove("close", { durationSec: 14 }),
        instantiateCameraMove("pan", { durationSec: 14 }),
      ];
      anims.push(instantiateAnimation("led-on", { startSec: 4 }));
      anims.push(instantiateAnimation("door-open", { startSec: 18 }));
      break;
    case "marketing":
      moves = [
        instantiateCameraMove("orbit", { durationSec: 10, easing: "cinematic" }),
        instantiateCameraMove("zoom", { durationSec: 6 }),
        instantiateCameraMove("detail", { durationSec: 6 }),
        instantiateCameraMove("pan", { durationSec: 8 }),
      ];
      anims.push(instantiateAnimation("lighting-swap", { startSec: 10 }));
      break;
    case "instagram":
      moves = [
        instantiateCameraMove("pan", { durationSec: 6 }),
        instantiateCameraMove("close", { durationSec: 7 }),
        instantiateCameraMove("tilt", { durationSec: 7 }),
      ];
      break;
    case "reels":
      moves = [
        instantiateCameraMove("zoom", { durationSec: 3 }),
        instantiateCameraMove("orbit", { durationSec: 6, easing: "snap" }),
        instantiateCameraMove("detail", { durationSec: 3 }),
        instantiateCameraMove("close", { durationSec: 3 }),
      ];
      anims.push(instantiateAnimation("led-on", { startSec: 2 }));
      break;
    case "youtube":
      moves = [
        instantiateCameraMove("fly-through", { durationSec: 12 }),
        instantiateCameraMove("walk-through", { durationSec: 24 }),
        instantiateCameraMove("orbit", { durationSec: 20 }),
        instantiateCameraMove("close", { durationSec: 14 }),
        instantiateCameraMove("detail", { durationSec: 10 }),
        instantiateCameraMove("pan", { durationSec: 10 }),
      ];
      anims.push(instantiateAnimation("door-open", { startSec: 40 }));
      anims.push(instantiateAnimation("drawer-open", { startSec: 42 }));
      anims.push(instantiateAnimation("show-hardware", { startSec: 60 }));
      break;
    case "catalogo":
      moves = [
        instantiateCameraMove("orbit", { durationSec: 10 }),
        instantiateCameraMove("close", { durationSec: 5 }),
        instantiateCameraMove("detail", { durationSec: 5 }),
        instantiateCameraMove("zoom", { durationSec: 5 }),
      ];
      anims.push(instantiateAnimation("explode", { startSec: 10 }));
      anims.push(instantiateAnimation("show-structure", { startSec: 15 }));
      anims.push(instantiateAnimation("show-hardware", { startSec: 20 }));
      break;
  }
  const timeline = buildLinearTimeline({ fps: 30, moves, animations: anims });
  return { moves, animations: anims, timeline };
}

export const AVAILABLE_MOVES = CAMERA_MOVES;
