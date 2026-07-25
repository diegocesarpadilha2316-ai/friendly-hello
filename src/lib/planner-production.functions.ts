/**
 * Etapa 6 — Produção Inteligente.
 *
 * Wrapper thin sobre `production_orders`, `production_order_items`,
 * `production_stages`, `production_tasks`, `production_events` e
 * `cnc_jobs`. RLS por `company_id`; middleware `requireTenant` valida
 * acesso. Sem novos providers/stores/migrations.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";

export type ProductionOrderStatus =
  | "draft"
  | "planned"
  | "in_progress"
  | "paused"
  | "completed"
  | "cancelled";

export interface ProductionOrderRow {
  id: string;
  number: string | null;
  title: string | null;
  status: ProductionOrderStatus;
  priority: number;
  progressPercent: number;
  projectId: string | null;
  quoteId: string | null;
  scheduledStart: string | null;
  scheduledEnd: string | null;
  startedAt: string | null;
  completedAt: string | null;
  assignedTo: string | null;
  createdAt: string;
  updatedAt: string;
}

function num(v: unknown, d = 0): number {
  if (v == null) return d;
  const n = typeof v === "number" ? v : Number(v);
  return Number.isFinite(n) ? n : d;
}

function mapOrder(r: Record<string, unknown>): ProductionOrderRow {
  return {
    id: r.id as string,
    number: (r.number as string | null) ?? null,
    title: (r.title as string | null) ?? null,
    status: ((r.status as ProductionOrderStatus) ?? "draft"),
    priority: num(r.priority),
    progressPercent: num(r.progress_percent),
    projectId: (r.project_id as string | null) ?? null,
    quoteId: (r.quote_id as string | null) ?? null,
    scheduledStart: (r.scheduled_start as string | null) ?? null,
    scheduledEnd: (r.scheduled_end as string | null) ?? null,
    startedAt: (r.started_at as string | null) ?? null,
    completedAt: (r.completed_at as string | null) ?? null,
    assignedTo: (r.assigned_to as string | null) ?? null,
    createdAt: (r.created_at as string) ?? "",
    updatedAt: (r.updated_at as string) ?? "",
  };
}

/* -------------------------------- List ---------------------------------- */

const listInput = z.object({
  status: z
    .enum(["draft", "planned", "in_progress", "paused", "completed", "cancelled"])
    .optional(),
  projectId: z.string().uuid().optional(),
  query: z.string().trim().max(120).optional(),
  limit: z.number().int().min(1).max(200).optional(),
});

export const listProductionOrders = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => listInput.parse(data ?? {}))
  .handler(async ({ data, context }): Promise<readonly ProductionOrderRow[]> => {
    let q = context.supabase
      .from("production_orders")
      .select(
        "id,number,title,status,priority,progress_percent,project_id,quote_id,scheduled_start,scheduled_end,started_at,completed_at,assigned_to,created_at,updated_at",
      )
      .eq("company_id", context.tenantId)
      .order("priority", { ascending: false })
      .order("updated_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.status) q = q.eq("status", data.status);
    if (data.projectId) q = q.eq("project_id", data.projectId);
    if (data.query) {
      const term = `%${data.query}%`;
      q = q.or(`title.ilike.${term},number.ilike.${term}`);
    }
    const { data: rows, error } = await q;
    if (error) throw new Response(error.message, { status: 400 });
    return (rows ?? []).map(mapOrder);
  });

/* --------------------------------- Get ---------------------------------- */

export const getProductionOrder = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const [orderRes, itemsRes, stagesRes, tasksRes, eventsRes] = await Promise.all([
      context.supabase
        .from("production_orders")
        .select("*")
        .eq("company_id", context.tenantId)
        .eq("id", data.id)
        .maybeSingle(),
      context.supabase
        .from("production_order_items")
        .select("*")
        .eq("production_order_id", data.id)
        .order("position", { ascending: true }),
      context.supabase
        .from("production_stages")
        .select("*")
        .eq("production_order_id", data.id)
        .order("position", { ascending: true }),
      context.supabase
        .from("production_tasks")
        .select("*")
        .eq("order_id", data.id)
        .order("sort_order", { ascending: true }),
      context.supabase
        .from("production_events")
        .select("*")
        .eq("order_id", data.id)
        .order("created_at", { ascending: false })
        .limit(100),
    ]);
    if (orderRes.error) throw new Response(orderRes.error.message, { status: 400 });
    if (!orderRes.data) throw new Response("Not found", { status: 404 });
    return {
      order: mapOrder(orderRes.data),
      items: itemsRes.data ?? [],
      stages: stagesRes.data ?? [],
      tasks: tasksRes.data ?? [],
      events: eventsRes.data ?? [],
    };
  });

/* -------------------------------- Create -------------------------------- */

