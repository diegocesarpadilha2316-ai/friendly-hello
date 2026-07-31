/**
 * COMPOSITOR — um móvel é apenas uma lista de componentes posicionados.
 *
 * Nenhuma família de móvel é implementada aqui (isso vem nas etapas
 * seguintes). Esta camada só sabe: posicionar, somar peças, consolidar
 * ferragens, agregar rigs de animação e devolver totais auditáveis.
 */
import type {
  ConstructionBox,
  ConstructionComponentId,
  ConstructionContext,
  ConstructionHardwareRef,
  ConstructionMotion,
  ConstructionPiece,
  ConstructionWarning,
} from "./types";
import { buildComponent, makeContext } from "./registry";
import { translateMotion, translatePiece, unionBox, round } from "./geometry";

/** Um componente colocado dentro do móvel. */
export interface AssemblySlot {
  /** Identificador único do slot dentro do móvel. */
  readonly id: string;
  readonly component: ConstructionComponentId;
  /** Deslocamento no espaço do móvel (mm). */
  readonly at?: readonly [number, number, number];
  readonly params?: Record<string, unknown>;
  /** Rótulo funcional livre ("coluna 1", "gaveteiro", "maleiro"). */
  readonly role?: string;
}

/** Definição declarativa de um móvel composto. */
export interface AssemblyDefinition {
  readonly id: string;
  readonly label: string;
  readonly slots: readonly AssemblySlot[];
  readonly context?: Partial<Omit<ConstructionContext, "instanceId">>;
}

export interface AssemblyResult {
  readonly id: string;
  readonly label: string;
  readonly envelope: ConstructionBox;
  readonly pieces: readonly ConstructionPiece[];
  readonly hardware: readonly ConstructionHardwareRef[];
  readonly motions: readonly ConstructionMotion[];
  readonly warnings: readonly ConstructionWarning[];
  readonly totals: {
    readonly slotCount: number;
    readonly pieceCount: number;
    readonly boardAreaM2: number;
    readonly hardwareCount: number;
  };
}

/** Consolida ferragens iguais (mesmo kind + itemId) somando quantidades. */
function mergeHardware(refs: readonly ConstructionHardwareRef[]): ConstructionHardwareRef[] {
  const map = new Map<string, ConstructionHardwareRef>();
  for (const r of refs) {
    const key = `${r.kind}|${r.itemId ?? r.id}|${r.notes ?? ""}`;
    const prev = map.get(key);
    map.set(key, prev ? { ...prev, qty: prev.qty + r.qty } : { ...r });
  }
  return [...map.values()];
}

export function buildAssembly(def: AssemblyDefinition): AssemblyResult {
  const pieces: ConstructionPiece[] = [];
  const hardware: ConstructionHardwareRef[] = [];
  const motions: ConstructionMotion[] = [];
  const warnings: ConstructionWarning[] = [];

  for (const slot of def.slots) {
    const instanceId = `${def.id}:${slot.id}`;
    const ctx = makeContext(instanceId, def.context ?? {});
    const result = buildComponent(slot.component, slot.params ?? {}, { ...ctx, instanceId });
    const offset = slot.at ?? [0, 0, 0];

    for (const piece of result.pieces) {
      pieces.push({
        ...translatePiece(piece, offset),
        notes: slot.role ? [slot.role, piece.notes].filter(Boolean).join(" • ") : piece.notes,
      });
    }
    hardware.push(...result.hardware.map((h) => ({ ...h, id: `${instanceId}:${h.id}` })));
    // O rig acompanha a peça: sem transladar o pivô, uma porta posicionada
    // em x=902 giraria em torno do eixo x=2 do móvel (bug de integração).
    motions.push(...result.motions.map((m) => translateMotion(m, offset)));
    warnings.push(
      ...result.warnings.map((w) => ({ ...w, message: `[${slot.role ?? slot.id}] ${w.message}` })),
    );
  }

  const boardAreaM2 = pieces
    .filter((p) => p.substrate === "chapa")
    .reduce((acc, p) => acc + (p.box.width * p.box.height) / 1_000_000, 0);

  const merged = mergeHardware(hardware);

  return {
    id: def.id,
    label: def.label,
    envelope: unionBox(pieces.map((p) => p.box)),
    pieces,
    hardware: merged,
    motions,
    warnings,
    totals: {
      slotCount: def.slots.length,
      pieceCount: pieces.length,
      boardAreaM2: round(boardAreaM2),
      hardwareCount: merged.reduce((n, h) => n + h.qty, 0),
    },
  };
}

/** Atalho: repete um componente em N posições ao longo de X (colunas). */
export interface MechanismGroupInput {
  readonly result: AssemblyResult;
  /** Ids de slot que devem virar UM único mecanismo. */
  readonly slotIds: readonly string[];
  /** Id do mecanismo resultante (ex.: "gaveta-u-1"). */
  readonly groupId: string;
}

/**
 * Funde vários slots em UM mecanismo: as peças passam a compartilhar o
 * mesmo prefixo de id, de modo que `mechanismGroupId` (intertravamento) e
 * o comando da interface tratem tudo como um conjunto só — sem criar
 * animação paralela. Usado pela gaveta em U (frente única + duas caixas).
 */
export function mergeMechanismGroup(input: MechanismGroupInput): AssemblyResult {
  const { result, slotIds, groupId } = input;
  const rename = new Map<string, string>();
  const prefixes = slotIds.map((s) => `${result.id}:${s}:`);

  for (const piece of result.pieces) {
    const hit = prefixes.find((p) => piece.id.startsWith(p));
    if (!hit) continue;
    const slot = hit.slice(`${result.id}:`.length, -1);
    rename.set(piece.id, `${result.id}:${groupId}:${slot}-${piece.id.slice(hit.length)}`);
  }
  if (rename.size === 0) return result;

  return {
    ...result,
    pieces: result.pieces.map((p) => (rename.has(p.id) ? { ...p, id: rename.get(p.id)! } : p)),
    motions: result.motions.map((m) =>
      rename.has(m.pieceId) ? { ...m, pieceId: rename.get(m.pieceId)! } : m,
    ),
  };
}

export function repeatAlongX(
  slot: Omit<AssemblySlot, "id" | "at">,
  count: number,
  pitchMm: number,
  startMm = 0,
): AssemblySlot[] {
  return Array.from({ length: Math.max(1, Math.round(count)) }, (_, i) => ({
    ...slot,
    id: `${slot.component}-${i + 1}`,
    at: [round(startMm + i * pitchMm), 0, 0] as const,
    role: slot.role ? `${slot.role} ${i + 1}` : undefined,
  }));
}

/** Atalho: empilha um componente em N posições ao longo de Y (gaveteiro). */
export function stackAlongY(
  slot: Omit<AssemblySlot, "id" | "at">,
  count: number,
  pitchMm: number,
  startMm = 0,
): AssemblySlot[] {
  return Array.from({ length: Math.max(1, Math.round(count)) }, (_, i) => ({
    ...slot,
    id: `${slot.component}-${i + 1}`,
    at: [0, round(startMm + i * pitchMm), 0] as const,
    role: slot.role ? `${slot.role} ${i + 1}` : undefined,
  }));
}
