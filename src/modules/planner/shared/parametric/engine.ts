/**
 * Motor paramétrico base do Planner (Fase 3.1).
 *
 * Responsabilidades:
 *  - Avaliar dimensões efetivas de um nó a partir dos parâmetros e do
 *    contexto do cômodo (regras determinísticas, sem I/O).
 *  - Validar restrições geométricas mínimas (largura/altura/profundidade
 *    positivas, encaixe dentro do cômodo pai).
 *  - Expor utilitários puros usados por Editor 2D/3D nas próximas fases.
 *
 * Regras:
 *  - Determinístico: mesma entrada → mesma saída.
 *  - Sem side-effects. Sem acesso a Core, IA, storage ou eventos.
 *  - Unidade oficial: milímetros.
 */
import type { PlannerDimensions, PlannerParametricNode, PlannerRoom } from "../types/project";

export interface PlannerEvaluationIssue {
  nodeId: string;
  code: "invalid-dimension" | "out-of-bounds" | "missing-param" | "type-mismatch";
  message: string;
}

export interface PlannerEvaluationResult {
  ok: boolean;
  issues: readonly PlannerEvaluationIssue[];
  /** dimensões efetivas por nodeId, quando aplicável */
  dimensions: Readonly<Record<string, PlannerDimensions>>;
}

function readNumberParam(node: PlannerParametricNode, key: string): number | null {
  const v = node.params[key];
  return typeof v === "number" && Number.isFinite(v) ? v : null;
}

function evalNodeDimensions(
  node: PlannerParametricNode,
  room: PlannerRoom,
): { dims: PlannerDimensions | null; issues: PlannerEvaluationIssue[] } {
  const issues: PlannerEvaluationIssue[] = [];

  // Módulos, aberturas, ferragens têm dimensões próprias declaradas.
  const dimensional: readonly PlannerParametricNode["kind"][] = ["module", "opening", "hardware"];
  if (!dimensional.includes(node.kind)) {
    return { dims: null, issues };
  }

  const width = readNumberParam(node, "width");
  const height = readNumberParam(node, "height");
  const depth = readNumberParam(node, "depth");

  if (width === null || height === null || depth === null) {
    issues.push({
      nodeId: node.id,
      code: "missing-param",
      message: "Parâmetros width/height/depth (mm) são obrigatórios.",
    });
    return { dims: null, issues };
  }
  if (width <= 0 || height <= 0 || depth <= 0) {
    issues.push({
      nodeId: node.id,
      code: "invalid-dimension",
      message: "Dimensões devem ser positivas.",
    });
    return { dims: null, issues };
  }

  const dims: PlannerDimensions = { width, height, depth };
  const r = room.dimensions;
  if (width > r.width || height > r.height || depth > r.depth) {
    issues.push({
      nodeId: node.id,
      code: "out-of-bounds",
      message: "Nó excede as dimensões do cômodo.",
    });
  }
  return { dims, issues };
}

export function evaluateRoom(room: PlannerRoom): PlannerEvaluationResult {
  const issues: PlannerEvaluationIssue[] = [];
  const dimensions: Record<string, PlannerDimensions> = {};

  for (const id of room.nodeOrder) {
    const node = room.nodes[id];
    if (!node) continue;
    const { dims, issues: nodeIssues } = evalNodeDimensions(node, room);
    if (dims) dimensions[id] = dims;
    issues.push(...nodeIssues);
  }

  return { ok: issues.length === 0, issues, dimensions };
}

/** Volume útil aproximado do cômodo em m³. */
export function roomVolumeM3(room: PlannerRoom): number {
  const { width, height, depth } = room.dimensions;
  return (width * height * depth) / 1_000_000_000;
}

/** Área do piso em m². */
export function roomFloorAreaM2(room: PlannerRoom): number {
  const { width, depth } = room.dimensions;
  return (width * depth) / 1_000_000;
}
