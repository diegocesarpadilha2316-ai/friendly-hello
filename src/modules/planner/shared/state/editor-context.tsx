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
import { loadProject as loadLocalProject, upsertProject as upsertLocalProject } from "../persistence/local-store";
import {
  loadProjectSnapshot,
  saveProjectSnapshot,
  listProjectVersions,
  createProjectVersion,
  loadProjectVersion,
  type JsonObject,
} from "@/lib/planner-snapshots.functions";
import { getPlannerEventBus, bridgeToWindow } from "../events";

const HISTORY_LIMIT = 50;
// Janela de coalescência do histórico: alterações consecutivas no mesmo
// nó dentro deste intervalo mesclam com o último estado do past — evita
// entulhar Undo com micro-passos de arrastar/redimensionar.
const HISTORY_COALESCE_MS = 250;

interface EditorState {
  project: PlannerProject | null;
  past: readonly PlannerProject[];
  future: readonly PlannerProject[];
  selectedEnvironmentId: string | null;
  selectedRoomId: string | null;
  selectedNodeId: string | null;
  dirty: boolean;
  lastSavedAt: string | null;
  lastEditAt: number;
}

type EditorAction =
  | { type: "load"; project: PlannerProject | null }
  | { type: "update"; project: PlannerProject }
  | { type: "select"; environmentId?: string | null; roomId?: string | null }
  | { type: "select-node"; nodeId: string | null }
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
        selectedNodeId: null,
        dirty: false,
        lastSavedAt: action.project?.updatedAt ?? null,
        lastEditAt: 0,
      };
    case "update": {
      if (!state.project) return state;
      const next = bump(action.project);
      const now = Date.now();
      // Coalesce: se a última edição foi há menos de HISTORY_COALESCE_MS,
      // não empilha um novo estado — mantém o snapshot anterior no past.
      const shouldCoalesce = now - state.lastEditAt < HISTORY_COALESCE_MS && state.past.length > 0;
      const past = shouldCoalesce
        ? state.past
        : [...state.past, state.project].slice(-HISTORY_LIMIT);
      // Invariante de seleção: se o nó selecionado desapareceu no update
      // (foi excluído, ou o cômodo foi trocado), limpa o `selectedNodeId`.
      // Sem isso, Inspector e Scene3D operam sobre referência morta.
      const selectionSurvives = nodeExists(next, state.selectedNodeId);
      return {
        ...state,
        project: next,
        past,
        future: [],
        dirty: true,
        lastEditAt: now,
        selectedNodeId: selectionSurvives ? state.selectedNodeId : null,
      };
    }
    case "select":
      return {
        ...state,
        selectedEnvironmentId:
          action.environmentId !== undefined ? action.environmentId : state.selectedEnvironmentId,
        selectedRoomId:
          action.roomId !== undefined ? action.roomId : state.selectedRoomId,
        // Trocar de cômodo/ambiente limpa a seleção fina.
        selectedNodeId:
          action.environmentId !== undefined || action.roomId !== undefined
            ? null
            : state.selectedNodeId,
      };
    case "select-node":
      return { ...state, selectedNodeId: action.nodeId };
    case "undo": {
      if (!state.project || state.past.length === 0) return state;
      const previous = state.past[state.past.length - 1];
      const stillExists = previous && nodeExists(previous, state.selectedNodeId);
      return {
        ...state,
        project: previous,
        past: state.past.slice(0, -1),
        future: [state.project, ...state.future].slice(0, HISTORY_LIMIT),
        dirty: true,
        selectedNodeId: stillExists ? state.selectedNodeId : null,
        lastEditAt: 0,
      };
    }
    case "redo": {
      if (!state.project || state.future.length === 0) return state;
      const next = state.future[0];
      const stillExists = nodeExists(next, state.selectedNodeId);
      return {
        ...state,
        project: next,
        past: [...state.past, state.project].slice(-HISTORY_LIMIT),
        future: state.future.slice(1),
        dirty: true,
        selectedNodeId: stillExists ? state.selectedNodeId : null,
        lastEditAt: 0,
      };
    }
    case "saved":
      return { ...state, dirty: false, lastSavedAt: action.at };
    default:
      return state;
  }
}

