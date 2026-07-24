/**
 * useConfigurator — hook único da Fase 3.16.
 *
 * 100% derivado do PlannerEditorProvider. Toda mutação passa por
 * updateProject() para manter Undo, Redo, Autosave, Histórico e
 * Versionamento sem introduzir provider/store novo.
 */
import { useCallback, useMemo, useState } from "react";
import { usePlannerEditor } from "@/modules/planner/shared";
import { useAuth } from "@/core/providers";
import {
  ALIGN_ACTIONS,
  AI_PROVIDER_STUBS,
  CONFIGURATOR_LAYERS,
  SNAP_TARGETS,
  WALK_MODES,
  buildConfiguratorSchema,
  buildHistory,
  commandToPatch,
  countByLayer,
  duplicateNode,
  findNode,
  listModules,
  mirrorNode,
  parseConfiguratorCommand,
  patchAllModules,
  patchNodes,
  rotateNode,
} from "../services";
import type {
  ConfiguratorCommand,
  ConfiguratorLayerId,
  ConfiguratorSnapshot,
  WalkMode,
} from "../types";

interface HiddenLocked {
  hidden: Record<string, boolean>;
  locked: Record<string, boolean>;
  layerVisible: Record<ConfiguratorLayerId, boolean>;
  layerLocked: Record<ConfiguratorLayerId, boolean>;
}

const DEFAULT_LAYER_STATE: HiddenLocked["layerVisible"] = {
  estrutura: true, portas: true, gavetas: true, ferragens: true,
  vidros: true, espelhos: true, led: true, decoracao: true, producao: true,
};

