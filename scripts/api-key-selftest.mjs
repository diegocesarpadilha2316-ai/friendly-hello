/**
 * Self-test da implementação canônica de API keys (node scripts/api-key-selftest.mjs).
 * Espelha src/core/api-gateway/key-hash.server.ts — mantenha os dois em sincronia.
 */
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";

const PREFIX_RE = /^(dio|dk)_[a-f0-9]{6,32}$/;
const SECRET_RE = /^[A-Za-z0-9_-]{16,128}$/;
const norm = (s) => s.trim();
const hashApiKey = (s) => createHash("sha256").update(norm(s), "utf8").digest("hex");
const generateApiKey = () => {
  const prefix = `dio_${randomBytes(4).toString("hex")}`;
  const secret = randomBytes(24).toString("base64url");
  return { prefix, secret, full: `${prefix}.${secret}`, keyHash: hashApiKey(secret) };
};
const parseApiKeyToken = (t) => {
  if (!t) return null;
  const p = norm(t).split(".");
  if (p.length !== 2) return null;
  if (!PREFIX_RE.test(p[0]) || !SECRET_RE.test(p[1])) return null;
  return { prefix: p[0], secret: p[1] };
};
const verifyApiKey = (s, h) => {
  if (!h) return false;
  const a = Buffer.from(hashApiKey(s));
  const b = Buffer.from(h);
  return a.length === b.length && timingSafeEqual(a, b);
};

let fail = 0;
const t = (name, cond) => { console.log(`${cond ? "PASS" : "FAIL"}  ${name}`); if (!cond) fail++; };

const k = generateApiKey();
t("gera token no formato dio_xxxxxxxx.<secret>", /^dio_[a-f0-9]{8}\.[A-Za-z0-9_-]{32}$/.test(k.full));
t("prefixo independente do segredo", !k.secret.startsWith(k.prefix.slice(4)));
t("hash determinístico", hashApiKey(k.secret) === hashApiKey(k.secret));
t("hashes diferentes para chaves diferentes", generateApiKey().keyHash !== k.keyHash);
t("extrai prefixo corretamente", parseApiKeyToken(k.full).prefix === k.prefix);
t("verify aceita segredo correto", verifyApiKey(k.secret, k.keyHash));
t("verify rejeita segredo errado", !verifyApiKey(generateApiKey().secret, k.keyHash));
t("rejeita formato inválido (sem ponto)", parseApiKeyToken("diox") === null);
t("rejeita formato inválido (prefixo estranho)", parseApiKeyToken("abc_1234.aaaaaaaaaaaaaaaaaaaa") === null);
t("rejeita segredo curto", parseApiKeyToken("dio_12345678.short") === null);
t("aceita prefixo legado dk_", parseApiKeyToken("dk_abc123.aaaaaaaaaaaaaaaaaaaa") !== null);
t("normalização ignora espaços", hashApiKey(` ${k.secret} `) === k.keyHash);

console.log(fail === 0 ? "\nTodos os testes passaram." : `\n${fail} teste(s) falharam.`);
process.exit(fail === 0 ? 0 : 1);
