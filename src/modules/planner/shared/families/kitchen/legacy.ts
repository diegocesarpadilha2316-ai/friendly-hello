/**
 * COMPATIBILIDADE — módulos de cozinha antigos continuam abrindo.
 *
 * Projetos salvos antes desta família guardam dimensões + `params` soltos
 * (`mod:doors`, `eng:front`, `hasSink`…). A conversão acontece SEMPRE em
 * memória: nada é regravado.
 */
import { normalizeKitchenModule, normalizeKitchenKind, type KitchenModuleSpec } from "./spec";

type ParamValue = string | number | boolean | null | undefined;
export type LegacyKitchenParams = Readonly<Record<string, ParamValue>>;

function pick(params: LegacyKitchenParams, ...keys: string[]): ParamValue {
  for (const k of keys) {
    const v = params[k];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

function asNumber(v: ParamValue): number | undefined {
  if (typeof v === "number" && Number.isFinite(v)) return v;
  if (typeof v === "string" && v.trim() !== "" && Number.isFinite(Number(v))) return Number(v);
  return undefined;
}

function asText(v: ParamValue): string | undefined {
  return typeof v === "string" && v.trim() !== "" ? v : undefined;
}

function asBool(v: ParamValue): boolean | undefined {
  if (typeof v === "boolean") return v;
  if (typeof v === "string") return /^(1|true|sim|yes)$/i.test(v.trim());
  if (typeof v === "number") return v !== 0;
  return undefined;
}

/** Subtipos do editor atendidos pela família cozinha. */
export const KITCHEN_SUBTYPES = [
  "cozinha",
  "balcao",
  "balcao-pia",
  "balcao-cooktop",
  "aereo",
  "aereo-basculante",
  "aereo-vidro",
  "torre-quente",
  "torre-geladeira",
  "canto-reto",
  "canto-diagonal",
  "canto-magico",
  "cristaleira",
  "adega",
  "nicho-aberto",
] as const;

export interface LegacyKitchenModule {
  readonly subtype?: string;
  readonly widthMm: number;
  readonly heightMm: number;
  readonly depthMm: number;
  readonly params?: LegacyKitchenParams;
}

/** Converte o formato antigo na ficha nova. Nunca lança. */
export function kitchenSpecFromLegacy(f: LegacyKitchenModule): KitchenModuleSpec {
  const p = f.params ?? {};
  const hasSink = asBool(pick(p, "hasSink", "mod:sink", "pia"));
  const hasCooktop = asBool(pick(p, "hasCooktop", "mod:cooktop", "cooktop", "fogao"));
  const kindHint =
    asText(pick(p, "mod:kind", "kitchenKind", "moduleKind")) ??
    (hasSink ? "balcao-pia" : hasCooktop ? "balcao-cooktop" : f.subtype);

  return normalizeKitchenModule({
    kind: normalizeKitchenKind(kindHint),
    widthMm: f.widthMm,
    heightMm: f.heightMm,
    depthMm: f.depthMm,
    doors: asNumber(pick(p, "mod:doors", "doors", "eng:doors", "portas")),
    drawers: asNumber(pick(p, "mod:drawers", "drawers", "eng:drawers", "gavetas")),
    shelves: asNumber(pick(p, "mod:shelves", "shelves", "prateleiras")),
    opening: asText(pick(p, "mod:opening", "opening", "abertura")) as KitchenModuleSpec["opening"] | undefined,
    handle: asText(pick(p, "mod:handle", "handle", "puxador")),
    glassFront: asBool(pick(p, "mod:glass", "frontType", "vidro")),
    led: asBool(pick(p, "mod:led", "led")),
    style: asText(pick(p, "mod:style", "style", "estilo", "design:style")),
    finishId: asText(pick(p, "eng:finishId", "finishId", "color", "cor")),
    thicknessMm: asNumber(pick(p, "eng:thicknessMm", "thicknessMm")),
    backThicknessMm: asNumber(pick(p, "eng:backThicknessMm", "backThicknessMm")),
    countertop: {
      material: asText(pick(p, "mod:countertop", "countertop", "tampo", "bancada")) as never,
      thicknessMm: asNumber(pick(p, "eng:countertopThicknessMm", "countertopThicknessMm")),
      backsplashMm: asNumber(pick(p, "mod:backsplashMm", "rodabanca")),
    },
    plinth: {
      kind: asText(pick(p, "mod:plinth", "plinth", "rodape")) as never,
      heightMm: asNumber(pick(p, "eng:plinthHeightMm", "plinthHeightMm")),
    },
  });
}

/** Alteração cirúrgica: só os campos citados mudam. */
export function applyKitchenPatch(
  current: KitchenModuleSpec,
  patch: Partial<KitchenModuleSpec>,
): KitchenModuleSpec {
  return normalizeKitchenModule({ ...current, ...patch });
}