import { interpret } from "./interpreter";
import { answerQuestion } from "./questions";
import { getToolContract } from "../tools/registry";
import { runPlannerTool } from "../tools/runner";
import {
  buildAgentPlan,
  describeAgents,
  selectConversationalAgents,
  startAgentRun,
} from "../agents";
/**
 * Etapa 9 — toda execução passa pelo runner canônico: validação estrita
 * de argumentos, checkpoint, idempotência por `toolCallId`, timeout e
 * resultado padronizado. Ferramentas fora do registro são recusadas.
 */
async function executeIntent(intent, project, input, toolCallId) {
  const run = await runPlannerTool({
    tool: intent.tool,
    args: intent.args ?? {},
    project,
    ctx: input.ctx,
    toolCallId,
    tenantId: input.rules.tenantId,
    confirmed: input.confirmDestructive,
    signal: input.signal,
  });
  return {
    result: {
      project: run.project,
      summary: run.result.summary,
      affectedIds: run.result.affectedIds,
    },
    outcome: run.result,
  };
}
/**
 * Executa a mensagem do usuário como um único passo do agent.
 * Retorna:
 *  - `chunks`: fluxo textual pronto para streaming pela UI.
 *  - `finalProject`: o `PlannerProject` mutado — o hook aplica via `updateProject`.
 *  - `toolCalls`: registro das chamadas para exibição no chat.
 */
