// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type JsonRecord = Record<string, any>;

export interface PlatformSettings {
  name: string;
  logoUrl: string | null;
  faviconUrl: string | null;
  theme: string;
  primaryColor: string | null;
  defaultLocale: string;
  defaultTimezone: string;
  defaultCurrency: string;
  metadata: JsonRecord;
  updatedAt: string;
}

export interface CompanySettings {
  companyId: string;
  displayName: string | null;
  theme: string;
  locale: string;
  timezone: string;
  currency: string;
  dateFormat: string;
  numberFormat: string;
  units: string;
  metadata: JsonRecord;
  updatedAt: string;
}

export interface FeatureFlag {
  id: string;
  companyId: string | null;
  key: string;
  enabled: boolean;
  scope: "global" | "company" | "user";
  module: string | null;
  description: string | null;
  rules: JsonRecord;
  updatedAt: string;
}

export interface ApiKey {
  id: string;
  companyId: string;
  name: string;
  prefix: string;
  scopes: readonly string[];
  lastUsedAt: string | null;
  expiresAt: string | null;
  /** Coluna canônica `api_keys.status` — 'revoked' substitui o antigo `revoked_at`. */
  status: "active" | "revoked" | "expired";
  createdAt: string;
}

export interface Integration {
  id: string;
  companyId: string;
  provider: string;
  category: string;
  enabled: boolean;
  status: "healthy" | "degraded" | "down" | "unknown";
  config: JsonRecord;
  lastTestedAt: string | null;
  lastError: string | null;
  updatedAt: string;
}

export interface Branding {
  companyId: string;
  logoUrl: string | null;
  iconUrl: string | null;
  palette: JsonRecord;
  typography: JsonRecord;
  cssVariables: JsonRecord;
  updatedAt: string;
}

export interface Localization {
  companyId: string;
  defaultLocale: string;
  supportedLocales: readonly string[];
  translations: JsonRecord;
  updatedAt: string;
}

export interface SecuritySettings {
  companyId: string;
  require2fa: boolean;
  sessionTtlSeconds: number;
  jwtTtlSeconds: number;
  passwordMinLength: number;
  passwordRequireSymbol: boolean;
  rateLimitPerMin: number;
  allowedOrigins: readonly string[];
  ipAllowlist: readonly string[];
  updatedAt: string;
}

export interface BackupSettings {
  companyId: string;
  enabled: boolean;
  frequency: "hourly" | "daily" | "weekly" | "monthly";
  retentionDays: number;
  storageProvider: string;
  lastRunAt: string | null;
  lastStatus: string | null;
  metadata: JsonRecord;
  updatedAt: string;
}

export interface SystemPreference {
  id: string;
  companyId: string;
  userId: string | null;
  key: string;
  value: JsonRecord;
  updatedAt: string;
}

export interface ConfigurationSnapshot {
  platform: PlatformSettings | null;
  company: CompanySettings | null;
  branding: Branding | null;
  localization: Localization | null;
  security: SecuritySettings | null;
  backup: BackupSettings | null;
  flags: readonly FeatureFlag[];
  integrations: readonly Integration[];
  apiKeys: readonly ApiKey[];
}
