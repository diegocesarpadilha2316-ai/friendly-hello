/**
 * Editor Store do Planner (Fase 3.1).
 *
 * Estado local e efêmero do editor: projeto ativo, seleção, histórico
 * de undo/redo, autosave. NÃO é um provider paralelo ao Core — o Core
 * cuida de Auth, Tenant, RBAC, Cache, Billing, IA, Storage, Eventos e
 * Jobs. Aqui vive apenas o estado de edição in-memory específico do
 * Planner (equivalente a um "scene state" de editor).
 *
 * Regras:
 *  - Consumido via `usePlannerEditor()` dentro de rotas do Planner.
 *  - Persistência via `localStorage` até a migration SQL da Fase 3.2.
 *  - Undo/Redo em pilhas limitadas (50 estados).
 */
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useReducer,
  useRef,
  useState,
  type ReactNode,
} from "react";
import { useServerFn } from "@tanstack/react-start";
import { useTenant } from "@/core/providers/TenantProvider";
import type {
  PlannerProject,
  PlannerProjectVersion,
} from "../types/project";
import type { PlannerProjectId } from "../types";
import { createProject, ensureProjectRoomShells } from "../factories/project";
import { loadProject as loadLocalProject } from "../persistence/local-store";
import {
  loadProjectSnapshot,
  saveProjectSnapshot,
  listProjectVersions,
  createProjectVersion,
  loadProjectVersion,
  type JsonObject,
} from "@/lib/planner-snapshots.functions";

const HISTORY_LIMIT = 50;

interface EditorState {
  project: PlannerProject | null;
  past: readonly PlannerProject[];
  future: readonly PlannerProject[];
  selectedEnvironmentId: string | null;
  selectedRoomId: string | null;
  dirty: boolean;
  lastSavedAt: string | null;
}

type EditorAction =
  | { type: "load"; project: PlannerProject | null }
  | { type: "update"; project: PlannerProject }
  | { type: "select"; environmentId?: string | null; roomId?: string | null }
  | { type: "undo" }
  | { type: "redo" }
  | { type: "saved"; at: string };

function bump(project: PlannerProject): PlannerProject {
  return {
    ...project,
    updatedAt: new Date().toISOString(),
    version: project.version + 1,
  };
}

