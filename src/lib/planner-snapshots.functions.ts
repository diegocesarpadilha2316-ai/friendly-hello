/**
 * Etapa 2 — Server functions do Planner: snapshot rolling + versões nomeadas.
 *
 * - `planner_projects.snapshot` (jsonb) guarda o último estado (autosave).
 * - `planner_project_versions` guarda checkpoints nomeados (histórico).
 *
 * RLS aplica via `is_tenant_member`; escopamos sempre por `company_id`.
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonObject = Record<string, any>;

// Snapshot é payload JSON opaco do editor. Validamos apenas que é um objeto;
// serializamos via JSON.stringify/parse para remover `undefined` que o Zod
// estrito rejeitaria e o Postgres/JSONB não aceita.
const snapshotSchema = z
  .unknown()
  .refine((v) => v !== null && typeof v === "object" && !Array.isArray(v), {
    message: "snapshot deve ser objeto",
  })
  .transform((v) => JSON.parse(JSON.stringify(v)) as JsonObject);

export const loadProjectSnapshot = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((d) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("planner_projects")
      .select("id, name, client, status, version, company_id, owner_id, created_at, updated_at, snapshot")
      .eq("company_id", context.tenantId)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return {
      meta: {
        id: row.id,
        name: row.name,
        client: row.client as string | null,
        status: row.status as string,
        version: row.version as number,
        companyId: row.company_id as string,
        ownerId: row.owner_id as string,
        createdAt: row.created_at as string,
        updatedAt: row.updated_at as string,
      },
      snapshot: (row.snapshot ?? null) as JsonObject | null,
    };
  });

export const saveProjectSnapshot = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().min(1),
        snapshot: snapshotSchema,
        version: z.number().int().min(1),
        name: z.string().min(1).max(200).optional(),
        client: z.string().max(200).nullable().optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = {
      snapshot: data.snapshot,
      version: data.version,
    };
    if (data.name !== undefined) patch.name = data.name;
    if (data.client !== undefined) patch.client = data.client;
    const { data: row, error } = await context.supabase
      .from("planner_projects")
      .update(patch)
      .eq("company_id", context.tenantId)
      .eq("id", data.id)
      .select("id, version, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return {
      id: row.id as string,
      version: row.version as number,
      updatedAt: row.updated_at as string,
    };
  });

export const listProjectVersions = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((d) => z.object({ projectId: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("planner_project_versions")
      .select("id, project_id, version, label, created_at, created_by")
      .eq("company_id", context.tenantId)
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false })
      .limit(100);
    if (error) throw new Error(error.message);
    return (rows ?? []).map((r) => ({
      id: r.id as string,
      projectId: r.project_id as string,
      version: r.version as number,
      label: r.label as string,
      createdAt: r.created_at as string,
      createdBy: (r.created_by as string | null) ?? null,
    }));
  });

export const createProjectVersion = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().min(1).max(160),
        projectId: z.string().min(1),
        version: z.number().int().min(1),
        label: z.string().min(1).max(200),
        snapshot: snapshotSchema,
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("planner_project_versions")
      .insert({
        id: data.id,
        project_id: data.projectId,
        company_id: context.tenantId,
        version: data.version,
        label: data.label,
        snapshot: data.snapshot,
        created_by: context.userId,
      })
      .select("id, project_id, version, label, created_at, created_by")
      .single();
    if (error) throw new Error(error.message);
    return {
      id: row.id as string,
      projectId: row.project_id as string,
      version: row.version as number,
      label: row.label as string,
      createdAt: row.created_at as string,
      createdBy: (row.created_by as string | null) ?? null,
    };
  });

export const loadProjectVersion = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((d) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("planner_project_versions")
      .select("id, project_id, version, label, snapshot, created_at")
      .eq("company_id", context.tenantId)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    if (!row) return null;
    return {
      id: row.id as string,
      projectId: row.project_id as string,
      version: row.version as number,
      label: row.label as string,
      createdAt: row.created_at as string,
      snapshot: row.snapshot as JsonObject,
    };
  });