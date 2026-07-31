/**
 * FAMÍLIA COZINHA — montagem 100% pela Biblioteca Construtiva.
 *
 * Este arquivo NÃO desenha nada. Ele resolve a ficha, pede os slots à
 * receita do módulo (`modules.ts`) e entrega ao `AssemblyComposer`.
 * Peças, ferragens, folgas e rigs vêm dos componentes.
 */
import { buildAssembly, type AssemblyResult, type ConstructionHardwareRef } from "../../construction";
import type { FamilyBuildResult } from "../types";
import { normalizeKitchenModule, type KitchenModuleSpec } from "./spec";
import { kitchenGeometry, kitchenModuleLabel, kitchenModuleSlots, type KitchenGeometry } from "./modules";

/** Ferragens específicas de cozinha que não pertencem a um componente. */
export function kitchenExtraHardware(spec: KitchenModuleSpec): ConstructionHardwareRef[] {
  const extra: ConstructionHardwareRef[] = [];
  if (spec.opening === "basculante") {
    extra.push({
      id: "pistao",
      kind: "pistao",
      qty: 2,
      itemId: "blum-aventos-hf",
      notes: "pistão a gás para basculante",
    });
  }
  if (spec.kind === "canto-magico") {
    extra.push({
      id: "canto-magico",
      kind: "trilho",
      qty: 1,
      itemId: "kessebohmer-magic-corner",
      notes: "mecanismo articulado de canto",
    });
  }
  if (spec.kind === "balcao-pia") {
    extra.push({ id: "lixeira", kind: "trilho", qty: 1, notes: "suporte de lixeira embutida" });
  }
  if (spec.kind === "torre-quente") {
    extra.push({ id: "tomada", kind: "perfil", qty: 2, notes: "ponto elétrico para forno/micro-ondas" });
  }
  if (spec.led) {
    extra.push({ id: "led", kind: "perfil", qty: 1, notes: "fita LED + perfil de alumínio" });
  }
  if (spec.countertop.cutout !== "nenhum") {
    extra.push({
      id: `recorte-${spec.countertop.cutout}`,
      kind: "perfil",
      qty: 1,
      notes: `recorte de ${spec.countertop.cutout} no tampo ${spec.countertop.material}`,
    });
  }
  return extra;
}

export interface KitchenBuildResult extends FamilyBuildResult<KitchenModuleSpec> {
  readonly layout: KitchenGeometry;
}

/** Monta UM módulo de cozinha. Puro e determinístico. */
export function buildKitchenModule(input: Partial<KitchenModuleSpec> = {}): KitchenBuildResult {
  const spec = normalizeKitchenModule(input);
  const g = kitchenGeometry(spec);
  const slots = kitchenModuleSlots(spec, g);

  const base: AssemblyResult = buildAssembly({
    id: `cozinha-${spec.kind}`,
    label: kitchenModuleLabel(spec),
    slots,
    context: {
      thicknessMm: spec.thicknessMm,
      backThicknessMm: spec.backThicknessMm,
      finishId: spec.finishId,
    },
  });

  const extra = kitchenExtraHardware(spec);
  const assembly: AssemblyResult = extra.length
    ? {
        ...base,
        hardware: [...base.hardware, ...extra],
        totals: {
          ...base.totals,
          hardwareCount: base.totals.hardwareCount + extra.reduce((a, h) => a + h.qty, 0),
        },
      }
    : base;

  return { spec, assembly, layout: g };
}