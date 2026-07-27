/**
 * Persistência local do Planner (Fase 3.1).
 *
 * Enquanto a migration SQL da fase 3.2 não é aplicada, os projetos são
 * armazenados em `localStorage` escopados por tenant + usuário. Assim
 * que a tabela oficial existir, os serviços do domínio passam a ler/gravar
 * no Supabase mantendo exatamente a mesma shape (`PlannerProject`).
 *
 * Regras:
 *  - Sem acesso a Core aqui — este arquivo é browser-only e usado apenas
 *    pelo Editor Store (client).
 *  - Chaves versionadas para permitir migração automática futura.
 */
import type { PlannerProject, PlannerProjectVersion } from "../types/project";

const STORAGE_VERSION = "v1";
const PROJECTS_KEY = (tenantId: string) =>
  `dioris:planner:${STORAGE_VERSION}:${tenantId}:projects`;
const VERSIONS_KEY = (tenantId: string, projectId: string) =>
  `dioris:planner:${STORAGE_VERSION}:${tenantId}:versions:${projectId}`;

function isBrowser(): boolean {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

function safeParse<T>(raw: string | null, fallback: T): T {
  if (!raw) return fallback;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

export function loadProjects(tenantId: string): PlannerProject[] {
  if (!isBrowser()) return [];
  return safeParse<PlannerProject[]>(
    window.localStorage.getItem(PROJECTS_KEY(tenantId)),
    [],
  );
}

export function saveProjects(tenantId: string, projects: readonly PlannerProject[]): void {
  if (!isBrowser()) return;
  window.localStorage.setItem(PROJECTS_KEY(tenantId), JSON.stringify(projects));
}

export function loadProject(tenantId: string, id: string): PlannerProject | null {
  return loadProjects(tenantId).find((p) => p.id === id) ?? null;
}

/**
 * Fallback: procura o projeto em qualquer tenant salvo no localStorage.
 * Útil quando o tenant ativo demora a resolver ou mudou entre sessões e o
 * projeto foi criado sob outro escopo (evita "Projeto não encontrado"
 * quando o dado está localmente disponível).
 */
export function loadProjectAnywhere(id: string): { tenantId: string; project: PlannerProject } | null {
  if (!isBrowser()) return null;
  const prefix = `dioris:planner:${STORAGE_VERSION}:`;
  const suffix = ":projects";
  for (let i = 0; i < window.localStorage.length; i++) {
    const key = window.localStorage.key(i);
    if (!key || !key.startsWith(prefix) || !key.endsWith(suffix)) continue;
    const tenantId = key.slice(prefix.length, key.length - suffix.length);
    const list = safeParse<PlannerProject[]>(window.localStorage.getItem(key), []);
    const hit = list.find((p) => p.id === id);
    if (hit) return { tenantId, project: hit };
  }
  return null;
}

export function upsertProject(tenantId: string, project: PlannerProject): void {
  const list = loadProjects(tenantId);
  const idx = list.findIndex((p) => p.id === project.id);
  if (idx === -1) list.push(project);
  else list[idx] = project;
  saveProjects(tenantId, list);
}

export function removeProject(tenantId: string, id: string): void {
  saveProjects(tenantId, loadProjects(tenantId).filter((p) => p.id !== id));
  if (isBrowser()) window.localStorage.removeItem(VERSIONS_KEY(tenantId, id));
}

export function loadVersions(tenantId: string, projectId: string): PlannerProjectVersion[] {
  if (!isBrowser()) return [];
  return safeParse<PlannerProjectVersion[]>(
    window.localStorage.getItem(VERSIONS_KEY(tenantId, projectId)),
    [],
  );
}

export function appendVersion(tenantId: string, version: PlannerProjectVersion): void {
  if (!isBrowser()) return;
  const list = loadVersions(tenantId, version.projectId);
  list.unshift(version);
  // manter até 50 versões locais
  const trimmed = list.slice(0, 50);
  window.localStorage.setItem(
    VERSIONS_KEY(tenantId, version.projectId),
    JSON.stringify(trimmed),
  );
}