/**
 * Verifica se um `nodeId` (móvel/parede/abertura/laje) ainda existe no
 * projeto após undo/redo. Sem essa verificação, o Inspector renderiza um
 * item fantasma e a próxima edição estoura em referência inexistente.
 */
function nodeExists(project: PlannerProject, nodeId: string | null): boolean {
  if (!nodeId) return false;
  for (const env of project.environments) {
    for (const room of env.rooms) {
      if (room.nodes && Object.prototype.hasOwnProperty.call(room.nodes, nodeId)) return true;
    }
  }
  return false;
}

interface EditorContextValue {
  state: EditorState;
  loadProject: (project: PlannerProject) => void;
  loadProjectById: (projectId: string) => void;
  updateProject: (updater: (p: PlannerProject) => PlannerProject) => void;
  select: (patch: { environmentId?: string | null; roomId?: string | null }) => void;
  /**
   * Seleção fina de um nó da cena (móvel, parede, porta…). A IA consome
   * `selectedNodeId` para operar tools sobre o item ativo sem exigir que
   * o usuário informe qual é — quando o usuário clica no viewport ou na
   * árvore, este é o canal único de seleção.
   */
  selectNode: (nodeId: string | null) => void;
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
  selectedNodeId: null,
  dirty: false,
  lastSavedAt: null,
  lastEditAt: 0,
};

