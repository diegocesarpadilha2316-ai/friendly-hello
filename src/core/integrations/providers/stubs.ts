import { DEFAULT_RATE_LIMIT, DEFAULT_RETRY_POLICY } from "../config";
import type {
  IntegrationAuthType,
  IntegrationCategory,
  IntegrationProviderDescriptor,
} from "../types";
import { defineProvider, type IntegrationProvider } from "./base";

type Def = readonly [
  id: string,
  name: string,
  category: IntegrationCategory,
  authType: IntegrationAuthType,
];

const PROVIDER_DEFS: readonly Def[] = [
  ["supabase", "Supabase", "storage", "api_key"],
  ["github", "GitHub", "devops", "oauth2"],
  ["vercel", "Vercel", "devops", "api_key"],
  ["cloudflare", "Cloudflare", "devops", "api_key"],
  ["stripe", "Stripe", "payments", "api_key"],
  ["mercadopago", "Mercado Pago", "payments", "oauth2"],
  ["asaas", "Asaas", "payments", "api_key"],
  ["openai", "OpenAI", "ai", "api_key"],
  ["gemini", "Google Gemini", "ai", "api_key"],
  ["anthropic", "Anthropic", "ai", "api_key"],
  ["lovable", "Lovable AI", "ai", "api_key"],
  ["openrouter", "OpenRouter", "ai", "api_key"],
  ["google_drive", "Google Drive", "storage", "oauth2"],
  ["dropbox", "Dropbox", "storage", "oauth2"],
  ["onedrive", "OneDrive", "storage", "oauth2"],
  ["smtp", "SMTP", "messaging", "basic"],
  ["whatsapp", "WhatsApp", "messaging", "api_key"],
  ["discord", "Discord", "messaging", "bearer"],
  ["slack", "Slack", "messaging", "oauth2"],
  ["telegram", "Telegram", "messaging", "api_key"],
  ["teams", "Microsoft Teams", "messaging", "oauth2"],
  ["facebook", "Facebook", "social", "oauth2"],
  ["instagram", "Instagram", "social", "oauth2"],
  ["tiktok", "TikTok", "social", "oauth2"],
  ["youtube", "YouTube", "social", "oauth2"],
  ["mercadolivre", "Mercado Livre", "ecommerce", "oauth2"],
  ["shopee", "Shopee", "ecommerce", "oauth2"],
  ["amazon", "Amazon", "ecommerce", "api_key"],
  ["magalu", "Magalu", "ecommerce", "api_key"],
  ["tiny", "Tiny ERP", "erp", "api_key"],
  ["bling", "Bling ERP", "erp", "api_key"],
  ["contaazul", "Conta Azul", "erp", "oauth2"],
  ["nuvemshop", "Nuvemshop", "ecommerce", "oauth2"],
  ["shopify", "Shopify", "ecommerce", "oauth2"],
  ["woocommerce", "WooCommerce", "ecommerce", "api_key"],
  ["wordpress", "WordPress", "cms", "basic"],
];

export const PROVIDER_CATALOG: readonly IntegrationProviderDescriptor[] = PROVIDER_DEFS.map(
  ([id, name, category, authType]) => ({
    id,
    name,
    category,
    authType,
    version: "1.0.0",
    capabilities: [],
    rateLimit: DEFAULT_RATE_LIMIT,
    retryPolicy: DEFAULT_RETRY_POLICY,
  }),
);

export const PROVIDER_STUBS: readonly IntegrationProvider[] = PROVIDER_CATALOG.map(defineProvider);
