import type {
  ApiKey,
  BackupSettings,
  Branding,
  CompanySettings,
  FeatureFlag,
  Integration,
  JsonRecord,
  Localization,
  PlatformSettings,
  SecuritySettings,
  SystemPreference,
} from "./types";

export const mapPlatform = (r: Record<string, unknown>): PlatformSettings => ({
  name: String(r.name ?? "Dioris Hub"),
  logoUrl: (r.logo_url as string) ?? null,
  faviconUrl: (r.favicon_url as string) ?? null,
  theme: String(r.theme ?? "system"),
  primaryColor: (r.primary_color as string) ?? null,
  defaultLocale: String(r.default_locale ?? "pt-BR"),
  defaultTimezone: String(r.default_timezone ?? "America/Sao_Paulo"),
  defaultCurrency: String(r.default_currency ?? "BRL"),
  metadata: (r.metadata as JsonRecord) ?? {},
  updatedAt: String(r.updated_at ?? r.created_at ?? new Date().toISOString()),
});

export const mapCompany = (r: Record<string, unknown>): CompanySettings => ({
  companyId: String(r.company_id),
  displayName: (r.display_name as string) ?? null,
  theme: String(r.theme ?? "system"),
  locale: String(r.locale ?? "pt-BR"),
  timezone: String(r.timezone ?? "America/Sao_Paulo"),
  currency: String(r.currency ?? "BRL"),
  dateFormat: String(r.date_format ?? "dd/MM/yyyy"),
  numberFormat: String(r.number_format ?? "pt-BR"),
  units: String(r.units ?? "metric"),
  metadata: (r.metadata as JsonRecord) ?? {},
  updatedAt: String(r.updated_at ?? new Date().toISOString()),
});

export const mapFlag = (r: Record<string, unknown>): FeatureFlag => ({
  id: String(r.id),
  companyId: (r.company_id as string) ?? null,
  key: String(r.key),
  enabled: Boolean(r.enabled),
  scope: (r.scope as FeatureFlag["scope"]) ?? "company",
  module: (r.module as string) ?? null,
  description: (r.description as string) ?? null,
  rules: (r.rules as JsonRecord) ?? {},
  updatedAt: String(r.updated_at ?? r.created_at ?? new Date().toISOString()),
});

export const mapApiKey = (r: Record<string, unknown>): ApiKey => ({
  id: String(r.id),
  companyId: String(r.company_id),
  name: String(r.name),
  prefix: String(r.prefix),
  scopes: ((r.scopes as string[]) ?? []) as readonly string[],
  lastUsedAt: (r.last_used_at as string) ?? null,
  expiresAt: (r.expires_at as string) ?? null,
  revokedAt: (r.revoked_at as string) ?? null,
  createdAt: String(r.created_at),
});

export const mapIntegration = (r: Record<string, unknown>): Integration => ({
  id: String(r.id),
  companyId: String(r.company_id),
  provider: String(r.provider),
  category: String(r.category ?? "generic"),
  enabled: Boolean(r.enabled),
  status: (r.status as Integration["status"]) ?? "unknown",
  config: (r.config as JsonRecord) ?? {},
  lastTestedAt: (r.last_tested_at as string) ?? null,
  lastError: (r.last_error as string) ?? null,
  updatedAt: String(r.updated_at ?? new Date().toISOString()),
});

export const mapBranding = (r: Record<string, unknown>): Branding => ({
  companyId: String(r.company_id),
  logoUrl: (r.logo_url as string) ?? null,
  iconUrl: (r.icon_url as string) ?? null,
  palette: (r.palette as JsonRecord) ?? {},
  typography: (r.typography as JsonRecord) ?? {},
  cssVariables: (r.css_variables as JsonRecord) ?? {},
  updatedAt: String(r.updated_at ?? new Date().toISOString()),
});

export const mapLocalization = (r: Record<string, unknown>): Localization => ({
  companyId: String(r.company_id),
  defaultLocale: String(r.default_locale ?? "pt-BR"),
  supportedLocales: ((r.supported_locales as string[]) ?? ["pt-BR"]) as readonly string[],
  translations: (r.translations as JsonRecord) ?? {},
  updatedAt: String(r.updated_at ?? new Date().toISOString()),
});

export const mapSecurity = (r: Record<string, unknown>): SecuritySettings => ({
  companyId: String(r.company_id),
  require2fa: Boolean(r.require_2fa),
  sessionTtlSeconds: Number(r.session_ttl_seconds ?? 604800),
  jwtTtlSeconds: Number(r.jwt_ttl_seconds ?? 3600),
  passwordMinLength: Number(r.password_min_length ?? 8),
  passwordRequireSymbol: Boolean(r.password_require_symbol),
  rateLimitPerMin: Number(r.rate_limit_per_min ?? 120),
  allowedOrigins: ((r.allowed_origins as string[]) ?? []) as readonly string[],
  ipAllowlist: ((r.ip_allowlist as string[]) ?? []) as readonly string[],
  updatedAt: String(r.updated_at ?? new Date().toISOString()),
});

export const mapBackup = (r: Record<string, unknown>): BackupSettings => ({
  companyId: String(r.company_id),
  enabled: Boolean(r.enabled),
  frequency: (r.frequency as BackupSettings["frequency"]) ?? "daily",
  retentionDays: Number(r.retention_days ?? 30),
  storageProvider: String(r.storage_provider ?? "supabase"),
  lastRunAt: (r.last_run_at as string) ?? null,
  lastStatus: (r.last_status as string) ?? null,
  metadata: (r.metadata as JsonRecord) ?? {},
  updatedAt: String(r.updated_at ?? new Date().toISOString()),
});

export const mapSystemPref = (r: Record<string, unknown>): SystemPreference => ({
  id: String(r.id),
  companyId: String(r.company_id),
  userId: (r.user_id as string) ?? null,
  key: String(r.key),
  value: (r.value as JsonRecord) ?? {},
  updatedAt: String(r.updated_at ?? new Date().toISOString()),
});