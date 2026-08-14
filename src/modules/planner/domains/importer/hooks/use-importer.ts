/**
 * Fase 3.27 — Hook composicional do domínio Importer.
 *
 * Sem stores: mantém apenas estado local do fluxo de importação atual e
 * histórico curto em `localStorage`. Toda mutação persistente do projeto
 * atravessa `updateProject()` do `PlannerEditorProvider`.
 */
import { useCallback, useEffect, useMemo, useState } from "react";
import { usePlannerEditor } from "@/modules/planner/shared";
import {
  detectFormat,
  detectFloorplan,
  importFile,
  toggleLayerLock,
  toggleLayerVisibility,
  validateImport,
  withPreview,
} from "../services";
import type { ImportResult, ImporterHistoryEntry, ImporterLayer, ImporterUnit } from "../types";
import { withOverride } from "../services/scale";
import { unitToMm } from "../services/units";

const HISTORY_KEY = "dioris.planner.importer.history.v1";
const HISTORY_LIMIT = 20;

function readHistory(): ImporterHistoryEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(HISTORY_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as ImporterHistoryEntry[];
    return Array.isArray(parsed) ? parsed.slice(0, HISTORY_LIMIT) : [];
  } catch {
    return [];
  }
}

function writeHistory(list: readonly ImporterHistoryEntry[]) {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(list.slice(0, HISTORY_LIMIT)));
  } catch {
    /* noop */
  }
}

export function useImporter() {
  const { updateProject } = usePlannerEditor();
  const [result, setResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
  const [history, setHistory] = useState<readonly ImporterHistoryEntry[]>(() => readHistory());

  const importFromFile = useCallback(async (file: File) => {
    setLoading(true);
    try {
      const res = await importFile(file);
      const validated: ImportResult = { ...res, warnings: validateImport(res) };
      setResult(validated);
      const entry: ImporterHistoryEntry = {
        id: validated.id,
        filename: validated.filename,
        format: validated.format,
        bytes: validated.bytes,
        entities: validated.entities.length,
        warnings: validated.warnings.length,
        createdAt: validated.createdAt,
      };
      setHistory((prev) => {
        const next = [entry, ...prev.filter((h) => h.id !== entry.id)].slice(0, HISTORY_LIMIT);
        writeHistory(next);
        return next;
      });
      return validated;
    } finally {
      setLoading(false);
    }
  }, []);

  const setUnit = useCallback((unit: ImporterUnit) => {
    setResult((r) => (r ? { ...r, scale: withOverride(r.scale, unit) } : r));
  }, []);

  const setLayerVisible = useCallback((id: string) => {
    setResult((r) => {
      if (!r) return r;
      const layers = toggleLayerVisibility(r.layers, id);
      return withPreview({ ...r, layers });
    });
  }, []);

  const setLayerLocked = useCallback((id: string) => {
    setResult((r) => (r ? { ...r, layers: toggleLayerLock(r.layers, id) } : r));
  }, []);

  const clear = useCallback(() => setResult(null), []);

  /**
   * Anexa o resultado importado ao projeto atual via `updateProject`,
   * preservando Undo/Redo/Autosave/Histórico do PlannerEditorProvider.
   * O patch é conservador: registra apenas o briefing (`notes`) com o
   * relatório determinístico — a materialização geométrica fica a cargo
   * do Editor 2D/3D em passes subsequentes.
   */
  const attachToProject = useCallback(() => {
    if (!result) return;
    const factor = result.scale.overrideUnit
      ? unitToMm(result.scale.overrideUnit)
      : result.scale.factorToMm;
    const fp = detectFloorplan({ ...result, scale: { ...result.scale, factorToMm: factor } });
    const summary =
      `Importação ${result.format.toUpperCase()} · ${result.filename} · ` +
      `${fp.walls.length} paredes · ${fp.openings.length} aberturas · ${fp.floors.length} pisos.`;
    updateProject((p) => ({
      ...p,
      briefing: {
        ...(p.briefing ?? {}),
        notes: p.briefing?.notes ? `${p.briefing.notes}\n${summary}` : summary,
      },
      updatedAt: new Date().toISOString(),
    }));
  }, [result, updateProject]);

  const clearHistory = useCallback(() => {
    writeHistory([]);
    setHistory([]);
  }, []);

  useEffect(() => {
    /* keeps localStorage in sync — no-op guard */
  }, []);

  const layers = useMemo<readonly ImporterLayer[]>(() => result?.layers ?? [], [result]);

  return {
    result,
    loading,
    layers,
    history,
    detectFormat,
    importFromFile,
    setUnit,
    setLayerVisible,
    setLayerLocked,
    attachToProject,
    clear,
    clearHistory,
  };
}