const itemInput = z.object({
  position: z.number().int().min(0).optional(),
  itemType: z.string().max(40).optional(),
  referenceId: z.string().uuid().nullish(),
  sku: z.string().max(80).nullish(),
  name: z.string().trim().min(1).max(240),
  description: z.string().max(2000).nullish(),
  quantity: z.number().min(0).default(1),
  unit: z.string().max(20).nullish(),
  materialId: z.string().uuid().nullish(),
  widthMm: z.number().min(0).nullish(),
  heightMm: z.number().min(0).nullish(),
  depthMm: z.number().min(0).nullish(),
  thicknessMm: z.number().min(0).nullish(),
  edgeTop: z.boolean().optional(),
  edgeBottom: z.boolean().optional(),
  edgeLeft: z.boolean().optional(),
  edgeRight: z.boolean().optional(),
});

const stageInput = z.object({
  position: z.number().int().min(0).optional(),
  name: z.string().trim().min(1).max(120),
  description: z.string().max(1000).nullish(),
});

const createInput = z.object({
  projectId: z.string().uuid().nullish(),
  quoteId: z.string().uuid().nullish(),
  title: z.string().trim().max(240).optional(),
  description: z.string().max(4000).optional(),
  priority: z.number().int().min(0).max(10).optional(),
  scheduledStart: z.string().datetime().nullish(),
  scheduledEnd: z.string().datetime().nullish(),
  assignedTo: z.string().uuid().nullish(),
  notes: z.string().max(2000).nullish(),
  items: z.array(itemInput).max(1000).optional(),
  stages: z.array(stageInput).max(50).optional(),
});

const DEFAULT_STAGES = ["Corte", "Furação/Usinagem", "Fitagem", "Montagem", "Embalagem"] as const;

export const createProductionOrder = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => createInput.parse(data))
  .handler(async ({ data, context }) => {
    const { data: order, error } = await context.supabase
      .from("production_orders")
      .insert({
        company_id: context.tenantId,
        project_id: data.projectId ?? null,
        quote_id: data.quoteId ?? null,
        title: data.title ?? null,
        description: data.description ?? null,
        status: "draft",
        priority: data.priority ?? 0,
        progress_percent: 0,
        scheduled_start: data.scheduledStart ?? null,
        scheduled_end: data.scheduledEnd ?? null,
        assigned_to: data.assignedTo ?? null,
        notes: data.notes ?? null,
        created_by: context.userId,
      })
      .select("*")
      .single();
    if (error) throw new Response(error.message, { status: 400 });

    const items = data.items ?? [];
    if (items.length > 0) {
      const ins = await context.supabase.from("production_order_items").insert(
        items.map((it, idx) => ({
          production_order_id: order.id,
          position: it.position ?? idx,
          item_type: it.itemType ?? "part",
          reference_id: it.referenceId ?? null,
          sku: it.sku ?? null,
          name: it.name,
          description: it.description ?? null,
          quantity: it.quantity,
          unit: it.unit ?? null,
          material_id: it.materialId ?? null,
          width_mm: it.widthMm ?? null,
          height_mm: it.heightMm ?? null,
          depth_mm: it.depthMm ?? null,
          thickness_mm: it.thicknessMm ?? null,
          edge_top: it.edgeTop ?? false,
          edge_bottom: it.edgeBottom ?? false,
          edge_left: it.edgeLeft ?? false,
          edge_right: it.edgeRight ?? false,
          status: "pending",
        })),
      );
      if (ins.error) throw new Response(ins.error.message, { status: 400 });
    }

    const stagesToCreate =
      (data.stages && data.stages.length > 0
        ? data.stages
        : DEFAULT_STAGES.map((name) => ({ name }))) as Array<{
        position?: number;
        name: string;
        description?: string | null;
      }>;
    const stagesIns = await context.supabase.from("production_stages").insert(
      stagesToCreate.map((s, idx) => ({
        production_order_id: order.id,
        position: s.position ?? idx,
        name: s.name,
        description: s.description ?? null,
        status: "pending",
      })),
    );
    if (stagesIns.error) throw new Response(stagesIns.error.message, { status: 400 });

    await context.supabase.from("production_events").insert({
      order_id: order.id,
      event: "order.created",
      payload: { title: order.title },
      actor_id: context.userId,
    });

    return mapOrder(order);
  });

/* --------------------------- Status transitions ------------------------- */

const statusInput = z.object({
  id: z.string().uuid(),
  status: z.enum(["draft", "planned", "in_progress", "paused", "completed", "cancelled"]),
});

export const setProductionOrderStatus = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => statusInput.parse(data))
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { status: data.status };
    const now = new Date().toISOString();
    if (data.status === "in_progress") patch.started_at = now;
    if (data.status === "completed") {
      patch.completed_at = now;
      patch.progress_percent = 100;
    }
    const { data: row, error } = await context.supabase
      .from("production_orders")
      .update(patch)
      .eq("company_id", context.tenantId)
      .eq("id", data.id)
      .select("*")
      .single();
    if (error) throw new Response(error.message, { status: 400 });
    await context.supabase.from("production_events").insert({
      order_id: data.id,
      event: `order.status.${data.status}`,
      payload: null,
      actor_id: context.userId,
    });
    return mapOrder(row);
  });

