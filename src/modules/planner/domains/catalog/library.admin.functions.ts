import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/core/middleware/require-auth";

/**
 * Biblioteca Dioris — Server functions ADMIN-ONLY.
 *
 * Segurança em camadas:
 *   1) requireAuth  — usuário autenticado com bearer válido.
 *   2) assertPlatformAdmin — verifica public.is_platform_admin(uid) via RLS.
 *   3) RLS no Postgres — policies só liberam INSERT/UPDATE/DELETE para admins.
 *
 * Nenhum endpoint aqui aceita "isAdmin" vindo do client. A verificação usa o
 * client autenticado do middleware (`context.supabase`), com RLS aplicada.
 */

async function assertPlatformAdmin(supabase: {
  rpc: (fn: string, args: Record<string, unknown>) => Promise<{ data: unknown; error: unknown }>;
}, userId: string): Promise<void> {
  const { data, error } = await supabase.rpc("is_platform_admin", { _user: userId });
  if (error) throw new Response("Forbidden", { status: 403 });
  if (data !== true) throw new Response("Forbidden — admin only", { status: 403 });
}

/** Retorna se o usuário logado é admin da plataforma. */
export const checkIsPlatformAdmin = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase.rpc("is_platform_admin", { _user: userId });
    if (error) return { isAdmin: false };
    return { isAdmin: data === true };
  });

