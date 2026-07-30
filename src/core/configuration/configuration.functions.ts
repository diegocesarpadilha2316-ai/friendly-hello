import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import type {
  ApiKey,
  BackupSettings,
  Branding,
  CompanySettings,
  ConfigurationSnapshot,
  FeatureFlag,
  Integration,
  Localization,
  PlatformSettings,
  SecuritySettings,
} from "./types";

const jsonRecord = z.record(z.string(), z.unknown());

/* ============ PLATFORM (global read) ============ */
export const platformGet = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<PlatformSettings | null> => {
    const { data } = await context.supabase.from("platform_settings").select("*").maybeSingle();
    if (!data) return null;
    const { mapPlatform } = await import("./configuration.server");
    return mapPlatform(data);
  });

/* ============ COMPANY SETTINGS ============ */
export const companySettingsGet = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<CompanySettings | null> => {
    const { data } = await context.supabase
      .from("company_settings")
      .select("*")
      .eq("company_id", context.tenantId)
      .maybeSingle();
    if (!data) return null;
    const { mapCompany } = await import("./configuration.server");
    return mapCompany(data);
  });

export const companySettingsUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z
      .object({
        displayName: z.string().optional(),
        theme: z.string().optional(),
        locale: z.string().optional(),
        timezone: z.string().optional(),
        currency: z.string().optional(),
        dateFormat: z.string().optional(),
        numberFormat: z.string().optional(),
        units: z.string().optional(),
        metadata: jsonRecord.optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }): Promise<CompanySettings> => {
    const row = {
      company_id: context.tenantId,
      display_name: data.displayName ?? null,
      theme: data.theme,
      locale: data.locale,
      timezone: data.timezone,
      currency: data.currency,
      date_format: data.dateFormat,
      number_format: data.numberFormat,
      units: data.units,
      metadata: data.metadata ?? {},
    };
    const { data: saved, error } = await context.supabase
      .from("company_settings")
      .upsert(row, { onConflict: "company_id" })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const { mapCompany } = await import("./configuration.server");
    return mapCompany(saved);
  });

/* ============ FEATURE FLAGS ============ */
export const flagsList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly FeatureFlag[]> => {
    const { data, error } = await context.supabase
      .from("feature_flags")
      .select("*")
      .or(`company_id.eq.${context.tenantId},company_id.is.null`)
      .order("key");
    if (error) throw new Error(error.message);
    const { mapFlag } = await import("./configuration.server");
    return (data ?? []).map(mapFlag);
  });

