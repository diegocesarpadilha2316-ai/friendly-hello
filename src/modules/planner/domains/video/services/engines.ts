/**
 * Fase 3.10 — Motores (Gratuito + Premium).
 */
import type { VideoEngine, VideoEngineId, VideoResolutionTier } from "../types";

const capBase = (max: VideoResolutionTier, maxDur: number) => ({
  cameraMoves: true,
  objectAnimations: true,
  aiUpscale: false,
  aiInterpolation: false,
  aiStyleTransfer: false,
  maxDurationSec: maxDur,
  maxResolutionTier: max,
});

export const VIDEO_ENGINES: readonly VideoEngine[] = [
  {
    id: "dioris.free",
    tier: "free",
    label: "Motor Gratuito Dioris",
    description: "Algoritmo próprio, determinístico, sem IA e sem custo de geração. Usa o Render Engine para os frames.",
    features: [
      "Orbit / Fly / Walk / Pan / Tilt / Zoom / Travelling / Close / Detalhes / Câmera automática",
      "13 animações declarativas (portas, gavetas, LEDs, explode, estrutura, ferragens, cortes)",
      "Cenas prontas: Apresentação, Cliente, Marketing, IG, Reels, YouTube, Catálogo",
      "MP4 / MOV / GIF / PNG · 4K / 8K · Vertical / Horizontal / Quadrado",
      "Marca d'água, chamada final, QR Code",
      "Sem custo por geração",
    ],
    available: true,
    requiresIntegration: false,
    capabilities: capBase("8k", 600),
  },
  { id: "dioris.premium.runway", tier: "premium", label: "Premium · Runway", description: "Gen-3+ para variações cinemáticas, style transfer e interpolação por IA.", features: ["Style transfer", "Upscale IA", "Interpolação temporal"], available: false, requiresIntegration: true, integrationVendor: "runway", capabilities: { ...capBase("4k", 40), aiUpscale: true, aiInterpolation: true, aiStyleTransfer: true } },
  { id: "dioris.premium.pika", tier: "premium", label: "Premium · Pika", description: "Geração rápida para redes sociais com prompts curtos.", features: ["Prompts curtos", "Reels ultra rápidos"], available: false, requiresIntegration: true, integrationVendor: "pika", capabilities: { ...capBase("fhd", 20), aiStyleTransfer: true } },
  { id: "dioris.premium.luma", tier: "premium", label: "Premium · Luma Dream Machine", description: "Geração fotográfica de alta qualidade com controle de câmera.", features: ["Câmera dirigida por IA", "Upscale IA"], available: false, requiresIntegration: true, integrationVendor: "luma", capabilities: { ...capBase("4k", 40), aiUpscale: true, aiInterpolation: true } },
  { id: "dioris.premium.kling", tier: "premium", label: "Premium · Kling", description: "Motor asiático para movimentos longos e coerência temporal.", features: ["Movimentos longos", "Coerência temporal"], available: false, requiresIntegration: true, integrationVendor: "kling", capabilities: { ...capBase("fhd", 120), aiInterpolation: true } },
  { id: "dioris.premium.openai", tier: "premium", label: "Premium · OpenAI (Sora / GPT Video)", description: "Reservado para modelos OpenAI de geração de vídeo.", features: ["Style transfer", "Upscale IA"], available: false, requiresIntegration: true, integrationVendor: "openai", capabilities: { ...capBase("4k", 60), aiUpscale: true, aiInterpolation: true, aiStyleTransfer: true } },
  { id: "dioris.premium.gemini", tier: "premium", label: "Premium · Google Gemini (Veo)", description: "Reservado para Veo — cenas coerentes e câmera dirigida.", features: ["Cena coerente", "Câmera dirigida"], available: false, requiresIntegration: true, integrationVendor: "gemini", capabilities: { ...capBase("4k", 60), aiUpscale: true, aiInterpolation: true } },
];

export const DEFAULT_VIDEO_ENGINE_ID: VideoEngineId = "dioris.free";

export function getVideoEngine(id: VideoEngineId): VideoEngine {
  return VIDEO_ENGINES.find((e) => e.id === id) ?? VIDEO_ENGINES[0];
}