export function PlannerEditorProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, initialState);
  const [versions, setVersions] = useState<readonly PlannerProjectVersion[]>([]);
  const autosaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";

  // Rastreadores para o efeito de emissão do bus. Guardamos versão e
  // projectId da última emissão para diferenciar update / load / save
  // sem espionar as `dispatches` diretamente (o reducer é puro).
  const lastEmittedRef = useRef<{
    projectId: string | null;
    version: number;
    lastSavedAt: string | null;
    selectedNodeId: string | null;
    pastLen: number;
    futureLen: number;
  }>({
    projectId: null,
    version: -1,
    lastSavedAt: null,
    selectedNodeId: null,
    pastLen: 0,
    futureLen: 0,
  });

  const loadSnapshotFn = useServerFn(loadProjectSnapshot);
  const saveSnapshotFn = useServerFn(saveProjectSnapshot);
  const listVersionsFn = useServerFn(listProjectVersions);
  const createVersionFn = useServerFn(createProjectVersion);
  const loadVersionFn = useServerFn(loadProjectVersion);

  // Emissão centralizada no bus. Rodar aqui (fora do reducer) garante que
  // o commit do React já ocorreu — subscribers leem o estado consistente.
  useEffect(() => {
    const bus = getPlannerEventBus();
    const last = lastEmittedRef.current;
    const project = state.project;

    // Sem projeto ativo: nada a emitir.
    if (!project) {
      lastEmittedRef.current = {
        projectId: null,
        version: -1,
        lastSavedAt: null,
        selectedNodeId: null,
        pastLen: 0,
        futureLen: 0,
      };
      return;
    }

    const projectChanged = last.projectId !== project.id;
    const versionChanged = last.version !== project.version;

    if (projectChanged) {
      const payload = { projectId: project.id, version: project.version };
      bus.emit("project:loaded", payload);
      bridgeToWindow("project:loaded", payload);
    } else if (versionChanged) {
      // Diferencia undo/redo de edição normal pela variação das pilhas.
      const undone = state.past.length < last.pastLen && state.future.length > last.futureLen;
      const redone = state.past.length > last.pastLen && state.future.length < last.futureLen;
      const payload = { projectId: project.id, version: project.version };
      if (undone) {
        bus.emit("project:undone", payload);
        bridgeToWindow("project:undone", payload);
      } else if (redone) {
        bus.emit("project:redone", payload);
        bridgeToWindow("project:redone", payload);
      }
      bus.emit("project:updated", { ...payload, reason: undone ? "undo" : redone ? "redo" : "edit" });
      bridgeToWindow("project:updated", { ...payload, reason: undone ? "undo" : redone ? "redo" : "edit" });
    }

    if (state.lastSavedAt && state.lastSavedAt !== last.lastSavedAt) {
      const payload = { projectId: project.id, version: project.version, at: state.lastSavedAt };
      bus.emit("project:saved", payload);
      bridgeToWindow("project:saved", payload);
    }

    if (state.selectedNodeId !== last.selectedNodeId) {
      const payload = { projectId: project.id, nodeId: state.selectedNodeId };
      bus.emit("project:node-selected", payload);
      bridgeToWindow("project:node-selected", payload);
    }

    lastEmittedRef.current = {
      projectId: project.id,
      version: project.version,
      lastSavedAt: state.lastSavedAt,
      selectedNodeId: state.selectedNodeId,
      pastLen: state.past.length,
      futureLen: state.future.length,
    };
  }, [
    state.project,
    state.lastSavedAt,
    state.selectedNodeId,
    state.past.length,
    state.future.length,
  ]);

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
      upsertLocalProject(tenantId, project);
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
    [saveSnapshotFn, tenantId],
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

  // Flush do autosave em eventos críticos: aba escondida, navegação ou
  // fechamento. Garante que a última edição não se perca no debounce.
  useEffect(() => {
    if (typeof window === "undefined") return;
    const flushLocal = () => {
      if (!state.dirty || !state.project) return;
      // Escrita local é síncrona — atende ao "salvar antes de fechar".
      // A gravação remota é oportunista (pode falhar em beforeunload).
      try {
        upsertLocalProject(tenantId, state.project);
      } catch {
        /* localStorage cheio: ignora */
      }
    };
    const onHidden = () => {
      if (document.visibilityState === "hidden") flushLocal();
    };
    window.addEventListener("beforeunload", flushLocal);
    document.addEventListener("visibilitychange", onHidden);
    return () => {
      window.removeEventListener("beforeunload", flushLocal);
      document.removeEventListener("visibilitychange", onHidden);
    };
  }, [state.dirty, state.project, tenantId]);

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
          const local = loadLocalProject(tenantId, projectId);
          if (local) {
            const localTime = Date.parse(local.updatedAt || "");
            const serverTime = Date.parse(project.updatedAt || "");
            if (local.version > project.version || localTime > serverTime) {
              project = local;
            }
          }
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

  const selectNode = useCallback((nodeId: string | null) => {
    dispatch({ type: "select-node", nodeId });
  }, []);

  const undo = useCallback(() => dispatch({ type: "undo" }), []);
  const redo = useCallback(() => dispatch({ type: "redo" }), []);

  const saveNow = useCallback(() => {
    // Cancela debounce pendente para não gerar POST duplicado.
    if (autosaveTimer.current) {
      clearTimeout(autosaveTimer.current);
      autosaveTimer.current = null;
    }
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
      selectNode,
      undo,
      redo,
      saveNow,
      snapshotVersion,
      restoreVersion,
      versions,
      canUndo: state.past.length > 0,
      canRedo: state.future.length > 0,
    }),
    [state, loadProject, loadProjectById, updateProject, select, selectNode, undo, redo, saveNow, snapshotVersion, restoreVersion, versions],
  );

  return <EditorContext.Provider value={value}>{children}</EditorContext.Provider>;
}

export function usePlannerEditor(): EditorContextValue {
  const ctx = useContext(EditorContext);
  if (!ctx) throw new Error("usePlannerEditor deve ser usado dentro de <PlannerEditorProvider>.");
  return ctx;
}