export const flagUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z
      .object({
        key: z.string().min(1),
        enabled: z.boolean(),
        module: z.string().optional(),
        description: z.string().optional(),
        scope: z.enum(["global", "company", "user"]).default("company"),
        rules: jsonRecord.optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("feature_flags").upsert(
      {
        company_id: context.tenantId,
        key: data.key,
        enabled: data.enabled,
        module: data.module ?? null,
        description: data.description ?? null,
        scope: data.scope,
        rules: data.rules ?? {},
      },
      { onConflict: "company_id,key" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

export const flagDelete = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("feature_flags")
      .delete()
      .eq("id", data.id)
      .eq("company_id", context.tenantId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ============ INTEGRATIONS ============
 * Fonte canônica: public.integrations_registry (+ integration_health).
 * A tabela public.integrations não existe no banco real; estes fluxos apenas
 * mantêm a forma do tipo legado `Integration` consumida pelas telas de
 * Configurações, delegando 100% ao serviço central em
 * src/core/integrations/registry.server.ts.
 */
export const integrationsList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly Integration[]> => {
    const reg = await import("@/core/integrations/registry-data.server");
    const [rows, health] = await Promise.all([
      reg.listRegistry(context.supabase, context.tenantId),
      reg.listHealth(context.supabase, context.tenantId),
    ]);
    const latest = reg.latestHealthByIntegration(health);
    const { mapIntegration } = await import("./configuration.server");
    return rows.map((r) => mapIntegration(r, latest.get(String(r.id))));
  });

export const integrationUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z
      .object({
        provider: z.string().min(1),
        name: z.string().min(1).optional(),
        category: z.string().default("generic"),
        enabled: z.boolean().default(false),
        config: jsonRecord.optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const reg = await import("@/core/integrations/registry-data.server");
    // `enabled` da UI legada mapeia para o campo canônico `status`.
    await reg.upsertRegistry(context.supabase, context.tenantId, {
      provider: data.provider,
      name: data.name,
      category: data.category,
      status: data.enabled ? "active" : "inactive",
      config: data.config ?? {},
    });
    return { ok: true as const };
  });

export const integrationTest = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    // "Último teste" e "último erro" vivem em integration_health no schema real.
    const reg = await import("@/core/integrations/registry-data.server");
    const testedAt = await reg.recordHealthCheck(context.supabase, context.tenantId, {
      integrationId: data.id,
      status: "online",
      lastError: null,
    });
    return { ok: true as const, testedAt };
  });

/* ============ BRANDING ============ */
export const brandingGet = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<Branding | null> => {
    const { data } = await context.supabase
      .from("branding")
      .select("*")
      .eq("company_id", context.tenantId)
      .maybeSingle();
    if (!data) return null;
    const { mapBranding } = await import("./configuration.server");
    return mapBranding(data);
  });

export const brandingUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z
      .object({
        logoUrl: z.string().url().nullish(),
        iconUrl: z.string().url().nullish(),
        palette: jsonRecord.optional(),
        typography: jsonRecord.optional(),
        cssVariables: jsonRecord.optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("branding").upsert(
      {
        company_id: context.tenantId,
        logo_url: data.logoUrl ?? null,
        icon_url: data.iconUrl ?? null,
        palette: data.palette ?? {},
        typography: data.typography ?? {},
        css_variables: data.cssVariables ?? {},
      },
      { onConflict: "company_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ============ LOCALIZATION ============ */
export const localizationGet = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<Localization | null> => {
    const { data } = await context.supabase
      .from("localization")
      .select("*")
      .eq("company_id", context.tenantId)
      .maybeSingle();
    if (!data) return null;
    const { mapLocalization } = await import("./configuration.server");
    return mapLocalization(data);
  });

export const localizationUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z
      .object({
        defaultLocale: z.string(),
        supportedLocales: z.array(z.string()),
        translations: jsonRecord.optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("localization").upsert(
      {
        company_id: context.tenantId,
        default_locale: data.defaultLocale,
        supported_locales: data.supportedLocales,
        translations: data.translations ?? {},
      },
      { onConflict: "company_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ============ SECURITY ============ */
export const securityGet = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<SecuritySettings | null> => {
    const { data } = await context.supabase
      .from("security_settings")
      .select("*")
      .eq("company_id", context.tenantId)
      .maybeSingle();
    if (!data) return null;
    const { mapSecurity } = await import("./configuration.server");
    return mapSecurity(data);
  });

export const securityUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z
      .object({
        require2fa: z.boolean().optional(),
        sessionTtlSeconds: z.number().int().positive().optional(),
        jwtTtlSeconds: z.number().int().positive().optional(),
        passwordMinLength: z.number().int().min(4).max(128).optional(),
        passwordRequireSymbol: z.boolean().optional(),
        rateLimitPerMin: z.number().int().positive().optional(),
        allowedOrigins: z.array(z.string()).optional(),
        ipAllowlist: z.array(z.string()).optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("security_settings").upsert(
      {
        company_id: context.tenantId,
        require_2fa: data.require2fa,
        session_ttl_seconds: data.sessionTtlSeconds,
        jwt_ttl_seconds: data.jwtTtlSeconds,
        password_min_length: data.passwordMinLength,
        password_require_symbol: data.passwordRequireSymbol,
        rate_limit_per_min: data.rateLimitPerMin,
        allowed_origins: data.allowedOrigins,
        ip_allowlist: data.ipAllowlist,
      },
      { onConflict: "company_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ============ BACKUPS ============ */
export const backupGet = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<BackupSettings | null> => {
    const { data } = await context.supabase
      .from("backup_settings")
      .select("*")
      .eq("company_id", context.tenantId)
      .maybeSingle();
    if (!data) return null;
    const { mapBackup } = await import("./configuration.server");
    return mapBackup(data);
  });

export const backupUpsert = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z
      .object({
        enabled: z.boolean(),
        frequency: z.enum(["hourly", "daily", "weekly", "monthly"]),
        retentionDays: z.number().int().positive(),
        storageProvider: z.string(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase.from("backup_settings").upsert(
      {
        company_id: context.tenantId,
        enabled: data.enabled,
        frequency: data.frequency,
        retention_days: data.retentionDays,
        storage_provider: data.storageProvider,
      },
      { onConflict: "company_id" },
    );
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ============ API KEYS ============ */
export const apiKeysList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly ApiKey[]> => {
    const { data, error } = await context.supabase
      .from("api_keys")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { mapApiKey } = await import("./configuration.server");
    return (data ?? []).map(mapApiKey);
  });

export const apiKeyCreate = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z
      .object({
        name: z.string().min(1),
        scopes: z.array(z.string()).default([]),
        expiresAt: z.string().optional(),
      })
      .parse(raw),
  )
  .handler(async ({ context, data }) => {
    // Implementação canônica única — ver src/core/api-gateway/key-hash.server.ts.
    // O token completo é gerado server-side e devolvido uma única vez.
    const { generateApiKey } = await import("@/core/api-gateway/key-hash.server");
    const { prefix, keyHash, full } = generateApiKey();
    const { data: saved, error } = await context.supabase
      .from("api_keys")
      .insert({
        company_id: context.tenantId,
        name: data.name,
        prefix,
        // Coluna canônica única do hash. `hashed_key` não existe no banco real
        // e não deve ser gravada — sem fallback, sem escrita dupla.
        key_hash: keyHash,
        scopes: data.scopes,
        status: "active",
        expires_at: data.expiresAt ?? null,
        created_by: context.userId,
      })
      .select()
      .single();
    if (error) throw new Error(error.message);
    const { mapApiKey } = await import("./configuration.server");
    return { key: mapApiKey(saved), plainToken: full };
  });

export const apiKeyRevoke = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => z.object({ id: z.string().uuid() }).parse(raw))
  .handler(async ({ context, data }) => {
    const { error } = await context.supabase
      .from("api_keys")
      .update({ status: "revoked", updated_at: new Date().toISOString() })
      .eq("id", data.id)
      .eq("company_id", context.tenantId);
    if (error) throw new Error(error.message);
    return { ok: true as const };
  });

/* ============ SNAPSHOT (singleton read for cache) ============ */
export const configurationSnapshot = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<ConfigurationSnapshot> => {
    const s = context.supabase;
    const [
      platform,
      company,
      branding,
      localization,
      security,
      backup,
      flags,
      integrationRows,
      healthRows,
      apiKeys,
    ] = await Promise.all([
      s.from("platform_settings").select("*").maybeSingle(),
      s.from("company_settings").select("*").eq("company_id", context.tenantId).maybeSingle(),
      s.from("branding").select("*").eq("company_id", context.tenantId).maybeSingle(),
      s.from("localization").select("*").eq("company_id", context.tenantId).maybeSingle(),
      s.from("security_settings").select("*").eq("company_id", context.tenantId).maybeSingle(),
      s.from("backup_settings").select("*").eq("company_id", context.tenantId).maybeSingle(),
      s
        .from("feature_flags")
        .select("*")
        .or(`company_id.eq.${context.tenantId},company_id.is.null`),
      reg.listRegistry(s, context.tenantId),
      reg.listHealth(s, context.tenantId),
      s
        .from("api_keys")
        .select("*")
        .eq("company_id", context.tenantId)
        .order("created_at", { ascending: false }),
    ]);
    const m = await import("./configuration.server");
    const latestHealth = reg.latestHealthByIntegration(healthRows);
    return {
      platform: platform.data ? m.mapPlatform(platform.data) : null,
      company: company.data ? m.mapCompany(company.data) : null,
      branding: branding.data ? m.mapBranding(branding.data) : null,
      localization: localization.data ? m.mapLocalization(localization.data) : null,
      security: security.data ? m.mapSecurity(security.data) : null,
      backup: backup.data ? m.mapBackup(backup.data) : null,
      flags: (flags.data ?? []).map(m.mapFlag),
      integrations: integrationRows.map((r) =>
        m.mapIntegration(r, latestHealth.get(String(r.id))),
      ),
      apiKeys: (apiKeys.data ?? []).map(m.mapApiKey),
    };
  });

/* ============ EXPORT ============ */
export const configurationExport = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z.object({ format: z.enum(["json", "csv"]).default("json") }).parse(raw ?? {}),
  )
  .handler(async ({ context, data }) => {
    const snap = await configurationSnapshot();
    if (data.format === "json") {
      return { format: "json" as const, content: JSON.stringify(snap, null, 2) };
    }
    // Flat CSV of feature flags (most useful tabular slice).
    const rows = snap.flags;
    const headers = ["key", "enabled", "scope", "module", "description"];
    const esc = (v: unknown) => JSON.stringify(v == null ? "" : String(v));
    const csv = [
      headers.join(","),
      ...rows.map((r) =>
        [r.key, String(r.enabled), r.scope, r.module ?? "", r.description ?? ""].map(esc).join(","),
      ),
    ].join("\n");
    void context;
    return { format: "csv" as const, content: csv };
  });
