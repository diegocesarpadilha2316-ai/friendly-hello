import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { requireTenant } from "@/core/middleware/require-tenant";
import { PluginManager } from "./plugin-manager.server";
import type {
  Plugin,
  PluginLogEntry,
  PluginMarketplaceItem,
  PluginPermissionRow,
  PluginPermissionScope,
  PluginUpdateRow,
  SdkSnapshot,
} from "./types";

function mapPlugin(r: Record<string, unknown>): Plugin {
  return {
    id: String(r.id),
    companyId: String(r.company_id),
    slug: String(r.slug),
    name: String(r.name),
    description: (r.description as string) ?? null,
    author: (r.author as string) ?? null,
    category: (r.category as Plugin["category"]) ?? "generic",
    version: String(r.version ?? "0.1.0"),
    status: (r.status as Plugin["status"]) ?? "installed",
    enabled: Boolean(r.enabled),
    manifest: (r.manifest as Plugin["manifest"]) ?? {},
    capabilities: (r.capabilities as Plugin["capabilities"]) ?? [],
    dependencies: (r.dependencies as readonly string[]) ?? [],
    createdAt: String(r.created_at),
    updatedAt: String(r.updated_at ?? r.created_at),
  };
}

function mapLog(r: Record<string, unknown>): PluginLogEntry {
  return {
    id: String(r.id),
    pluginId: (r.plugin_id as string) ?? null,
    level: (r.level as PluginLogEntry["level"]) ?? "info",
    action: String(r.action),
    message: (r.message as string) ?? null,
    createdAt: String(r.created_at),
  };
}

function mapPerm(r: Record<string, unknown>): PluginPermissionRow {
  return {
    id: String(r.id),
    pluginId: String(r.plugin_id),
    scope: r.scope as PluginPermissionScope,
    granted: Boolean(r.granted),
    grantedAt: (r.granted_at as string) ?? null,
  };
}

function mapUpdate(r: Record<string, unknown>): PluginUpdateRow {
  return {
    id: String(r.id),
    pluginId: String(r.plugin_id),
    fromVersion: String(r.from_version),
    toVersion: String(r.to_version),
    status: (r.status as PluginUpdateRow["status"]) ?? "pending",
    scheduledAt: String(r.scheduled_at),
    appliedAt: (r.applied_at as string) ?? null,
  };
}

function mapMarket(r: Record<string, unknown>): PluginMarketplaceItem {
  return {
    id: String(r.id),
    slug: String(r.slug),
    name: String(r.name),
    description: (r.description as string) ?? null,
    category: String(r.category),
    author: (r.author as string) ?? null,
    version: String(r.version),
    priceCents: Number(r.price_cents ?? 0),
    featured: Boolean(r.featured),
    downloads: Number(r.downloads ?? 0),
    rating: Number(r.rating ?? 0),
  };
}

export const pluginsList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly Plugin[]> => {
    const { data } = await context.supabase
      .from("plugins")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false });
    return (data ?? []).map(mapPlugin);
  });

export const pluginLogs = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly PluginLogEntry[]> => {
    const { data } = await context.supabase
      .from("plugin_logs")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("created_at", { ascending: false })
      .limit(100);
    return (data ?? []).map(mapLog);
  });

export const pluginPermissionsList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly PluginPermissionRow[]> => {
    const { data } = await context.supabase
      .from("plugin_permissions")
      .select("*")
      .eq("company_id", context.tenantId);
    return (data ?? []).map(mapPerm);
  });

export const pluginUpdatesList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly PluginUpdateRow[]> => {
    const { data } = await context.supabase
      .from("plugin_updates")
      .select("*")
      .eq("company_id", context.tenantId)
      .order("scheduled_at", { ascending: false })
      .limit(50);
    return (data ?? []).map(mapUpdate);
  });

export const marketplaceList = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<readonly PluginMarketplaceItem[]> => {
    const { data } = await context.supabase
      .from("plugin_marketplace")
      .select("*")
      .order("featured", { ascending: false })
      .limit(100);
    return (data ?? []).map(mapMarket);
  });

