/**
 * Fase 3.9 — Pipeline abstrato.
 */
import type { RenderPipelineStage, RenderPipelineStageId } from "../types";

export const RENDER_PIPELINE: readonly RenderPipelineStage[] = [
  {
    id: "collect",
    label: "Coletando cena",
    description: "Serializando projeto, ambiente e cômodo alvo.",
    weight: 0.04,
  },
  {
    id: "prepare",
    label: "Preparando geometria",
    description: "Tesselando paredes, portas, janelas e módulos.",
    weight: 0.08,
  },
  {
    id: "lighting",
    label: "Iluminação",
    description: "Aplicando HDRI, sol físico, spots e IES.",
    weight: 0.1,
  },
  {
    id: "materials",
    label: "Materiais PBR",
    description: "Vinculando texturas albedo/normal/roughness/AO.",
    weight: 0.08,
  },
  { id: "camera", label: "Câmera", description: "Enquadramento, DoF e exposição.", weight: 0.04 },
  {
    id: "raytrace",
    label: "Ray tracing",
    description: "Sombras, reflexos, GI, amostras.",
    weight: 0.42,
  },
  {
    id: "denoise",
    label: "Denoise",
    description: "OIDN / OptiX / IA — remoção de ruído.",
    weight: 0.08,
  },
  {
    id: "postprocess",
    label: "Pós-processamento",
    description: "Tonemap, bloom, color grading, vignette.",
    weight: 0.08,
  },
  { id: "encode", label: "Codificando", description: "PNG/JPG/EXR ou MP4/HEVC.", weight: 0.05 },
  {
    id: "publish",
    label: "Publicando",
    description: "Disponibilizando na fila e histórico.",
    weight: 0.03,
  },
];

export function stageWeight(id: RenderPipelineStageId): number {
  return RENDER_PIPELINE.find((s) => s.id === id)?.weight ?? 0;
}

/** Progresso acumulado (0..1) até o final do estágio informado. */
export function progressUpTo(id: RenderPipelineStageId): number {
  let acc = 0;
  for (const s of RENDER_PIPELINE) {
    acc += s.weight;
    if (s.id === id) return Math.min(1, acc);
  }
  return 1;
}