export async function* runAgent(input) {
  const parsed = interpret(input.message);
  const convAgents = selectConversationalAgents(input.message);
  if (parsed.type === "smalltalk" || parsed.type === "unknown") {
    // Antes de responder só com texto, tenta obter um plano estruturado
    // (tool-calling real) do LLM — se vier, executa como command.
    if (parsed.type === "unknown" && input.llmPlan) {
      const plan = await tryLLMPlan(input);
      if (plan && plan.length > 0) {
        yield* runCommand(plan, input);
        return;
      }
    }
    if (input.llmReplyStream) {
      yield* tryLLMStream(input, parsed.type, input.message, undefined, convAgents);
      yield { kind: "done", agents: convAgents };
      return;
    }
    const reply = (await tryLLM(input, parsed.type, input.message, convAgents)) ?? parsed.reply;
    yield* streamText(reply, input.signal);
    yield { kind: "done", agents: convAgents };
    return;
  }
  if (parsed.type === "question") {
    const local = answerQuestion(parsed.question, input.project, input.ctx, input.rules);
    if (input.llmReplyStream) {
      yield* tryLLMStream(input, "question", input.message, local, convAgents);
      yield { kind: "done", agents: convAgents };
      return;
    }
    const remote = await tryLLM(input, "question", input.message, convAgents);
    const answer = remote ? `${local}\n\n${remote}` : local;
    yield* streamText(answer, input.signal);
    yield { kind: "done", agents: convAgents };
    return;
  }
  // command — o plano determinístico local é a fonte de verdade quando já
  // entendeu o pedido. O LLM só planeja em `unknown`; aqui ele não pode
  // sobrescrever medidas, parede alvo, material ou Blueprint validados.
  yield* runCommand(parsed.intents, input);
}
async function* runCommand(intents, input) {
  let project = input.project;
  const summaries = [];
  // Orquestração multiagente: escolhe agentes, ordena o pipeline e remove
  // execuções duplicadas antes de tocar no projeto.
  const plan = buildAgentPlan(input.message, intents);
  const participated = [];
  let currentAgent = null;
  let handle = null;
  const agentTools = [];
  /** Identidade do turno — base da idempotência por `toolCallId`. */
  const turnId = `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;
  const closeRun = (success, error) => {
    if (handle) handle.finish(success, [...agentTools], error);
    handle = null;
    agentTools.length = 0;
  };
  for (const step of plan.steps) {
    const intent = { tool: step.tool, args: step.args };
    if (input.signal?.aborted) {
      closeRun(false, "cancelado");
      yield { kind: "error", text: "Geração cancelada." };
      return;
    }
    if (step.agent !== currentAgent) {
      closeRun(true);
      currentAgent = step.agent;
      participated.push(step.agent);
      handle = startAgentRun(step.agent);
    }
    yield { kind: "tool", toolName: step.tool, toolArgs: step.args, agent: step.agent };
    let result;
    let outcome;
    try {
      const executed = await executeIntent(
        intent,
        project,
        input,
        `${turnId}:${plan.steps.indexOf(step)}:${step.tool}`,
      );
      result = executed.result;
      outcome = executed.outcome;
    } catch (e) {
      closeRun(false, e instanceof Error ? e.message : "falha na ferramenta");
      yield { kind: "error", text: `Falha ao executar ${step.tool}.` };
      return;
    }
    agentTools.push(step.tool);
    project = result.project;
    const warn = outcome.warnings.length > 0 ? ` (${outcome.warnings[0]})` : "";
    summaries.push(`• ${result.summary}${outcome.ok ? "" : warn}`);
    yield {
      kind: "tool",
      toolName: step.tool,
      toolArgs: step.args,
      toolResult: result,
      toolOutcome: outcome,
      agent: step.agent,
    };
    await sleep(60, input.signal);
  }
  closeRun(true);
  const header = summaries.length > 1 ? "Pronto — executei os passos:\n" : "Pronto — ";
  const team = participated.length > 0 ? describeAgents(participated) : "";
  // Suposições da Ficha Técnica / resumo das alterações pontuais: o usuário
  // precisa saber o que foi assumido sem que a IA pergunte à toa.
  const hints = intents
    .map((i) => i.answerHint)
    .filter((h) => typeof h === "string" && h.trim().length > 0);
  const hintLine =
    hints.length > 0 ? `\n\n${[...new Set(hints)].join(" ")} Se quiser, é só ajustar.` : "";
  const finalText = `${header}${summaries.join("\n")}${hintLine}${team ? `\n\n_Equipe: ${team}._` : ""}`;
  yield* streamText(finalText, input.signal);
  yield {
    kind: "done",
    toolResult: { project, summary: finalText, affectedIds: [] },
    agents: plan.agents,
  };
}
async function tryLLMPlan(input) {
  if (!input.llmPlan) return null;
  try {
    const plan = await input.llmPlan({
      userMessage: input.message,
      project: input.project,
      ctx: input.ctx,
    });
    if (!Array.isArray(plan) || plan.length === 0) return null;
    // valida cada intent contra ToolName conhecido.
    const valid = plan.filter(
      (i) =>
        !!i &&
        typeof i === "object" &&
        typeof i.tool === "string" &&
        getToolContract(i.tool) !== null,
    );
    return valid.length > 0 ? valid : null;
  } catch {
    return null;
  }
}
async function tryLLM(input, role, userMessage, agents) {
  if (!input.llmReply) return null;
  const handle = startAgentRun(agents?.[0] ?? "designer");
  try {
    const text = await input.llmReply({
      userMessage,
      role,
      project: input.project,
      ctx: input.ctx,
      agents,
    });
    handle.finish(true, []);
    return text && text.trim().length > 0 ? text : null;
  } catch (e) {
    handle.finish(false, [], e instanceof Error ? e.message : "falha no LLM");
    return null;
  }
}
async function* tryLLMStream(input, role, userMessage, prefix, agents) {
  if (!input.llmReplyStream) return;
  const handle = startAgentRun(agents?.[0] ?? "designer");
  try {
    if (prefix) {
      yield { kind: "text", text: prefix };
      yield { kind: "text", text: "\n\n" };
    }
    for await (const delta of input.llmReplyStream({
      userMessage,
      role,
      project: input.project,
      ctx: input.ctx,
      agents,
    })) {
      if (input.signal?.aborted) return;
      if (delta) yield { kind: "text", text: delta };
    }
    handle.finish(true, []);
  } catch (e) {
    handle.finish(false, [], e instanceof Error ? e.message : "falha no streaming");
    // Falha silenciosa no streaming: o hook já marca erro no estado.
  }
}
async function* streamText(text, signal) {
  const parts = text.split(/(\s+)/);
  for (const part of parts) {
    if (signal?.aborted) return;
    await sleep(12, signal);
    yield { kind: "text", text: part };
  }
}
function sleep(ms, signal) {
  return new Promise((resolve) => {
    const t = setTimeout(resolve, ms);
    if (signal) {
      const onAbort = () => {
        clearTimeout(t);
        resolve();
      };
      if (signal.aborted) onAbort();
      else signal.addEventListener("abort", onAbort, { once: true });
    }
  });
}
