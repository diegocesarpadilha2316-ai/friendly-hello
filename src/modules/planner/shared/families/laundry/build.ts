/**
 * FAMÍLIA LAVANDERIA — montagem 100% pela Biblioteca Construtiva.
 *
 * Este arquivo não desenha nada: normaliza a ficha, pede os slots à receita
 * (`laundryModuleSlots`) e entrega ao compositor (`buildAssembly`). Gavetas
 * em U, cestos e tábua são fundidos em UM mecanismo com
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
  laundryModuleLabel,
  normalizeLaundryModule,
  type LaundryModuleInput,
  type LaundryModuleSpec,
} from "./spec";
import {
  laundryAppliances,
  laundryGeometry,
  laundryModuleSlots,
  laundryReservedVolumes,
  type LaundryDecision,
  type LaundryGeometry,
  type LaundryReservation,
} from "./modules";

/** Ferragens que não pertencem a um componente específico. */
export function laundryExtraHardware(spec: LaundryModuleSpec): ConstructionHardwareRef[] {
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

  if (spec.tub.type !== "nenhum") {
    extra.push({ id: "sifao", kind: "perfil", qty: 1, notes: "sifão e ligações flexíveis do tanque" });
    if (spec.countertop.cutout !== "nenhum") {
      extra.push({
        id: "recorte-tanque",
        kind: "perfil",
        qty: 1,
        notes: `recorte de tanque no tampo ${spec.countertop.material}`,
      });
    }
    if (spec.countertop.faucetCutout) {
      extra.push({ id: "recorte-torneira", kind: "perfil", qty: 1, notes: "recorte de torneira" });
    }
  }

  for (const a of laundryAppliances(spec)) {
    extra.push({
      id: `instalacao-${a.kind}`,
      kind: "perfil",
      qty: 1,
      notes: [
        a.water ? "ponto de água" : null,
        a.drain ? "ponto de esgoto" : null,
        a.power ? "ponto elétrico" : null,
        a.ventilation ? "ventilação traseira" : null,
      ]
        .filter(Boolean)
        .join(" + ") || "instalação do aparelho",
    });
  }

  if (spec.stackingKit && spec.appliance.kind === "torre") {
    extra.push({ id: "kit-empilhamento", kind: "perfil", qty: 1, notes: "kit de empilhamento máquina + secadora" });
  }
  if (spec.led) extra.push({ id: "led", kind: "perfil", qty: 1, notes: "fita LED + perfil de alumínio" });

  return extra;
}

export interface LaundryBuildResult extends FamilyBuildResult<LaundryModuleSpec> {
  readonly layout: LaundryGeometry;
  readonly reservations: readonly LaundryReservation[];
  readonly decisions: readonly LaundryDecision[];
  readonly warnings: readonly string[];
  readonly fillers: readonly string[];
  /** Mecanismos conjuntos (gaveta em U, cesto, tábua). */
  readonly mechanisms: readonly string[];
  readonly requirements: FamilyRequirementSpec;
}

const LAUNDRY_REQUIREMENTS: FamilyRequirementSpec = {
  mandatory: ["base", "lateral-e", "lateral-d"],
  important: ["tampo", "fundo", "frente"],
  optional: ["gaveta", "prateleira", "acessorio"]
};

/** Monta UM módulo de lavanderia. Puro e determinístico. */
export function buildLaundryModule(input: LaundryModuleInput = {}): LaundryBuildResult {
  const spec = normalizeLaundryModule(input);
  const g = laundryGeometry(spec);
  const recipe = laundryModuleSlots(spec, g);

  let assembly: AssemblyResult = buildAssembly({
    id: `lavanderia-${spec.kind}`,
    label: laundryModuleLabel(spec),
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

  const extra = laundryExtraHardware(spec);
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
    reservations: laundryReservedVolumes(spec, g),
    decisions: recipe.decisions,
    warnings: recipe.warnings,
    fillers: recipe.fillers,
    mechanisms: recipe.mechanisms.map((m) => m.groupId),
    requirements: LAUNDRY_REQUIREMENTS,
  };
}

/** Volumes técnicos que NÃO admitem peça dentro (aparelho, sifão, ventilação…). */
const HARD_RESERVATIONS = new Set([
  "aparelho",
  "sifao",
  "valvula",
  "ventilacao",
  "manutencao",
  "vassoura",
  "tabua",
]);

/** Peça invadindo volume técnico? Base da auditoria hidráulica/ventilação. */
export function laundryReservationConflicts(
  result: LaundryBuildResult,
): readonly { pieceId: string; reservationId: string }[] {
  const hits: { pieceId: string; reservationId: string }[] = [];
  const eps = 2;
  for (const r of result.reservations) {
    if (!HARD_RESERVATIONS.has(r.kind)) continue;
    for (const p of result.assembly.pieces) {
      if (!/gaveta|prateleira|divisoria|fundo/.test(p.partKind)) continue;
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

/** Peça degenerada (dimensão nula/negativa) ou fora do envelope do módulo. */
export function laundryGeometryFaults(result: LaundryBuildResult): readonly string[] {
  const faults: string[] = [];
  const spec = result.spec;
  const { widthMm: W, depthMm: D } = spec;
  // Módulos suspensos/sobre pés sobem no espaço: o envelope vertical real é
  // a altura da caixa MAIS a folga de instalação (a cena posiciona pelo piso).
  const lift =
    spec.install === "suspenso" || spec.install === "pes" ? spec.floorGapMm + spec.feetHeightMm : 0;
  const H = spec.heightMm + lift;
  const tol = 30;
  for (const p of result.assembly.pieces) {
    const b = p.box;
    if (b.width <= 0 || b.height <= 0 || b.depth <= 0) {
      faults.push(`${p.id}: dimensão nula ou negativa`);
      continue;
    }
    if (b.x < -tol || b.y < -tol || b.z < -tol) faults.push(`${p.id}: origem fora do envelope`);
    if (b.x + b.width > W + tol) faults.push(`${p.id}: excede a largura do módulo`);
    if (b.y + b.height > H + tol) faults.push(`${p.id}: excede a altura do módulo`);
    if (b.z + b.depth > D + tol) faults.push(`${p.id}: excede a profundidade do módulo`);
  }
  const ids = result.assembly.pieces.map((p) => p.id);
  const dup = ids.filter((id, i) => ids.indexOf(id) !== i);
  for (const id of new Set(dup)) faults.push(`${id}: peça duplicada`);
  return faults;
}
