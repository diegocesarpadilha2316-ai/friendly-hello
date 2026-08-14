/**
 * DIAGNÓSTICO DE COZINHA — apenas em desenvolvimento.
 *
 * Fotografa a composição inteira (o que foi pedido, o que foi posicionado,
 * o que foi redimensionado, o que foi descartado e por quê). Nenhum log é
 * emitido em produção: `publishKitchenDiagnostics` sai silenciosamente.
 */
import type { KitchenLayoutInput, KitchenLayoutResult } from "./layout-engine";
import { validateKitchenLayout } from "./validator";

export interface KitchenDiagnostics {
  readonly id: string;
  readonly shape: string;
  readonly walls: readonly {
    readonly id: string;
    readonly lengthMm: number;
    readonly heightMm: number;
  }[];
  readonly origin: string;
  readonly requested: readonly string[];
  readonly placed: readonly string[];
  readonly resized: readonly string[];
  readonly dropped: readonly string[];
  readonly obstacles: readonly string[];
  readonly countertopRuns: readonly string[];
  readonly plinthRuns: readonly string[];
  readonly reservations: readonly string[];
  readonly fillers: readonly string[];
  readonly mechanisms: readonly string[];
  readonly collisions: readonly string[];
  readonly ergonomics: readonly string[];
  readonly fallbacks: readonly string[];
  readonly totals: KitchenLayoutResult["totals"];
}

export function kitchenDiagnostics(
  result: KitchenLayoutResult,
  input?: KitchenLayoutInput,
): KitchenDiagnostics {
  const v = validateKitchenLayout(result);
  const requested = (input?.walls ?? result.walls).flatMap((w) =>
    (w.fixtures ?? []).map((f) => `${w.id}: ${f.kind}${f.atMm !== undefined ? ` @${f.atMm}` : ""}`),
  );

  return {
    id: result.id,
    shape: result.shape,
    walls: result.walls.map((w) => ({
      id: w.id,
      lengthMm: w.lengthMm,
      heightMm: w.heightMm ?? 2700,
    })),
    origin: [...new Set(result.placements.map((p) => p.origin))].join(", ") || "vazio",
    requested,
    placed: result.placements.map(
      (p) =>
        `${p.wallId} ${p.level} @${p.xMm} ${p.widthMm}×${p.heightMm}×${p.depthMm} ${p.kind} (${p.origin})`,
    ),
    resized: result.resized,
    dropped: result.dropped,
    obstacles: result.reservations
      .filter((r) => r.kind === "janela" || r.kind === "porta" || r.kind === "retorno-de-canto")
      .map((r) => `${r.wallId} ${r.kind} @${r.xMm} ${r.widthMm} mm`),
    countertopRuns: result.countertopRuns.map(
      (r) =>
        `${r.wallId} ${r.startMm}–${r.endMm} (${r.lengthMm} mm, ${r.material}, balanço ${r.overhangFrontMm} mm${r.joinStart || r.joinEnd ? ", união em L" : ""})`,
    ),
    plinthRuns: result.plinthRuns.map(
      (r) => `${r.wallId} ${r.startMm}–${r.endMm} (${r.kind}, ${r.heightMm} mm)`,
    ),
    reservations: result.reservations.map(
      (r) => `${r.wallId} ${r.kind} @${r.xMm} ${r.widthMm}×${r.heightMm}×${r.depthMm} — ${r.note}`,
    ),
    fillers: result.fillers.map((f) => `${f.wallId} @${f.xMm} ${f.widthMm} mm`),
    mechanisms: result.placements
      .filter((p) => p.spec.doors > 0 || p.spec.drawers > 0)
      .map(
        (p) => `${p.id}: ${p.spec.doors} porta(s) ${p.spec.opening}, ${p.spec.drawers} gaveta(s)`,
      ),
    collisions: v.errors
      .filter((x) => x.code === "colisao" || x.code === "fora-parede")
      .map((x) => x.message),
    ergonomics: v.warnings.map((w) => `[${w.code}] ${w.message}`),
    fallbacks: [
      ...result.warnings.filter((w) => w.level !== "error").map((w) => `[${w.code}] ${w.message}`),
      ...result.resized.map((r) => `[redimensionado] ${r}`),
    ],
    totals: result.totals,
  };
}

const DEV =
  typeof import.meta !== "undefined" &&
  Boolean((import.meta as { env?: { DEV?: boolean } }).env?.DEV);

/** Publica o diagnóstico em `window.__DIORIS_KITCHEN__`. Só em DEV. */
export function publishKitchenDiagnostics(
  result: KitchenLayoutResult,
  input?: KitchenLayoutInput,
): KitchenDiagnostics | null {
  if (!DEV || typeof window === "undefined") return null;
  const diag = kitchenDiagnostics(result, input);
  const store = ((window as unknown as Record<string, unknown>).__DIORIS_KITCHEN__ ??=
    {}) as Record<string, unknown>;
  store[diag.id] = diag;
  return diag;
}
