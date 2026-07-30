/**
 * Etapa 10 — resumo executivo + bloco compacto enviado ao LLM.
 *
 * O histórico bruto não é reenviado: o LLM recebe apenas um bloco curto
 * com preferências, decisões, materiais, restrições e pendências.
 */
import type { ProjectMemory } from "./types";

const MAX_LINE_ITEMS = 6;
/** Teto rígido do contexto injetado — mantém o prompt pequeno. */
const MAX_BLOCK_CHARS = 900;

const join = (values: readonly string[]) => values.slice(0, MAX_LINE_ITEMS).join("; ");

export function buildExecutiveSummary(memory: ProjectMemory): string {
  const parts: string[] = [];
  const env = memory.identity.environmentType;
  parts.push(`${memory.identity.projectName}${env ? ` — ${env}` : ""}`);
  if (memory.style) parts.push(`estilo ${memory.style}`);
  const mainMaterial = memory.materials[0]?.value;
  if (mainMaterial) parts.push(`acabamento ${mainMaterial}`);
  parts.push(`etapa: ${memory.identity.stage}`);
  if (memory.pendings.length)
    parts.push(`pendências: ${memory.pendings.map((p) => p.kind).join(", ")}`);
  return parts.join(" · ");
}

/** Bloco textual injetado no system prompt (compacto e sem segredos). */
export function buildMemoryPromptBlock(memory: ProjectMemory | null): string {
  if (!memory) return "";
  const lines: string[] = [];
  if (memory.style) lines.push(`Estilo: ${memory.style}.`);
  if (memory.materials.length)
    lines.push(
      `Materiais aplicados: ${join(memory.materials.map((m) => `${m.key.split(":")[1] ?? m.key}=${m.value}`))}.`,
    );
  if (memory.preferences.length)
    lines.push(`Preferências do cliente: ${join(memory.preferences.map((p) => p.value))}.`);
  if (memory.constraints.length)
    lines.push(`Restrições (respeite sempre): ${join(memory.constraints.map((c) => c.value))}.`);
  if (memory.decisions.length)
    lines.push(`Decisões aprovadas: ${join(memory.decisions.map((d) => d.value))}.`);
  if (memory.pendings.length)
    lines.push(`Pendências: ${join(memory.pendings.map((p) => p.label))}.`);
  if (!lines.length) return "";
  const block = [
    "MEMÓRIA DO PROJETO (contexto confirmado — use-a em vez de perguntar de novo;",
    "se o usuário mudar uma decisão, a nova substitui a anterior):",
    ...lines,
  ].join("\n");
  return block.length > MAX_BLOCK_CHARS ? `${block.slice(0, MAX_BLOCK_CHARS - 1)}…` : block;
}