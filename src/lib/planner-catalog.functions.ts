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
  limit: z.number().int().min(1).max(500).optional(),
});

export const listCatalogMaterials = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => listMaterialsInput.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<readonly PlannerMaterialDTO[]> => {
    let q = context.supabase
      .from("materials_with_price")
      .select(
        "id,category,sku,name,manufacturer,brand,collection,color_name,color_code,thickness_mm,width_mm,length_mm,image_url,cost_price,sale_price,currency,is_active",
      )
      .eq("is_active", true)
      .limit(data.limit ?? 120);
    if (data.category) q = q.eq("category", data.category);
    if (data.manufacturer) q = q.ilike("manufacturer", `%${data.manufacturer}%`);
    if (data.query) {
      const term = `%${data.query}%`;
      q = q.or(
        `name.ilike.${term},color_name.ilike.${term},manufacturer.ilike.${term},brand.ilike.${term},collection.ilike.${term}`,
      );
    }
    const { data: rows, error } = await q;
    if (error) return [];
    return (rows ?? []).map((r) => {
      const pattern = (r.name as string | null) ?? (r.color_name as string | null) ?? (r.collection as string | null) ?? null;
      return {
        id: r.id as string,
        name:
          [r.manufacturer, r.collection, pattern].filter(Boolean).join(" · ") ||
          (r.id as string),
        manufacturer: (r.manufacturer as string) ?? "",
        line: (r.collection as string | null) ?? null,
        category: (r.category as string) ?? "",
        pattern,
        colorName: (r.color_name as string | null) ?? null,
        colorHex: (r.color_code as string | null) ?? null,
        textureUrl: (r.image_url as string | null) ?? null,
        thicknessMm: num(r.thickness_mm) ?? 18,
        widthMm: num(r.width_mm),
        lengthMm: num(r.length_mm),
        grain: null,
        pricePerM2: num(r.sale_price) ?? num(r.cost_price),
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
      .from("hardware")
      .select("id,name,slug,kind,sku,price_cents,currency,specs,manufacturer_id,status")
      .eq("status", "active")
      .limit(data.limit ?? 120);
    if (data.category) q = q.eq("kind", data.category);
    if (data.query) {
      const term = `%${data.query}%`;
      q = q.or(`name.ilike.${term},sku.ilike.${term},slug.ilike.${term}`);
    }
    const { data: rows, error } = await q;
    if (error) return [];
    return (rows ?? []).map((r) => ({
      id: r.id as string,
      manufacturer: "",
      brand: "",
      category: (r.kind as string) ?? "",
      model: (r.name as string) ?? (r.sku as string) ?? "",
      description: (r.sku as string | null) ?? null,
      imageUrl: null,
      unitPrice: r.price_cents != null ? Number(r.price_cents) / 100 : null,
    }));
  });

export const catalogStats = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    const [mats, hws] = await Promise.all([
      context.supabase
        .from("materials_catalog")
        .select("id", { count: "exact", head: true })
        .eq("is_active", true),
      context.supabase
        .from("hardware")
        .select("id", { count: "exact", head: true })
        .eq("status", "active"),
    ]);
    return {
      materials: mats.count ?? 0,
      hardware: hws.count ?? 0,
    };
  });