/**
 * AI Orchestrator do Planner — Etapa 8.
 *
 * Responsabilidades:
 *  - interpretar a intenção (delegando ao interpretador/LLM já existentes);
 *  - escolher quais agentes participam;
 *  - ordenar a execução no pipeline canônico;
 *  - impedir execução duplicada;
 *  - registrar quais agentes participaram (telemetria em memória).
 *
 * NÃO cria chat, sessão, endpoint, provider nem tabela. O plano gerado é
 * executado pelo mesmo executor de tools de sempre (`TOOL_FUNCTIONS`).
 */
import type { ParsedIntent } from "../services/interpreter";
import { PLANNER_AGENT_BY_ID } from "./registry";
import { agentCanRun, ownerOfTool } from "./registry";
import { chooseAgents, sortAgents } from "./router";
import type { PlannerAgentId, PlannerAgentPlan, PlannerAgentStep } from "./types";

/** Ferramentas que só fazem sentido uma vez por turno (a última vence). */
const SINGLETON_TOOLS = new Set([
  "create_room_preset",
  "layout_room",
  "set_style",
  "apply_finishing",
  "center",
]);

function signature(step: { tool: string; args: Readonly<Record<string, unknown>> }): string {
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
export function buildAgentPlan(
  message: string,
  intents: readonly ParsedIntent[],
): PlannerAgentPlan {
  const skipped: { tool: string; reason: string }[] = [];
  const seen = new Set<string>();
  const singletonIndex = new Map<string, number>();
  const staged: PlannerAgentStep[] = [];

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
        staged[prev] = { agent, tool: tool as PlannerAgentStep["tool"], args };
        skipped.push({ tool, reason: "chamada única por turno — substituída pela mais recente" });
        continue;
      }
      singletonIndex.set(tool, staged.length);
    }

    staged.push({ agent, tool: tool as PlannerAgentStep["tool"], args });
  }

  const order = new Map(
    Object.values(PLANNER_AGENT_BY_ID).map((a) => [a.id, a.order] as const),
  );
  const steps = staged
    .map((s, i) => ({ s, i }))
    .sort((a, b) => {
      const d = (order.get(a.s.agent) ?? 99) - (order.get(b.s.agent) ?? 99);
      return d !== 0 ? d : a.i - b.i;
    })
    .map(({ s }) => s);

  const executors = steps.map((s) => s.agent);
  const agents = sortAgents([...executors, ...chooseAgents(message, steps.map((s) => s.tool))]);

  return { steps, agents, skipped };
}

/** Agentes escolhidos para um turno puramente conversacional. */
export function selectConversationalAgents(message: string): readonly PlannerAgentId[] {
  return chooseAgents(message);
}

/** Bloco de personas injetado no prompt de sistema do turno. */
export function buildAgentBriefing(agents: readonly PlannerAgentId[]): string {
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
export function describeAgents(agents: readonly PlannerAgentId[]): string {
  return agents.map((id) => PLANNER_AGENT_BY_ID[id].label).join(" → ");
}