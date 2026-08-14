/**
 * Etapa 11 — Parte 1/6/7: geração do plano estruturado.
 *
 * Combina classificação + pipeline orientador + requisitos + impacto e
 * devolve um `ProjectPlan` já validado (grafo sem ciclos, limites de
 * segurança respeitados, args compatíveis com os contratos da Etapa 9).
 * Nenhuma ferramenta nova, nenhum provider novo.
 */
import type { PlannerProject } from "@/modules/planner/shared";
import type { PlannerAgentId } from "../agents/types";
import { getToolContract } from "../tools/registry";
import type { ProjectMemory } from "../memory/types";
import { classifyRequest, detectRoomType } from "./classify";
import { decompose } from "../services/decomposer";
import { PIPELINES, pickPipeline, type PipelineStage } from "./pipelines";
import { analyzeRequirements, extractFacts, type RequestFacts } from "./requirements";
import { analyzeImpact } from "./impact";
import { validateGraph } from "./graph";
import { PLAN_LIMITS, type PlanRequestKind, type PlanStep, type ProjectPlan } from "./types";

export interface GeneratePlanInput {
  readonly message: string;
  readonly tenantId: string;
  readonly projectId: string;
  readonly sessionId: string | null;
  readonly clientMessageId: string;
  readonly project: PlannerProject | null;
  readonly memory: ProjectMemory | null;
  readonly hasSelection: boolean;
  readonly roomHasDimensions: boolean;
}

const uid = (prefix: string) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;

/** Evita que qualificadores de estilo sejam enviados como busca de acabamento. */
function isConcreteMaterial(value: string | undefined): value is string {
  if (!value?.trim()) return false;
  return !/^(moderno|moderna|contempor[aâ]neo|contempor[aâ]nea|minimalista|industrial|r[uú]stico|r[uú]stica|cl[aá]ssico|cl[aá]ssica|escandinavo|escandinava|clean|luxuoso|luxuosa)$/i.test(
    value.trim(),
  );
}

/** Monta args válidos para cada estágio; `null` descarta o estágio. */
function argsForStage(
  stage: PipelineStage,
  facts: RequestFacts,
  message: string,
): Readonly<Record<string, unknown>> | null {
  switch (stage.tool) {
    case "set_style":
      return facts.style ? { style: facts.style } : null;
    case "insert_described": {
      const dec = decompose(message);
      if (dec.modules.length > 0) {
        return {
          description: dec.modules.map((m) => m.description).join(", "),
          count: dec.modules.reduce((total, m) => total + m.count, 0),
        };
      }
      return { description: `${stage.description} ${message}`.slice(0, 300) };
    }
    case "layout_room": {
      const dec = decompose(message);
      return {
        shape: "linear",
        pieces:
          dec.modules.length > 0
            ? dec.modules.map((m) => ({
                description: m.description,
                count: m.count,
                wall: m.wall,
                width: m.width,
                height: m.height,
                depth: m.depth,
              }))
            : [{ description: stage.description.slice(0, 200) }],
      };
    }
    case "search_material":
      return facts.material && isConcreteMaterial(facts.material)
        ? { query: facts.material }
        : null;
    case "set_render_preset":
      return { quality: "alta", lighting: "cenica" };
    case "create_room_preset": {
      const dec = decompose(message);
      return {
        preset: facts.widthMm ? "cozinha" : (detectRoomType(message) ?? "cozinha"),
        style: facts.style ?? "moderno",
        material:
          facts.material && isConcreteMaterial(facts.material) ? facts.material : "off white",
        pieces:
          dec.modules.length > 0
            ? dec.modules.map((m) => ({
                description: m.description,
                count: m.count,
                wall: m.wall,
                width: m.width,
                height: m.height,
                depth: m.depth,
              }))
            : undefined,
      };
    }
    case "remove":
      return {};
    default:
      return stage.args ?? {};
  }
}

function toStep(
  stage: PipelineStage,
  position: number,
  args: Readonly<Record<string, unknown>>,
  idOf: (stageId: string) => string,
): PlanStep | null {
  const contract = getToolContract(stage.tool);
  if (!contract) return null;
  return {
    stepId: idOf(stage.id),
    position,
    title: stage.title,
    description: stage.description,
    agent: contract.ownerAgent as PlannerAgentId,
    toolName: stage.tool,
    args,
    status: "pending",
    mutating: contract.mutating,
    destructive: contract.destructive,
    requiresConfirmation: contract.destructive,
    dependsOn: [],
    affectedScope: stage.scope,
    optional: stage.optional,
    attempts: 0,
    warnings: [],
  };
}

