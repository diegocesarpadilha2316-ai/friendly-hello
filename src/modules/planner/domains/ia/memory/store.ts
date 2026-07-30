/**
 * Etapa 10 — armazenamento da memória do projeto.
 *
 * Zero banco, zero migration, zero provider novo: cache em runtime +
 * `localStorage` com chave `dioris.planner.ai.memory.<tenant>.<projeto>`,
 * exatamente o mesmo isolamento da sessão de chat da Etapa 5. Memória
 * nunca é compartilhada entre projetos, empresas ou tenants.
 */
import {
  emptyMemory,
  type MemoryFact,
  type MemoryPending,
  type MemoryTelemetryEntry,
  type ProjectMemory,
} from "./types";

const PREFIX = "dioris.planner.ai.memory";

/** Padrões de segredo que jamais podem entrar na memória. */
const SECRET_RE =
  /(sk-[a-z0-9]|dio_[a-z0-9]|bearer\s|api[_-]?key|secret|token|password|senha\s*[:=]|eyJ[a-z0-9]{6,})/i;

const MAX_ITEMS = 24;
const MAX_VALUE = 160;

export function memoryKey(tenantId: string, projectId: string): string {
  return `${PREFIX}.${tenantId}.${projectId}`;
}

/** Remove qualquer conteúdo sensível e limita o tamanho do texto. */
export function sanitizeValue(value: string): string | null {
  const clean = value.replace(/\s+/g, " ").trim();
  if (!clean) return null;
  if (SECRET_RE.test(clean)) return null;
  return clean.length > MAX_VALUE ? `${clean.slice(0, MAX_VALUE - 1)}…` : clean;
}

const cache = new Map<string, ProjectMemory>();
const listeners = new Map<string, Set<() => void>>();
const telemetry: MemoryTelemetryEntry[] = [];

function emit(key: string) {
  listeners.get(key)?.forEach((fn) => fn());
}

export function subscribeMemory(tenantId: string, projectId: string, fn: () => void): () => void {
  const key = memoryKey(tenantId, projectId);
  const set = listeners.get(key) ?? new Set<() => void>();
  set.add(fn);
  listeners.set(key, set);
  return () => set.delete(fn);
}

function isMemory(value: unknown): value is ProjectMemory {
  const m = value as ProjectMemory | null;
  return !!m && m.version === 1 && Array.isArray(m.materials) && Array.isArray(m.decisions);
}

export function readMemory(
  tenantId: string,
  projectId: string,
  projectName?: string,
): ProjectMemory {
  const key = memoryKey(tenantId, projectId);
  const cached = cache.get(key);
  if (cached) return cached;
  let restored: ProjectMemory | null = null;
  if (typeof window !== "undefined") {
    try {
      const raw = window.localStorage.getItem(key);
      const parsed = raw ? (JSON.parse(raw) as unknown) : null;
      // Guarda de isolamento: memória de outro tenant/projeto é descartada.
      if (isMemory(parsed) && parsed.tenantId === tenantId && parsed.projectId === projectId) {
        restored = parsed;
      }
    } catch {
      restored = null;
    }
  }
  const memory = restored ?? emptyMemory(tenantId, projectId, projectName);
  cache.set(key, memory);
  return memory;
}

export function writeMemory(memory: ProjectMemory): ProjectMemory {
  const key = memoryKey(memory.tenantId, memory.projectId);
  cache.set(key, memory);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.setItem(key, JSON.stringify(memory));
    } catch {
      /* quota/private mode — memória segue válida em runtime */
    }
  }
  emit(key);
  return memory;
}

export function clearMemory(
  tenantId: string,
  projectId: string,
  projectName?: string,
): ProjectMemory {
  const key = memoryKey(tenantId, projectId);
  if (typeof window !== "undefined") {
    try {
      window.localStorage.removeItem(key);
    } catch {
      /* noop */
    }
  }
  const fresh = emptyMemory(tenantId, projectId, projectName);
  cache.set(key, fresh);
  recordMemoryTelemetry({ projectId, reason: "clear", agent: "user", changedKeys: ["*"] });
  emit(key);
  return fresh;
}

/**
 * Substitui (nunca duplica) o fato de mesma chave. Conflito é resolvido
 * pela decisão mais recente: Freijó → Carvalho mantém apenas Carvalho.
 */
export function upsertFacts(
  list: readonly MemoryFact[],
  incoming: readonly MemoryFact[],
): { next: readonly MemoryFact[]; changed: string[] } {
  const map = new Map(list.map((f) => [f.key, f]));
  const changed: string[] = [];
  for (const fact of incoming) {
    const value = sanitizeValue(fact.value);
    if (!value) continue;
    const current = map.get(fact.key);
    if (current && current.value === value) continue;
    map.set(fact.key, { ...fact, value });
    changed.push(fact.key);
  }
  const next = [...map.values()]
    .sort((a, b) => (a.updatedAt < b.updatedAt ? 1 : -1))
    .slice(0, MAX_ITEMS);
  return { next, changed };
}

export function upsertPendings(
  list: readonly MemoryPending[],
  incoming: readonly MemoryPending[],
  resolved: readonly string[] = [],
): { next: readonly MemoryPending[]; changed: string[] } {
  const map = new Map(list.map((p) => [p.kind, p]));
  const changed: string[] = [];
  for (const kind of resolved) {
    if (map.delete(kind as MemoryPending["kind"])) changed.push(`pendencia:${kind}`);
  }
  for (const pending of incoming) {
    if (map.has(pending.kind)) continue;
    map.set(pending.kind, pending);
    changed.push(`pendencia:${pending.kind}`);
  }
  return { next: [...map.values()], changed };
}

export function recordMemoryTelemetry(entry: Omit<MemoryTelemetryEntry, "at">): void {
  telemetry.unshift({ ...entry, at: new Date().toISOString() });
  if (telemetry.length > 50) telemetry.length = 50;
}

/** Telemetria só existe em runtime — nada é persistido nem enviado. */
export function listMemoryTelemetry(projectId?: string): readonly MemoryTelemetryEntry[] {
  return projectId ? telemetry.filter((t) => t.projectId === projectId) : telemetry;
}
