import { createMiddleware } from "@tanstack/react-start";
import { getRequestHeader } from "@tanstack/react-start/server";
import { z } from "zod";
import { createUserScopedClient } from "@/core/lib/supabase/server-user.server";
import type { TenantRole } from "@/core/types/tenant";

/**
 * Middleware: exige usuário autenticado + tenant ativo válido.
 * Client envia o tenant selecionado via header `x-dioris-tenant` (via
 * `functionMiddleware` global — ver src/start.ts).
 * Servidor valida a associação usando RLS: consulta `company_members`
 * pelo tenantId com o token do usuário. Se não existir linha ativa → 403.
 *
 * Injeta em `context`: { supabase, userId, email, tenantId, role }.
 */
export const requireTenant = createMiddleware({ type: "function" }).server(async ({ next }) => {
  const auth = getRequestHeader("authorization") ?? getRequestHeader("Authorization");
  if (!auth?.startsWith("Bearer ")) throw new Response("Unauthorized", { status: 401 });
  const token = auth.slice("Bearer ".length);
  const supabase = createUserScopedClient(token);

  const { data: userData, error: userErr } = await supabase.auth.getUser();
  if (userErr || !userData.user) throw new Response("Unauthorized", { status: 401 });

  const rawTenant =
    getRequestHeader("x-dioris-tenant") ?? getRequestHeader("X-Dioris-Tenant") ?? "";
  const parsed = z.string().uuid().safeParse(rawTenant);
  if (!parsed.success) {
    throw new Response("Missing or invalid tenant", { status: 400 });
  }
  const tenantId = parsed.data;

  const { data: member, error: memberErr } = await supabase
    .from("company_members")
    .select("role, active")
    .eq("company_id", tenantId)
    .eq("user_id", userData.user.id)
    .eq("active", true)
    .maybeSingle();
  if (memberErr) throw new Response("Tenant check failed", { status: 500 });
  if (!member) throw new Response("Forbidden: not a member of tenant", { status: 403 });

  return next({
    context: {
      supabase,
      userId: userData.user.id,
      email: userData.user.email ?? null,
      tenantId,
      role: member.role as TenantRole,
    },
  });
});