/** Estágios adicionais/removidos conforme o pedido real. */
function selectStages(kind: PlanRequestKind, message: string): readonly PipelineStage[] {
  const t = message.toLowerCase();
  const all = PIPELINES[pickPipeline(message)];
  const wants = (re: RegExp) => re.test(t);

  return all.filter((stage) => {
    if (stage.id === "orcamento") return wants(/or[çc]amento|or[çc]ar|custo|pre[çc]o/);
    if (stage.id === "producao") return wants(/produ[çc][ãa]o|corte|fabrica/);
    if (stage.id === "render") return wants(/render|imagem|foto|apresenta[çc][ãa]o/);
    // `create_room_preset` já compõe e posiciona os módulos com o Layout Engine.
    // O layout genérico posterior só permanece em pedidos intermediários explícitos.
    if (kind === "projeto_completo" && stage.id === "layout") return false;
    if (kind === "plano_intermediario" && stage.id === "layout") {
      return wants(/layout|organiz|distribu|reorganiz/);
    }
    return true;
  });
}

export function generatePlan(input: GeneratePlanInput): ProjectPlan {
  const { message } = input;
  const classification = classifyRequest(message);
  const facts = extractFacts(message, input.project, input.memory, input.hasSelection);
  const requirements = analyzeRequirements({
    message,
    kind: classification.kind,
    facts,
    project: input.project,
    roomHasDimensions: input.roomHasDimensions,
  });

  const planId = uid("plan");
  const stageIds = new Map<string, string>();
  const idOf = (stageId: string) => {
    const existing = stageIds.get(stageId);
    if (existing) return existing;
    const created = `${planId}_${stageId}`;
    stageIds.set(stageId, created);
    return created;
  };

  const stages = selectStages(classification.kind, message);
  const built: PlanStep[] = [];
  const kept = new Set<string>();

  for (const stage of stages) {
    const args = argsForStage(stage, facts, message);
    if (!args) continue;
    const step = toStep(stage, built.length, args, idOf);
    if (!step) continue;
    built.push(step);
    kept.add(stage.id);
  }

  // Dependências: só apontam para estágios efetivamente mantidos.
  const withDeps: PlanStep[] = built.map((step, index) => {
    const stage = stages.find((s) => idOf(s.id) === step.stepId);
    const deps = (stage?.dependsOn ?? []).filter((d) => kept.has(d)).map((d) => idOf(d));
    return { ...step, position: index, dependsOn: deps };
  });

  const warnings: string[] = [];
  let steps = withDeps;

  if (steps.length > PLAN_LIMITS.maxSteps) {
    steps = steps.slice(0, PLAN_LIMITS.maxSteps);
    warnings.push(`Plano reduzido para ${PLAN_LIMITS.maxSteps} etapas por segurança.`);
  }
  const mutatingCount = steps.filter((s) => s.mutating).length;
  if (mutatingCount > PLAN_LIMITS.maxMutatingSteps) {
    warnings.push("O plano excede o limite de etapas que alteram o projeto e foi encurtado.");
    let seen = 0;
    steps = steps.filter((s) => (s.mutating ? ++seen <= PLAN_LIMITS.maxMutatingSteps : true));
  }

  const graph = validateGraph(steps);
  if (!graph.ok) warnings.push(...graph.errors);
  steps = [...graph.ordered];

  const impact = analyzeImpact(steps);
  const blocking = requirements.missing.some((m) => m.level === "obrigatoria");
  const now = new Date().toISOString();
  const agents = Array.from(new Set(steps.map((s) => s.agent)));

  const status = !steps.length
    ? "failed"
    : blocking
      ? "awaiting_information"
      : impact.requiresConfirmation
        ? "awaiting_confirmation"
        : "ready";

  return {
    version: 1,
    planId,
    tenantId: input.tenantId,
    projectId: input.projectId,
    sessionId: input.sessionId,
    clientMessageId: input.clientMessageId,
    title: planTitle(message),
    summary: [classification.reason, ...impact.reasons].join(" · "),
    kind: classification.kind,
    status,
    createdAt: now,
    updatedAt: now,
    currentStepIndex: 0,
    requiresConfirmation: impact.requiresConfirmation,
    confirmed: false,
    estimatedImpact: impact.impact,
    agents,
    steps,
    warnings: [
      ...warnings,
      ...(steps.length ? [] : ["Nenhuma etapa executável foi identificada."]),
    ],
    assumptions: requirements.assumptions,
    missingInformation: requirements.missing,
    checkpointId: null,
    needsCheckpoint: impact.needsCheckpoint,
    finalReport: null,
  };
}

function planTitle(message: string): string {
  const clean = message.trim().replace(/\s+/g, " ");
  return clean.length > 70 ? `${clean.slice(0, 69)}…` : clean || "Plano do projeto";
}

/** Preview textual usado pelo painel antes da confirmação. */
export function planPreviewLines(plan: ProjectPlan): readonly string[] {
  return analyzeImpact(plan.steps).previewLines;
}
