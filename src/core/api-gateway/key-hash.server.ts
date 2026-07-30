/**
 * IMPLEMENTAÇÃO CANÔNICA E ÚNICA DAS API KEYS DA DIORIS.
 *
 * Formato canônico do token completo:  `dio_<8 hex>.<32 chars base64url>`
 *   - `prefix`  → `dio_<8 hex>` (público, armazenado em api_keys.prefix)
 *   - `secret`  → 24 bytes aleatórios em base64url (nunca persistido)
 *   - `key_hash` → SHA-256 hex do secret (única coluna de hash no banco)
 *
 * Nenhum outro arquivo deve gerar chaves, calcular SHA-256 de API keys
 * ou fazer parsing de prefixo. Sempre importe daqui.
 */
import { createHash, randomBytes, timingSafeEqual } from "crypto";

/** Prefixo canônico para toda chave nova. */
export const API_KEY_PREFIX_NAMESPACE = "dio";
/** Prefixos legados aceitos na validação (compatibilidade de leitura). */
export const API_KEY_LEGACY_NAMESPACES = ["dk"] as const;

const PREFIX_RE = /^(dio|dk)_[a-f0-9]{6,32}$/;
const SECRET_RE = /^[A-Za-z0-9_-]{16,128}$/;

export interface GeneratedApiKey {
  /** Parte pública, salva em api_keys.prefix. */
  prefix: string;
  /** Segredo puro — só existe em memória; nunca logar nem persistir. */
  secret: string;
  /** Token completo entregue ao usuário UMA única vez. */
  full: string;
  /** SHA-256 hex do segredo, salvo em api_keys.key_hash. */
  keyHash: string;
}

/** Gera uma nova API key com entropia criptograficamente segura (server-side). */
export function generateApiKey(): GeneratedApiKey {
  const prefix = `${API_KEY_PREFIX_NAMESPACE}_${randomBytes(4).toString("hex")}`;
  const secret = randomBytes(24).toString("base64url");
  return { prefix, secret, full: `${prefix}.${secret}`, keyHash: hashApiKey(secret) };
}

/** Normalização idêntica na criação e na validação. */
export function normalizeApiKeySecret(secret: string): string {
  return secret.trim();
}

/** SHA-256 hex do segredo normalizado. Único algoritmo de hash de API key. */
export function hashApiKey(secret: string): string {
  return createHash("sha256").update(normalizeApiKeySecret(secret), "utf8").digest("hex");
}

/** Comparação em tempo constante entre o segredo apresentado e o key_hash armazenado. */
export function verifyApiKey(secret: string, hash: string): boolean {
  if (!hash) return false;
  const a = Buffer.from(hashApiKey(secret));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}

/** Valida o formato do token completo sem tocar no banco. */
export function isValidApiKeyFormat(token: string): boolean {
  return parseApiKeyToken(token) !== null;
}

/** Extrai `{ prefix, secret }` de um token completo. Aceita prefixos legados. */
export function parseApiKeyToken(token: string | null | undefined): {
  prefix: string;
  secret: string;
} | null {
  if (!token) return null;
  const parts = normalizeApiKeySecret(token).split(".");
  if (parts.length !== 2) return null;
  const [prefix, secret] = parts;
  if (!PREFIX_RE.test(prefix) || !SECRET_RE.test(secret)) return null;
  return { prefix, secret };
}

/** Somente o prefixo público de um token completo (para lookup no banco). */
export function extractApiKeyPrefix(token: string | null | undefined): string | null {
  return parseApiKeyToken(token)?.prefix ?? null;
}

/**
 * Lê a credencial de `Authorization: Bearer <token>` ou do header `x-api-key`.
 */
export function parseAuthHeader(
  header: string | null,
  apiKeyHeader?: string | null,
): { prefix: string; secret: string } | null {
  const raw = header?.startsWith("Bearer ") ? header.slice(7) : (header ?? null);
  return parseApiKeyToken(raw) ?? parseApiKeyToken(apiKeyHeader ?? null);
}