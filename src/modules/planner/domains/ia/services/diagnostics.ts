import { create } from "zustand";
import type { PlanStep } from "../planning/types";

export interface DiagnosticStep {
  id: string;
  name: string;
  status: "pending" | "running" | "success" | "error";
  durationMs?: number;
  error?: string;
  details?: {
    pieceCount?: number;
    renderer?: string;
    familyName?: string;
    moduleCount?: number;
    objectCreated?: boolean;
    interruptionReason?: string;
    fullException?: string;
    itemsInserted?: number;
    projectId?: string;
    roomId?: string;
    furnitureBefore?: number;
    furnitureAfter?: number;
    sceneObjectCount?: number;
    visualValidation?: any;
  };
}

interface DiagnosticState {
  isOpen: boolean;
  activePlanId: string | null;
  steps: DiagnosticStep[];
  setOpen: (open: boolean) => void;
  startPlan: (planId: string) => void;
  updateStep: (id: string, patch: Partial<DiagnosticStep>) => void;
  reset: () => void;
}

export const useDiagnostic = create<DiagnosticState>((set) => ({
  isOpen: false,
  activePlanId: null,
  steps: [],
  setOpen: (isOpen) => set({ isOpen }),
  startPlan: (planId) => set({ activePlanId: planId, steps: [], isOpen: true }),
  updateStep: (id, patch) =>
    set((state) => {
      const exists = state.steps.find((s) => s.id === id);
      if (exists) {
        return {
          steps: state.steps.map((s) => (s.id === id ? { ...s, ...patch } : s)),
        };
      }
      return {
        steps: [...state.steps, { id, name: id, status: "pending", ...patch }],
      };
    }),
  reset: () => set({ activePlanId: null, steps: [], isOpen: false }),
}));

/** Helper para mapear etapas do plano para o diagnóstico */
export function syncPlanToDiagnostic(step: PlanStep, status: "running" | "success" | "error", duration?: number, error?: string) {
  const diag = useDiagnostic.getState();
  
  // Extrair detalhes dos argumentos ou do resultado se disponível
  const details: DiagnosticStep["details"] = {
    renderer: (step.args as any)?.renderer || "standard",
    familyName: (step.args as any)?.family || (step.args as any)?.templateId,
    moduleCount: (step.args as any)?.modules?.length || (step.args as any)?.items?.length,
    pieceCount: step.result?.ok ? (step.result as any).pieceCount : undefined,
    objectCreated: step.result?.ok,
    fullException: error,
  };

  diag.updateStep(step.stepId, {
    name: step.title,
    status,
    durationMs: duration,
    error: error?.split("\n")[0],
    details,
  });
}
