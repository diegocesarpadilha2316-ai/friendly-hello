/**
 * Fase 3.9 — Providers de render (arquitetura futura).
 *
 * Nenhum motor real é chamado nesta fase. A interface está pronta para
 * Render Local (WebGPU/Three), Render IA (difusão), Render em Nuvem,
 * Vídeo e Marketing.
 */
import type { RenderProvider, RenderProviderId } from "../types";

export const RENDER_PROVIDERS: readonly RenderProvider[] = [
  { id: "dioris.local", label: "Dioris Local (WebGPU)", description: "Render em tempo real no navegador do usuário.", supports: ["still", "panorama"], available: true },
  { id: "dioris.cloud", label: "Dioris Cloud", description: "Farm de GPU dedicado a projetos premium.", supports: ["still", "panorama", "video"], available: false },
  { id: "dioris.ai", label: "Dioris IA", description: "Difusão orientada por geometria para fotorrealismo instantâneo.", supports: ["still", "ai", "marketing"], available: false },
  { id: "dioris.video", label: "Dioris Vídeo", description: "Sequenciador de câmeras para animações e reels.", supports: ["video"], available: false },
  { id: "dioris.marketing", label: "Dioris Marketing", description: "Templates prontos para redes sociais e catálogos.", supports: ["marketing"], available: false },
];

export const DEFAULT_RENDER_PROVIDER_ID: RenderProviderId = "dioris.local";

export function getProvider(id: RenderProviderId): RenderProvider {
  const p = RENDER_PROVIDERS.find((x) => x.id === id);
  if (!p) throw new Error(`RenderProvider desconhecido: ${id}`);
  return p;
}