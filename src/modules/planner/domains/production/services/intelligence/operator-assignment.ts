import { FACTORY_OPERATORS } from "./production-capacity";
import type { FactoryOperator, OperatorAssignment, OperatorSkill, RoutingStage } from "./types";

const STAGE_SKILL: Record<RoutingStage, OperatorSkill> = {
  corte: "corte",
  coladeira: "acabamento",
  usinagem: "usinagem",
  montagem: "montagem",
  conferencia: "conferencia",
  embalagem: "embalagem",
  expedicao: "logistica",
};

function pickBest(candidates: readonly FactoryOperator[]): FactoryOperator | null {
  if (candidates.length === 0) return null;
  return [...candidates].sort(
    (a, b) => b.efficiency * 10 - b.loadH - (a.efficiency * 10 - a.loadH),
  )[0];
}

export function assignOperators(
  operators: readonly FactoryOperator[] = FACTORY_OPERATORS,
): readonly OperatorAssignment[] {
  const stages: RoutingStage[] = [
    "corte",
    "coladeira",
    "usinagem",
    "montagem",
    "conferencia",
    "embalagem",
    "expedicao",
  ];
  const out: OperatorAssignment[] = [];
  for (const stage of stages) {
    const skill = STAGE_SKILL[stage];
    const best = pickBest(
      operators.filter((o) => o.skills.includes(skill) && o.status !== "afastado"),
    );
    if (!best) continue;
    out.push({
      stage,
      operatorId: best.id,
      operatorName: best.name,
      loadH: best.loadH,
      reason: `Especialidade ${skill} · eficiência ${Math.round(best.efficiency * 100)}% · carga ${best.loadH}h`,
    });
  }
  return out;
}

export function idealOperatorForStage(
  stage: RoutingStage,
  operators: readonly FactoryOperator[] = FACTORY_OPERATORS,
): FactoryOperator | null {
  const skill = STAGE_SKILL[stage];
  return pickBest(operators.filter((o) => o.skills.includes(skill) && o.status !== "afastado"));
}
