/**
 * Merge entre regras da empresa, catálogo e overrides do usuário.
 * Só o "delta" é serializado em `furniture.params` (chaves `eng:*`).
 */
import type { Editor2DPrimitive } from "../editor-2d/types";
import type { CompanyManufacturingRules, FurnitureEngineeringParams, HardwareKind } from "./types";

const HARDWARE_KEYS: readonly HardwareKind[] = [
  "dobradica",
  "corredica",
  "pistao",
  "trilho",
  "cabideiro",
  "perfil",
  "puxador",
  "amortecedor",
];

function num(v: unknown, def: number): number {
  return typeof v === "number" && Number.isFinite(v) ? v : def;
}
function str<T extends string>(v: unknown, def: T): T {
  return typeof v === "string" && v.length > 0 ? (v as T) : def;
}
function bool(v: unknown, def: boolean): boolean {
  return typeof v === "boolean" ? v : def;
}
function pick(params: Readonly<Record<string, string | number | boolean | null>>, key: string) {
  return params[`eng:${key}`] ?? params[key];
}

export function resolveEngineering(
  furniture: Extract<Editor2DPrimitive, { kind: "furniture" }>,
  rules: CompanyManufacturingRules,
): FurnitureEngineeringParams {
  const d = rules.defaults;
  const p = furniture.params;
  const hardware: Partial<Record<HardwareKind, string>> = { ...d.hardware };
  for (const k of HARDWARE_KEYS) {
    const raw = pick(p, `hw:${k}`);
    if (typeof raw === "string" && raw.length > 0) hardware[k] = raw;
  }
  return {
    thicknessMm: num(pick(p, "thicknessMm"), d.thicknessMm),
    backThicknessMm: num(pick(p, "backThicknessMm"), d.backThicknessMm),
    clearanceMm: num(pick(p, "clearanceMm"), d.clearanceMm),
    reveal: num(pick(p, "reveal"), d.reveal),
    edge: str(pick(p, "edge"), d.edge),
    grain: str(pick(p, "grain"), d.grain),
    back: str(pick(p, "back"), d.back),
    base: str(pick(p, "base"), d.base),
    assembly: str(pick(p, "assembly"), d.assembly),
    door: str(pick(p, "door"), d.door),
    drawer: str(pick(p, "drawer"), d.drawer),
    handle: str(pick(p, "handle"), d.handle),
    brandId: str(pick(p, "brandId"), d.brandId),
    finishId: str(pick(p, "finishId"), d.finishId),
    hardware,
    shelves: num(pick(p, "shelves"), 1),
    drawers: num(pick(p, "drawers"), 0),
    doors: num(pick(p, "doors"), 1),
    lighting: str(pick(p, "lighting"), ""),
    mirrored: bool(pick(p, "mirrored"), false),
  };
}

export function applyEngineeringOverride(
  current: Readonly<Record<string, string | number | boolean | null>>,
  patch: Partial<FurnitureEngineeringParams>,
): Record<string, string | number | boolean | null> {
  const next: Record<string, string | number | boolean | null> = { ...current };
  for (const [k, v] of Object.entries(patch)) {
    if (k === "hardware" || v === undefined) continue;
    next[`eng:${k}`] = v as string | number | boolean;
  }
  if (patch.hardware) {
    for (const [hk, hv] of Object.entries(patch.hardware)) {
      if (typeof hv === "string") next[`eng:hw:${hk}`] = hv;
    }
  }
  return next;
}
