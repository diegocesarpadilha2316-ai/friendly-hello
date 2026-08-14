/**
 * Fase 3.10 — Presets de qualidade do vídeo.
 */
import type { VideoPreset, VideoPresetId } from "../types";

export const VIDEO_PRESETS: readonly VideoPreset[] = [
  {
    id: "rascunho",
    label: "Rascunho",
    description: "Preview rápido, frames leves.",
    formatId: "fmt-fhd-16-9",
    renderPresetId: "rascunho",
    durationSec: 20,
    recommendedFor: ["apresentacao", "cliente"],
  },
  {
    id: "social",
    label: "Social",
    description: "Reels/Feed/Shorts — vertical e curto.",
    formatId: "fmt-fhd-9-16",
    renderPresetId: "media",
    durationSec: 15,
    recommendedFor: ["reels", "instagram"],
  },
  {
    id: "cliente",
    label: "Cliente",
    description: "Envio para o cliente — Full HD.",
    formatId: "fmt-fhd-16-9",
    renderPresetId: "alta",
    durationSec: 60,
    recommendedFor: ["cliente", "apresentacao"],
  },
  {
    id: "marketing",
    label: "Marketing",
    description: "4K, qualidade publicitária.",
    formatId: "fmt-4k-16-9",
    renderPresetId: "marketing",
    durationSec: 30,
    recommendedFor: ["marketing", "youtube"],
  },
  {
    id: "cinematografico",
    label: "Cinematográfico",
    description: "4K/8K, máxima qualidade.",
    formatId: "fmt-4k-16-9",
    renderPresetId: "fotografica",
    durationSec: 90,
    recommendedFor: ["marketing", "youtube", "apresentacao"],
  },
];

export const DEFAULT_VIDEO_PRESET_ID: VideoPresetId = "cliente";

export function getVideoPreset(id: VideoPresetId): VideoPreset {
  return VIDEO_PRESETS.find((p) => p.id === id) ?? VIDEO_PRESETS[2];
}
