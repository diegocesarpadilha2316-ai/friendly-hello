/**
 * Etapa 9 — Preferências de cena (render) por sessão.
 *
 * LIMITAÇÃO DOCUMENTADA: o `PlannerProject` não possui campo de cena e
 * criar um exigiria alteração de schema/migration, o que esta etapa
 * proíbe. Portanto o preset/câmera/iluminação escolhidos pela IA vivem
 * em memória (por projeto) e são publicados no `PlannerEventBus` para o
 * viewport reagir. Nada disso é persistido no snapshot do projeto.
 */
export type RenderQuality = "rascunho" | "baixa" | "media" | "alta" | "ultra";

export interface ScenePrefs {
  preset: string;
  quality: RenderQuality;
  cameraFov: number;
  cameraHeightMm: number;
  lighting: "natural" | "cenica" | "noturna" | "estudio";
  exposure: number;
  updatedAt: number;
}

const DEFAULTS: ScenePrefs = {
  preset: "media",
  quality: "media",
  cameraFov: 45,
  cameraHeightMm: 1600,
  lighting: "natural",
  exposure: 1,
  updatedAt: 0,
};

const prefsByProject = new Map<string, ScenePrefs>();

export function getScenePrefs(projectId: string): ScenePrefs {
  return prefsByProject.get(projectId) ?? { ...DEFAULTS };
}

export function setScenePrefs(projectId: string, patch: Partial<ScenePrefs>): ScenePrefs {
  const next: ScenePrefs = {
    ...getScenePrefs(projectId),
    ...patch,
    updatedAt: Date.now(),
  };
  prefsByProject.set(projectId, next);
  return next;
}

export function clearScenePrefs(): void {
  prefsByProject.clear();
}