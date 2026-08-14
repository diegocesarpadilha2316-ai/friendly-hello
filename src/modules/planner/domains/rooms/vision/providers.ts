/**
 * Fase 3.7 — IA Visão: registro de providers.
 *
 * Interface comum para qualquer IA de visão (GPT Vision, Gemini Vision,
 * Claude Vision, modelos Open Source). Nesta fase NÃO integramos APIs
 * externas — apenas registramos os providers como stubs, prontos para
 * receber implementação real no futuro. Toda chamada delega para o
 * `simulate()` local, que gera um `VisionRoomModel` plausível.
 */
import { simulateVisionAnalysis } from "./pipeline";
import type { VisionRoomModel, VisionStage, VisionUpload } from "./types";

export interface VisionAnalyzeInput {
  uploads: readonly VisionUpload[];
  /** Recebe atualizações a cada mudança de estágio simulada. */
  onStage?: (stage: VisionStage) => void;
  /** Permite cancelamento futuro. */
  signal?: AbortSignal;
}

export interface VisionProvider {
  id: string;
  name: string;
  vendor: "openai" | "google" | "anthropic" | "oss" | "local";
  /** Documentação: modalidades e limites reais são resolvidos na integração. */
  description: string;
  /** Marca se depende de credenciais externas (nesta fase, todos = false). */
  requiresApiKey: boolean;
  /** Marca se o provider está de fato disponível (nesta fase, apenas `local`). */
  available: boolean;
  analyze(input: VisionAnalyzeInput): Promise<VisionRoomModel>;
}

function stubProvider(
  id: string,
  name: string,
  vendor: VisionProvider["vendor"],
  description: string,
): VisionProvider {
  return {
    id,
    name,
    vendor,
    description,
    requiresApiKey: vendor !== "local",
    available: vendor === "local",
    async analyze(input) {
      // Nesta fase, todos os providers delegam para o simulador.
      // Ao plugar a API real, substituir por chamada estruturada + parser.
      return simulateVisionAnalysis({
        uploads: input.uploads,
        onStage: input.onStage,
        signal: input.signal,
        providerId: id,
      });
    },
  };
}

/**
 * Registro estático de providers.
 * Ordem: default local primeiro, depois os externos (indisponíveis).
 */
export const VISION_PROVIDERS: readonly VisionProvider[] = [
  stubProvider(
    "dioris.local",
    "Dioris Vision (local)",
    "local",
    "Análise heurística determinística — offline, sem credenciais externas.",
  ),
  stubProvider(
    "openai.gpt-vision",
    "GPT Vision",
    "openai",
    "Reconhecimento profundo com o modelo OpenAI multimodal.",
  ),
  stubProvider(
    "google.gemini-vision",
    "Gemini Vision",
    "google",
    "Modelo multimodal do Google com forte compreensão espacial.",
  ),
  stubProvider(
    "anthropic.claude-vision",
    "Claude Vision",
    "anthropic",
    "Análise cuidadosa e explicável de ambientes complexos.",
  ),
  stubProvider(
    "oss.llava",
    "Open Source (LLaVA / Qwen-VL)",
    "oss",
    "Modelos abertos executados em infraestrutura própria.",
  ),
];

export function getVisionProvider(id: string): VisionProvider {
  return VISION_PROVIDERS.find((p) => p.id === id) ?? VISION_PROVIDERS[0];
}

export const DEFAULT_VISION_PROVIDER_ID = VISION_PROVIDERS[0].id;
