/**
 * Rota canônica única da IA no cliente.
 *
 * TODA chamada de IA do frontend (provider Lovable, fallbacks do chat do
 * Planner, etc.) precisa passar por este endpoint protegido, que aplica
 * autenticação, tenant, validação de payload e cobrança de créditos.
 * Nenhum outro caminho de IA pode existir no cliente.
 */
export const AI_PROXY_ENDPOINT = "/api/ai/chat";

/**
 * Monta os headers de autenticação do proxy de IA:
 *  - `Authorization: Bearer <access_token>` do Supabase;
 *  - `x-dioris-tenant` com o tenant ativo selecionado (quando houver).
 *
 * Se o usuário pertence a mais de um tenant e nenhum está selecionado, o
 * header fica ausente de propósito e o servidor responde 403 `tenant_required`
 * — nunca escolhemos um tenant silenciosamente.
 */
export async function buildAiProxyHeaders(): Promise<Record<string, string>> {
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (typeof window === "undefined") return headers;

  try {
    const { getSupabaseBrowser } = await import("@/core/lib/supabase/client");
    const { data } = await getSupabaseBrowser().auth.getSession();
    if (data.session?.access_token) {
      headers.Authorization = `Bearer ${data.session.access_token}`;
    }
  } catch {
    /* sessão indisponível — servidor responderá 401 */
  }

  try {
    const { getActiveTenantIdFromStorage } = await import("@/core/providers/TenantProvider");
    const tenantId = getActiveTenantIdFromStorage();
    if (tenantId) headers["x-dioris-tenant"] = tenantId;
  } catch {
    /* sem tenant selecionado — servidor resolve (1 tenant) ou responde 403 */
  }

  return headers;
}