/**
 * DIAGNÓSTICO DEV — `window.__DIORIS_LAUNDRY__`.
 * Nunca escreve nada em produção.
 */
import { isDoor, isFinishPart, isFixedFront } from "../../construction/classification";
import type { LaundryBuildResult } from "./build";
import { laundryAppliances } from "./modules";
import { validateLaundryModule } from "./validator";

export interface LaundryDiagnosticEntry {
  readonly id: string;
  readonly renderer: string;
  readonly legacyConverted: boolean;
  readonly layoutSource: string;
  readonly preset: string | null;
  readonly dimensions: { widthMm: number; heightMm: number; depthMm: number };
  readonly install: string;
  readonly appliances: readonly string[];
  readonly tub: string;
  readonly modules: readonly string[];
  readonly pieces: number;
  readonly rigs: number;
  readonly mechanisms: readonly string[];
  readonly technical: readonly { id: string; kind: string; note: string }[];
  readonly ventilation: boolean;
  readonly hydraulic: readonly string[];
  readonly fillers: readonly string[];
  readonly finishes: readonly string[];
  readonly droppedModules: readonly string[];
  readonly collisions: readonly string[];
  readonly warnings: readonly string[];
  readonly fallbackReason: string | null;
}

const isDev = (): boolean => {
  try {
    return typeof import.meta !== "undefined" && Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);
  } catch {
    return false;
  }
};

export function buildLaundryDiagnostic(input: {
  id: string;
  result: LaundryBuildResult;
  legacyConverted?: boolean;
  layoutSource?: string;
  preset?: string | null;
  droppedModules?: readonly string[];
  fallbackReason?: string | null;
}): LaundryDiagnosticEntry {
  const { result } = input;
  const validation = validateLaundryModule(result);
  const pieces = result.assembly.pieces;
  return {
    id: input.id,
    renderer: "LaundryMesh",
    legacyConverted: input.legacyConverted ?? false,
    layoutSource: input.layoutSource ?? "explicito",
    preset: input.preset ?? null,
    dimensions: {
      widthMm: result.spec.widthMm,
      heightMm: result.spec.heightMm,
      depthMm: result.spec.depthMm,
    },
    install: result.spec.install,
    appliances: laundryAppliances(result.spec).map((a) => a.kind),
    tub: `${result.spec.tub.type} • ${result.spec.tub.position}`,
    modules: [result.spec.kind],
    pieces: pieces.length,
    rigs: result.assembly.motions.filter((m) => m.kind !== "static").length,
    mechanisms: result.mechanisms,
    technical: result.reservations.map((r) => ({ id: r.id, kind: r.kind, note: r.note })),
    ventilation: result.spec.appliance.ventilation,
    hydraulic: result.reservations
      .filter((r) => ["cuba", "sifao", "valvula", "agua", "esgoto", "tubulacao"].includes(r.kind))
      .map((r) => r.id),
    fillers: pieces.filter((p) => p.partKind === "tapa-vao").map((p) => p.id),
    finishes: pieces.filter((p) => isFinishPart(p.partKind)).map((p) => p.id),
    droppedModules: input.droppedModules ?? [],
    collisions: validation.issues
      .filter((i) => i.code === "colisao-tecnica" || i.code === "geometria")
      .map((i) => i.message),
    warnings: [
      ...result.warnings,
      ...result.decisions.map((d) => `${d.id}: ${d.action} — ${d.reason}`),
      ...validation.issues.filter((i) => i.level !== "erro").map((i) => i.message),
    ],
    fallbackReason: input.fallbackReason ?? null,
  };
}

/** Publica no `window` apenas em desenvolvimento. */
export function publishLaundryDiagnostic(entry: LaundryDiagnosticEntry): void {
  if (!isDev() || typeof window === "undefined") return;
  const w = window as unknown as Record<string, Record<string, LaundryDiagnosticEntry>>;
  w.__DIORIS_LAUNDRY__ = { ...(w.__DIORIS_LAUNDRY__ ?? {}), [entry.id]: entry };
}

/** Utilidade de teste/console: quantas frentes móveis existem no módulo. */
export function countLaundryMovableFronts(result: LaundryBuildResult): number {
  return result.assembly.pieces.filter(
    (p) => isDoor(p.partKind) && !isFixedFront(p.partKind) && !isFinishPart(p.partKind),
  ).length;
}
