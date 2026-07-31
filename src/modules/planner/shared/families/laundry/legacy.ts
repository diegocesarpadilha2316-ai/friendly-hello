/**
 * COMPATIBILIDADE LEGADA — LAVANDERIA.
 * Nada é reescrito no projeto salvo: a conversão acontece EM MEMÓRIA,
 * lendo subtipo, nome, catalogItemId e parâmetros antigos (`mod:*`/`eng:*`).
 */
import { normalizeInstall } from "../bathroom/spec";
import { normalizeApplianceKind, normalizeApplianceHinge } from "./appliances";
import { normalizeTubPosition, normalizeTubType } from "./tub";
import {
  normalizeBasket,
  normalizeBoard,
  normalizeLaundryKind,
  type LaundryModuleInput,
} from "./spec";

const LAUNDRY_ALIASES = [
  "lavanderia",
  "area de servico",
  "área de serviço",
  "area-de-servico",
  "laundry",
  "laundry room",
  "laundry-room",
  "tanque",
  "vassoureiro",
  "maquina",
  "máquina",
  "maquina de lavar",
  "secadora",
  "lava e seca",
  "lava-e-seca",
] as const;

function slug(v: unknown): string {
  return String(v ?? "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

export interface LegacyLaundryLike {
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

/** É lavanderia? Lê subtipo, família, nome e id de catálogo. */
export function isLaundryFurniture(f: LegacyLaundryLike): boolean {
  const hay = [f.subtype, f.family, f.name, f.catalogItemId].map(slug).join(" | ");
  if (!hay.trim()) return false;
  return LAUNDRY_ALIASES.some((a) => hay.includes(slug(a)));
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

/** Converte um móvel legado em ficha de lavanderia — sem tocar nos dados salvos. */
export function laundryFromLegacy(f: LegacyLaundryLike): LaundryModuleInput {
  const params = (f.params ?? {}) as Record<string, unknown>;
  const hint = [f.subtype, f.catalogItemId, f.name].map(slug).join(" ");
  const kind = normalizeLaundryKind(
    (rawParam(params, ["kind", "modulo", "tipo"]) as string | undefined) ?? hint,
  );

  const applianceHint = rawParam(params, ["appliance", "aparelho", "maquina", "eletrodomestico"]);
  const tubHint = rawParam(params, ["tub", "tanque", "tubType", "tipoTanque"]);
  const material = rawParam(params, ["countertop", "tampo", "materialTampo"]);
  const install = rawParam(params, ["install", "instalacao", "fixacao"]);

  const applianceKind = normalizeApplianceKind(
    applianceHint ??
      (/lava e seca|lava-e-seca/.test(hint)
        ? "lava-e-seca"
        : /secadora/.test(hint)
          ? "secadora"
          : /superior|abertura-superior/.test(hint)
            ? "lavadora-superior"
            : /maquina|lavadora|torre/.test(hint)
              ? /torre/.test(hint)
                ? "torre"
                : "lavadora-frontal"
              : undefined),
  );

  return {
    kind,
    widthMm: f.widthMm ?? numParam(params, ["widthMm", "largura"]),
    heightMm: f.heightMm ?? numParam(params, ["heightMm", "altura"]),
    depthMm: f.depthMm ?? numParam(params, ["depthMm", "profundidade"]),
    doors: numParam(params, ["doors", "portas", "qtdPortas"]),
    drawers: numParam(params, ["drawers", "gavetas", "qtdGavetas"]),
    shelves: numParam(params, ["shelves", "prateleiras"]),
    handle: (rawParam(params, ["handle", "puxador"]) as string | undefined) ?? undefined,
    install: normalizeInstall(install, /suspens|flutuant/.test(hint) ? "suspenso" : "piso"),
    floorGapMm: numParam(params, ["floorGapMm", "alturaPiso", "gap"]),
    feetHeightMm: numParam(params, ["feetHeightMm", "pes", "alturaPe"]),
    finishId: (rawParam(params, ["finishId", "acabamento", "cor"]) as string | undefined) ?? undefined,
    led: Boolean(rawParam(params, ["led", "iluminacao"])),
    basket: normalizeBasket(rawParam(params, ["basket", "cesto"]), "nenhum"),
    baskets: numParam(params, ["baskets", "cestos"]),
    board: normalizeBoard(rawParam(params, ["board", "tabua"]), /tabua/.test(hint) ? "nicho" : "nenhum"),
    broomZoneMm: numParam(params, ["broomZoneMm", "vassoura", "zonaVassoura"]),
    stackingKit: Boolean(rawParam(params, ["stackingKit", "kitEmpilhamento"])) || undefined,
    outerDoor: Boolean(rawParam(params, ["outerDoor", "portaExterna"])) || undefined,
    countertop: material ? { material: slug(material) as never } : undefined,
    tub:
      tubHint || /tanque/.test(hint)
        ? {
            type: normalizeTubType(tubHint ?? "embutido"),
            position: normalizeTubPosition(rawParam(params, ["tubPosition", "posicaoTanque"])),
            widthMm: numParam(params, ["tubWidthMm", "larguraTanque"]),
            depthMm: numParam(params, ["tubDepthMm", "profundidadeTanque"]),
          }
        : undefined,
    appliance:
      applianceKind !== "nenhum"
        ? {
            kind: applianceKind,
            hingeSide: normalizeApplianceHinge(rawParam(params, ["hingeSide", "ladoDobradica"])),
          }
        : undefined,
  };
}

export { LAUNDRY_ALIASES };
