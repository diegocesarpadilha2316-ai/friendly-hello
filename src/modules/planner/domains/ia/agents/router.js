/**
 * Roteador de agentes — escolhe automaticamente quais especialistas
 * participam de um pedido, a partir de (a) palavras-chave pt-BR e
 * (b) das ferramentas que o plano determinístico/LLM produziu.
 */
import { PLANNER_AGENTS, ownerOfTool } from "./registry";
const norm = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/\s+/g, " ")
    .trim();
/** Agentes ativados pelo texto do usuário (heurístico, sem custo/rede). */
export function routeByText(message) {
  const t = norm(message);
  const hits = [];
  for (const agent of PLANNER_AGENTS) {
    if (agent.keywords.some((k) => t.includes(norm(k)))) hits.push(agent.id);
  }
  return sortAgents(hits);
}
/** Agentes ativados pelas ferramentas planejadas (ownership exclusivo). */
export function routeByTools(tools) {
  return sortAgents(tools.map((t) => ownerOfTool(t)));
}
/**
 * Escolha final: união (ferramentas ∪ texto), deduplicada e ordenada pelo
 * pipeline canônico Designer → Marceneiro → Materiais → Orçamentista →
 * Produção → Render. Se nada casar, o Designer responde por padrão.
 */
export function chooseAgents(message, tools = []) {
  const merged = [...routeByTools(tools), ...routeByText(message)];
  const unique = sortAgents(merged);
  return unique.length > 0 ? unique : ["designer"];
}
export function sortAgents(ids) {
  const seen = new Set();
  const out = [];
  for (const id of ids) {
    if (seen.has(id)) continue;
    seen.add(id);
    out.push(id);
  }
  const order = new Map(PLANNER_AGENTS.map((a) => [a.id, a.order]));
  return out.sort((a, b) => (order.get(a) ?? 99) - (order.get(b) ?? 99));
}
