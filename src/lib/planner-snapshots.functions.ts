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

/**
 * Erros nunca vazam detalhe do banco para o cliente: logamos no servidor e
 * devolvemos uma mensagem genérica por escopo.
 */
function fail(scope: string, error: unknown, status = 400): Response {
  console.error(`[planner-snapshots] ${scope}`, error);
  const messages: Record<string, string> = {
    "snapshot.load": "Não foi possível carregar o projeto.",
    "snapshot.save": "Não foi possível sincronizar o projeto.",
    "version.list": "Não foi possível carregar o histórico de versões.",
    "version.create": "Não foi possível criar a versão.",
    "version.load": "Não foi possível carregar a versão.",
  };
  return new Response(messages[scope] ?? "Operação não concluída.", { status });
}

const PROJECT_COLUMNS =
  "id, name, client, status, version, company_id, owner_id, created_at, updated_at";
const VERSION_COLUMNS = "id, project_id, version, label, created_at, created_by";
const VERSIONS_MAX_LIMIT = 100;

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
      .select(`${PROJECT_COLUMNS}, snapshot`)
      .eq("company_id", context.tenantId)
      .eq("id", data.id)
      .maybeSingle();
    if (error) throw fail("snapshot.load", error);
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
      // Guarda anti-regressão: só grava se a versão remota for <= a enviada.
      // Impede que uma resposta/retry atrasado sobrescreva um save mais novo.
      .lte("version", data.version)
      .select("id, version, updated_at")
      .maybeSingle();
    if (error) throw fail("snapshot.save", error);
    if (!row) {
      // Nenhuma linha atualizada: ou o projeto não pertence ao tenant, ou já
      // existe uma versão remota mais nova. Diferenciamos com uma leitura.
      const { data: current, error: readErr } = await context.supabase
        .from("planner_projects")
        .select("id, version, updated_at")
        .eq("company_id", context.tenantId)
        .eq("id", data.id)
        .maybeSingle();
      if (readErr) throw fail("snapshot.save", readErr);
      if (!current) throw fail("snapshot.save", "project not found for tenant", 404);
      return {
        id: current.id as string,
        version: current.version as number,
        updatedAt: current.updated_at as string,
        skipped: true as const,
      };
    }
    return {
      id: row.id as string,
      version: row.version as number,
      updatedAt: row.updated_at as string,
      skipped: false as const,
    };
  });

export const listProjectVersions = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .inputValidator((d) =>
    z
      .object({
        projectId: z.string().min(1),
        limit: z.number().int().min(1).max(VERSIONS_MAX_LIMIT).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    const { data: rows, error } = await context.supabase
      .from("planner_project_versions")
      // Projeção resumida: o snapshot NUNCA vai para a lista.
      .select(VERSION_COLUMNS)
      .eq("company_id", context.tenantId)
      .eq("project_id", data.projectId)
      .order("created_at", { ascending: false })
      .limit(data.limit ?? 25);
    if (error) throw fail("version.list", error);
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
    // Valida posse do projeto no servidor — impede anexar versão a projeto
    // de outro tenant (IDOR) mesmo com company_id derivado do servidor.
    const { data: project, error: projectErr } = await context.supabase
      .from("planner_projects")
      .select("id")
      .eq("company_id", context.tenantId)
      .eq("id", data.projectId)
      .maybeSingle();
    if (projectErr) throw fail("version.create", projectErr);
    if (!project) throw fail("version.create", "project not found for tenant", 404);
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
      .select(VERSION_COLUMNS)
      .single();
    if (error) throw fail("version.create", error);
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
  .inputValidator((d) =>
    z
      .object({
        id: z.string().min(1),
        // Quando informado, a versão precisa pertencer a este projeto.
        projectId: z.string().min(1).optional(),
      })
      .parse(d),
  )
  .handler(async ({ data, context }) => {
    let query = context.supabase
      .from("planner_project_versions")
      .select("id, project_id, version, label, snapshot, created_at")
      .eq("company_id", context.tenantId)
      .eq("id", data.id);
    if (data.projectId) query = query.eq("project_id", data.projectId);
    const { data: row, error } = await query.maybeSingle();
    if (error) throw fail("version.load", error);
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
