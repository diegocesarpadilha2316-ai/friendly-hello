import type { PlannerProject } from "@/modules/planner/shared";
import type { AIPromptContext } from "../types";

/**
 * Builders de contexto por domínio. Cada função gera um resumo textual
 * curto que o Prompt Builder injeta como bloco de contexto — sem
 * duplicar estado, sem novos providers.
 */

export function projectContext(project: PlannerProject | null): string | undefined {
  if (!project) return undefined;
  const env = project.environments?.length ?? 0;
  const rooms = project.environments?.reduce((a, e) => a + (e.rooms?.length ?? 0), 0) ?? 0;
  return `Projeto "${project.name ?? "sem nome"}" — ${env} ambiente(s), ${rooms} cômodo(s).`;
}

export function roomContext(
  project: PlannerProject | null,
  environmentId: string | null,
  roomId: string | null,
): string | undefined {
  if (!project || !environmentId || !roomId) return undefined;
  const env = project.environments?.find((e) => e.id === environmentId);
  const room = env?.rooms?.find((r) => r.id === roomId);
  if (!room) return undefined;
  return `Cômodo ativo: ${room.name ?? room.id} (${room.type ?? "genérico"}).`;
}

export function selectionContext(nodeId: string | null): string | undefined {
  if (!nodeId) return undefined;
  return `Seleção atual: node_id=${nodeId}.`;
}

export function libraryContext(count: number): string | undefined {
  if (!count) return undefined;
  return `Biblioteca Oficial Dioris disponível (${count} itens indexados).`;
}

export function catalogContext(count: number): string | undefined {
  if (!count) return undefined;
  return `Catálogo paramétrico com ${count} componente(s).`;
}

export function budgetContext(total?: number): string | undefined {
  if (total == null) return undefined;
  return `Orçamento atual estimado: R$ ${total.toFixed(2)}.`;
}

export function productionContext(pieces?: number): string | undefined {
  if (pieces == null) return undefined;
  return `Produção: ${pieces} peça(s) na lista de corte.`;
}

export function renderContext(preset?: string): string | undefined {
  if (!preset) return undefined;
  return `Render preset: ${preset}.`;
}

export function videoContext(preset?: string): string | undefined {
  if (!preset) return undefined;
  return `Vídeo preset: ${preset}.`;
}

export function engineeringContext(pieces?: number): string | undefined {
  if (pieces == null) return undefined;
  return `Engenharia: ${pieces} peça(s) parametrizadas.`;
}

export function importerContext(active?: string): string | undefined {
  if (!active) return undefined;
  return `Importação ativa: ${active}.`;
}

export function realtimeContext(mode?: string): string | undefined {
  if (!mode) return undefined;
  return `Modo tempo real: ${mode}.`;
}

export function factoryContext(orders?: number): string | undefined {
  if (orders == null) return undefined;
  return `Fábrica: ${orders} ordem(ns) em produção.`;
}

export function marketplaceContext(installed?: number): string | undefined {
  if (installed == null) return undefined;
  return `Marketplace: ${installed} pacote(s) instalado(s).`;
}

export function decoratorContext(style?: string): string | undefined {
  if (!style) return undefined;
  return `IA Decoradora — estilo alvo: ${style}.`;
}

export function composeContexts(partial: AIPromptContext): AIPromptContext {
  return partial;
}
