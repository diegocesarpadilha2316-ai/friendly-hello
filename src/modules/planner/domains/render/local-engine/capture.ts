/**
 * Fase 3.21 — Solicitação de captura.
 */
import { LOCAL_CAMERAS } from "./cameras";
import type {
  LocalCaptureRequest,
  LocalCaptureScope,
  LocalOutputSpec,
  LocalQualityId,
} from "./types";

export const DEFAULT_OUTPUT: LocalOutputSpec = {
  format: "png",
  bitDepth: 8,
  quality: 0.92,
  resolution: { width: 1920, height: 1080, label: "Full HD 1080p" },
};

export const CAPTURE_SCOPES: readonly {
  readonly id: LocalCaptureScope;
  readonly label: string;
  readonly description: string;
}[] = [
  { id: "single", label: "Imagem única", description: "Captura uma câmera e um cômodo." },
  { id: "batch", label: "Lote", description: "Múltiplas câmeras selecionadas." },
  { id: "all-environments", label: "Todos os ambientes", description: "Percorre cada ambiente." },
  { id: "current-environment", label: "Ambiente atual", description: "Só o ambiente ativo." },
  { id: "selection", label: "Somente seleção", description: "Apenas cômodos selecionados." },
];

export function buildCaptureRequest(input: {
  scope: LocalCaptureScope;
  qualityId: LocalQualityId;
  output?: LocalOutputSpec;
  cameraIds?: readonly string[];
  roomIds?: readonly string[];
  notes?: string;
}): LocalCaptureRequest {
  return {
    scope: input.scope,
    qualityId: input.qualityId,
    output: input.output ?? DEFAULT_OUTPUT,
    cameraIds: input.cameraIds && input.cameraIds.length > 0 ? input.cameraIds : [LOCAL_CAMERAS[0].id],
    roomIds: input.roomIds ?? [],
    notes: input.notes,
  };
}