/**
 * Fase 3.9 — Presets de qualidade.
 * Cada preset descreve o "envelope" de qualidade que qualquer provider
 * (local, IA, nuvem, vídeo, marketing) deve honrar.
 */
import type { RenderPreset, RenderPresetId, RenderResolution } from "../types";

const RES = {
  hd: { width: 1280, height: 720, label: "HD 720p" } as const satisfies RenderResolution,
  fhd: { width: 1920, height: 1080, label: "Full HD 1080p" } as const satisfies RenderResolution,
  qhd: { width: 2560, height: 1440, label: "2K 1440p" } as const satisfies RenderResolution,
  uhd: { width: 3840, height: 2160, label: "4K 2160p" } as const satisfies RenderResolution,
  print: { width: 5120, height: 2880, label: "5K Impressão" } as const satisfies RenderResolution,
};

export const RENDER_PRESETS: readonly RenderPreset[] = [
  {
    id: "rascunho",
    label: "Rascunho",
    description: "Pré-visualização instantânea, sem qualidade final.",
    usage: ["iteração rápida", "review de layout"],
    recommendedFor: ["still"],
    quality: {
      shadows: "off",
      reflections: "baixa",
      globalIllumination: "off",
      ambientOcclusion: "baixa",
      quality: "baixa",
      antialiasing: "fxaa",
      resolution: RES.hd,
      samples: 16,
      denoise: "off",
    },
  },
  {
    id: "baixa",
    label: "Baixa",
    description: "Pré-produção com iluminação básica.",
    usage: ["apresentações rápidas", "aprovação de cliente"],
    recommendedFor: ["still", "ai"],
    quality: {
      shadows: "baixa",
      reflections: "baixa",
      globalIllumination: "baixa",
      ambientOcclusion: "baixa",
      quality: "baixa",
      antialiasing: "taa",
      resolution: RES.hd,
      samples: 64,
      denoise: "temporal",
    },
  },
  {
    id: "media",
    label: "Média",
    description: "Balance entre tempo e realismo.",
    usage: ["renders internos", "estudos de iluminação"],
    recommendedFor: ["still", "ai", "marketing"],
    quality: {
      shadows: "media",
      reflections: "media",
      globalIllumination: "media",
      ambientOcclusion: "media",
      quality: "media",
      antialiasing: "taa",
      resolution: RES.fhd,
      samples: 256,
      denoise: "oidn",
    },
  },
  {
    id: "alta",
    label: "Alta",
    description: "Realismo alto com sombras suaves e reflexos precisos.",
    usage: ["renders comerciais", "portfólio"],
    recommendedFor: ["still", "marketing"],
    quality: {
      shadows: "alta",
      reflections: "alta",
      globalIllumination: "alta",
      ambientOcclusion: "alta",
      quality: "alta",
      antialiasing: "msaa4x",
      resolution: RES.qhd,
      samples: 1024,
      denoise: "oidn",
    },
  },
  {
    id: "ultra",
    label: "Ultra",
    description: "Ray tracing pesado, GI completo, sem concessões.",
    usage: ["cliente premium", "impressão"],
    recommendedFor: ["still", "marketing", "panorama"],
    quality: {
      shadows: "ultra",
      reflections: "ultra",
      globalIllumination: "ultra",
      ambientOcclusion: "ultra",
      quality: "ultra",
      antialiasing: "msaa8x",
      resolution: RES.uhd,
      samples: 4096,
      denoise: "optix",
    },
  },
  {
    id: "fotografica",
    label: "Fotográfica",
    description: "Simulação óptica realista com DoF, bloom, aberração.",
    usage: ["renders indistinguíveis de foto", "hero shots"],
    recommendedFor: ["still", "marketing"],
    quality: {
      shadows: "ultra",
      reflections: "ultra",
      globalIllumination: "ultra",
      ambientOcclusion: "ultra",
      quality: "ultra",
      antialiasing: "msaa8x",
      resolution: RES.uhd,
      samples: 8192,
      denoise: "ai",
    },
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "Pipeline otimizado para peças de campanha e redes sociais.",
    usage: ["Instagram", "site", "catálogo"],
    recommendedFor: ["still", "marketing", "video"],
    quality: {
      shadows: "alta",
      reflections: "ultra",
      globalIllumination: "alta",
      ambientOcclusion: "alta",
      quality: "alta",
      antialiasing: "msaa4x",
      resolution: RES.print,
      samples: 2048,
      denoise: "ai",
    },
  },
];

const INDEX = new Map(RENDER_PRESETS.map((p) => [p.id, p]));

export function getRenderPreset(id: RenderPresetId): RenderPreset {
  const p = INDEX.get(id);
  if (!p) throw new Error(`RenderPreset desconhecido: ${id}`);
  return p;
}

export const DEFAULT_RENDER_PRESET_ID: RenderPresetId = "media";