import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireAuth } from "@/core/middleware/require-auth";
import { requireTenant } from "@/core/middleware/require-tenant";
import type {
  Company,
  CompanyMember,
  CompanyWithRole,
  TenantRole,
} from "@/core/types/tenant";

const slugify = (s: string) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 48) || "empresa";

/** Empresas às quais o usuário atual pertence (com o papel dele em cada). */
export const listMyCompanies = createServerFn({ method: "GET" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("company_members")
      .select("role, active, company:companies(*)")
      .eq("user_id", userId)
      .eq("active", true);
    if (error) throw new Error(error.message);
    const rows = (data ?? []) as unknown as Array<{
      role: TenantRole;
      active: boolean;
      company: Company | Company[] | null;
    }>;
    return rows
      .map<CompanyWithRole | null>((r) => {
        const company = Array.isArray(r.company) ? r.company[0] : r.company;
        return company ? { ...company, role: r.role } : null;
      })
      .filter((c): c is CompanyWithRole => c !== null);
  });

/** Cria uma nova empresa; o criador vira `owner` via trigger no banco. */
export const createCompany = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().trim().min(2).max(120),
        cnpj: z.string().trim().max(32).optional().nullable(),
        logo_url: z.string().url().optional().nullable(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, userId } = context;
    const baseSlug = slugify(data.name);
    const slug = `${baseSlug}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: createdByUser, error: userInsertError } = await supabase
      .from("companies")
      .insert({
        name: data.name,
        slug,
        cnpj: data.cnpj ?? null,
        logo_url: data.logo_url ?? null,
        created_by: userId,
      })
      .select("*")
      .single();
    if (!userInsertError) return createdByUser as Company;

    const { getSupabaseAdmin } = await import("@/core/lib/supabase/admin.server");
    const admin = getSupabaseAdmin();
    const { data: createdByAdmin, error: adminInsertError } = await admin
      .from("companies")
      .insert({
        name: data.name,
        slug,
        cnpj: data.cnpj ?? null,
        logo_url: data.logo_url ?? null,
        created_by: userId,
      })
      .select("*")
      .single();
    if (adminInsertError) throw new Error(adminInsertError.message);
    return createdByAdmin as Company;
  });

/**
 * Garante que o usuário logado tenha ao menos uma empresa própria.
 * Chamado pelo `TenantProvider` no primeiro login — remove a etapa de
 * onboarding "Criar empresa" e permite o cliente entrar direto.
 */
export const ensureDefaultCompany = createServerFn({ method: "POST" })
  .middleware([requireAuth])
  .handler(async ({ context }) => {
    const { supabase, userId, email } = context;
    const { data: existing, error: exErr } = await supabase
      .from("company_members")
      .select("id")
      .eq("user_id", userId)
      .eq("active", true)
      .limit(1);
    if (exErr) throw new Error(exErr.message);
    if (existing && existing.length > 0) return { created: false };
    const nick = email && email.includes("@") ? email.split("@")[0] : "meu-espaco";
    const name = `Espaço ${nick.charAt(0).toUpperCase()}${nick.slice(1)}`;
    const slug = `${slugify(nick)}-${Math.random().toString(36).slice(2, 6)}`;
    const { data: createdByUser, error: userInsertError } = await supabase
      .from("companies")
      .insert({ name, slug, created_by: userId })
      .select("id")
      .single();
    if (!userInsertError) return { created: true, companyId: createdByUser.id as string };

    const { getSupabaseAdmin } = await import("@/core/lib/supabase/admin.server");
    const admin = getSupabaseAdmin();
    const { data: createdByAdmin, error: adminInsertError } = await admin
      .from("companies")
      .insert({ name, slug, created_by: userId })
      .select("id")
      .single();
    if (adminInsertError) throw new Error(adminInsertError.message);

    const { error: memberError } = await admin
      .from("company_members")
      .upsert(
        {
          company_id: createdByAdmin.id,
          user_id: userId,
          role: "owner",
          active: true,
        },
        { onConflict: "company_id,user_id" },
      );
    if (memberError) throw new Error(memberError.message);
    return { created: true, companyId: createdByAdmin.id as string };
  });

/** Atualiza dados da empresa ativa. Requer admin/owner. */
export const updateActiveCompany = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((input) =>
    z
      .object({
        name: z.string().trim().min(2).max(120).optional(),
        cnpj: z.string().trim().max(32).nullable().optional(),
        logo_url: z.string().url().nullable().optional(),
        custom_domain: z.string().trim().nullable().optional(),
        settings: z.record(z.string(), z.any()).optional(),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, tenantId, role } = context;
    if (role !== "owner" && role !== "admin") {
      throw new Response("Forbidden", { status: 403 });
    }
    const { data: updated, error } = await supabase
      .from("companies")
      .update(data)
      .eq("id", tenantId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated as Company;
  });

/** Membros da empresa ativa. */
export const listCompanyMembers = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    const { supabase, tenantId } = context;
    const { data, error } = await supabase
      .from("company_members")
      .select("*")
      .eq("company_id", tenantId)
      .order("created_at", { ascending: true });
    if (error) throw new Error(error.message);
    return (data ?? []) as CompanyMember[];
  });

/** Convida um e-mail para a empresa ativa (admin+). */
export const inviteMember = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((input) =>
    z
      .object({
        email: z.string().email(),
        role: z.enum(["admin", "manager", "member"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, tenantId, userId, role } = context;
    if (role !== "owner" && role !== "admin") {
      throw new Response("Forbidden", { status: 403 });
    }
    const token = crypto.randomUUID().replace(/-/g, "");
    const { data: inv, error } = await supabase
      .from("company_invitations")
      .insert({
        company_id: tenantId,
        email: data.email.toLowerCase(),
        role: data.role,
        token,
        invited_by: userId,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return inv;
  });

/** Atualiza o papel de um membro (admin+). */
export const updateMemberRole = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((input) =>
    z
      .object({
        memberId: z.string().uuid(),
        role: z.enum(["owner", "admin", "manager", "member"]),
      })
      .parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, role } = context;
    if (role !== "owner" && role !== "admin") {
      throw new Response("Forbidden", { status: 403 });
    }
    if (data.role === "owner" && role !== "owner") {
      throw new Response("Somente owner pode promover a owner", { status: 403 });
    }
    const { data: updated, error } = await supabase
      .from("company_members")
      .update({ role: data.role })
      .eq("id", data.memberId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated as CompanyMember;
  });

/** Desativa (ou reativa) um membro. */
export const setMemberActive = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((input) =>
    z.object({ memberId: z.string().uuid(), active: z.boolean() }).parse(input),
  )
  .handler(async ({ context, data }) => {
    const { supabase, role } = context;
    if (role !== "owner" && role !== "admin") {
      throw new Response("Forbidden", { status: 403 });
    }
    const { error } = await supabase
      .from("company_members")
      .update({ active: data.active })
      .eq("id", data.memberId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Lista convites da empresa ativa. */
export const listCompanyInvitations = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }) => {
    const { supabase, tenantId } = context;
    const { data, error } = await supabase
      .from("company_invitations")
      .select("*")
      .eq("company_id", tenantId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return data ?? [];
  });

/** Cancela (deleta) um convite pendente. */
export const cancelInvitation = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((input) => z.object({ invitationId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, role } = context;
    if (role !== "owner" && role !== "admin") {
      throw new Response("Forbidden", { status: 403 });
    }
    const { error } = await supabase
      .from("company_invitations")
      .delete()
      .eq("id", data.invitationId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

/** Reenvia convite: gera novo token e prorroga expiração. */
export const resendInvitation = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((input) => z.object({ invitationId: z.string().uuid() }).parse(input))
  .handler(async ({ context, data }) => {
    const { supabase, role } = context;
    if (role !== "owner" && role !== "admin") {
      throw new Response("Forbidden", { status: 403 });
    }
    const token = crypto.randomUUID().replace(/-/g, "");
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    const { data: updated, error } = await supabase
      .from("company_invitations")
      .update({ token, expires_at: expires })
      .eq("id", data.invitationId)
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return updated;
  });