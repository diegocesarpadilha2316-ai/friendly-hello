/**
 * Agregador do domínio: consome UM `PlannerProject` e devolve todas as
 * peças produzíveis do projeto, com metadados de origem (ambiente /
 * cômodo / móvel). 100% derivado de `decomposeFurniture` — nenhum
 * campo novo é persistido.
 */
import type { PlannerProject } from "@/modules/planner/shared/types/project";
import { listPrimitives } from "@/modules/planner/shared/editor-2d/serialization";
import { decomposeFurniture } from "@/modules/planner/shared/engineering/decompose";
import type { CompanyManufacturingRules, FurniturePart } from "@/modules/planner/shared/engineering/types";
import type { ProductionPart, ProductionPartCategory } from "../types";

const DENSITY_KG_M3 = 720;

const CATEGORY_MAP: Record<FurniturePart["kind"], ProductionPartCategory> = {
  lateral: "lateral",
  base: "base",
  tampo: "tampo",
  prateleira: "prateleira",
  divisoria: "divisoria",
  porta: "porta",
  "gaveta-frente": "frente",
  "gaveta-lateral": "gaveta",
  "gaveta-fundo": "gaveta",
  "gaveta-base": "gaveta",
  fundo: "fundo",
  rodape: "rodape",
  travessa: "travessa",
  "fita-borda": "ferragem",
};

export interface AggregateProductionParts {
  parts: readonly ProductionPart[];
  modulesCount: number;
}

export function aggregateProductionParts(
  project: PlannerProject,
  rules: CompanyManufacturingRules,
): AggregateProductionParts {
  const parts: ProductionPart[] = [];
  let modulesCount = 0;
  for (const env of project.environments) {
    for (const room of env.rooms) {
      const primitives = listPrimitives(room);
      for (const prim of primitives) {
        if (prim.kind !== "furniture") continue;
        modulesCount += 1;
        const decomposition = decomposeFurniture(prim, rules);
        for (const p of decomposition.parts) {
          const areaM2 = (p.widthMm * p.heightMm) / 1_000_000;
          const volumeM3 = (areaM2 * p.thicknessMm) / 1000;
          const weightKg = Math.round(volumeM3 * DENSITY_KG_M3 * 100) / 100;
          const edgeMetersEach = p.kind === "fita-borda"
            ? 0
            : Math.round(((2 * (p.widthMm + p.heightMm)) / 1000) * 100) / 100;
          parts.push({
            ...p,
            category: CATEGORY_MAP[p.kind] ?? "outro",
            furnitureId: prim.id,
            furnitureLabel: prim.subtype,
            roomId: room.id,
            roomLabel: room.name,
            environmentId: env.id,
            areaM2: Math.round(areaM2 * 1000) / 1000,
            weightKg,
            edgeMetersEach,
          });
        }
      }
    }
  }
  return { parts, modulesCount };
}