function reducer(state: EditorState, action: EditorAction): EditorState {
  switch (action.type) {
    case "load":
      return {
        project: action.project,
        past: [],
        future: [],
        selectedEnvironmentId: action.project?.environments[0]?.id ?? null,
        selectedRoomId: action.project?.environments[0]?.rooms[0]?.id ?? null,
        dirty: false,
        lastSavedAt: action.project?.updatedAt ?? null,
      };
    case "update": {
      if (!state.project) return state;
      const next = bump(action.project);
      const past = [...state.past, state.project].slice(-HISTORY_LIMIT);
      return { ...state, project: next, past, future: [], dirty: true };
    }
    case "select":
      return {
        ...state,
        selectedEnvironmentId:
          action.environmentId !== undefined ? action.environmentId : state.selectedEnvironmentId,
        selectedRoomId:
          action.roomId !== undefined ? action.roomId : state.selectedRoomId,
      };
    case "undo": {
      if (!state.project || state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      return {
        ...state,
        project: previous,
        past: state.past.slice(0, -1),
        future: [state.project, ...state.future].slice(0, HISTORY_LIMIT),
        dirty: true,
      };
    }
    case "redo": {
      if (!state.project || state.future.length === 0) return state;
      const next = state.future[0];
      return {
        ...state,
        project: next,
        past: [...state.past, state.project].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        dirty: true,
      };
    }
    case "saved":
      return { ...state, dirty: false, lastSavedAt: action.at };
    default:
      return state;
  }
}

interface EditorContextValue {
  state: EditorState;
  loadProject: (project: PlannerProject) => void;
  loadProjectById: (projectId: string) => void;
  updateProject: (updater: (p: PlannerProject) => PlannerProject) => void;
  select: (patch: { environmentId?: string | null; roomId?: string | null }) => void;
  undo: () => void;
  redo: () => void;
  saveNow: () => void;
  snapshotVersion: (label: string) => void;
  restoreVersion: (versionId: string) => Promise<void>;
  versions: readonly PlannerProjectVersion[];
  canUndo: boolean;
  canRedo: boolean;
}

const EditorContext = createContext<EditorContextValue | null>(null);

const initialState: EditorState = {
  project: null,
  past: [],
  future: [],
  selectedEnvironmentId: null,
  selectedRoomId: null,
  dirty: false,
  lastSavedAt: null,
};

export function PlannerEditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [versions, setVersions] = useState<readonly PlannerProjectVersion[]>([]);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";

  const loadSnapshotFn = useServerFn(loadProjectSnapshot);
  const saveSnapshotFn = useServerFn(saveProjectSnapshot);
  const listVersionsFn = useServerFn(listProjectVersions);
  const createVersionFn = useServerFn(createProjectVersion);
  const loadVersionFn = useServerFn(loadProjectVersion);

  const refreshVersions = useCallback(
    async (projectId: string) => {
      try {
        const rows = await listVersionsFn({ data: { projectId } });
        setVersions(
          rows.map((r) => ({
            id: r.id,
            projectId: r.projectId as PlannerProjectId,
            version: r.version,
            label: r.label,
            createdAt: r.createdAt,
            snapshot: null as unknown as PlannerProject, // carregado sob demanda
          })),
        );
      } catch {
        setVersions([]);
      }
    },
    [listVersionsFn],
  );

  const loadProject = useCallback((project: PlannerProject) => {
    const normalized = ensureProjectRoomShells(project);
    dispatch({ type: "load", project: normalized });
    void refreshVersions(normalized.id);
  }, [refreshVersions]);

  const persist = useCallback(
    async (project: PlannerProject) => {
      try {
        await saveSnapshotFn({
          data: {
            id: project.id,
            snapshot: project as unknown as JsonObject,
            version: project.version,
            name: project.name,
            client: project.client ?? null,
          },
        });
        dispatch({ type: "saved", at: new Date().toISOString() });
      } catch (err) {
        // silencia; próxima edição tentará novamente
        console.error("[planner] autosave falhou", err);
      }
    },
    [saveSnapshotFn],
  );

  // Autosave — debounced 800ms após qualquer mudança "dirty".
  useEffect(() => {
    if (!state.dirty || !state.project) return;
    if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    const project = state.project;
    autosaveTimer.current = setTimeout(() => persist(project), 800);
    return () => {
      if (autosaveTimer.current) clearTimeout(autosaveTimer.current);
    };
  }, [state.dirty, state.project, persist]);

  const loadProjectById = useCallback(
    async (projectId: string) => {
      try {
        const result = await loadSnapshotFn({ data: { id: projectId } });
        if (!result || !result.meta) {
          const local = loadLocalProject(tenantId, projectId);
          if (local) {
            const normalizedLocal = ensureProjectRoomShells(local);
            dispatch({ type: "load", project: normalizedLocal });
            void refreshVersions(normalizedLocal.id);
            return;
          }
          dispatch({ type: "load", project: null });
          setVersions([]);
          return;
        }
        let project: PlannerProject;
        if (result.snapshot) {
          project = {
            ...(result.snapshot as unknown as PlannerProject),
            id: result.meta.id as PlannerProject["id"],
            name: result.meta.name,
            client: result.meta.client ?? undefined,
            version: result.meta.version,
            updatedAt: result.meta.updatedAt,
          };
        } else {
          const local = loadLocalProject(tenantId, projectId);
          if (local) {
            const normalizedLocal = ensureProjectRoomShells(local);
            dispatch({ type: "load", project: normalizedLocal });
            void refreshVersions(normalizedLocal.id);
            return;
          }
          // Metadados existem, mas snapshot ainda não foi persistido: semeia via factory.
          project = createProject({
            tenantId: result.meta.companyId,
            ownerId: result.meta.ownerId,
            name: result.meta.name,
            client: result.meta.client ?? undefined,
          });
          project = {
            ...project,
            id: result.meta.id as PlannerProject["id"],
            createdAt: result.meta.createdAt,
            updatedAt: result.meta.updatedAt,
            version: result.meta.version,
          };
        }
        const normalizedProject = ensureProjectRoomShells(project);
        dispatch({ type: "load", project: normalizedProject });
        void refreshVersions(normalizedProject.id);
      } catch (err) {
        console.error("[planner] load project falhou", err);
        const local = loadLocalProject(tenantId, projectId);
        if (local) {
          const normalizedLocal = ensureProjectRoomShells(local);
          dispatch({ type: "load", project: normalizedLocal });
          void refreshVersions(normalizedLocal.id);
          return;
        }
        dispatch({ type: "load", project: null });
        setVersions([]);
      }
    },
    [loadSnapshotFn, refreshVersions, tenantId],
  );

  const updateProject = useCallback(
    (updater: (p: PlannerProject) => PlannerProject) => {
      if (!state.project) return;
      dispatch({ type: "update", project: updater(state.project) });
    },
    [state.project],
  );

  const select = useCallback(
    (patch: { environmentId?: string | null; roomId?: string | null }) => {
      dispatch({ type: "select", ...patch });
    },
    [],
  );

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  const saveNow = useCallback(() => {
    if (state.project) void persist(state.project);
  }, [state.project, persist]);

  const snapshotVersion = useCallback(
    async (label: string) => {
      const project = state.project;
      if (!project) return;
      try {
        await persist(project);
        await createVersionFn({
          data: {
            id: `${project.id}-v${project.version}-${Date.now()}`,
            projectId: project.id,
            version: project.version,
            label,
            snapshot: project as unknown as JsonObject,
          },
        });
        await refreshVersions(project.id);
      } catch (err) {
        console.error("[planner] snapshot version falhou", err);
      }
    },
    [state.project, persist, createVersionFn, refreshVersions],
  );

  const restoreVersion = useCallback(
    async (versionId: string) => {
      const current = state.project;
      if (!current) return;
      try {
        const row = await loadVersionFn({ data: { id: versionId } });
        if (!row?.snapshot) return;
        const restored: PlannerProject = {
          ...(row.snapshot as unknown as PlannerProject),
          id: current.id,
          // versão avança para não sobrescrever a versão restaurada
          version: current.version + 1,
          updatedAt: new Date().toISOString(),
        };
        dispatch({ type: "update", project: restored });
        await persist(restored);
      } catch (err) {
        console.error("[planner] restore version falhou", err);
      }
    },
    [state.project, loadVersionFn, persist],
  );

  // Atalhos de teclado — Ctrl/Cmd+Z / Shift+Z / Ctrl+S.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const handler = (e: KeyboardEvent) => {
      const mod = e.ctrlKey || e.metaKey;
      if (!mod) return;
      const key = e.key.toLowerCase();
      if (key === "z" && !e.shiftKey) {
        e.preventDefault();
        undo();
      } else if ((key === "z" && e.shiftKey) || key === "y") {
        e.preventDefault();
        redo();
      } else if (key === "s") {
        e.preventDefault();
        saveNow();
      } else if (e.code === "Space" || key === " ") {
        // Ctrl/Cmd+Space → foco na IA Copiloto do Planner.
        e.preventDefault();
        window.dispatchEvent(new CustomEvent("planner:focus-ai"));
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [undo, redo, saveNow]);

  const value = useMemo<EditorContextValue>(
    () => ({
      state,
      loadProject,
      loadProjectById,
      updateProject,
      select,
      undo,
      redo,
      saveNow,
      snapshotVersion,
      restoreVersion,
      versions,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
    }),
    [state, loadProject, loadProjectById, updateProject, select, undo, redo, saveNow, snapshotVersion, restoreVersion, versions],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function usePlannerEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("usePlannerEditor deve ser usado dentro de <PlannerEditorProvider>.");
  return ctx;
}