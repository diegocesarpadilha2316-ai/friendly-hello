/**
 * Fase 3.10 — Pipeline abstrato do Video Engine.
 * `render-frames` DELEGA ao Render Engine — nunca duplicamos render.
 */
import type { VideoPipelineStage, VideoPipelineStageId } from "../types";

export const VIDEO_PIPELINE: readonly VideoPipelineStage[] = [
  {
    id: "collect",
    label: "Coletando cena",
    description: "Serializando projeto, cômodo alvo e sequências.",
    weight: 0.04,
  },
  {
    id: "plan-camera",
    label: "Planejando câmeras",
    description: "Aplicando movimentos (orbit, fly, walk, pan, tilt, zoom, close, detalhe).",
    weight: 0.06,
  },
  {
    id: "plan-animations",
    label: "Planejando animações",
    description: "Portas, gavetas, LEDs, explode, estrutura, ferragens, cortes.",
    weight: 0.05,
  },
  {
    id: "plan-timeline",
    label: "Compilando timeline",
    description: "Keyframes, sequências, transições, loops, pausas.",
    weight: 0.04,
  },
  {
    id: "render-frames",
    label: "Renderizando frames",
    description: "Delega ao Render Engine — reuso integral.",
    weight: 0.5,
  },
  {
    id: "compose-transitions",
    label: "Compondo transições",
    description: "Fades, cortes, dissolves, wipes, morph.",
    weight: 0.06,
  },
  {
    id: "narration-mix",
    label: "Mixando áudio",
    description: "TTS, trilha, legenda.",
    weight: 0.06,
  },
  {
    id: "encode",
    label: "Codificando",
    description: "MP4 / MOV / GIF / PNG · H264 / H265 / ProRes.",
    weight: 0.1,
  },
  {
    id: "branding-overlay",
    label: "Marca / finalização",
    description: "Logo, marca d'água, chamada, QR Code.",
    weight: 0.05,
  },
  {
    id: "publish",
    label: "Publicando",
    description: "Registrando no histórico da fila.",
    weight: 0.04,
  },
];

export function stageWeight(id: VideoPipelineStageId): number {
  return VIDEO_PIPELINE.find((s) => s.id === id)?.weight ?? 0;
}

export function progressUpTo(id: VideoPipelineStageId): number {
  let acc = 0;
  for (const s of VIDEO_PIPELINE) {
    acc += s.weight;
    if (s.id === id) return Math.min(1, acc);
  }
  return 1;
}

export function statusForStage(
  id: VideoPipelineStageId,
): "planning" | "rendering-frames" | "compositing" | "encoding" | "branding" | "publishing" {
  switch (id) {
    case "collect":
    case "plan-camera":
    case "plan-animations":
    case "plan-timeline":
      return "planning";
    case "render-frames":
      return "rendering-frames";
    case "compose-transitions":
    case "narration-mix":
      return "compositing";
    case "encode":
      return "encoding";
    case "branding-overlay":
      return "branding";
    case "publish":
      return "publishing";
  }
}
