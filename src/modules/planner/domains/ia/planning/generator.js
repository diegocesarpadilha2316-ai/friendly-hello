import { getToolContract } from "../tools/registry";
import { classifyRequest, detectRoomType } from "./classify";
import { decompose } from "../services/decomposer";
import { PIPELINES, pickPipeline } from "./pipelines";
import { analyzeRequirements, extractFacts } from "./requirements";
import { analyzeImpact } from "./impact";
import { validateGraph } from "./graph";
import { PLAN_LIMITS } from "./types";
const uid = (prefix) =>
  `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 8)}`;
function isConcreteMaterial(value) {
  if (!value?.trim()) return false;
  return !/^(moderno|moderna|contempor[aâ]neo|contempor[aâ]nea|minimalista|industrial|r[uú]stico|r[uú]stica|cl[aá]ssico|cl[aá]ssica|escandinavo|escandinava|clean|luxuoso|luxuosa)$/i.test(
    value.trim(),
  );
}
/** Monta args válidos para cada estágio; `null` descarta o estágio. */
function argsForStage(stage, facts, message) {
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
      return isConcreteMaterial(facts.material) ? { query: facts.material } : null;
    case "set_render_preset":
      return { quality: "alta", lighting: "cenica" };
    case "create_room_preset": {
      const dec = decompose(message);
      return {
        preset: detectRoomType(message) ?? "cozinha",
        style: facts.style ?? "moderno",
        material: isConcreteMaterial(facts.material) ? facts.material : "off white",
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
function toStep(stage, position, args, idOf) {
  const contract = getToolContract(stage.tool);
  if (!contract) return null;
  return {
    stepId: idOf(stage.id),
    position,
    title: stage.title,
    description: stage.description,
    agent: contract.ownerAgent,
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
function selectStages(kind, message) {
  const t = message.toLowerCase();
  const all = PIPELINES[pickPipeline(message)];
  const wants = (re) => re.test(t);
  return all.filter((stage) => {
    if (stage.id === "orcamento") return wants(/or[çc]amento|or[çc]ar|custo|pre[çc]o/);
    if (stage.id === "producao") return wants(/produ[çc][ãa]o|corte|fabrica/);
    if (stage.id === "render") return wants(/render|imagem|foto|apresenta[çc][ãa]o/);
    if (kind === "projeto_completo" && stage.id === "layout") return false;
    if (kind === "plano_intermediario" && stage.id === "layout") {
      return wants(/layout|organiz|distribu|reorganiz/);
    }
    return true;
  });
}
export function generatePlan(input) {
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
  const stageIds = new Map();
  const idOf = (stageId) => {
    const existing = stageIds.get(stageId);
    if (existing) return existing;
    const created = `${planId}_${stageId}`;
    stageIds.set(stageId, created);
    return created;
  };
  const stages = selectStages(classification.kind, message);
  const built = [];
  const kept = new Set();
  for (const stage of stages) {
    const args = argsForStage(stage, facts, message);
    if (!args) continue;
    const step = toStep(stage, built.length, args, idOf);
    if (!step) continue;
    built.push(step);
    kept.add(stage.id);
  }
  // Dependências: só apontam para estágios efetivamente mantidos.
  const withDeps = built.map((step, index) => {
    const stage = stages.find((s) => idOf(s.id) === step.stepId);
    const deps = (stage?.dependsOn ?? []).filter((d) => kept.has(d)).map((d) => idOf(d));
    return { ...step, position: index, dependsOn: deps };
  });
  const warnings = [];
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
function planTitle(message) {
  const clean = message.trim().replace(/\s+/g, " ");
  return clean.length > 70 ? `${clean.slice(0, 69)}…` : clean || "Plano do projeto";
}
/** Preview textual usado pelo painel antes da confirmação. */
export function planPreviewLines(plan) {
  return analyzeImpact(plan.steps).previewLines;
}