export function useConfigurator() {
  const editor = usePlannerEditor();
  const auth = useAuth();
  const project = editor.state.project;
  const modules = useMemo(() => listModules(project), [project]);

  const [selection, setSelection] = useState<readonly string[]>([]);
  const [walkMode, setWalkMode] = useState<WalkMode>("orbit");
  const [state, setState] = useState<HiddenLocked>({
    hidden: {},
    locked: {},
    layerVisible: { ...DEFAULT_LAYER_STATE },
    layerLocked: { estrutura: false, portas: false, gavetas: false, ferragens: false, vidros: false, espelhos: false, led: false, decoracao: false, producao: false },
  });

  const activeNode = useMemo(() => {
    if (selection.length !== 1 || !project) return null;
    return findNode(project, selection[0])?.node ?? null;
  }, [selection, project]);

  const schema = useMemo(
    () => (activeNode ? buildConfiguratorSchema(activeNode) : null),
    [activeNode],
  );

  const selectionNodes = useMemo(() => {
    if (!project) return [];
    return selection
      .map((id) => findNode(project, id)?.node)
      .filter((n): n is NonNullable<typeof n> => !!n);
  }, [selection, project]);

  const layersWithMeta = useMemo(() => {
    const counts = countByLayer(modules);
    return CONFIGURATOR_LAYERS.map((l) => ({
      ...l,
      count: counts[l.id],
      visible: state.layerVisible[l.id],
      locked: state.layerLocked[l.id],
    }));
  }, [modules, state.layerVisible, state.layerLocked]);

  const history = useMemo(
    () => buildHistory(editor.state.past, project, auth.session?.user?.email ?? "usuário"),
    [editor.state.past, project, auth.session?.user?.email],
  );

  const snapshot: ConfiguratorSnapshot = {
    selection: selectionNodes,
    modules,
    schema,
    layers: layersWithMeta,
    history,
    walk: WALK_MODES,
    snapping: SNAP_TARGETS,
    align: ALIGN_ACTIONS,
    providers: AI_PROVIDER_STUBS,
    project,
  };

  // ── Actions (todas via updateProject) ────────────────────────────

  const applyPatchToSelection = useCallback(
    (patch: Record<string, string | number | boolean | null>) => {
      if (selection.length === 0) return;
      editor.updateProject((p) => patchNodes(p, selection, patch));
    },
    [editor, selection],
  );

  const applyPatchToAll = useCallback(
    (patch: Record<string, string | number | boolean | null>) => {
      editor.updateProject((p) => patchAllModules(p, patch));
    },
    [editor],
  );

  const setField = useCallback(
    (key: string, value: string | number | boolean) => {
      applyPatchToSelection({ [key]: value });
    },
    [applyPatchToSelection],
  );

  const runCommand = useCallback(
    (raw: string): ConfiguratorCommand | null => {
      const cmd = parseConfiguratorCommand(raw);
      if (!cmd) return null;
      const patch = commandToPatch(cmd);
      if (selection.length > 0) applyPatchToSelection(patch);
      else applyPatchToAll(patch);
      return cmd;
    },
    [applyPatchToSelection, applyPatchToAll, selection.length],
  );

  const duplicate = useCallback(() => {
    if (selection.length !== 1) return;
    const id = selection[0];
    editor.updateProject((p) => duplicateNode(p, id));
  }, [editor, selection]);

  const mirror = useCallback(() => {
    if (selection.length !== 1) return;
    const id = selection[0];
    editor.updateProject((p) => mirrorNode(p, id));
  }, [editor, selection]);

  const rotate = useCallback(
    (deg: number) => {
      if (selection.length !== 1) return;
      const id = selection[0];
      editor.updateProject((p) => rotateNode(p, id, deg));
    },
    [editor, selection],
  );

  const openAllDoors = useCallback(() => applyPatchToAll({ doorsOpenPct: 100 }), [applyPatchToAll]);
  const closeAllDoors = useCallback(() => applyPatchToAll({ doorsOpenPct: 0 }), [applyPatchToAll]);
  const openAllDrawers = useCallback(() => applyPatchToAll({ drawersOpenPct: 100 }), [applyPatchToAll]);
  const closeAllDrawers = useCallback(() => applyPatchToAll({ drawersOpenPct: 0 }), [applyPatchToAll]);
  const openPercent = useCallback(
    (pct: number, target: "doors" | "drawers") => {
      const clamped = Math.max(0, Math.min(100, pct));
      applyPatchToAll(target === "drawers" ? { drawersOpenPct: clamped } : { doorsOpenPct: clamped });
    },
    [applyPatchToAll],
  );

  const toggleHidden = useCallback((id: string) => {
    setState((s) => ({ ...s, hidden: { ...s.hidden, [id]: !s.hidden[id] } }));
  }, []);
  const toggleLocked = useCallback((id: string) => {
    setState((s) => ({ ...s, locked: { ...s.locked, [id]: !s.locked[id] } }));
  }, []);
  const toggleLayerVisible = useCallback((id: ConfiguratorLayerId) => {
    setState((s) => ({ ...s, layerVisible: { ...s.layerVisible, [id]: !s.layerVisible[id] } }));
  }, []);
  const toggleLayerLocked = useCallback((id: ConfiguratorLayerId) => {
    setState((s) => ({ ...s, layerLocked: { ...s.layerLocked, [id]: !s.layerLocked[id] } }));
  }, []);

  const selectOne = useCallback((id: string) => setSelection([id]), []);
  const toggleSelection = useCallback((id: string) => {
    setSelection((cur) => (cur.includes(id) ? cur.filter((c) => c !== id) : [...cur, id]));
  }, []);
  const clearSelection = useCallback(() => setSelection([]), []);

  return {
    snapshot,
    selection,
    walkMode,
    hiddenIds: state.hidden,
    lockedIds: state.locked,
    selectOne,
    toggleSelection,
    clearSelection,
    setWalkMode,
    setField,
    applyPatchToSelection,
    applyPatchToAll,
    runCommand,
    duplicate,
    mirror,
    rotate,
    openAllDoors,
    closeAllDoors,
    openAllDrawers,
    closeAllDrawers,
    openPercent,
    toggleHidden,
    toggleLocked,
    toggleLayerVisible,
    toggleLayerLocked,
    undo: editor.undo,
    redo: editor.redo,
    canUndo: editor.canUndo,
    canRedo: editor.canRedo,
  };
}

export type UseConfiguratorResult = ReturnType<typeof useConfigurator>;