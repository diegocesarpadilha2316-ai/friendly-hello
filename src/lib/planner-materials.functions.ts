/**
 * Etapa 4 — Materiais e preços por empresa.
 *
 * Wrapper thin sobre a tabela `company_material_prices` (custo, venda,
 * markup, estoque, disponibilidade, fornecedor) e a view
 * `materials_with_price`, que já expõe o material do catálogo global
 * com o override da empresa aplicado (RLS por company_id).
 *
 * Reutiliza `requireTenant`: RLS garante isolamento entre empresas.
 * Sem novos providers, stores ou migrations.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";

export interface CompanyMaterialRow {
  materialId: string;
  category: string | null;
  sku: string | null;
  name: string;
  manufacturer: string | null;
  brand: string | null;
  collection: string | null;
  colorName: string | null;
  colorHex: string | null;
  imageUrl: string | null;
  thicknessMm: number | null;
  widthMm: number | null;
  lengthMm: number | null;
  costPrice: number | null;
  salePrice: number | null;
  markupPercent: number | null;
  currency: string;
  supplierName: string | null;
  stockQuantity: number | null;
  companyAvailable: boolean;
}

function num(v: unknown): number | null {
  if (v == null) return null;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : null;
}

const listInput = z.object({
  query: z.string().trim().max(120).optional(),
  category: z.string().trim().max(80).optional(),
  manufacturer: z.string().trim().max(80).optional(),
  onlyAvailable: z.boolean().optional(),
  limit: z.number().int().min(1).max(500).optional(),
});

export const listCompanyMaterials = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => listInput.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<readonly CompanyMaterialRow[]> => {
    let q = context.supabase
      .from("materials_with_price")
      .select(
        "id,category,sku,name,manufacturer,brand,collection,color_name,color_code,image_url,thickness_mm,width_mm,length_mm,cost_price,sale_price,markup_percent,currency,supplier_name,stock_quantity,company_available,company_id,is_active",
      )
      .eq("is_active", true)
      .eq("company_id", context.tenantId)
      .limit(data.limit ?? 200);
    if (data.category) q = q.eq("category", data.category);
    if (data.manufacturer) q = q.ilike("manufacturer", `%${data.manufacturer}%`);
    if (data.onlyAvailable) q = q.eq("company_available", true);
    if (data.query) {
      const term = `%${data.query}%`;
      q = q.or(
        `name.ilike.${term},sku.ilike.${term},manufacturer.ilike.${term},brand.ilike.${term},collection.ilike.${term}`,
      );
    }
    const { data: rows, error } = await q;
    if (error) return [];
    return (rows ?? []).map((r) => ({
      materialId: r.id as string,
      category: (r.category as string | null) ?? null,
      sku: (r.sku as string | null) ?? null,
      name: (r.name as string) ?? (r.sku as string) ?? (r.id as string),
      manufacturer: (r.manufacturer as string | null) ?? null,
      brand: (r.brand as string | null) ?? null,
      collection: (r.collection as string | null) ?? null,
      colorName: (r.color_name as string | null) ?? null,
      colorHex: (r.color_code as string | null) ?? null,
      imageUrl: (r.image_url as string | null) ?? null,
      thicknessMm: num(r.thickness_mm),
      widthMm: num(r.width_mm),
      lengthMm: num(r.length_mm),
      costPrice: num(r.cost_price),
      salePrice: num(r.sale_price),
      markupPercent: num(r.markup_percent),
      currency: (r.currency as string) ?? "BRL",
      supplierName: (r.supplier_name as string | null) ?? null,
      stockQuantity: num(r.stock_quantity),
      companyAvailable: Boolean(r.company_available),
    }));
  });

const upsertInput = z.object({
  materialId: z.string().uuid(),
  supplierName: z.string().trim().max(160).nullish(),
  supplierCode: z.string().trim().max(80).nullish(),
  costPrice: z.number().min(0).nullish(),
  salePrice: z.number().min(0).nullish(),
  markupPercent: z.number().min(0).max(100000).nullish(),
  currency: z.string().trim().length(3).optional(),
  stockQuantity: z.number().min(0).nullish(),
  minStockQuantity: z.number().min(0).nullish(),
  leadTimeDays: z.number().int().min(0).max(365).nullish(),
  isAvailable: z.boolean().optional(),
  notes: z.string().trim().max(2000).nullish(),
});

export const upsertCompanyMaterialPrice = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => upsertInput.parse(data))
  .handler(async ({ data, context }) => {
    const payload = {
      company_id: context.tenantId,
      material_id: data.materialId,
      supplier_name: data.supplierName ?? null,
      supplier_code: data.supplierCode ?? null,
      cost_price: data.costPrice ?? null,
      sale_price: data.salePrice ?? null,
      markup_percent: data.markupPercent ?? null,
      currency: data.currency ?? "BRL",
      stock_quantity: data.stockQuantity ?? null,
      min_stock_quantity: data.minStockQuantity ?? null,
      lead_time_days: data.leadTimeDays ?? null,
      is_available: data.isAvailable ?? true,
      notes: data.notes ?? null,
      created_by: context.userId,
    };
    const { data: row, error } = await context.supabase
      .from("company_material_prices")
      .upsert(payload, { onConflict: "company_id,material_id" })
      .select("id,material_id,cost_price,sale_price,markup_percent,currency,stock_quantity,is_available,supplier_name,updated_at")
      .single();
    if (error) throw new Response(error.message, { status: 400 });
    return row;
  });

export const deleteCompanyMaterialPrice = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) =>
    z.object({ materialId: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("company_material_prices")
      .delete()
      .eq("company_id", context.tenantId)
      .eq("material_id", data.materialId);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true as const };
  });

export const companyMaterialsStats = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    const [total, available, lowStock] = await Promise.all([
      context.supabase
        .from("company_material_prices")
        .select("id", { count: "exact", head: true })
        .eq("company_id", context.tenantId),
      context.supabase
        .from("company_material_prices")
        .select("id", { count: "exact", head: true })
        .eq("company_id", context.tenantId)
        .eq("is_available", true),
      context.supabase
        .from("company_material_prices")
        .select("id,stock_quantity,min_stock_quantity")
        .eq("company_id", context.tenantId)
        .not("min_stock_quantity", "is", null),
    ]);
    const lowCount = (lowStock.data ?? []).filter(
      (r) => (r.stock_quantity ?? 0) < (r.min_stock_quantity ?? 0),
    ).length;
    return {
      total: total.count ?? 0,
      available: available.count ?? 0,
      lowStock: lowCount,
    };
  });