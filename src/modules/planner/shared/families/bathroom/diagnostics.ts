/**
 * DIAGNÓSTICO DEV — `window.__DIORIS_BATHROOM__`.
 * Nunca escreve nada em produção.
 */
import { isDoor, isFinishPart, isFixedFront } from "../../construction/classification";
import type { BathroomBuildResult } from "./build";
import { validateBathroomModule } from "./validator";

export interface BathroomDiagnosticEntry {
  readonly id: string;
  readonly renderer: string;
  readonly legacyConverted: boolean;
  readonly layoutSource: string;
  readonly preset: string | null;
  readonly dimensions: { widthMm: number; heightMm: number; depthMm: number };
  readonly install: string;
  readonly sink: string;
  readonly hydraulic: readonly { id: string; kind: string; note: string }[];
  readonly modules: readonly string[];
  readonly pieces: number;
  readonly rigs: number;
  readonly fillers: readonly string[];
  readonly finishes: readonly string[];
  readonly droppedModules: readonly string[];
  readonly collisions: readonly string[];
  readonly warnings: readonly string[];
  readonly fallbackReason: string | null;
}

const isDev = (): boolean => {
  try {
    return (
      typeof import.meta !== "undefined" &&
      Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV)
    );
  } catch {
    return false;
  }
};

export function buildBathroomDiagnostic(input: {
  id: string;
  result: BathroomBuildResult;
  legacyConverted?: boolean;
  layoutSource?: string;
  preset?: string | null;
  droppedModules?: readonly string[];
  fallbackReason?: string | null;
}): BathroomDiagnosticEntry {
  const { result } = input;
  const validation = validateBathroomModule(result);
  const pieces = result.assembly.pieces;
  return {
    id: input.id,
    renderer: "BathroomMesh",
    legacyConverted: input.legacyConverted ?? false,
    layoutSource: input.layoutSource ?? "explicito",
    preset: input.preset ?? null,
    dimensions: {
      widthMm: result.spec.widthMm,
      heightMm: result.spec.heightMm,
      depthMm: result.spec.depthMm,
    },
    install: result.spec.install,
    sink: `${result.spec.sink.type} • ${result.spec.sink.position}`,
    hydraulic: result.reservations.map((r) => ({ id: r.id, kind: r.kind, note: r.note })),
    modules: [result.spec.kind],
    pieces: pieces.length,
    rigs: result.assembly.motions.length,
    fillers: pieces.filter((p) => p.partKind === "tapa-vao").map((p) => p.id),
    finishes: pieces.filter((p) => isFinishPart(p.partKind)).map((p) => p.id),
    droppedModules: input.droppedModules ?? [],
    collisions: validation.issues
      .filter((i) => i.code === "colisao-hidraulica")
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
export function publishBathroomDiagnostic(entry: BathroomDiagnosticEntry): void {
  if (!isDev() || typeof window === "undefined") return;
  const w = window as unknown as Record<string, Record<string, BathroomDiagnosticEntry>>;
  w.__DIORIS_BATHROOM__ = { ...(w.__DIORIS_BATHROOM__ ?? {}), [entry.id]: entry };
}

/** Utilidade de teste/console: quantas frentes móveis existem no módulo. */
export function countMovableFronts(result: BathroomBuildResult): number {
  return result.assembly.pieces.filter(
    (p) => isDoor(p.partKind) && !isFixedFront(p.partKind) && !isFinishPart(p.partKind),
  ).length;
}
