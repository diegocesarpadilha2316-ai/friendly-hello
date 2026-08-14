/**
 * Etapa 10 — hook de leitura/controle da memória do projeto ativo.
 *
 * Sem provider novo: lê o `PlannerEditorProvider` para saber qual projeto
 * está aberto e o `TenantProvider` para o isolamento por empresa.
 */
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useTenant } from "@/core/providers/TenantProvider";
import { usePlannerEditor } from "@/modules/planner/shared";
import { clearMemory, listMemoryTelemetry, readMemory, subscribeMemory } from "./store";
import { recomputeMemory } from "./service";
import { buildMemoryPromptBlock } from "./summary";
import { emptyMemory } from "./types";
export function useProjectMemory() {
  const editor = usePlannerEditor();
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";
  const project = editor.state.project;
  const projectId = project?.id ?? null;
  const projectName = project?.name;
  const subscribe = useCallback(
    (fn) => (projectId ? subscribeMemory(tenantId, projectId, fn) : () => {}),
    [tenantId, projectId],
  );
  const getSnapshot = useCallback(
    () => (projectId ? readMemory(tenantId, projectId, projectName) : null),
    [tenantId, projectId, projectName],
  );
  const memory = useSyncExternalStore(subscribe, getSnapshot, getSnapshot);
  const value = memory ?? (projectId ? emptyMemory(tenantId, projectId, projectName) : null);
  const promptBlock = useMemo(() => buildMemoryPromptBlock(value), [value]);
  return {
    memory: value,
    promptBlock,
    telemetry: projectId ? listMemoryTelemetry(projectId) : [],
    recompute: useCallback(() => {
      if (projectId) recomputeMemory(tenantId, projectId, projectName);
    }, [tenantId, projectId, projectName]),
    clear: useCallback(() => {
      if (projectId) clearMemory(tenantId, projectId, projectName);
    }, [tenantId, projectId, projectName]),
  };
}
