/**
 * Cabeçalhos de segurança padrão consumidos por servidores/rotas.
 * Reutilizável por API Gateway, rotas públicas e SSR.
 */
import type { SecurityPolicy } from "./types";

export const DEFAULT_CSP =
  "default-src 'self'; img-src 'self' data: https:; style-src 'self' 'unsafe-inline'; script-src 'self'; connect-src 'self' https:; frame-ancestors 'none';";

export function buildSecurityHeaders(
  policy?: Partial<SecurityPolicy>,
): Record<string, string> {
  const csp = policy?.csp ?? DEFAULT_CSP;
  const hsts = policy?.hstsMaxAge ?? 31_536_000;
  const frame = policy?.frameOptions ?? "DENY";
  const cto = policy?.contentTypeOptions ?? "nosniff";
  const ref = policy?.referrerPolicy ?? "strict-origin-when-cross-origin";
  const perms = policy?.permissionsPolicy ?? "camera=(), microphone=(), geolocation=(self)";
  return {
    "Content-Security-Policy": csp,
    "Strict-Transport-Security": `max-age=${hsts}; includeSubDomains`,
    "X-Frame-Options": frame,
    "X-Content-Type-Options": cto,
    "Referrer-Policy": ref,
    "Permissions-Policy": perms,
  };
}

export function newCorrelationId(): string {
  // Compatível com edge/worker (crypto.randomUUID disponível).
  return typeof crypto !== "undefined" && "randomUUID" in crypto
    ? crypto.randomUUID()
    : `cid_${Math.random().toString(36).slice(2)}${Date.now().toString(36)}`;
}