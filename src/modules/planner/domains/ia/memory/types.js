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
export function emptyMemory(tenantId, projectId, projectName = "Projeto") {
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
