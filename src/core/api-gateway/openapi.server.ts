import type { ApiEndpoint } from "./types";

export function buildOpenApi(endpoints: readonly ApiEndpoint[]): Record<string, unknown> {
  const paths: Record<string, Record<string, unknown>> = {};
  for (const e of endpoints) {
    if (e.deprecated) continue;
    const path = `/${e.version}${e.path.startsWith("/") ? e.path : `/${e.path}`}`;
    paths[path] ??= {};
    paths[path][e.method.toLowerCase()] = {
      summary: e.summary ?? undefined,
      tags: [e.module],
      security: e.public ? [] : [{ apiKey: [] }],
      responses: { "200": { description: "OK" } },
    };
  }
  return {
    openapi: "3.1.0",
    info: { title: "Dioris Hub API", version: "1.0.0" },
    servers: [{ url: "/api/public" }],
    components: {
      securitySchemes: { apiKey: { type: "http", scheme: "bearer", bearerFormat: "DIO" } },
    },
    paths,
  };
}

export function toYaml(obj: unknown, indent = 0): string {
  const pad = "  ".repeat(indent);
  if (obj === null || obj === undefined) return "null";
  if (typeof obj === "string") return JSON.stringify(obj);
  if (typeof obj === "number" || typeof obj === "boolean") return String(obj);
  if (Array.isArray(obj)) {
    if (!obj.length) return "[]";
    return obj.map((v) => `\n${pad}- ${toYaml(v, indent + 1).replace(/^\n?\s*/, "")}`).join("");
  }
  const rec = obj as Record<string, unknown>;
  const keys = Object.keys(rec);
  if (!keys.length) return "{}";
  return keys
    .map((k) => {
      const v = rec[k];
      const isObj = v && typeof v === "object";
      return `\n${pad}${k}:${isObj ? "" : " "}${toYaml(v, indent + 1)}`;
    })
    .join("");
}