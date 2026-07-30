/**
 * Etapa 9 — Validação e normalização dos argumentos produzidos pela IA.
 *
 * REGRA: nada que venha do modelo é confiável. Todo argumento passa por
 * um schema ESTRITO (rejeita campos desconhecidos), com conversão
 * explícita de unidades para a unidade canônica interna: **milímetro**.
 */
import { z } from "zod";
import {
  CATALOG_ITEMS,
  MATERIAL_BRANDS,
  findCatalogItem,
  listPrimitives,
  type Editor2DPrimitive,
  type PlannerProject,
  type PlannerRoom,
} from "@/modules/planner/shared";
import type { ToolContext } from "../services/tools";

/** Unidade canônica interna do Planner. */
export const CANONICAL_UNIT = "mm" as const;

/** Limites físicos aceitos (mm) — barram alucinação de escala. */
export const LIMITS = {
  roomWidth: { min: 600, max: 30_000 },
  roomDepth: { min: 600, max: 30_000 },
  roomHeight: { min: 1800, max: 6000 },
  moduleWidth: { min: 100, max: 6000 },
  moduleHeight: { min: 100, max: 3000 },
  moduleDepth: { min: 80, max: 1500 },
  position: { min: -50_000, max: 50_000 },
  count: { min: 1, max: 20 },
  shelves: { min: 0, max: 12 },
  doors: { min: 0, max: 6 },
  drawers: { min: 0, max: 8 },
} as const;

/** Teto global de objetos tocados por UMA execução de ferramenta. */
export const MAX_AFFECTED_PER_CALL = 200;
/** Teto do payload textual de qualquer argumento string. */
export const MAX_TEXT_LEN = 400;

const UNIT_RE = /^\s*(-?\d+(?:[.,]\d+)?)\s*(mm|cm|m|metros?|centimetros?|milimetros?)?\s*$/i;

/**
 * Converte um valor numérico ou textual ("2,4 m", "240cm", 2400) para mm
 * inteiros. Números crus SEM unidade são interpretados como mm — exceto
 * valores obviamente em metros (<= 20), convertidos explicitamente.
 */
export function toMillimeters(value: unknown): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    if (value !== 0 && Math.abs(value) <= 20) return Math.round(value * 1000); // metros
    return Math.round(value);
  }
  if (typeof value !== "string") return null;
  const m = UNIT_RE.exec(value);
  if (!m) return null;
  const raw = Number(m[1].replace(",", "."));
  if (!Number.isFinite(raw)) return null;
  const unit = (m[2] ?? "").toLowerCase();
  if (unit.startsWith("mm") || unit.startsWith("mili")) return Math.round(raw);
  if (unit.startsWith("cm") || unit.startsWith("centi")) return Math.round(raw * 10);
  if (unit === "m" || unit.startsWith("metro")) return Math.round(raw * 1000);
  return toMillimeters(raw);
}

/** Campo dimensional em mm, com mínimo/máximo obrigatórios. */
export function dimensionMm(range: { min: number; max: number }) {
  return z.union([z.number(), z.string()]).transform((value, ctx) => {
    const mm = toMillimeters(value);
    if (mm === null) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "medida inválida" });
      return z.NEVER;
    }
    if (mm < range.min || mm > range.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `medida fora do intervalo aceito (${range.min}–${range.max} mm)`,
      });
      return z.NEVER;
    }
    return mm;
  });
}

/** Inteiro positivo com teto — quantidade de peças, portas, gavetas. */
export function positiveInt(range: { min: number; max: number }) {
  return z.union([z.number(), z.string()]).transform((value, ctx) => {
    const n = typeof value === "number" ? value : Number(String(value).replace(",", "."));
    if (!Number.isFinite(n)) {
      ctx.addIssue({ code: z.ZodIssueCode.custom, message: "quantidade inválida" });
      return z.NEVER;
    }
    const int = Math.round(n);
    if (int < range.min || int > range.max) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: `quantidade fora do intervalo (${range.min}–${range.max})`,
      });
      return z.NEVER;
    }
    return int;
  });
}

export const shortText = (max = MAX_TEXT_LEN) => z.string().trim().min(1).max(max);

/** Coordenada de inserção no plano do cômodo (mm). */
export const pointMm = z
  .object({
    x: dimensionMm(LIMITS.position),
    y: dimensionMm(LIMITS.position),
  })
  .strict();

