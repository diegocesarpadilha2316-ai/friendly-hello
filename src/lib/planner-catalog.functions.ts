/**
 * Etapa 3 — Server functions do catálogo Planner (materiais + ferragens).
 *
 * Camada aditiva sobre a bridge browser existente:
 *  - `planner_materials` e `planner_hardware` já são lidas via anon no cliente
 *    (RLS: SELECT público). Estas server functions expõem o mesmo catálogo
 *    pelo runtime servidor — úteis para SSR/loaders, prefetch por tenant,
 *    exportações, IA e futuras extensões company-scoped.
 *
 * Thin wrapper: apenas createServerFn + imports client-safe.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";

export interface PlannerMaterialDTO {
  id: string;
  name: string;
  manufacturer: string;
  line: string | null;
  category: string;
  pattern: string | null;
  colorName: string | null;
  colorHex: string | null;
  textureUrl: string | null;
  thicknessMm: number;
  widthMm: number | null;
  lengthMm: number | null;
  grain: "vertical" | "horizontal" | "livre" | null;
  pricePerM2: number | null;
}

export interface PlannerHardwareDTO {
  id: string;
  manufacturer: string;
  brand: string;
  category: string;
  model: string;
  description: string | null;
  imageUrl: string | null;
  unitPrice: number | null;
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

const listMaterialsInput = z.object({
  query: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  manufacturer: z.string().trim().max(80).optional(),
  thicknessMm: z.number().int().min(1).max(60).optional(),
  onlyCurrent: z.boolean().optional(),
  limit: z.number().int().min(1).max(500).optional(),
  offset: z.number().int().min(0).max(100000).optional(),
});

export const listCatalogMaterials = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => listMaterialsInput.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<readonly PlannerMaterialDTO[]> => {
    const limit = data.limit ?? 120;
    const offset = data.offset ?? 0;
    let q = context.supabase
      .from("planner_materials")
      .select(
        "id,fabricante,marca,linha,categoria,padrao,cor_nome,cor_hex,textura_url,espessura_mm,largura_mm,comprimento_mm,sentido_veio,preco_m2",
      )
      .eq("ativo", true)
      .range(offset, offset + limit - 1)
      .order("fabricante", { ascending: true })
      .order("padrao", { ascending: true })
      .order("espessura_mm", { ascending: true });
    if (data.category) q = q.eq("categoria", data.category);
    if (data.manufacturer) q = q.ilike("fabricante", `%${data.manufacturer}%`);
    if (data.thicknessMm) q = q.eq("espessura_mm", data.thicknessMm);
    if (data.onlyCurrent) q = q.ilike("id", "CHP-%-202%").not("cor_nome", "ilike", "%(Histórico)%");
    if (data.query) {
      const term = `%${data.query}%`;
      q = q.or(
        `padrao.ilike.${term},cor_nome.ilike.${term},fabricante.ilike.${term},linha.ilike.${term}`,
      );
    }
    const { data: rows, error } = await q;
    if (error) return [];
    return (rows ?? []).map((r) => {
      const pattern = (r.padrao as string | null) ?? (r.cor_nome as string | null) ?? null;
      return {
        id: r.id as string,
        name:
          [r.fabricante, r.linha, pattern].filter(Boolean).join(" · ") || (r.id as string),
        manufacturer: (r.fabricante as string) ?? "",
        line: (r.linha as string | null) ?? null,
        category: (r.categoria as string) ?? "chapa",
        pattern,
        colorName: (r.cor_nome as string | null) ?? null,
        colorHex: (r.cor_hex as string | null) ?? null,
        textureUrl: (r.textura_url as string | null) ?? null,
        thicknessMm: num(r.espessura_mm) ?? 18,
        widthMm: num(r.largura_mm),
        lengthMm: num(r.comprimento_mm),
        grain: (r.sentido_veio as PlannerMaterialDTO["grain"]) ?? null,
        pricePerM2: num(r.preco_m2),
      };
    });
  });

const listHardwareInput = z.object({
  query: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  manufacturer: z.string().trim().max(80).optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

export const listCatalogHardware = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => listHardwareInput.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<readonly PlannerHardwareDTO[]> => {
    let q = context.supabase
      .from("planner_hardware")
      .select("id,fabricante,marca,categoria,modelo,descricao,imagem_url,preco_unitario,parametros_cnc,furacao,profundidade,folga")
      .eq("ativo", true)
      .limit(data.limit ?? 200);
    if (data.category) q = q.eq("categoria", data.category);
    if (data.manufacturer) q = q.eq("fabricante", data.manufacturer);
    if (data.query) {
      const term = `%${data.query}%`;
      q = q.or(`modelo.ilike.${term},categoria.ilike.${term},fabricante.ilike.${term},marca.ilike.${term}`);
    }
    const { data: rows, error } = await q;
    if (error) return [];
    return (rows ?? []).map((r) => ({
      id: r.id as string,
      manufacturer: (r.fabricante as string) ?? "",
      brand: (r.marca as string) ?? "",
      category: (r.categoria as string) ?? "",
      model: (r.modelo as string) ?? "",
      description: (r.descricao as string | null) ?? null,
      imageUrl: (r.imagem_url as string | null) ?? null,
      unitPrice: r.preco_unitario != null ? Number(r.preco_unitario) : null,
    }));
  });

export const catalogStats = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    const [mats, hws] = await Promise.all([
      context.supabase
        .from("planner_materials")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true),
      context.supabase
        .from("planner_hardware")
        .select("id", { count: "exact", head: true })
        .eq("ativo", true),
    ]);
    return {
      materials: mats.count ?? 0,
      hardware: hws.count ?? 0,
    };
  });