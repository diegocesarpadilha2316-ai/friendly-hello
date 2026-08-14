/**
 * Fase 3.31 — Plano de áudio real (trilha, narração, legenda).
 */
import type { LocalAudioTrack } from "../local-engine/types";
import type { RealAudioPlan } from "./types";

export function buildAudioPlan(a: LocalAudioTrack, narrationVoice?: string): RealAudioPlan {
  return {
    enabled: a.enabled,
    narrationText: a.narrationText,
    narrationVoice,
    musicEnabled: a.enabled,
    musicMood: a.musicMood,
    musicVolume: a.musicVolume,
    narrationVolume: a.narrationVolume,
    subtitleEnabled: a.subtitleEnabled,
    language: a.language,
  };
}
