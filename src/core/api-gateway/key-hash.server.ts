import { createHash, randomBytes, timingSafeEqual } from "crypto";

export function generateApiKey(): { prefix: string; secret: string; full: string } {
  const prefix = `dio_${randomBytes(4).toString("hex")}`;
  const secret = randomBytes(24).toString("base64url");
  return { prefix, secret, full: `${prefix}.${secret}` };
}

export function hashApiKey(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function verifyApiKey(secret: string, hash: string): boolean {
  const a = Buffer.from(hashApiKey(secret));
  const b = Buffer.from(hash);
  return a.length === b.length && timingSafeEqual(a, b);
}

export function parseAuthHeader(header: string | null): { prefix: string; secret: string } | null {
  if (!header) return null;
  const token = header.startsWith("Bearer ") ? header.slice(7) : header;
  const [prefix, secret] = token.split(".");
  if (!prefix || !secret) return null;
  return { prefix, secret };
}