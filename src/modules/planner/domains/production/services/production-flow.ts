import type { ProductionOrder, ProductionStage } from "../types";

export const PRODUCTION_STAGES: readonly ProductionStage[] = [
  { id: "fila", label: "Fila", order: 1, color: "hsl(220 20% 60%)", description: "Aguardando liberação de produção." },
  { id: "separacao", label: "Separação", order: 2, color: "hsl(45 90% 55%)", description: "Materiais e ferragens sendo separados." },
  { id: "producao", label: "Produção", order: 3, color: "hsl(260 80% 65%)", description: "Corte, usinagem e coladeira." },
  { id: "montagem", label: "Montagem", order: 4, color: "hsl(200 90% 60%)", description: "Pré-montagem e conferência interna." },
  { id: "conferencia", label: "Conferência", order: 5, color: "hsl(180 70% 50%)", description: "QA final antes da expedição." },
  { id: "expedicao", label: "Expedição", order: 6, color: "hsl(140 60% 50%)", description: "Etiquetagem e carregamento." },
  { id: "entrega", label: "Entrega", order: 7, color: "hsl(120 60% 45%)", description: "Rota até o cliente e instalação." },
];

export function seedProductionOrders(projectId: string, projectName: string): readonly ProductionOrder[] {
  const now = Date.now();
  const day = 24 * 60 * 60 * 1000;
  return PRODUCTION_STAGES.slice(0, 5).map((stage, i) => ({
    id: `${projectId}-ord-${i + 1}`,
    code: `OP-${(1000 + i).toString()}`,
    projectId,
    clientName: projectName,
    stage: stage.id,
    createdAt: new Date(now - (5 - i) * day).toISOString(),
    eta: new Date(now + (i + 2) * day).toISOString(),
    progress: (i + 1) * 18,
    parts: 12 + i * 3,
  }));
}