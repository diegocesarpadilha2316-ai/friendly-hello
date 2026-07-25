/**
 * Fase 3.30 — Configuração real derivada do preset selecionado.
 */
import { getRenderPreset } from "../services/presets";
import { postForPreset } from "../services/postprocess";
import { RENDER_CAMERAS } from "../services/cameras";
import { getLocalQuality } from "../local-engine/quality";
import { performanceForTier, recommendTier } from "../local-engine/performance";
import { texturesForTier } from "../local-engine/textures";
import { buildPlaybook } from "../local-engine/renderer";
import { buildLocalScene } from "../local-engine/scene-builder";
import type { PlannerProject } from "@/modules/planner/shared/types/project";
import type { RenderPresetId, RenderTargetKind } from "../types";
import type { LocalQualityId } from "../local-engine/types";
import type { RealRenderConfig } from "./types";

function mapPresetToLocalQuality(id: RenderPresetId): LocalQualityId {
  switch (id) {
    case "rascunho": return "rascunho";
    case "baixa": return "baixa";
    case "media": return "media";
    case "alta": return "alta";
    case "ultra": return "ultra";
    case "fotografica":
    case "marketing":
    case "cinema":
      return "cinema";
  }
}

export function buildRealRenderConfig(
  project: PlannerProject,
  presetId: RenderPresetId,
  target: RenderTargetKind,
  roomId: string | null,
  hdriId: string | null,
): RealRenderConfig {
  getRenderPreset(presetId); // valida existência
  const qualityId = mapPresetToLocalQuality(presetId);
  const scene = buildLocalScene(project, roomId);
  const tier = recommendTier(scene);
  const playbook = buildPlaybook(qualityId, scene);
  return {
    presetId,
    target,
    playbook,
    performance: performanceForTier(tier),
    textures: texturesForTier(tier),
    postProcessing: postForPreset(presetId),
    cameras: RENDER_CAMERAS,
    hdriId,
  };
}

export { getLocalQuality };