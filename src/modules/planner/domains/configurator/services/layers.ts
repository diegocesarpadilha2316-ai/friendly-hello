import type { PlannerParametricNode } from "@/modules/planner/shared";
import type { ConfiguratorLayer, ConfiguratorLayerId } from "../types";

export const CONFIGURATOR_LAYERS: readonly ConfiguratorLayer[] = [
  { id: "estrutura", label: "Estrutura", color: "hsl(210 90% 60%)", description: "Laterais, fundos, prateleiras, divisórias" },
  { id: "portas", label: "Portas", color: "hsl(160 70% 50%)", description: "Frentes de porta com dobradiças" },
  { id: "gavetas", label: "Gavetas", color: "hsl(30 90% 60%)", description: "Frentes e caixas de gaveta" },
  { id: "ferragens", label: "Ferragens", color: "hsl(280 70% 65%)", description: "Puxadores, dobradiças, corrediças" },
  { id: "vidros", label: "Vidros", color: "hsl(190 80% 65%)", description: "Portas e prateleiras de vidro" },
  { id: "espelhos", label: "Espelhos", color: "hsl(220 30% 80%)", description: "Painéis espelhados" },
  { id: "led", label: "LED", color: "hsl(50 100% 60%)", description: "Iluminação integrada" },
  { id: "decoracao", label: "Decoração", color: "hsl(340 80% 65%)", description: "Objetos decorativos e cortesia" },
  { id: "producao", label: "Produção", color: "hsl(0 0% 65%)", description: "Marcações e overlays de fábrica" },
];

function has(node: PlannerParametricNode, key: string): boolean {
  const v = node.params[key];
  return v === true || (typeof v === "number" && v > 0) || (typeof v === "string" && v.length > 0);
}

/** Deriva a camada primária de um nó — determinístico, sem persistência. */
export function layerForNode(node: PlannerParametricNode): ConfiguratorLayerId {
  if (has(node, "mirror")) return "espelhos";
  if (has(node, "glass")) return "vidros";
  if (has(node, "led")) return "led";
  if (has(node, "drawers")) return "gavetas";
  if (has(node, "doors")) return "portas";
  if (node.kind === "hardware") return "ferragens";
  return "estrutura";
}

export function countByLayer(nodes: readonly PlannerParametricNode[]): Record<ConfiguratorLayerId, number> {
  const acc: Record<ConfiguratorLayerId, number> = {
    estrutura: 0, portas: 0, gavetas: 0, ferragens: 0,
    vidros: 0, espelhos: 0, led: 0, decoracao: 0, producao: 0,
  };
  for (const n of nodes) acc[layerForNode(n)]++;
  return acc;
}