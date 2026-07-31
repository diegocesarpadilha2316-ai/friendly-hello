/**
 * VALIDADOR ESTRUTURAL — impede colisão, sobreposição, espaço negativo,
 * peça impossível e medida inválida. Puro, sem estado.
 */
import type { ConstructionBox } from "../construction";
import type { InteriorIssue, InteriorPlacement, InteriorPlan, InteriorValidation } from "./types";
import { getInteriorModule } from "./registry";

/** Tolerância de encosto (mm): peças podem se tocar, não se penetrar. */
export const OVERLAP_TOLERANCE_MM = 0.5;

function overlap1D(a0: number, a1: number, b0: number, b1: number): number {
  return Math.min(a1, b1) - Math.max(a0, b0);
}

/** Interpenetração volumétrica entre duas caixas (mm no menor eixo). */
export function boxOverlap(a: ConstructionBox, b: ConstructionBox): number {
  const dx = overlap1D(a.x, a.x + a.width, b.x, b.x + b.width);
  const dy = overlap1D(a.y, a.y + a.height, b.y, b.y + b.height);
  const dz = overlap1D(a.z, a.z + a.depth, b.z, b.z + b.depth);
  if (dx <= OVERLAP_TOLERANCE_MM || dy <= OVERLAP_TOLERANCE_MM || dz <= OVERLAP_TOLERANCE_MM) {
    return 0;
  }
  return Math.min(dx, dy, dz);
}

function inside(plan: InteriorPlan, b: ConstructionBox): boolean {
  const c = plan.cavity;
  const tol = 1;
  return (
    b.x >= c.x - tol &&
    b.y >= c.y - tol &&
    b.z >= c.z - tol &&
    b.x + b.width <= c.x + c.widthMm + tol &&
    b.y + b.height <= c.y + c.heightMm + tol &&
    b.z + b.depth <= c.z + c.depthMm + tol
  );
}

function issue(
  level: InteriorIssue["level"],
  code: string,
  message: string,
  placementId?: string,
): InteriorIssue {
  return { level, code, message, placementId };
}

/** Valida um módulo isolado contra suas próprias regras. */
export function validatePlacement(plan: InteriorPlan, p: InteriorPlacement): InteriorIssue[] {
  const out: InteriorIssue[] = [];
  const def = getInteriorModule(p.moduleId);
  if (!def) {
    return [issue("error", "modulo-inexistente", `Módulo "${p.moduleId}" não registrado.`, p.id)];
  }
  const b = p.box;

  if (b.width <= 0 || b.height <= 0 || b.depth <= 0) {
    out.push(issue("error", "medida-invalida", `${def.name}: medida nula ou negativa.`, p.id));
  }
  if (
    b.width < def.min.widthMm ||
    b.height < def.min.heightMm ||
    b.depth < def.min.depthMm ||
    b.width > def.max.widthMm ||
    b.height > def.max.heightMm ||
    b.depth > def.max.depthMm
  ) {
    out.push(
      issue(
        "error",
        "fora-dos-limites",
        `${def.name}: ${b.width}×${b.height}×${b.depth} mm fora dos limites (min ${def.min.widthMm}×${def.min.heightMm}×${def.min.depthMm}, max ${def.max.widthMm}×${def.max.heightMm}×${def.max.depthMm}).`,
        p.id,
      ),
    );
  }
  if (!inside(plan, b)) {
    out.push(
      issue("error", "fora-do-vao", `${def.name}: o módulo ultrapassa os limites do vão.`, p.id),
    );
  }
  for (const rule of def.rules) {
    if (!rule.check(b, plan.cavity)) {
      out.push(issue(rule.level, rule.code, `${def.name}: ${rule.message}`, p.id));
    }
  }
  return out;
}

/** Valida o projeto interno inteiro. */
export function validateInteriorPlan(plan: InteriorPlan): InteriorValidation {
  const all: InteriorIssue[] = [];
  /** Contagem por sub-vão (coluna), não pelo móvel inteiro. */
  const counts = new Map<string, Map<string, number>>();

  for (const p of plan.placements) {
    all.push(...validatePlacement(plan, p));
    const scope = subCavityKey(p.id, plan.id);
    const byModule = counts.get(scope) ?? new Map<string, number>();
    byModule.set(p.moduleId, (byModule.get(p.moduleId) ?? 0) + 1);
    counts.set(scope, byModule);
  }

  // Limite de instâncias e incompatibilidade dentro do mesmo sub-vão.
  for (const byModule of counts.values()) {
    for (const [moduleId, qty] of byModule) {
      const def = getInteriorModule(moduleId);
      if (!def) continue;
      if (def.limits.maxPerCavity > 0 && qty > def.limits.maxPerCavity) {
        all.push(
          issue(
            "error",
            "limite-instancias",
            `${def.name}: máximo de ${def.limits.maxPerCavity} por vão (encontrados ${qty}).`,
          ),
        );
      }
      for (const other of def.incompatibleWith) {
        if (byModule.has(other)) {
          all.push(
            issue(
              "error",
              "incompatibilidade",
              `${def.name} não pode dividir o vão com ${getInteriorModule(other)?.name ?? other}.`,
            ),
          );
        }
      }
    }
  }

  // Colisão entre módulos.
  for (let i = 0; i < plan.placements.length; i++) {
    for (let j = i + 1; j < plan.placements.length; j++) {
      const a = plan.placements[i];
      const b = plan.placements[j];
      const depth = boxOverlap(a.box, b.box);
      if (depth > 0) {
        all.push(
          issue(
            "error",
            "colisao",
            `Interpenetração de ${Math.round(depth)} mm entre "${a.role ?? a.moduleId}" e "${b.role ?? b.moduleId}".`,
            a.id,
          ),
        );
      }
    }
  }

  // Espaço negativo: vão inválido.
  if (plan.cavity.widthMm <= 0 || plan.cavity.heightMm <= 0 || plan.cavity.depthMm <= 0) {
    all.push(issue("error", "vao-invalido", "O vão informado tem medida nula ou negativa."));
  }

  const errors = all.filter((i) => i.level === "error");
  const warnings = all.filter((i) => i.level === "warn");
  return { ok: errors.length === 0, errors, warnings };
}

/** Escopo de contagem: o id do placement carrega o sub-vão que o gerou. */
function subCavityKey(placementId: string, planId: string): string {
  const cut = placementId.lastIndexOf(":");
  return cut > 0 ? placementId.slice(0, cut) : planId;
}