/** Lista materiais (admin vê inativos também). */
export const adminListMaterials = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((i) =>
    z
      .object({
        search: z.string().trim().max(120).optional(),
        fabricante: z.string().trim().max(80).optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertPlatformAdmin(supabase, userId);
    let q = supabase.from("planner_materials").select("*").order("fabricante").limit(data.limit ?? 200);
    if (data.fabricante) q = q.eq("fabricante", data.fabricante);
    if (data.search) q = q.ilike("padrao", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

export const adminListHardware = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .inputValidator((i) =>
    z
      .object({
        search: z.string().trim().max(120).optional(),
        fabricante: z.string().trim().max(80).optional(),
        limit: z.number().int().min(1).max(500).optional(),
      })
      .parse(i ?? {}),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertPlatformAdmin(supabase, userId);
    let q = supabase.from("planner_hardware").select("*").order("fabricante").limit(data.limit ?? 200);
    if (data.fabricante) q = q.eq("fabricante", data.fabricante);
    if (data.search) q = q.ilike("modelo", `%${data.search}%`);
    const { data: rows, error } = await q;
    if (error) throw new Error(error.message);
    return rows ?? [];
  });

/** Estatísticas administrativas. */
export const adminLibraryStats = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    await assertPlatformAdmin(supabase, userId);
    const [mats, hw] = await Promise.all([
      supabase.from("planner_materials").select("id", { count: "exact", head: true }),
      supabase.from("planner_hardware").select("id", { count: "exact", head: true }),
    ]);
    return {
      materials: mats.count ?? 0,
      hardware: hw.count ?? 0,
    };
  });

// -------- Import (CSV parseado no client, enviado como JSON) ----------------

const MaterialRow = z.object({
  id: z.string().trim().min(1).max(120),
  fabricante: z.string().trim().min(1).max(80),
  marca: z.string().trim().min(1).max(80),
  linha: z.string().trim().max(80).nullable().optional(),
  categoria: z.string().trim().max(40).default("chapa"),
  padrao: z.string().trim().max(160).nullable().optional(),
  cor_nome: z.string().trim().max(80).nullable().optional(),
  cor_hex: z.string().trim().max(16).nullable().optional(),
  textura_url: z.string().trim().max(500).nullable().optional(),
  espessura_mm: z.number().nonnegative(),
  largura_mm: z.number().nonnegative().nullable().optional(),
  comprimento_mm: z.number().nonnegative().nullable().optional(),
  sentido_veio: z.enum(["vertical", "horizontal", "livre"]).nullable().optional(),
  preco_m2: z.number().nonnegative().nullable().optional(),
  ativo: z.boolean().optional(),
});

const HardwareRow = z.object({
  id: z.string().trim().min(1).max(120),
  fabricante: z.string().trim().min(1).max(80),
  marca: z.string().trim().min(1).max(80),
  categoria: z.string().trim().min(1).max(80),
  modelo: z.string().trim().min(1).max(160),
  descricao: z.string().trim().max(500).nullable().optional(),
  imagem_url: z.string().trim().max(500).nullable().optional(),
  preco_unitario: z.number().nonnegative().nullable().optional(),
  parametros_cnc: z.record(z.string(), z.any()).optional(),
  furacao: z.number().nonnegative().nullable().optional(),
  profundidade: z.number().nonnegative().nullable().optional(),
  folga: z.number().nonnegative().nullable().optional(),
  ativo: z.boolean().optional(),
});

/** Importa materiais em lote (upsert por id). Somente admin. */
export const adminImportMaterials = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((i) =>
    z.object({ rows: z.array(MaterialRow).min(1).max(5000) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertPlatformAdmin(supabase, userId);
    const { getSupabaseAdmin } = await import("@/core/lib/supabase/admin.server");
    const admin = getSupabaseAdmin();
    let inserted = 0;
    const BATCH = 500;
    for (let i = 0; i < data.rows.length; i += BATCH) {
      const chunk = data.rows.slice(i, i + BATCH);
      const { error, count } = await admin
        .from("planner_materials")
        .upsert(chunk, { onConflict: "id", count: "exact" });
      if (error) throw new Error(error.message);
      inserted += count ?? chunk.length;
    }
    return { imported: inserted, total: data.rows.length };
  });

/** Importa ferragens em lote (upsert por id). Somente admin. */
export const adminImportHardware = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((i) =>
    z.object({ rows: z.array(HardwareRow).min(1).max(5000) }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertPlatformAdmin(supabase, userId);
    const { getSupabaseAdmin } = await import("@/core/lib/supabase/admin.server");
    const admin = getSupabaseAdmin();
    let inserted = 0;
    const BATCH = 500;
    for (let i = 0; i < data.rows.length; i += BATCH) {
      const chunk = data.rows.slice(i, i + BATCH);
      const { error, count } = await admin
        .from("planner_hardware")
        .upsert(chunk, { onConflict: "id", count: "exact" });
      if (error) throw new Error(error.message);
      inserted += count ?? chunk.length;
    }
    return { imported: inserted, total: data.rows.length };
  });

/** Atualiza um material (preço, textura, cor, ativo…). Somente admin. */
export const adminUpdateMaterial = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((i) =>
    z
      .object({
        id: z.string().min(1),
        patch: MaterialRow.partial().omit({ id: true }),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertPlatformAdmin(supabase, userId);
    const { data: updated, error } = await supabase
      .from("planner_materials")
      .update(data.patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

/** Atualiza uma ferragem (preço, imagem, CNC…). Somente admin. */
export const adminUpdateHardware = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((i) =>
    z
      .object({
        id: z.string().min(1),
        patch: HardwareRow.partial().omit({ id: true }),
      })
      .parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertPlatformAdmin(supabase, userId);
    const { data: updated, error } = await supabase
      .from("planner_hardware")
      .update(data.patch)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });

/** Remove (soft: ativo=false) ou apaga (hard) um material. */
export const adminDeleteMaterial = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((i) =>
    z.object({ id: z.string().min(1), hard: z.boolean().optional() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertPlatformAdmin(supabase, userId);
    if (data.hard) {
      const { error } = await supabase.from("planner_materials").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("planner_materials")
        .update({ ativo: false })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });

export const adminDeleteHardware = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((i) =>
    z.object({ id: z.string().min(1), hard: z.boolean().optional() }).parse(i),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    await assertPlatformAdmin(supabase, userId);
    if (data.hard) {
      const { error } = await supabase.from("planner_hardware").delete().eq("id", data.id);
      if (error) throw new Error(error.message);
    } else {
      const { error } = await supabase
        .from("planner_hardware")
        .update({ ativo: false })
        .eq("id", data.id);
      if (error) throw new Error(error.message);
    }
    return { ok: true };
  });