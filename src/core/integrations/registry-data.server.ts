/**
 * SERVIÇO CANÔNICO ÚNICO DE INTEGRAÇÕES.
 *
 * Fonte de verdade: `public.integrations_registry` (+ tabelas irmãs
 * integration_health / _credentials / _tokens / _logs / _sync / _webhooks / _events).
 *
 * A tabela `public.integrations` (migration 006) NÃO existe no banco real e não
 * deve ser referenciada por código novo. Nenhum fallback entre as duas fontes.
 *
 * Todo acesso de leitura/gravação ao registry passa por este módulo.
 */
import type { SupabaseClient } from "@supabase/supabase-js";

/** Projeção explícita — nunca `select("*")`, para não trafegar colunas novas sem revisão. */
export const REGISTRY_COLUMNS =
  "id, company_id, provider, name, category, auth_type, status, version, capabilities, rate_limit, retry_policy, config, metadata, created_at, updated_at";

/** Health é a única origem de "último teste" e "último erro" no schema real. */
export const HEALTH_COLUMNS =
  "id, company_id, integration_id, status, latency_ms, last_error, last_sync_at, last_check_at";

/**
 * Webhooks: `secret` é deliberadamente omitido da projeção para que o segredo
 * nunca saia do banco em fluxos de leitura.
 */
export const WEBHOOK_COLUMNS =
  "id, company_id, integration_id, provider, event, url, active, metadata, created_at, updated_at";

export type RegistryRow = Record<string, unknown>;

export async function listRegistry(
  supabase: SupabaseClient,
  tenantId: string,
): Promise<RegistryRow[]> {
  const { data, error } = await supabase
    .from("integrations_registry")
    .select(REGISTRY_COLUMNS)
    .eq("company_id", tenantId)
    .order("created_at", { ascending: false });
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistryRow[];
}

export interface UpsertRegistryInput {
  provider: string;
  name?: string;
  category?: string;
  authType?: string;
  status?: string;
  config?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}

export async function upsertRegistry(
  supabase: SupabaseClient,
  tenantId: string,
  input: UpsertRegistryInput,
): Promise<RegistryRow> {
  const payload: Record<string, unknown> = {
    company_id: tenantId,
    provider: input.provider,
    // `name` é NOT NULL no schema real; usa o provider quando a UI não informa.
    name: input.name ?? input.provider,
    updated_at: new Date().toISOString(),
  };
  if (input.category !== undefined) payload.category = input.category;
  if (input.authType !== undefined) payload.auth_type = input.authType;
  if (input.status !== undefined) payload.status = input.status;
  if (input.config !== undefined) payload.config = input.config;
  if (input.metadata !== undefined) payload.metadata = input.metadata;

  const { data, error } = await supabase
    .from("integrations_registry")
    .upsert(payload, { onConflict: "company_id,provider" })
    .select(REGISTRY_COLUMNS)
    .single();
  if (error) throw new Error(error.message);
  return data as RegistryRow;
}

export async function deleteRegistry(
  supabase: SupabaseClient,
  tenantId: string,
  id: string,
): Promise<void> {
  const { error } = await supabase
    .from("integrations_registry")
    .delete()
    .eq("id", id)
    .eq("company_id", tenantId);
  if (error) throw new Error(error.message);
}

export async function listHealth(
  supabase: SupabaseClient,
  tenantId: string,
  limit = 100,
): Promise<RegistryRow[]> {
  const { data, error } = await supabase
    .from("integration_health")
    .select(HEALTH_COLUMNS)
    .eq("company_id", tenantId)
    .order("last_check_at", { ascending: false })
    .limit(limit);
  if (error) throw new Error(error.message);
  return (data ?? []) as RegistryRow[];
}

/** Registra o resultado de um teste de conexão. Não grava payloads nem segredos. */
export async function recordHealthCheck(
  supabase: SupabaseClient,
  tenantId: string,
  params: {
    integrationId: string;
    status: "online" | "offline" | "degraded" | "unknown";
    latencyMs?: number | null;
    lastError?: string | null;
  },
): Promise<string> {
  const checkedAt = new Date().toISOString();
  const { error } = await supabase.from("integration_health").insert({
    company_id: tenantId,
    integration_id: params.integrationId,
    status: params.status,
    latency_ms: params.latencyMs ?? null,
    last_error: params.lastError ?? null,
    last_check_at: checkedAt,
  });
  if (error) throw new Error(error.message);
  return checkedAt;
}

/** Health mais recente por integração (o histórico é append-only). */
export function latestHealthByIntegration(rows: RegistryRow[]): Map<string, RegistryRow> {
  const map = new Map<string, RegistryRow>();
  for (const r of rows) {
    const key = String(r.integration_id ?? "");
    if (!key) continue;
    const cur = map.get(key);
    if (!cur || String(r.last_check_at ?? "") > String(cur.last_check_at ?? "")) map.set(key, r);
  }
  return map;
}
