/**
 * Helpers OAuth2/OIDC/PKCE. Sem side-effects — apenas montagem/troca.
 * Todos os fluxos passam por aqui; providers não implementam OAuth próprio.
 */
export interface OAuthClientConfig {
  clientId: string;
  clientSecret?: string;
  authorizationUrl: string;
  tokenUrl: string;
  redirectUri: string;
  scope?: string;
}

export interface OAuthTokenSet {
  accessToken: string;
  refreshToken?: string;
  expiresAt?: string;
  scope?: string;
  tokenType?: string;
}

function base64url(bytes: Uint8Array): string {
  let str = "";
  bytes.forEach((b) => (str += String.fromCharCode(b)));
  return btoa(str).replace(/=+$/g, "").replace(/\+/g, "-").replace(/\//g, "_");
}

export async function generatePkcePair(): Promise<{ verifier: string; challenge: string }> {
  const verifierBytes = new Uint8Array(32);
  crypto.getRandomValues(verifierBytes);
  const verifier = base64url(verifierBytes);
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(verifier));
  return { verifier, challenge: base64url(new Uint8Array(digest)) };
}

export function buildAuthorizationUrl(
  cfg: OAuthClientConfig,
  state: string,
  codeChallenge?: string,
): string {
  const u = new URL(cfg.authorizationUrl);
  u.searchParams.set("client_id", cfg.clientId);
  u.searchParams.set("redirect_uri", cfg.redirectUri);
  u.searchParams.set("response_type", "code");
  u.searchParams.set("state", state);
  if (cfg.scope) u.searchParams.set("scope", cfg.scope);
  if (codeChallenge) {
    u.searchParams.set("code_challenge", codeChallenge);
    u.searchParams.set("code_challenge_method", "S256");
  }
  return u.toString();
}

export async function exchangeCodeForTokens(
  cfg: OAuthClientConfig,
  code: string,
  codeVerifier?: string,
): Promise<OAuthTokenSet> {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    code,
    client_id: cfg.clientId,
    redirect_uri: cfg.redirectUri,
  });
  if (cfg.clientSecret) body.set("client_secret", cfg.clientSecret);
  if (codeVerifier) body.set("code_verifier", codeVerifier);
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!res.ok) throw new Error(`OAuth token exchange failed: ${res.status}`);
  return normalizeTokenResponse(await res.json());
}

export async function refreshTokens(
  cfg: OAuthClientConfig,
  refreshToken: string,
): Promise<OAuthTokenSet> {
  const body = new URLSearchParams({
    grant_type: "refresh_token",
    refresh_token: refreshToken,
    client_id: cfg.clientId,
  });
  if (cfg.clientSecret) body.set("client_secret", cfg.clientSecret);
  const res = await fetch(cfg.tokenUrl, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded", Accept: "application/json" },
    body,
  });
  if (!res.ok) throw new Error(`OAuth refresh failed: ${res.status}`);
  return normalizeTokenResponse(await res.json());
}

function normalizeTokenResponse(json: Record<string, unknown>): OAuthTokenSet {
  const expiresIn = typeof json.expires_in === "number" ? json.expires_in : undefined;
  return {
    accessToken: String(json.access_token ?? ""),
    refreshToken: json.refresh_token ? String(json.refresh_token) : undefined,
    scope: json.scope ? String(json.scope) : undefined,
    tokenType: json.token_type ? String(json.token_type) : "Bearer",
    expiresAt: expiresIn ? new Date(Date.now() + expiresIn * 1000).toISOString() : undefined,
  };
}