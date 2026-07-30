/**
 * Etapa 10 — Memória Inteligente do Projeto (tipos).
 *
 * Memória **estruturada** e por projeto: identidade, estilo, materiais,
 * preferências, decisões aprovadas e pendências. Nenhuma tabela nova,
 * nenhuma migration — persistência via `localStorage` isolada por
 * tenant + projeto (mesma infraestrutura de sessão da Etapa 5).
 *
 * Segurança: a memória guarda somente contexto funcional do projeto.
 * Nunca chaves, tokens, prompts internos ou raciocínio intermediário.
 */

export type MemoryOrigin = "user" | "tool" | "engine";

/** Fato confirmado — chave estável permite substituição sem duplicar. */
export interface MemoryFact {
  /** Chave canônica (ex.: `material:corpo`, `pref:portas-vidro`). */
  readonly key: string;
  /** Texto curto e legível para humanos e para o LLM. */
  readonly value: string;
  readonly origin: MemoryOrigin;
  /** Agente responsável pelo registro (Etapa 8). */
  readonly agent?: string;
  readonly updatedAt: string;
}

export type MemoryPendingKind = "orcamento" | "render" | "producao" | "medidas" | "outro";

export interface MemoryPending {
  readonly kind: MemoryPendingKind;
  readonly label: string;
  readonly updatedAt: string;
}

export interface ProjectMemory {
  readonly version: 1;
  readonly tenantId: string;
  readonly projectId: string;
  /** Identidade */
  readonly identity: {
    readonly projectName: string;
    readonly environmentType: string | null;
    readonly stage: "briefing" | "layout" | "detalhamento" | "orcamento" | "producao";
  };
  /** Estilo declarado/aplicado (um só valor ativo). */
  readonly style: string | null;
  /** Materiais ativos por escopo (corpo, frentes, tampo, piso, ferragem…). */
  readonly materials: readonly MemoryFact[];
  /** Preferências duradouras do cliente. */
  readonly preferences: readonly MemoryFact[];
  /** Decisões efetivamente aplicadas (nunca sugestões recusadas). */
  readonly decisions: readonly MemoryFact[];
  /** Restrições explícitas ("evitar portas de vidro"). */
  readonly constraints: readonly MemoryFact[];
  /** Pendências abertas. */
  readonly pendings: readonly MemoryPending[];
  /** Resumo executivo gerado automaticamente. */
  readonly executiveSummary: string;
  readonly updatedAt: string;
}

/** Telemetria de atualização — somente runtime, nunca persistida. */
export interface MemoryTelemetryEntry {
  readonly at: string;
  readonly projectId: string;
  readonly reason: string;
  readonly agent: string;
  readonly changedKeys: readonly string[];
}

export function emptyMemory(
  tenantId: string,
  projectId: string,
  projectName = "Projeto",
): ProjectMemory {
  return {
    version: 1,
    tenantId,
    projectId,
    identity: { projectName, environmentType: null, stage: "briefing" },
    style: null,
    materials: [],
    preferences: [],
    decisions: [],
    constraints: [],
    pendings: [],
    executiveSummary: "",
    updatedAt: new Date().toISOString(),
  };
}
