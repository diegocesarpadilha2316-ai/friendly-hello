import type { ImportResult, ImporterEntity } from "../types";

/**
 * Traduz um resultado de importação em um patch aplicável ao PlannerProject
 * via `updateProject()`. Determinístico e sem I/O.
 *
 * Nesta fase produzimos apenas *metadados* de nós detectados: paredes,
 * portas, janelas e piso do cômodo ativo. O consumidor decide o que
 * anexar ao projeto (o `useImporter()` faz o merge preservando Undo/Redo).
 */
export interface DetectedFloorplan {
  readonly walls: readonly {
    readonly a: readonly [number, number];
    readonly b: readonly [number, number];
  }[];
  readonly openings: readonly {
    readonly type: "door" | "window";
    readonly center: readonly [number, number];
  }[];
  readonly floors: readonly { readonly polygon: readonly (readonly [number, number])[] }[];
  readonly furnitureHints: readonly string[];
}

function scalePoint(p: readonly [number, number], factor: number): readonly [number, number] {
  return [p[0] * factor, p[1] * factor];
}

export function detectFloorplan(result: ImportResult): DetectedFloorplan {
  const f = result.scale.factorToMm;
  const walls: DetectedFloorplan["walls"][number][] = [];
  const openings: DetectedFloorplan["openings"][number][] = [];
  const floors: DetectedFloorplan["floors"][number][] = [];
  const furniture: string[] = [];
  for (const e of result.entities) {
    if (e.role === "wall") {
      for (let i = 1; i < e.points.length; i++) {
        walls.push({ a: scalePoint(e.points[i - 1]!, f), b: scalePoint(e.points[i]!, f) });
      }
    } else if (e.role === "door" || e.role === "window") {
      if (e.points.length > 0) {
        const c = e.points[Math.floor(e.points.length / 2)]!;
        openings.push({ type: e.role, center: scalePoint(c, f) });
      }
    } else if (e.role === "floor" || e.role === "room") {
      if (e.points.length >= 3) {
        floors.push({ polygon: e.points.map((p) => scalePoint(p, f)) });
      }
    } else if (e.role === "furniture") {
      const m = e.meta as Record<string, unknown> | undefined;
      const label = typeof m?.label === "string" ? (m.label as string) : e.layerId;
      furniture.push(label);
    }
  }
  return { walls, openings, floors, furnitureHints: furniture };
}

/** Rebalanceia todos os pontos para milímetros absolutos. */
export function normalizeToMm(
  entities: readonly ImporterEntity[],
  factor: number,
): readonly ImporterEntity[] {
  if (factor === 1) return entities;
  return entities.map((e) => ({
    ...e,
    points: e.points.map((p) => [p[0] * factor, p[1] * factor] as const),
  }));
}
