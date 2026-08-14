import { PLANNER_AGENT_BY_ID } from "./registry";
import { agentCanRun, ownerOfTool } from "./registry";
import { chooseAgents, sortAgents } from "./router";
/** Ferramentas que só fazem sentido uma vez por turno (a última vence). */
const SINGLETON_TOOLS = new Set([
  "create_room_preset",
  "layout_room",
  "set_style",
  "apply_finishing",
  "center",
  // Etapa 9 — consultivas: uma leitura por turno é suficiente.
  "estimate_budget",
  "production_summary",
  "preliminary_cut_list",
  "review_project",
  "check_circulation",
]);
function signature(step) {
  try {
    return `${step.tool}:${JSON.stringify(step.args ?? {})}`;
  } catch {
    return `${step.tool}:?`;
  }
}
/**
 * Constrói o plano multiagente a partir dos intents já interpretados.
 * A ordem final segue o pipeline dos agentes e, dentro de cada agente,
 * preserva a ordem original do plano.
 */
export function buildAgentPlan(message, intents) {
  const skipped = [];
  const seen = new Set();
  const singletonIndex = new Map();
  const staged = [];
  for (const intent of intents) {
    const tool = intent.tool;
    const args = intent.args ?? {};
    const agent = ownerOfTool(tool);
    if (!agentCanRun(agent, tool)) {
      skipped.push({ tool, reason: `ferramenta fora do escopo do agente ${agent}` });
      continue;
    }
    const sig = signature({ tool, args });
    if (seen.has(sig)) {
      skipped.push({ tool, reason: "execução duplicada evitada" });
      continue;
    }
    seen.add(sig);
    if (SINGLETON_TOOLS.has(tool)) {
      const prev = singletonIndex.get(tool);
      if (prev !== undefined) {
        staged[prev] = { agent, tool: tool, args };
        skipped.push({ tool, reason: "chamada única por turno — substituída pela mais recente" });
        continue;
      }
      singletonIndex.set(tool, staged.length);
    }
    staged.push({ agent, tool: tool, args });
  }
  const order = new Map(Object.values(PLANNER_AGENT_BY_ID).map((a) => [a.id, a.order]));
  const steps = staged
    .map((s, i) => ({ s, i }))
    .sort((a, b) => {
      const d = (order.get(a.s.agent) ?? 99) - (order.get(b.s.agent) ?? 99);
      return d !== 0 ? d : a.i - b.i;
    })
    .map(({ s }) => s);
  const executors = steps.map((s) => s.agent);
  const agents = sortAgents([
    ...executors,
    ...chooseAgents(
      message,
      steps.map((s) => s.tool),
    ),
  ]);
  return { steps, agents, skipped };
}
/** Agentes escolhidos para um turno puramente conversacional. */
export function selectConversationalAgents(message) {
  return chooseAgents(message);
}
/** Bloco de personas injetado no prompt de sistema do turno. */
export function buildAgentBriefing(agents) {
  if (agents.length === 0) return "";
  const lines = agents.map((id) => {
    const def = PLANNER_AGENT_BY_ID[id];
    return `• ${def.label} — ${def.persona} Responsabilidades: ${def.responsibilities.join(", ")}.`;
  });
  return [
    "Equipe interna acionada para este pedido (responda como UMA voz única, sem citar os agentes como pessoas separadas):",
    ...lines,
  ].join("\n");
}
/** Rótulo curto dos agentes participantes — usado no resumo da resposta. */
export function describeAgents(agents) {
  return agents.map((id) => PLANNER_AGENT_BY_ID[id].label).join(" → ");
}
