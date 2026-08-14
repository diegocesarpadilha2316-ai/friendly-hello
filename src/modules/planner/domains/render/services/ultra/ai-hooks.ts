/**
 * Fase 3.12 — Hooks de IA (arquitetura de intents).
 * NÃO executa IA — apenas declara os pontos de extensão que os
 * domínios `ia`, `render`, `video` já existentes irão consumir.
 */
import type { AiHook } from "../../types/ultra";

export const AI_RENDER_HOOKS: readonly AiHook[] = [
  {
    id: "render.enhance",
    label: "Melhorar Render",
    description: "Aumenta realismo, ilumina áreas escuras, corrige white balance.",
    capability: ["still", "marketing"],
    requiresProvider: ["dioris.ai", "dioris.cloud"],
  },
  {
    id: "render.swap-materials",
    label: "Trocar Materiais",
    description: "Substitui materiais por família (madeira/pedra/metal).",
    capability: ["still", "marketing"],
    requiresProvider: ["dioris.local", "dioris.ai"],
  },
  {
    id: "render.relight",
    label: "Reiluminar Cena",
    description: "Aplica novo HDRI/sol e recalcula sombras.",
    capability: ["still", "marketing", "panorama"],
    requiresProvider: ["dioris.local", "dioris.ai"],
  },
  {
    id: "render.new-scene",
    label: "Criar Nova Cena",
    description: "Gera variação de composição a partir do projeto.",
    capability: ["still", "ai"],
    requiresProvider: ["dioris.ai"],
  },
  {
    id: "render.adjust-camera",
    label: "Ajustar Câmera",
    description: "Otimiza enquadramento, altura, DoF e lente.",
    capability: ["still", "video"],
    requiresProvider: ["dioris.local", "dioris.ai"],
  },
  {
    id: "render.generate-image",
    label: "Gerar Imagem",
    description: "Renderiza imagem final via provider IA.",
    capability: ["still", "ai", "marketing"],
    requiresProvider: ["dioris.ai", "dioris.cloud"],
  },
  {
    id: "render.generate-video",
    label: "Gerar Vídeo",
    description: "Envia timeline para o Video Engine já existente.",
    capability: ["video"],
    requiresProvider: ["dioris.video"],
  },
];
