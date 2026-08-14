// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonRecord = Record<string, any>;

export type PluginCategory =
  | "planner"
  | "sites"
  | "systems"
  | "crm"
  | "finance"
  | "marketplace"
  | "automation"
  | "ai"
  | "theme"
  | "template"
  | "component"
  | "cnc"
  | "generic";

export type PluginStatus =
  "installed" | "enabled" | "disabled" | "updating" | "error" | "uninstalled";

export type PluginPermissionScope =
  | "auth.read"
  | "tenant.read"
  | "billing.read"
  | "billing.write"
  | "ai.invoke"
  | "assets.read"
  | "assets.write"
  | "storage.read"
  | "storage.write"
  | "notifications.send"
  | "observability.read"
  | "integrations.read"
  | "integrations.write"
  | "planner.read"
  | "planner.write"
  | "crm.read"
  | "crm.write";

export type PluginHookName =
  | "beforeCreate"
  | "afterCreate"
  | "beforeUpdate"
  | "afterUpdate"
  | "beforeDelete"
  | "afterDelete"
  | "beforeRender"
  | "afterRender"
  | "beforeExport"
  | "afterExport"
  | "beforeAI"
  | "afterAI";

export interface PluginCapability {
  key: string;
  label: string;
}

export interface PluginPermission {
  scope: PluginPermissionScope;
  granted: boolean;
}

export interface PluginMenu {
  label: string;
  path: string;
  icon?: string;
}

export interface PluginRoute {
  path: string;
  component: string;
}

export interface PluginWidget {
  id: string;
  label: string;
  slot: string;
}

export interface PluginSetting {
  key: string;
  label: string;
  type: "string" | "number" | "boolean" | "select" | "json";
  default?: unknown;
}

export interface PluginMigration {
  version: string;
  script: string;
}

export interface PluginManifest {
  slug: string;
  name: string;
  version: string;
  description?: string;
  author?: string;
  category: PluginCategory;
  capabilities: readonly PluginCapability[];
  permissions: readonly PluginPermissionScope[];
  hooks?: readonly PluginHookName[];
  menu?: readonly PluginMenu[];
  routes?: readonly PluginRoute[];
  widgets?: readonly PluginWidget[];
  settings?: readonly PluginSetting[];
  migrations?: readonly PluginMigration[];
  dependencies?: readonly string[];
  minPlatformVersion?: string;
  rateLimitPerMinute?: number;
  quotaCreditsPerDay?: number;
}

export interface Plugin {
  id: string;
  companyId: string;
  slug: string;
  name: string;
  description: string | null;
  author: string | null;
  category: PluginCategory;
  version: string;
  status: PluginStatus;
  enabled: boolean;
  manifest: PluginManifest | JsonRecord;
  capabilities: readonly PluginCapability[];
  dependencies: readonly string[];
  createdAt: string;
  updatedAt: string;
}

export interface PluginLogEntry {
  id: string;
  pluginId: string | null;
  level: "info" | "warn" | "error" | "debug";
  action: string;
  message: string | null;
  createdAt: string;
}

export interface PluginPermissionRow {
  id: string;
  pluginId: string;
  scope: PluginPermissionScope;
  granted: boolean;
  grantedAt: string | null;
}

export interface PluginUpdateRow {
  id: string;
  pluginId: string;
  fromVersion: string;
  toVersion: string;
  status: "pending" | "applied" | "failed" | "rolled_back";
  scheduledAt: string;
  appliedAt: string | null;
}

export interface PluginMarketplaceItem {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  category: string;
  author: string | null;
  version: string;
  priceCents: number;
  featured: boolean;
  downloads: number;
  rating: number;
}

export interface PluginContext {
  companyId: string;
  userId: string;
  pluginId: string;
  permissions: readonly PluginPermissionScope[];
}

export interface SdkSnapshot {
  plugins: readonly Plugin[];
  logs: readonly PluginLogEntry[];
  permissions: readonly PluginPermissionRow[];
  updates: readonly PluginUpdateRow[];
  marketplace: readonly PluginMarketplaceItem[];
}
