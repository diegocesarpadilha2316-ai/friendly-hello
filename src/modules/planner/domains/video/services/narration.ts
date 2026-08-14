/**
 * Fase 3.10 — Narração / trilha / legenda. Interface única; nenhuma API integrada.
 */
import type { VideoMusicMood, VideoNarration, VideoVoiceProvider } from "../types";

export const VOICE_PROVIDERS: readonly {
  id: VideoVoiceProvider;
  label: string;
  description: string;
  available: boolean;
}[] = [
  {
    id: "elevenlabs",
    label: "ElevenLabs",
    description: "Vozes hiper-realistas pt-BR/en-US.",
    available: false,
  },
  { id: "openai", label: "OpenAI TTS", description: "TTS da OpenAI.", available: false },
  { id: "google", label: "Google Cloud TTS", description: "Wavenet / Neural2.", available: false },
  {
    id: "azure",
    label: "Azure Speech",
    description: "Vozes neurais multilíngues.",
    available: false,
  },
  { id: "custom", label: "Personalizado", description: "Adaptador próprio.", available: false },
];

export const MUSIC_MOODS: readonly { id: VideoMusicMood; label: string; description: string }[] = [
  { id: "corporativo", label: "Corporativo", description: "Sério, elegante, institucional." },
  { id: "cinema", label: "Cinema", description: "Trilha épica, orquestral." },
  { id: "lounge", label: "Lounge", description: "Suave, ambiente, sofisticado." },
  { id: "minimal", label: "Minimal", description: "Discreto, moderno, contido." },
  { id: "energetico", label: "Energético", description: "Ritmo alto, ideal para social." },
  { id: "elegante", label: "Elegante", description: "Piano/cordas, requinte." },
];

export const DEFAULT_NARRATION: VideoNarration = {
  enabled: false,
  language: "pt-BR",
  subtitle: { enabled: false, style: "clean" },
  music: { enabled: false, mood: "corporativo", volume: 0.4 },
  voiceVolume: 1,
  musicVolume: 0.4,
};

export function withNarration(patch: Partial<VideoNarration>): VideoNarration {
  return { ...DEFAULT_NARRATION, ...patch };
}
