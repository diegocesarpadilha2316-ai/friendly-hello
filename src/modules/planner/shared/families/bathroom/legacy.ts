/**
 * COMPATIBILIDADE LEGADA — BANHEIRO.
 * Nada é reescrito no projeto salvo: a conversão acontece EM MEMÓRIA,
 * lendo subtipo, nome, catalogItemId e parâmetros antigos.
 */
import type { BathroomModuleInput } from "./spec";
import { normalizeBathroomKind, normalizeInstall, normalizeMirror } from "./spec";
import { normalizeSinkType, normalizeSinkPosition } from "./sink";

const BATHROOM_ALIASES = [
  "banheiro",
  "lavabo",
  "gabinete-banheiro",
  "gabinete de banheiro",
  "gabinete-de-banheiro",
  "vanity",
  "bathroom",
  "bathroom vanity",
  "espelheira",
  "armario-de-banheiro",
  "armário de banheiro",
  "toilet",
] as const;

function slug(v: unknown): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export interface LegacyFurnitureLike {
  readonly id?: string;
  readonly name?: string;
  readonly subtype?: string;
  readonly family?: string;
  readonly catalogItemId?: string;
  readonly params?: Readonly<Record<string, unknown>>;
  readonly widthMm?: number;
  readonly heightMm?: number;
  readonly depthMm?: number;
}

/** É banheiro? Lê subtipo, família, nome e id de catálogo. */
export function isBathroomFurniture(f: LegacyFurnitureLike): boolean {
  const hay = [f.subtype, f.family, f.name, f.catalogItemId].map(slug).join(" | ");
  if (!hay.trim()) return false;
  return BATHROOM_ALIASES.some((a) => hay.includes(slug(a)));
}

function numParam(params: Record<string, unknown> | undefined, keys: string[]): number | undefined {
  if (!params) return undefined;
  for (const k of keys) {
    const v = params[k] ?? params[`mod:${k}`] ?? params[`eng:${k}`];
    const n = typeof v === "number" ? v : Number(v);
    if (Number.isFinite(n) && n > 0) return Math.round(n);
  }
  return undefined;
}

function rawParam(params: Record<string, unknown> | undefined, keys: string[]): unknown {
  if (!params) return undefined;
  for (const k of keys) {
    const v = params[k] ?? params[`mod:${k}`] ?? params[`eng:${k}`];
    if (v !== undefined && v !== null && v !== "") return v;
  }
  return undefined;
}

/** Converte um móvel legado em ficha de banheiro — sem tocar nos dados salvos. */
export function bathroomFromLegacy(f: LegacyFurnitureLike): BathroomModuleInput {
  const params = (f.params ?? {}) as Record<string, unknown>;
  const hint = [f.subtype, f.catalogItemId, f.name].map(slug).join(" ");
  const kind = normalizeBathroomKind(
    (rawParam(params, ["kind", "modulo", "tipo"]) as string | undefined) ?? hint,
  );

  const doors = numParam(params, ["doors", "portas", "qtdPortas"]);
  const drawers = numParam(params, ["drawers", "gavetas", "qtdGavetas"]);
  const shelves = numParam(params, ["shelves", "prateleiras"]);
  const sinkType = rawParam(params, ["sink", "cuba", "sinkType", "tipoCuba"]);
  const sinkPos = rawParam(params, ["sinkPosition", "posicaoCuba", "cubaPosicao"]);
  const material = rawParam(params, ["countertop", "tampo", "materialTampo"]);
  const install = rawParam(params, ["install", "instalacao", "fixacao"]);
  const mirror = rawParam(params, ["mirror", "espelho"]);

  return {
    kind,
    widthMm: f.widthMm ?? numParam(params, ["widthMm", "largura"]),
    heightMm: f.heightMm ?? numParam(params, ["heightMm", "altura"]),
    depthMm: f.depthMm ?? numParam(params, ["depthMm", "profundidade"]),
    doors,
    drawers,
    shelves,
    handle: (rawParam(params, ["handle", "puxador"]) as string | undefined) ?? undefined,
    install: normalizeInstall(install, /suspens|flutuant/.test(hint) ? "suspenso" : "suspenso"),
    floorGapMm: numParam(params, ["floorGapMm", "alturaPiso", "gap"]),
    feetHeightMm: numParam(params, ["feetHeightMm", "pes", "alturaPe"]),
    finishId: (rawParam(params, ["finishId", "acabamento", "cor"]) as string | undefined) ?? undefined,
    led: Boolean(rawParam(params, ["led", "iluminacao"])),
    mirror: normalizeMirror(mirror, /espelheira/.test(hint) ? "porta" : "nenhum"),
    countertop: material ? { material: slug(material) as never } : undefined,
    sink:
      sinkType || sinkPos
        ? {
            type: normalizeSinkType(sinkType),
            position: normalizeSinkPosition(sinkPos, normalizeSinkType(sinkType)),
            widthMm: numParam(params, ["sinkWidthMm", "larguraCuba"]),
            depthMm: numParam(params, ["sinkDepthMm", "profundidadeCuba"]),
            xMm: numParam(params, ["sinkXMm", "cubaX"]),
          }
        : undefined,
  };
}

export { BATHROOM_ALIASES };