const progressInput = z.object({
  id: z.string().uuid(),
  progressPercent: z.number().min(0).max(100),
});

export const setProductionOrderProgress = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => progressInput.parse(data))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("production_orders")
      .update({ progress_percent: data.progressPercent })
      .eq("company_id", context.tenantId)
      .eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true as const };
  });

/* -------------------------------- Stages -------------------------------- */

const stageStatusInput = z.object({
  stageId: z.string().uuid(),
  orderId: z.string().uuid(),
  status: z.enum(["pending", "in_progress", "completed", "skipped"]),
});

export const setStageStatus = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) => stageStatusInput.parse(data))
  .handler(async ({ data, context }) => {
    // Confirm the parent order belongs to tenant.
    const own = await context.supabase
      .from("production_orders")
      .select("id")
      .eq("company_id", context.tenantId)
      .eq("id", data.orderId)
      .maybeSingle();
    if (own.error || !own.data) throw new Response("Forbidden", { status: 403 });

    const patch: Record<string, unknown> = { status: data.status };
    const now = new Date().toISOString();
    if (data.status === "in_progress") patch.started_at = now;
    if (data.status === "completed") patch.completed_at = now;

    const { error } = await context.supabase
      .from("production_stages")
      .update(patch)
      .eq("id", data.stageId)
      .eq("production_order_id", data.orderId);
    if (error) throw new Response(error.message, { status: 400 });

    // Recompute progress from stages.
    const { data: stages } = await context.supabase
      .from("production_stages")
      .select("status")
      .eq("production_order_id", data.orderId);
    const total = (stages ?? []).length;
    const done = (stages ?? []).filter((s) => s.status === "completed").length;
    const pct = total > 0 ? Math.round((done / total) * 100) : 0;
    await context.supabase
      .from("production_orders")
      .update({ progress_percent: pct })
      .eq("company_id", context.tenantId)
      .eq("id", data.orderId);

    await context.supabase.from("production_events").insert({
      order_id: data.orderId,
      event: `stage.${data.status}`,
      payload: { stageId: data.stageId },
      actor_id: context.userId,
    });

    return { ok: true as const, progressPercent: pct };
  });

/* ------------------------------ Delete ---------------------------------- */

export const deleteProductionOrder = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) =>
    z.object({ id: z.string().uuid() }).parse(data),
  )
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("production_orders")
      .delete()
      .eq("company_id", context.tenantId)
      .eq("id", data.id);
    if (error) throw new Response(error.message, { status: 400 });
    return { ok: true as const };
  });

/* -------------------------------- Stats --------------------------------- */

export const productionStats = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("production_orders")
      .select("status,progress_percent")
      .eq("company_id", context.tenantId);
    if (error) throw new Response(error.message, { status: 400 });
    const rows = data ?? [];
    const by = (s: string) => rows.filter((r) => r.status === s).length;
    return {
      total: rows.length,
      draft: by("draft"),
      planned: by("planned"),
      inProgress: by("in_progress"),
      paused: by("paused"),
      completed: by("completed"),
      cancelled: by("cancelled"),
      avgProgress:
        rows.length > 0
          ? Math.round(
              rows.reduce((a, r) => a + num(r.progress_percent), 0) / rows.length,
            )
          : 0,
    };
  });

/* ------------------------------- CNC Jobs ------------------------------- */

export const listCncJobs = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((data: unknown) =>
    z
      .object({
        orderId: z.string().uuid().optional(),
        status: z.string().max(40).optional(),
        limit: z.number().int().min(1).max(200).optional(),
      })
      .parse(data ?? {}),
  )
  .handler(async ({ data, context }) => {
    let q = context.supabase
      .from("cnc_jobs")
      .select(
        "id,name,status,format,machine_id,production_order_id,pieces_count,sheets_count,estimated_time_seconds,actual_time_seconds,started_at,completed_at,error_message,created_at,updated_at",
      )
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 100);
    if (data.orderId) q = q.eq("production_order_id", data.orderId);
    if (data.status) q = q.eq("status", data.status);
    const { data: rows, error } = await q;
    if (error) throw new Response(error.message, { status: 400 });
    return rows ?? [];
  });

export const listCncMachines = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("cnc_machines")
      .select(
        "id,name,brand,model,controller,post_processor,max_width_mm,max_height_mm,max_thickness_mm,is_active",
      )
      .eq("company_id", context.tenantId)
      .eq("is_active", true)
      .order("name", { ascending: true });
    if (error) throw new Response(error.message, { status: 400 });
    return data ?? [];
  });