export const wallEnum = z.enum(["bottom", "top", "left", "right"]);
export const shapeEnum = z.enum(["linear", "L", "U", "paralelo"]);

/* ------------------------- validação de domínio -------------------------- */

export function getActiveRoom(project: PlannerProject, ctx: ToolContext): PlannerRoom | null {
  const env = project.environments.find((e) => e.id === ctx.environmentId);
  return env?.rooms.find((r) => r.id === ctx.roomId) ?? null;
}

export type FurniturePrimitive = Extract<Editor2DPrimitive, { kind: "furniture" }>;

export function furnitureOf(room: PlannerRoom): FurniturePrimitive[] {
  return listPrimitives(room).filter((p): p is FurniturePrimitive => p.kind === "furniture");
}

/**
 * Alvos de uma mutação: a seleção do usuário quando existir, senão todos
 * os móveis do cômodo ativo. IDs vindos da IA que não pertencem ao cômodo
 * ativo são DESCARTADOS (isolamento por projeto/cômodo).
 */
export function resolveTargets(
  room: PlannerRoom,
  ctx: ToolContext,
  requestedIds?: readonly string[],
): { targets: FurniturePrimitive[]; rejected: string[] } {
  const all = furnitureOf(room);
  const byId = new Map(all.map((f) => [f.id, f]));
  const ids = requestedIds && requestedIds.length > 0 ? requestedIds : ctx.selectionIds;
  if (!ids || ids.length === 0) return { targets: all, rejected: [] };
  const targets: FurniturePrimitive[] = [];
  const rejected: string[] = [];
  for (const id of ids) {
    const found = byId.get(id);
    if (found) targets.push(found);
    else rejected.push(id);
  }
  return { targets, rejected };
}

/** Um objectId só é válido se pertencer ao cômodo ativo do projeto ativo. */
export function belongsToActiveRoom(
  project: PlannerProject,
  ctx: ToolContext,
  objectId: string,
): boolean {
  const room = getActiveRoom(project, ctx);
  if (!room) return false;
  return furnitureOf(room).some((f) => f.id === objectId);
}

export interface MaterialMatch {
  readonly id: string;
  readonly label: string;
  readonly brandId: string;
  readonly brandLabel: string;
  readonly swatch?: string;
}

function normalize(text: string): string {
  return text
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim();
}

/**
 * Busca acabamentos reais no catálogo de chapas. Nunca aceita "nome
 * livre" como se fosse registro: quem chama decide entre match único,
 * lista ambígua ou inexistente.
 */
export function searchMaterials(query: string, brandFilter?: string): MaterialMatch[] {
  const q = normalize(query);
  if (!q) return [];
  const out: MaterialMatch[] = [];
  for (const brand of MATERIAL_BRANDS) {
    if (brandFilter && normalize(brand.label).indexOf(normalize(brandFilter)) < 0) continue;
    for (const finish of brand.finishes) {
      const hay = `${normalize(finish.label)} ${normalize(finish.id)}`;
      if (hay.includes(q) || q.includes(normalize(finish.label))) {
        out.push({
          id: finish.id,
          label: finish.label,
          brandId: brand.id,
          brandLabel: brand.label,
          swatch: finish.swatch,
        });
      }
    }
  }
  // Dedup por marca+acabamento preservando ordem.
  const seen = new Set<string>();
  return out.filter((m) => {
    const key = `${m.brandId}:${m.id}`;
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

/** Valida um `catalogItemId` contra o catálogo real. */
export function assertCatalogItem(id: string) {
  return findCatalogItem(id);
}

export function catalogSubtypeExists(subtype: string): boolean {
  return CATALOG_ITEMS.some((i) => i.subtype === subtype);
}

/** Mensagem genérica — nunca expõe stack, schema interno ou payload. */
export function safeErrorMessage(error: unknown): string {
  if (error instanceof z.ZodError) {
    const first = error.issues[0];
    const path = first?.path?.join(".") ?? "";
    return path
      ? `Argumento inválido em "${path}": ${first?.message ?? "valor não aceito"}.`
      : `Argumentos inválidos: ${first?.message ?? "valor não aceito"}.`;
  }
  return "Não foi possível concluir esta operação.";
}