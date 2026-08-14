/**
 * Etapa 1 — Server functions do Planner: projetos (metadados).
 *
 * Thin wrapper: apenas createServerFn + imports client-safe.
 * Toda persistência acontece na tabela `planner_projects` do Supabase,
 * escopada por tenant via `requireTenant` (RLS via `is_tenant_member`).
 */
import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";

export type PlannerProjectStatusDTO = "draft" | "in_progress" | "review" | "approved" | "archived";

export interface PlannerProjectRowDTO {
  id: string;
  name: string;
  client: string | null;
  status: PlannerProjectStatusDTO;
  version: number;
  companyId: string;
  ownerId: string;
  createdAt: string;
  updatedAt: string;
}

function mapRow(r: {
  id: string;
  name: string;
  client: string | null;
  status: PlannerProjectStatusDTO;
  version: number;
  company_id: string;
  owner_id: string;
  created_at: string;
  updated_at: string;
}): PlannerProjectRowDTO {
  return {
    id: r.id,
    name: r.name,
    client: r.client,
    status: r.status,
    version: r.version,
    companyId: r.company_id,
    ownerId: r.owner_id,
    createdAt: r.created_at,
    updatedAt: r.updated_at,
  };
}

export const listProjects = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    const { data, error } = await context.supabase
      .from("planner_projects")
      .select("id, name, client, status, version, company_id, owner_id, created_at, updated_at")
      .eq("company_id", context.tenantId)
      .order("updated_at", { ascending: false })
      .limit(500);
    if (error) throw new Error(error.message);
    return (data ?? []).map(mapRow);
  });

export const getProject = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((d) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("planner_projects")
      .select("id, name, client, status, version, company_id, owner_id, created_at, updated_at")
      .eq("company_id", context.tenantId)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw new Error(error.message);
    return row ? mapRow(row) : null;
  });

export const createProjectRow = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().min(1).max(120),
        name: z.string().min(1).max(200),
        client: z.string().max(200).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("planner_projects")
      .insert({
        id: data.id,
        company_id: context.tenantId,
        owner_id: context.userId,
        name: data.name,
        client: data.client ?? null,
        status: "draft",
        version: 1,
      })
      .select("id, name, client, status, version, company_id, owner_id, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return mapRow(row);
  });

export const renameProject = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().min(1),
        name: z.string().min(1).max(200),
        client: z.string().max(200).optional().nullable(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const patch: Record<string, unknown> = { name: data.name };
    if (data.client !== undefined) patch.client = data.client;
    const { data: row, error } = await context.supabase
      .from("planner_projects")
      .update(patch)
      .eq("company_id", context.tenantId)
      .eq("id", data.id)
      .select("id, name, client, status, version, company_id, owner_id, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return mapRow(row);
  });

export const setProjectStatus = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((d) =>
    z
      .object({
        id: z.string().min(1),
        status: z.enum(["draft", "in_progress", "review", "approved", "archived"]),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: row, error } = await context.supabase
      .from("planner_projects")
      .update({ status: data.status })
      .eq("company_id", context.tenantId)
      .eq("id", data.id)
      .select("id, name, client, status, version, company_id, owner_id, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return mapRow(row);
  });

export const deleteProject = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((d) => z.object({ id: z.string().min(1) }).parse(d))
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("planner_projects")
      .delete()
      .eq("company_id", context.tenantId)
      .eq("id", data.id);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });
