/**
 * FAMÍLIA BANHEIRO — montagem 100% pela Biblioteca Construtiva.
 * Este arquivo não desenha nada: resolve a ficha, pede os slots à receita
 * e entrega ao compositor. A gaveta em U é fundida em UM mecanismo com
 * `mergeMechanismGroup` — sem animação paralela.
 */
import {
  buildAssembly,
  mergeMechanismGroup,
  type AssemblyResult,
  type ConstructionHardwareRef,
} from "../../construction";
import type { FamilyBuildResult, FamilyRequirementSpec } from "../types";
import {
  normalizeBathroomModule,
  type BathroomModuleInput,
  type BathroomModuleSpec,
} from "./spec";
import {
  bathroomGeometry,
  bathroomModuleLabel,
  bathroomModuleSlots,
  bathroomReservedVolumes,
  type BathroomDecision,
  type BathroomGeometry,
  type BathroomReservation,
} from "./modules";

export function bathroomExtraHardware(spec: BathroomModuleSpec): ConstructionHardwareRef[] {
  const extra: ConstructionHardwareRef[] = [];
  if (spec.install === "suspenso") {
    extra.push({
      id: "ancoragem",
      kind: "perfil",
      qty: 2,
      notes: `suporte de parede — módulo suspenso a ${spec.floorGapMm} mm do piso`,
    });
  }
  if (spec.install === "pes") {
    extra.push({ id: "pes", kind: "perfil", qty: 4, notes: `pé regulável ${spec.feetHeightMm} mm` });
  }
  if (spec.sink.type !== "nenhuma") {
    extra.push({ id: "sifao", kind: "perfil", qty: 1, notes: "sifão e ligações flexíveis" });
    if (spec.countertop.cutout !== "nenhum") {
      extra.push({
        id: "recorte-cuba",
        kind: "perfil",
        qty: 1,
        notes: `recorte de cuba no tampo ${spec.countertop.material}`,
      });
    }
    if (spec.countertop.faucetCutout) {
      extra.push({ id: "recorte-torneira", kind: "perfil", qty: 1, notes: "recorte de torneira" });
    }
  }
  if (spec.mirror !== "nenhum") {
    extra.push({ id: "espelho", kind: "perfil", qty: 1, notes: `espelho (${spec.mirror})` });
  }
  if (spec.led) {
    extra.push({ id: "led", kind: "perfil", qty: 1, notes: "fita LED + perfil de alumínio" });
  }
  return extra;
}

export interface BathroomBuildResult extends FamilyBuildResult<BathroomModuleSpec> {
  readonly layout: BathroomGeometry;
  readonly reservations: readonly BathroomReservation[];
  readonly decisions: readonly BathroomDecision[];
  readonly warnings: readonly string[];
  readonly fillers: readonly string[];
  /** Mecanismos conjuntos (gaveta em U). */
  readonly mechanisms: readonly string[];
  readonly requirements: FamilyRequirementSpec;
}

export const BATHROOM_REQUIREMENTS: FamilyRequirementSpec = {
  mandatory: ["base", "lateral-e", "lateral-d"],
  important: ["tampo", "fundo", "frente"],
  optional: ["gaveta", "prateleira", "acessorio"]
};

/** Monta UM módulo de banheiro. Puro e determinístico. */
export function buildBathroomModule(input: BathroomModuleInput = {}): BathroomBuildResult {
  const spec = normalizeBathroomModule(input);
  const g = bathroomGeometry(spec);
  const recipe = bathroomModuleSlots(spec, g);

  let assembly: AssemblyResult = buildAssembly({
    id: `banheiro-${spec.kind}`,
    label: bathroomModuleLabel(spec),
    slots: recipe.slots,
    context: {
      thicknessMm: spec.thicknessMm,
      backThicknessMm: spec.backThicknessMm,
      finishId: spec.finishId,
    },
  });

  for (const m of recipe.mechanisms) {
    assembly = mergeMechanismGroup({ result: assembly, slotIds: m.slotIds, groupId: m.groupId });
  }

  const extra = bathroomExtraHardware(spec);
  if (extra.length) {
    assembly = {
      ...assembly,
      hardware: [...assembly.hardware, ...extra],
      totals: {
        ...assembly.totals,
        hardwareCount: assembly.totals.hardwareCount + extra.reduce((a, h) => a + h.qty, 0),
      },
    };
  }

  return {
    spec,
    assembly,
    layout: g,
    reservations: bathroomReservedVolumes(spec, g),
    decisions: recipe.decisions,
    warnings: recipe.warnings,
    fillers: recipe.fillers,
    mechanisms: recipe.mechanisms.map((m) => m.groupId),
    requirements: BATHROOM_REQUIREMENTS,
  };
}

/** Peça invadindo volume técnico? Base da auditoria hidráulica. */
export function bathroomReservationConflicts(
  result: BathroomBuildResult,
): readonly { pieceId: string; reservationId: string }[] {
  const hits: { pieceId: string; reservationId: string }[] = [];
  const eps = 2;
  for (const r of result.reservations) {
    if (r.kind === "cuba") continue; // a cuba fica acima da caixa
    for (const p of result.assembly.pieces) {
      if (!/gaveta|prateleira|divisoria/.test(p.partKind)) continue;
      const b = p.box;
      const hit =
        b.x < r.box.x + r.box.width - eps &&
        r.box.x < b.x + b.width - eps &&
        b.y < r.box.y + r.box.height - eps &&
        r.box.y < b.y + b.height - eps &&
        b.z < r.box.z + r.box.depth - eps &&
        r.box.z < b.z + b.depth - eps;
      if (hit) hits.push({ pieceId: p.id, reservationId: r.id });
    }
  }
  return hits;
}
