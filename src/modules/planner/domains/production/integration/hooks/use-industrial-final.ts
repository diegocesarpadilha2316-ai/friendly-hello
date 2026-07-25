/**
 * Fase 3.32 — Hook composicional que amarra o bundle industrial ao
 * PlannerEditorProvider. Zero estado global, apenas memoização.
 */
import { useCallback, useMemo } from "react";
import { useTenant } from "@/core/providers/TenantProvider";
import { usePlannerEditor } from "@/modules/planner/shared/state/editor-context";
import { loadRules } from "@/modules/planner/shared/engineering/company-rules";
import { answerFromBundle } from "../ai-hooks";
import { buildIndustrialBundle } from "../industrial-builder";
import { downloadBundle } from "../exports";
import type { FinalAiAnswer, FinalExportFormat, IndustrialBundle } from "../types";

export interface UseIndustrialFinalResult {
  readonly hasProject: boolean;
  readonly isEmpty: boolean;
  readonly bundle: IndustrialBundle | null;
  readonly ask: (prompt: string) => FinalAiAnswer | null;
  readonly download: (format: FinalExportFormat) => void;
}

export function useIndustrialFinal(): UseIndustrialFinalResult {
  const { state } = usePlannerEditor();
  const { activeCompany } = useTenant();
  const tenantId = activeCompany?.id ?? "anonymous";

  const bundle = useMemo<IndustrialBundle | null>(() => {
    const project = state.project;
    if (!project) return null;
    const rules = loadRules(tenantId);
    return buildIndustrialBundle(project, rules, { tenantId });
  }, [state.project, tenantId]);

  const ask = useCallback(
    (prompt: string) => (bundle ? answerFromBundle(prompt, bundle) : null),
    [bundle],
  );
  const download = useCallback(
    (format: FinalExportFormat) => {
      if (bundle) downloadBundle(format, bundle);
    },
    [bundle],
  );

  return {
    hasProject: Boolean(state.project),
    isEmpty: !bundle || bundle.production.parts.length === 0,
    bundle,
    ask,
    download,
  };
}