export const sdkSnapshot = createServerFn({ method: "GET" })
  .middleware([requireTenant])
  .handler(async ({ context }): Promise<SdkSnapshot> => {
    const s = context.supabase;
    const t = context.tenantId;
    const [plugins, logs, perms, updates, market] = await Promise.all([
      s.from("plugins").select("*").eq("company_id", t),
      s
        .from("plugin_logs")
        .select("*")
        .eq("company_id", t)
        .order("created_at", { ascending: false })
        .limit(100),
      s.from("plugin_permissions").select("*").eq("company_id", t),
      s
        .from("plugin_updates")
        .select("*")
        .eq("company_id", t)
        .order("scheduled_at", { ascending: false })
        .limit(50),
      s.from("plugin_marketplace").select("*").order("featured", { ascending: false }).limit(100),
    ]);
    return {
      plugins: (plugins.data ?? []).map(mapPlugin),
      logs: (logs.data ?? []).map(mapLog),
      permissions: (perms.data ?? []).map(mapPerm),
      updates: (updates.data ?? []).map(mapUpdate),
      marketplace: (market.data ?? []).map(mapMarket),
    };
  });

const installSchema = z.object({
  slug: z.string().min(1),
  name: z.string().min(1),
  category: z.string().default("generic"),
  version: z.string().default("0.1.0"),
  description: z.string().optional(),
  author: z.string().optional(),
  manifest: z.record(z.string(), z.unknown()).default({}),
});

export const pluginInstall = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => installSchema.parse(raw))
  .handler(async ({ context, data }): Promise<Plugin> => {
    const { data: row, error } = await context.supabase
      .from("plugins")
      .upsert(
        {
          company_id: context.tenantId,
          slug: data.slug,
          name: data.name,
          category: data.category,
          version: data.version,
          description: data.description ?? null,
          author: data.author ?? null,
          manifest: data.manifest,
          status: "installed",
          enabled: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id,slug" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await PluginManager.log(context, row.id, "install", `Plugin ${data.slug} instalado`);
    return mapPlugin(row);
  });

const idSchema = z.object({ id: z.string().uuid() });

export const pluginEnable = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idSchema.parse(raw))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    await PluginManager.setStatus(context, data.id, "enabled", true);
    return { ok: true };
  });

export const pluginDisable = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idSchema.parse(raw))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    await PluginManager.setStatus(context, data.id, "disabled", false);
    return { ok: true };
  });

export const pluginUninstall = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => idSchema.parse(raw))
  .handler(async ({ context, data }): Promise<{ ok: true }> => {
    const { error } = await context.supabase
      .from("plugins")
      .delete()
      .eq("id", data.id)
      .eq("company_id", context.tenantId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

const marketInstallSchema = z.object({ marketplaceId: z.string().uuid() });

export const marketplaceInstall = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) => marketInstallSchema.parse(raw))
  .handler(async ({ context, data }): Promise<Plugin> => {
    const { data: item, error: e1 } = await context.supabase
      .from("plugin_marketplace")
      .select("*")
      .eq("id", data.marketplaceId)
      .maybeSingle();
    if (e1 || !item) throw new Error("Item de marketplace não encontrado");
    const { data: row, error } = await context.supabase
      .from("plugins")
      .upsert(
        {
          company_id: context.tenantId,
          slug: item.slug,
          name: item.name,
          category: item.category,
          version: item.version,
          description: item.description,
          author: item.author,
          manifest: item.manifest ?? {},
          status: "installed",
          enabled: false,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "company_id,slug" },
      )
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    await context.supabase.from("plugin_downloads").insert({
      company_id: context.tenantId,
      marketplace_id: item.id,
      plugin_id: row.id,
      version: item.version,
    });
    await context.supabase
      .from("plugin_marketplace")
      .update({ downloads: (item.downloads ?? 0) + 1 })
      .eq("id", item.id);
    await PluginManager.log(
      context,
      row.id,
      "marketplace_install",
      `Instalado de marketplace: ${item.slug}`,
    );
    return mapPlugin(row);
  });

export const sdkExport = createServerFn({ method: "POST" })
  .middleware([requireTenant])
  .inputValidator((raw: unknown) =>
    z.object({ format: z.enum(["json", "csv"]).default("json") }).parse(raw),
  )
  .handler(async ({ context, data }): Promise<{ format: string; content: string }> => {
    const { data: rows } = await context.supabase
      .from("plugins")
      .select("*")
      .eq("company_id", context.tenantId);
    const list = (rows ?? []).map(mapPlugin);
    if (data.format === "csv") {
      const header = "id,slug,name,category,version,status,enabled,updatedAt";
      const body = list
        .map((p) =>
          [p.id, p.slug, p.name, p.category, p.version, p.status, p.enabled, p.updatedAt].join(","),
        )
        .join("\n");
      return { format: "csv", content: `${header}\n${body}` };
    }
    return { format: "json", content: JSON.stringify(list, null, 2) };
  });
