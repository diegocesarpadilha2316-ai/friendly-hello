/**
 * Fase 3.22 — Escopos e solicitações de captura de vídeo.
 */
import { LOCAL_CAMERAS } from "../../render/local-engine/cameras";
import { defaultTimeline } from "./timeline";
import { DEFAULT_VIDEO_OUTPUT } from "./encoder";
import type {
  LocalAudioTrack,
  LocalTimeline,
  LocalVideoCaptureRequest,
  LocalVideoOutputSpec,
  LocalVideoScope,
} from "./types";
import type { LocalQualityId } from "../../render/local-engine/types";

export const VIDEO_CAPTURE_SCOPES: readonly {
  readonly id: LocalVideoScope;
  readonly label: string;
  readonly description: string;
}[] = [
  {
    id: "project",
    label: "Projeto inteiro",
    description: "Percorre todos os ambientes e cômodos.",
  },
  { id: "current-environment", label: "Ambiente atual", description: "Somente o ambiente ativo." },
  { id: "selection", label: "Somente seleção", description: "Apenas cômodos selecionados." },
  { id: "all-environments", label: "Todos os ambientes", description: "Um clip por ambiente." },
  { id: "batch", label: "Lote", description: "Múltiplas câmeras selecionadas." },
];

export const DEFAULT_AUDIO: LocalAudioTrack = {
  enabled: false,
  language: "pt-BR",
  subtitleEnabled: false,
  musicMood: "cinema",
  musicVolume: 0.5,
  narrationVolume: 1,
  syncToClips: true,
};

export function buildVideoCapture(input: {
  scope: LocalVideoScope;
  qualityId: LocalQualityId;
  output?: LocalVideoOutputSpec;
  timeline?: LocalTimeline;
  audio?: LocalAudioTrack;
  cameraIds?: readonly string[];
  roomIds?: readonly string[];
  notes?: string;
}): LocalVideoCaptureRequest {
  return {
    scope: input.scope,
    qualityId: input.qualityId,
    output: input.output ?? DEFAULT_VIDEO_OUTPUT,
    timeline: input.timeline ?? defaultTimeline(),
    audio: input.audio ?? DEFAULT_AUDIO,
    cameraIds:
      input.cameraIds && input.cameraIds.length > 0 ? input.cameraIds : [LOCAL_CAMERAS[0].id],
    roomIds: input.roomIds ?? [],
    notes: input.notes,
  };
}
